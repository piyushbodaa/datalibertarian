#!/usr/bin/env python3
"""Build /gov and its 4 subpages + JSON/CSV exports from gov/data/snapshot.json.

Runs during the site build (npm run build:gov) after vite build. Writes:
  - dist/gov/index.html and dist/gov.html (main macro + interactive directory)
  - dist/gov/ministries/index.html and dist/gov/ministries.html
  - dist/gov/regulators/index.html and dist/gov/regulators.html
  - dist/gov/local-and-courts/index.html and dist/gov/local-and-courts.html
  - dist/gov/uncharted/index.html and dist/gov/uncharted.html
  - dist/gov/data/gov-domains.json (compact browser index)
  - dist/gov/gov-in-websites.csv (full CSV export)
And fills <!--@count:gov-->...<!--@/count:gov--> in dist/index.html & dist/snapshot.html.

Python 3 stdlib only.
"""
from __future__ import annotations

import argparse
import csv
import html
import io
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(HERE, "data", "snapshot.json")

ALL_STATES = [
    "Andaman and Nicobar Islands",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Puducherry",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
]

STATE_TO_SLUG = {
    s: s.lower().replace(" and ", "-and-").replace(" ", "-") for s in ALL_STATES
}
# Fix exact match with src/data/states.ts
STATE_TO_SLUG["Jammu and Kashmir"] = "jammu-and-kashmir"

KIND_META = [
    ("ministry", "Union Ministries", "Central ministries & independent departments at the top of the Union executive."),
    ("department", "Departments & State Portals", "Union departments, state secretariats, and state/UT main government portals."),
    ("regulator", "Regulators, Commissions & Apex Bodies", "Statutory regulators, constitutional/apex bodies, and permanent or ad-hoc commissions."),
    ("autonomous", "Autonomous Bodies, Councils & Societies", "Central and state autonomous bodies, councils, and registered government societies."),
    ("psu", "PSUs, Boards & Undertakings", "Public sector undertakings, joint ventures, statutory boards, and state corporations."),
    ("agency", "Agencies, Directorates & Field Offices", "Directorates, commissionerates, attached/subordinated offices, and regional units."),
    ("institute", "Institutes, Academies & Universities", "Training academies, national institutes, IITs/NITs, and government research bodies."),
    ("district", "Districts & Sub-Districts", "District collectorates, revenue divisions, sub-divisions, and block portals."),
    ("local", "Municipal & Panchayati Raj Bodies", "Municipal corporations, urban local bodies, and gram/zilla panchayat websites."),
    ("court", "Courts & Tribunals", "Supreme Court, High Courts, District Courts (e-Courts), and quasi-judicial tribunals."),
    ("legislature", "Parliament & State Legislatures", "Lok Sabha, Rajya Sabha, State Legislative Assemblies, and Legislative Councils."),
    ("portal", "Schemes, Missions & Citizen Portals", "Scheme portals, digital applications, Indian missions abroad, and web-only .gov.in hosts."),
]

TIER_META = [
    ("union", "Union Government", "#2a78d6"),
    ("state", "States & UTs", "#1baf7a"),
    ("local", "Districts & Local Bodies", "#eda100"),
    ("judiciary", "Courts & Tribunals", "#7b4ea3"),
    ("legislature", "Legislatures", "#b3261e"),
    ("apex", "Apex / Constitutional", "#2f6f4e"),
    ("missions", "Missions Abroad", "#5c768d"),
    ("uncharted", "Uncharted Web-Only", "#eb6834"),
]

KIND_LABELS = dict((k, lbl) for k, lbl, _ in KIND_META)
TIER_LABELS = dict((k, lbl) for k, lbl, _ in TIER_META)


def esc(s) -> str:
    return html.escape(str(s if s is not None else ""), quote=True)


def inr(n: int | float) -> str:
    s = str(int(round(n)))
    neg, s = s.startswith("-"), s.lstrip("-")
    if len(s) > 3:
        head, tail = s[:-3], s[-3:]
        head = ",".join(re.findall(r"\d{1,2}(?=(?:\d{2})*$)", head))
        s = head + "," + tail
    return ("-" if neg else "") + s


def pct(a: int | float, b: int | float) -> float:
    return 100.0 * a / b if b else 0.0


def csv_safe(val) -> str:
    s = "" if val is None else str(val)
    if s and s[0] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + s
    return s


def fill(page: str, marker: str, content: str) -> str:
    pat = re.compile(r"(<!--@%s-->).*?(<!--@/%s-->)" % (re.escape(marker), re.escape(marker)), re.S)
    if not pat.search(page):
        raise SystemExit(f"gov: marker {marker} not found")
    return pat.sub(lambda m: m.group(1) + content + m.group(2), page)


