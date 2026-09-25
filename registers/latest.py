#!/usr/bin/env python3
"""Fill the landing page's "Latest cases" block with the newest records of each register.

Runs last in the site build (npm run build:latest), after build:registers and
build:babuwatch, and fills <!--@latest-->...<!--@/latest--> in dist/index.html and
dist/snapshot.html. Babuwatch cards come from dist/babuwatch/data/index.json, the
engine's name-gated public index, never from the raw data files; register cards come
from registers/data/*.json, which hold no private names. If the Babuwatch index is
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


def card(href, tag, meta, title, summary):
    return ('<a class="case" href="%s"><div class="case-meta"><span class="tag">%s</span>%s</div>'
            '<div class="case-t">%s</div><div class="case-s">%s</div></a>'
            % (reg.esc(href), reg.esc(tag), reg.esc(meta), reg.esc(title), reg.esc(summary)))


def column(href, name, blurb, cards, more):
    return ('<div class="lat-col"><div class="lat-head"><a href="%s">%s &rarr;</a><span>%s</span></div>%s'
            '<a class="lat-more" href="%s">%s &rarr;</a></div>'
            % (reg.esc(href), reg.esc(name), reg.esc(blurb), "".join(cards), reg.esc(href), reg.esc(more)))


def babuwatch_column(out):
    path = os.path.join(out, "babuwatch", "data", "index.json")
    if not os.path.exists(path):
        return ""
    with open(path, encoding="utf-8") as f:
        rows = [r for r in json.load(f) if isinstance(r, dict) and r.get("jd")]
    newest = sorted(rows, key=lambda r: (r["jd"], r["id"]), reverse=True)
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
        title = "%s: %s" % (outcome, officer_short(r.get("ot"))) if r.get("ot") else outcome
        meta = " · ".join(x for x in (who, short_date(r["jd"]), r.get("st")) if x)
        cards.append(card("/babuwatch/%s/%s" % (kind, r["id"]), r.get("ca") or "Court record", meta,
                          title, clip(r.get("su"))))
    return column("/babuwatch/tracker", "Babuwatch", "police and civil servants found against by courts",
                  cards, "All Babuwatch records")


def register_column(key, name, blurb):
    data = reg.load(key)
    cards = []
    for r in reg.newest_first(data["records"])[:PER_COLUMN]:
        tag = reg.cat_label(data, r["category"])
        meta = " · ".join((reg.OUTCOME.get(r["outcome"], r["outcome"]), short_date(r["date"]), r["state"]))
        cards.append(card("/%s/%s" % (key, r["id"]), tag, meta, r["title"], clip(r["summary"])))
    return column("/" + key, name, blurb, cards, "All %s records" % name)


def build(out):
    html = babuwatch_column(out) + "".join(register_column(*c) for c in REGISTER_COLUMNS)
    for name in ("index.html", "snapshot.html"):
        path = os.path.join(out, name)
        if not os.path.exists(path):
            continue
        with open(path, encoding="utf-8") as f:
            page = f.read()
        if "<!--@latest-->" not in page:
            continue
        with open(path, "w", encoding="utf-8") as f:
            f.write(reg.fill(page, "latest", html))
        print("latest: filled %s" % name)


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", default="dist")
    build(ap.parse_args().out)
