#!/usr/bin/env python3
"""Fill the landing page's "Latest cases" block with the newest records of each register.

Runs last in the site build (npm run build:latest), after build:registers and
build:babuwatch, and fills <!--@latest-->...<!--@/latest--> in dist/index.html and
dist/snapshot.html. Babuwatch cards come from dist/babuwatch/data/index.json, the
engine's name-gated public index, never from the raw data files; register cards come
from registers/data/*.json, which hold no private names. It also fills the hero tally
(<!--@tally-->) and the Babuwatch count line (<!--@count:babuwatch-->). If the Babuwatch index is
missing (the watches were not built) that column is left out.

Python 3 stdlib only.
"""
import argparse
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build as reg  # noqa: E402

PER_COLUMN = 2
SUMMARY_CHARS = 230
REGISTER_COLUMNS = (
    ("civilliberties", "Civil Liberties", "punished for speaking, believing, assembling"),
    ("victimlesscrimes", "Victimless Crimes", "prosecuted where no one was harmed"),
    ("economicfreedom", "Economic Freedom", "penalised for trading and building freely"),
)
BW_OUTCOME = {
    "conviction": "Convicted",
    "trial_court_conviction": "Convicted",
    "conviction_by_hc": "Convicted by High Court",
    "conviction_by_sc": "Convicted by Supreme Court",
    "conviction_upheld": "Conviction upheld",
    "disciplinary_upheld": "Dismissal upheld",
    "adverse_finding_compensation": "Adverse court finding",
}


