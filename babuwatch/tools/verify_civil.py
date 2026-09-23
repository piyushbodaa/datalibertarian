#!/usr/bin/env python3
"""verify_civil.py - deterministic source-match verification for Babuwatch civil-servant rows.

Reads the bx-r6/bx-r7 candidate rows (one row per person per case), applies scope
filters, matches every official against the cached source text of the agency list /
press release the row was extracted from, dedupes, and writes PRIVATE outputs that
still contain real names:

    <out>/civil-verified.jsonl   V2 rows (name + date/case no. + conviction wording in
                                 one window of an official-domain source)
    <out>/civil-v1.jsonl         V1 rows (name found, some evidence missing)
    <out>/civil-excluded.jsonl   every other input row, with reasons
    <out>/VERIFY-REPORT.md       counts + 25 random V2 rows for a human spot-check

Python 3 standard library only. No network, no LLM. Same inputs + same --seed and
--as-of give byte-identical outputs. Fail closed: anything uncertain is V1 or excluded.
The input files are opened read-only and never modified.

Usage (defaults point at the Data Libertarian workspace layout):
    python3 verify_civil.py \
        --input-glob '<courts>/tier2/bx-r6-*/cases.jsonl' \
        --input-glob '<courts>/tier2/bx-r7-*/cases.jsonl' \
        --corpus-dir '<courts>/corpus/lists' \
        --out-dir    '<workspace>/private-data/babuwatch'
"""
from __future__ import annotations

import argparse
import collections
import datetime as dt
import glob
import json
import os
import random
import re
import sys
import unicodedata
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
WORKSPACE = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
COURTS = os.path.join(WORKSPACE, "cloudy-restore", "courts")
DEFAULT_GLOBS = [
    os.path.join(COURTS, "tier2", "bx-r6-*", "cases.jsonl"),
    os.path.join(COURTS, "tier2", "bx-r7-*", "cases.jsonl"),
]
DEFAULT_CORPUS = os.path.join(COURTS, "corpus", "lists")
DEFAULT_OUT = os.path.join(WORKSPACE, "private-data", "babuwatch")

WINDOW = 300            # chars either side of the name anchor (~600-char window)
MAX_NAME_SPAN = 200     # all name tokens must sit within this many chars of each other
SNIPPET_MAX = 400

# --------------------------------------------------------------------------------------
# Source-URL corrections. Established by hand on 2026-09-23 with an HTTP range request
# (not by this script, which never touches the network):
#  * Karnataka Lokayukta annual reports live at /pdf/AAR<yyyy>-<yy>.pdf (hyphen). The
#    extractor rebuilt them from the corpus slug with an underscore, which returns 404.
#    Every hyphen form below returned HTTP 206. The Wayback Machine has no snapshot of
#    any of them, so the fabricated web.archive.org/web/20260921/... links are dropped.
#    AAR2011-12 had no URL in the row or manifest; the same checked form is used.
# --------------------------------------------------------------------------------------
KARNATAKA_AAR = re.compile(r"^20260921__lokayukta_karnataka_gov_in_pdf_AAR(\d{4})_(\d{2})_pdf_[0-9a-f]{6}$")


#  * The Odisha Vigilance July-Dec 2010 bulletin is "Bulletin%20(July-Dec-2010).pdf"; the
#    extractor dropped the parentheses. Wayback CDX shows a 200 capture at 20220625201655.
#  * Files fetched directly on 2026-09-21 (stem prefix "20260921__": Karnataka annual
#    reports, the TN DVAC list pages) have no Wayback capture on that date; the extractor's
#    web.archive.org/web/20260921/... links are dropped rather than published (the nearest
#    capture of the DVAC list is from April 2025 and lacks the later entries).
#  * Hosts / URLs found dead on 2026-09-23: cbi.nic.in (CBI moved to cbi.gov.in; old press
#    release paths are gone) and two Kerala VACB PDFs (HTTP 404). For these the Wayback
#    copy (captures confirmed via CDX) becomes the usable link; the official URL is kept
#    as provenance.
URL_OVERRIDES = {
    "20220625__odishavigilance.gov.in_Odisha_Vigilance_Pub_20File_Bulletin_20_July-Dec-2010_.pdf_7f83fa": {
        "primary": "https://odishavigilance.gov.in/Odisha_Vigilance/Pub%20File/Bulletin%20(July-Dec-2010).pdf",
        "archive": "https://web.archive.org/web/20220625201655/http://odishavigilance.gov.in/Odisha_Vigilance/"
                   "Pub%20File/Bulletin%20(July-Dec-2010).pdf",
        "basis": "override: Wayback CDX 2026-09-23 (row URL had lost the parentheses)",
    },
}
DEAD_HOSTS = {"cbi.nic.in", "www.cbi.nic.in"}
DEAD_URLS = {
    "https://vigilance.kerala.gov.in/storage/pages/custom/pageFiles/ndp0GAc5lETkrTbC7PL7LjcObKgwZTKSYqewBqi3Jy94vAAezx.pdf",
    "https://vigilance.kerala.gov.in/storage/pages/custom/pageFiles/9QFWsOUKHUWeYSsnWUa9ZEpP42FqQp53IvzQCHW298hnRxIOXk.pdf",
}


def url_override(stem: str):
    m = KARNATAKA_AAR.match(stem)
    if m:
        return {
            "primary": f"https://lokayukta.karnataka.gov.in/pdf/AAR{m.group(1)}-{m.group(2)}.pdf",
            "archive": None,
            "basis": "override: Karnataka AAR hyphen URL (HTTP 206 on 2026-09-23; underscore form 404; no Wayback snapshot)",
        }
    return URL_OVERRIDES.get(stem)


def is_dead(u):
    if not u:
        return False
    return u in DEAD_URLS or (urllib.parse.urlsplit(u).hostname or "").lower() in DEAD_HOSTS


OFFICIAL_SUFFIXES = (".gov.in", ".nic.in", ".gov")

# --------------------------------------------------------------------------------------
# Text normalisation
# --------------------------------------------------------------------------------------
ZERO_WIDTH = dict.fromkeys(map(ord, "\u200b\u200c\u200d\u2060\ufeff\u00ad"), None)
PUNCT_MAP = str.maketrans({"\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"',
                           "\u2013": "-", "\u2014": "-", "\u2212": "-", "\u00a0": " "})
WORDCH = r"A-Za-z\u00C0-\u024F\u0900-\u0DFF"   # Latin + Latin-ext + Indic blocks (incl. matras)
TOKEN_RE = re.compile(rf"[{WORDCH}]+")
INDIC_RE = re.compile(r"[\u0900-\u0DFF]")


def flatten(text: str):
    """Return (flat, low): whitespace collapsed; low is a same-length lowercase copy."""
    text = unicodedata.normalize("NFC", text.translate(ZERO_WIDTH)).translate(PUNCT_MAP)
    flat = re.sub(r"\s+", " ", text)
    low = "".join(c.lower() if len(c.lower()) == 1 else c for c in flat)
    assert len(low) == len(flat)
    return flat, low


def word_re(tok: str):
    return re.compile(rf"(?<![{WORDCH}]){re.escape(tok)}(?![{WORDCH}])")


# --------------------------------------------------------------------------------------
# Names
# --------------------------------------------------------------------------------------
HONORIFICS = {
    "sh", "shri", "sri", "shree", "smt", "shrimati", "srimati", "tr", "thiru", "tmt",
    "thirumathi", "selvi", "kum", "dr", "mr", "mrs", "ms", "miss", "late", "er", "adv",
    "prof", "capt", "col", "lt", "maj", "then", "retd", "former", "ex",
    "श्री", "श्रीमती", "सुश्री", "डॉ", "स्व",
}
NOTE_WORDS = re.compile(r"translit|press|note|printed|pdf|ocr|judg|confirm|garbl|render|as per|"
                        r"\blist\b|spelt|spelled|appears|read as|reads", re.I)
UNCERTAIN = re.compile(r"garbl|to be confirmed|appears to|illegible|unclear|not legible|\?|uncertain", re.I)
NOT_A_NAME = re.compile(r"^\W*(unnamed|not stated|unknown|name not|n/?a)\b", re.I)


