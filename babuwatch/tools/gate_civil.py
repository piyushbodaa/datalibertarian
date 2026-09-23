#!/usr/bin/env python3
"""gate_civil.py - turn PRIVATE civil-verified.jsonl + civil-v1.jsonl into the
PUBLIC-SAFE babuwatch/data/civil/tier2.json.

Published rows: every V2 row, plus every V1 row whose conviction itself is not in
doubt (owner decision 2026-09-23: civil records follow the same standard as the
police trial-court records, which publish V1). A V1 row whose reasons include
`missing_c_conviction_wording` or `acquittal_closer_than_conviction` is withheld:
only convictions publish. A published V1 row carries `verification_status: "V1"`
and a summary line saying what kept it from V2.

Every convicted official's name is WITHHELD: the two-key naming gate and lawyer review
have not been run for this dataset, so no record is published with a name.

  * officers[].name / name_public are null, publish_grade "unnamed";
  * every string field is scrubbed of each official's name and its variants
    (full runs, initials forms, surname-only tokens >= 4 chars that are not common
    words or place / court / department vocabulary), of honorific-led personal names
    ("Sri X", "Tr.X", "Smt. X") and of relation clauses ("S/o X");
  * the summary is REWRITTEN from structured fields (court, post, department, date,
    case number, sections, sentence) instead of scrubbing the extractor's prose, so
    complainants, co-accused and middlemen named there never reach the public file;
  * case_title_or_number is rebuilt from case-number fragments only (no party names);
  * victims are dropped (complainants are private persons).

After writing to a temp file the script reloads it and runs a LEAK ASSERTION: no token
run of >= 2 name tokens of any official in the private files, and no distinctive single
name token (>= 5 chars) of any published (V2 or V1) official, may appear anywhere in the public text
(case-insensitive, word boundaries). On any hit it deletes the temp file, leaves the
existing public file untouched, prints the hits and exits 1.

Python 3 standard library only. Deterministic.

Usage:
    python3 gate_civil.py [--private-dir <workspace>/private-data/babuwatch]
                          [--out <repo>/babuwatch/data/civil/tier2.json]
"""
from __future__ import annotations

import argparse
import collections
import datetime as dt
import json
import os
import re
import sys
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import verify_civil as vc  # noqa: E402  (shared name-form / date helpers)

WORKSPACE = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
DEFAULT_PRIVATE = os.path.join(WORKSPACE, "private-data", "babuwatch")
DEFAULT_OUT = os.path.abspath(os.path.join(HERE, "..", "data", "civil", "tier2.json"))
WITHHELD = "[name withheld]"

# V1 rows whose conviction itself is not established never publish ("only convictions").
OUTCOME_DOUBT = {"missing_c_conviction_wording", "acquittal_closer_than_conviction"}

# Plain-language glosses appended to a published V1 row's summary (static text; no names).
V1_GLOSS = {
    "missing_b_date_or_case_number":
        "the name and conviction wording are matched in the source entry, but the date "
        "or case number shown is as extracted from the entry and was not matched in the cited passage",
    "employing_body_not_stated": "the employing office is not stated in the source entry",
    "acquittal_wording_near_another_mention":
        "the source entry also contains acquittal wording near another mention of the name; "
        "who it covers is not stated",
    "acquittal_wording_elsewhere_in_entry":
        "the source entry also records an acquittal; who it covers is not stated",
    "co_accused_acquittal_in_same_entry": "a co-accused is recorded as acquitted in the same source entry",
    "initials_mismatch_single_token_name": "the name's initials could not be confirmed in the source entry",
    "psu_wording_in_source_entry": "the source entry also mentions a public-sector company",
}

