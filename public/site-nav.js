// Site bar behaviour, on every page. Everything here is an enhancement: the
// menu is a <details> element and every link works without this script.
(function () {
  // Explore menu: close on Escape or a click outside it.
  var menu = document.querySelector(".dl-nav-explore");
  if (menu) {
    document.addEventListener("click", function (e) {
      if (menu.open && !menu.contains(e.target)) menu.open = false;
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.open) {
        menu.open = false;
        menu.querySelector("summary").focus();
      }
    });
  }

  // "On this page": on long pages (4+ section headings), a small menu of the
  // sections with a copy-link button each. Headings without an id get one from
  // their text, so every section has a link that can be shared.
  function slug(t) {
    return t.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "section";
  }
  function heads() {
    var main = document.querySelector("main");
    if (!main) return [];
    return [].slice.call(main.querySelectorAll("h2")).filter(function (h) {
      return h.offsetParent !== null && h.textContent.trim() && !h.closest("a, li, .tracker-card, .case, .dl-next, details:not([open]), [hidden]");
    });
  }
  function buildToc() {
    var hs = heads();
    var old = document.querySelector(".dl-toc");
    if (hs.length < 4) { if (old) old.remove(); return; }
    hs.forEach(function (h) {
      var target = h.id ? h : (h.closest("section[id]") && h.closest("section[id]").querySelector("h2") === h ? h.closest("section[id]") : null);
      if (!target) {
        var base = slug(h.textContent), id = base, n = 2;
        while (document.getElementById(id) && document.getElementById(id) !== h) id = base + "-" + n++;
        h.id = id;
        target = h;
      }
      h.setAttribute("data-dl-anchor", target.id);
    });
    var key = hs.map(function (h) { return h.getAttribute("data-dl-anchor"); }).join("|");
    if (old && old.getAttribute("data-key") === key) return;
    if (old) old.remove();
    var box = document.createElement("details");
    box.className = "dl-toc";
    box.setAttribute("data-key", key);
    var sum = document.createElement("summary");
    sum.textContent = "On this page";
    box.appendChild(sum);
    var ol = document.createElement("ol");
    hs.forEach(function (h) {
      var id = h.getAttribute("data-dl-anchor");
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + id;
      a.textContent = h.textContent.trim();
      a.addEventListener("click", function () { box.open = false; });
      var b = document.createElement("button");
      b.type = "button";
      b.className = "dl-toc-copy";
      b.textContent = "Copy link";
      b.setAttribute("aria-label", "Copy link to " + h.textContent.trim());
      b.addEventListener("click", function () {
        var url = location.origin + location.pathname + location.search + "#" + id;
        var done = function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy link"; }, 1600); };
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { b.textContent = "Copy failed"; });
        else b.textContent = "Copy failed";
      });
      li.appendChild(a);
      li.appendChild(b);
      ol.appendChild(li);
    });
    box.appendChild(ol);
    document.body.appendChild(box);
    if (!window.__dlTocKeys) {
      window.__dlTocKeys = true;
      document.addEventListener("keydown", function (e) {
        var b = document.querySelector(".dl-toc[open]");
        if (e.key === "Escape" && b) { b.open = false; b.querySelector("summary").focus(); }
      });
      document.addEventListener("click", function (e) {
        var b = document.querySelector(".dl-toc[open]");
        if (b && !b.contains(e.target)) b.open = false;
      });
    }
    // A shared link to a section named by its text: jump once the id exists.
    if (location.hash && !window.__dlJumped) {
      var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (t) { window.__dlJumped = true; t.scrollIntoView(); }
    }
  }
  function startToc() {
    buildToc();
    var main = document.querySelector("main");
    if (!main || !window.MutationObserver) return;
    var timer;
    new MutationObserver(function () { clearTimeout(timer); timer = setTimeout(buildToc, 150); })
      .observe(main, { childList: true, subtree: true });
  }
  if (document.readyState === "complete") setTimeout(startToc, 0);
  else window.addEventListener("load", function () { setTimeout(startToc, 0); });

  // Keep a visitor's place. Opening a record from a list remembers that list
  // (its URL already carries the filters) and the scroll position; the record
  // page's back link then names that list and returns to the same spot.
  var RECORD = /^\/(?:babuwatch\/(?:incident|trial-court)\/[^/]+|(?:civilliberties|victimlesscrimes|economicfreedom|psu)\/[a-z]{2,3}-[a-z0-9-]+)\/?$/;
  var store = {
    get: function (k) { try { return JSON.parse(sessionStorage.getItem(k) || "null"); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { sessionStorage.removeItem(k); } catch (e) {} }
  };
  var here = location.pathname;
  var onRecord = RECORD.test(here);

  function selected(id) {
    var el = document.getElementById(id);
    return el && el.value && el.selectedIndex > -1 ? el.options[el.selectedIndex].text : "";
  }
  function listLabel() {
    var p = new URLSearchParams(location.search);
    var name = (document.title.split(" — ")[0] || "the list").trim();
    if (here === "/search") return p.get("q") ? "search results for “" + p.get("q") + "”" : "search";
    if (/^\/babuwatch\/tracker/.test(here)) name = "Babuwatch records";
    var bits = [];
    var state = p.get("state") || selected("f-state");
    var cat = selected("f-cat") || p.get("category");
    if (state) bits.push(state);
    if (cat) bits.push(cat);
    if (p.get("q") && here !== "/search") bits.push("“" + p.get("q") + "”");
    if (p.get("year")) bits.push(p.get("year"));
    return bits.length ? name + ": " + bits.join(", ") : name;
  }

  if (!onRecord) {
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || a.origin !== location.origin || !RECORD.test(a.pathname)) return;
      store.set("dl-back", { url: location.pathname + location.search + location.hash, label: listLabel(), y: window.scrollY });
    }, true);
    var restore = store.get("dl-restore");
    if (restore && restore.url === location.pathname + location.search + location.hash) {
      store.del("dl-restore");
      var jump = function () { window.scrollTo(0, restore.y); };
      if (document.readyState === "complete") setTimeout(jump, 50);
      else window.addEventListener("load", function () { setTimeout(jump, 50); });
    }
    return;
  }

  var back = store.get("dl-back");
  if (!back || !back.url) return;
  var link = null;
  var anchors = document.querySelectorAll("main a[href]");
  for (var i = 0; i < anchors.length; i++) {
    if (/^\s*(←|&larr;)?\s*Back to/i.test(anchors[i].textContent)) { link = anchors[i]; break; }
  }
  if (!link) {
    var main = document.querySelector("main .wrap") || document.querySelector("main");
    if (!main) return;
    var p = document.createElement("p");
    p.className = "dl-back";
    p.style.cssText = "margin:14px 0 0;font-size:14px;font-weight:600";
    link = document.createElement("a");
    p.appendChild(link);
    main.insertBefore(p, main.firstChild);
  }
  link.href = back.url;
  link.textContent = "← Back to " + back.label;
  link.addEventListener("click", function () { store.set("dl-restore", { url: back.url, y: back.y }); });
})();