BASE_CSS = """
:root{
  --ink:#12151C; --ink-2:#3A3F48; --dim:#6B7280; --paper:#F7F5EF; --paper-2:#EFECE3; --card:#FBFAF6;
  --line:#D9D5C8; --grid:#E6E2D6; --stamp:#B3261E; --stamp-soft:#F3DEDA; --ledger:#2F6F4E; --ledger-soft:#E3EFE7;
  --serif:'Lora',Georgia,serif; --sans:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;
  --mono:'IBM Plex Mono',ui-monospace,Menlo,monospace; --w:1200px;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.55 var(--sans)}
a{color:inherit}
.wrap{max-width:var(--w);margin:0 auto;padding:0 24px}
.mono{font-family:var(--mono)}
.kicker{font:500 11.5px/1.2 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--stamp)}
.dbl{border:0;border-top:3px double var(--ink);margin:0}
.mast{padding:18px 0 12px}
.mast .wrap{display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap}
.brand{font:600 14px/1 var(--mono);letter-spacing:.22em;text-transform:uppercase;text-decoration:none}
.brand span{color:var(--stamp)}
.mast nav{display:flex;gap:18px;flex-wrap:wrap}
.mast nav a{font:500 13px/1 var(--sans);color:var(--ink-2);text-decoration:none}
.mast nav a:hover,.mast nav a[aria-current="page"]{color:var(--stamp)}
.hero{padding:40px 0 24px}
.hero h1{font:600 clamp(30px,4.6vw,50px)/1.08 var(--serif);letter-spacing:-.012em;margin:14px 0 16px;max-width:22em}
.hero p{font-size:17px;color:var(--ink-2);max-width:44em;margin:0}
.cta{margin-top:22px;display:flex;gap:10px;flex-wrap:wrap}
.btn{display:inline-block;font:600 13.5px/1 var(--sans);padding:11px 15px;border:1.5px solid var(--ink);text-decoration:none;background:transparent;color:var(--ink);cursor:pointer}
.btn.solid{background:var(--ink);color:var(--paper)}
.btn:hover{border-color:var(--stamp);color:var(--stamp)}
.btn.solid:hover{background:var(--stamp);color:#fff}
.tiles{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:0;margin:28px 0 6px;border-top:1px solid var(--ink);border-bottom:1px solid var(--line)}
.tile{padding:16px 16px 16px 0}
.tile+.tile{padding-left:16px;border-left:1px solid var(--line)}
.tile .v{font:600 28px/1.1 var(--mono);letter-spacing:-.01em}
.tile .l{font-size:13px;color:var(--ink-2);margin-top:6px;font-weight:500}
.tile .d{font:400 11.5px/1.4 var(--mono);color:var(--dim);margin-top:4px}
.sec{padding:40px 0 6px}
.sec-head{display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap;padding-bottom:10px;border-bottom:3px double var(--ink)}
.sec-head h2{font:600 26px/1.15 var(--serif);margin:6px 0 0}
.sec-head p{margin:0;color:var(--dim);font-size:13.5px;max-width:38em}
.fig{background:var(--card);border:1px solid var(--line);padding:18px 20px 18px;margin-top:20px}
.fig h3{font:600 17px/1.3 var(--serif);margin:0}
.fig .cap{font-size:13px;color:var(--dim);margin:4px 0 0}
.legend{display:flex;flex-wrap:wrap;gap:6px 18px;margin:14px 0 6px;font-size:12.5px;color:var(--ink-2)}
.legend span{display:inline-flex;align-items:center;gap:6px}
.legend i{width:12px;height:12px;border-radius:3px;display:inline-block}
.share{display:grid;grid-template-columns:130px 1fr;gap:32px 14px;align-items:center;margin-top:34px}
.share .rl{font:500 12.5px var(--mono);color:var(--ink-2)}
.bar{display:flex;gap:2px;height:24px}
.seg{height:100%;min-width:2px;position:relative;outline:none}
.seg:first-child{border-radius:4px 0 0 4px}.seg:last-child{border-radius:0 4px 4px 0}
.seg:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.seg b{position:absolute;left:0;right:0;top:-19px;text-align:center;font:500 11px var(--mono);color:var(--ink);white-space:nowrap}
.seg.small b{display:none}
.tip{position:fixed;pointer-events:none;background:var(--ink);color:var(--paper);font:12px/1.45 var(--sans);padding:7px 9px;border-radius:4px;max-width:280px;opacity:0;transition:opacity .08s;z-index:80}
.cards-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:20px}
.kcard{display:flex;flex-direction:column;justify-content:space-between;background:var(--card);border:1px solid var(--line);padding:16px 18px;text-decoration:none;cursor:pointer;text-align:left}
.kcard:hover{border-color:var(--ink)}
.kcard-top{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
.kcard-n{font:600 24px/1.1 var(--mono);color:var(--ink)}
.kcard-live{font:400 11.5px var(--mono);color:var(--ledger)}
.kcard h3{font:600 17px/1.25 var(--serif);margin:10px 0 6px}
.kcard p{font-size:13px;color:var(--ink-2);margin:0}
.kcard-go{margin-top:12px;font:600 12.5px var(--sans);color:var(--stamp)}
.tbl-wrap{overflow-x:auto;margin-top:16px;border:1px solid var(--line);background:var(--card)}
table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;min-width:760px}
th,td{padding:9px 12px;text-align:right;border-bottom:1px solid var(--grid);font-size:13.5px;vertical-align:top}
th:first-child,td:first-child,th.l,td.l{text-align:left}
th{font:500 11px/1.3 var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-2);background:var(--paper);position:sticky;top:0;vertical-align:bottom}
table.sortable th{cursor:pointer;user-select:none}
th[aria-sort="ascending"]::after{content:" \\2191"}th[aria-sort="descending"]::after{content:" \\2193"}
tr.india td{font-weight:600;background:#F2EFE6}
.badge{display:inline-block;font:500 10.5px/1.1 var(--mono);letter-spacing:.04em;padding:3px 6px;border-radius:3px;text-transform:uppercase;white-space:nowrap}
.b-live{background:var(--ledger-soft);color:var(--ledger)}
.b-dead{background:var(--stamp-soft);color:var(--stamp)}
.b-igod{background:#E8EEF5;color:#214A75}
.b-dl{background:#E8F0E8;color:#1F5A36}
.b-web{background:#F6EBD3;color:#7A5212}
.b-nic{background:#ECEBE6;color:#4B515C}
.filters{background:var(--card);border:1px solid var(--line);padding:16px 18px;margin-top:18px;display:flex;flex-direction:column;gap:12px}
.f-row{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px}
.f-search{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.f-search input[type="search"]{flex:1 1 280px;min-width:0;height:40px;padding:0 12px;border:1.5px solid var(--ink);background:#fff;font:400 14.5px var(--sans);color:var(--ink)}
.f-field{display:flex;flex-direction:column;gap:4px;min-width:0}
.f-field label{font:500 11px var(--mono);text-transform:uppercase;letter-spacing:.06em;color:var(--dim)}
.f-field select{height:36px;padding:0 8px;border:1px solid var(--line);background:#fff;font:400 13px var(--sans);color:var(--ink);width:100%;min-width:0}
.f-bar{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;font-size:13px;color:var(--ink-2)}
.f-check{display:inline-flex;align-items:center;gap:7px;font-weight:500;cursor:pointer}
.f-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.btn-sm{font:600 12.5px/1 var(--sans);padding:8px 11px;border:1px solid var(--ink);background:#fff;color:var(--ink);cursor:pointer;text-decoration:none}
.btn-sm:hover{border-color:var(--stamp);color:var(--stamp)}
.dir-meta{margin:14px 0 8px;display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:10px;font:500 13px var(--mono);color:var(--ink-2)}
.dom-link{font:500 13px var(--mono);color:var(--ink);text-decoration:underline;text-underline-offset:2px;word-break:break-word}
.dom-link:hover{color:var(--stamp)}
.sub-note{font-size:12px;color:var(--dim);margin-top:3px;max-width:44ch}
.pager{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:14px}
.notes{font-size:13.5px;color:var(--ink-2);max-width:68em;padding-left:20px}
.notes li{margin:7px 0}
.crumbs{font:500 12px var(--mono);color:var(--dim);margin-bottom:8px}
.crumbs a{text-decoration:none}
.crumbs a:hover{color:var(--stamp)}
.min-group{background:var(--card);border:1px solid var(--line);padding:16px 18px;margin-top:14px}
.min-group h3{font:600 18px/1.3 var(--serif);margin:0 0 6px}
.min-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;border-bottom:1px solid var(--grid);padding-bottom:8px;margin-bottom:10px}
.min-list{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:6px 20px}
.min-list li{font-size:13px;padding:4px 0;border-bottom:1px dotted var(--grid);display:flex;flex-direction:column;gap:2px}
footer{margin-top:48px;border-top:3px double var(--ink);padding:18px 0 34px;font-size:12.5px;color:var(--dim)}
footer .wrap{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}
a:focus-visible,button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid var(--stamp);outline-offset:2px}
@media (max-width:1050px){
  .tiles{grid-template-columns:repeat(2,minmax(0,1fr))}
  .tile:nth-child(odd){padding-left:0;border-left:0}
  .tile:nth-child(n+3){border-top:1px solid var(--line)}
  .cards-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .f-row{grid-template-columns:repeat(3,minmax(0,1fr))}
}
@media (max-width:620px){
  .wrap{padding:0 16px}
  .mast nav{display:none}
  .tiles{grid-template-columns:1fr}
  .tile,.tile+.tile{padding-left:0;border-left:0;border-top:1px solid var(--line)}
  .tile:first-child{border-top:0}
  .cards-grid{grid-template-columns:1fr}
  .f-row{grid-template-columns:1fr}
  .share{grid-template-columns:96px 1fr}
  .tile .v{font-size:24px}
}
"""