AGENCY_DOC = {
    "karnataka-lokayukta": ("The Karnataka Lokayukta's annual report", "A Karnataka Lokayukta press note"),
    "tn-dvac": ("The Tamil Nadu Directorate of Vigilance and Anti-Corruption (DVAC) list",
                "A Tamil Nadu Directorate of Vigilance and Anti-Corruption (DVAC) press note"),
    "odisha-vigilance": ("An Odisha Vigilance bulletin", "An Odisha Vigilance press release"),
    "cbi": ("A Central Bureau of Investigation (CBI) list", "A Central Bureau of Investigation (CBI) press release"),
    "kerala-vacb": ("A Kerala Vigilance and Anti-Corruption Bureau list",
                    "A Kerala Vigilance and Anti-Corruption Bureau press note"),
    "punjab-vb": ("A Punjab Vigilance Bureau list", "A Punjab Vigilance Bureau press note"),
    "mp-lokayukta": ("The Madhya Pradesh Lokayukta's list of decisions", "A Madhya Pradesh Lokayukta press note"),
    "ap-acb": ("The Andhra Pradesh Anti-Corruption Bureau's list", "An Andhra Pradesh Anti-Corruption Bureau release"),
    "maharashtra-acb": ("The Maharashtra Anti-Corruption Bureau's list",
                        "A Maharashtra Anti-Corruption Bureau press release"),
}

# Words that are never treated as a surname on their own (designations, legal words,
# common English words, honorifics, administrative-unit words). Place and court
# vocabulary is added from the data. "mandal" was added on 2026-09-23 after the leak
# scan found it as a cross-row collision: one official's surname vs "Byrapura Mandal
# Panchayath" (an administrative unit) in another row's unit text.
COMMON = set("""
the and for with from that this then former formerly retd retired late office officer officers official
assistant clerk engineer inspector surveyor registrar accountant secretary manager superintendent director
commissioner village revenue district taluk block division section special judge court sessions magistrate
chief junior senior deputy additional joint principal public works department municipal corporation panchayat
panchayath council government state central union india police vigilance lokayukta bureau case crime judgment
judgement convicted sentenced sentence imprisonment rigorous simple fine years months prevention corruption act
section sections under read with default bribe trap demand accepted demanded amount rupees lakh crore health
education forest treasury registration survey welfare social development rural urban board hospital school
college university office court city town nagar road street colony circle zone ward range unit project
kumar singh devi rani bai lal ram prasad rao reddy nath das dass babu raja swamy gowda naik nayak patil sharma
mandal

""".split())
HONORIFIC_RE = re.compile(
    r"\b(?:Sri|Shri|Shree|Smt|Shrimati|Srimati|Tr|Thiru|Tmt|Thirumathi|Selvi|Kum|Mr|Mrs|Ms|Miss|Sh)\b\.?\s*"
    r"(?:[A-Z]\.\s*){0,4}[A-Z][A-Za-z'\-]+(?:\s+(?:[A-Z]\.?\s*){0,3}[A-Z][a-z][A-Za-z'\-]*){0,3}")
DR_NAME_RE = re.compile(r"\bDr\.?\s*(?!(?:[A-Z]\.\s*){0,3}Ambedkar)(?:[A-Z]\.\s*){0,4}[A-Z][a-z][A-Za-z'\-]+"
                        r"(?:\s+[A-Z][a-z][A-Za-z'\-]+){0,2}")
RELATION_RE = re.compile(r"\b(?:[SW]\s*/\s*o\.?|son of|wife of|daughter of)\s*[^,;()]+[,;]?\s*", re.I)
NAME_NOTE_RE = re.compile(r"\((?:[^()]*\bname\b[^()]*)\)", re.I)
MINISTER_RE = re.compile(r"\b(Minister|MLA|M\.L\.A\.)\s+(?:[A-Z][a-z]+\s*){1,4}")


# --------------------------------------------------------------------------------------
# Name variants
# --------------------------------------------------------------------------------------
def name_variant_patterns(raw_name, stop):
    """Regexes (longest first) that match the official's name as printed in many forms."""
    pats = []
    forms = vc.split_forms(raw_name)
    sep = r"[\s.,\-]*"
    hon = r"(?:(?:sri|shri|shree|smt|tr|tmt|thiru|dr|mr|mrs|ms|sh|kum)\.?\s*)?"
    for f in forms:
        longt, inits = f["long"], f["initials"]
        if f["script"] == "indic":
            pats.append(re.escape(f["text"]))
            continue
        init_pat = sep.join(re.escape(i) for i in inits)
        full = sep.join(re.escape(t) for t in longt)
        if inits:
            pats.append(hon + init_pat + sep + full)                  # K. Ramesh / K.P.T.Stalin
            pats.append(hon + full + sep + init_pat + r"(?![a-z])")   # Ramesh K
            joined = "".join(inits)
            pats.append(hon + re.escape(joined) + sep + full)          # KR Ramesh
        pats.append(hon + full)
        if len(longt) >= 2:
            pats.append(hon + sep.join(re.escape(t) for t in reversed(longt)))
            for i in range(len(longt) - 1):                           # any 2-token run
                pats.append(re.escape(longt[i]) + sep + re.escape(longt[i + 1]))
        for t in longt:                                                # surname-only
            if len(t) >= 4 and t not in stop and t not in COMMON:
                pats.append(hon + re.escape(t))
    pats = sorted(set(pats), key=len, reverse=True)
    return [re.compile(rf"(?<![{vc.WORDCH}]){p}(?![{vc.WORDCH}])", re.I) for p in pats]