def split_forms(raw: str):
    """Split an extracted name into alternative forms (native script / transliteration / alias)."""
    raw = raw or ""
    inner = re.findall(r"[\(\[]([^\)\]]*)[\)\]]", raw)
    base = re.sub(r"[\(\[][^\)\]]*[\)\]]", " ", raw)
    cands = []
    for s in [base] + inner:
        for frag in s.split(","):
            frag = frag.strip()
            if not frag or NOTE_WORDS.search(frag):
                continue
            for alt in re.split(r"@|\balias\b|\bur?f\b", frag, flags=re.I):
                alt = re.split(r"\b[SDW]\s*/\s*o\b|\bson of\b|\bwife of\b|\bdaughter of\b", alt, flags=re.I)[0]
                if alt.strip():
                    cands.append(alt.strip())
    forms, seen = [], set()
    for c in cands:
        toks = [t.lower() for t in TOKEN_RE.findall(c)]
        while len(toks) > 1 and toks[0] in HONORIFICS and any(len(t) >= 3 for t in toks[1:]):
            toks = toks[1:]
        toks = [t for t in toks if t not in HONORIFICS or len(toks) == 1]
        longt = [t for t in toks if len(t) >= 3]
        inits = [t for t in toks if len(t) <= 2]
        if not longt:
            continue
        key = (tuple(longt), tuple(inits))
        if key in seen:
            continue
        seen.add(key)
        forms.append({"text": c, "long": longt, "initials": inits,
                      "script": "indic" if INDIC_RE.search(c) else "latin"})
    return forms


def name_key(forms):
    latin = [f for f in forms if f["script"] == "latin"]
    f = (latin or forms)[0]
    return " ".join(sorted(f["long"]))


# --------------------------------------------------------------------------------------
# Dates / case numbers
# --------------------------------------------------------------------------------------
MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august",
          "september", "october", "november", "december"]
MON_ABBR = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sept?", "oct", "nov", "dec"]


def parse_row_date(s):
    if not s:
        return None
    m = re.match(r"^\s*(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?", str(s))
    if not m:
        return None
    y = int(m.group(1))
    mo = int(m.group(2)) if m.group(2) else None
    d = int(m.group(3)) if m.group(3) else None
    try:
        if d:
            dt.date(y, mo, d)
        elif mo and not 1 <= mo <= 12:
            return None
    except ValueError:
        return None
    return (y, mo, d)


def date_patterns(y, mo, d):
    pats = []
    y2 = f"{y % 100:02d}"
    if mo:
        mon = f"(?:{MONTHS[mo - 1]}|{MON_ABBR[mo - 1]}\\.?)"
    if d:
        dd, mm = f"0?{d}", f"0?{mo}"
        pats += [
            rf"(?<!\d){dd}\s?[./\-]\s?{mm}\s?[./\-]\s?(?:{y}|{y2})(?!\d)",
            rf"(?<!\d){y}\s?[./\-]\s?{mm}\s?[./\-]\s?{dd}(?!\d)",
            rf"(?<!\d){dd}\s?(?:st|nd|rd|th)?\s?(?:day\s+of\s+)?[\-,]?\s?{mon}[\s,.\-]*(?:{y}|'?{y2})(?!\d)",
            rf"{mon}\s?{dd}\s?(?:st|nd|rd|th)?,?\s?{y}(?!\d)",
        ]
    elif mo:
        pats += [rf"{mon}[\s,.\-]*{y}(?!\d)", rf"(?<!\d)0?{mo}\s?[./\-]\s?{y}(?!\d)"]
    return [re.compile(p) for p in pats]


CASE_NO_RE = re.compile(r"no\.?\s*[:.]?\s*(\d{1,5})\s*(?:/|of|-)\s*((?:19|20)?\d{2})(?!\d)")


def case_number_pairs(title):
    pairs = []
    for n, yr in CASE_NO_RE.findall((title or "").lower()):
        y4 = yr if len(yr) == 4 else None
        y2 = yr[-2:]
        pairs.append((int(n), y4, y2))
    return pairs


def case_patterns(pairs):
    out = []
    for n, y4, y2 in pairs:
        yalt = f"(?:{y4}|{y2})" if y4 else f"(?:(?:19|20)?{y2})"
        out.append(re.compile(rf"(?<!\d)0*{n}\s*(?:/|of|-)\s*{yalt}(?!\d)"))
    return out


# --------------------------------------------------------------------------------------
# Outcome wording
# --------------------------------------------------------------------------------------
CONV_LOW = re.compile(
    r"\bconvict(?:ed|ion|ions|ing|s)?\b|\bsentenc(?:e|ed|es|ing)\b|\bimprisonment\b|"
    r"\b(?:found|held|proved|pronounced)\s+(?:him\s+|her\s+|them\s+)?guilty\b|\bguilty\s+of\b|"
    r"\brigorous\b|"
    r"दोषसिद्ध|दोषी|दण्डित|दंडित|सजा|सज़ा|कारावास|कैद|"
    r"ശിക്ഷ|തടവ")
CONV_FLAT = re.compile(
    r"\b(?:R|S)\.?\s?I\b\.?(?=\s?(?:for|of|:|-|\(|\d|one|two|three|four|five|six|seven|eight|nine|ten|twelve|year|month|day))"
    r"|(?i:years?|months?)\s(?:(?i:of)\s)?(?:R|S)\.?\s?I\b")
ACQ_LOW = re.compile(
    r"\bacquit(?:ted|tal|tals|s)?\b|\bdischarged\b|\bbenefit\s+of\s+(?:the\s+)?doubt\b|\bset\s+aside\b|"
    r"\bexonerated\b|\babated?\b|\babatement\b|\b(?:found|held)\s+not\s+guilty\b|"
    r"दोषमुक्त|बरी|उन्मुक्त|വെറുതെ|കുറ്റവിമുക്ത")


# Entry boundaries in list-style sources (annual-report tables, bulletins, the DVAC press
# list). Evidence is only taken from the entry that holds the name, so an acquittal note
# that closes the PREVIOUS entry, or a date that opens the NEXT one, is not attributed to
# this person. Sources without markers (single press releases) use the plain window.
ENTRY_MARKER = re.compile(
    r"(?<![\w/.,(\-])\d{1,3}\s?[.)]?\s+(?:\d{1,3}\s?[.)]?\s+)?(?:sri|smt|shri|kum|dr|mr|mrs|tr|tmt)\b"
    r"|(?<![\w/.,(\-])\d{1,3}\s?[.)]\s+(?:in|the)\s"
    r"|\bv&ac\s?-\s"
    r"|(?<=\s)v&ac\s(?:trapped|conducted|registered|laid|arrested|filed|booked|searched|seized)\b")
# An acquittal phrase that names a numbered co-accused ("A-2 acquitted", "AGO-2 and 3
# Acquitted", "Accused No.2 is acquitted") refers to someone else in the same entry.
CO_ACCUSED_QUAL = re.compile(
    r"(?:\ba\s?-?\s?\d\b|\bago\s?-?\s?\d|\baccused\s?(?:no\.?)?\s?-?\s?\d|\bagos?\b)[^.;]{0,25}$")


def nearest(regex_list, text, center, offset=0):
    """Return (distance, matched_text, abs_start, abs_end) of the nearest match to center."""
    best = None
    for rx in regex_list:
        for m in rx.finditer(text):
            s, e = m.start() + offset, m.end() + offset
            dist = 0 if s <= center <= e else min(abs(center - s), abs(center - e))
            if best is None or dist < best[0]:
                best = (dist, m.group(0), s, e)
    return best


# --------------------------------------------------------------------------------------
# Scope filters (applied to structured fields only, never to names)
# --------------------------------------------------------------------------------------
def rx(p, flags=re.I):
    return re.compile(p, flags)


POLICE_ORG = rx(r"\bpolice\b|\bI\.?\s?G\.?\s?P\b|\bD\.?\s?G\.?\s?P\b|\bDG\s*&\s*IGP\b|police station|\bthana\b|"
                r"railway protection force|\bRPF\b|home guard")
POLICE_POST = rx(r"constable|\bhavildar\b|\bSHO\b|station house officer|\bSDPO\b|\bIPS\b|circle inspector|"
                 r"superintendent of police|\bD\.?S\.?P\b|\bDy\.?\s?S\.?P\b|\bA\.?S\.?I\b(?!\s*of)")
