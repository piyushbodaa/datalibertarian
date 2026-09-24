#!/usr/bin/env python3
"""Fill the four register pages from registers/data/*.json.

Runs after the main site build (npm run build:registers). For each register it
takes dist/<register>/index.html (copied from public/), fills the marked
blocks, writes it back to both dist/<register>/index.html and
dist/<register>.html, and writes one page per record at dist/<register>/<id>.html.
It also fills the register counts on the landing page (dist/index.html and
dist/snapshot.html).

Marked blocks in the public pages:
  <!--@stats-->...<!--@/stats-->        live counts
  <!--@records-->...<!--@/records-->    the record list
  data-cat="<key>" on a category card    linked to that category's newest record
  <!--@count:<register>-->...<!--@/count:<register>-->  landing-page summary line

Python 3 stdlib only.
"""
import argparse
import html
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import plates as platemod  # noqa: E402
DATA = os.path.join(HERE, "data")
REGISTERS = ("victimlesscrimes", "civilliberties", "economicfreedom", "psu")

OUTCOME = {
    "conviction": "Convicted",
    "detention_set_aside": "Detained; detention set aside",
    "detention_upheld": "Detention upheld",
    "bail_refused": "Pre-arrest bail refused",
    "prosecution_pending": "Prosecution pending",
    "penalty_set_aside": "Penalised; penalty set aside",
    "penalty": "Penalised",
    "licence_cancelled": "Licence cancelled",
    "arrest": "Arrested",
    "status_cancelled": "Status cancelled",
    "seizure": "Goods seized",
    "confiscation": "Goods confiscated",
    "quashed": "Case quashed",
    "acquitted": "Acquitted",
}

VERIFICATION = {
    "V2": "An official record (court order, judgment, gazette or agency release) has been read and the facts checked against it.",
    "V1": "Reported by two or more independent news outlets; no official record located yet.",
}

SOURCE_KIND = {
    "judgment": "Judgment",
    "court_order": "Court order",
    "gazette": "Gazette",
    "press_release": "Official press release",
    "government_order": "Government order",
    "statute": "Statute",
    "dpe_survey": "DPE Public Enterprises Survey",
    "annual_report": "Annual report",
    "company_site": "Enterprise website",
    "pib": "PIB release",
    "cag": "CAG report",
    "exchange_filing": "Stock-exchange filing",
    "rating": "Credit rating rationale",
    "news": "News report",
}


def esc(s):
    return html.escape(str(s or ""), quote=True)


def fmt_date(d):
    """2026-08-04 -> 4 August 2026; partial dates pass through."""
    months = ("January February March April May June July August September "
              "October November December").split()
    m = re.fullmatch(r"(\d{4})-(\d{2})-(\d{2})", d or "")
    if not m:
        return d or "Date not stated"
    y, mo, da = m.groups()
    return "%d %s %s" % (int(da), months[int(mo) - 1], y)