def scrub(text, patterns, counter):
    if not isinstance(text, str) or not text:
        return text
    out = text
    for rx in patterns:
        out, n = rx.subn(WITHHELD, out)
        counter["official_name"] += n
    out, n = NAME_NOTE_RE.subn("", out)
    counter["name_note"] += n
    out, n = RELATION_RE.subn("", out)
    counter["relation_clause"] += n
    out, n = HONORIFIC_RE.subn(WITHHELD, out)
    counter["honorific_name"] += n
    out, n = DR_NAME_RE.subn(WITHHELD, out)
    counter["honorific_name"] += n
    out, n = MINISTER_RE.subn(lambda m: m.group(1) + " " + WITHHELD + " ", out)
    counter["political_name"] += n
    out = re.sub(r"\b(?:Sri|Shri|Shree|Smt|Shrimati|Tr|Tmt|Thiru|Mr|Mrs|Ms|Dr|Sh|Kum)\.?\s*" + re.escape(WITHHELD),
                 WITHHELD, out)
    out = re.sub(rf"(?:{re.escape(WITHHELD)}[\s,.&]*(?:and\s+)?){{2,}}", WITHHELD + " ", out)
    return re.sub(r"\s{2,}", " ", out).strip(" ,;")


# --------------------------------------------------------------------------------------
# Field builders
# --------------------------------------------------------------------------------------
CASE_FRAG = re.compile(
    r"(?:(?:Spl\.?|Special)\s*)?(?:C\.?\s?C\.?|S\.?\s?C\.?|R\.?\s?C\.?|Cr\.?|Crime|Crl\.?\s*A(?:ppeal)?\.?|"
    r"Criminal\s+Appeal|(?:Vigilance\s+)?P\.?\s?S\.?\s*Case|Sessions\s+Case|Case|Spl\.?\s*C\.?|FIR)"
    r"\s*\.?\s*No\.?\s*[:.]?\s*\d[\w/().\-]*(?:\s*(?:of|/)\s*\d{2,4})?", re.I)


def case_title(row):
    frags = []
    for m in CASE_FRAG.finditer(row.get("case_title_or_number") or ""):
        f = re.sub(r"\s+", " ", m.group(0)).strip(" .;,")
        if f not in frags:
            frags.append(f)
    return "; ".join(frags) if frags else "Case number not stated in the source"


def clean_court(tc):
    tc = re.sub(r"\s+", " ", tc or "").strip()
    tc = re.sub(r"^(?:the\s+)?(?:hon'?ble|hon’ble|honble)\s+", "", tc, flags=re.I)
    tc = re.sub(r"^the\s+", "", tc, flags=re.I)
    tc = re.sub(r"\s+has$", "", tc)
    return tc.strip(" ,")


def clean_post(post):
    p = re.sub(r"\s+", " ", post or "").strip(" ,")
    p = re.sub(r"^(?:the\s+)?then\s+|^formerly\s+|^formery\s+|^former\s+|^ex[-.\s]+", "", p, flags=re.I)
    p = re.sub(r"\s*\((?:then|at the time|former|retd\.?|retired)\)\s*$", "", p, flags=re.I)
    p = re.sub(r"\s+and$", "", p)
    return p.strip(" ,")


def split_post(post):
    p = clean_post(post)
    parts = [x.strip() for x in p.split(",")]
    return parts[0], ", ".join(x for x in parts[1:] if x)