POLICE_POST_CS = rx(r"\bSP\b|\bASI\b|\bDSP\b|\bCI\b", 0)
INSPECTOR = rx(r"inspector|\bS\.?\s?I\b\.?")
INSPECTOR_CIVIL = rx(
    r"health|sanitary|revenue|labou?r|food|excise|motor vehicle|\bMVI\b|tax|commercial|factor|boiler|"
    r"legal metrology|weights|measure|survey|fisher|co-?\s?operative|school|education|customs|drug|"
    r"electric|municipal|panchayat|forest|agricultur|transport|ticket|\bworks?\b|audit|stamp|"
    r"registration|licen[cs]e|conservancy|town planning|building|\bline\b|statistic|suppl|welfare|"
    r"land record|mines|nurs|pharmac|veterinar|milk|dairy|accounts|treasury|octroi|entertainment|"
    r"sales|mandi|market|ration|provident|employment|industr|textile|sericulture|horticulture|wakf|"
    r"\bfire\b|small savings|cooperative|epf|esi\b|railway|postal|post office|income")
ELECTED_POST = rx(r"\bM\.?\s?L\.?\s?A\b|\bM\.?\s?L\.?\s?C\b|member of (?:the )?(?:legislative|parliament|lok sabha|rajya sabha)|"
                  r"\bminister\b|\bmantri\b|sarpanch|sarapanch|\bpradhan\b|\bmukhiya\b|\bpanch\b|corporator|"
                  r"council+or|\bmayor\b|pramukh|\badhyaksh|ward member|leader of opposition|\bpresident\b|"
                  r"\bchair(?:man|person|woman)\b|\bMP\b(?!\s*,\s*\w+)(?=\W*$)")
ELECTED_ORG = rx(r"\belected\b|vidhan sabha|lok sabha|rajya sabha|parliament of india|legislative assembly")
CHAIR_OK = rx(r"public service commission|railway recruitment board")
PSU = rx(
    r"\bbank\b|\bltd\b|\blimited\b|maryadit|\bPSU\b|insurance\s+(?:co\b|co\.|company|corporation)|"
    r"life insurance|\bLIC\b|assurance|\bBSNL\b|\bMTNL\b|\bONGC\b|\bNTPC\b|national thermal power|\bBHEL\b|"
    r"\bSAIL\b|\bGAIL\b|\bIOCL?\b|indian oil|\bHPCL\b|\bBPCL\b|bharat petroleum|hindustan petroleum|"
    r"coalfields|coal india|\bNCL\b|\bHAL\b|hindustan aeronautics|air india|airports authority|\bFCI\b|"
    r"food corporation|electricity board|\bTNEB\b|TANGEDCO|TANTRANSCO|\bKSEB\b|\bBESCOM\b|\bMESCOM\b|"
    r"\bHESCOM\b|\bGESCOM\b|\bCESCO?M?\b|\bCESU\b|\bKPTCL\b|\bMSEDCL\b|\bMSEB\b|\bPSPCL\b|"
    r"power corporation|electricity supply|\bDISCOM\b|\bOHPC\b|\bOSFC\b|financial corporation|"
    r"transport corporation|\bMTC\b|\bSETC\b|\bTNSTC\b|\bKSRTC\b|\bNWKRTC\b|\bRTC\b|"
    r"warehousing corporation|TANCEM|supplyco|civil supplies corporation|maveli|\baavin\b|"
    r"gramya bank|gramin bank|development corporation|construction corporation|nigam limited|"
    r"\(energy\)|energy \(psu\)|transport \(psu\)")
CORPORATION = rx(r"corporation")
MUNICIPAL = rx(
    r"municipal|municipality|corporation of \w+|city corporation|mahanagar|nagar nigam|nagar palika|palike|"
    r"\bBBMP\b|\bBMP\b|\bB\.M\.P\b|\bMCD\b|\bCMC\b|\bC\.M\.C\b|\bTMC\b|\bHDMC\b|"
    r"(?:greater\s+)?(?:chennai|coimbatore|madurai|trichy|tiruchirappalli|salem|tirunelveli|erode|vellore|"
    r"tiruppur|thoothukudi|mysore|mysuru|hubli|bangalore|bengaluru|cuttack|bhubaneswar|delhi|mumbai|pune|"
    r"nagpur|kochi|cochin|thiruvananthapuram|kozhikode|thrissur|kollam|patiala|bathinda|ludhiana|"
    r"amritsar|jalandhar|mohali|adyar)\s+(?:city\s+|municipal\s+)?corporation")
COOP = rx(r"co-?\s?operative|cooperative|\bco-op\b|\bPACCS?\b|\bsociety\b|sahakari|\bkudumbashree\b|\bCDS\b")
COOP_GOVT = rx(r"registrar of co-?\s?operative|co-?\s?operative (?:department|institutes|audit)|"
               r"department of co-?\s?operation|co-?\s?operation department|assistant registrar|"
               r"asst\.? registrar|deputy registrar|special auditor|\bauditor\b|\bRCS\b")
AIDED = rx(r"\baided\b|\bcorrespondent\b")
PRIVATE = rx(r"private|middle-?\s?man|contractor|proprietor|\bM/s\b|\bpartner\b|builder|supplier|\bdealer\b|"
             r"businessman|beneficiary|borrower|guarantor|\bagent\b|\btout\b|advocate|chartered accountant|"
             r"\bdriver of\b|accused\s*\.?\s*\d|\bA-?\d\b")
JUDICIARY = rx(r"\bjudge\b|magistrate|judicial|\bmunsiff\b|high court staff|court staff|\bjudiciary\b|"
               r"\bbench clerk\b|\bcourt\b")
ARMED = rx(r"\barmy\b|lance\s*nai?k|\bnaik\b|subedar|\blt\.?\s*col|colonel|brigadier|\bmajor\b|captain|"
           r"\bjawan\b|\bJCO\b|\bnavy\b|naval|air force|coast guard|assam rifles|\bBSF\b|border security force|"
           r"\bCRPF\b|\bCISF\b|\bITBP\b|\bSSB\b|\bNSG\b")
MULTI_PERSON = rx(r"\band\s+\d+\s+other|\bothers\b|\b(?:two|three|four|five|six)\s+other")
EMPTY_POST = rx(r"^\W*$|not stated|not known|unknown|^\W*n/?a\W*$|post not")
DESIGNATION = rx(
    r"officer|assistant|asst|clerk|engineer|inspector|surveyor|registrar|tah?a?s[ie]ldh?ar|thasildar|"
    r"accountant|secretary|manager|superintendent|supdt|director|commissioner|peon|attender|attendant|"
    r"typist|steno|draug?htsman|draftsman|chainman|mazdoor|foreman|lineman|wireman|mechanic|guard|"
    r"forester|ranger|teacher|head\s*master|head\s*mistress|lecturer|professor|doctor|surgeon|medical|"
    r"nurse|pharmacist|technician|collector|patwari|kanu?n?go|talati|village|revenue|\bVAO\b|\bFDA\b|"
    r"\bSDA\b|S\.D\.A|\bLDC\b|\bUDC\b|U\.\s?D\.|\bJE\b|\bAE\b|A\.E\.|\bAEE\b|\bEE\b|\bSRO\b|\bBDO\b|"
    r"\bCDPO\b|\bBEO\b|\bDFO\b|\bTO\b|\bATO\b|\bTVO|M\.V\.O|D\.A\.H\.O|\bSAHO|\bIAS\b|\bIRS\b|\bOAS\b|"
    r"\bOFS|appraiser|auditor|cashier|store\s*keeper|sewadar|dafedar|daftari|jamadar|sepoy|group[\s-]?d|"
    r"\bd group|chowkidar|watchman|bill collector|tax collector|assessor|staff|employee|official|"
    r"worker|organi[sz]er|supervisor|scientist|scientific|controller|examiner|prosecutor|advis[eo]r|"
    r"analyst|overseer|shirastedar|sheristedar|peskar|nazir|welfare|extension|progress|sanitary|"
    r"pumps?\s*man|operator|librarian|warden|jail|incharge|in-charge|i/c|\bhead\b|chief|deputy|\bdy\b|"
    r"\bR\.I\b|\bRI\b|\bLRD\b|\bPLW\b|\bAGM\b|\bCMD\b|\bDLA\b|T\.\s?V\.\s?O|S\.\s?I\.\s?of|"
    r"coordinator|co-ordinator|planner|electrician|reg\w{0,3}strar|registarar|\bclark\b|chair(?:man|person)")