def short_date(d):
    m = re.fullmatch(r"(\d{4})-(\d{2})-(\d{2})", d or "")
    if not m:
        return d or ""
    y, mo, da = m.groups()
    return "%d %s %s" % (int(da), "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()[int(mo) - 1], y)


def clip(s, n=SUMMARY_CHARS):
    s = re.sub(r"\s+", " ", s or "").strip()
    if len(s) <= n:
        return s
    cut = s[:n].rsplit(" ", 1)[0].rstrip(",;:")
    return cut + "…"


def officer_short(ot):
    """First officer's post and first unit segment, parenthetical notes dropped."""
    parts = [p.strip() for p in re.split(r";\s*", ot or "") if p.strip()]
    if not parts:
        return ""
    first = re.sub(r"\s*\([^)]*\)", "", parts[0])
    first = ", ".join(first.split(", ")[:2])
    if len(parts) > 1:
        first += " and %d other%s" % (len(parts) - 1, "" if len(parts) == 2 else "s")
    return first


def card(href, plate, outcome, cat, title, summary, meta):
    return ('<a class="case" href="%s"><div class="case-top"><span class="plate">%s</span><span class="stamp">%s</span></div>'
            '<div class="case-cat">%s</div><div class="case-t">%s</div><div class="case-s">%s</div>'
            '<div class="case-meta">%s</div></a>'
            % (reg.esc(href), reg.esc(plate or "—"), reg.esc(outcome), reg.esc(cat), reg.esc(title),
               reg.esc(summary), reg.esc(meta)))


def column(no, href, name, blurb, cards, more):
    return ('<div class="lat-col"><div class="lat-head"><span class="lat-no">No. %s</span><a href="%s">%s</a>'
            '<span class="lat-blurb">%s</span></div>%s<a class="lat-more" href="%s">%s &rarr;</a></div>'
            % (no, reg.esc(href), reg.esc(name), reg.esc(blurb), "".join(cards), reg.esc(href), reg.esc(more)))


def babuwatch_rows(out):
    path = os.path.join(out, "babuwatch", "data", "index.json")
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as f:
        return [r for r in json.load(f) if isinstance(r, dict)]


def babuwatch_column(rows):
    newest = sorted((r for r in rows if r.get("jd")), key=lambda r: (r["jd"], r["id"]), reverse=True)
    if not newest:
        return ""
    picks = []
    for service in ("police", "civil"):  # one police, one civil servant, then newest overall
        pick = next((r for r in newest if r.get("sv") == service and r not in picks), None)
        if pick:
            picks.append(pick)
    picks += [r for r in newest if r not in picks][:max(0, PER_COLUMN - len(picks))]
    picks = sorted(picks[:PER_COLUMN], key=lambda r: (r["jd"], r["id"]), reverse=True)
    cards = []
    for r in picks:
        kind = "trial-court" if r.get("tier") == "trial" else "incident"
        outcome = BW_OUTCOME.get(r.get("ou"), (r.get("ou") or "").replace("_", " ").capitalize())
        who = "Police" if r.get("sv") == "police" else "Civil servant"
        title = officer_short(r.get("ot")) or r.get("ti") or ""
        meta = " · ".join(x for x in (short_date(r["jd"]), r.get("st"), r.get("co")) if x)
        cards.append(card("/babuwatch/%s/%s" % (kind, r["id"]), r.get("pl"), outcome,
                          "%s · %s" % (who, r.get("ca") or "court record"), title, clip(r.get("su")), meta))
    return column("01", "/babuwatch/tracker", "Babuwatch", "police and civil servants found against by courts",
                  cards, "All Babuwatch records")


def register_column(no, key, name, blurb, plates):
    data = reg.load(key)
    cards = []
    for r in reg.newest_first(data["records"])[:PER_COLUMN]:
        meta = " · ".join((short_date(r["date"]), r["state"]))
        cards.append(card("/%s/%s" % (key, r["id"]), plates.get(r["id"]), reg.OUTCOME.get(r["outcome"], r["outcome"]),
                          reg.cat_label(data, r["category"]), r["title"], clip(r["summary"]), meta))
    return column(no, "/" + key, name, blurb, cards, "All %s records" % name)


def babuwatch_count(rows):
    if not rows:
        return "court records"
    police = sum(1 for r in rows if r.get("sv") == "police")
    return "<b>%s</b>court records<br>%s police &middot; %s civil servants" % (
        format(len(rows), ","), format(police, ","), format(len(rows) - police, ","))


def tally(rows):
    counts = [("Babuwatch", len(rows))] + [(name, len(reg.load(key)["records"])) for key, name, _ in REGISTER_COLUMNS]
    body = "".join('<tr><td>%s</td><td class="n">%s</td></tr>' % (reg.esc(n), format(c, ",")) for n, c in counts)
    body += '<tr class="total"><td>Case records</td><td class="n">%s</td></tr>' % format(sum(c for _, c in counts), ",")
    body += '<tr class="sub"><td>Public enterprises inventoried</td><td class="n">%s</td></tr>' % format(
        len(reg.load("psu")["records"]), ",")
    return "<table>%s</table>" % body


def write_sitemaps(out):
    """Root sitemap becomes an index over the spending pages (prerender's
    sitemap), the registers and Babuwatch (audit 2026-09-25, finding 31)."""
    base = "https://datalibertarian.in"
    root = os.path.join(out, "sitemap.xml")
    parts = []
    if os.path.exists(root):
        with open(root, encoding="utf-8") as f:
            spa = f.read()
        if "<sitemapindex" not in spa:
            with open(os.path.join(out, "sitemap-spending.xml"), "w", encoding="utf-8") as f:
                f.write(spa)
            parts.append("/sitemap-spending.xml")
    urls = ["/"]
    for key in ("babuwatch", "civilliberties", "victimlesscrimes", "economicfreedom", "psu", "education"):
        if os.path.exists(os.path.join(out, key + ".html")) or os.path.isdir(os.path.join(out, key)):
            urls.append("/" + key)
    for key in ("civilliberties", "victimlesscrimes", "economicfreedom", "psu"):
        urls += ["/%s/%s" % (key, r["id"]) for r in reg.load(key)["records"]]
    with open(os.path.join(out, "sitemap-registers.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">%s</urlset>'
                % "".join("<url><loc>%s%s</loc></url>" % (base, u) for u in urls))
    parts.append("/sitemap-registers.xml")
    if os.path.exists(os.path.join(out, "babuwatch", "sitemap.xml")):
        parts.append("/babuwatch/sitemap.xml")
    with open(root, "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">%s</sitemapindex>'
                % "".join("<sitemap><loc>%s%s</loc></sitemap>" % (base, p) for p in parts))
    print("latest: sitemap index with %d sitemaps, %d register URLs" % (len(parts), len(urls)))


def build(out):
    write_sitemaps(out)
    rows = babuwatch_rows(out)
    with open(os.path.join(HERE, "plates.json"), encoding="utf-8") as f:
        plates = json.load(f)
    latest = babuwatch_column(rows) + "".join(
        register_column("%02d" % (i + 2), key, name, blurb, plates) for i, (key, name, blurb) in enumerate(REGISTER_COLUMNS))
    for name in ("index.html", "snapshot.html"):
        path = os.path.join(out, name)
        if not os.path.exists(path):
            continue
        with open(path, encoding="utf-8") as f:
            page = f.read()
        if "<!--@latest-->" not in page:
            continue
        page = reg.fill(page, "latest", latest)
        page = reg.fill(page, "tally", tally(rows))
        page = reg.fill(page, "count:babuwatch", babuwatch_count(rows))
        with open(path, "w", encoding="utf-8") as f:
            f.write(page)
        print("latest: filled %s" % name)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", default="dist")
    build(ap.parse_args().out)