def unit_text(row, post_detail):
    """Department (unless the post already contains it) plus the district when it adds
    something; falls back to the location part of the post."""
    dept = re.sub(r"\s+", " ", row.get("department") or "").strip(" ,")
    post = clean_post(row.get("post"))
    if dept and dept.lower() in post.lower():
        dept = ""
    unit = dept or post_detail
    district = re.sub(r"\s*\(.*\)$", "", (row.get("district") or "").strip())
    if district and district.lower() not in (unit + " " + post).lower():
        unit = f"{unit}, {district} district" if unit else f"{district} district"
    return unit


def unit_extra(unit, post_out):
    """The part of the unit that the post does not already say (for display / summary)."""
    if not unit:
        return ""
    return "" if unit.lower() in post_out.lower() else unit


def article(word):
    w = word.strip()
    if not w:
        return "a"
    if re.match(r"^[A-Z]{2,}|^[A-Z]\.", w):   # abbreviation: letter name decides
        return "an" if w[0] in "AEFHILMNORSX" else "a"
    return "an" if w[0].lower() in "aeiou" else "a"


def date_phrase(d):
    y, m, dd = d
    if dd:
        return f"on {dd} {vc.MONTHS[m - 1].capitalize()} {y}"
    if m:
        return f"in {vc.MONTHS[m - 1].capitalize()} {y}"
    return f"in {y}"


def iso_date(d, raw):
    y, m, dd = d
    if dd:
        return f"{y:04d}-{m:02d}-{dd:02d}"
    if m:
        return f"{y:04d}-{m:02d}"
    return str(raw)[:4]


CO_ACCUSED_CLAUSE = re.compile(
    r"\s*(?:,|;)?\s*(?<![A-Za-z])(?:and|&)\s+(?=(?:Tr|Tmt|Sri|Smt|Shri|Sh|Thiru|Mr|Mrs|Ms|Dr)\b\.?|(?:[A-Z]\.\s?)+[A-Z][a-z]|"
    r"[A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*(?:private|pvt|retired|formerly|the then|then)\b)")
INITIAL_NAME_RE = re.compile(
    r"\b(?:[A-Z]\.\s?){1,3}(?!(?:Act|Acts|Case|Code|Court|Rules|School|Railway|Road|Nagar|Pura|Circle|Kote|"
    r"Layout|Colony|Hospital|Town|Taluk)\b)[A-Z][a-z]{2,}(?:\s[A-Z][a-z]{2,})?"
    r"(?!\s*(?:Nagar|Pura|Puram|Road|Kote|Circle|Layout|Colony|Hospital|Halli|Palya|Mohalla|Extension|Street|"
    r"Salai|Govt|Government|College|Institute|Memorial|Bhavan|Bhawan|Complex))")


def sentence_text(row):
    s = re.sub(r"\s+", " ", row.get("sentence") or "").strip(" .;")
    s = re.sub(r"^(?:to\s+)?(?:undergo\s+)", "", s, flags=re.I)
    s = re.sub(r"^to\s+", "", s, flags=re.I)
    s = re.sub(r"\s*each of them in a Trap case", "", s, flags=re.I)
    m = CO_ACCUSED_CLAUSE.search(s)
    if m:                      # drop the part of the sentence that concerns co-accused
        s = s[:m.start()].rstrip(" ,;") + " (sentences of co-accused omitted)"
    s = INITIAL_NAME_RE.sub(WITHHELD, s)
    fine = re.sub(r"\s+", " ", row.get("fine") or "").strip(" .;")
    if fine and fine.lower() not in ("none", "null", "not stated"):
        digits = re.sub(r"\D", "", fine)[:4]
        if not digits or digits not in re.sub(r"\D", "", s):
            s = f"{s}; fine: {fine}" if s else f"fine: {fine}"
    return s or None


def appeal_status(row):
    a = (row.get("appeal_status") or "").lower()
    if re.search(r"upheld|confirmed|dismissed", a):
        return "upheld"
    if "pending" in a:
        return "pending"
    return "none_known"


def pc_s7(sections):
    for sec in sections:
        s = sec.lower()
        if not re.search(r"p\.?\s?c\.?|prevention of corruption|pc act", s):
            continue
        s = re.sub(r"13\s*\(\s*\d\s*\)(?:\s*\(\s*[a-e]\s*\))?", " ", s)
        s = re.sub(r"(?:19|20)\d\d", " ", s)
        if re.search(r"(?<![\d(])7(?![\d)])", s):
            return True
    return False


