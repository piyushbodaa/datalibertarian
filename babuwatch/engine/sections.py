"""Copwatch sections beyond court records, rendered inside the engine's build.

Called once from build.main() (after record pages, before the sitemap and the final
name scrub, so every page written here is scrubbed and leak-checked like the rest):

    extra_urls = sections.build(B, cases, t2public)

B is the engine module itself (page_shell, write, esc, fmt helpers, profile P).
This module holds NO watch-specific copy: every sentence comes from the profile's
``P["sections"]`` dict. A watch without that dict gets no extra sections.

Sections (each optional, switched on by its data file in the primary dataset dir):
  /places, /places/<state>, /places/<state>/<district>, /station/<state>/<station>
                     every record grouped by district and police station
  /commissions[...]  findings of statutory bodies (commissions.json)
  /follow-up         what happened after money was ordered (court orders + NHRC listings)
  /compliance        court orders on police-station CCTV (cctv.json) and arrest safeguards
  /charged           trapped / charged, not convicted (charged.json); noindex, no sitemap
"""
import json
import os
import re
from collections import Counter, defaultdict

SAFEGUARDS = [  # (key, label, pattern over the public summary + quote + sections)
    ("cctv", "CCTV in the police station", r"\bCCTV\b|camera feed|\bDVR\b"),
    ("grounds", "Grounds of arrest not given", r"grounds of arrest|Article 22\b|Mihir Rajesh Shah|Prabir Purkayastha"),
    ("dk_basu", "D.K. Basu arrest safeguards", r"D\.?\s?K\.?\s?Basu"),
    ("arnesh", "Arnesh Kumar: unnecessary arrest", r"Arnesh Kumar|Section 41-?A|Section 35\(3\)"),
    ("magistrate", "Not produced before a magistrate", r"(?:not|never|without being) produced before (?:a|the) (?:Magistrate|magistrate)|24 hours"),
]


