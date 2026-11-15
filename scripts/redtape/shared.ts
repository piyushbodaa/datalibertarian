/**
 * Shared, dependency-free rendering helpers for /redtape.
 * The same source runs on the server (evaluated with `new Function` in pages.tsx)
 * and in the browser (concatenated into redtape.js), so the trace view, list rows
 * and bar charts are defined exactly once.
 *
 * Written as a plain JS string (String.raw) — no backticks or dollar-brace inside.
 */
export const SHARED_JS = String.raw`
var RT = (function () {
  var inInt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function isNum(v) { return typeof v === "number" && !isNaN(v); }
  function int(v) { return isNum(v) ? inInt.format(Math.round(v)) : "—"; }
  function days(v) {
    if (!isNum(v)) return "—";
    if (v <= 0) return "0 days";
    if (v < 1) return "< 1 day";
    var r = Math.round(v);
    return inInt.format(r) + (r === 1 ? " day" : " days");
  }
  function pct(v) { return isNum(v) ? Math.round(v) + "%" : "—"; }
  function parts(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    return m ? { y: m[1], m: MONTHS[Number(m[2]) - 1] || m[2], d: String(Number(m[3])) } : null;
  }
  function date(iso) {
    var p = parts(iso);
    return p ? p.d + " " + p.m + " " + p.y : "—";
  }
  function range(a, b) {
    var pa = parts(a), pb = parts(b);
    if (!pa || !pb) return date(a) + " – " + date(b);
    if (pa.y === pb.y && pa.m === pb.m && pa.d === pb.d) return date(a);
    if (pa.y === pb.y) return pa.d + " " + pa.m + " – " + pb.d + " " + pb.m + " " + pb.y;
    return date(a) + " – " + date(b);
  }

  var SECTOR = {
    Factories: "Factories",
    Mines: "Mines",
    Power: "Power",
    Infrastructure_Other: "Other projects",
    All_Target_Sectors: "All projects"
  };
  var SUB = {
    FACTORIES_ALL: "Factories",
    IND1: "Metals, cement and paper",
    IND2: "Refineries and petrochemicals",
    IND3: "Chemicals and medicines",
    IND_ESTATES: "Industrial parks",
    FACTORIES_FC_WLC: "Factory on forest or wildlife land",
    MINES_MAJOR_ALL: "Major mines",
    CMIN: "Coal mine",
    MIN_MAJOR: "Large mine (not coal)",
    MIN_FORM2_MINOR: "Small quarry (under 5 ha)",
    MINES_ALL_ROLLUP: "All mines",
    MINES_FC_WLC: "Mine on forest or wildlife land",
    POWER_GEN_ALL: "Thermal and hydro power",
    THE: "Thermal power plant",
    RIV: "Hydropower and dams",
    POWER_GRID_RENEWABLES: "Solar, wind or power line",
    POWER_ALL_ROLLUP: "All power projects",
    CRZ_COASTAL: "Coastal project",
    INFRA_LINEAR_OTHER: "Roads, railways and other",
    ALL: "All projects"
  };
  var CLR = {
    EC: "Environmental clearance",
    TOR_BESPOKE: "Scoping approval",
    TOR_STANDARD_AUTO: "Standard scoping approval",
    TOR_ALL: "Scoping approval",
    FC: "Forest clearance",
    FC_STAGE1: "Forest clearance, stage 1",
    FC_STAGE2: "Forest clearance, final stage",
    WLC: "Wildlife clearance",
    CRZ: "Coastal clearance",
    ALL: "All clearances"
  };
  function sector(v) { return SECTOR[v] || String(v || "").replace(/_/g, " "); }
  function sub(v) { return SUB[v] || String(v || "").replace(/_/g, " "); }
  function clr(v) { return CLR[v] || String(v || "").replace(/_/g, " "); }
  function auth(v) {
    var s = String(v || "");
    if (/central|moefcc/i.test(s)) return "Union ministry";
    if (/state|seiaa/i.test(s)) return "State authority";
    return s;
  }
  function statusLabel(status, cohort) {
    var s = String(status || "");
    if (/delist/i.test(s) || cohort === "DELISTED_DORMANT") return "Dropped after no reply";
    if (/reject/i.test(s)) return "Rejected";
    if (/withdraw/i.test(s)) return "Withdrawn";
    if (/return|closed/i.test(s)) return "Returned";
    if (/grant|approv|issued|recommend|disposed/i.test(s) || cohort === "GRANTED") return "Granted";
    if (cohort === "PENDING_ACTIVE") return "Still pending";
    return s || "—";
  }
  function ownerKey(o) {
    if (o === "applicant") return "app";
    if (o === "interlock") return "int";
    if (o === "government") return "gov";
    return "int";
  }

  function plainDesk(label) {
    var s = String(label || "");
    var rules = [
      [/proponent|user agency|applicant/i, "Company"],
      [/minister/i, "Union Minister"],
      [/joint secretary/i, "Joint Secretary"],
      [/additional|special secretary/i, "Additional Secretary"],
      [/member secretary.*(post|sign|rout)/i, "Member Secretary"],
      [/^secretary|secretary \(moefcc\)/i, "Secretary"],
      [/deputy|joint director|\bDD\b/i, "Ministry director"],
      [/nbwl|wildlife board|sbwl/i, "Wildlife board"],
      [/chief wildlife warden|cwlw/i, "Chief wildlife warden"],
      [/wildlife warden/i, "Wildlife warden"],
      [/sczma|nczma|coastal/i, "Coastal authority"],
      [/expert appraisal|\beac\b|\bseac\b|\bfac\b|committee/i, "Expert committee"],
      [/divisional forest|\bdfo\b|\bdcf\b/i, "District forest officer"],
      [/nodal/i, "State nodal officer"],
      [/conservator|\bccf\b|\bcf\b/i, "Conservator of forests"],
      [/regional office|\biro\b|\brec\b/i, "Ministry regional office"],
      [/forest wing|moefcc hq|central moefcc/i, "Ministry forest wing"],
      [/state government|forest secretary/i, "State government"],
      [/seiaa/i, "State authority"],
      [/spcb|pollution control|public consultation/i, "Pollution board"],
      [/scrutiny/i, "Scrutiny desk"]
    ];
    for (var i = 0; i < rules.length; i++) if (rules[i][0].test(s)) return rules[i][1];
    return s.replace(/\s*\([^)]*\)/g, "").replace(/^\d+\.\s*/, "").trim() || "Government desk";
  }
  function plainNote(note) {
    var s = String(note || "");
    if (!s) return "";
    if (/raise[sd]?\s*eds|eds raised|essential details/i.test(s)) return "Sent questions to the company";
    if (/raise[sd]?\s*ads|ads raised|additional details/i.test(s)) return "Asked the company for more details";
    if (/replied|reply/i.test(s)) return "Company replied";
    if (/delist/i.test(s)) return "File dropped for lack of reply";
    if (/referred to|routed|forward|approval details/i.test(s)) return "";
    return s.length > 80 ? "" : s;
  }

  function buildLegs(steps) {
    var out = [];
    (steps || []).forEach(function (s) {
      var o = ownerKey(s.owner);
      var last = out[out.length - 1];
      if (last && last.owner === o) {
        last.steps.push(s);
        last.days += s.days || 0;
        last.end = s.end_utc;
      } else {
        out.push({ owner: o, steps: [s], days: s.days || 0, start: s.start_utc, end: s.end_utc });
      }
    });
    return out.filter(function (l) { return l.days > 0.0005; });
  }

  function chain(leg) {
    var seen = [];
    leg.steps.forEach(function (s) {
      if ((s.days || 0) <= 0 && leg.steps.length > 1) return;
      var p = plainDesk(s.desk_label);
      if (seen.indexOf(p) === -1) seen.push(p);
    });
    if (seen.length > 4) return seen.slice(0, 3).join(" → ") + " → … → " + seen[seen.length - 1];
    return seen.join(" → ");
  }

  function appTitle(leg, round) {
    var b = (leg.steps[0] && leg.steps[0].bucket) || "";
    if (b === "applicant_ads") return "Company answers the committee’s questions" + (round ? " · round " + round : "");
    if (b === "applicant_fc_compliance") return "Company meets forest conditions and pays levies";
    if (b === "applicant_delisted_dormant") return "No reply from the company";
    return "Company answers questions" + (round ? " · round " + round : "");
  }

  function strip(t) {
    var w = Math.max(0.01, t.wall_days || 0.01);
    return (t.steps || []).filter(function (s) { return (s.days || 0) > 0; }).map(function (s) {
      var k = ownerKey(s.owner);
      var who = k === "gov" ? "Government" : k === "app" ? "Company" : "Waiting for forest clearance";
      return '<span class="rt-seg rt-seg-' + k + '" style="width:' + Math.min(100, (s.days / w) * 100).toFixed(3) +
        '%" title="' + esc(who + " · " + plainDesk(s.desk_label) + " · " + days(s.days) + " · " + range(s.start_utc, s.end_utc)) + '"></span>';
    }).join("");
  }

  function renderTrace(t) {
    if (!t) return '<p class="rt-empty">Pick an application from the list to see its journey.</p>';
    var legs = buildLegs(t.steps);
    var round = 0;
    var status = statusLabel(t.status, t.cohort_status);
    var endWord = t.is_terminal ? status : "Still pending";

    var legHtml = legs.map(function (leg) {
      var who, title, out = "";
      if (leg.owner === "app") {
        var b = (leg.steps[0] && leg.steps[0].bucket) || "";
        if (b === "applicant_eds" || b === "applicant_ads") round += 1;
        who = "Company";
        title = appTitle(leg, b === "applicant_eds" || b === "applicant_ads" ? round : 0);
      } else if (leg.owner === "int") {
        who = "Waiting";
        title = "Held until forest clearance is granted";
      } else {
        who = "Government";
        title = chain(leg);
        for (var i = leg.steps.length - 1; i >= 0; i--) {
          var n = plainNote(leg.steps[i].note);
          if (n) { out = n; break; }
        }
      }
      var visible = leg.steps.filter(function (s) { return (s.days || 0) > 0; });
      var more = "";
      if (visible.length > 1) {
        more = '<details class="rt-leg-more"><summary>' + visible.length + " steps</summary><ul>" +
          visible.map(function (s) {
            return "<li><span>" + esc(plainDesk(s.desk_label)) + '</span><span class="rt-num">' + esc(days(s.days)) + " · " + esc(date(s.start_utc)) + "</span></li>";
          }).join("") + "</ul></details>";
      }
      return '<li class="rt-leg rt-leg-' + leg.owner + '">' +
        '<p class="rt-leg-who">' + who + "</p>" +
        '<p class="rt-leg-days rt-num">' + esc(days(leg.days)) + "</p>" +
        '<p class="rt-leg-what">' + esc(title) + "</p>" +
        (out ? '<p class="rt-leg-out">' + esc(out) + "</p>" : "") +
        '<p class="rt-leg-when">' + esc(range(leg.start, leg.end)) + "</p>" +
        more + "</li>";
    }).join("");

    var hasSplit = isNum(t.gov_days) && isNum(t.applicant_days);
    var nums =
      '<div class="rt-tr-nums">' +
      '<div><b class="rt-num">' + esc(days(t.wall_days)) + "</b><span>in total</span></div>" +
      (hasSplit
        ? '<div><b class="rt-num"><i class="rt-dot rt-dot-gov"></i>' + esc(days(t.gov_days)) + "</b><span>with government</span></div>" +
          '<div><b class="rt-num"><i class="rt-dot rt-dot-app"></i>' + esc(days(t.applicant_days)) + "</b><span>with the company</span></div>"
        : '<div><b class="rt-num">—</b><span>stage split unavailable on milestone record</span></div>') +
      ((t.interlock_days || 0) > 0.5
        ? '<div><b class="rt-num"><i class="rt-dot rt-dot-int"></i>' + esc(days(t.interlock_days)) + "</b><span>waiting for forest clearance</span></div>"
        : "") +
      "</div>";

    var clock = "";
    if (isNum(t.moefcc_reported_duration_days)) {
      var erased = isNum(t.clock_reset_erased_gov_days) ? t.clock_reset_erased_gov_days : t.gov_days - t.moefcc_reported_duration_days;
      if (erased > 1) {
        clock = '<p class="rt-tr-clock"><b>The ministry’s own counter says ' + esc(days(t.moefcc_reported_duration_days)) +
          ".</b> It restarts once the company answers the first questions, so " + esc(days(erased)) +
          " the file had already spent with officials are not counted.</p>";
      }
    }

    var cite = t.source_citation || {};
    var cert = cite.certificate_url ? ' · <a href="' + esc(cite.certificate_url) + '" target="_blank" rel="noopener">Clearance letter</a>' : "";

    return '<div class="rt-tr" data-proposal="' + esc(t.proposal_no) + '">' +
      '<p class="rt-tr-kicker">' + esc([sub(t.sub_sector), t.state, clr(t.clearance_track), auth(t.authority)].filter(Boolean).join(" · ")) + "</p>" +
      '<h3 class="rt-tr-title">' + esc(t.project_name) + "</h3>" +
      '<p class="rt-tr-sub">' + esc(t.proponent_name || "") + (t.proponent_name ? " · " : "") + esc(endWord) + " " + esc(date(t.terminal_or_snapshot_utc)) + "</p>" +
      nums +
      '<div class="rt-strip" role="img" aria-label="' + esc("Timeline: " + days(t.gov_days) + " with government, " + days(t.applicant_days) + " with the company") + '">' + strip(t) + "</div>" +
      '<div class="rt-strip-axis"><span>Filed ' + esc(date(t.first_submission_utc)) + "</span><span>" + esc(endWord) + " " + esc(date(t.terminal_or_snapshot_utc)) + "</span></div>" +
      clock +
      '<ol class="rt-legs">' + legHtml +
      '<li class="rt-leg rt-leg-end"><p class="rt-leg-what">' + esc(endWord) + " · " + esc(date(t.terminal_or_snapshot_utc)) + "</p></li></ol>" +
      '<p class="rt-src">Source: <a href="' + esc(cite.portal_url || "https://parivesh.nic.in") + '" target="_blank" rel="noopener">' + esc(cite.portal_name || "PARIVESH") +
      '</a>, proposal <span class="rt-code">' + esc(t.proposal_no) + "</span>, accessed " + esc(cite.accessed_on || "") + cert + ".</p>" +
      "</div>";
  }

  function splitBar(gov, app, intl) {
    if (!isNum(gov) && !isNum(app)) return '<span class="rt-mini"><span class="rt-seg rt-seg-int" style="width:100%"></span></span>';
    var g = Math.max(0, gov || 0), a = Math.max(0, app || 0), i = Math.max(0, intl || 0);
    var tot = g + a + i;
    if (tot <= 0) return '<span class="rt-mini"></span>';
    return '<span class="rt-mini">' +
      '<span class="rt-seg rt-seg-gov" style="width:' + ((g / tot) * 100).toFixed(2) + '%"></span>' +
      '<span class="rt-seg rt-seg-app" style="width:' + ((a / tot) * 100).toFixed(2) + '%"></span>' +
      (i > 0 ? '<span class="rt-seg rt-seg-int" style="width:' + ((i / tot) * 100).toFixed(2) + '%"></span>' : "") +
      "</span>";
  }

  function renderItem(r, active) {
    return '<li><button type="button" class="rt-item' + (active ? " is-active" : "") + '" data-open-proposal="' + esc(r.proposal_no) + '"' + (active ? ' aria-current="true"' : "") + ">" +
      '<span class="rt-item-name">' + esc(r.project_name || r.proposal_no) + "</span>" +
      '<span class="rt-item-meta">' + esc([r.state, sub(r.sub_sector), statusLabel(r.status, r.cohort)].filter(Boolean).join(" · ")) + "</span>" +
      '<span class="rt-item-bar">' + splitBar(r.gov_days, r.applicant_days, r.interlock_days) + '<span class="rt-num">' + esc(days(r.wall_days)) + "</span></span>" +
      "</button></li>";
  }

  function niceMax(v) {
    var steps = [50, 100, 150, 200, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000, 3000];
    for (var i = 0; i < steps.length; i++) if (v <= steps[i]) return steps[i];
    return Math.ceil(v / 1000) * 1000;
  }

  /* rows: [{ label, note, total, gov, app, int, n, mark, markLabel, valueLabel }] */
  function renderBars(rows, opts) {
    opts = opts || {};
    var shown = rows.filter(function (r) { return isNum(r.total) && r.total > 0; });
    if (!shown.length) return '<p class="rt-empty">' + esc(opts.empty || "No applications in this group yet.") + "</p>";
    var max = niceMax(Math.max.apply(null, shown.map(function (r) { return Math.max(r.total, r.mark || 0); })) * 1.08);
    var ticks = [0, 0.25, 0.5, 0.75, 1].map(function (f) {
      return '<span style="left:' + (f * 100) + '%">' + int(max * f) + "d</span>";
    }).join("");
    var body = shown.map(function (r) {
      var w = (r.total / max) * 100;
      var hasOwnerSplit = isNum(r.gov) || isNum(r.app);
      var parts = hasOwnerSplit ? (r.gov || 0) + (r.app || 0) + (r.int || 0) : 0;
      var segs = parts > 0
        ? '<span class="rt-seg rt-seg-gov" style="width:' + (((r.gov || 0) / parts) * 100).toFixed(2) + '%"></span>' +
          '<span class="rt-seg rt-seg-app" style="width:' + (((r.app || 0) / parts) * 100).toFixed(2) + '%"></span>' +
          ((r.int || 0) > 0 ? '<span class="rt-seg rt-seg-int" style="width:' + (((r.int || 0) / parts) * 100).toFixed(2) + '%"></span>' : "")
        : '<span class="rt-seg ' + (hasOwnerSplit ? "rt-seg-gov" : "rt-seg-int") + '" style="width:100%"></span>';
      var mark = isNum(r.mark) && r.mark > 0 && r.mark <= max
        ? '<span class="rt-mark" style="left:' + ((r.mark / max) * 100).toFixed(2) + '%"><span>' + esc(r.markLabel || int(r.mark) + "-day limit") + "</span></span>"
        : "";
      var split = "";
      if (parts > 0 && opts.split !== false) {
        var gVal = Math.max(0, r.gov || 0), aVal = Math.max(0, r.app || 0), iVal = Math.max(0, r.int || 0);
        var hasInt = iVal > 0.5 && (iVal / parts) >= 0.01;
        var gPct = Math.round((gVal / parts) * 100);
        var iPct = hasInt ? Math.max(1, Math.round((iVal / parts) * 100)) : 0;
        var aPct = Math.max(0, 100 - gPct - iPct);
        if (aPct === 0 && iPct === 0) {
          split = '<span class="rt-bar-split"><i class="rt-dot rt-dot-gov"></i>100% with government</span>';
        } else {
          split = '<span class="rt-bar-split"><i class="rt-dot rt-dot-gov"></i>' + gPct + '% with government · ' +
            '<i class="rt-dot rt-dot-app"></i>' + aPct + '% with the company' +
            (hasInt ? ' · <i class="rt-dot rt-dot-int"></i>' + iPct + '% forest wait' : '') + '</span>';
        }
      }
      return '<div class="rt-bar-row' + (mark ? " has-mark" : "") + '"' + (r.id ? ' data-row-id="' + esc(r.id) + '"' : "") + (isNum(r.total) ? ' data-total="' + Math.round(r.total) + '"' : "") + ">" +
        '<div class="rt-bar-label"><b>' + esc(r.label) + "</b>" + (r.note ? "<span>" + esc(r.note) + "</span>" : "") + "</div>" +
        '<div class="rt-bar-track">' +
          '<div class="rt-bar-canvas">' +
            '<div class="rt-bar" style="width:' + w.toFixed(2) + '%">' + segs + "</div>" +
            '<span class="rt-bar-val rt-num" style="left:' + w.toFixed(2) + '%">' + esc(r.valueLabel || days(r.total)) + "</span>" +
            mark +
          "</div>" +
          split +
        "</div></div>";
    }).join("");
    return '<div class="rt-bars">' + body + '<div class="rt-bar-row rt-bar-axisrow"><div class="rt-bar-label"></div><div class="rt-bar-axis">' + ticks + "</div></div></div>";
  }

  return {
    esc: esc, int: int, days: days, pct: pct, date: date, range: range,
    sector: sector, sub: sub, clr: clr, auth: auth, statusLabel: statusLabel, plainDesk: plainDesk,
    renderTrace: renderTrace, renderItem: renderItem, renderBars: renderBars, splitBar: splitBar
  };
})();
`;
