#!/usr/bin/env python3
"""Fill /education from education/data/udise.json (a committed UDISE+ snapshot).

Runs in the site build (npm run build:education) after vite has copied public/ into dist/.
It fills the marked blocks in dist/education/index.html, writes dist/education.html for
clean URLs, and fills the landing page's <!--@count:education--> line. Every figure is read
from the snapshot or is a stated division of two snapshot figures; nothing is estimated.

Python 3 stdlib only.
"""
import argparse
import html
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "data", "udise.json")
BOOKLET = "https://dashboard.udiseplus.gov.in/report2026/static/media/UDISE+2024_25_Booklet_nep.ea09e672a163f92d9cfe.pdf"
MG = [  # key suffix, label, css colour var (validated order: govt, private, aided, other)
    ("Govt", "Government", "govt"),
    ("Pvt", "Private unaided", "pvt"),
    ("GovtAided", "Government-aided", "aided"),
    ("Other", "Other", "other"),
]


def esc(s):
    return html.escape(str(s), quote=True)


def inr(n):
    """Indian digit grouping: 1466682 -> 14,66,682."""
    s = str(int(round(n)))
    neg, s = s.startswith("-"), s.lstrip("-")
    if len(s) > 3:
        head, tail = s[:-3], s[-3:]
        head = ",".join(re.findall(r"\d{1,2}(?=(?:\d{2})*$)", head))
        s = head + "," + tail
    return ("-" if neg else "") + s


def crore(n):
    return "%.2f crore" % (n / 1e7)


def pct(a, b):
    return 100.0 * a / b if b else 0.0


def fill(page, marker, content):
    pat = re.compile(r"(<!--@%s-->).*?(<!--@/%s-->)" % (re.escape(marker), re.escape(marker)), re.S)
    if not pat.search(page):
        raise SystemExit("education: marker %s not found" % marker)
    return pat.sub(lambda m: m.group(1) + content + m.group(2), page)


def hero(y, first, last, i, f):
    g, p = pct(i["totStudentGovt"], i["totStudents"]), pct(i["totStudentPvt"], i["totStudents"])
    g0, p0 = pct(f["totStudentGovt"], f["totStudents"]), pct(f["totStudentPvt"], f["totStudents"])
    sg, sp = i["totStudentGovt"] / i["totSchoolGovt"], i["totStudentPvt"] / i["totSchoolPvt"]
    sg0, sp0 = f["totStudentGovt"] / f["totSchoolGovt"], f["totStudentPvt"] / f["totSchoolPvt"]
    tiles = [
        (inr(i["totSchools"]), "schools in %s" % last, "%.1f%% run by the state" % pct(i["totSchoolGovt"], i["totSchools"])),
        ("%.1f%%" % g, "of students are in government schools", "%.1f%% in %s" % (g0, first)),
        ("%.1f%%" % p, "of students are in private schools", "%.1f%% in %s" % (p0, first)),
        ("%d · %d" % (round(sg), round(sp)), "students per government · private school", "%d · %d in %s" % (round(sg0), round(sp0), first)),
    ]
    t = "".join('<div class="tile"><div class="v">%s</div><div class="l">%s</div><div class="d">%s</div></div>' % tuple(map(esc, x))
                for x in tiles)
    return ('<section class="hero"><div class="wrap"><div class="kicker">Education ledger &middot; UDISE+ %s</div>'
            '<h1>Fewer than half of India&rsquo;s schoolchildren are in government schools.</h1>'
            '<p>In %s the state ran %.1f%% of India&rsquo;s %s schools but taught %.1f%% of its %s students, down from %.1f%% in %s. '
            'Private unaided schools, %.1f%% of all schools, taught %.1f%%. Every figure below is the Ministry of Education&rsquo;s own, from UDISE+.</p>'
            '<div class="tiles">%s</div></div></section>'
            % (esc(last), esc(last), pct(i["totSchoolGovt"], i["totSchools"]), inr(i["totSchools"]), g, crore(i["totStudents"]),
               g0, esc(first), pct(i["totSchoolPvt"], i["totSchools"]), p, t))


def share_fig(last, i):
    rows = []
    for label, tot, pre in (("Schools", "totSchools", "totSchool"), ("Students", "totStudents", "totStudent")):
        segs = []
        for suf, name, var in MG:
            v = i[pre + suf]
            s = pct(v, i[tot])
            segs.append('<span class="seg%s" tabindex="0" style="width:%.2f%%;background:var(--%s)" data-tip="%s"><b>%.1f%%</b></span>'
                        % (" small" if s < 6 else "", s, var, esc("%s · %.1f%% of %s · %s" % (name, s, label.lower(), inr(v))), s))
        rows.append('<span class="rl">%s</span><div class="bar" role="img" aria-label="%s">%s</div>'
                    % (label, esc("%s by management, %s: " % (label, last) + ", ".join(
                        "%s %.1f%%" % (n, pct(i[pre + s_], i[tot])) for s_, n, _ in MG)), "".join(segs)))
    legend = "".join('<span><i style="background:var(--%s)"></i>%s</span>' % (v, n) for _, n, v in MG)
    return ('<div class="fig"><h3>Share of schools and of students by management, %s</h3>'
            '<p class="cap">Government schools are over two-thirds of all schools but teach under half of all students.</p>'
            '<div class="legend">%s</div><div class="share" style="margin-top:34px">%s</div></div>' % (esc(last), legend, "".join(rows)))