def subcategory(row):
    secs = " | ".join(row.get("sections") or [])
    txt = (secs + " | " + (row.get("summary") or "") + " | " + (row.get("case_title_or_number") or "")).lower()
    if re.search(r"disproportionate|13\s*\(\s*1\s*\)\s*\(\s*[eb]\s*\)|amassing of wealth|known sources of income|"
                 r"assets to the known", txt):
        return "disproportionate_assets"
    if (pc_s7(row.get("sections") or []) or row.get("subcategory") == "bribery_pc_act"
            or re.search(r"\bbribe|\btrap|illegal gratification|\bgratification|demanded and accepted", txt)):
        return "bribery_pc_act"
    if re.search(r"\b409\b|13\s*\(\s*1\s*\)\s*\(\s*c\s*\)|misappropriat|embezzl|defalcat|breach of trust|fodder", txt):
        return "misappropriation_breach_of_trust"
    if re.search(r"\b420\b|\b467\b|\b468\b|\b471\b|\b477-?a\b|forg|cheat", txt):
        return "cheating_forgery"
    if re.search(r"13\s*\(\s*1\s*\)\s*\(\s*d\s*\)", txt):
        return "bribery_pc_act"
    return "other"


def sections_phrase(sections):
    secs = [re.sub(r"\s+", " ", s).strip() for s in sections or [] if s and s.strip()]
    if not secs:
        return ""
    if len(secs) > 3:
        return " under " + "; ".join(secs[:3]) + " and other provisions"
    return " under " + "; ".join(secs)


RELEASE_DATE_NOTE = re.compile(r"press[- ]release date|release date|date of the press|posting date|"
                               r"press[- ]note date|taken as the (?:press|release)|date of the release", re.I)


def build_summary(row, court, desig, unit, d, case_no, subcat):
    agency = row.get("source_agency") or ""
    lst, pr = AGENCY_DOC.get(agency, ("The agency's list", "The agency's press release"))
    doc = lst if row.get("source_kind") == "official_list" else pr
    m = re.search(r"AAR(\d{4})_(\d{2})", row.get("source_file") or "")
    if agency == "karnataka-lokayukta" and m:
        doc = f"The Karnataka Lokayukta's annual report for {m.group(1)}-{m.group(2)}"
    who = f"{article(desig)} {desig}" + (f", {unit}," if unit else "")
    who = re.sub(r",\s*,", ",", who)
    case_bit = "" if case_no.startswith("Case number not stated") else f" ({case_no})"
    kind = {
        "bribery_pc_act": "bribery",
        "disproportionate_assets": "possessing assets disproportionate to known income",
        "misappropriation_breach_of_trust": "misappropriation of public money",
        "cheating_forgery": "cheating and forgery",
    }.get(subcat)
    s1 = f"{doc} records that the {court} convicted {who} {date_phrase(d)}{case_bit}."
    secs = sections_phrase(row.get("sections"))
    if kind:
        s1 += f" The conviction was for {kind}" + (f",{secs}." if secs else ".")
    elif secs:
        s1 += f" The conviction was{secs}."
    sent = sentence_text(row)
    s2 = f" The sentence recorded is: {sent}." if sent else ""
    note = ""
    if RELEASE_DATE_NOTE.search((row.get("summary") or "") + " " + (row.get("case_title_or_number") or "")):
        note = " The date given is the date of the agency's release; the judgment date is not stated separately."
    s3 = (" This is the agency's account of the court's decision; the official's name is withheld, "
          "and any later appeal is not reflected unless noted.")
    return re.sub(r"\s+", " ", s1 + s2 + note + s3).replace("..", ".").strip()


