import { SHARED_JS } from "./shared";

const MAIN_JS = String.raw`
  var $ = function (id) { return document.getElementById(id); };
  var all = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  function readJson(id) {
    var el = $(id);
    if (!el) return null;
    try { return JSON.parse(el.textContent || "null"); } catch (_e) { return null; }
  }
  function pressGroup(btns, attr, value) {
    btns.forEach(function (b) {
      var on = b.getAttribute(attr) === value;
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  // ---------- Section 1: compare chart ----------
  var cmp = readJson("rt-compare-json");
  var cmpEl = $("rt-compare-chart");
  var cmpState = { metric: "median", cohort: "GRANTED" };
  var cmpMetricBtns = all("[data-cmp-metric]");
  var cmpCohortBtns = all("[data-cmp-cohort]");
  function drawCompare() {
    if (!cmp || !cmpEl) return;
    var rows = (cmp[cmpState.cohort] || []).map(function (r) {
      var total = cmpState.metric === "p90" ? r.p90 : r.median;
      return {
        id: r.id, label: r.label, note: r.note, total: total,
        gov: r.gov, app: r.app, int: r.int,
        mark: cmpState.cohort === "GRANTED" ? r.limit : null,
        markLabel: r.limit ? r.limit + "-day legal limit" : ""
      };
    });
    cmpEl.innerHTML = RT.renderBars(rows, { empty: "No applications in this group have been traced yet." });
    var cap = $("rt-compare-caption");
    if (cap) {
      cap.textContent = (cmpState.metric === "p90"
        ? "Bar length is the wait that 9 in 10 applications beat — the slowest tenth took longer."
        : "Bar length is the typical (median) wait.") +
        (cmpState.cohort === "PENDING_ACTIVE" ? " For applications still pending, it is the time they have waited so far." : "") +
        " Colours show the average share of that time each side held the file.";
    }
  }
  cmpMetricBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      cmpState.metric = b.getAttribute("data-cmp-metric");
      pressGroup(cmpMetricBtns, "data-cmp-metric", cmpState.metric);
      drawCompare();
    });
  });
  cmpCohortBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      cmpState.cohort = b.getAttribute("data-cmp-cohort");
      pressGroup(cmpCohortBtns, "data-cmp-cohort", cmpState.cohort);
      drawCompare();
    });
  });

  // ---------- Section 3a: rounds of questions ----------
  var rounds = readJson("rt-rounds-json");
  var roundsEl = $("rt-rounds-chart");
  var roundBtns = all("[data-rounds]");
  roundBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var k = b.getAttribute("data-rounds");
      pressGroup(roundBtns, "data-rounds", k);
      if (rounds && roundsEl) roundsEl.innerHTML = RT.renderBars(rounds[k] || [], { empty: "No applications in this group yet." });
    });
  });

  // ---------- Section 3c: desk tabs ----------
  var deskBtns = all("[data-desk-track]");
  deskBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var k = b.getAttribute("data-desk-track");
      pressGroup(deskBtns, "data-desk-track", k);
      all("[data-desk-panel]").forEach(function (p) { p.hidden = p.getAttribute("data-desk-panel") !== k; });
    });
  });

  // ---------- Section 4: state table ----------
  var stTable = $("rt-state-table");
  if (stTable) {
    var stBody = stTable.tBodies[0];
    var stQ = $("rt-state-q");
    var stCount = $("rt-state-count");
    var filterStates = function () {
      var q = ((stQ && stQ.value) || "").trim().toLowerCase();
      var shown = 0;
      Array.prototype.forEach.call(stBody.rows, function (tr) {
        var ok = !q || (tr.getAttribute("data-state") || "").toLowerCase().indexOf(q) > -1;
        tr.hidden = !ok;
        if (ok) shown++;
      });
      if (stCount) stCount.textContent = "Showing " + shown + " of " + stBody.rows.length + " states and union territories";
    };
    if (stQ) stQ.addEventListener("input", filterStates);
    all("th[data-sort] button", stTable).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var th = btn.parentNode;
        var idx = th.cellIndex;
        var kind = th.getAttribute("data-sort");
        var asc = th.getAttribute("aria-sort") === "descending" ? true : th.getAttribute("aria-sort") === "ascending" ? false : kind === "text";
        all("th[data-sort]", stTable).forEach(function (h) { h.removeAttribute("aria-sort"); });
        th.setAttribute("aria-sort", asc ? "ascending" : "descending");
        var rows = Array.prototype.slice.call(stBody.rows);
        rows.sort(function (a, b) {
          var va = a.cells[idx] ? a.cells[idx].getAttribute("data-val") : "";
          var vb = b.cells[idx] ? b.cells[idx].getAttribute("data-val") : "";
          var ea = va === null || va === "", eb = vb === null || vb === "";
          if (ea && eb) return 0;
          if (ea) return 1;
          if (eb) return -1;
          if (kind === "num") return asc ? Number(va) - Number(vb) : Number(vb) - Number(va);
          return asc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
        });
        rows.forEach(function (r) { stBody.appendChild(r); });
      });
    });
  }

  // ---------- Section 2: trace an application ----------
  var root = $("trace");
  var heroForm = $("rt-hero-form");
  var heroQ = $("rt-hero-q");
  var qEl = $("rt-q");
  if (heroForm && qEl) {
    heroForm.addEventListener("submit", function (e) {
      e.preventDefault();
      qEl.value = (heroQ && heroQ.value) || "";
      apply(true);
      if (root) root.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  if (!root) return;

  var listEl = $("rt-list");
  var countEl = $("rt-count");
  var moreBtn = $("rt-more");
  var stateSel = $("rt-state");
  var resetBtn = $("rt-reset");
  var detail = $("rt-trace-detail");
  var sectorBtns = all("[data-sector]");
  var presetBtns = all("[data-preset]");
  var state = { sector: "", preset: "" };
  var active = detail ? detail.getAttribute("data-initial-proposal") || "" : "";
  var PAGE = 12, limit = PAGE;
  var rows = [], filtered = [], cache = {}, shards = {}, index = null;

  function decode(raw) {
    var lk = index.lookups;
    return {
      proposal_no: raw[0], project_name: raw[1], proponent: raw[2],
      state: lk.states[raw[4]] || "", sector: lk.sectors[raw[5]] || "", sub_sector: lk.sub_sectors[raw[6]] || "",
      clearance: lk.clearances[raw[7]] || "", authority: lk.authorities[raw[8]] || "", cohort: lk.cohorts[raw[9]] || "",
      status: raw[10], is_terminal: raw[11], filing_year: raw[12], wall_days: raw[13], gov_days: raw[14],
      applicant_days: raw[15], interlock_days: raw[16], eds_rounds: raw[17] || 0, ads_rounds: raw[18] || 0,
      moefcc_dur: raw[19], shard: raw[20], tags: raw[21] || []
    };
  }
  function matchPreset(r, p) {
    if (!p) return true;
    if (p === "rounds3") return r.eds_rounds + r.ads_rounds >= 3;
    if (p === "clock") return r.tags.indexOf("clock_reset") > -1 || (r.moefcc_dur != null && r.gov_days - r.moefcc_dur > 1);
    if (p === "forest_loop") return r.tags.indexOf("intragov_pingpong") > -1;
    if (p === "minister") return r.tags.indexOf("minister_desk") > -1;
    return true;
  }
  function syncUrl() {
    if (!window.history || !window.history.replaceState) return;
    var p = new URLSearchParams();
    if (active) p.set("proposal", active);
    if (qEl && qEl.value.trim()) p.set("q", qEl.value.trim());
    if (state.sector) p.set("sector", state.sector);
    if (stateSel && stateSel.value) p.set("state", stateSel.value);
    if (state.preset) p.set("story", state.preset);
    var qs = p.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : "") + window.location.hash);
  }
  function draw() {
    if (!listEl) return;
    var page = filtered.slice(0, limit);
    listEl.innerHTML = page.length
      ? page.map(function (r) { return RT.renderItem(r, r.proposal_no === active); }).join("")
      : '<li class="rt-empty">No applications match. Try another word, or clear the filters.</li>';
    if (countEl) countEl.textContent = RT.int(filtered.length) + (filtered.length === 1 ? " application" : " applications");
    if (moreBtn) moreBtn.hidden = filtered.length <= limit;
  }
  function apply(resetLimit) {
    if (!index) return;
    if (resetLimit) limit = PAGE;
    var q = ((qEl && qEl.value) || "").trim().toLowerCase();
    var st = (stateSel && stateSel.value) || "";
    filtered = rows.filter(function (r) {
      if (state.sector && r.sector !== state.sector) return false;
      if (st && r.state !== st) return false;
      if (!matchPreset(r, state.preset)) return false;
      if (q) {
        var hay = (r.proposal_no + " " + r.project_name + " " + r.proponent + " " + r.state + " " + r.sector + " " + RT.sub(r.sub_sector) + " " + RT.clr(r.clearance)).toLowerCase();
        var words = q.split(/\s+/);
        for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) === -1) return false;
      }
      return true;
    });
    draw();
    syncUrl();
  }
  function load(pno) {
    if (cache[pno]) return Promise.resolve(cache[pno]);
    var row = rows.find(function (r) { return r.proposal_no === pno; });
    var file = (row && row.shard) || "shard_00.json";
    if (!shards[file]) {
      shards[file] = fetch("/redtape/data/traces/" + file)
        .then(function (res) { if (!res.ok) throw new Error("shard"); return res.json(); })
        .then(function (d) { var m = (d && d.proposals) || {}; Object.keys(m).forEach(function (k) { cache[k] = m[k]; }); });
    }
    return shards[file].then(function () { return cache[pno] || null; });
  }
  function open(pno, scroll) {
    if (!pno) return;
    active = pno;
    draw();
    syncUrl();
    load(pno).then(function (t) {
      if (!t || !detail) return;
      detail.innerHTML = RT.renderTrace(t);
      if (scroll && window.matchMedia("(max-width: 900px)").matches) detail.scrollIntoView({ behavior: "smooth", block: "start" });
    }).catch(function () {});
  }

  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest ? e.target.closest("[data-open-proposal]") : null;
    if (!b) return;
    e.preventDefault();
    open(b.getAttribute("data-open-proposal"), true);
    if (b.tagName === "A" && root) root.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  sectorBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      state.sector = b.getAttribute("data-sector") || "";
      pressGroup(sectorBtns, "data-sector", state.sector);
      apply(true);
    });
  });
  presetBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var p = b.getAttribute("data-preset") || "";
      state.preset = state.preset === p ? "" : p;
      pressGroup(presetBtns, "data-preset", state.preset);
      apply(true);
    });
  });
  if (qEl) qEl.addEventListener("input", function () { apply(true); });
  if (stateSel) stateSel.addEventListener("change", function () { apply(true); });
  if (moreBtn) moreBtn.addEventListener("click", function () { limit += PAGE; draw(); });
  if (resetBtn) resetBtn.addEventListener("click", function () {
    if (qEl) qEl.value = "";
    if (stateSel) stateSel.value = "";
    state.sector = ""; state.preset = "";
    pressGroup(sectorBtns, "data-sector", "");
    pressGroup(presetBtns, "data-preset", "__none__");
    apply(true);
  });

  Promise.all([
    fetch("/redtape/data/traces_index.json").then(function (r) { return r.json(); }),
    fetch("/redtape/data/traces/featured.json").then(function (r) { return r.ok ? r.json() : { proposals: {} }; }).catch(function () { return { proposals: {} }; })
  ]).then(function (res) {
    index = res[0];
    var feat = (res[1] && res[1].proposals) || {};
    Object.keys(feat).forEach(function (k) { cache[k] = feat[k]; });
    rows = (index.rows || []).map(decode);
    var featuredOrder = index.featured_proposal_nos || [];
    rows.sort(function (a, b) {
      var fa = featuredOrder.indexOf(a.proposal_no), fb = featuredOrder.indexOf(b.proposal_no);
      if (fa === -1) fa = 1e9; if (fb === -1) fb = 1e9;
      return fa - fb || (b.wall_days || 0) - (a.wall_days || 0);
    });
    var params = new URLSearchParams(window.location.search);
    if (qEl && params.get("q")) { qEl.value = params.get("q"); if (heroQ) heroQ.value = params.get("q"); }
    if (stateSel && params.get("state")) stateSel.value = params.get("state");
    if (params.get("sector")) { state.sector = params.get("sector"); pressGroup(sectorBtns, "data-sector", state.sector); }
    if (params.get("story")) { state.preset = params.get("story"); pressGroup(presetBtns, "data-preset", state.preset); }
    apply(true);
    root.setAttribute("data-explorer-ready", "1");
    if (params.get("proposal")) open(params.get("proposal"), false);
  }).catch(function () {});
`;

export const REDTAPE_CLIENT_JS = `(function () {\n"use strict";\n${SHARED_JS}\n${MAIN_JS}\n})();\n`;