def line_chart(title, cap, years, series, fmt, ymax, ystep, unit):
    W, H, L, R, T, B = 520, 250, 44, 70, 16, 30
    pw, ph = W - L - R, H - T - B
    xs = [L + (pw * k / (len(years) - 1) if len(years) > 1 else pw / 2) for k in range(len(years))]
    y = lambda v: T + ph - ph * v / ymax
    out = ['<svg viewBox="0 0 %d %d" role="img" aria-label="%s">' % (W, H, esc(title))]
    v = 0
    while v <= ymax + 1e-9:
        out.append('<line class="gl" x1="%d" x2="%d" y1="%.1f" y2="%.1f"/><text class="ax" x="%d" y="%.1f" text-anchor="end">%s</text>'
                   % (L, W - R, y(v), y(v), L - 8, y(v) + 4, esc(fmt(v))))
        v += ystep
    for k, yr in enumerate(years):
        out.append('<text class="ax" x="%.1f" y="%d" text-anchor="middle">%s</text>' % (xs[k], H - 8, esc(yr)))
    out.append('<line class="xh" x1="0" x2="0" y1="%d" y2="%d"/>' % (T, T + ph))
    for name, var, vals in series:
        pts = " ".join("%.1f,%.1f" % (xs[k], y(val)) for k, val in enumerate(vals))
        out.append('<polyline class="ln" points="%s" style="stroke:var(--%s)"/>' % (pts, var))
        for k, val in enumerate(vals):
            out.append('<circle class="dot" cx="%.1f" cy="%.1f" r="4" style="fill:var(--%s)"/>' % (xs[k], y(val), var))
        out.append('<text class="lab" x="%.1f" y="%.1f">%s</text>' % (xs[-1] + 9, y(vals[-1]) + 4, esc(fmt(vals[-1]))))
    step = xs[1] - xs[0] if len(xs) > 1 else pw
    for k, yr in enumerate(years):
        tipt = "%s · " % yr + " · ".join("%s %s" % (n, fmt(vals[k])) for n, _, vals in series) + unit
        out.append('<rect class="hit" x="%.1f" y="%d" width="%.1f" height="%d" data-x="%.1f" data-tip="%s"/>'
                   % (xs[k] - step / 2, T, step, ph, xs[k], esc(tipt)))
    out.append("</svg>")
    legend = "".join('<span><i style="background:var(--%s)"></i>%s</span>' % (v, n) for n, v, _ in series)
    return ('<div class="fig trend"><h3>%s</h3><p class="cap">%s</p><div class="legend">%s</div>%s</div>'
            % (esc(title), esc(cap), legend, "".join(out)))


def trend_figs(d):
    years = list(d["years"])
    ind = [d["years"][y]["india"] for y in years]
    share = line_chart("Share of students, %s to %s" % (years[0], years[-1]),
                       "Percentage of all enrolled students, government and private unaided schools.", years,
                       [("Government", "govt", [pct(i["totStudentGovt"], i["totStudents"]) for i in ind]),
                        ("Private unaided", "pvt", [pct(i["totStudentPvt"], i["totStudents"]) for i in ind])],
                       lambda v: "%.1f%%" % v if v % 1 else "%d%%" % v, 60, 20, "")
    per = line_chart("Students per school, %s to %s" % (years[0], years[-1]),
                     "Enrolled students divided by the number of schools of each kind.", years,
                     [("Government", "govt", [i["totStudentGovt"] / i["totSchoolGovt"] for i in ind]),
                      ("Private unaided", "pvt", [i["totStudentPvt"] / i["totSchoolPvt"] for i in ind])],
                     lambda v: "%d" % round(v), 300, 100, " students per school")
    return '<div class="pair">%s%s</div>' % (share, per)