# --------------------------------------------------------------------------------------
# Leak assertion
# --------------------------------------------------------------------------------------
def leak_terms(v2_rows, other_rows, stop):
    """(term, kind, case_id) to search for in the public text.

    Officials behind published records (V2 and V1): every run of >= 2 name
    tokens, the initials+name form, and every distinctive single token >= 5 chars.
    Officials in the withheld / excluded files (confidence high or medium only; the low-
    confidence table parses often carry designations in the name field): every run of
    >= 2 name tokens unless both tokens are designation / place vocabulary."""
    terms = set()
    for rows, strict in ((v2_rows, True), (other_rows, False)):
        for r in rows:
            if not strict and r.get("confidence") not in ("high", "medium"):
                continue
            for o in r.get("officials") or []:
                for f in vc.split_forms((o or {}).get("name")):
                    toks = f["long"]
                    if f["script"] == "indic":
                        terms.add((f["text"].lower(), "indic_form", r["case_id"]))
                        continue
                    for i in range(len(toks) - 1):
                        pair = (toks[i], toks[i + 1])
                        if not strict and all(t in stop or t in COMMON for t in pair):
                            continue
                        terms.add((f"{pair[0]} {pair[1]}", "two_token_run", r["case_id"]))
                    if strict and f["initials"] and toks:
                        terms.add((" ".join(f["initials"] + [toks[0]]), "initials_form", r["case_id"]))
                    if strict:
                        for t in toks:
                            if len(t) >= 5 and t not in stop and t not in COMMON:
                                terms.add((t, "distinctive_token", r["case_id"]))
    return sorted(terms)


def leak_scan(public_text, terms):
    """Search the raw text, a URL-decoded copy and a punctuation-flattened copy."""
    low = public_text.lower()
    dec = urllib.parse.unquote(urllib.parse.unquote(low))
    norm = re.sub(rf"[^{vc.WORDCH}0-9\[\]]+", " ", dec)   # "K.Ramesh" / "K%20Ramesh" -> "k ramesh"
    hits = []
    for term, kind, cid in terms:
        rx = re.compile(rf"(?<![{vc.WORDCH}]){re.escape(term)}(?![{vc.WORDCH}])")
        for hay in (low, dec, norm):
            m = rx.search(hay)
            if m:
                hits.append((term, kind, cid, hay[max(0, m.start() - 60):m.end() + 60]))
                break
    return hits


# --------------------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------------------
def load_jsonl(path):
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as fh:
        return [json.loads(l) for l in fh if l.strip()]


def place_vocab(rows):
    vocab = set()
    for r in rows:
        for k in ("state", "district", "trial_court_name"):
            for t in vc.TOKEN_RE.findall(scrub_generic(r.get(k) or "")):
                vocab.add(t.lower())
    return vocab