UNION_KW = rx(
    r"central excise|\bcustoms\b|income tax|\brailways?\b|\bCPWD\b|postal|post office|\bGPO\b|\bEPFO\b|"
    r"provident fund organi[sz]ation|\bESIC\b|ministry|government of india|govt\.? of india|\bG\.?O\.?I\b|"
    r"central government|\(central\)|khadigram|\bKVIC\b|khadi & village industries commission|khadi and village industries commission|"
    r"\bCFSL\b|narcotics control bureau|accountant general|department of telecom|telecommunication|"
    r"archaeological survey|indian bureau of mines|passport|directorate of estates|labour commissioner \(central\)|"
    r"\bCBI\b|central bureau of investigation|chief controller of explosives|national institute|service tax|"
    r"\bMES\b|military engineer|ministry of defence|\bIRS\b|\bCGST\b")
STATE_KW = rx(
    r"government of (?!india)\w+|govt\.? of (?!india)\w+|government of nct|animal husbandry|\btreasury\b|"
    r"road construction|education department|haryana government|state\b|\bprisons?\b|registrar of co-?\s?operative|"
    r"\bPWD\b|public works|puducherry|pondicherry")
# State departments whose names contain "panchayat" (Panchayat Raj engineering, BDOs,
# Revenue officers posted in villages) are state, not local.
STATE_OVERRIDE = rx(r"revenue department|\bBDO\b|block development|panchayat(?:i)?\s*raj|rural development|"
                    r"\bOAS\b|tah?a?s[ie]ldh?ar|rural works")
MUNICIPAL_LOCAL = rx(
    r"municipal|municipality|corporation of \w+|city corporation|nagar nigam|nagar palika|mahanagar|palike|"
    r"\bBBMP\b|\bBMP\b|B\.M\.P|\bMCD\b|\bCMC\b|C\.M\.C|\bTMC\b|\bHDMC\b|town panchayat|pattana|"
    r"cantonment board|improvement trust|local bodies|"
    r"(?:greater\s+)?(?:chennai|coimbatore|madurai|erode|mysore|delhi|adyar)\s+(?:city\s+|municipal\s+)?corporation")
LOCAL_KW = rx(
    r"municipal|municipality|corporation of \w+|city corporation|nagar nigam|nagar palika|mahanagar|palike|"
    r"panchayat|panchayath|zilla parishad|zila parishad|\bZ\.P\b|gram sabha|\bBBMP\b|\bBMP\b|B\.M\.P|\bMCD\b|"
    r"\bCMC\b|C\.M\.C|\bTMC\b|\bHDMC\b|cantonment board|improvement trust|town panchayat|pattana|"
    r"(?:greater\s+)?(?:chennai|coimbatore|madurai|erode|mysore|delhi|adyar)\s+(?:city\s+|municipal\s+)?corporation|"
    r"local bodies|panchayat union|\bPU\b|union engineer")


def scope_reasons(row):
    o = (row.get("officials") or [{}])[0] or {}
    post = (row.get("post") or "").strip()
    rank = (o.get("rank") or "").strip()
    dept = (row.get("department") or "").strip()
    unit = (o.get("unit") or "").strip()
    desig = f"{post} | {rank}"
    org = f"{dept} | {unit}"
    allf = f"{desig} | {org}"
    reasons = []

    if len(row.get("officials") or []) != 1:
        reasons.append("multi_official_row")
    # police
    if (POLICE_ORG.search(allf) or POLICE_POST.search(desig) or POLICE_POST_CS.search(post) or
            POLICE_POST_CS.search(rank) or
            (INSPECTOR.search(desig) and not INSPECTOR_CIVIL.search(allf))):
        reasons.append("police")
    # elected / politicians
    if ELECTED_ORG.search(org) or (ELECTED_POST.search(desig) and not CHAIR_OK.search(allf)):
        reasons.append("elected_or_political")
    # PSU / bank / insurance / cooperative / aided institutions
    if PSU.search(allf):
        reasons.append("psu_bank_or_company")
    elif CORPORATION.search(allf) and not MUNICIPAL.search(allf):
        reasons.append("psu_statutory_corporation")
    if COOP.search(allf) and not COOP_GOVT.search(allf):
        reasons.append("cooperative_society_employee")
    if AIDED.search(allf):
        reasons.append("aided_or_private_institution")
    # private persons / empty post
    if not post or EMPTY_POST.search(post):
        reasons.append("empty_or_unstated_post")
    elif not DESIGNATION.search(post):
        reasons.append("post_not_a_designation")
    if PRIVATE.search(desig) or re.search(r"private (?:person|contractor|firm|individual)", org, re.I):
        reasons.append("private_person_or_contractor")
    if MULTI_PERSON.search(desig):
        reasons.append("multi_person_post")
    if JUDICIARY.search(desig) or re.search(r"\bjudiciary\b", org, re.I):
        reasons.append("judiciary_out_of_scope")
    if ARMED.search(allf):
        reasons.append("armed_forces_or_capf")
    # dates / court
    d = parse_row_date(row.get("conviction_date"))
    if not d:
        reasons.append("no_parseable_conviction_date")
    elif d[0] < 1950:
        reasons.append("implausible_conviction_date")
    tc = (row.get("trial_court_name") or "").strip()
    if not tc or EMPTY_POST.search(tc):
        reasons.append("no_trial_court_name")
    elif re.search(r"high court|supreme court", tc, re.I):
        reasons.append("appellate_court_conviction_not_trial")
    ap = (row.get("appeal_status") or "").lower()
    if re.search(r"acquit|set aside|overturn|revers|quash", ap):
        reasons.append("overturned_on_appeal")
    tier = (row.get("tier") or "trial_court")
    if tier != "trial_court":
        reasons.append("not_trial_court_tier")
    return reasons


# When the row gives no employing body (department empty or just a copy of the post), the
# post itself must name one, or be a designation that only exists in government service.
ORG_WORDS = rx(
    r"department|dept|office|ofice|o/o|collectorate|secretariat|municipal|municipality|corporation|panchayat|"
    r"\bPWD\b|public works|hospital|health|school|college|university|board|museum|forest|revenue|taluk|"
    r"survey|education|welfare|labour|stamps|registration|irrigation|highways|\bRTO\b|transport office|"
    r"slum|CMWSSB|CMDA|drugs control|fire and rescue|excise|treasury|agricultur|land records?|legal metrology|"
    r"commercial tax|sub regist|registry|court|mines|sericulture|horticulture|fisheries|employment|industries|"
    r"social welfare|adi dravidar|co-?operative|small savings|temple|muzrai|archaeolog|town planning")
SELF_DESCRIBING = rx(
    r"village administrative officer|\bVAO\b|village accountant|village assistant|village officer|"
    r"village field assistant|sub[- ]?regist|\bS\.?R\.?O\b|tah?a?s[ie]ldh?ar|thasildar|revenue (?:inspector|assistant|"
    r"divisional officer)|district revenue officer|firka surveyor|surveyor|forest|forester|range officer|"
    r"sanitary inspector|bill collector|patwari|kanu?n?go|talati|\bBDO\b|block development|\bCDPO\b|excise|"
    r"public prosecutor|stamping inspector|inspector of labour|shirastedar|village health nurse|"
    r"block education officer|education officer|union engineer|\bR\.I\b|chainman|peskar|district reg\w{0,3}strar")


def employing_body_stated(row):
    o = (row.get("officials") or [{}])[0] or {}
    post = (row.get("post") or "").strip()
    norm = lambda x: re.sub(r"\W+", " ", (x or "").lower()).strip()
    orgs = [x for x in (row.get("department"), o.get("unit")) if norm(x) and norm(x) not in norm(post)]
    return bool(orgs or ORG_WORDS.search(post) or SELF_DESCRIBING.search(post) or UNION_KW.search(post)
                or MUNICIPAL_LOCAL.search(post))


def government_of(row):
    o = (row.get("officials") or [{}])[0] or {}
    allf = " | ".join(str(x or "") for x in (row.get("post"), row.get("department"), o.get("unit"), o.get("rank")))
    if MUNICIPAL_LOCAL.search(allf):
        return "local"
    if STATE_OVERRIDE.search(allf):
        return "state"
    if LOCAL_KW.search(allf):
        return "local"
    if UNION_KW.search(allf):
        return "union"
    if STATE_KW.search(allf):
        return "state"
    if row.get("source_agency") == "cbi":
        return "union"
    return "state"