def page_shell(
    title: str,
    desc: str,
    canonical: str,
    active: str,
    body: str,
    extra_script: str = "",
) -> str:
    nav_items = [
        ("/gov", "Macro overview", "home"),
        ("/gov/ministries", "Union Ministries", "ministries"),
        ("/gov/regulators", "Regulators & Apex", "regulators"),
        ("/gov/local-and-courts", "Local & Courts", "local-and-courts"),
        ("/gov/uncharted", "Uncharted & Dead", "uncharted"),
    ]
    nav_html = "".join(
        f'<a href="{href}"{" aria-current=\"page\"" if key == active else ""}>{esc(label)}</a>'
        for href, label, key in nav_items
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<meta name="theme-color" content="#F7F5EF">
<link rel="canonical" href="{esc(canonical)}">
<meta property="og:site_name" content="Data Libertarian">
<meta property="og:locale" content="en_IN">
<meta property="og:type" content="website">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{esc(canonical)}">
<meta property="og:image" content="https://datalibertarian.in/social-preview.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;0,700;1,500&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>{BASE_CSS}</style>
</head>
<body>
<a class="skip" href="#main" style="position:absolute;left:-9999px">Skip to content</a>
<header class="mast">
  <div class="wrap">
    <a class="brand" href="/gov">Gov<span>.DataLibertarian</span></a>
    <nav aria-label="Gov.in Directory">{nav_html}</nav>
  </div>
</header>
<div class="wrap"><hr class="dbl"></div>
<main id="main">
{body}
</main>
<footer>
  <div class="wrap">
    <span>Data Libertarian &mdash; compiled from <a href="https://igod.gov.in" rel="noopener">igod.gov.in</a>, Tranco DNS/traffic logs, Data Libertarian registers, and live DNS checks.</span>
    <span><a href="/gov/gov-in-websites.csv" download>Download CSV</a> &middot; <a href="https://datalibertarian.in/">All Data Libertarian projects</a></span>
  </div>
</footer>
<div class="tip" id="tip" role="tooltip"></div>
<script>
(function(){{
  var tip=document.getElementById("tip");
  function show(e){{var t=e.currentTarget.getAttribute("data-tip");if(!t)return;tip.textContent=t;tip.style.opacity=1;move(e);}}
  function move(e){{var r=e.currentTarget.getBoundingClientRect();var x=(e.clientX||r.left+r.width/2)+12,y=(e.clientY||r.top)+14;
    if(x+290>innerWidth)x=Math.max(8,innerWidth-290);tip.style.left=x+"px";tip.style.top=y+"px";}}
  function hide(){{tip.style.opacity=0;}}
  document.querySelectorAll("[data-tip]").forEach(function(el){{
    el.addEventListener("mouseenter",show);el.addEventListener("mousemove",move);
    el.addEventListener("mouseleave",hide);el.addEventListener("focus",show);el.addEventListener("blur",hide);
  }});
  document.querySelectorAll("table.sortable").forEach(function(table){{
    table.querySelectorAll("th").forEach(function(th,i){{
      th.tabIndex=0;
      function sort(){{
        var asc=th.getAttribute("aria-sort")!=="ascending";
        table.querySelectorAll("th").forEach(function(o){{o.removeAttribute("aria-sort");}});
        th.setAttribute("aria-sort",asc?"ascending":"descending");
        var tb=table.tBodies[0];
        var rows=[].slice.call(tb.rows).filter(function(r){{return !r.classList.contains("india");}});
        rows.sort(function(a,b){{
          var x=a.cells[i].dataset.v||a.cells[i].textContent||"";
          var y=b.cells[i].dataset.v||b.cells[i].textContent||"";
          var nx=parseFloat(x),ny=parseFloat(y);
          var c=(isNaN(nx)||isNaN(ny))?String(x).localeCompare(String(y)):nx-ny;
          return asc?c:-c;
        }});
        rows.forEach(function(r){{tb.appendChild(r);}});
      }}
      th.addEventListener("click",sort);
      th.addEventListener("keydown",function(e){{if(e.key==="Enter"||e.key===" "){{e.preventDefault();sort();}}}});
    }});
  }});
}})();
</script>
{extra_script}
</body>
</html>"""


def write_both(out: str, rel_dir: str, html_str: str):
    """Write dist/gov/<rel_dir>/index.html AND dist/gov/<rel_dir>.html (or dist/gov/index.html + dist/gov.html)."""
    if rel_dir == "":
        p1 = os.path.join(out, "gov", "index.html")
        p2 = os.path.join(out, "gov.html")
    else:
        p1 = os.path.join(out, "gov", rel_dir, "index.html")
        p2 = os.path.join(out, "gov", rel_dir + ".html")
    for p in (p1, p2):
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "w", encoding="utf-8") as f:
            f.write(html_str)


def build_stacked_bar(label: str, aria: str, segments: list[tuple[str, int, str]], total: int) -> str:
    segs = []
    for name, val, color in segments:
        if val <= 0:
            continue
        share = pct(val, total)
        small = " small" if share < 6.0 else ""
        tip = f"{name} · {inr(val)} domains ({share:.1f}%)"
        segs.append(
            f'<span class="seg{small}" tabindex="0" style="width:{share:.2f}%;background:{color}" '
            f'data-tip="{esc(tip)}"><b>{share:.1f}%</b></span>'
        )
    return f'<span class="rl">{esc(label)}</span><div class="bar" role="img" aria-label="{esc(aria)}">{"".join(segs)}</div>'


def badge_dns(r: dict) -> str:
    st = r.get("dns_status") or ("resolved" if r.get("dns_live") else "no_record")
    if st == "resolved":
        return '<span class="badge b-live">DNS Resolved</span>'
    if st == "resolved_www":
        return '<span class="badge b-live">DNS Resolved (www)</span>'
    if st == "lookup_error":
        return '<span class="badge b-nic">DNS Timeout/Err</span>'
    return '<span class="badge b-dead">No DNS Record</span>'


def badge_prov(r: dict) -> str:
    prov = r.get("provenance") or ("igod" if r.get("in_igod") else "passive_only")
    role_b = ' <span class="badge b-nic">Infra</span>' if r.get("role") == "infrastructure" else ""
    if prov == "igod":
        return '<span class="badge b-igod">In IGOD</span>' + role_b
    if prov == "official_verified":
        return '<span class="badge b-dl">Official / DL Link</span>' + role_b
    return '<span class="badge b-web">Passive / Archive</span>' + role_b


def render_static_dir_rows(records: list[dict], limit: int = 50) -> str:
    rows = []
    for r in records[:limit]:
        dns_b = badge_dns(r)
        cat_b = badge_prov(r)
        loc = r.get("state") or ("Union" if r["tier"] == "union" else TIER_LABELS.get(r["tier"], r["tier"]))
        min_txt = f'<div class="sub-note">{esc(r["ministry"])}</div>' if r.get("ministry") else ""
        note_txt = f'<div class="sub-note">{esc(r["note"])}</div>' if r.get("note") else ""
        redir_txt = f'<div class="sub-note">Redirects to <code>{esc(r["redirect_to"])}</code></div>' if r.get("redirect_to") else ""
        merged_n = r.get("preserved_urls_count", 1)
        merged_txt = f'<div class="sub-note">{inr(merged_n)} URLs preserved under host</div>' if merged_n > 1 else ""
        rank_txt = f'#{inr(r["tranco_rank"])}' if r.get("tranco_rank") else "&mdash;"
        rows.append(
            f'<tr>'
            f'<td class="l"><a class="dom-link" href="{esc(r["url"])}" target="_blank" rel="noopener noreferrer">{esc(r["domain"])}</a>'
            f'<div class="sub-note">parent: {esc(r["root_domain"])}</div>{redir_txt}</td>'
            f'<td class="l"><strong>{esc(r["name"])}</strong>{min_txt}{note_txt}{merged_txt}</td>'
            f'<td class="l">{esc(KIND_LABELS.get(r["kind"], r["kind"]))}</td>'
            f'<td class="l">{esc(loc)}</td>'
            f'<td class="l">{cat_b} {dns_b}</td>'
            f'<td class="mono">{rank_txt}</td>'
            f'</tr>'
        )
    return "".join(rows)


def build_main_hub(snap: dict) -> str:
    meta = snap["meta"]
    rec_info = snap["reconciliation"]
    records = snap["records"]
    total = meta["total_domains"]
    web_n = meta.get("web_hosts", total)
    infra_n = meta.get("infra_hosts", 0)
    live = meta["dns_live_domains"]
    no_rec = meta.get("dns_no_record_domains", total - live)
    err_n = meta.get("dns_lookup_error_domains", 0)
    igod_n = meta.get("igod_domains", meta["catalogued_domains"])
    off_n = meta.get("official_verified_domains", 0)
    third_n = meta.get("third_level_domains", total)

    tier_counts = {}
    kind_counts = {}
    kind_live = {}
    for r in records:
        tier_counts[r["tier"]] = tier_counts.get(r["tier"], 0) + 1
        kind_counts[r["kind"]] = kind_counts.get(r["kind"], 0) + 1
        if r["dns_live"]:
            kind_live[r["kind"]] = kind_live.get(r["kind"], 0) + 1

    union_n = tier_counts.get("union", 0) + tier_counts.get("apex", 0)
    state_n = tier_counts.get("state", 0) + sum(1 for r in records if r["tier"] == "uncharted" and r.get("state"))
    local_court_n = tier_counts.get("local", 0) + tier_counts.get("judiciary", 0) + tier_counts.get("legislature", 0)

    tiles = [
        (inr(total), "compiled .gov.in hostnames", f"{inr(web_n)} web hosts · {inr(infra_n)} infra (mail/DNS/VPN)"),
        (inr(live), f"resolved in DNS ({pct(live, total):.1f}%)", f"{inr(no_rec)} no DNS record · {inr(err_n)} timeout/err"),
        (inr(igod_n), "listed in IGOD (GoI)", f"+ {inr(off_n)} via official links & DL registers"),
        (inr(union_n), "Union & Apex .gov.in hosts", f"{rec_info['ministries_total']} ministries/indep. depts tracked"),
        (inr(local_court_n), "Districts, Local & Courts", f"{inr(third_n)} 3rd-level *.gov.in names"),
    ]
    tiles_html = "".join(
        f'<div class="tile"><div class="v">{esc(v)}</div><div class="l">{esc(l)}</div><div class="d">{esc(d)}</div></div>'
        for v, l, d in tiles
    )

    hero = f"""<section class="hero">
  <div class="wrap">
    <div class="kicker">Compiled directory &middot; gov.datalibertarian.in &middot; Checked {esc(meta['generated_on'])}</div>
    <h1>Compiled directory of Indian .gov.in hostnames.</h1>
    <p>India publishes no single authoritative zone file of all <code>.gov.in</code> delegations, so total recall is unknown. This register compiles and cross-checks observed <code>.gov.in</code> hostnames across <strong>igod.gov.in</strong>, one-hop links from official government portals, Data Libertarian&rsquo;s verified registers, passive DNS/traffic rankings, and timestamped DNS probes.</p>
    <div class="cta">
      <a class="btn solid" href="#directory">Explore all {inr(total)} hostnames</a>
      <a class="btn" href="#ministries">55 Union Ministries &amp; Depts</a>
      <a class="btn" href="#states">36 States &amp; UTs</a>
      <a class="btn" href="/gov/gov-in-websites.csv" download>Download CSV</a>
    </div>
    <div class="tiles">{tiles_html}</div>
  </div>
</section>"""

    # Section 1: Macro stacked bars
    tier_segs = [(lbl, tier_counts.get(k, 0), col) for k, lbl, col in TIER_META]
    tier_legend = "".join(
        f'<span><i style="background:{col}"></i>{esc(lbl)} ({inr(tier_counts.get(k, 0))})</span>'
        for k, lbl, col in TIER_META
        if tier_counts.get(k, 0) > 0
    )
    igod_live = sum(1 for r in records if r["in_igod"] and r["dns_live"])
    off_live = sum(1 for r in records if r.get("provenance") == "official_verified" and r["dns_live"])
    pas_live = sum(1 for r in records if r.get("provenance") == "passive_only" and r["dns_live"])
    all_dead_or_err = sum(1 for r in records if not r["dns_live"])
    cov_segs = [
        ("In IGOD & DNS Resolved", igod_live, "#2f6f4e"),
        ("Official Link / DL Verified & DNS Resolved", off_live, "#1baf7a"),
        ("Passive DNS / Archive Only & Resolved", pas_live, "#2a78d6"),
        ("No DNS Record / Lookup Error", all_dead_or_err, "#b3261e"),
    ]
    cov_legend = "".join(
        f'<span><i style="background:{col}"></i>{esc(lbl)} ({inr(val)})</span>'
        for lbl, val, col in cov_segs if val > 0
    )

    macro_sec = f"""<section class="sec" id="macro" aria-labelledby="h-macro">
  <div class="wrap">
    <div class="sec-head">
      <div><div class="kicker">Macro view</div><h2 id="h-macro">The shape of observed Indian .gov.in hostnames</h2></div>
      <p>Hover or focus any segment for exact hostname counts. Provenance separates IGOD listings from one-hop official links and passive DNS/archive sightings.</p>
    </div>
    <div class="fig">
      <h3>1. Compiled .gov.in hostnames by tier of government</h3>
      <p class="cap">How the {inr(total)} compiled .gov.in hostnames split across Union, States, Local bodies, Courts, Legislatures, and uncatalogued passive web hosts.</p>
      <div class="legend">{tier_legend}</div>
      <div class="share">{build_stacked_bar("By tier", "Share of .gov.in hostnames by tier", tier_segs, total)}</div>
    </div>
    <div class="fig">
      <h3>2. Directory provenance vs DNS resolution ({esc(meta.get('dns_checked_at', meta['generated_on']))})</h3>
      <p class="cap">{inr(off_live + pas_live)} resolving .gov.in hostnames do not appear in IGOD listings ({inr(off_live)} found via official links/DL registers + {inr(pas_live)} in passive DNS/archives); {inr(all_dead_or_err)} compiled hosts returned no DNS record or a resolver timeout/error.</p>
      <div class="legend">{cov_legend}</div>
      <div class="share">{build_stacked_bar("Provenance & DNS", "Provenance vs DNS resolution", cov_segs, total)}</div>
    </div>
  </div>
</section>"""

    # Section 2: 12 Body-Kind cards
    kind_cards = []
    for key, label, blurb in KIND_META:
        cnt = kind_counts.get(key, 0)
        l_cnt = kind_live.get(key, 0)
        kind_cards.append(
            f'<button type="button" class="kcard" data-filter-kind="{esc(key)}">'
            f'<div><div class="kcard-top"><span class="kcard-n">{inr(cnt)}</span>'
            f'<span class="kcard-live">{inr(l_cnt)} live</span></div>'
            f'<h3>{esc(label)}</h3><p>{esc(blurb)}</p></div>'
            f'<span class="kcard-go">Filter directory &rarr;</span></button>'
        )
    kinds_sec = f"""<section class="sec" id="kinds" aria-labelledby="h-kinds">
  <div class="wrap">
    <div class="sec-head">
      <div><div class="kicker">Anatomy of the state</div><h2 id="h-kinds">Twelve kinds of government bodies</h2></div>
      <p>Click any card to filter the searchable directory below. Deep-dive lists: <a href="/gov/ministries">Ministries</a> &middot; <a href="/gov/regulators">Regulators</a> &middot; <a href="/gov/local-and-courts">Local &amp; Courts</a> &middot; <a href="/gov/uncharted">Uncharted</a>.</p>
    </div>
    <div class="cards-grid">{"".join(kind_cards)}</div>
  </div>
</section>"""

    # Section 3: All 55 Union Ministries & Independent Departments
    min_rows = []
    for m in rec_info["ministries"]:
        badge = '<span class="badge b-gov b-igod">.gov.in</span>' if m["is_gov_in"] else '<span class="badge b-nic">.nic.in / other</span>'
        url_cell = (
            f'<a class="dom-link" href="{esc(m["url"])}" target="_blank" rel="noopener noreferrer">{esc(m["domain"] or m["host"] or m["url"])}</a>'
            if m["url"] else '<span class="mono" style="color:var(--dim)">&mdash;</span>'
        )
        min_rows.append(
            f'<tr>'
            f'<td class="l" data-v="{esc(m["canonical_name"])}"><strong>{esc(m["name"])}</strong><div class="sub-note">{esc(m["kind"])}</div></td>'
            f'<td class="l" data-v="{esc(m["domain"] or m["host"] or "")}">{url_cell} {badge}</td>'
            f'<td data-v="{m["igod_children_count"]}">{inr(m["igod_children_count"])}</td>'
            f'<td data-v="{m["gov_in_domains"]}">{inr(m["gov_in_domains"])}</td>'
            f'<td class="l"><button type="button" class="btn-sm" data-filter-ministry="{esc(m["canonical_name"])}">Filter &rarr;</button></td>'
            f'</tr>'
        )

    min_sec = f"""<section class="sec" id="ministries" aria-labelledby="h-min">
  <div class="wrap">
    <div class="sec-head">
      <div><div class="kicker">Union executive</div><h2 id="h-min">All {rec_info["ministries_total"]} Union Ministries &amp; Independent Departments</h2></div>
      <p>{rec_info["ministries_gov_in"]} have primary <code>.gov.in</code> domains; the remainder still use legacy <code>.nic.in</code> or alternate hosts. <a href="/gov/ministries">Full ministry tree &rarr;</a></p>
    </div>
    <div class="tbl-wrap">
      <table class="sortable">
        <thead><tr>
          <th scope="col">Ministry / Independent Dept</th>
          <th scope="col">Primary Website</th>
          <th scope="col">Child Bodies (IGOD)</th>
          <th scope="col">.gov.in Domains Mapped</th>
          <th scope="col">Directory</th>
        </tr></thead>
        <tbody>{"".join(min_rows)}</tbody>
      </table>
    </div>
  </div>
</section>"""

    # Section 4: 36 States & UTs sortable table
    st_stats = {s: {"total": 0, "igod": 0, "local": 0, "other_prov": 0, "live": 0, "portal": None} for s in ALL_STATES}
    for r in records:
        st = r.get("state")
        if st not in st_stats:
            continue
        d = st_stats[st]
        d["total"] += 1
        if r.get("in_igod"):
            d["igod"] += 1
        else:
            d["other_prov"] += 1
        if r["kind"] in ("district", "local"):
            d["local"] += 1
        if r["dns_live"]:
            d["live"] += 1
        if d["portal"] is None and r["domain"] in (
            "maharashtra.gov.in", "up.gov.in", "karnataka.gov.in", "kerala.gov.in", "tn.gov.in",
            "telangana.gov.in", "ap.gov.in", "gujarat.gov.in", "rajasthan.gov.in", "mp.gov.in",
            "wb.gov.in", "bihar.gov.in", "odisha.gov.in", "assam.gov.in", "punjab.gov.in",
            "haryana.gov.in", "cgstate.gov.in", "uk.gov.in", "jharkhand.gov.in", "hp.gov.in",
            "jk.gov.in", "goa.gov.in", "sikkim.gov.in", "tripura.gov.in", "meghalaya.gov.in",
            "manipur.gov.in", "mizoram.gov.in", "nagaland.gov.in", "arunachalpradesh.gov.in",
            "delhi.gov.in", "py.gov.in", "chandigarh.gov.in", "andaman.gov.in", "lakshadweep.gov.in",
            "ladakh.gov.in", "ddd.gov.in", "dnh.gov.in",
        ):
            d["portal"] = r["domain"]

    st_rows = [
        f'<tr class="india">'
        f'<td data-v="000">All compiled .gov.in (Union + 36 States/UTs + Passive/Uncharted)</td>'
        f'<td data-v="india.gov.in"><a class="dom-link" href="https://www.india.gov.in" target="_blank" rel="noopener">india.gov.in</a></td>'
        f'<td data-v="{total}">{inr(total)}</td>'
        f'<td data-v="{igod_n}">{inr(igod_n)}</td>'
        f'<td data-v="{tier_counts.get("local", 0)}">{inr(tier_counts.get("local", 0))}</td>'
        f'<td data-v="{total - igod_n}">{inr(total - igod_n)}</td>'
        f'<td data-v="{pct(live, total):.1f}">{pct(live, total):.1f}%</td>'
        f'<td>&mdash;</td>'
        f'</tr>'
    ]
    for st in sorted(ALL_STATES, key=lambda n: -st_stats[n]["total"]):
        d = st_stats[st]
        lp = pct(d["live"], d["total"])
        slug = STATE_TO_SLUG[st]
        portal_cell = (
            f'<a class="dom-link" href="https://{esc(d["portal"])}" target="_blank" rel="noopener">{esc(d["portal"])}</a>'
            if d["portal"] else '<span class="mono" style="color:var(--dim)">&mdash;</span>'
        )
        st_rows.append(
            f'<tr>'
            f'<td data-v="{esc(st)}"><a href="/{esc(slug)}"><strong>{esc(st)}</strong></a></td>'
            f'<td data-v="{esc(d["portal"] or "")}">{portal_cell}</td>'
            f'<td data-v="{d["total"]}">{inr(d["total"])}</td>'
            f'<td data-v="{d["igod"]}">{inr(d["igod"])}</td>'
            f'<td data-v="{d["local"]}">{inr(d["local"])}</td>'
            f'<td data-v="{d["other_prov"]}">{inr(d["other_prov"])}</td>'
            f'<td data-v="{lp:.1f}">{lp:.1f}%</td>'
            f'<td class="l"><button type="button" class="btn-sm" data-filter-state="{esc(st)}">Filter &rarr;</button></td>'
            f'</tr>'
        )

    states_sec = f"""<section class="sec" id="states" aria-labelledby="h-states">
  <div class="wrap">
    <div class="sec-head">
      <div><div class="kicker">Federal breakdown</div><h2 id="h-states">36 States and Union Territories</h2></div>
      <p>Click any column heading to sort. State totals include IGOD listings, one-hop official links, verified district portals, and passive state subdomains (e.g. <code>*.maharashtra.gov.in</code>).</p>
    </div>
    <div class="tbl-wrap">
      <table class="sortable">
        <thead><tr>
          <th scope="col">State / UT</th>
          <th scope="col">State Portal (.gov.in)</th>
          <th scope="col">Total Compiled</th>
          <th scope="col">In IGOD</th>
          <th scope="col">District &amp; Local</th>
          <th scope="col">Non-IGOD / Web Hosts</th>
          <th scope="col">DNS Resolved</th>
          <th scope="col">Directory</th>
        </tr></thead>
        <tbody>{"".join(st_rows)}</tbody>
      </table>
    </div>
  </div>
</section>"""

    # Section 5: Interactive Directory Explorer
    tier_opts = "".join(f'<option value="{esc(k)}">{esc(lbl)}</option>' for k, lbl, _ in TIER_META)
    kind_opts = "".join(f'<option value="{esc(k)}">{esc(lbl)}</option>' for k, lbl, _ in KIND_META)
    state_opts = "".join(f'<option value="{esc(s)}">{esc(s)}</option>' for s in ALL_STATES)
    min_names = sorted({r["ministry"] for r in records if r.get("ministry")})
    min_opts = "".join(f'<option value="{esc(m)}">{esc(m)}</option>' for m in min_names)

    dir_sec = f"""<section class="sec" id="directory" aria-labelledby="h-dir">
  <div class="wrap">
    <div class="sec-head">
      <div><div class="kicker">Full register</div><h2 id="h-dir">Search all {inr(total)} compiled .gov.in hostnames</h2></div>
      <p>Filter by tier, kind of body, state, Union ministry, provenance, DNS response, or host role. Shared portals preserve all merged sub-URL counts cleanly.</p>
    </div>
    <div class="filters">
      <div class="f-search">
        <label for="f-q" class="mono" style="font-size:12px;text-transform:uppercase;letter-spacing:.08em">Search</label>
        <input id="f-q" type="search" placeholder="Hostname, ministry, regulator, state (e.g. sebi, cag, maharashtra, mca, rohtak)..." enterkeyhint="search">
      </div>
      <div class="f-row">
        <div class="f-field"><label for="f-tier">Tier</label><select id="f-tier"><option value="">All tiers</option>{tier_opts}</select></div>
        <div class="f-field"><label for="f-kind">Kind of body</label><select id="f-kind"><option value="">All 12 kinds</option>{kind_opts}</select></div>
        <div class="f-field"><label for="f-state">State / UT</label><select id="f-state"><option value="">All India / Any</option>{state_opts}</select></div>
        <div class="f-field"><label for="f-min">Union Ministry</label><select id="f-min"><option value="">Any ministry</option>{min_opts}</select></div>
        <div class="f-field"><label for="f-prov">Provenance</label><select id="f-prov"><option value="">All sources</option><option value="igod">Listed in IGOD</option><option value="official_verified">Official link / DL verified</option><option value="passive_only">Passive DNS / archive only</option></select></div>
        <div class="f-field"><label for="f-dns">DNS Status</label><select id="f-dns"><option value="">All DNS states</option><option value="resolved">DNS Resolved</option><option value="no_record">No DNS Record</option><option value="lookup_error">DNS Timeout / Error</option></select></div>
        <div class="f-field"><label for="f-role">Host Role</label><select id="f-role"><option value="">All hosts</option><option value="web">Websites &amp; portals</option><option value="infra">Infra (mail/DNS/VPN)</option></select></div>
      </div>
      <div class="f-bar">
        <label class="f-check"><input type="checkbox" id="f-group"> Group subdomains under 3rd-level parent (<code>*.gov.in</code>)</label>
        <div class="f-actions">
          <button type="button" class="btn-sm" id="f-reset">Reset filters</button>
          <button type="button" class="btn-sm" id="f-dl-filtered">Download filtered CSV</button>
          <a class="btn-sm" href="/gov/gov-in-websites.csv" download>Download all ({inr(total)}) CSV</a>
        </div>
      </div>
    </div>
    <div class="dir-meta"><span id="dir-count">Showing 1&ndash;50 of {inr(total)} compiled .gov.in hostnames (top by Tranco rank; loading full index...)</span><span id="dir-status"></span></div>
    <div class="tbl-wrap">
      <table>
        <thead><tr>
          <th scope="col">Hostname</th>
          <th scope="col">Institution / Portal</th>
          <th scope="col">Kind</th>
          <th scope="col">State / Tier</th>
          <th scope="col">Provenance &amp; DNS</th>
          <th scope="col">Tranco</th>
        </tr></thead>
        <tbody id="dir-body">{render_static_dir_rows(records, 50)}</tbody>
      </table>
    </div>
    <div class="pager" id="dir-pager"></div>
  </div>
</section>"""

    # Section 6: Sources, Reconciliation & Methodology
    tld_rows = "".join(
        f'<tr><td class="l"><code>{esc(tld)}</code></td><td>{inr(cnt)}</td></tr>'
        for tld, cnt in rec_info["non_gov_in_by_tld"].items()
    )
    src_items = "".join(
        f'<li><strong><a href="{esc(s["url"])}" target="_blank" rel="noopener">{esc(s["name"])}</a>:</strong> {esc(s["role"])}.</li>'
        for s in meta["sources"]
    )
    method_sec = f"""<section class="sec" id="methodology" aria-labelledby="h-method">
  <div class="wrap">
    <div class="sec-head">
      <div><div class="kicker">Sources, methodology &amp; limits</div><h2 id="h-method">How this register was compiled</h2></div>
      <p>Generated {esc(meta["generated_on"])} (DNS probe {esc(meta.get("dns_checked_at", meta["generated_on"]))}). Bounded compiled register &mdash; not an exhaustive registry census.</p>
    </div>
    <ul class="notes">{src_items}
      <li><strong>What this register measures (and what it does not):</strong> India publishes no complete <code>.gov.in</code> zone file, so nationwide recall is unknown. This ledger indexes <strong>{inr(total)}</strong> unique <code>.gov.in</code> hostnames ({inr(web_n)} web hosts and {inr(infra_n)} infrastructural hosts such as mail, VPN, and nameservers) across {inr(meta["root_zones"])} syntactic third-level parent names ({inr(meta.get("third_level_domains", 0))} with their own row). Where one shared portal hosts multiple government bodies (such as state portals or Ministry umbrellas), the host row takes a single atomic institutional identity and preserves merged sub-URL counts cleanly instead of mixing entity names and URLs.</li>
      <li><strong>Provenance &amp; DNS distinctions:</strong> <strong>{inr(igod_n)}</strong> hosts come directly from <code>igod.gov.in</code> listings, <strong>{inr(off_n)}</strong> additional hosts were verified from official one-hop links, Data Libertarian registers, or HTTP-200 district checks, and <strong>{inr(meta.get("passive_only_domains", 0))}</strong> come from passive DNS/archives (Tranco, GoI Archive, URLScan). DNS resolution separates <code>resolved</code> / <code>resolved_www</code> ({inr(live)}), <code>EAI_NONAME</code> <code>no_record</code> ({inr(no_rec)}), and transient <code>lookup_error</code> ({inr(err_n)}).</li>
      <li><strong>Non-<code>.gov.in</code> hosts inside IGOD:</strong> During this crawl, <code>igod.gov.in</code> also listed <strong>{inr(rec_info["non_gov_in_total"])}</strong> unique non-<code>.gov.in</code> hosts (<code>.ac.in</code>, legacy <code>.nic.in</code>, <code>.in</code>, <code>.co.in</code>, <code>.org.in</code>, <code>.res.in</code>, etc.). They are kept out of the <code>.gov.in</code> ledger and summarized below.</li>
    </ul>
    <div class="tbl-wrap" style="max-width:520px">
      <table style="min-width:0">
        <thead><tr><th scope="col">Non-.gov.in TLD found in IGOD</th><th scope="col">Unique Hosts</th></tr></thead>
        <tbody>{tld_rows}</tbody>
      </table>
    </div>
  </div>
</section>"""

    explorer_js = r"""<script>
(function(){
  var ALIAS={up:["uttar pradesh"],mp:["madhya pradesh"],ap:["andhra pradesh"],hp:["himachal pradesh"],
    mh:["maharashtra"],tn:["tamil nadu"],wb:["west bengal"],ka:["karnataka"],kl:["kerala"],
    tg:["telangana"],ts:["telangana"],gj:["gujarat"],rj:["rajasthan"],pb:["punjab"],hr:["haryana"],
    br:["bihar"],jh:["jharkhand"],od:["odisha"],cg:["chhattisgarh"],uk:["uttarakhand"],ga:["goa"],
    jk:["jammu and kashmir"],dl:["delhi"],py:["puducherry"],ch:["chandigarh"],la:["ladakh"],ld:["lakshadweep"],
    an:["andaman"],as:["assam"],sk:["sikkim"],tr:["tripura"],ml:["meghalaya"],mn:["manipur"],mz:["mizoram"],
    nl:["nagaland"],ar:["arunachal pradesh"],psu:["psus","undertaking"],rbi:["reserve bank"],sebi:["securities and exchange"],
    cag:["comptroller and auditor general"]};
  var DATA=null, FILT=[], PAGE=1, PER=50;
  var elQ=document.getElementById("f-q"), elTier=document.getElementById("f-tier"), elKind=document.getElementById("f-kind"),
      elState=document.getElementById("f-state"), elMin=document.getElementById("f-min"), elProv=document.getElementById("f-prov"),
      elDns=document.getElementById("f-dns"), elRole=document.getElementById("f-role"), elGroup=document.getElementById("f-group"),
      elBody=document.getElementById("dir-body"), elCount=document.getElementById("dir-count"),
      elStatus=document.getElementById("dir-status"), elPager=document.getElementById("dir-pager");

  function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
  function inr(n){return Number(n).toLocaleString("en-IN");}
  function readUrl(){
    var p=new URLSearchParams(location.search);
    if(p.has("q"))elQ.value=p.get("q");
    if(p.has("tier"))elTier.value=p.get("tier");
    if(p.has("kind"))elKind.value=p.get("kind");
    if(p.has("state"))elState.value=p.get("state");
    if(p.has("ministry"))elMin.value=p.get("ministry");
    if(p.has("provenance"))elProv.value=p.get("provenance");
    if(p.has("dns"))elDns.value=p.get("dns");
    if(p.has("role"))elRole.value=p.get("role");
    if(p.get("grouped")==="1")elGroup.checked=true;
  }
  function syncUrl(){
    var p=new URLSearchParams();
    if(elQ.value.trim())p.set("q",elQ.value.trim());
    if(elTier.value)p.set("tier",elTier.value);
    if(elKind.value)p.set("kind",elKind.value);
    if(elState.value)p.set("state",elState.value);
    if(elMin.value)p.set("ministry",elMin.value);
    if(elProv.value)p.set("provenance",elProv.value);
    if(elDns.value)p.set("dns",elDns.value);
    if(elRole.value)p.set("role",elRole.value);
    if(elGroup.checked)p.set("grouped","1");
    var qs=p.toString();
    history.replaceState(null,"",location.pathname+(qs?"?"+qs:"")+location.hash);
  }
  function termsOf(q){
    return q.toLowerCase().trim().split(/[\s,;]+/).filter(Boolean).map(function(w){return [w].concat(ALIAS[w]||[]);});
  }
  function apply(){
    if(!DATA)return;
    syncUrl();
    var terms=termsOf(elQ.value);
    var tIdx=elTier.value?DATA.tierKeys.indexOf(elTier.value):-1;
    var kIdx=elKind.value?DATA.kindKeys.indexOf(elKind.value):-1;
    var sIdx=elState.value?DATA.states.indexOf(elState.value):-1;
    var mIdx=elMin.value?DATA.ministries.indexOf(elMin.value):-1;
    var provV=elProv.value, dnsV=elDns.value, roleV=elRole.value;
    var matched=[];
    for(var i=0;i<DATA.rows.length;i++){
      var r=DATA.rows[i];
      if(tIdx!==-1&&r[5]!==tIdx)continue;
      if(kIdx!==-1&&r[4]!==kIdx)continue;
      if(sIdx!==-1&&r[6]!==sIdx)continue;
      if(mIdx!==-1&&r[7]!==mIdx)continue;
      if(provV!==""&&r[8]!==provV)continue;
      if(dnsV==="resolved"&&r[9]!=="resolved"&&r[9]!=="resolved_www")continue;
      if(dnsV==="no_record"&&r[9]!=="no_record")continue;
      if(dnsV==="lookup_error"&&r[9]!=="lookup_error")continue;
      if(roleV==="web"&&r[14]===1)continue;
      if(roleV==="infra"&&r[14]===0)continue;
      if(terms.length){
        var hay=(r[0]+" "+r[3]+" "+(r[6]>=0?DATA.states[r[6]]:"")+" "+(r[7]>=0?DATA.ministries[r[7]]:"")+" "+r[13]+" "+r[15]).toLowerCase();
        var ok=true;
        for(var j=0;j<terms.length;j++){
          var alts=terms[j], found=false;
          for(var a=0;a<alts.length;a++){if(hay.indexOf(alts[a])!==-1){found=true;break;}}
          if(!found){ok=false;break;}
        }
        if(!ok)continue;
      }
      matched.push(r);
    }
    if(elGroup.checked){
      var grp=new Map();
      for(var i=0;i<matched.length;i++){
        var r=matched[i], root=r[1];
        var g=grp.get(root);
        if(!g){grp.set(root,{rep:r,subs:[r]});}
        else{
          g.subs.push(r);
          if(r[0]===root||(g.rep[0]!==root&&r[16]>g.rep[16]))g.rep=r;
        }
      }
      FILT=[];
      grp.forEach(function(g){FILT.push({row:g.rep,count:g.subs.length,subs:g.subs});});
    } else {
      FILT=matched.map(function(r){return {row:r,count:1,subs:null};});
    }
    PAGE=1;
    render();
  }
  function dnsBadge(s){
    if(s==="resolved")return '<span class="badge b-live">DNS Resolved</span>';
    if(s==="resolved_www")return '<span class="badge b-live">DNS Resolved (www)</span>';
    if(s==="lookup_error")return '<span class="badge b-nic">DNS Timeout/Err</span>';
    return '<span class="badge b-dead">No DNS Record</span>';
  }
  function provBadge(p, isInfra){
    var b=p==="igod"?'<span class="badge b-igod">In IGOD</span>':(p==="official_verified"?'<span class="badge b-dl">Official / DL Link</span>':'<span class="badge b-web">Passive / Archive</span>');
    return isInfra?b+' <span class="badge b-nic">Infra</span>':b;
  }
  function render(){
    var total=FILT.length, pages=Math.max(1,Math.ceil(total/PER));
    if(PAGE>pages)PAGE=pages;
    var start=(PAGE-1)*PER, end=Math.min(total,start+PER);
    if(total===0){
      elCount.textContent="0 matching .gov.in hostnames";
      elBody.innerHTML='<tr><td colspan="6" class="l" style="padding:20px">No .gov.in hostnames match these filters. Try clearing one filter or searching a broader term.</td></tr>';
      elPager.innerHTML="";
      return;
    }
    elCount.textContent="Showing "+inr(start+1)+"–"+inr(end)+" of "+inr(total)+(elGroup.checked?" 3rd-level .gov.in parents":" compiled .gov.in hostnames");
    var html=[];
    for(var i=start;i<end;i++){
      var item=FILT[i], r=item.row;
      var loc=r[6]>=0?DATA.states[r[6]]:DATA.tierLabels[r[5]];
      var minTxt=r[7]>=0?'<div class="sub-note">'+esc(DATA.ministries[r[7]])+'</div>':"";
      var noteTxt=r[13]?'<div class="sub-note">'+esc(r[13])+'</div>':"";
      var redirTxt=r[15]?'<div class="sub-note">Redirects to <code>'+esc(r[15])+'</code></div>':"";
      var mergedTxt=r[11]>1?'<div class="sub-note">'+inr(r[11])+' URLs preserved under host</div>':"";
      var grpTxt=item.count>1?'<div class="sub-note"><strong>'+inr(item.count)+' subdomains</strong>: '+item.subs.slice(0,4).map(function(s){return esc(s[0]);}).join(", ")+(item.subs.length>4?"…":"")+'</div>':"";
      var rk=r[10]!=null?"#"+inr(r[10]):"—";
      html.push('<tr>'+
        '<td class="l"><a class="dom-link" href="'+esc(r[2])+'" target="_blank" rel="noopener noreferrer">'+esc(r[0])+'</a><div class="sub-note">parent: '+esc(r[1])+'</div>'+redirTxt+grpTxt+'</td>'+
        '<td class="l"><strong>'+esc(r[3])+'</strong>'+minTxt+noteTxt+mergedTxt+'</td>'+
        '<td class="l">'+esc(DATA.kindLabels[r[4]])+'</td>'+
        '<td class="l">'+esc(loc)+'</td>'+
        '<td class="l">'+provBadge(r[8],r[14]===1)+' '+dnsBadge(r[9])+'</td>'+
        '<td class="mono">'+rk+'</td>'+
      '</tr>');
    }
    elBody.innerHTML=html.join("");
    var pHtml=[];
    if(pages>1){
      pHtml.push('<button type="button" class="btn-sm" data-pg="'+(PAGE-1)+'"'+(PAGE===1?" disabled":"")+'>&larr; Prev</button>');
      pHtml.push('<span class="mono" style="font-size:12.5px">Page '+PAGE+' of '+pages+'</span>');
      pHtml.push('<button type="button" class="btn-sm" data-pg="'+(PAGE+1)+'"'+(PAGE===pages?" disabled":"")+'>Next &rarr;</button>');
    }
    elPager.innerHTML=pHtml.join("");
    elPager.querySelectorAll("button[data-pg]").forEach(function(b){
      b.addEventListener("click",function(){PAGE=parseInt(b.dataset.pg,10);render();elCount.scrollIntoView({behavior:"smooth",block:"nearest"});});
    });
  }
  function csvCell(v){
    var s=String(v==null?"":v);
    if(s&&"=+-@\t\r".indexOf(s[0])!==-1)s="'"+s;
    return '"'+s.replace(/"/g,'""')+'"';
  }
  document.getElementById("f-dl-filtered").addEventListener("click",function(){
    if(!DATA||!FILT.length)return;
    var checkedAt=(DATA.meta&&DATA.meta.dns_checked_at)||"";
    var lines=["domain,root_domain,url,name,role,tier,kind,state,ministry,provenance,in_igod,dns_status,dns_checked_at,redirect_to,tranco_rank,preserved_urls_count,sources"];
    for(var i=0;i<FILT.length;i++){
      var r=FILT[i].row;
      lines.push([r[0],r[1],r[2],r[3],r[14]===1?"infrastructure":"web",DATA.tierKeys[r[5]],DATA.kindKeys[r[4]],r[6]>=0?DATA.states[r[6]]:"",r[7]>=0?DATA.ministries[r[7]]:"",r[8],r[16]===1?"true":"false",r[9],checkedAt,r[15],r[10]!=null?r[10]:"",r[11],r[12]].map(csvCell).join(","));
    }
    var blob=new Blob([lines.join("\n")],{type:"text/csv;charset=utf-8"});
    var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="gov-in-filtered.csv";a.click();
  });
  document.getElementById("f-reset").addEventListener("click",function(){
    elQ.value="";elTier.value="";elKind.value="";elState.value="";elMin.value="";elProv.value="";elDns.value="";elRole.value="";elGroup.checked=false;apply();
  });
  [elTier,elKind,elState,elMin,elProv,elDns,elRole,elGroup].forEach(function(el){el.addEventListener("change",apply);});
  var timer=null;
  elQ.addEventListener("input",function(){clearTimeout(timer);timer=setTimeout(apply,120);});
  document.querySelectorAll("[data-filter-kind]").forEach(function(btn){
    btn.addEventListener("click",function(){elKind.value=btn.dataset.filterKind;apply();document.getElementById("directory").scrollIntoView({behavior:"smooth"});});
  });
  document.querySelectorAll("[data-filter-state]").forEach(function(btn){
    btn.addEventListener("click",function(){elState.value=btn.dataset.filterState;apply();document.getElementById("directory").scrollIntoView({behavior:"smooth"});});
  });
  document.querySelectorAll("[data-filter-ministry]").forEach(function(btn){
    btn.addEventListener("click",function(){elMin.value=btn.dataset.filterMinistry;apply();document.getElementById("directory").scrollIntoView({behavior:"smooth"});});
  });

  readUrl();
  fetch("/gov/data/gov-domains.json").then(function(r){return r.json();}).then(function(d){
    DATA=d;
    DATA.kindKeys=d.kinds.map(function(x){return x[0];});
    DATA.kindLabels=d.kinds.map(function(x){return x[1];});
    DATA.tierKeys=d.tiers.map(function(x){return x[0];});
    DATA.tierLabels=d.tiers.map(function(x){return x[1];});
    elStatus.textContent="Index ready ("+inr(d.rows.length)+" hostnames)";
    apply();
  }).catch(function(){elStatus.textContent="Failed to load index";});
})();
</script>"""

    body = hero + macro_sec + kinds_sec + min_sec + states_sec + dir_sec + method_sec
    return page_shell(
        title="Gov.in Directory — Compiled Register of Indian .gov.in Hostnames — Data Libertarian",
        desc=f"Compiled macro register and searchable CSV/JSON index of {inr(total)} Indian .gov.in hostnames across Union ministries, regulators, PSUs, 36 states & UTs, districts, courts and local bodies.",
        canonical="https://gov.datalibertarian.in/",
        active="home",
        body=body,
        extra_script=explorer_js,
    )


def build_subpage_ministries(snap: dict) -> str:
    rec_info = snap["reconciliation"]
    records = snap["records"]
    by_min: dict[str, list[dict]] = {}
    for r in records:
        if r.get("ministry"):
            by_min.setdefault(r["ministry"], []).append(r)

    groups = []
    for m in rec_info["ministries"]:
        cname = m["canonical_name"]
        items = sorted(by_min.get(cname, []), key=lambda x: (0 if x["kind"] == "ministry" else 1, x["domain"]))
        link_u = f'<a class="dom-link" href="{esc(m["url"])}" target="_blank" rel="noopener">{esc(m["domain"] or m["host"] or m["url"])}</a>' if m["url"] else "&mdash;"
        li_html = "".join(
            f'<li><a class="dom-link" href="{esc(r["url"])}" target="_blank" rel="noopener">{esc(r["domain"])}</a>'
            f'<span>{esc(r["name"])} &middot; {esc(KIND_LABELS.get(r["kind"], r["kind"]))}'
            + ("" if r["dns_live"] else f' ({esc(r.get("dns_status", "no_record"))})')
            + '</span></li>'
            for r in items
        )
        groups.append(
            f'<div class="min-group"><div class="min-head">'
            f'<div><h3>{esc(m["name"])}</h3><div class="sub-note">{esc(m["kind"])} &middot; Primary: {link_u}</div></div>'
            f'<div class="mono" style="font-size:12.5px">{inr(len(items))} .gov.in domains &middot; {inr(m["igod_children_count"])} IGOD bodies</div>'
            f'</div>'
            + (f'<ul class="min-list">{li_html}</ul>' if li_html else '<p class="sub-note">No <code>.gov.in</code> child domains mapped under this ministry in IGOD (child bodies may use <code>.nic.in</code> or independent domains).</p>')
            + '</div>'
        )

    body = f"""<section class="hero">
  <div class="wrap">
    <div class="crumbs"><a href="/gov">Gov.in Directory</a> / Union Ministries</div>
    <div class="kicker">Union executive &middot; {rec_info["ministries_total"]} ministries &amp; independent departments</div>
    <h1>55 Union Ministries &amp; Independent Departments on .gov.in</h1>
    <p>Grouped from the Government of India&rsquo;s <code>igod.gov.in</code> parent-child hierarchy, official portal links, and subdomains under each ministry zone. <a href="/gov#directory">Search the full register &rarr;</a></p>
  </div>
</section>
<section class="sec"><div class="wrap">{"".join(groups)}</div></section>"""
    return page_shell(
        title="Union Ministries (.gov.in) — Gov.DataLibertarian",
        desc="All 55 Union Ministries and Independent Departments of India with their child .gov.in agencies, regulators, PSUs and portals.",
        canonical="https://gov.datalibertarian.in/ministries",
        active="ministries",
        body=body,
    )


def render_static_table_page(
    title: str,
    desc: str,
    canonical: str,
    active: str,
    crumb: str,
    kicker: str,
    h1: str,
    lede: str,
    rows: list[dict],
) -> str:
    trs = []
    for r in rows:
        dns_b = badge_dns(r)
        cat_b = badge_prov(r)
        loc = r.get("state") or TIER_LABELS.get(r["tier"], r["tier"])
        redir_txt = f'<div class="sub-note">Redirects to <code>{esc(r["redirect_to"])}</code></div>' if r.get("redirect_to") else ""
        trs.append(
            f'<tr>'
            f'<td class="l" data-v="{esc(r["domain"])}"><a class="dom-link" href="{esc(r["url"])}" target="_blank" rel="noopener">{esc(r["domain"])}</a>{redir_txt}</td>'
            f'<td class="l" data-v="{esc(r["name"])}"><strong>{esc(r["name"])}</strong></td>'
            f'<td class="l" data-v="{esc(KIND_LABELS.get(r["kind"], r["kind"]))}">{esc(KIND_LABELS.get(r["kind"], r["kind"]))}</td>'
            f'<td class="l" data-v="{esc(loc)}">{esc(loc)}</td>'
            f'<td class="l" data-v="{1 if r["dns_live"] else 0}">{cat_b} {dns_b}</td>'
            f'<td data-v="{r["tranco_rank"] if r.get("tranco_rank") else 99999999}">{("#" + inr(r["tranco_rank"])) if r.get("tranco_rank") else "&mdash;"}</td>'
            f'</tr>'
        )
    body = f"""<section class="hero">
  <div class="wrap">
    <div class="crumbs"><a href="/gov">Gov.in Directory</a> / {esc(crumb)}</div>
    <div class="kicker">{esc(kicker)}</div>
    <h1>{esc(h1)}</h1>
    <p>{lede}</p>
  </div>
</section>
<section class="sec"><div class="wrap">
  <div class="tbl-wrap"><table class="sortable">
    <thead><tr><th>Hostname</th><th>Institution / Portal</th><th>Kind</th><th>State / Tier</th><th>Provenance &amp; DNS</th><th>Tranco</th></tr></thead>
    <tbody>{"".join(trs)}</tbody>
  </table></div>
</div></section>"""
    return page_shell(title=title, desc=desc, canonical=canonical, active=active, body=body)


def build_exports(snap: dict, out: str):
    records = snap["records"]
    kind_keys = [k for k, _, _ in KIND_META]
    tier_keys = [k for k, _, _ in TIER_META]
    kind_idx = {k: i for i, k in enumerate(kind_keys)}
    tier_idx = {k: i for i, k in enumerate(tier_keys)}
    states = sorted({r["state"] for r in records if r.get("state")})
    state_idx = {s: i for i, s in enumerate(states)}
    ministries = sorted({r["ministry"] for r in records if r.get("ministry")})
    min_idx = {m: i for i, m in enumerate(ministries)}

    rows = []
    for r in records:
        rows.append([
            r["domain"],
            r["root_domain"],
            r["url"],
            r["name"],
            kind_idx[r["kind"]],
            tier_idx[r["tier"]],
            state_idx[r["state"]] if r.get("state") else -1,
            min_idx[r["ministry"]] if r.get("ministry") else -1,
            r["provenance"],
            r["dns_status"],
            r["tranco_rank"],
            r["preserved_urls_count"],
            ",".join(r["sources"]),
            r.get("note") or "",
            1 if r["role"] == "infrastructure" else 0,
            r.get("redirect_to") or "",
            1 if r["in_igod"] else 0,
        ])

    payload = {
        "meta": {
            "generated_on": snap["meta"]["generated_on"],
            "dns_checked_at": snap["meta"].get("dns_checked_at", snap["meta"]["generated_on"]),
            "total_domains": snap["meta"]["total_domains"],
        },
        "kinds": [[k, lbl] for k, lbl, _ in KIND_META],
        "tiers": [[k, lbl] for k, lbl, _ in TIER_META],
        "states": states,
        "ministries": ministries,
        "rows": rows,
    }
    json_path = os.path.join(out, "gov", "data", "gov-domains.json")
    os.makedirs(os.path.dirname(json_path), exist_ok=True)
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))

    csv_path = os.path.join(out, "gov", "gov-in-websites.csv")
    with open(csv_path, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow([
            "domain", "root_domain", "url", "name", "role", "tier", "kind", "state", "ministry",
            "provenance", "in_igod", "dns_status", "dns_checked_at", "redirect_to", "tranco_rank",
            "preserved_urls_count", "sources",
        ])
        for r in records:
            w.writerow([
                csv_safe(r["domain"]),
                csv_safe(r["root_domain"]),
                csv_safe(r["url"]),
                csv_safe(r["name"]),
                csv_safe(r["role"]),
                csv_safe(r["tier"]),
                csv_safe(r["kind"]),
                csv_safe(r.get("state") or ""),
                csv_safe(r.get("ministry") or ""),
                csv_safe(r["provenance"]),
                "true" if r["in_igod"] else "false",
                csv_safe(r["dns_status"]),
                csv_safe(r.get("dns_checked_at") or ""),
                csv_safe(r.get("redirect_to") or ""),
                "" if r.get("tranco_rank") is None else str(r["tranco_rank"]),
                str(r.get("preserved_urls_count", 1)),
                csv_safe(",".join(r["sources"])),
            ])


def build(out: str):
    if not os.path.exists(DATA_PATH):
        raise SystemExit(f"Missing {DATA_PATH}; run python3 gov/harvest.py first")
    with open(DATA_PATH, encoding="utf-8") as f:
        snap = json.load(f)

    records = snap["records"]
    write_both(out, "", build_main_hub(snap))
    write_both(out, "ministries", build_subpage_ministries(snap))

    reg_rows = [r for r in records if r["kind"] == "regulator" or r["tier"] == "apex"]
    write_both(
        out,
        "regulators",
        render_static_table_page(
            title="Regulators, Statutory & Apex Bodies (.gov.in) — Gov.DataLibertarian",
            desc="Compiled regulators, statutory bodies, constitutional/apex bodies, and commissions with .gov.in hostnames.",
            canonical="https://gov.datalibertarian.in/regulators",
            active="regulators",
            crumb="Regulators & Apex Bodies",
            kicker=f"Regulators, statutory bodies & commissions · {inr(len(reg_rows))} hostnames",
            h1="Regulators, Commissions & Apex Bodies on .gov.in",
            lede=f"Compiled statutory bodies, regulatory commissions, and apex/constitutional authorities listed with a <code>.gov.in</code> hostname. <a href='/gov#directory'>Back to full directory &rarr;</a>",
            rows=reg_rows,
        ),
    )

    lc_rows = [r for r in records if r["kind"] in ("district", "local", "court", "legislature")]
    write_both(
        out,
        "local-and-courts",
        render_static_table_page(
            title="Districts, Local Bodies, Courts & Legislatures (.gov.in) — Gov.DataLibertarian",
            desc="Compiled district collectorates, municipal corporations, panchayats, courts, tribunals and legislatures on .gov.in.",
            canonical="https://gov.datalibertarian.in/local-and-courts",
            active="local-and-courts",
            crumb="Local & Courts",
            kicker=f"Districts, local bodies, courts & legislatures · {inr(len(lc_rows))} hostnames",
            h1="Districts, Municipal & Panchayat Bodies, Courts & Legislatures",
            lede=f"Compiled district portals, urban local bodies, Panchayati Raj websites, courts, tribunals, Parliament and state legislatures on <code>.gov.in</code>. <a href='/gov#directory'>Back to full directory &rarr;</a>",
            rows=lc_rows,
        ),
    )

    uncharted_rows = [r for r in records if (not r["in_igod"] and r["dns_live"]) or (r["in_igod"] and not r["dns_live"])]
    uncharted_live = sum(1 for r in records if not r["in_igod"] and r["dns_live"])
    igod_unres = sum(1 for r in records if r["in_igod"] and not r["dns_live"])
    write_both(
        out,
        "uncharted",
        render_static_table_page(
            title="Non-IGOD Resolving & Unresolved IGOD Domains (.gov.in) — Gov.DataLibertarian",
            desc="Resolving .gov.in hostnames absent from igod.gov.in, plus IGOD-listed .gov.in hostnames with no DNS record or lookup timeout.",
            canonical="https://gov.datalibertarian.in/uncharted",
            active="uncharted",
            crumb="Uncharted & Unresolved",
            kicker=f"{inr(uncharted_live)} resolving outside IGOD · {inr(igod_unres)} IGOD entries unresolved in DNS",
            h1="Resolving .gov.in hosts outside IGOD &amp; unresolved IGOD links",
            lede=f"<strong>{inr(uncharted_live)}</strong> resolving <code>.gov.in</code> hostnames are absent from <code>igod.gov.in</code> listings (found via official links, DL registers, or passive DNS/archives); conversely, <strong>{inr(igod_unres)}</strong> IGOD-listed hosts returned no DNS record or a timeout on probe.",
            rows=uncharted_rows[:1500],
        ),
    )

    build_exports(snap, out)

    line = "<b>%s</b> .gov.in hostnames &middot; %s DNS resolved" % (
        inr(snap["meta"]["total_domains"]),
        inr(snap["meta"]["dns_live_domains"]),
    )
    for name in ("index.html", "snapshot.html"):
        p = os.path.join(out, name)
        if os.path.exists(p):
            with open(p, encoding="utf-8") as f:
                t = f.read()
            if "<!--@count:gov-->" in t:
                with open(p, "w", encoding="utf-8") as f:
                    f.write(fill(t, "count:gov", line))

    print(
        f"gov: built {snap['meta']['total_domains']} .gov.in domains "
        f"({snap['meta']['dns_live_domains']} DNS live, {snap['reconciliation']['ministries_total']} Union ministries/depts)"
    )


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", default="dist")
    build(ap.parse_args().out)