def load(register):
    with open(os.path.join(DATA, register + ".json"), encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------- validation

REQUIRED = {
    "case": ("id", "category", "state", "date", "title", "outcome", "authority",
             "summary", "detail", "sources", "verification", "acts"),
    "enterprise": ("id", "category", "state", "date", "name", "summary",
                   "detail", "sources", "verification", "status"),
}


def validate(reg, data):
    """Refuse to build on a malformed record. Returns a list of problems."""
    problems = []
    cats = {c["key"] for c in data["categories"]}
    seen = set()
    kind = data["kind"]
    for r in data["records"]:
        rid = r.get("id", "?")
        for k in REQUIRED[kind]:
            if not r.get(k):
                problems.append("%s/%s: missing %s" % (reg, rid, k))
        if not re.fullmatch(r"[a-z]{2,3}-[a-z]{2}-\d{4}", rid):
            problems.append("%s/%s: id must look like vc-ap-0001" % (reg, rid))
        if rid in seen:
            problems.append("%s/%s: duplicate id" % (reg, rid))
        seen.add(rid)
        if r.get("category") not in cats:
            problems.append("%s/%s: unknown category %r" % (reg, rid, r.get("category")))
        if kind == "case" and r.get("outcome") not in OUTCOME:
            problems.append("%s/%s: unknown outcome %r" % (reg, rid, r.get("outcome")))
        if r.get("verification") not in VERIFICATION:
            problems.append("%s/%s: verification must be V1 or V2" % (reg, rid))
        official = [s for s in r.get("sources", []) if s.get("kind") not in ("news", "rating")]
        if r.get("verification") == "V2" and not official:
            problems.append("%s/%s: V2 needs at least one official source" % (reg, rid))
        if r.get("verification") == "V1" and len(r.get("sources", [])) < 2:
            problems.append("%s/%s: V1 needs two or more sources" % (reg, rid))
        for s in r.get("sources", []):
            if not str(s.get("url", "")).startswith("https://"):
                problems.append("%s/%s: source url must be https" % (reg, rid))
            if s.get("kind") not in SOURCE_KIND:
                problems.append("%s/%s: unknown source kind %r" % (reg, rid, s.get("kind")))
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", r.get("date", "")):
            problems.append("%s/%s: date must be YYYY-MM-DD" % (reg, rid))
    return problems


# ---------------------------------------------------------------- page parts

def newest_first(records):
    return sorted(records, key=lambda r: (r["date"], r["id"]), reverse=True)


def cat_label(data, key):
    for c in data["categories"]:
        if c["key"] == key:
            return c["label"]
    return key


def stats_html(data):
    recs = data["records"]
    states = {r["state"] for r in recs}
    tiles = []
    for t in data["stats"]:
        if t["value"] == "records":
            num = len(recs)
        elif t["value"] == "categories":
            num = len(data["categories"])
        elif t["value"] == "states":
            num = len(states)
        elif t["value"] == "acts":
            num = len({a for r in recs for a in r.get("acts", [])})
        elif t["value"] == "on_the_block":
            num = sum(1 for r in recs if r.get("on_the_block"))
        else:
            raise SystemExit("unknown stat %r" % t["value"])
        tiles.append('<div class="stat" role="listitem"><div class="num">%d</div>'
                     '<div class="lab">%s</div><div class="sub">%s</div></div>'
                     % (num, esc(t["label"]), esc(t["sub"])))
    return '<div class="stats" role="list">\n      %s\n    </div>' % "\n      ".join(tiles)


def card_html(reg, data, r):
    url = "/%s/%s" % (reg, r["id"])
    place = ", ".join(x for x in (r.get("district"), r["state"]) if x)
    if data["kind"] == "case":
        chips = (cat_label(data, r["category"]), OUTCOME[r["outcome"]])
        head = r["title"]
        meta = [fmt_date(r["date"]), place, r.get("authority")]
    else:
        chips = (cat_label(data, r["category"]), r["status"])
        head = r["name"]
        meta = [fmt_date(r["date"]), r.get("headquarters") or place, r.get("owner")]
    plate = r.get("_plate")
    return """
      <article class="tracker-card news-card" id="%s" data-id="%s" data-cat="%s" data-state="%s" data-district="%s">
        <div class="news-top"><div class="news-chips"><span class="chip">%s</span><span class="chip chip-out">%s</span></div>%s</div>
        <h2 class="news-head"><a href="%s">%s</a></h2>
        <p class="news-meta">%s</p>
        <p class="news-para">%s</p>
        <a class="tracker-card-open" href="%s">Read the full record <span aria-hidden="true">&rarr;</span></a>
      </article>""" % (
        esc(r["id"]), esc(r["id"]), esc(r["category"]), esc(r["state"]), esc(r.get("district") or ""),
        esc(chips[0]), esc(chips[1]),
        ('<span class="plate" title="Case number">%s</span>' % esc(plate)) if plate else "",
        esc(url), esc(head), " &middot; ".join(esc(m) for m in meta if m), esc(r["summary"]), esc(url))


NEWS_CSS = (".news-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}"
            ".news-chips{display:flex;gap:8px;flex-wrap:wrap}"
            ".chip{display:inline-block;padding:5px 12px;border-radius:999px;border:1px solid var(--line);background:#f1efe8;"
            "font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#3a3f48}"
            ".chip-out{background:#f0f7f2;border-color:#9ab6a7;color:#2f6b4a}"
            ".plate{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-weight:700;font-size:13px;"
            "letter-spacing:.1em;padding:4px 10px;border:2px solid #1d2230;border-radius:5px;background:#fff;color:#1d2230;white-space:nowrap}"
            ".news-head{margin-top:14px;font-family:var(--serif);font-size:clamp(20px,2.4vw,25px);font-weight:600;line-height:1.25}"
            ".news-head a{color:inherit;text-decoration:none}.news-head a:hover{text-decoration:underline}"
            ".news-meta{margin-top:8px;color:var(--grey);font-size:13.5px;line-height:1.5}"
            ".news-para{margin-top:12px;color:#363c44;font-size:15px;line-height:1.65}"
            ".news-card .tracker-card-open{position:static;display:inline-block;margin-top:14px}")


def records_html(reg, data):
    recs = newest_first(data["records"])
    if not recs:
        return '<div class="emptybox"><p>No records published yet.</p></div>'
    word = data["record_word"]
    states = sorted({r["state"] for r in recs})
    cats = [c for c in data["categories"] if any(r["category"] == c["key"] for r in recs)]
    opts = lambda items: "".join('<option value="%s">%s</option>' % (esc(v), esc(l)) for v, l in items)
    geo = {}
    for r in recs:
        if r.get("district"):
            geo.setdefault(r["state"], set()).add(r["district"])
    geo = {k: sorted(v) for k, v in geo.items()}
    filters = ('<style>.filters select{padding:9px 11px;border:1px solid var(--line);background:#fff;font:inherit;'
               'font-size:14px;border-radius:2px;max-width:100%%}' + NEWS_CSS + '</style>'
               '<div class="filters" role="search"><span class="flabel">Filter</span>'
               '<select id="f-state" aria-label="State"><option value="">All states (%d)</option>%s</select>'
               '<select id="f-district" aria-label="District" disabled><option value="">Choose a state first</option></select>'
               '<select id="f-cat" aria-label="Category"><option value="">All categories</option>%s</select></div>'
               '<script type="application/json" id="f-geo">%s</script>'
               % (len(states), opts((st, st) for st in states), opts((c["key"], c["label"]) for c in cats),
                  json.dumps(geo, ensure_ascii=False).replace("</", "<\\/")))
    head = ('<div class="tracker-results-head" aria-live="polite"><strong id="f-count">%d %s</strong>'
            '<span>newest first</span></div>' % (len(recs), word if len(recs) != 1 else word.rstrip("s")))
    script = ("<script>(function(){var s=document.getElementById('f-state'),d=document.getElementById('f-district'),"
              "c=document.getElementById('f-cat'),n=document.getElementById('f-count'),"
              "G=JSON.parse(document.getElementById('f-geo').textContent||'{}'),"
              "cards=[].slice.call(document.querySelectorAll('.tracker-records .tracker-card'));"
              "function fill(keep){var ds=G[s.value]||[];d.innerHTML='<option value=\"\">'+(s.value?'All districts':'Choose a state first')+'</option>'"
              "+ds.map(function(x){return '<option>'+x.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</option>'}).join('');"
              "d.disabled=!ds.length;d.value=keep&&ds.indexOf(keep)>-1?keep:'';}"
              "function go(){var k=0;cards.forEach(function(e){var ok=(!s.value||e.dataset.state===s.value)&&"
              "(!d.value||e.dataset.district===d.value)&&(!c.value||e.dataset.cat===c.value);e.hidden=!ok;if(ok)k++});"
              "n.textContent=k+' %s';var q=new URLSearchParams();if(s.value)q.set('state',s.value);if(d.value)q.set('district',d.value);"
              "if(c.value)q.set('cat',c.value);history.replaceState(null,'',location.pathname+(q.toString()?'?'+q:'')+location.hash);}"
              "var q=new URLSearchParams(location.search);if(q.get('state'))s.value=q.get('state');fill(q.get('district'));"
              "if(q.get('cat'))c.value=q.get('cat');s.onchange=function(){fill('');go()};d.onchange=c.onchange=go;go();})();</script>" % esc(word))
    return filters + head + '\n    <div class="tracker-records">%s\n    </div>' % "".join(
        card_html(reg, data, r) for r in recs) + script


def link_categories(page, reg, data):
    """Point each category card at the record list filtered to it, with live counts."""
    count, states = {}, {}
    for r in data["records"]:
        count[r["category"]] = count.get(r["category"], 0) + 1
        states.setdefault(r["category"], set()).add(r["state"])

    def fix(m):
        tag, key, body = m.group(1), m.group(2), m.group(3)
        n = count.get(key, 0)
        if n:
            href = "/%s?cat=%s#records" % (reg, key)
            ns = len(states[key])
            go = ('<span class="go">%d record%s &middot; %d state%s <span class="arrow">&rarr;</span></span>'
                  % (n, "" if n == 1 else "s", ns, "" if ns == 1 else "s"))
        else:
            href = "#records"
            go = '<span class="go">No record yet</span>'
        tag = re.sub(r'href="[^"]*"', 'href="%s"' % href, tag)
        body = re.sub(r'<span class="go">.*?</span>\s*</span>|<span class="go">[^<]*</span>',
                      go, body, count=1, flags=re.S)
        return tag + body + "</a>"

    return re.sub(r'(<a class="intent-card[^"]*" data-cat="([a-z-]+)"[^>]*>)(.*?)</a>',
                  fix, page, flags=re.S)


def fill(page, marker, content):
    pat = re.compile(r"(<!--@%s-->).*?(<!--@/%s-->)" % (re.escape(marker), re.escape(marker)), re.S)
    if not pat.search(page):
        raise SystemExit("marker %s not found" % marker)
    return pat.sub(lambda m: m.group(1) + content + m.group(2), page)


# ---------------------------------------------------------------- record page

def chrome(page, reg):
    """Masthead and footer of the register page, with #anchors made absolute."""
    head = re.search(r'<header class="masthead">.*?</header>', page, re.S).group(0)
    foot = re.search(r"<footer>.*?</footer>", page, re.S).group(0)
    fix = lambda s: re.sub(r'href="#', 'href="/%s#' % reg, s)
    return fix(head), fix(foot)


def fact_rows(rows):
    return "".join('<div><dt>%s</dt><dd>%s</dd></div>' % (esc(k), esc(v))
                   for k, v in rows if v)


def sources_html(r):
    items = []
    for s in r["sources"]:
        items.append('<li><strong>%s &mdash; %s</strong><p>%s%s. <a href="%s" rel="nofollow noopener">Open source</a></p></li>' % (
            esc(SOURCE_KIND[s["kind"]]), esc(s.get("publisher", "")),
            esc(fmt_date(s["date"]) + ". ") if s.get("date") else "",
            esc(s.get("supports", "")), esc(s["url"])))
    return "<ol>%s</ol>" % "".join(items)


def record_page(reg, data, r, page):
    head, foot = chrome(page, reg)
    site = data["site_name"]
    place = ", ".join(x for x in (r.get("district"), r["state"]) if x)
    if data["kind"] == "case":
        h1 = r["title"]
        badge = OUTCOME[r["outcome"]]
        rows = [("Case number", r.get("_plate")), ("Record", r["id"].upper()), ("Category", cat_label(data, r["category"])),
                ("Location", place), ("Latest official act", fmt_date(r["date"])),
                ("Incident date", fmt_date(r["incident_date"]) if r.get("incident_date") else "Not stated"),
                ("Outcome", badge), ("Decided or acted by", r["authority"]),
                ("Case reference", r.get("case_reference")), ("Person", r.get("person")),
                ("Laws used", "; ".join(r.get("laws") or r["acts"])),
                ("Penalty", r.get("penalty")),
                ("Verification", r["verification"])]
    else:
        h1 = r["name"]
        badge = r["status"]
        rows = [("Case number", r.get("_plate")), ("Record", r["id"].upper()), ("Type", cat_label(data, r["category"])),
                ("Headquarters", r.get("headquarters") or place),
                ("Andhra Pradesh link" if r["state"] == "Andhra Pradesh" else "State link", r.get("state_link")),
                ("Owner", r.get("owner")),
                ("Shareholding", r.get("shareholding")),
                ("Ministry / department", r.get("administrative")),
                ("Legal form", r.get("legal_form")), ("Rank or schedule", r.get("status_label")),
                ("Established", r.get("established")), ("Status", r["status"]),
                ("Latest figures", r.get("financials")), ("Employees", r.get("employees")),
                ("Latest development", fmt_date(r["date"])),
                ("Verification", r["verification"])]
    detail = "".join("<p>%s</p>" % esc(p) for p in r["detail"])
    quote = ""
    if r.get("quote"):
        q = r["quote"]
        quote = ('<section class="incident-section"><div class="incident-section-label">In the source&rsquo;s words</div>'
                 '<h2>%s</h2><blockquote class="record-quote"><p>&ldquo;%s&rdquo;</p></blockquote>'
                 '<p class="record-quote-cite">%s &mdash; <a href="%s" rel="nofollow noopener">read the full text</a></p></section>'
                 % (esc(q.get("heading", "What the record says")), esc(q["text"]),
                    esc(q.get("where", "")), esc(q["url"])))
    extra = "".join('<section class="incident-section"><div class="incident-section-label">%s</div><h2>%s</h2><p>%s</p></section>'
                    % (esc(s["label"]), esc(s["heading"]), esc(s["text"]))
                    for s in r.get("sections", []))
    caveat = ""
    if r.get("caveats"):
        caveat = ('<section class="incident-section"><div class="incident-section-label">Limits of this record</div>'
                  '<h2>What we could not confirm</h2><p>%s</p></section>' % esc(r["caveats"]))
    desc = r["summary"]
    return """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>%(title)s &mdash; %(site)s</title>
<meta name="description" content="%(desc)s">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://datalibertarian.in/%(reg)s/%(id)s">
<meta property="og:site_name" content="%(site)s">
<meta property="og:locale" content="en_IN">
<meta property="og:type" content="article">
<meta property="og:title" content="%(title)s">
<meta property="og:description" content="%(desc)s">
<meta property="og:url" content="https://datalibertarian.in/%(reg)s/%(id)s">
<meta name="twitter:card" content="summary">
<link rel="icon" href="/babuwatch/assets/brand/favicon.ico" sizes="48x48">
<link rel="icon" type="image/svg+xml" href="/babuwatch/assets/brand/logo-glyph-saffron.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/babuwatch/styles.css">
<style>
.record-quote{margin-top:16px;padding:18px 22px;border-left:3px solid var(--brass);background:#fffdf8;font-family:var(--serif);font-size:17px;line-height:1.6;color:#30363e}
.record-quote-cite{margin-top:10px;color:var(--grey);font-size:13px}
.incident-sources p{margin-top:4px;color:#50565e;font-size:12px;line-height:1.5}
.incident-sources a{color:var(--slate)}
@media (max-width:860px){.incident-layout{grid-template-columns:1fr;gap:28px}.incident-sidebar{position:static}.incident-hero{grid-template-columns:1fr;gap:16px}.incident-hero-badges{justify-content:flex-start}}
</style>
</head>
<body>
%(head)s
<main id="main" class="incident-page">
  <div class="wrap">
    <nav class="incident-breadcrumb" aria-label="Breadcrumb"><a href="/%(reg)s#records">%(site)s</a><span aria-hidden="true">/</span><span>%(uid)s</span></nav>
    <header class="incident-hero">
      <div class="incident-hero-copy">
        <div class="incident-overline"><span>%(plate)s</span><span>%(place)s</span><span>%(date)s</span></div>
        <h1>%(h1)s</h1>
        <p class="incident-summary">%(summary)s</p>
      </div>
      <div class="incident-hero-badges"><span class="record-badge reported">%(badge)s</span><span class="record-badge level">%(ver)s</span></div>
    </header>
    <div class="incident-reading-note"><strong>What this record means</strong><p>%(note)s</p><a href="/%(reg)s#methodology">How we verify &rarr;</a></div>
    <div class="incident-layout">
      <div class="incident-main">
        <section class="incident-section incident-current"><div class="incident-section-label">Current position</div><p>%(current)s</p></section>
        <section class="incident-section"><div class="incident-section-label">%(detail_label)s</div><h2>What happened</h2>%(detail)s</section>
        %(quote)s
        %(extra)s
        %(caveat)s
      </div>
      <aside class="incident-sidebar" aria-label="Record details and sources">
        <section class="incident-facts"><h2>At a glance</h2><dl>%(rows)s</dl></section>
        <section class="incident-sources" id="sources"><div class="incident-section-head"><div><div class="incident-section-label">Citations</div><h2>Public sources</h2></div><span>%(nsrc)d</span></div>%(sources)s</section>
        <a class="incident-back" href="/%(reg)s#records">&larr; Back to all %(word)s</a>
      </aside>
    </div>
  </div>
</main>
%(foot)s
<script src="/babuwatch/public-nav.js" defer></script>
</body>
</html>
""" % dict(
        title=esc(h1), site=esc(site), desc=esc(desc), reg=reg, id=esc(r["id"]),
        uid=esc(r["id"].upper()), plate=esc(r.get("_plate") or r["id"].upper()), head=head, foot=foot, place=esc(place),
        date=esc(fmt_date(r["date"])), h1=esc(h1), summary=esc(r["summary"]),
        badge=esc(badge), ver=esc(r["verification"]), note=esc(data["record_note"]),
        current=esc(r.get("current_position") or r["summary"]),
        detail_label=esc(data["detail_label"]), detail=detail, quote=quote,
        extra=extra, caveat=caveat, rows=fact_rows(rows),
        nsrc=len(r["sources"]), sources=sources_html(r), word=esc(data["record_word"]))


# ---------------------------------------------------------------- landing

def landing_line(data):
    n = len(data["records"])
    states = sorted({r["state"] for r in data["records"]})
    if not n:
        return "<b>Structure preview.</b> " + data["landing_tail"]
    word = data["record_word"] if n != 1 else data["record_word"].rstrip("s")
    return "<b>%d %s live</b> (%s). %s" % (n, esc(word), esc(", ".join(states)), data["landing_tail"])


# ---------------------------------------------------------------- main

def build(out):
    all_problems = []
    datasets = {reg: load(reg) for reg in REGISTERS}
    plates = platemod.assign_all()
    for reg, data in datasets.items():
        all_problems += validate(reg, data)
    if all_problems:
        raise SystemExit("registers: refusing to build:\n  " + "\n  ".join(all_problems))

    for reg, data in datasets.items():
        for r in data["records"]:
            r["_plate"] = plates.get(r["id"])
        src = os.path.join(out, reg, "index.html")
        with open(src, encoding="utf-8") as f:
            page = f.read()
        page = fill(page, "stats", stats_html(data))
        page = fill(page, "records", records_html(reg, data))
        page = link_categories(page, reg, data)
        for path in (src, os.path.join(out, reg + ".html")):
            with open(path, "w", encoding="utf-8") as f:
                f.write(page)
        for r in data["records"]:
            with open(os.path.join(out, reg, r["id"] + ".html"), "w", encoding="utf-8") as f:
                f.write(record_page(reg, data, r, page))
        print("registers: %s -> %d record page%s" % (reg, len(data["records"]),
                                                     "" if len(data["records"]) == 1 else "s"))

    for name in ("index.html", "snapshot.html"):
        path = os.path.join(out, name)
        if not os.path.exists(path):
            continue
        with open(path, encoding="utf-8") as f:
            page = f.read()
        for reg, data in datasets.items():
            page = fill(page, "count:" + reg, landing_line(data))
        with open(path, "w", encoding="utf-8") as f:
            f.write(page)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", default="dist")
    ap.add_argument("--check", action="store_true", help="validate data only")
    a = ap.parse_args()
    if a.check:
        probs = [p for reg in REGISTERS for p in validate(reg, load(reg))]
        print("\n".join(probs) or "registers: data OK")
        sys.exit(1 if probs else 0)
    build(a.out)