# --------------------------------------------------------------------------------------
# URLs
# --------------------------------------------------------------------------------------
def clean_url(u):
    u = (u or "").strip().replace(" ", "%20")
    return u if re.match(r"^https?://", u, re.I) else ""


def inner_url(u):
    m = re.match(r"^https?://web\.archive\.org/web/[^/]+/(.+)$", u or "", re.I)
    return m.group(1) if m else u


def is_official(u):
    if not u:
        return False
    host = (urllib.parse.urlsplit(inner_url(u)).hostname or "").lower()
    return any(host.endswith(s) for s in OFFICIAL_SUFFIXES)


def load_manifests(corpus_dir, input_files):
    """stem -> {url, captured, basis}; corpus MANIFEST-FETCH.tsv / MANIFEST.tsv, then bx manifest.tsv."""
    man = {}
    paths = sorted(glob.glob(os.path.join(corpus_dir, "*", "MANIFEST*.tsv")))
    paths += sorted({os.path.join(os.path.dirname(f), "manifest.tsv") for f in input_files})
    for p in paths:
        if not os.path.exists(p):
            continue
        with open(p, encoding="utf-8", errors="replace") as fh:
            for line in fh:
                parts = line.rstrip("\n").split("\t")
                if len(parts) < 3 or parts[0] == "file":
                    continue
                stem, cap, url = parts[0].strip(), parts[1].strip(), parts[2].strip()
                if stem.endswith(".txt"):
                    stem = stem[:-4]
                url = url.replace(" ", "%20")
                if url and stem not in man:
                    man[stem] = {"url": url, "captured": cap, "basis": f"manifest:{os.path.relpath(p, corpus_dir)}"}
    return man


def resolve_urls(row, manifest):
    stem = re.sub(r"\.txt$", "", row.get("source_file") or "")
    primary, archive = clean_url(row.get("primary_source_url")), clean_url(row.get("archive_url"))
    basis = []
    ov = url_override(stem)
    if ov:
        primary, archive = ov["primary"], ov["archive"]
        basis.append(ov["basis"])
    else:
        if primary:
            basis.append("row:primary_source_url")
        if archive:
            basis.append("row:archive_url")
        if not primary and stem in manifest:
            primary = manifest[stem]["url"]
            basis.append(manifest[stem]["basis"])
        if not archive and stem in manifest and re.fullmatch(r"\d{8,14}", manifest[stem]["captured"] or ""):
            archive = f"https://web.archive.org/web/{manifest[stem]['captured']}/{manifest[stem]['url']}"
            basis.append("archive derived from manifest capture timestamp")
    if archive and stem.startswith("20260921__") and "/web/20260921/" in archive:
        archive = ""
        basis.append("archive dropped: no Wayback capture on the 2026-09-21 fetch date")
    usable = primary or archive or ""
    if is_dead(primary) and archive:
        usable = archive
        basis.append("primary URL dead on 2026-09-23; Wayback copy used as the usable link")
    return {"primary": primary or None, "archive": archive or None, "usable": usable or None,
            "official_domain": is_official(usable) or is_official(archive), "basis": basis}


# --------------------------------------------------------------------------------------
# Source matching
# --------------------------------------------------------------------------------------
POST_STOP = {"then", "former", "formerly", "the", "and", "office", "district", "officer", "dist",
             "department", "section", "division", "taluk", "grade", "retd", "retired", "time", "charge",
             "concerned", "detachment", "of", "in", "at"}


class SourceCache:
    def __init__(self, corpus_dir):
        self.corpus_dir = corpus_dir
        self.cache = {}

    def get(self, agency, source_file):
        path = os.path.join(self.corpus_dir, agency or "", source_file or "")
        if path not in self.cache:
            if not source_file or not os.path.isfile(path):
                self.cache[path] = None
            else:
                with open(path, encoding="utf-8", errors="replace") as fh:
                    self.cache[path] = flatten(fh.read())
        return path, self.cache[path]


def initials_adjacent(low, s, e, inits):
    """True if the row's initials (e.g. ['k','p']) sit immediately before or after the token."""
    if not inits:
        return True
    want = "".join(inits)
    before = low[max(0, s - 16):s]
    after = low[e:e + 16]
    bi = "".join(re.findall(rf"(?<![{WORDCH}])([{WORDCH}]{{1,2}})(?=[\s.\-]*)", before))
    ai = "".join(re.findall(rf"(?<![{WORDCH}])([{WORDCH}]{{1,2}})(?![{WORDCH}])", after))
    return bi.endswith(want) or ai.startswith(want) or bi.endswith(want[::-1]) or want in bi or want in ai


def match_form(form, flat, low, date_rx, case_rx, post_toks):
    """Evaluate every occurrence of the form's anchor token; return list of hit dicts."""
    toks = form["long"]
    tok_rx = {t: word_re(t) for t in toks}
    counts = {t: len(tok_rx[t].findall(low)) for t in toks}
    if min(counts.values()) == 0:
        return []
    anchor = sorted(toks, key=lambda t: (counts[t], -len(t)))[0]
    hits = []
    for m in tok_rx[anchor].finditer(low):
        # ~600-char window: +-WINDOW around the name, or, when the name opens a list
        # entry, the 2*WINDOW chars from the entry start; never across an entry boundary.
        s0 = max(0, m.start() - WINDOW)
        start_mk = None
        for mk in ENTRY_MARKER.finditer(low, s0, m.end()):
            if mk.end() <= m.start() + 1:
                start_mk = mk                            # last marker before the name
        w0 = start_mk.start() if start_mk else s0
        if start_mk and m.start() - start_mk.start() <= 150:
            limit = max(m.end() + WINDOW, w0 + 2 * WINDOW)
        else:
            limit = m.end() + WINDOW
        limit = min(len(low), limit)
        nxt = ENTRY_MARKER.search(low, m.end(), limit)  # first marker after the name
        w1 = nxt.start() if nxt else limit
        segmented = bool(start_mk or nxt)
        wlow, wflat = low[w0:w1], flat[w0:w1]
        spans = [(m.start(), m.end())]
        ok_a = True
        for t in toks:
            if t == anchor:
                continue
            best = None
            for mm in tok_rx[t].finditer(wlow):
                s, e = mm.start() + w0, mm.end() + w0
                dd = abs(s - m.start())
                if best is None or dd < best[0]:
                    best = (dd, s, e)
            if best is None:
                ok_a = False
                break
            spans.append((best[1], best[2]))
        if not ok_a:
            continue
        ns, ne = min(s for s, _ in spans), max(e for _, e in spans)
        center = (ns + ne) // 2
        span = ne - ns
        single = len(toks) == 1
        init_ok = initials_adjacent(low, m.start(), m.end(), form["initials"]) if single else True
        d_hit = nearest(date_rx, wlow, center, w0) if date_rx else None
        c_hit = nearest(case_rx, wlow, center, w0) if case_rx else None
        conv = [x for x in (nearest([CONV_LOW], wlow, center, w0), nearest([CONV_FLAT], wflat, center, w0)) if x]
        conv = min(conv) if conv else None
        acq, co_acq = None, None
        for am in ACQ_LOW.finditer(wlow):
            s, e = am.start() + w0, am.end() + w0
            dist = 0 if s <= center <= e else min(abs(center - s), abs(center - e))
            qualified = bool(CO_ACCUSED_QUAL.search(low[max(w0, s - 40):s]))
            slot = "co" if qualified else "own"
            cur = co_acq if qualified else acq
            if cur is None or dist < cur[0]:
                if slot == "co":
                    co_acq = (dist, am.group(0), s, e)
                else:
                    acq = (dist, am.group(0), s, e)
        acq_closer = bool(acq and (conv is None or acq[0] < conv[0]))
        post_hits = sorted({t for t in post_toks if word_re(t).search(wlow)})
        # Acquittal/abatement wording anywhere else in the same entry (or in the whole
        # document for a single press release) -> not V2; a human decides who it covers.
        if segmented:
            r0 = w0
            nxt_all = ENTRY_MARKER.search(low, m.end(), min(len(low), w0 + 3000))
            r1 = nxt_all.start() if nxt_all else min(len(low), w0 + 3000)
        elif len(low) <= 12000:
            r0, r1 = 0, len(low)
        else:
            r0, r1 = max(0, m.start() - 2 * WINDOW), min(len(low), m.end() + 2 * WINDOW)
        elsewhere = None
        for am in ACQ_LOW.finditer(low, r0, r1):
            if not (w0 <= am.start() < w1):
                elsewhere = flat[max(r0, am.start() - 60):am.end() + 20]
                break
        hits.append({
            "form": form["text"], "anchor_pos": m.start(), "name_start": ns, "name_end": ne,
            "name_span": span, "initials_ok": init_ok, "single_token": single,
            "a": True, "b_date": d_hit, "b_case": c_hit, "c": conv, "acq": acq,
            "acq_closer": acq_closer, "co_acq": co_acq, "post_hits": post_hits,
            "segmented": segmented, "window": (w0, w1), "acq_elsewhere": elsewhere,
        })
    return hits