def _load(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


_BAD_STATION = re.compile(
    r"(?i)\b(police|court|judge|sessions|magistrate|additional|commissioner|range|zone|wing|branch|unit|"
    r"department|headquarters|office|cell|squad|cid|nib|traffic|crime|special|district|dist|"
    r"state|division|circle|delhi|and|to|of|the|in|at|vide|case|no)\b")
_STATION_SEG = re.compile(r"(?i)\b(?:p\.\s?s\.?|ps|police station|thana)\b")


def _station_name(text, district=None, city=None, state=None):
    """'P.S. George Town, District Prayagraj' -> 'George Town'; None unless a station is clearly named."""
    if not text:
        return None
    drop = {w.lower() for w in re.findall(r"[A-Za-z]+", " ".join(x for x in (district, city, state) if x))}
    for seg in re.split(r"[,;()/]| and ", re.sub(r"\s+", " ", str(text))):
        if not _STATION_SEG.search(seg):
            continue
        name = _STATION_SEG.sub(" ", seg)
        name = re.sub(r"^\s*[A-Z]\s?[-.]?\s?\d+\s+", " ", name)      # Chennai-style codes: "E-2 Royapettah"
        words = [w for w in re.findall(r"[A-Za-z][A-Za-z.'-]*", name)]
        words = [w for w in words if w.lower().strip(".") not in drop]
        if not words or len(words) > 3:
            continue
        cand = " ".join(words).strip(" .-")
        if (len(cand) < 3 or _BAD_STATION.search(cand) or not cand[0].isupper()
                or any(w[0].islower() for w in words)):
            continue
        return cand
    return None


def _district_key(d):
    if not d:
        return None
    d = re.sub(r"\(.*?\)", "", str(d)).strip()
    d = re.sub(r"(?i)\b(district|dist\.?)\b", "", d).strip(" ,.-")
    if not d or re.match(r"(?i)^(unknown|not stated|n/?a|\.+|delhi)$", d):
        return None
    return d


def build(B, cases, t2public):
    P, T = B.P, B.P.get("sections")
    if not T:
        return []
    esc, slugify, write, DIST = B.esc, B.slugify, B.write, B.DIST
    data_dir = B.PRIMARY
    comm = _load(os.path.join(data_dir, "commissions.json"), [])
    cctv = _load(os.path.join(data_dir, "cctv.json"), [])
    charged = _load(os.path.join(data_dir, "charged.json"), [])
    urls = []

    def page(path, title, desc, main, route, noindex=False, md=True):
        extra = '<meta name="robots" content="noindex, follow">' if noindex else ""
        html = B.page_shell(title, desc, path, main, route=route, extra_head=extra)
        if noindex:
            html = html.replace('<meta name="robots" content="index, follow">', "")
        write(os.path.join(DIST, path.strip("/"), "index.html"), html)
        if md:
            write(os.path.join(DIST, path.strip("/"), "index.md"), B.md_evergreen(title, path, main))
        if not noindex:
            urls.append(path)

    def head(eyebrow, h1, sub_html):
        return ('\n  <header class="tracker-pagehead"><div class="wrap"><div class="eyebrow">%s</div>'
                '<h1>%s</h1><p>%s</p></div></header>\n' % (esc(eyebrow), esc(h1), sub_html))

    def section(inner, label=""):
        return ('  <section class="section" aria-label="%s"><div class="wrap">\n%s\n  </div></section>\n'
                % (esc(label), inner))

    def stat(n, lab):
        return '<div class="stat"><div class="n">%s</div><div class="l">%s</div></div>' % (n, esc(lab))

    def stats(items):
        return '<div class="xs-stats">%s</div>' % "".join(stat(n, l) for n, l in items)

    def notice(html):
        return '<div class="tracker-notice">%s</div>' % html

    def money(n):
        return B.fmt_inr(n) if n else "&mdash;"

    def total(n):
        """Headline totals: crore / lakh, one or two decimals."""
        if not n:
            return "&mdash;"
        if n >= 10 ** 7:
            return "Rs %s crore" % ("%.2f" % (n / 10 ** 7)).rstrip("0").rstrip(".")
        if n >= 10 ** 5:
            return "Rs %s lakh" % ("%.1f" % (n / 10 ** 5)).rstrip("0").rstrip(".")
        return B.fmt_inr(n)

    def date(d):
        return B.fmt_date(d) if d else "Date not stated"

    def table(cols, rows, cls=""):
        th = "".join("<th scope=\"col\">%s</th>" % esc(c) for c in cols)
        body = "".join("<tr>%s</tr>" % "".join("<td>%s</td>" % c for c in r) for r in rows)
        return ('<div class="xs-table-wrap"><table class="xs-table %s"><thead><tr>%s</tr></thead>'
                '<tbody>%s</tbody></table></div>' % (cls, th, body))

    # ------------------------------------------------------------------ record views shared by pages
    def court_item(c):
        rid = c.get("record_id") or c.get("merged_id")
        url = B.rec_path(c, "incident", rid)
        comp = c.get("compensation_inr")
        return {"kind": "court", "date": c.get("judgment_date"), "state": c.get("state"),
                "district": _district_key(c.get("district")),
                "station": _station_name(c.get("police_station_or_unit"), c.get("district"), c.get("city_town"), c.get("state")),
                "html": '<li><a href="%s">%s</a> <span class="xs-tag">%s</span> &middot; %s%s<br><span class="xs-sum">%s</span></li>'
                        % (esc(url), esc(c.get("display_title") or rid), esc(T["kind_court"]),
                           esc(date(c.get("judgment_date"))),
                           (" &middot; %s ordered" % money(comp)) if comp else "",
                           esc((c.get("summary") or "")[:260] + ("…" if len(c.get("summary") or "") > 260 else "")))}

    def trial_item(r):
        rid = B.t2_id(r)
        url = B.rec_path(r, "trial-court", rid)
        unit = " ".join(o.get("unit") or "" for o in r.get("officers") or [])
        return {"kind": "trial", "date": r.get("conviction_date"), "state": r.get("state"),
                "district": _district_key(r.get("district")), "station": _station_name(unit, r.get("district"), None, r.get("state")),
                "service": r.get("service"),
                "html": '<li><a href="%s">%s</a> <span class="xs-tag">%s</span> &middot; %s<br><span class="xs-sum">%s</span></li>'
                        % (esc(url), esc(r.get("case_title_or_number") or rid), esc(T["kind_trial"]),
                           esc(B.t2_date_display(r)),
                           esc((r.get("summary") or "")[:260] + ("…" if len(r.get("summary") or "") > 260 else "")))}

    def comm_url(r):
        return "/commissions/%s" % r["id"]

    def comm_item(r):
        return {"kind": "commission", "date": r.get("date"), "state": r.get("state"),
                "district": _district_key(r.get("district")),
                "station": _station_name(r.get("police_station"), r.get("district"), None, r.get("state")),
                "html": '<li><a href="%s">%s</a> <span class="xs-tag">%s</span> &middot; %s%s &middot; %s</li>'
                        % (esc(comm_url(r)), esc(r["nature"]), esc(r["body_name"]), esc(date(r.get("date"))),
                           (" &middot; %s" % money(r["relief_inr"])) if r.get("relief_inr") else "",
                           esc(r["status_label"]))}

    def cctv_item(r):
        return {"kind": "cctv", "date": r["date"], "state": r["state"], "district": _district_key(r.get("district")),
                "station": _station_name(r.get("police_station"), r.get("district"), None, r.get("state")),
                "html": '<li><span class="xs-tag">%s</span> %s, %s &middot; <a href="%s" rel="noopener">%s</a><br>'
                        '<q class="xs-quote">%s</q> <span class="xs-who">(%s)</span></li>'
                        % (esc(r["kind_label"]), esc(r["court"]), esc(date(r["date"])), esc(r["url"]),
                           esc(r.get("case_no") or T["read_order"]), esc(r["quote"]), esc(r["speaker_label"]))}

    def charged_item(r):
        return {"kind": "charged", "date": r["date"], "state": r["state"], "district": _district_key(r.get("district")),
                "station": _station_name(r.get("police_station"), r.get("district"), None, r.get("state")),
                "html": '<li><span class="xs-tag xs-tag-warn">%s</span> %s<br><span class="xs-sum">%s</span></li>'
                        % (esc(T["kind_charged"]), esc(date(r["date"])), esc(r["summary"]))}

    items = ([court_item(c) for c in cases if c.get("service", "police") == "police" or c.get("force")]
             + [trial_item(r) for r in t2public if (r.get("service") or "police") == "police"]
             + [comm_item(r) for r in comm] + [cctv_item(r) for r in cctv] + [charged_item(r) for r in charged])

    def grouped_list(its):
        order = ["court", "trial", "commission", "cctv", "charged"]
        out = []
        for k in order:
            sub = sorted((i for i in its if i["kind"] == k), key=lambda i: i["date"] or "", reverse=True)
            if not sub:
                continue
            out.append('<h2 class="xs-h2">%s <span class="xs-count">%d</span></h2><ul class="xs-list">%s</ul>'
                       % (esc(T["group_" + k]), len(sub), "".join(i["html"] for i in sub)))
            if k == "charged":
                out.append(notice(T["charged_inline_notice"]))
        return "\n".join(out)

    # ------------------------------------------------------------------ /places
    by_state = defaultdict(list)
    for i in items:
        if i["state"]:
            by_state[i["state"]].append(i)
    rows = []
    for st in sorted(by_state):
        its = by_state[st]
        c = Counter(i["kind"] for i in its)
        rows.append(['<a href="/places/%s">%s</a>' % (slugify(st), esc(st)), str(c["court"]), str(c["trial"]),
                     str(c["commission"]), str(c["cctv"] + c["charged"])])
    page("/places", T["places_title"], T["places_desc"],
         head(T["places_eyebrow"], T["places_title"], T["places_intro"])
         + section(table(T["places_cols"], rows)), "/places")

    station_pages = {}
    for st, its in sorted(by_state.items()):
        dists = defaultdict(list)
        no_dist = []
        for i in its:
            (dists[i["district"]] if i["district"] else no_dist).append(i)
        drows = []
        for d in sorted(dists):
            dl = dists[d]
            c = Counter(i["kind"] for i in dl)
            drows.append(['<a href="/places/%s/%s">%s</a>' % (slugify(st), slugify(d), esc(d)),
                          str(c["court"]), str(c["trial"]), str(c["commission"]), str(c["cctv"] + c["charged"])])
            stations = defaultdict(list)
            for i in dl:
                if i["station"]:
                    stations[i["station"]].append(i)
            srows = "".join('<li><a href="/station/%s/%s">%s</a> <span class="xs-count">%d</span></li>'
                            % (slugify(st), slugify(s), esc(s), len(v))
                            for s, v in sorted(stations.items(), key=lambda kv: (-len(kv[1]), kv[0])))
            for s, v in stations.items():
                station_pages[(st, s)] = (d, v)
            main = (head(st, "%s, %s" % (d, st), T["district_intro"])
                    + section(('<h2 class="xs-h2">%s</h2><ul class="xs-stations">%s</ul>'
                               % (esc(T["stations_heading"]), srows) if srows else "")
                              + grouped_list(dl)))
            page("/places/%s/%s" % (slugify(st), slugify(d)), "%s, %s: %s" % (d, st, T["district_title_tail"]),
                 T["district_desc"].replace("{{place}}", "%s, %s" % (d, st)), main, "/places")
        main = (head(T["places_eyebrow"], st, T["state_intro"])
                + section((table(T["district_cols"], drows) if drows else "")
                          + ('<h2 class="xs-h2">%s</h2>%s' % (esc(T["state_no_district"]), grouped_list(no_dist))
                             if no_dist else "")))
        page("/places/%s" % slugify(st), "%s: %s" % (st, T["district_title_tail"]),
             T["district_desc"].replace("{{place}}", st), main, "/places")
    for (st, s), (d, v) in sorted(station_pages.items()):
        main = (head("%s, %s" % (d, st), "%s %s" % (s, T["station_word"]), T["station_intro"])
                + section(grouped_list(v)))
        page("/station/%s/%s" % (slugify(st), slugify(s)), "%s %s, %s" % (s, T["station_word"], d),
             T["district_desc"].replace("{{place}}", "%s %s, %s" % (s, T["station_word"], d)), main, "/places")

    # ------------------------------------------------------------------ /commissions
    if comm:
        unpaid = [r for r in comm if r["status"] in ("pending", "challenged", "refused")]
        nhrc = [r for r in comm if r["body"] == "nhrc"]
        srows = []
        bys = defaultdict(list)
        for r in comm:
            bys[r["state"]].append(r)
        for st in sorted(bys, key=lambda s: -sum(x["relief_inr"] or 0 for x in bys[s])):
            rs = bys[st]
            srows.append(['<a href="/commissions/state/%s">%s</a>' % (slugify(st), esc(st)), str(len(rs)),
                          total(sum(x["relief_inr"] or 0 for x in rs)),
                          str(sum(1 for x in rs if x["status"] in ("pending", "challenged", "refused")))])
        nat = Counter(r["nature"] for r in comm).most_common(12)
        main = (head(T["comm_eyebrow"], T["comm_title"], T["comm_intro"])
                + section(stats([(B.fmt_thousands(len(comm)), T["comm_stat_n"]),
                                 (total(sum(r["relief_inr"] or 0 for r in nhrc)), T["comm_stat_amt"]),
                                 (B.fmt_thousands(len(unpaid)), T["comm_stat_unpaid"])])
                          + notice(T["comm_notice"])
                          + '<h2 class="xs-h2">%s</h2>' % esc(T["comm_by_state"]) + table(T["comm_cols"], srows)
                          + '<h2 class="xs-h2">%s</h2>' % esc(T["comm_by_nature"])
                          + table(T["comm_nature_cols"], [[esc(n), str(k)] for n, k in nat])
                          + '<p class="xs-more"><a href="/charged">%s</a></p>' % esc(T["charged_link"])))
        page("/commissions", T["comm_title"], T["comm_desc"], main, "/commissions")
        for st, rs in bys.items():
            lis = "".join(comm_item(r)["html"] for r in sorted(rs, key=lambda r: r.get("date") or "", reverse=True))
            main = (head(T["comm_eyebrow"], "%s: %s" % (st, T["comm_title"]), T["comm_state_intro"])
                    + section(notice(T["comm_notice"]) + '<ul class="xs-list">%s</ul>' % lis))
            page("/commissions/state/%s" % slugify(st), "%s: %s" % (st, T["comm_title"]),
                 T["comm_desc"], main, "/commissions")
        for r in comm:
            facts = [(T["f_body"], esc(r["body_name"])), (T["f_case"], esc(r.get("case_no") or T["not_stated"])),
                     (T["f_state"], '<a href="/places/%s">%s</a>' % (slugify(r["state"]), esc(r["state"]))),
                     (T["f_station"], esc(r.get("police_station") or T["not_stated"])),
                     (T["f_nature"], esc(r["nature"])), (T["f_relief"], money(r.get("relief_inr"))),
                     (r.get("date_label") or T["f_date"], esc(date(r.get("date")))),
                     (T["f_status"], "%s (%s)" % (esc(r["status_label"]), esc(date(r.get("status_as_of")))))]
            dl = "".join("<dt>%s</dt><dd>%s</dd>" % (esc(k), v) for k, v in facts)
            lst = "".join('<li>%s &middot; %s &middot; <a href="%s" rel="noopener">%s</a>%s</li>'
                          % (esc(l["report"]), esc(T["table_" + l["table"]]), esc(l["url"]), esc(T["open_report"]),
                             (" " + esc(T["at_line"]).replace("{{n}}", str(l["line"]))) if l.get("line") else "")
                          for l in r["listings"])
            main = (head(r["body_name"], "%s: %s" % (r["nature"], r["state"]), esc(r["summary"]))
                    + section('<dl class="xs-facts">%s</dl><h2 class="xs-h2">%s</h2><ul class="xs-list">%s</ul>%s'
                              % (dl, esc(T["comm_listings"]), lst, notice(T["comm_record_notice"]))))
            page(comm_url(r), "%s, %s (%s)" % (r["nature"], r["state"], r.get("case_no") or r["id"]),
                 r["summary"][:300], main, "/commissions", md=False)

    # ------------------------------------------------------------------ /follow-up
    ordered = [c for c in cases if c.get("compensation_inr")]
    paid_rx = re.compile(r"(?i)(paid|disbursed|deposited|payment (?:has been )?made)")
    rows = []
    for c in sorted(ordered, key=lambda c: c.get("judgment_date") or "", reverse=True):
        rid = c.get("record_id") or c.get("merged_id")
        later = " ".join(json.dumps(x, ensure_ascii=False) for x in (c.get("later_proceedings") or []))
        status = T["fu_paid_record"] if paid_rx.search(later) else T["fu_unverified"]
        rows.append(['<a href="%s">%s</a>' % (esc(B.rec_path(c, "incident", rid)), esc(rid)), esc(c.get("state") or ""),
                     esc(date(c.get("judgment_date"))), money(c["compensation_inr"]), esc(status)])
    nh_unpaid = [r for r in comm if r["status"] in ("pending", "challenged", "refused")]
    by_st = defaultdict(lambda: [0, 0])
    for r in nh_unpaid:
        by_st[r["state"]][0] += 1
        by_st[r["state"]][1] += r["relief_inr"] or 0
    nrows = [['<a href="/commissions/state/%s">%s</a>' % (slugify(s), esc(s)), str(v[0]), total(v[1])]
             for s, v in sorted(by_st.items(), key=lambda kv: -kv[1][1])]
    main = (head(T["fu_eyebrow"], T["fu_title"], T["fu_intro"])
            + section(stats([(B.fmt_thousands(len(ordered)), T["fu_stat_court"]),
                             (total(sum(c["compensation_inr"] for c in ordered)), T["fu_stat_court_amt"]),
                             (B.fmt_thousands(len(nh_unpaid)), T["fu_stat_nhrc"]),
                             (total(sum(r["relief_inr"] or 0 for r in nh_unpaid)), T["fu_stat_nhrc_amt"])])
                      + '<h2 class="xs-h2">%s</h2><p>%s</p>' % (esc(T["fu_nhrc_h"]), T["fu_nhrc_p"])
                      + table(T["fu_nhrc_cols"], nrows)
                      + '<h2 class="xs-h2">%s</h2><p>%s</p>' % (esc(T["fu_court_h"]), T["fu_court_p"])
                      + table(T["fu_court_cols"], rows)
                      + '<h2 class="xs-h2" id="rti">%s</h2>%s<pre class="xs-rti">%s</pre>'
                      % (esc(T["fu_rti_h"]), T["fu_rti_p"], esc(T["fu_rti_text"]))))
    page("/follow-up", T["fu_title"], T["fu_desc"], main, "/follow-up")

    # ------------------------------------------------------------------ /compliance
    sg = defaultdict(list)
    for c in cases:
        blob = " ".join(str(c.get(k) or "") for k in ("summary", "court_quote")) + " " + " ".join(c.get("sections") or [])
        for key, lab, rx in SAFEGUARDS:
            if re.search(rx, blob):
                sg[key].append(c)
    sg_rows = [[esc(lab), str(len(sg[key])),
                ", ".join('<a href="%s">%s</a>' % (esc(B.rec_path(c, "incident", c.get("record_id") or c["merged_id"])),
                                                   esc(c.get("record_id") or c["merged_id"]))
                          for c in sorted(sg[key], key=lambda c: c.get("judgment_date") or "", reverse=True)[:8])]
               for key, lab, _ in SAFEGUARDS]
    cby = defaultdict(list)
    for r in cctv:
        cby[r["state"]].append(r)
    cctv_html = "".join('<h3 class="xs-h3">%s</h3><ul class="xs-list">%s</ul>'
                        % (esc(st), "".join(cctv_item(r)["html"] for r in sorted(rs, key=lambda r: r["date"], reverse=True)))
                        for st, rs in sorted(cby.items()))
    main = (head(T["cp_eyebrow"], T["cp_title"], T["cp_intro"])
            + section('<h2 class="xs-h2">%s</h2><p>%s</p>%s' % (esc(T["cp_cctv_h"]), T["cp_cctv_p"], cctv_html)
                      + '<h2 class="xs-h2">%s</h2><p>%s</p>' % (esc(T["cp_sg_h"]), T["cp_sg_p"])
                      + table(T["cp_sg_cols"], sg_rows)))
    page("/compliance", T["cp_title"], T["cp_desc"], main, "/compliance")

    # ------------------------------------------------------------------ /charged (noindex)
    if charged:
        lis = "".join(charged_item(r)["html"] for r in sorted(charged, key=lambda r: r["date"], reverse=True))
        main = (head(T["ch_eyebrow"], T["ch_title"], T["ch_intro"])
                + section(notice(T["ch_notice"]) + '<ul class="xs-list">%s</ul>' % lis))
        page("/charged", T["ch_title"], T["ch_desc"], main, "/commissions", noindex=True)

    # machine-readable copies of the new datasets
    for name, data in (("commissions.json", comm), ("cctv.json", cctv)):
        write(os.path.join(DIST, "data", name), json.dumps(data, ensure_ascii=False))
    print("sections: %d pages (%d commission records, %d station pages, %d CCTV orders, %d charged)"
          % (len(urls) + (1 if charged else 0), len(comm), len(station_pages), len(cctv), len(charged)))
    return urls


CSS = """
/* Copwatch sections (engine/sections.py) */
.xs-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:8px 0 20px}
.xs-stats .stat{border:1px solid var(--line,#ddd);border-radius:10px;padding:14px}
.xs-stats .n{font-size:1.5rem;font-weight:700}
.xs-stats .l{font-size:.85rem;opacity:.8}
.xs-table-wrap{overflow-x:auto;margin:8px 0 24px}
.xs-table{border-collapse:collapse;width:100%;font-size:.92rem}
.xs-table th,.xs-table td{border-bottom:1px solid var(--line,#ddd);padding:8px 10px;text-align:left;vertical-align:top}
.xs-h2{margin:28px 0 10px;font-size:1.25rem}
.xs-h3{margin:18px 0 6px;font-size:1.05rem}
.xs-count{font-size:.85rem;opacity:.7;font-weight:400}
.xs-list{list-style:none;padding:0;margin:0}
.xs-list li{padding:10px 0;border-bottom:1px solid var(--line,#eee);overflow-wrap:anywhere}
.xs-stations{columns:2 220px;padding-left:18px}
.xs-tag{display:inline-block;font-size:.75rem;border:1px solid currentColor;border-radius:999px;padding:0 8px;opacity:.85}
.xs-tag-warn{color:#9a5b00}
.xs-sum,.xs-who{font-size:.9rem;opacity:.85}
.xs-quote{font-style:italic}
.xs-facts{display:grid;grid-template-columns:minmax(120px,max-content) 1fr;gap:6px 16px}
.xs-facts dt{font-weight:600}
.xs-facts dd{margin:0}
.xs-rti{white-space:pre-wrap;border:1px solid var(--line,#ddd);border-radius:10px;padding:14px;font-size:.9rem}
.xs-more{margin-top:20px}
"""