def scrub_generic(text):
    text = HONORIFIC_RE.sub(" ", text or "")
    return DR_NAME_RE.sub(" ", text)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--private-dir", default=DEFAULT_PRIVATE)
    ap.add_argument("--out", default=DEFAULT_OUT)
    args = ap.parse_args()

    v2 = load_jsonl(os.path.join(args.private_dir, "civil-verified.jsonl"))
    v1_all = load_jsonl(os.path.join(args.private_dir, "civil-v1.jsonl"))
    excluded_in = load_jsonl(os.path.join(args.private_dir, "civil-excluded.jsonl"))
    if not v2:
        sys.exit("civil-verified.jsonl is missing or empty")
    hold_ids = {r["case_id"] for r in v1_all
                if set((r.get("verification") or {}).get("reasons") or []) & OUTCOME_DOUBT}
    v1_pub = [r for r in v1_all if r["case_id"] not in hold_ids]
    v1_hold = [r for r in v1_all if r["case_id"] in hold_ids]
    others = v1_hold + excluded_in
    stop = place_vocab(v2 + v1_pub + others) | COMMON
    counter = collections.Counter()
    records, skipped = [], collections.Counter()

    level_counts = collections.Counter()
    for row in sorted(v2 + v1_pub, key=lambda r: r["case_id"]):
        ver = row.get("verification") or {}
        level = ver.get("level")
        if level not in ("V2", "V1"):
            skipped["unexpected_level"] += 1
            continue
        level_counts[level] += 1
        d = vc.parse_row_date(row.get("conviction_date"))
        url = row.get("usable_source_url") or row.get("resolved_primary_source_url")
        if not d or not url:
            skipped["no_date_or_url"] += 1
            continue
        pats = name_variant_patterns((row["officials"][0] or {}).get("name"), stop)
        archive = row.get("resolved_archive_url")
        others_urls = [x for x in (row.get("resolved_primary_source_url"), archive) if x and x != url]
        forms = vc.split_forms((row["officials"][0] or {}).get("name"))
        if any(vc.url_name_tokens(x, forms) for x in [url] + others_urls):
            skipped["source_url_embeds_name"] += 1
            continue

        def S(x):
            return scrub(x, pats, counter)

        desig_raw, detail_raw = split_post(row.get("post"))
        unit = S(unit_text(row, detail_raw))
        court = S(clean_court(row.get("trial_court_name")))
        cno = S(case_title(row))
        subcat = subcategory(row)
        post_out = S(clean_post(row.get("post")))
        extra = unit_extra(unit, post_out)
        dept_out = S(re.sub(r"\s+", " ", row.get("department") or "").strip()) or None
        secondary = others_urls
        category = row.get("category") if row.get("category") in ("corruption", "misconduct") else "corruption"
        summary = S(build_summary(row, court, post_out, extra, d, cno, subcat))
        if level == "V1":
            rsn = [str(x) for x in (ver.get("reasons") or [])]
            glosses = "; ".join(V1_GLOSS.get(x, x) for x in rsn)
            summary = summary + " Verification level V1: " + glosses + "."
        rec = {
            "case_id": row["case_id"],
            "alias_case_ids": row.get("alias_case_ids") or [],
            "state": S(row.get("state")),
            "district": S(row.get("district")),
            "trial_court_name": court,
            "court_level": row.get("court_level"),
            "conviction_date": iso_date(d, row.get("conviction_date")),
            "conviction_year": d[0],
            "incident_date": S(row.get("incident_date")) or None,
            "case_title_or_number": cno,
            "category": category,
            "subcategory": subcat,
            "outcome_type": "conviction",
            "officers": [{
                "rank": post_out,
                "unit": unit,
                "publish_grade": "unnamed",
                "name": None,
                "name_public": None,
                "display": f"{post_out}, {extra}" if extra else post_out,
            }],
            "victims": [],
            "sections": [S(x) for x in (row.get("sections") or []) if x],
            "sentence": S(sentence_text(row)),
            "appeal_status": appeal_status(row),
            "appeal_url": None,
            "source_kind": row.get("source_kind"),
            "source_agency": row.get("source_agency"),
            "primary_source_url": url,
            "secondary_sources": secondary,
            "summary": summary,
            "court_quote": None,
            "verification_status": level,
            "service": "civil",
            "post": post_out,
            "department": dept_out,
            "government": row.get("government") or vc.government_of(row),
        }
        records.append(rec)

    out_dir = os.path.dirname(args.out)
    os.makedirs(out_dir, exist_ok=True)
    tmp = args.out + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(records, fh, ensure_ascii=False, indent=1, sort_keys=False)
        fh.write("\n")

    # ------------------------------------------------------------ leak assertion
    with open(tmp, encoding="utf-8") as fh:
        public_text = fh.read()
    reloaded = json.loads(public_text)
    assert len(reloaded) == len(records)
    for r in reloaded:
        for o in r["officers"]:
            assert o["name"] is None and o["name_public"] is None and o["publish_grade"] == "unnamed", r["case_id"]
        assert r["victims"] == [], r["case_id"]
    terms = leak_terms(v2 + v1_pub, others, stop)
    hits = leak_scan(public_text, terms)
    if hits:
        os.remove(tmp)
        print(f"LEAK ASSERTION FAILED: {len(hits)} name term(s) found in the public output; "
              f"nothing written to {args.out}", file=sys.stderr)
        for term, kind, cid, ctx in hits[:200]:
            print(f"  {kind:18s} {term!r}  (from {cid})  ...{ctx}...", file=sys.stderr)
        sys.exit(1)
    os.replace(tmp, args.out)

    withheld_officers = sum(len(r["officers"]) for r in records)
    print(f"records written: {len(records)}  -> {args.out}  "
          f"(V2: {level_counts.get('V2', 0)}, V1: {level_counts.get('V1', 0)})")
    print(f"V1 rows withheld (outcome doubt): {len(v1_hold)} of {len(v1_all)}")
    print(f"officials withheld (name=null): {withheld_officers}")
    print(f"scrubber substitutions: {sum(counter.values())} "
          f"({', '.join(f'{k}={v}' for k, v in sorted(counter.items()))})")
    if skipped:
        print(f"skipped: {dict(skipped)}")
    print(f"leak assertion: PASSED ({len(terms)} name terms checked, 0 found)")


if __name__ == "__main__":
    main()