def hit_passes(h):
    return bool((h["b_date"] or h["b_case"]) and h["c"] and not h["acq_closer"]
                and h["name_span"] <= MAX_NAME_SPAN and h["initials_ok"])


def hit_score(h):
    return (hit_passes(h), bool(h["b_date"]), bool(h["c"]), not h["acq_closer"], h["initials_ok"],
            len(h["post_hits"]), -h["name_span"], -(h["c"][0] if h["c"] else 10**6), -h["anchor_pos"])


def snippet_span(flat, s, e):
    return flat[max(0, s):max(0, e)].strip()


def snippet(flat, h):
    pts = [h["name_start"], h["name_end"]]
    for k in ("b_date", "b_case", "c"):
        if h.get(k):
            pts += [h[k][2], h[k][3]]
    s, e = min(pts), max(pts)
    if e - s > SNIPPET_MAX - 20:
        c = (h["name_start"] + h["name_end"]) // 2
        s, e = max(0, c - SNIPPET_MAX // 2), c + SNIPPET_MAX // 2
    else:
        pad = (SNIPPET_MAX - (e - s)) // 2
        s, e = max(0, s - min(pad, 120)), e + min(pad, 120)
    e = min(e, len(flat), s + SNIPPET_MAX)
    return flat[s:e].strip()


def url_name_tokens(url, forms):
    """Name tokens (>= 4 chars) of the official that appear inside a URL (e.g. a PDF file name)."""
    if not url:
        return []
    u = urllib.parse.unquote(urllib.parse.unquote(url)).lower()
    utoks = set(TOKEN_RE.findall(u))
    return sorted({t for f in forms for t in f["long"] if len(t) >= 4 and t in utoks})


def find_alternate(row, forms, date_rx, case_rx, post_toks, cache, ctx):
    """Same agency, other cached source with a name-free official URL that independently
    shows name + date/case number + conviction wording for this official."""
    agency = row.get("source_agency")
    for stem in ctx["agency_files"].get(agency, []):
        if stem == re.sub(r"\.txt$", "", row.get("source_file") or ""):
            continue
        u = ctx["url_map"][stem]
        if not u["official_domain"] or url_name_tokens(u["primary"], forms) or url_name_tokens(u["archive"], forms):
            continue
        path, src = cache.get(agency, stem + ".txt")
        if src is None:
            continue
        flat, low = src
        hits = []
        for f in forms:
            hits += match_form(f, flat, low, date_rx, case_rx, post_toks)
        good = [h for h in hits if hit_passes(h) and not h["co_acq"] and not h["acq_elsewhere"]]
        if good and not any(h["acq_closer"] for h in hits):
            good.sort(key=hit_score, reverse=True)
            return {"source_file": stem + ".txt", "source_path": path, "primary": u["primary"],
                    "archive": u["archive"], "usable": u["usable"], "official_domain": True,
                    "basis": u["basis"] + ["alternate source: row URL embeds the official's name"],
                    "matched_snippet": snippet(flat, good[0]),
                    "date_text": good[0]["b_date"][1] if good[0]["b_date"] else None,
                    "conviction_text": good[0]["c"][1] if good[0]["c"] else None}
    return None


def verify_row(row, cache, manifest, ctx=None):
    res = {"level": None, "reasons": [], "checks": {}, "snippet": None, "source_path": None}
    urls = resolve_urls(row, manifest)
    res["urls"] = urls
    path, src = cache.get(row.get("source_agency"), row.get("source_file"))
    res["source_path"] = path
    if src is None:
        res["level"], res["reasons"] = "reject", ["source_file_missing"]
        return res
    flat, low = src
    officials = row.get("officials") or []
    raw_name = (officials[0] or {}).get("name") if officials else ""
    if not raw_name or NOT_A_NAME.search(raw_name):
        res["level"], res["reasons"] = "reject", ["no_usable_name"]
        return res
    if UNCERTAIN.search(raw_name):
        res["level"], res["reasons"] = "reject", ["name_uncertain_in_extraction"]
        return res
    forms = split_forms(raw_name)
    res["name_forms"] = [f["text"] for f in forms]
    if not forms:
        res["level"], res["reasons"] = "reject", ["no_usable_name"]
        return res
    d = parse_row_date(row.get("conviction_date"))
    date_rx = date_patterns(*d) if d else []
    case_rx = case_patterns(case_number_pairs(row.get("case_title_or_number")))
    post_toks = {t.lower() for t in TOKEN_RE.findall(row.get("post") or "")
                 if len(t) >= 4 and t.lower() not in POST_STOP}
    hits = []
    for f in forms:
        hits += match_form(f, flat, low, date_rx, case_rx, post_toks)
    if not hits:
        res["level"], res["reasons"] = "reject", ["name_not_found"]
        return res
    hits.sort(key=hit_score, reverse=True)
    best = hits[0]
    acq_hits = [h for h in hits if h["acq_closer"]]
    passing = [h for h in hits if hit_passes(h)]
    ck = {
        "a_name": True,
        "b_date": bool(best["b_date"]), "b_case_number": bool(best["b_case"]),
        "c_conviction_wording": bool(best["c"]),
        "no_closer_acquittal": not best["acq_closer"],
        "name_span_ok": best["name_span"] <= MAX_NAME_SPAN,
        "initials_ok": best["initials_ok"],
        "post_match": bool(best["post_hits"]),
        "official_domain": urls["official_domain"],
        "usable_url": bool(urls["usable"]),
    }
    res["checks"] = ck
    res["evidence"] = {
        "matched_form": best["form"],
        "name_span_chars": best["name_span"],
        "single_token_name": best["single_token"],
        "date_text": best["b_date"][1] if best["b_date"] else None,
        "date_distance": best["b_date"][0] if best["b_date"] else None,
        "case_text": best["b_case"][1] if best["b_case"] else None,
        "conviction_text": best["c"][1] if best["c"] else None,
        "conviction_distance": best["c"][0] if best["c"] else None,
        "acquittal_text": best["acq"][1] if best["acq"] else None,
        "acquittal_distance": best["acq"][0] if best["acq"] else None,
        "co_accused_acquittal_text": (snippet_span(flat, best["co_acq"][2] - 30, best["co_acq"][3])
                                      if best["co_acq"] else None),
        "entry_segmented": best["segmented"],
        "acquittal_elsewhere_in_entry": best["acq_elsewhere"],
        "post_tokens_matched": best["post_hits"],
        "name_hits_in_source": len(hits),
        "hits_with_closer_acquittal": len(acq_hits),
    }
    res["snippet"] = snippet(flat, best)
    if passing:
        best = passing[0]
        res["snippet"] = snippet(flat, best)
        reasons = []
        if best["co_acq"]:
            reasons.append("co_accused_acquittal_in_same_entry")
        if best["acq_elsewhere"]:
            reasons.append("acquittal_wording_elsewhere_in_entry")
        if not employing_body_stated(row):
            reasons.append("employing_body_not_stated")
            w0, w1 = best["window"]
            if PSU.search(flat[w0:w1]):
                reasons.append("psu_wording_in_source_entry")
        if acq_hits:
            reasons.append("acquittal_wording_near_another_mention")
        if not urls["usable"]:
            reasons.append("no_usable_source_url")
        elif not urls["official_domain"]:
            reasons.append("source_not_official_domain")
        leaky = sorted(set(url_name_tokens(urls["primary"], forms) + url_name_tokens(urls["archive"], forms)))
        if leaky:
            res["url_embeds_name"] = True
            alt = find_alternate(row, forms, date_rx, case_rx, post_toks, cache, ctx) if ctx else None
            if alt:
                res["original_urls"] = urls
                res["alternate_source"] = alt
                res["urls"] = {k: alt[k] for k in ("primary", "archive", "usable", "official_domain", "basis")}
            else:
                reasons.append("source_url_embeds_name_no_alternate")
        res["level"] = "V1" if reasons else "V2"
        res["reasons"] = reasons
        return res
    if acq_hits and not any(h["c"] and not h["acq_closer"] for h in hits):
        res["level"], res["reasons"] = "reject", ["acquittal_wording"]
        return res
    missing = []
    if not (best["b_date"] or best["b_case"]):
        missing.append("missing_b_date_or_case_number")
    if not best["c"]:
        missing.append("missing_c_conviction_wording")
    if best["acq_closer"]:
        missing.append("acquittal_closer_than_conviction")
    if best["name_span"] > MAX_NAME_SPAN:
        missing.append("name_tokens_scattered")
    if not best["initials_ok"]:
        missing.append("initials_mismatch_single_token_name")
    if acq_hits:
        missing.append("acquittal_wording_near_another_mention")
    res["level"], res["reasons"] = "V1", missing or ["weak_match"]
    return res


# --------------------------------------------------------------------------------------
# Dedupe
# --------------------------------------------------------------------------------------
def post_tokens(row):
    return {t.lower() for t in TOKEN_RE.findall(row.get("post") or "") if len(t) >= 3
            and t.lower() not in POST_STOP}


def jaccard(a, b):
    return len(a & b) / len(a | b) if a and b else 0.0


def initials_of(row):
    forms = split_forms((row.get("officials") or [{}])[0].get("name"))
    latin = [f for f in forms if f["script"] == "latin"]
    return "".join((latin or forms or [{"initials": []}])[0]["initials"])


def is_dup(r1, r2):
    i1, i2 = initials_of(r1), initials_of(r2)
    if i1 and i2 and i1 != i2:
        return False
    d1, d2 = parse_row_date(r1.get("conviction_date")), parse_row_date(r2.get("conviction_date"))
    if not d1 or not d2 or d1[0] != d2[0]:
        return False
    c1 = {(n, y2) for n, _, y2 in case_number_pairs(r1.get("case_title_or_number"))}
    c2 = {(n, y2) for n, _, y2 in case_number_pairs(r2.get("case_title_or_number"))}
    if c1 and c2 and not (c1 & c2):
        return False
    pj = jaccard(post_tokens(r1), post_tokens(r2))
    if d1[2] and d2[2]:
        diff = abs((dt.date(*d1) - dt.date(*d2)).days)
        return diff <= 3 or (diff <= 60 and pj >= 0.3)
    return pj >= 0.3 or bool(c1 & c2)


LEVEL_RANK = {"V2": 2, "V1": 1}
CONF_RANK = {"high": 2, "medium": 1, "low": 0}


def best_key(item):
    row, ver = item
    d = parse_row_date(row.get("conviction_date")) or (0, None, None)
    ck = ver.get("checks", {})
    return (LEVEL_RANK.get(ver["level"], 0), CONF_RANK.get(row.get("confidence"), 0),
            sum(1 for v in ck.values() if v), 2 if d[2] else (1 if d[1] else 0),
            bool(case_number_pairs(row.get("case_title_or_number"))), bool(ver["urls"]["primary"]),
            row["case_id"])


def dedupe(items):
    """items: list of (row, ver). Returns (kept, dropped[(row, ver, kept_case_id)])."""
    by_key = collections.defaultdict(list)
    for i, (row, ver) in enumerate(items):
        forms = split_forms((row["officials"][0] or {}).get("name"))
        by_key[(name_key(forms), (row.get("state") or "").lower())].append(i)
    parent = list(range(len(items)))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for idxs in by_key.values():
        for a in range(len(idxs)):
            for b in range(a + 1, len(idxs)):
                if is_dup(items[idxs[a]][0], items[idxs[b]][0]):
                    parent[find(idxs[a])] = find(idxs[b])
    groups = collections.defaultdict(list)
    for i in range(len(items)):
        groups[find(i)].append(i)
    kept, dropped = [], []
    for g in groups.values():
        g_sorted = sorted(g, key=lambda i: best_key(items[i]), reverse=True)
        top = items[g_sorted[0]]
        aliases = sorted(items[i][0]["case_id"] for i in g_sorted[1:])
        top[1]["alias_case_ids"] = aliases
        kept.append(top)
        for i in g_sorted[1:]:
            dropped.append((items[i][0], items[i][1], top[0]["case_id"]))
    kept.sort(key=lambda it: it[0]["case_id"])
    return kept, dropped


# --------------------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------------------
def load_rows(globs):
    files = sorted({f for g in globs for f in glob.glob(g)})
    rows = []
    for f in files:
        with open(f, encoding="utf-8") as fh:
            for ln, line in enumerate(fh, 1):
                if not line.strip():
                    continue
                r = json.loads(line)
                r["_input_file"] = f
                r["_input_line"] = ln
                rows.append(r)
    return files, rows


def dump_jsonl(path, recs):
    with open(path, "w", encoding="utf-8") as fh:
        for r in recs:
            fh.write(json.dumps(r, ensure_ascii=False, sort_keys=True) + "\n")


def md_escape(s):
    return str(s if s is not None else "").replace("|", "\\|").replace("\n", " ")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--input-glob", action="append", help="candidate cases.jsonl glob (repeatable)")
    ap.add_argument("--corpus-dir", default=DEFAULT_CORPUS, help="cached source texts: <dir>/<agency>/<source_file>")
    ap.add_argument("--out-dir", default=DEFAULT_OUT, help="PRIVATE output directory (never inside a git repo)")
    ap.add_argument("--min-confidence", default="medium", choices=["high", "medium", "low"])
    ap.add_argument("--seed", type=int, default=20260923, help="seed for the spot-check sample")
    ap.add_argument("--as-of", default=dt.date.today().isoformat(), help="reject conviction dates after this day")
    args = ap.parse_args()
    globs = args.input_glob or DEFAULT_GLOBS
    as_of = dt.date.fromisoformat(args.as_of)

    files, rows = load_rows(globs)
    if not rows:
        sys.exit("no input rows found")
    os.makedirs(args.out_dir, exist_ok=True)
    manifest = load_manifests(args.corpus_dir, files)
    cache = SourceCache(args.corpus_dir)
    # stem -> resolved URLs, for every cached source any row points at (alternate-source search)
    url_map, agency_files = {}, collections.defaultdict(list)
    for r in sorted(rows, key=lambda x: x["case_id"]):
        stem = re.sub(r"\.txt$", "", r.get("source_file") or "")
        if not stem or stem in url_map:
            continue
        u = resolve_urls(r, manifest)
        if u["usable"]:
            url_map[stem] = u
            agency_files[r.get("source_agency")].append(stem)
    ctx = {"url_map": url_map, "agency_files": {k: sorted(v) for k, v in agency_files.items()}}
    min_conf = CONF_RANK[args.min_confidence]

    excluded, survivors = [], []
    for row in rows:
        reasons = []
        if CONF_RANK.get(row.get("confidence"), 0) < min_conf:
            reasons.append(f"confidence_{row.get('confidence') or 'missing'}")
        else:
            reasons += scope_reasons(row)
            d = parse_row_date(row.get("conviction_date"))
            if d and dt.date(d[0], d[1] or 1, d[2] or 1) > as_of:
                reasons.append("conviction_date_in_future")
        if reasons:
            excluded.append((row, {"stage": "confidence" if reasons[0].startswith("confidence_") else "scope",
                                   "reasons": reasons}))
            continue
        ver = verify_row(row, cache, manifest, ctx)
        if ver["level"] == "reject":
            excluded.append((row, {"stage": "source_match", "reasons": ver["reasons"], "verification": ver}))
            continue
        survivors.append((row, ver))

    kept, dropped = dedupe(survivors)
    for row, ver, kept_id in dropped:
        excluded.append((row, {"stage": "dedupe", "reasons": [f"duplicate_of:{kept_id}"], "verification": ver}))

    def out_rec(row, ver):
        rec = {k: v for k, v in row.items()}
        rec["alias_case_ids"] = ver.get("alias_case_ids", [])
        rec["usable_source_url"] = ver["urls"]["usable"]
        rec["resolved_primary_source_url"] = ver["urls"]["primary"]
        rec["resolved_archive_url"] = ver["urls"]["archive"]
        rec["government"] = government_of(row)
        rec["verification"] = {
            "level": ver["level"],
            "reasons": ver["reasons"],
            "checks": ver["checks"],
            "checks_passed": sorted(k for k, v in ver["checks"].items() if v),
            "evidence": ver.get("evidence"),
            "matched_snippet": ver["snippet"],
            "source_path": ver["source_path"],
            "url_basis": ver["urls"]["basis"],
            "url_embeds_name": bool(ver.get("url_embeds_name")),
            "original_urls_withheld_from_public": ver.get("original_urls"),
            "alternate_source": ver.get("alternate_source"),
            "name_forms": ver.get("name_forms"),
            "method": "verify_civil.py deterministic window match (no network, no LLM)",
        }
        return rec

    v2 = [out_rec(r, v) for r, v in kept if v["level"] == "V2"]
    v1 = [out_rec(r, v) for r, v in kept if v["level"] == "V1"]
    exc = []
    for row, info in sorted(excluded, key=lambda x: x[0]["case_id"]):
        rec = {k: v for k, v in row.items()}
        rec["exclusion"] = {"stage": info["stage"], "reasons": info["reasons"]}
        if info.get("verification"):
            ver = info["verification"]
            rec["exclusion"]["level_before_dedupe"] = ver.get("level")
            rec["exclusion"]["checks"] = ver.get("checks")
            rec["exclusion"]["matched_snippet"] = ver.get("snippet")
            rec["exclusion"]["source_path"] = ver.get("source_path")
        exc.append(rec)

    dump_jsonl(os.path.join(args.out_dir, "civil-verified.jsonl"), v2)
    dump_jsonl(os.path.join(args.out_dir, "civil-v1.jsonl"), v1)
    dump_jsonl(os.path.join(args.out_dir, "civil-excluded.jsonl"), exc)

    # ------------------------------------------------------------------ report
    n_in = len(rows)
    conf_ok = [r for r in rows if CONF_RANK.get(r.get("confidence"), 0) >= min_conf]
    reason_ct = collections.Counter()
    stage_ct = collections.Counter()
    for rec in exc:
        stage_ct[rec["exclusion"]["stage"]] += 1
        for rsn in rec["exclusion"]["reasons"]:
            reason_ct[rsn.split(":")[0]] += 1
    pre_v2 = sum(1 for _, v in survivors if v["level"] == "V2")
    pre_v1 = sum(1 for _, v in survivors if v["level"] == "V1")
    L = []
    L.append("# Babuwatch civil-servant verification report (PRIVATE - contains names)\n")
    L.append(f"Generated by `verify_civil.py` (deterministic; seed {args.seed}; as-of {args.as_of}).\n")
    L.append("## Funnel\n")
    L.append("| Step | Rows |\n|---|---|")
    L.append(f"| Candidate rows read ({len(files)} files) | {n_in} |")
    L.append(f"| Confidence >= {args.min_confidence} | {len(conf_ok)} |")
    L.append(f"| Excluded by scope filters | {stage_ct['scope']} |")
    L.append(f"| Rejected at source match | {stage_ct['source_match']} |")
    L.append(f"| Matched before dedupe: V2 / V1 | {pre_v2} / {pre_v1} |")
    L.append(f"| Removed as duplicates | {stage_ct['dedupe']} |")
    L.append(f"| **V2 after dedupe (civil-verified.jsonl)** | **{len(v2)}** |")
    L.append(f"| V1 after dedupe (civil-v1.jsonl) | {len(v1)} |")
    L.append(f"| Excluded total (civil-excluded.jsonl) | {len(exc)} |")
    L.append(f"\nCheck: {len(v2)} + {len(v1)} + {len(exc)} = {len(v2) + len(v1) + len(exc)} (input {n_in}).\n")
    L.append("## Exclusion reasons (a row can carry several)\n")
    L.append("| Reason | Rows |\n|---|---|")
    for k, v in sorted(reason_ct.items(), key=lambda kv: (-kv[1], kv[0])):
        L.append(f"| {k} | {v} |")
    L.append("\n## V1 reasons\n")
    v1r = collections.Counter(rsn for r in v1 for rsn in r["verification"]["reasons"])
    L.append("| Reason | Rows |\n|---|---|")
    for k, v in sorted(v1r.items(), key=lambda kv: (-kv[1], kv[0])):
        L.append(f"| {k} | {v} |")

    def table(title, keyf):
        L.append(f"\n## By {title}\n")
        L.append(f"| {title} | candidates (conf ok) | V2 | V1 | excluded (conf ok) |\n|---|---|---|---|---|")
        ks = sorted({keyf(r) for r in conf_ok})
        for k in ks:
            c = sum(1 for r in conf_ok if keyf(r) == k)
            a = sum(1 for r in v2 if keyf(r) == k)
            b = sum(1 for r in v1 if keyf(r) == k)
            e = sum(1 for r in exc if keyf(r) == k and r["exclusion"]["stage"] != "confidence")
            L.append(f"| {k} | {c} | {a} | {b} | {e} |")

    table("agency", lambda r: r.get("source_agency") or "?")
    table("state", lambda r: r.get("state") or "?")
    L.append("\n## V2 by government level\n")
    for k, v in sorted(collections.Counter(r["government"] for r in v2).items()):
        L.append(f"- {k}: {v}")
    L.append("\n## Evidence strength among V2\n")
    L.append(f"- matched by date: {sum(1 for r in v2 if r['verification']['checks']['b_date'])}; "
             f"by case number only: {sum(1 for r in v2 if not r['verification']['checks']['b_date'])}")
    L.append(f"- post/department also matched in window: {sum(1 for r in v2 if r['verification']['checks']['post_match'])}")
    L.append(f"- single-token names (e.g. 'Tr.Devadoss'): "
             f"{sum(1 for r in v2 if r['verification']['evidence']['single_token_name'])}")
    L.append(f"- source URL from override/manifest (not the row): "
             f"{sum(1 for r in v2 if not any(b.startswith('row:') for b in r['verification']['url_basis']))}")

    rng = random.Random(args.seed)
    sample = rng.sample(v2, min(25, len(v2)))
    L.append(f"\n## Spot-check: {len(sample)} random V2 rows\n")
    L.append("Row facts on the left, the matched source window on the right. Confirm the snippet "
             "shows this person convicted on this date.\n")
    for i, r in enumerate(sample, 1):
        ev = r["verification"]["evidence"]
        o = r["officials"][0]
        L.append(f"### {i}. `{r['case_id']}` ({r['source_agency']}, {r['state']})\n")
        L.append(f"- **Name**: {md_escape(o.get('name'))}  |  **Post**: {md_escape(r.get('post'))}  |  "
                 f"**Dept**: {md_escape(r.get('department'))}")
        L.append(f"- **Court**: {md_escape(r.get('trial_court_name'))}  |  **Date**: {r.get('conviction_date')}  |  "
                 f"**Case**: {md_escape(r.get('case_title_or_number'))}")
        L.append(f"- **Sentence**: {md_escape(r.get('sentence'))}")
        L.append(f"- **Matched**: date `{md_escape(ev['date_text'])}` / case `{md_escape(ev['case_text'])}` / "
                 f"conviction `{md_escape(ev['conviction_text'])}` / post tokens {ev['post_tokens_matched']}")
        L.append(f"- **Source**: {r['usable_source_url']}")
        L.append(f"\n> {md_escape(r['verification']['matched_snippet'])}\n")
    with open(os.path.join(args.out_dir, "VERIFY-REPORT.md"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(L) + "\n")

    print(f"input rows: {n_in}  (confidence ok: {len(conf_ok)})")
    print(f"excluded: scope {stage_ct['scope']}, source-match {stage_ct['source_match']}, "
          f"confidence {stage_ct['confidence']}, dedupe {stage_ct['dedupe']}")
    print(f"before dedupe: V2 {pre_v2}, V1 {pre_v1}")
    print(f"after dedupe:  V2 {len(v2)}, V1 {len(v1)}")
    print(f"wrote {args.out_dir}/civil-verified.jsonl, civil-v1.jsonl, civil-excluded.jsonl, VERIFY-REPORT.md")


if __name__ == "__main__":
    main()