def table(d):
    years = list(d["years"])
    first, last = years[0], years[-1]
    cur, old = d["years"][last], d["years"][first]
    cols = ["State / UT", "Schools", "Govt share of schools", "Students", "In govt schools", "In private schools",
            "Private share change since %s" % first, "Pupils per teacher, govt", "Pupils per teacher, private"]

    def row(name, r, o, cls=""):
        pv, pv0 = pct(r["totStudentPvt"], r["totStudents"]), pct(o["totStudentPvt"], o["totStudents"])
        ptg = r["totStudentGovt"] / r["totTchGovt"] if r["totTchGovt"] else None
        ptp = r["totStudentPvt"] / r["totTchPvt"] if r["totTchPvt"] else None
        cells = [(name, esc(name)), (r["totSchools"], inr(r["totSchools"])),
                 (pct(r["totSchoolGovt"], r["totSchools"]), "%.1f%%" % pct(r["totSchoolGovt"], r["totSchools"])),
                 (r["totStudents"], inr(r["totStudents"])),
                 (pct(r["totStudentGovt"], r["totStudents"]), "%.1f%%" % pct(r["totStudentGovt"], r["totStudents"])),
                 (pv, "%.1f%%" % pv), (pv - pv0, "%+.1f" % (pv - pv0)),
                 (ptg if ptg is not None else -1, "%.1f" % ptg if ptg is not None else "&mdash;"),
                 (ptp if ptp is not None else -1, "%.1f" % ptp if ptp is not None else "&mdash;")]
        return '<tr%s>%s</tr>' % (' class="%s"' % cls if cls else "", "".join(
            '<td data-v="%s">%s</td>' % (esc(v), s) for v, s in cells))
    body = [row("India", cur["india"], old["india"], "india")]
    names = sorted(cur["states"], key=lambda n: -pct(cur["states"][n]["totStudentPvt"], cur["states"][n]["totStudents"]))
    for n in names:
        body.append(row(n, cur["states"][n], old["states"].get(n, cur["states"][n])))
    head = "".join('<th scope="col">%s</th>' % esc(c) for c in cols)
    return ('<div class="tbl-wrap"><table class="sortable"><caption class="cap" style="caption-side:bottom;text-align:left;padding:10px 12px">'
            'UDISE+ %s; change against %s. Pupils per teacher is students divided by teachers in that kind of school.</caption>'
            '<thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>' % (esc(last), esc(first), head, "".join(body)))


def sources(d):
    years = ", ".join(d["years"])
    return ('<ul class="notes">'
            '<li><b>Source.</b> %s, <a href="%s">UDISE+ dashboard</a>. Counts come from its public open-data service (%s), '
            'snapshotted on %s for %s. The snapshot is stored in this site&rsquo;s repository, so the page never depends on the live service.</li>'
            '<li><b>Management categories</b> follow UDISE+: <i>Government</i> covers state and central government schools, including Kendriya Vidyalayas, '
            'Jawahar Navodaya Vidyalayas, Sainik and railway schools; <i>Government-aided</i> covers aided and partially aided schools; '
            '<i>Private unaided</i> means private unaided recognised schools; <i>Other</i> covers unrecognised schools, madrasas and '
            'Veda schools, gurukuls and pathashalas (<a href="%s">UDISE+ 2024-25 report, definitions</a>).</li>'
            '<li><b>Students</b> are enrolments from the foundational stage to class 12 as reported by schools. <b>Teachers</b> are teachers reported by schools.</li>'
            '<li><b>Derived figures.</b> Shares, students per school and pupils per teacher are simple divisions of the published counts. '
            'State rows add up exactly to the all-India totals in every year shown.</li>'
            '<li>The data file is at <a href="https://github.com/piyushbodaa/datalibertarian/blob/main/education/data/udise.json">education/data/udise.json</a>.</li>'
            '</ul>' % (esc(d["source"]), esc(d["source_url"]), esc(d["api"]), esc(d["fetched"]), esc(years), BOOKLET))


def build(out):
    with open(DATA, encoding="utf-8") as f:
        d = json.load(f)
    years = list(d["years"])
    first, last = years[0], years[-1]
    i, f0 = d["years"][last]["india"], d["years"][first]["india"]
    src = os.path.join(out, "education", "index.html")
    with open(src, encoding="utf-8") as f:
        page = f.read()
    page = fill(page, "edu-hero", hero(d, first, last, i, f0))
    page = fill(page, "edu-share", share_fig(last, i))
    page = fill(page, "edu-trend", trend_figs(d))
    page = fill(page, "edu-table", table(d))
    page = fill(page, "edu-sources", sources(d))
    for path in (src, os.path.join(out, "education.html")):
        with open(path, "w", encoding="utf-8") as f:
            f.write(page)
    line = "<b>%s</b>schools &middot; UDISE+ %s" % (inr(i["totSchools"]), esc(last))
    for name in ("index.html", "snapshot.html"):
        p = os.path.join(out, name)
        if os.path.exists(p):
            with open(p, encoding="utf-8") as f:
                t = f.read()
            if "<!--@count:education-->" in t:
                with open(p, "w", encoding="utf-8") as f:
                    f.write(fill(t, "count:education", line))
    print("education: %s, %d states/UTs, %s" % (last, len(d["years"][last]["states"]), ", ".join(years)))


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", default="dist")
    build(ap.parse_args().out)
