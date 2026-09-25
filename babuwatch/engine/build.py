#!/usr/bin/env python3
"""Watch engine — static site builder for court-adjudicated registers
(stdlib only). Originally the Copwatch India builder; now builds every watch
under datalibertarian.in/babuwatch from a profile (profiles/<slug>.py).

Renders the copwatchindia.org design (paper/slate/brass tokens, Lora+Inter,
masthead/nav, tracker cards, incident pages, patterns dashboard) over
court-adjudicated data (High Court / Supreme Court judgments plus
trial-court convictions; counts computed from data at build time).
Static-only: no forms; search/filter is client-side JS over
/data/index.json, honouring the ?filter= / ?q= vocabulary.

    python3 engine/build.py --watch babuwatch --out dist/babuwatch

Normally run for every watch by babuwatch/build_all.py.
"""
import csv
import html
import json
import os
import re
import shutil
import sys
from collections import Counter
from datetime import date
from html.parser import HTMLParser
from urllib.parse import quote as urlquote

ENGINE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(ENGINE_DIR)          # babuwatch/ (profiles, data, templates)
HERE = ROOT
sys.path.insert(0, ROOT)
import profiles                                                   # noqa: E402


def _load_json(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


# News-style card text (babuwatch/data/plain.json) and number-plate case numbers
# (registers/plates.json), keyed by record id. Both optional: cards fall back to
# the record's own title and summary.
PLAIN = {} if os.environ.get("BW_NO_PLAIN") else _load_json(
    os.path.join(os.path.dirname(ENGINE_DIR), "data", "plain.json"), {})
PLATES = _load_json(os.path.join(os.path.dirname(os.path.dirname(ENGINE_DIR)),
                                 "registers", "plates.json"), {})

# One engine, many watches. `--watch <slug>` picks a profile from
# profiles/<slug>.py (default: babuwatch); `--out <dir>` picks where the
# site is written. Every site-specific constant below comes from the profile,
# so nothing in this file names a particular watch.
WATCH = profiles.cli_arg("--watch", os.environ.get("WATCH", "babuwatch"))
P = profiles.load(WATCH)
T = P["text"]                    # every site-specific sentence lives here
DIST = os.path.abspath(profiles.cli_arg(
    "--out", os.path.join(ROOT, "dist", WATCH)))
# Input datasets. Each is a directory with any of cases.json (HC/SC tier),
# tier2.json (trial-court tier), tier2-overturned.json, cases.csv and
# context.json. `home` names the watch whose pages render each record; a
# record whose home is another watch is listed here but links there.
DATASETS = [dict(d, dir=os.path.join(ROOT, d["dir"])) for d in P["datasets"]]
PRIMARY = DATASETS[0]["dir"]
DATA_JSON = os.path.join(PRIMARY, "cases.json")
DATA_CSV = os.path.join(PRIMARY, "cases.csv")
TIER2_JSON = os.path.join(PRIMARY, "tier2.json")
OVERTURNED_JSON = os.path.join(PRIMARY, "tier2-overturned.json")
CONTEXT_JSON = os.path.join(PRIMARY, "context.json")
REF_DIR = os.path.join(ROOT, "templates", P["templates"])
SHARED_DIR = os.path.join(ROOT, "templates", "shared")
REF_STYLES = os.path.join(SHARED_DIR, "styles.css")
REF_NAVJS = os.path.join(SHARED_DIR, "public-nav.js")
REF_BRAND = os.path.join(REF_DIR, "assets", "brand")

# Base path: the watch is served at SITE_ORIGIN + BASE. dist/ layout stays
# root-style; prefix_html() adds BASE to every emitted root-relative link,
# and every canonical/OG URL, JSON-LD id, sitemap loc and robots entry
# carries it too.
SITE_ORIGIN = P.get("origin", "https://datalibertarian.in")
BASE = profiles.cli_arg("--base", P["base"])   # --base: tests only
SITE_URL = SITE_ORIGIN + BASE
SITE_NAME = P["site_name"]
SHORT_NAME = P["short_name"]
TAGLINE = P["tagline"]
CONTACT_EMAIL = P["contact_email"]
# Served base for every absolute URL emitted by the AI-access layer
# (llms.txt, llms-full.txt, Markdown twins, JSON endpoints, robots.txt).
PUBLIC_BASE = SITE_URL
# More than one kind of public servant in this watch (the umbrella):
# turns on the 'Who' facet and the per-row service key.
MULTI_SERVICE = len({d["service"] for d in P["datasets"]}) > 1
WATCHES = profiles.registry()    # every watch, for the header switcher and
                                 # cross-watch record links
AI_BOTS = ["GPTBot", "ClaudeBot", "anthropic-ai", "Google-Extended",
           "PerplexityBot", "CCBot", "Bytespider"]
BUILD_DATE = date.today().isoformat()
FONTS_URL = ("https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;"
             "0,500;0,600;1,400&family=Inter:wght@400;500;600;700&display=swap")

STATES_36 = [
    "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh",
    "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand",
    "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
    "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
]

# Site category vocabulary, verbatim from copwatchindia.org (R85). Public
# category is ALWAYS one of these five; house codes live in
# admin_category/admin_subcategory and are never rendered publicly.
SITE_CATEGORIES = P["site_categories"]
# House code (category.subcategory) -> public site label; used when a record
# lacks the compiled site `category`.
CATEGORY_MAP = P["category_map"]
CATEGORY_LABEL = {"brutality": "Brutality", "misconduct": "Misconduct",
                  "corruption": "Corruption"}
# FIXES.json anonymise list (merged_ids whose victims render ONLY via
# redacted role nouns). CWC-0431 is absent from the current compile.
ANONYMISE = {"CWC-0047", "CWC-0090", "CWC-0131", "CWC-0134", "CWC-0153",
             "CWC-0180", "CWC-0197", "CWC-0218", "CWC-0233", "CWC-0259",
             "CWC-0270", "CWC-0301", "CWC-0306", "CWC-0307", "CWC-0322",
             "CWC-0324", "CWC-0328", "CWC-0341", "CWC-0358", "CWC-0377",
             "CWC-0401", "CWC-0403", "CWC-0413", "CWC-0431"}
OUTCOME_LABEL = {
    "adverse_finding_compensation": "Adverse finding + compensation",
    "adverse_finding": "Adverse finding",
    "conviction_upheld": "Conviction upheld",
    "conviction_by_hc": "Conviction entered by High Court",
    "conviction_by_sc": "Conviction entered by Supreme Court",
    "disciplinary_upheld": "Disciplinary action upheld",
    "trial_court_conviction": "Trial-court conviction",
}
NAV_LINKS = [tuple(x) for x in P["nav"]]
# Trial-court controlled vocabularies (rendered verbatim on tier-2 pages).
COURT_LEVEL_LABEL = {
    "special_acb": "Special Court (ACB)",
    "cbi_court": "CBI Court",
    "sessions": "Sessions Court",
    "magistrate": "Magistrate's Court",
    "lokayukta_court": "Lokayukta Court",
}
APPEAL_STATUS_LABEL = {
    "unknown": "Unknown",
    "upheld": "Upheld on appeal",
    "set_aside": "Set aside on appeal",
    "none_known": "No appeal known",
    "pending": "Appeal pending",
}

FILTER_MAIN = [("", "All records"), ("A", "Externally reported"),
               ("B", "%s-verified" % SHORT_NAME), ("actions",
                                             "With institutional response")]
FILTER_MORE = [("V2", "V2 attributable"), ("V3", "V3 corroborated"),
               ("pending", "Pending action"), ("concluded", "Concluded action"),
               ("checked", "Followed up"), ("never_checked", "Never re-checked"),
               ("stale_checks", "Stale checks"), ("retracted", "Retracted")]


# ---- Dataset headline counts (computed from data at build time) ----
# n1 = High Court / Supreme Court judgments (cases.json), n2 = trial-court
# convictions (tier2.json), n_over = convictions later set aside on appeal
# (tier2-overturned.json), kept out of every count. No headline number is
# ever hard-coded: main() derives all four from the data files.
def fmt_thousands(n):
    try:
        return "%s" % f"{int(n):,}"
    except (TypeError, ValueError):
        return "0"


# Record-level wording by kind of public servant (the record's `service`,
# set per dataset). Site-level wording lives in the profile instead.
SERVICE_WORDS = {
    "police": {"accused": "the accused police personnel",
               "of": "police personnel", "fallback": "Police personnel",
               "case": "police accountability case", "label": "Police",
               "people": "Officers", "show_victims": True},
    "civil": {"accused": "the accused public servant",
              "of": "a public servant", "fallback": "Public servant",
              "case": "public-servant accountability case",
              "label": "Civil servant", "people": "Official",
              "show_victims": False},
}


def sw(c, key):
    """Record-level word for c's service (unknown services read as civil)."""
    svc = (c or {}).get("service") or "police"
    return SERVICE_WORDS.get(svc, SERVICE_WORDS["civil"])[key]


def fill(tpl, **kw):
    """Profile copy uses {{name}} placeholders (never %-format, so copy may
    contain a literal percent sign)."""
    for k, v in kw.items():
        tpl = tpl.replace("{{%s}}" % k, str(v))
    return tpl


# Per-service counts over the published records, set in main() before any
# page renders; profile copy can cite them ({{n_police}}, {{n_civil}}).
SERVICE_COUNTS = {}


def headline_sentence(n1, n2):
    total = (n1 or 0) + (n2 or 0)
    return fill(T["headline"], total=fmt_thousands(total), n1=n1, n2=n2,
                **{"n_" + k: fmt_thousands(v)
                   for k, v in SERVICE_COUNTS.items()})


def overturned_note(n_over):
    return fill(T["overturned_note"], n=(n_over or 0))


def results_line(shown, n1, n2):
    total = (n1 or 0) + (n2 or 0)
    return ("showing %s of %s records (%d HC/SC \u00b7 %d trial court)"
            % (fmt_thousands(shown), fmt_thousands(total), n1, n2))


def slugify(s):
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s.lower())).strip("-")


def esc(s):
    return html.escape("" if s is None else str(s), quote=True)


def pretty_label(s):
    return (s or "").replace("_", " ").strip()


MONTHS = ["", "January", "February", "March", "April", "May", "June", "July",
          "August", "September", "October", "November", "December"]
MONTHS_ABBR = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug",
               "Sep", "Oct", "Nov", "Dec"]


def fmt_date(ds, precision=None):
    if not ds:
        return "Date not stated"
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})", str(ds))
    if not m:
        return esc(str(ds))
    y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
    if precision == "month":
        return "%s %d" % (MONTHS[mo], y)
    return "%d %s %d" % (d, MONTHS[mo], y)


def fmt_date_short(ds):
    if not ds:
        return "Date not stated"
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})", str(ds))
    if not m:
        return str(ds)
    y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
    return "%d %s %d" % (d, MONTHS_ABBR[mo], y)


def fmt_inr(n):
    if n is None:
        return None
    try:
        n = int(n)
    except (TypeError, ValueError):
        return esc(str(n))
    s = str(n)
    if len(s) > 3:
        head, tail = s[:-3], s[-3:]
        parts = []
        while len(head) > 2:
            parts.insert(0, head[-2:])
            head = head[:-2]
        parts.insert(0, head)
        grouped = ",".join(parts) + "," + tail
    else:
        grouped = s
    if n >= 10000000 and n % 10000000 == 0:
        words = "Rs %g crore" % (n / 10000000)
    elif n >= 100000 and n % 100000 == 0:
        words = "Rs %g lakh" % (n / 100000)
    elif n >= 100000:
        words = "Rs %.1f lakh" % (n / 100000)
    else:
        return "Rs %s" % grouped
    return "%s (%s)" % (words, "Rs " + grouped)


# ---- Verification / status mapping (documented on /methodology) ----
# Per-record verification_status/tier from the compiled data (default
# V2 / Tier A). V3 is NEVER emitted for AI-only verification: it requires
# every field_mapping.v3_promotion_requires key to be non-null (R20,R25).
def v3_earned(c):
    vb = c.get("v3_basis") or {}
    if c.get("authenticity_check") is None:
        return False
    if not isinstance(vb, dict):
        return False
    if vb.get("corroborated_fact") is None or vb.get("limits") is None:
        return False
    if c.get("privacy_review") is None:
        return False
    if c.get("publication_basis") is None:
        return False
    if not c.get("reviews"):
        return False
    if any(isinstance(o, dict) and o.get("publish_grade") == "named_safe"
           for o in (c.get("officers") or [])):
        if c.get("legal_review") is None:
            return False
    return True


def v_level(c):
    v = str(c.get("verification_status") or "V2").strip().upper()
    if v == "V3" and not v3_earned(c):
        return "V2"
    return v if v in ("V1", "V2", "V3") else "V2"


def has_compensation(c):
    """A compensation award is shown only when the record carries an amount or
    codes the relief as compensation; an adverse finding alone is not one."""
    try:
        amt = float(c.get("compensation_inr") or 0)
    except (TypeError, ValueError):
        amt = 0
    return amt > 0 or c.get("sentence_type") == "compensation_only"


def outcome_code(c, default=""):
    """Outcome as displayed: adverse_finding_compensation without any award
    renders as a plain adverse finding (audit 2026-09-25, finding 35)."""
    o = c.get("outcome_type") or default
    if o == "adverse_finding_compensation" and not has_compensation(c):
        return "adverse_finding"
    return o


def tier(c):
    if v_level(c) == "V3":
        return "B"
    return "B" if "Tier B" in str(c.get("tier") or "") else "A"


def tier_label(c):
    return ("%s-verified" % SHORT_NAME if tier(c) == "B"
            else "Externally reported")


def tier_full_label(c):
    t = str(c.get("tier") or "")
    if t.startswith("Tier "):
        return t
    return ("Tier B \u2014 %s-verified" % SHORT_NAME if tier(c) == "B"
            else "Tier A \u2014 Externally reported or officially recorded")


def verification_line(c):
    return "%s \u00b7 %s" % (v_level(c), tier_label(c))


def tier_badge_class(c):
    return "verified" if tier(c) == "B" else "reported"


DERIVED_LOG = []


_SITE_CAT_LOGGED = set()


def site_category(c):
    cat = c.get("category")
    if cat in SITE_CATEGORIES:
        return cat
    house = "%s.%s" % (c.get("admin_category") or c.get("category") or "",
                       c.get("admin_subcategory")
                       or c.get("subcategory") or "")
    mid = c.get("merged_id") or c.get("case_id")
    if house in CATEGORY_MAP:
        if mid not in _SITE_CAT_LOGGED:
            _SITE_CAT_LOGGED.add(mid)
            DERIVED_LOG.append("%s: category derived via category_map (%s)"
                               % (mid, house))
        return CATEGORY_MAP[house]
    if mid not in _SITE_CAT_LOGGED:
        _SITE_CAT_LOGGED.add(mid)
        DERIVED_LOG.append("%s: category defaulted to Other" % mid)
    return "Other"


def primary_allegation(c):
    allegs = c.get("allegations") or []
    for a in allegs:
        if isinstance(a, dict) and a.get("primary"):
            return a
    return allegs[0] if allegs else {}


def evidence_position(c):
    return primary_allegation(c).get("position") or "Reported allegation"


def actions(c):
    return [a for a in (c.get("institutional_response") or [])
            if isinstance(a, dict)]


def is_pending(c):
    return any(a.get("status") in ("Pending", "Initiated") for a in actions(c))


def is_concluded(c):
    return any(a.get("status") == "Concluded" for a in actions(c))


def is_checked(c):
    return bool(c.get("followup_history"))


def is_never_checked(c):
    return not is_checked(c)


def last_checked_date(c):
    lc = c.get("last_checked")
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})", str(lc or ""))
    if not m:
        return None
    try:
        return date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
    except ValueError:
        return None


def is_stale(c):
    # A check older than 180 days is shown as stale (R31,R77).
    lc = last_checked_date(c)
    if lc is None:
        return False
    return (date.today() - lc).days > 180


def is_retracted(c):
    r = c.get("retracted")
    if isinstance(r, dict):
        return bool(r.get("is_retracted"))
    return bool(r)


def has_actions(c):
    return bool(actions(c))


def appeal_caveat(c):
    # Judgments under 2 years old may still be under appeal (R56,W7).
    try:
        return int(c.get("judgment_year") or 0) >= date.today().year - 1
    except (TypeError, ValueError):
        return False


def matches_filter(c, f):
    if not f:
        return not is_retracted(c)
    if f == "A":
        return tier(c) == "A" and not is_retracted(c)
    if f == "B":
        return tier(c) == "B" and not is_retracted(c)
    if f == "actions":
        return has_actions(c) and not is_retracted(c)
    if f == "V2":
        return v_level(c) == "V2" and not is_retracted(c)
    if f == "V3":
        return v_level(c) == "V3" and not is_retracted(c)
    if f == "pending":
        return is_pending(c) and not is_retracted(c)
    if f == "concluded":
        return is_concluded(c) and not is_retracted(c)
    if f == "checked":
        return is_checked(c) and not is_retracted(c)
    if f == "never_checked":
        return is_never_checked(c) and not is_retracted(c)
    if f == "stale_checks":
        return is_stale(c) and not is_retracted(c)
    if f == "retracted":
        return is_retracted(c)
    return not is_retracted(c)


def location_short(c):
    bits = [x for x in [c.get("district"), c.get("state")] if x]
    loc = ", ".join(bits) if bits else (c.get("state") or "Location not stated")
    return loc


# ---- Record IDs: CW-YYYY-NNNN (nomenclature, mandatory) ----
def assign_record_ids(cases):
    """Use the `record_id` field when cases.json provides it, else derive
    deterministically: judgment year + per-year sequence ordered by
    (judgment_year, merged_id)."""
    seq = {}
    n_derived = 0
    for c in sorted(cases, key=lambda c: (c.get("judgment_year") or 0,
                                         c.get("merged_id") or "")):
        y = c.get("judgment_year") or 0
        seq[y] = seq.get(y, 0) + 1
        if c.get("record_id"):
            continue
        c["record_id"] = "CW-%04d-%04d" % (y, seq[y])
        n_derived += 1
    if n_derived:
        DERIVED_LOG.append("record_id derived for %d records "
                           "(judgment year + sequence)" % n_derived)
    return cases


def rec_id(c):
    return c.get("record_id") or c.get("merged_id")


# ---- Name gates: officer display-only + victim redaction ----
# RENDER ONLY officers[].display. NEVER render officers[].name unless
# publish_grade == "named_safe". Victims of anonymised records render ONLY
# via victims_redacted role nouns. Both gates also scrub leftover name
# fragments out of narrative fields (summary / holding / quote / titles),
# because the compile redacted most but not all occurrences.
RANK_WORDS = ("constable|head constable|assistant sub-inspector|"
              "sub-inspector|inspector|deputy superintendent|superintendent|"
              "senior superintendent|assistant commissioner|"
              "deputy commissioner|commissioner|director general|"
              "inspector general|deputy inspector|additional superintendent|"
              "asi|si|psi|sho|dsp|sp|ssp|dig|ig|dgp|acp|dcp|ipsofficer|"
              "officer|personnel|policeman|policemen|jawan|headconstable")
GENERIC_NAME_WORDS = {
    "and", "or", "the", "a", "an", "of", "other", "others", "detained",
    "men", "man", "woman", "women", "boy", "girl", "son", "daughter",
    "wife", "mother", "father", "husband", "brother", "sister", "aged",
    "age", "alias", "minor", "deceased", "dead", "late", "unnamed",
    "unknown", "petitioner", "complainant", "victim", "accused",
    "appellant", "respondent", "respondents", "with", "four", "five",
    "two", "three", "six", "seven", "eight", "nine", "ten", "one",
    "officer", "officers", "official", "officials", "constable",
    "constables", "inspector", "inspectors", "personnel", "policeman",
    "policemen", "police", "party", "guard", "guards", "escort",
    "escorts", "duty", "staff", "authorities", "authority", "jail",
    "prison", "medical", "including", "office", "department",
    "departmental", "team", "members", "member", "charge-sheeted",
    "sub-inspector", "head-constable", "assistant-sub-inspector",
    "deputy-superintendent", "inspector-general", "deputy-inspector",
    "additional-superintendent", "senior-superintendent",
    "assistant-commissioner", "deputy-commissioner",
    "sho", "asi", "psi", "dsp", "ssp", "dig", "dgp", "acp", "dcp",
    "ips", "ipsofficer", "station", "house", "circle", "division",
    "range", "zone", "central", "city", "rural", "urban", "traffic",
    "crime", "branch", "cell", "headquarters", "lines", "chowk",
    "thana", "outpost", "east", "west", "north", "south",
    "reserve", "reserves", "battalion", "battalions", "regiment",
    "corps", "force", "forces", "commando", "commandos", "armed",
    "military", "paramilitary", "rifles", "frontier", "border",
    "security", "home", "special", "protection", "intelligence",
    "vigilance", "investigation", "investigating", "detective",
    "railway", "indian",
}
CONNECTORS = {"of", "and", "or", "the", "a", "an", "at", "in", "on",
              "for", "s/o", "d/o", "w/o", "c/o", "@", "&", "-", "/"}
# Honorifics that may accompany the single content word of a run
# ("Md. Jahid", "Mr. M. R.").
HONORIFICS = {"md", "mr", "mrs", "ms", "dr", "er", "sri", "shri", "smt",
              "kum", "km", "mohd"}
# Very common surnames / name-parts: never emitted as bare singles
# (they would corrupt other same-surnamed persons in the record), and
# runs made only of them are dropped. Full names containing them are
# still matched as full variants.
COMMON_SURNAMES = {
    "singh", "kumar", "sharma", "verma", "yadav", "gupta", "jain",
    "kaur", "prasad", "sahu", "sinha", "jha", "thakur", "mahto",
    "mahato", "murmu", "soren", "tudu", "marandi", "oraon", "behera",
    "sahoo", "mohanty", "naik", "nayak", "rath", "swain", "patra",
    "jena", "rout", "barik", "parida", "pradhan", "mohapatra",
    "patel", "shah", "desai", "joshi", "dave", "bhatt", "pandya",
    "mehta", "agarwal", "agrawal", "goel", "goyal", "mittal",
    "bansal", "garg", "reddy", "naidu", "chowdary", "nair", "menon",
    "pillai", "iyer", "iyengar", "gowda", "shetty", "hegde",
    "kulkarni", "deshmukh", "patil", "pawar", "shinde", "jadhav",
    "more", "sawant", "raja", "rani", "devi", "chavan", "ahmad",
    "ahmed", "choudhary", "chowdhury", "mukherjee", "banerjee",
    "chatterjee", "mishra", "tiwari", "pandey", "dubey", "shukla",
    "tripathi", "pathak", "meena", "dutt", "dutta", "datta", "bose",
    "ghosh", "khan", "pal", "sen", "das", "dey", "lal", "ram", "rai",
    "rao", "roy", "jha",
}


def _word_rx(w):
    core = w.strip().rstrip(".")
    if not core or core in ("@", "&"):
        return None
    return re.escape(core) + r"\.?"


PLACEHOLDER_NAME_RX = re.compile(
    r"unnamed|unidentified|not named|unknown|not stated|not legible|illegible",
    re.IGNORECASE)


def _content_words(words):
    """Words carrying identifying content: len>=3, alphabetic, neither a
    generic role word, an honorific, nor a bare initial."""
    out = []
    for w in words:
        core = w.strip().strip("().,")
        if (len(core) >= 3 and re.search(r"[A-Za-z]", core)
                and core.lower() not in GENERIC_NAME_WORDS
                and core.rstrip(".").lower() not in HONORIFICS
                and not re.match(r"^[A-Za-z]\.?$", core)):
            out.append(core)
    return out


def _run_kept(run):
    """A word-run is identifying iff it holds >=2 content words, or one
    content word plus bare initials / honorifics only ('K. N. Mohan',
    'Md. Jahid'); every word must be capitalized, an initial, or a
    connector; and the run must not be only common surnames ('Kumar
    Singh'). Runs like 'K. N.', 'Son of' or 'Singh and' are dropped."""
    for w in run:
        core = w.strip().strip("().,;:'\"-")
        if not core:
            return False
        if core.lower() in CONNECTORS or core.lower() in GENERIC_NAME_WORDS:
            continue
        if re.match(r"^[A-Za-z]\.?$", core):
            continue
        if not re.match(r"^[A-Z0-9]", core):
            return False
    cw = _content_words(run)
    if cw and all(w.lower() in COMMON_SURNAMES for w in cw):
        return False
    if len(cw) >= 2:
        return True
    if len(cw) == 1:
        rest = [w.strip().strip("().,") for w in run]
        rest = [w for w in rest if w not in cw]
        return all(re.match(r"^[A-Za-z]\.?$", w)
                   or w.rstrip(".").lower() in HONORIFICS for w in rest)
    return False


def _variant_shaped(words):
    """A name variant is name-shaped iff every word is capitalized, an
    initial, a connector, or a generic role word. Descriptive sentences
    ('Police Constables, served under the Sub-Inspector') fail."""
    for w in words:
        core = w.strip().strip("().,;:'\"-")
        if not core:
            continue
        if core.lower() in CONNECTORS or core.lower() in GENERIC_NAME_WORDS:
            continue
        if re.match(r"^[A-Za-z]\.?$", core):
            continue
        if not re.match(r"^[A-Z0-9]", core):
            return False
    return True


def _is_descriptive_officer_name(o):
    """Officer entries whose 'name' restates rank/unit ('Sub-Inspector,
    Mangaldoi PS, Darrang') or is a placeholder carry no name to gate:
    no scrub patterns and no assertion literals come from them."""
    nm = (o.get("name") or "").strip()
    if not nm or PLACEHOLDER_NAME_RX.search(nm):
        return True
    low = nm.lower()
    # Personnel-group entries ("43 Uttar Pradesh Police personnel
    # (appellants; ...)", "Police personnel, ...") name no individual:
    # place/unit runs inside them are not personal names to gate.
    if re.search(r"\bpersonnel\b", low):
        return True
    rank = (o.get("rank") or "").strip().lower()
    unit = (o.get("unit") or "").strip().lower()
    if rank and len(rank) >= 4 and rank in low:
        return True
    if unit and len(unit) >= 4 and unit in low:
        return True
    return False


def _name_variants(name):
    """Deterministic spelling variants for one raw name string."""
    n = re.sub(r"\s+", " ", (name or "").strip())
    if not n:
        return []
    if PLACEHOLDER_NAME_RX.search(n):
        return []
    out = [n]
    m = re.search(r"\(([^()]*)\)", n)
    if m:
        inner = m.group(1).strip()
        outer = re.sub(r"\s*\([^()]*\)", "", n).strip()
        if outer:
            out.append(outer)
        if inner:
            out.append(inner)
            pre = outer.split()
            if pre and len(pre[0].rstrip(".")) <= 3:
                out.append((pre[0] + " " + inner).strip())
    if "@" in n:
        for part in n.split("@"):
            part = part.strip()
            if part:
                out.append(part)
    seen, uniq = set(), []
    for v in out:
        if v not in seen:
            seen.add(v)
            uniq.append(v)
    return uniq


def _name_patterns(name):
    """Regex alternatives for a name, longest-first: full string, every
    contiguous word-run of length >= 2, then distinctive single tokens
    (len >= 5, non-generic, non-surname). Shared by the scrubber and the build-time
    leak assertion so both recognise exactly the same strings."""
    pats = []
    for var in _name_variants(name):
        words = [w for w in var.split(" ") if w.strip()]
        if not _content_words(words) or not _variant_shaped(words):
            continue
        pieces = [_word_rx(w) for w in words]
        if all(p is not None for p in pieces):
            pats.append(r"\s*".join(pieces))
        runs = []
        for i in range(len(words)):
            for j in range(i + 2, len(words) + 1):
                run = words[i:j]
                if _run_kept(run):
                    runs.append(run)
        for run in sorted(runs, key=len, reverse=True):
            pieces = [_word_rx(w) for w in run]
            if any(p is None for p in pieces):
                continue
            pats.append(r"\s*".join(pieces))
        for w in words:
            core = w.strip().strip("().,;:'\"-")
            if (len(core) >= 5 and re.search(r"[A-Za-z]", core)
                    and core.lower() not in GENERIC_NAME_WORDS
                    and core.lower() not in COMMON_SURNAMES
                    and re.match(r"^[A-Z0-9]", core)):
                pats.append(_word_rx(w))
    pats = sorted(set(pats), key=len, reverse=True)
    return pats


def compile_name_alternates(names):
    pats = []
    for nm in names:
        pats.extend(_name_patterns(nm))
    return sorted(set(pats), key=len, reverse=True)


def _protected_spans(text, literals):
    spans = []
    low = text.lower()
    for lit in literals:
        l = (lit or "").strip().lower()
        if len(l) < 3:
            continue
        start = 0
        while True:
            i = low.find(l, start)
            if i < 0:
                break
            spans.append((i, i + len(l)))
            start = i + 1
    return spans


def _in_spans(pos, end, spans):
    return any(s < end and pos < e for s, e in spans)


from functools import lru_cache as _lru_cache


@_lru_cache(maxsize=8192)
def _scrub_rx_cached(alt_key, rank_prefix):
    alt = "(?:%s)" % alt_key
    if rank_prefix:
        return re.compile(
            r"(?<!\w)(?:(%s)\s+)?((?:[A-Z]\.\s*)?%s)(?!\w)"
            % (RANK_WORDS, alt), re.IGNORECASE)
    return re.compile(r"(?<!\w)((?:[A-Z]\.\s*)?%s)(?!\w)" % alt,
                      re.IGNORECASE)


# Single-token guard (round 6c precision): a bare single-token
# literal redacts only standing alone as a person reference, never
# inside a longer proper noun ("Gomti Nagar" stays intact while bare
# "Ravindra" still redacts). A neighbouring Titlecase word proves a
# longer proper noun — unless it is a rank/honorific/police term
# ("Constable Nagar", "Mr Nagar" still redact). "Shri"/"Sri" are
# deliberately NOT exceptions: "Shri Nagar" is the city.
_GUARD_OK = (GENERIC_NAME_WORDS | HONORIFICS | {"ex"}) - {"shri", "sri"}
_TITLECASE_WORD = re.compile(r"[A-Z][a-z]+")


def _single_guarded(text_orig, s, e):
    """True when a single-token match at (s,e) sits inside a longer
    proper noun (adjacent Titlecase non-rank word) and must be kept.
    Multi-word matches never consult this (their full phrase matched).
    Shared by the exact matcher, scrub_names and the gate flex pass
    (courts/scrub.py imports it)."""
    m = re.search(r"([A-Za-z]+)\s+$", text_orig[:s])
    if m and _TITLECASE_WORD.fullmatch(m.group(1)) \
            and m.group(1).lower() not in _GUARD_OK:
        return True
    m = re.match(r"\s+([A-Za-z]+)", text_orig[e:])
    if m and _TITLECASE_WORD.fullmatch(m.group(1)) \
            and m.group(1).lower() not in _GUARD_OK:
        return True
    return False


def scrub_names(text, patterns, replacement, literals=(),
                rank_prefix=False):
    """Replace every pattern match outside protected spans. `replacement`
    is a string or a callable(match_start_ok: bool) -> string."""
    if not text or not patterns:
        return text
    spans = _protected_spans(text, literals)
    rx = _scrub_rx_cached("|".join(patterns), rank_prefix)

    def _rep(m):
        s = m.start()
        if _in_spans(s, m.end(), spans):
            return m.group(0)
        gi = 2 if rank_prefix else 1
        g = m.group(gi)
        if g is not None and not re.search(r"\s", g):
            gs, ge = m.span(gi)
            while ge > gs and text[ge - 1] == ".":
                ge -= 1  # trailing "\.?" must not eat a sentence stop
            if _single_guarded(text, gs, ge):
                return m.group(0)
        rep = (replacement(bool(m.group(1)) if rank_prefix else False)
               if callable(replacement) else replacement)
        prev = text[:s]
        if not prev or re.search(r"(^|[.?!]\s+)$", prev):
            rep = rep[:1].upper() + rep[1:]
        return rep

    return rx.sub(_rep, text)


def initials_of(name):
    bits = []
    for w in re.split(r"[\s@]+", name or ""):
        core = w.strip().strip("().,")
        if not core or core.lower() in GENERIC_NAME_WORDS:
            continue
        if re.match(r"^[A-Za-z]$", core.rstrip(".")):
            bits.append(core.rstrip(".").upper() + ".")
        elif re.search(r"[A-Za-z]", core):
            bits.append(core[0].upper() + ".")
    return " ".join(bits) or "N."


def officer_role_noun(o):
    rank = (o.get("rank") or "").strip()
    if rank and len(rank) < 40:
        return "the " + rank.lower()
    return "the officer"


def record_protected_literals(c):
    lits = []
    for o in (c.get("officers") or []):
        if isinstance(o, dict) and o.get("publish_grade") == "named_safe":
            for v in _name_variants(o.get("name") or ""):
                lits.append(v)
    judges = c.get("judges") or []
    if isinstance(judges, str):
        judges = [judges]
    for j in judges:
        if j:
            lits.append(str(j))
    if not is_anonymised(c):
        for v in (c.get("victims") or []):
            if isinstance(v, dict) and v.get("name"):
                lits.append(v["name"])
    for k in ("court", "state", "district", "district_at_time",
              "city_town", "police_station_or_unit", "force",
              "case_number"):
        if c.get(k):
            lits.append(str(c[k]))
    return lits


def is_anonymised(c):
    return bool(c.get("anonymised") or c.get("merged_id") in ANONYMISE
                or c.get("victims_legal_names_nonpublic"))


def oracle_officer_names(c, oracle):
    """Real-name oracle for gated officers: the gate may replace unnamed
    officers' names with rank+unit descriptions (and strip victim legal
    stores) while narratives keep stale mentions. The ungated compile
    output carries the same officers in the same order (verified: rank
    + unit match on all records), so index-aligned plain names supply
    scrub patterns for descriptive gated entries."""
    if oracle is None:
        return {}
    po = oracle.get("officers") or []
    out = {}
    for i, o in enumerate(c.get("officers") or []):
        if not isinstance(o, dict):
            continue
        if o.get("publish_grade") == "named_safe":
            continue
        if not _is_descriptive_officer_name(o):
            continue
        if i < len(po) and isinstance(po[i], dict):
            nm = (po[i].get("name") or "").strip()
            if nm and not _is_descriptive_officer_name(po[i]):
                out[i] = nm
    return out


def oracle_victim_legals(c, oracle):
    legals = list(c.get("victims_legal_names_nonpublic") or [])
    if oracle is not None:
        for nm in (oracle.get("victims_legal_names_nonpublic") or []):
            if nm not in legals:
                legals.append(nm)
    return legals


def _nosp(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def gated_effective_names(c, oracle):
    """(name, kind) pairs needing patterns for one record: effective
    unnamed-officer names (gated real or oracle-aligned) + victim
    legals (gated + oracle)."""
    out = []
    oracle_names = oracle_officer_names(c, oracle)
    for i, o in enumerate(c.get("officers") or []):
        if not isinstance(o, dict):
            continue
        if o.get("publish_grade") == "named_safe":
            continue
        if i in oracle_names:
            out.append((oracle_names[i], "officer"))
        elif not _is_descriptive_officer_name(o):
            if (o.get("name") or "").strip():
                out.append((o["name"], "officer"))
    for nm in oracle_victim_legals(c, oracle):
        if (nm or "").strip():
            out.append((nm, "victim"))
    return out


def build_nosp_extras(raw_cases, oracle_by_id):
    """rid -> [(name, kind)] shared from other records with the same
    space/punctuation-stripped name ('Harinderpal Singh' <->
    'Harinder Pal Singh'): the same normalized identity gets the same
    gate treatment across records, so spelling variants cannot leak
    through a sibling record's narrative."""
    oracle_by_id = oracle_by_id or {}
    index = {}
    for c in raw_cases:
        rid = c.get("record_id") or c.get("merged_id")
        oracle = oracle_by_id.get(c.get("merged_id"))
        for nm, kind in gated_effective_names(c, oracle):
            key = _nosp(nm)
            if key:
                index.setdefault(key, []).append((rid, nm, kind))
    extras = {}
    for c in raw_cases:
        rid = c.get("record_id") or c.get("merged_id")
        oracle = oracle_by_id.get(c.get("merged_id"))
        own = gated_effective_names(c, oracle)
        own_keys = {_nosp(nm) for nm, _k in own} - {""}
        own_strs = {nm for nm, _k in own}
        ex = []
        for key in own_keys:
            for orid, onm, okind in index.get(key, []):
                if orid != rid and onm not in own_strs \
                        and onm not in [e[0] for e in ex]:
                    ex.append((onm, okind))
        if ex:
            extras[rid] = ex
    return extras


def _pattern_bundle(c, oracle=None, nosp_extras=None):
    """(officer_patterns, officer_repl, victim_patterns, victim_repl,
    protected_literals) for one raw record: gated + oracle + shared
    spelling-variant names. Used by redact_record and by the CSV
    internal-notes scrub so both see identical patterns."""
    lits = record_protected_literals(c)
    oracle_names = oracle_officer_names(c, oracle)
    unnamed_pats = []
    for i, o in enumerate(c.get("officers") or []):
        if not isinstance(o, dict):
            continue
        if o.get("publish_grade") != "named_safe":
            if i in oracle_names:
                unnamed_pats.extend(_name_patterns(oracle_names[i]))
            elif not _is_descriptive_officer_name(o):
                unnamed_pats.extend(_name_patterns(o.get("name") or ""))
    # Use "the officer" when a rank word precedes the match, else a
    # rank-aware default noun from the first unnamed officer.
    first_rank = ""
    for o in (c.get("officers") or []):
        if isinstance(o, dict) and o.get("publish_grade") != "named_safe":
            first_rank = (o.get("rank") or "").strip()
            break
    default_noun = ("the " + first_rank.lower()
                    if first_rank and len(first_rank) < 40
                    else "the officer")

    def _orep(has_rank):
        return "the officer" if has_rank else default_noun

    legal = oracle_victim_legals(c, oracle)
    victim_pats = []
    victim_repl = "N."
    if is_anonymised(c) and legal:
        victim_pats = compile_name_alternates(legal)
        victim_repl = initials_of(" ".join(legal[:1]))
    for nm, kind in (nosp_extras or {}).get(
            c.get("record_id") or c.get("merged_id"), []):
        if kind == "officer":
            unnamed_pats.extend(_name_patterns(nm))
        elif is_anonymised(c):
            victim_pats.extend(_name_patterns(nm))
    for nm, kind in SCRUB_EXTRA.get(c.get("merged_id"), []):
        if kind == "officer":
            unnamed_pats.extend(_name_patterns(nm))
        elif is_anonymised(c):
            victim_pats.extend(_name_patterns(nm))
    return (sorted(set(unnamed_pats), key=len, reverse=True), _orep,
            sorted(set(victim_pats), key=len, reverse=True), victim_repl,
            lits)


def scrub_text_with_record(text, c, oracle=None, nosp_extras=None):
    """Scrub one free-text cell with a record's full pattern set."""
    if not isinstance(text, str) or not text:
        return text
    opats, orep, vpats, vrepl, lits = _pattern_bundle(
        c, oracle, nosp_extras)
    if opats:
        text = scrub_names(text, opats, orep, literals=lits,
                           rank_prefix=True)
    if vpats:
        text = scrub_names(text, vpats, vrepl, literals=lits)
    return text


# ---- Withheld names read as force + rank ("Delhi Police Inspector") ----
# Runs last on every public copy (tier 1 and tier 2). In a case title the
# officer's party becomes "<force> <rank>"; in prose "[name withheld]"
# after a rank is dropped (the rank already says who), and name fragments
# stranded beside a marker by partial upstream redaction are removed.
# It only ever deletes or replaces name text, never adds a name.
_WH = "[name withheld]"
_WH_RANKS = {
    "constable", "constables", "head", "sub-inspector", "sub-inspectors",
    "inspector", "inspectors", "asi", "si", "psi", "ssi", "sho", "hc", "pc",
    "dsp", "sp", "ssp", "dig", "ig", "dgp", "acp", "dcp", "ci", "sdpo",
    "superintendent", "commissioner", "officer", "officers", "policeman",
    "policemen", "jawan", "jawans", "havildar", "naik", "sepoy", "rifleman",
    "sergeant", "subedar", "home-guard", "guard", "warden", "jailor",
    "jailer", "patwari", "clerk", "engineer", "tehsildar",
    "officer-in-charge", "in-charge", "oc", "io"}
_WH_SAFE = _WH_RANKS | {
    "vs", "v", "versus", "and", "another", "others", "ors", "anr", "the",
    "state", "of", "union", "india", "police", "court", "high", "district",
    "sessions", "special", "judge", "corpus", "petitioner", "petitioners",
    "appellant", "appellants", "respondent", "respondents", "complainant",
    "deceased", "accused", "victim", "minor", "wife", "husband", "father",
    "mother", "son", "daughter", "late", "mr", "mrs", "ms", "smt", "shri",
    "sri", "kumari", "km", "dr", "custodial", "death", "case", "murder",
    "torture", "rape", "bribery", "corruption", "encounter", "killing",
    "assault", "detention", "illegal", "compensation", "petition", "appeal",
    "writ", "habeas", "criminal", "civil", "misc", "application", "order",
    "judgment", "in", "re", "through", "thr", "govt", "government",
    "senior", "deputy", "assistant", "additional", "chief", "station",
    "lines", "thana", "crime", "branch", "cell", "unit", "bench", "division",
    "on", "at", "by", "for", "with", "from", "to", "a", "an", "his", "her",
    "their", "an", "it", "he", "she", "they", "who", "was", "were", "is"}
_WH_TOK = r"(?:[A-Z][a-z]+(?:-[A-Z][a-z]+)?|[A-Z]\.)"
_WH_SPAN = re.compile(r"(?P<pre>(?:%s\s+){0,2})\[name withheld\](?P<post>(?:\s+%s){0,2})"
                      % (_WH_TOK, _WH_TOK))
_WH_VS = re.compile(r"\s+(?:vs\.?|v\.|v/s|versus)\s+", re.I)
_WH_STATE = re.compile(
    r"(?i)^(?:the\s+)?(?:state|union of india|u\.?\s?o\.?\s?i|govt|government|"
    r"commissioner|director|superintendent|inspector general|"
    r"director general|c\.?b\.?i|central bureau|delhi administration|"
    r"public prosecutor|department|chief secretary|secretary|district "
    r"magistrate|collector|nct|s\.?h\.?o\b|station house officer|"
    r"police|senior superintendent|dgp|director general)")
_WH_FORCE_ACR = re.compile(r"\b(CRPF|BSF|CISF|ITBP|SSB|RPF|NSG|Assam Rifles|"
                           r"Railway Protection Force|Indian Army|Army)\b")
_WH_FORCE = re.compile(r"((?:[A-Z][\w.&\-]*\s+){0,3}?[A-Z][\w.&\-]*\s+Police)"
                       r"(?!\s+(?:Station|Post|Chowki|Outpost|Lines|Thana))\b")
_WH_OFFICER_PARTY = {"conviction_upheld", "conviction_by_hc",
                     "conviction_by_sc", "disciplinary_upheld",
                     "trial_court_conviction"}


def officer_descriptor(p, with_rank=True):
    """'Delhi Police Inspector': the officer's force (from the unit, else
    the city/district/state) and rank ('personnel' when the rank is unknown
    or with_rank is False). Police records only."""
    offs = [o for o in (p.get("officers") or []) if isinstance(o, dict)]
    force = ""
    for o in offs:
        u = o.get("unit") or o.get("display") or ""
        m = _WH_FORCE_ACR.search(u) or _WH_FORCE.search(u)
        if m:
            force = m.group(1).strip()
            break
    if not force:
        place = (p.get("city_town") or p.get("district") or p.get("state")
                 or "").strip()
        force = (place + " Police") if place else "Police"
    rank = next(((o.get("rank") or "").strip() for o in offs
                 if (o.get("rank") or "").strip()), "") if with_rank else ""
    if rank.islower():
        rank = rank.title()
    return "%s %s" % (force, rank or "personnel")


def _clean_withheld(text, drop_after_rank=True, extra_ranks=frozenset()):
    if not isinstance(text, str) or _WH not in text:
        return text
    ranks, safe = _WH_RANKS | set(extra_ranks), _WH_SAFE | set(extra_ranks)

    def rep(m):
        pre, post = m.group("pre").split(), m.group("post").split()
        while pre and pre[-1].rstrip(".").lower() not in safe:
            pre.pop()
        while post and post[0].rstrip(".").lower() not in safe:
            post.pop(0)
        prev = pre[-1] if pre else (re.findall(r"(\S+)\s*$",
                                               m.string[:m.start()]) or [""])[0]
        keep = not (drop_after_rank and
                    prev.strip("\"'(,").lower() in ranks)
        lead = " " if m.group("pre") and not pre and not keep else ""
        return lead + " ".join(pre + ([_WH] if keep else []) + post) + (
            " " if m.group("post") and not post and not keep else "")

    text = _WH_SPAN.sub(rep, text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    return re.sub(r" +([,.;:)])", r"\1", text).strip()


def _officer_title(title, p, desc):
    if not isinstance(title, str) or _WH not in title:
        return title
    m = _WH_VS.search(title)
    if not m:
        return title
    a, b = title[:m.start()], title[m.end():]

    def party(side):
        many = side.count(_WH) > 1 or re.search(
            r"(?i)(?:,|&|\band\b)\s*(?:ors?|others?|anr|another)\.?\s*$", side)
        return desc + (" and others" if many else "")
    if _WH in a and _WH_STATE.match(b.strip()) and not _WH_STATE.match(a.strip()):
        a = party(a)
    elif _WH in b and _WH_STATE.match(a.strip()):
        b = party(b)
    # "(X vs State)" connected appeals: X is a co-accused appellant. When no
    # officer of the record may be named, X is withheld the same way.
    if not any(isinstance(o, dict) and o.get("publish_grade") == "named_safe"
               for o in (p.get("officers") or [])):
        def conn(mm):
            inner = mm.group(1)
            v = _WH_VS.search(inner)
            if v and _WH_STATE.match(inner[v.end():].strip()) \
                    and not _WH_STATE.match(inner[:v.start()].strip()):
                who = (officer_descriptor(p, with_rank=False)
                       if (p.get("service") or "police") == "police"
                       else ("%s public servant" % record_place(p)).strip())
                return "(%s%s%s)" % (who, v.group(0), inner[v.end():])
            return mm.group(0)
        b = re.sub(r"\(([^()]*)\)", conn, b)
    return a + m.group(0) + b


_RANK_NAME = re.compile(
    r"\b(?P<rank>(?i:head\s+constables?|constables?|sub-inspectors?|"
    r"inspectors?|asi|si|psi|ssi|sho|dsp|acp|dcp|havildar|naik|sepoy|"
    r"daroga|officer-in-charge|policem[ae]n|jawans?))\s+"
    r"(?P<name>[A-Z][a-z]+\.?(?:\s+[A-Z][a-z]+\.?){0,2})\b")


def _strip_rank_names(text, keep_words, place_words):
    """Drop a personal name written straight after a police rank unless the
    naming gate cleared it (keep_words) or it is a place of the record."""
    if not isinstance(text, str):
        return text

    def rep(m):
        toks = m.group("name").split()
        for i, w in enumerate(toks):
            lw = w.rstrip(".").lower()
            if lw in _WH_SAFE or lw in keep_words or lw in place_words or \
                    lw in ("general", "director", "act", "court", "section"):
                return m.group(0) if i == 0 else m.group("rank") + " " + \
                    " ".join(toks[i:])
        return m.group("rank")
    return _RANK_NAME.sub(rep, text)


def humanise_withheld(p, title_keys, prose_keys):
    police = (p.get("service") or "police") == "police"
    officer_party = (p.get("outcome_type") or "trial_court_conviction") \
        in _WH_OFFICER_PARTY
    desc = officer_descriptor(p) if police else civil_descriptor(p)
    # a civil servant's own post words also stand in for the name
    post_words = set() if police else {
        w.lower() for w in re.findall(r"[A-Za-z][A-Za-z-]+",
                                      desc)[-1:]}
    for k in title_keys:
        if isinstance(p.get(k), str):
            if officer_party:
                p[k] = _officer_title(p[k], p, desc)
            p[k] = _clean_withheld(p[k], extra_ranks=post_words)
    keep = {w.lower() for o in (p.get("officers") or []) if isinstance(o, dict)
            and o.get("publish_grade") == "named_safe"
            for n in (o.get("name"), o.get("name_public")) if n
            for w in re.findall(r"[A-Za-z]+", n)}
    places = {w.lower() for k in ("district", "city_town", "state",
                                  "police_station_or_unit", "trial_court_name")
              for w in re.findall(r"[A-Za-z]+", str(p.get(k) or ""))}
    places |= {w.lower() for o in (p.get("officers") or []) if isinstance(o, dict)
               for w in re.findall(r"[A-Za-z]+", str(o.get("unit") or ""))}
    for k in prose_keys:
        if isinstance(p.get(k), str):
            p[k] = _clean_withheld(p[k], drop_after_rank=(k != "court_quote"),
                                   extra_ranks=post_words)
            if police:
                p[k] = _strip_rank_names(p[k], keep, places)
    for a in (p.get("institutional_response") or []):
        if isinstance(a, dict) and isinstance(a.get("description"), str):
            a["description"] = _clean_withheld(a["description"],
                                               extra_ranks=post_words)
    return p


# ---- Victims read as place + person ("a Delhi man"); never by name ----
# Complainants, victims, witnesses and minors are never named (site
# promise; a wrong name is a liability). Every public record: victim names
# in any text become "a <place> <man|woman|boy|girl|youngster|newborn|
# resident>", the victim rows carry that descriptor (+ age), and a
# withheld victim party in a title reads the same way.
_VIC_ROLE = re.compile(
    r"\b(?P<the>[Tt]he\s+)?(?P<role>complainant|victim|deceased|petitioner|"
    r"informant|witness|detenu|corpus|prosecutrix|survivor|son|daughter|wife|"
    r"husband|brother|sister|father|mother)\s+(?P<desc>an?\s[^,.;:()]{1,40}?\s"
    r"(?:man|woman|boy|girl|youngster|newborn|resident))\b")
_VIC_HONORIFIC = re.compile(
    r"\b(?:Mr|Mrs|Ms|Smt|Shri|Sri|Kumari|Km|Dr)\.?\s+(?=an?\s[^,.;:()]{1,40}?\s"
    r"(?:man|woman|boy|girl|youngster|newborn|resident)\b)")


_VIC_TEXT_KEYS = (  # narrative fields only: places, courts, ids, urls untouched
    "summary", "summary_verified", "summary_redacted", "verification_note",
    "court_quote", "display_title", "display_title_redacted", "case_title",
    "case_title_or_number", "case_number", "citation", "verdict_note",
    "editor_notes",
    "fidelity_changes", "allegations", "institutional_response",
    "followup_history", "corrections", "sentence", "victims_redacted")


def record_place(p):
    return re.sub(r"\s*\([^()]*\)", "", (p.get("city_town") or p.get("district")
                                          or p.get("state") or "")).strip()


def victim_person(v, p):
    """('Delhi man', age or None) for one victim entry of record p."""
    txt = v if isinstance(v, str) else " ".join(
        str(v.get(k) or "") for k in ("name", "description", "role"))
    g = "" if isinstance(v, str) else str(v.get("gender") or "").lower()
    if not g:
        if re.search(r"\b(woman|women|girl|female|wife|daughter|mother|sister|"
                     r"widow|prosecutrix)\b", txt, re.I):
            g = "female"
        elif re.search(r"\b(man|men|boy|male|husband|son|father|brother)\b",
                       txt, re.I):
            g = "male"
    try:
        age = int(v.get("age")) if isinstance(v, dict) and \
            v.get("age") not in (None, "") else None
    except (TypeError, ValueError):
        age = None
    if age == 0:
        noun = "newborn"
    elif age is not None and age < 18:
        noun = "girl" if g.startswith("f") else "boy" if g.startswith("m") \
            else "youngster"
    else:
        noun = "woman" if g.startswith("f") else "man" if g.startswith("m") \
            else "resident"
    return ("%s %s" % (record_place(p), noun)).strip(), age


def _victim_name(v):
    n = v.get("name") if isinstance(v, dict) else v if isinstance(v, str) else None
    if not isinstance(n, str):
        return None
    n = re.sub(r"\s*\([^()]*\)", "", n).strip()
    return n if re.search(r"[A-Z][a-z]", n) else None


def victim_names_of(r, oracle=None):
    names = [n for n in (_victim_name(v) for v in (r.get("victims") or []))
             if n]
    names += [n for n in oracle_victim_legals(r, oracle) if n]
    return names


_ROLE_NAME = re.compile(
    r"\b(?P<role>(?i:complainants?|victims?|deceased|informants?|witness(?:es)?|"
    r"detenus?|peddlers?|traders?|shopkeepers?|drivers?|farmers?|labourers?|"
    r"students?|prosecutrix|survivors?|petitioners?|friends?|villagers?|"
    r"nephews?|nieces?|cousins?|neighbou?rs?|relatives?|co-delinquents?|"
    r"co-accused|youths?|resident|tribal|juveniles?|minors?|"
    r"sons?|daughters?|wife|husband|brother|sister|father|mother|uncle|aunt))\s+"
    r"(?P<name>(?:[A-Z][a-z]+\.?|[A-Z]\.)(?:\s+(?:[A-Z][a-z]+\.?|[A-Z]\.)){0,3})\b")


def _strip_role_names(text, keep_words=frozenset()):
    """"threatened drug peddler Harpal Singh" -> "threatened drug peddler":
    a private person named straight after a role word, listed as a victim
    or not, loses the name and keeps the role."""
    if not isinstance(text, str):
        return text

    def rep(m):
        first = m.group("name").split()[0].rstrip(".").lower()
        if first in _WH_SAFE or first in keep_words or first in (
                "general", "court", "act", "section", "state", "union"):
            return m.group(0)
        return m.group("role")
    return _ROLE_NAME.sub(rep, text)


def _grammar_after_victims(text):
    text = _VIC_HONORIFIC.sub("", text)
    text = _VIC_ROLE.sub(lambda m: "%s%s, %s," % (m.group("the") or "",
                                                 m.group("role"),
                                                 m.group("desc")), text)
    return re.sub(r",\s*([,.;:)])", r"\1", text)


def anonymise_victims(p, raw, title_keys, oracle=None):
    """In place on a public copy `p` built from raw record `raw`."""
    vics = p.get("victims") or []
    if isinstance(vics, str):
        vics = [vics]
    persons = [victim_person(v, p) for v in vics if v]
    first = persons[0][0] if persons else ""
    vnames = [n.lower() for n in victim_names_of(raw, oracle)]
    # the gate protects names a record publishes; victims no longer are
    lits = [l for l in record_protected_literals(raw)
            if not any(v in l.lower() or l.lower() in v for v in vnames)]
    groups = []   # (patterns, person) per named victim
    for v in vics:
        n = _victim_name(v)
        if n:
            pats = compile_name_alternates([n])
            if pats:
                groups.append((pats, victim_person(v, p)[0]))
    legal = oracle_victim_legals(raw, oracle)
    if legal and first:
        groups.append((compile_name_alternates(legal), first))

    def scrub(s, title=False):
        if not isinstance(s, str) or not s:
            return s
        for pats, person in groups:
            rep = person.title() if title else (
                "an " if person[:1].lower() in "aeio" else "a ") + person
            s = scrub_names(s, pats, rep, literals=lits)
        return s if title else _grammar_after_victims(_strip_role_names(s))

    def walk(o, key=""):
        if isinstance(o, str):
            if re.search(r"(url|_id|ids?$|source)", key):
                return o
            return scrub(o, title=key in title_keys)
        if isinstance(o, list):
            return [walk(x, key) for x in o]
        if isinstance(o, dict):
            return {k: (walk(x, k) if k not in ("victims", "officers") else x)
                    for k, x in o.items()}
        return o

    for k in _VIC_TEXT_KEYS:
        if k in p:
            p[k] = walk(p[k], k)
    # Victim rows: descriptor (+ role, age) instead of any name.
    out = []
    for v in vics:
        if not v:
            continue
        person, age = victim_person(v, p)
        role = v.get("role") if isinstance(v, dict) else None
        d = person[0].upper() + person[1:] + (
            " (%s)" % role if isinstance(role, str) and role.strip() and
            not re.search(r"[A-Z][a-z]+\s+[A-Z][a-z]+", role) else "") + (
            ", age %d" % age if age else "")
        if isinstance(v, dict):
            v = dict(v, name=None, descriptor=d)
            v.pop("description", None)
            out.append(v)
        else:
            out.append(d)
    if vics:
        p["victims"] = out
    # A named non-government party in a title (petitioner, appellant) reads as
    # the officer descriptor when the officer is the party, else as the
    # victim descriptor, unless the naming gate cleared that name.
    cleared = [n.lower() for o in (raw.get("officers") or []) if isinstance(o, dict)
               and o.get("publish_grade") == "named_safe"
               for n in (o.get("name"), o.get("name_public")) if n]
    officer_party = (p.get("outcome_type") or "trial_court_conviction") \
        in _WH_OFFICER_PARTY
    police = (p.get("service") or "police") == "police"
    who_off = officer_descriptor(p) if police else civil_descriptor(p)
    who_vic = (first or "%s resident" % record_place(p)).strip()
    for k in title_keys:
        tt = p.get(k)
        if not isinstance(tt, str) or _WH in tt:
            continue
        m = _WH_VS.search(tt)
        if not m:
            continue
        a, b = tt[:m.start()], tt[m.end():]
        if any(cn in tt.lower() for cn in cleared):
            continue

        def describe(side, who):
            tail = re.search(r"(?i)(\s*(?:,|&|\band\b)\s*(?:ors?|others?|anr|"
                             r"another)\.?.*)$", side)
            return who[:1].upper() + who[1:] + (tail.group(1) if tail else "")
        woman = re.match(r"(?i)\s*(?:smt|mrs|ms|kumari|km|sushri)\b\.?", a)
        if not _WH_STATE.match(a.strip()) and _WH_STATE.match(b.strip()) and \
                re.search(r"[A-Z][a-z]+", a):
            # a woman party (often an officer's widow) is never the officer
            a = describe(a, ("%s Woman" % record_place(p)).strip() if woman
                         else who_off if officer_party else who_vic.title())
        elif _WH_STATE.match(a.strip()) and not _WH_STATE.match(b.strip()) and \
                officer_party and re.search(r"[A-Z][a-z]+", b):
            b = describe(b, who_off)
        p[k] = a + m.group(0) + b
    # A withheld victim party in a title reads as the victim descriptor.
    if first:
        for k in title_keys:
            t = p.get(k)
            if not isinstance(t, str) or _WH not in t:
                continue
            m = _WH_VS.search(t)
            if m:
                a, b = t[:m.start()], t[m.end():]
                if _WH in a and not _WH_STATE.match(a.strip()):
                    a = a.replace(_WH, first.title(), 1)
                p[k] = a + m.group(0) + b
    return p


def civil_descriptor(p):
    """'Visakhapatnam Enforcement Officer': place + post of a civil servant."""
    offs = [o for o in (p.get("officers") or []) if isinstance(o, dict)]
    post = (p.get("post") or next((o.get("rank") for o in offs
                                   if o.get("rank")), "") or "").strip()
    post = re.sub(r"\s*\([^()]*\)", "", post)
    return ("%s %s" % (record_place(p), post or "public servant")).strip()


_URL_FILENAME = re.compile(r"(https?://[^\s\"'<>]*?)[?&]filename=[^&\s\"'<>#]*")


def strip_url_names(o):
    """Drop 'filename=' parameters (party names in download links) from every
    URL in a public record, recursively."""
    if isinstance(o, str):
        return _URL_FILENAME.sub(r"\1", o) if "filename=" in o else o
    if isinstance(o, list):
        return [strip_url_names(x) for x in o]
    if isinstance(o, dict):
        return {k: strip_url_names(v) for k, v in o.items()}
    return o


def redact_record(c, oracle=None, nosp_extras=None):
    """Return a PUBLIC-SAFE copy: unnamed officers lose `name`, anonymised
    victims lose `name`, non-public fields are dropped, and leftover name
    fragments are scrubbed from narrative/title fields."""
    import copy
    p = copy.deepcopy(c)
    # Restore the holding from the ungated oracle when the gate stripped
    # it (privacy strip keeps site input name-free; the holding text
    # itself is still needed and is scrubbed below like all narratives).
    if not p.get("verification_note") and oracle is not None:
        if oracle.get("verification_note"):
            p["verification_note"] = oracle["verification_note"]
    lits = record_protected_literals(c)
    unnamed_pats, _orep, victim_pats, victim_repl, lits = _pattern_bundle(
        c, oracle, nosp_extras)
    for o in (p.get("officers") or []):
        if isinstance(o, dict) and o.get("publish_grade") != "named_safe":
            o["name"] = None
            o["name_public"] = None

    def _scrub_str(s):
        if not isinstance(s, str) or not s:
            return s
        if unnamed_pats:
            s = scrub_names(s, unnamed_pats, _orep, literals=lits,
                            rank_prefix=True)
        if victim_pats:
            s = scrub_names(s, victim_pats, victim_repl, literals=lits)
        return s

    # Every narrative-ish field is scrubbed: summaries, holding, quote,
    # titles, verdict/editorial notes, fidelity notes, action
    # descriptions, follow-up/correction strings. IDs, URLs, dates,
    # places, courts, counts and controlled vocabularies are left alone.
    for k in ("summary", "summary_verified", "verification_note",
              "court_quote", "display_title", "display_title_redacted",
              "case_title", "citation", "verdict_note", "editor_notes"):
        if isinstance(p.get(k), str):
            p[k] = _scrub_str(p[k])
    if isinstance(p.get("editor_notes"), list):
        p["editor_notes"] = [_scrub_str(x) for x in p["editor_notes"]]
    if isinstance(p.get("fidelity_changes"), list):
        p["fidelity_changes"] = [_scrub_str(x)
                                 for x in p["fidelity_changes"]]
    for a in (p.get("institutional_response") or []):
        if isinstance(a, dict):
            for k in ("description", "source", "disposition"):
                if isinstance(a.get(k), str):
                    a[k] = _scrub_str(a[k])
    for h in (p.get("followup_history") or []):
        if isinstance(h, dict):
            for k in ("finding_sentence", "finding", "scope", "period",
                      "method"):
                if isinstance(h.get(k), str):
                    h[k] = _scrub_str(h[k])
    for x in (p.get("corrections") or []):
        if isinstance(x, dict):
            for k in ("change", "note"):
                if isinstance(x.get(k), str):
                    x[k] = _scrub_str(x[k])
    # Victims: anonymised records keep role nouns only.
    if is_anonymised(c):
        red = p.get("victims_redacted") or []
        for i, v in enumerate(p.get("victims") or []):
            if isinstance(v, dict):
                v["name"] = None
                d = red[i].get("descriptor") if i < len(red) and isinstance(
                    red[i], dict) else None
                if d:
                    v["descriptor"] = d
        # Prefer the compiled redacted title once scrubbed.
        if p.get("display_title_redacted"):
            p["display_title"] = p["display_title_redacted"]
    p.pop("victims_legal_names_nonpublic", None)
    p.pop("docket_title_nonpublic", None)
    # Later-proceeding person lists are verifier-internal page metadata,
    # not public citations: bare first names there can match gated
    # officers elsewhere, so they are dropped while court, date, url and
    # outcome (the citable action record) are retained.
    for h in (p.get("later_proceedings") or []):
        if isinstance(h, dict):
            h.pop("persons", None)
    humanise_withheld(
        p, ("display_title", "display_title_redacted", "case_title"),
        ("summary", "summary_verified", "verification_note", "court_quote",
         "verdict_note"))
    anonymise_victims(p, c, ("display_title", "display_title_redacted",
                             "case_title", "citation"), oracle)
    return strip_url_names(p)


# ---- Tier-2 (trial-court convictions) ----
T2_SCRUB_REPLACEMENT = "[name withheld]"


def t2_id(r):
    return r.get("case_id") or r.get("merged_id") or "?"


def t2_v(r):
    v = str(r.get("verification_status") or "V1").strip()
    return v if v in ("V1", "V1+", "V2") else "V1"


def t2_court_level(r):
    return (COURT_LEVEL_LABEL.get(r.get("court_level"))
            or pretty_label(r.get("court_level")) or "Trial court")


def t2_appeal(r):
    return (APPEAL_STATUS_LABEL.get(r.get("appeal_status"))
            or pretty_label(r.get("appeal_status")) or "Unknown")


def t2_subcategory(r):
    return pretty_label(r.get("subcategory")).lower() or "not stated"


_T2_MONTHS = {"jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
              "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12}


def t2_iso_date(s):
    """Tier-2 conviction dates are prose ('28 August 2026'); normalise to
    ISO for the tracker index (sorting + date rendering), preserving
    the stated precision (day, month or year), else ''."""
    if not s:
        return ""
    t = str(s).strip()
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})", t)
    if m:
        return "%s-%s-%s" % (m.group(1), m.group(2), m.group(3))
    m = re.match(r"(\d{4})-(\d{2})\b", t)
    if m:
        return "%s-%s" % (m.group(1), m.group(2))
    m = re.match(r"(\d{4})$", t)
    if m:
        return m.group(1)
    m = re.match(r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})", t)
    if m:
        mon = _T2_MONTHS.get(m.group(2).lower()[:3])
        if mon:
            return "%04d-%02d-%02d" % (int(m.group(3)), mon,
                                      int(m.group(1)))
    m = re.match(r"([A-Za-z]+)\s+(\d{4})\b", t)
    if m:
        mon = _T2_MONTHS.get(m.group(1).lower()[:3])
        if mon:
            return "%04d-%02d" % (int(m.group(2)), mon)
    m = re.match(r"((?:19|20)\d{2})\b", t)
    if m:
        return m.group(1)
    return ""


def t2_date_display(r, missing="Date not stated"):
    """Human form of a trial conviction date at its stated precision: a full
    ISO date, 'March 2005' for YYYY-MM, '2005' for YYYY. When the source
    gives no date, the record's conviction_date_note (e.g. 'before 11
    August 2003') is shown instead of an invented day (audit findings 01-02)."""
    s = str(r.get("conviction_date") or "").strip()
    if re.match(r"^\d{4}-\d{2}-\d{2}$", s):
        return fmt_date(s)
    if re.match(r"^\d{4}-\d{2}$", s):
        return fmt_date(s + "-01", "month")
    if s:
        return s
    note = (r.get("conviction_date_note") or "").strip()
    return ("date not stated; %s" % note) if note else missing


def t2_year(r):
    m = re.search(r"\b((?:19|20)\d{2})\b",
                  str(r.get("conviction_date") or ""))
    return int(m.group(1)) if m else None


def t2_source_count(r):
    seen = set()
    n = 0
    if r.get("primary_source_url"):
        seen.add(r["primary_source_url"])
        n += 1
    for u in (r.get("secondary_sources") or []):
        if u and u not in seen:
            seen.add(u)
            n += 1
    return n


def t2_officers_search_text(p):
    # OFFICER GATE for the search index: display-safe text only.
    bits = []
    for o in (p.get("officers") or []):
        if not isinstance(o, dict):
            continue
        if o.get("publish_grade") == "named_safe":
            bits.append(o.get("name_public") or o.get("display") or "")
        else:
            bits.append(o.get("display") or "")
    return " ".join(b for b in bits if b)


def _literal_pattern(lit):
    pieces = [_word_rx(w) for w in lit.split(" ") if w]
    if not pieces or any(p is None for p in pieces):
        return None
    return r"\s*".join(pieces)


def t2_scrub_patterns(raw_t1, oracle_by_id=None, nosp_extras=None):
    """Scrub patterns + lowercase literal set for the cross-tier gate:
    every tier-1-withheld multi-word literal, minus adjudicated-exempt
    identities (same exemption rule as leak_literals_for_assertion).
    Fail-closed and dynamic per build: a tier-1 re-grade automatically
    heals tier-2 rendering on the next build."""
    oracle_by_id = oracle_by_id or {}
    pats = []
    for c in raw_t1:
        rid = c.get("record_id") or c.get("merged_id")
        oracle = oracle_by_id.get(c.get("merged_id"))
        names = [nm for nm, _k in gated_effective_names(c, oracle)]
        for nm, kind in (nosp_extras or {}).get(rid, []):
            if kind == "officer" or is_anonymised(c):
                names.append(nm)
        for nm in names:
            all_lows = {lit.lower() for lit in _name_literals(nm)}
            if all_lows & set(EXEMPT_GLOBAL):
                continue
            for lit in _name_literals(nm):
                if " " not in lit.strip():
                    continue
                p = _literal_pattern(lit)
                if p:
                    pats.append(p)
    pats = sorted(set(pats), key=len, reverse=True)
    lows = set()
    for c in raw_t1:
        rid = c.get("record_id") or c.get("merged_id")
        oracle = oracle_by_id.get(c.get("merged_id"))
        names = [nm for nm, _k in gated_effective_names(c, oracle)]
        for nm, kind in (nosp_extras or {}).get(rid, []):
            if kind == "officer" or is_anonymised(c):
                names.append(nm)
        for nm in names:
            lits = _name_literals(nm)
            if {l.lower() for l in lits} & set(EXEMPT_GLOBAL):
                continue
            for lit in lits:
                if " " in lit.strip():
                    lows.add(lit.lower())
    return pats, lows


def t1_held_names(raw_t1):
    """Lowercased full-name variants tier-1 legitimately publishes
    (named_safe officers): tier-2 keeps these (no downgrade, no scrub)
    because tier-1's own gate cleared the same human."""
    held = set()
    for c in (raw_t1 or []):
        for o in (c.get("officers") or []):
            if not isinstance(o, dict):
                continue
            if o.get("publish_grade") != "named_safe":
                continue
            for nm in (o.get("name"), o.get("name_public")):
                if nm:
                    for v in _name_variants(nm):
                        held.add(v.lower())
    return held


def build_t2_public(r, pats, withheld_lows, t1_held=()):
    """Return a PUBLIC-SAFE tier-2 copy + downgraded officer names.
    Officers render ONLY via `display`; a named_safe officer whose name
    collides with a tier-1-withheld literal is downgraded to rank+unit
    (fail-closed: either gate's withhold wins), unless tier-1 itself
    holds the same full name. Tier-1-withheld names are redacted from
    tier-2 prose, except inside this record's own held-officer spans
    (names it publishes in its own display anyway)."""
    import copy
    p = copy.deepcopy(r)
    # Internal pipeline commentary (verify-pass disagreement notes) is
    # never published: it names gated officers and violates the no
    # compiler-commentary rule, while the verdict itself is already
    # carried (scrubbed) in verdict_note.
    p.pop("merge_note", None)
    held = {h.lower() for h in (t1_held or ())}
    downgraded = []
    # ONE compiled cross-tier alternation per build (round 6c; cached
    # by literal set), not one regex search per withheld literal.
    down_rx = _alt_rx_for(withheld_lows) if withheld_lows else None
    for o in (p.get("officers") or []):
        if not isinstance(o, dict):
            continue
        if o.get("publish_grade") == "named_safe":
            if (o.get("name") or "").strip().lower() in held or \
                    (o.get("name_public") or "").strip().lower() in held:
                continue
            blob = " ".join(x for x in (o.get("name"), o.get("name_public"),
                                        o.get("display")) if x).lower()
            if down_rx is not None and down_rx.search(blob):
                downgraded.append(o.get("name") or o.get("name_public")
                                  or o.get("display") or "?")
                o["publish_grade"] = "unnamed"
                o["display"] = None
        if o.get("publish_grade") != "named_safe":
            o["name"] = None
            o["name_public"] = None
            if not o.get("display"):
                rank = (o.get("rank") or "").strip()
                unit = (o.get("unit") or "").strip()
                o["display"] = ("%s, %s" % (rank, unit) if rank and unit
                                else rank or unit or sw(p, "fallback"))
    # The record's own withheld names (downgraded ex-named_safe +
    # unnamed-real) scrub in the same pass, longest-first, so a
    # cross-tier run can never strand a bare surname behind.
    own_pats = compile_name_alternates(
        [nm for nm, _k in _t2_effective_names(r, downgraded)])
    all_pats = sorted(set(pats) | set(own_pats), key=len, reverse=True)
    # Protected spans: only names this record itself publishes (its
    # surviving named_safe officers). A tier-1-held string this record
    # does not hold is still scrubbed (fail-closed: the same string
    # may be withheld for a different human elsewhere).
    prot = set()
    for o in (p.get("officers") or []):
        if isinstance(o, dict) and o.get("publish_grade") == "named_safe":
            for nm in (o.get("name"), o.get("name_public")):
                if nm:
                    for v in _name_variants(nm):
                        prot.add(v.lower())
    prot = sorted(prot, key=len, reverse=True)

    def _s(s):
        if not isinstance(s, str) or not s:
            return s
        return scrub_names(s, all_pats, T2_SCRUB_REPLACEMENT,
                           literals=prot) if all_pats else s

    # trial_court_name renders in the meta description, current
    # position, At-a-glance Court row and md twin, so it is scrubbed
    # like the other free-text fields (a judge's name colliding with a
    # tier-1 withhold redacts here, consistent with the summary).
    for k in ("case_title_or_number", "case_title", "summary", "sentence",
              "trial_court_name", "court_quote", "verdict_note",
              "source_agency"):
        if isinstance(p.get(k), str):
            p[k] = _s(p[k])
    if isinstance(p.get("victims"), str):
        p["victims"] = [p["victims"]]
    if isinstance(p.get("victims"), list):
        p["victims"] = [_s(v) if isinstance(v, str) else v
                        for v in p["victims"]]
    if isinstance(p.get("sections"), list):
        p["sections"] = [_s(v) if isinstance(v, str) else v
                         for v in p["sections"]]
    humanise_withheld(p, ("case_title_or_number", "case_title"),
                      ("summary", "sentence", "court_quote", "verdict_note"))
    anonymise_victims(p, r, ("case_title_or_number", "case_title"))
    return p, downgraded


def first_unit(r):
    """Police station / unit of a record: the HC field, else the first officer's unit."""
    if r.get("police_station_or_unit"):
        return r["police_station_or_unit"]
    for o in (r.get("officers") or []):
        if isinstance(o, dict) and o.get("unit"):
            return o["unit"]
    return None


def news_fields(rec, r, rid, alt=None):
    """Add plate (pl), headline (h), paragraph (pa), role (ro), station/unit (ps)."""
    pl = PLATES.get(rid) or (PLATES.get(alt) if alt else None)
    if pl:
        rec["pl"] = pl
    pn = PLAIN.get(rid) or (PLAIN.get(alt) if alt else None)
    if pn and pn.get("headline") and pn.get("paragraph"):
        # the plain paragraph replaces the legal summary on the card (keeps the index small)
        para = pn["paragraph"]
        if len(para) > INDEX_SUMMARY_CHARS:
            para = para[:INDEX_SUMMARY_CHARS].rstrip() + "\u2026"
        rec["h"], rec["su"] = pn["headline"], para
        if pn.get("role"):
            rec["ro"] = pn["role"]
    ps = first_unit(r)
    if ps:
        rec["ps"] = ps
    return rec


def build_t2_index_record(p):
    title = p.get("case_title_or_number") or ""
    summ = p.get("summary") or ""
    if len(summ) > INDEX_SUMMARY_CHARS:
        summ = summ[:INDEX_SUMMARY_CHARS].rstrip() + "\u2026"
    jd = t2_iso_date(p.get("conviction_date"))
    rec = {"id": t2_id(p), "mid": p.get("merged_id") or t2_id(p),
           "ti": title, "su": summ, "lv": "trial", "tier": "trial", "na": 0,
           "ou": p.get("outcome_type") or "trial_court_conviction"}
    if p.get("state"):
        rec["st"] = p["state"]
    if p.get("district"):
        rec["di"] = p["district"]
    if p.get("trial_court_name"):
        rec["co"] = p["trial_court_name"]
    rec["ca"] = site_category(p)
    rec["sc"] = t2_subcategory(p)
    rec["jd"] = jd
    jy = t2_year(p)
    if jy is not None and str(jy) != (jd[:4] if jd else ""):
        rec["jy"] = jy
    rec["v"] = t2_v(p)
    if p.get("appeal_status"):
        rec["ap"] = p["appeal_status"]
    ns = t2_source_count(p)
    if ns != 1:
        rec["ns"] = ns
    ot = t2_officers_search_text(p)
    if ot:
        rec["ot"] = ot
    news_fields(rec, p, t2_id(p), p.get("merged_id"))
    return index_watch_keys(rec, p)


def source_count(c):
    n = 1 if c.get("primary_source_url") else 0
    seen = {c.get("primary_source_url")}
    for u in (c.get("secondary_sources") or []):
        if u and u not in seen:
            seen.add(u)
            n += 1
    return n


def sentence_compact(c):
    bits = []
    if c.get("sentence_type"):
        bits.append(pretty_label(c["sentence_type"]))
    if c.get("sentence_max_years") is not None:
        bits.append("max %s yrs" % c["sentence_max_years"])
    if c.get("compensation_inr") is not None:
        bits.append(fmt_inr(c["compensation_inr"]))
    return "; ".join(bits) if bits else "None ordered"


MAILTO = "mailto:%s" % CONTACT_EMAIL


def _nav(route):
    out = []
    for href, label in NAV_LINKS:
        cls = ' class="on"' if href == route else ""
        out.append('<a href="%s"%s>%s</a>' % (href, cls, label))
    return "".join(out)


def parent_org_ld():
    po = P.get("parent_org")
    return dict({"@type": "Organization"}, **po) if po else None


def org_ld_node():
    node = {"@type": "Organization", "@id": SITE_URL + "/#organization",
            "name": SITE_NAME, "url": SITE_URL,
            "description": T["org_description"],
            "logo": {"@type": "ImageObject",
                     "url": SITE_URL + "/assets/brand/logo-full-1024.png",
                     "width": 1024, "height": 1024}}
    if parent_org_ld():
        node["parentOrganization"] = parent_org_ld()
    return node


def shell_tokens(tpl):
    """Fill the @@TOKEN@@ slots of the page-shell template from the
    profile. Done on the template before %-formatting, so '%' in copy is
    escaped and page content is never touched."""
    for k, v in (("SITE_NAME", esc(SITE_NAME)), ("TAGLINE", esc(TAGLINE)),
                 ("OG_ALT", T["og_alt"]),
                 ("FOOT_TAGLINE", T["footer_tagline"]),
                 ("FOOT_ABOUT", T["footer_about"]),
                 ("FOOT_COLS", fill(T["footer_cols"], mailto=MAILTO)),
                 ("FOOT_DISCLAIMER", T["footer_disclaimer"]),
                 ("SWITCHER", watch_switcher())):
        tpl = tpl.replace("@@%s@@" % k, v.replace("%", "%%"))
    return tpl


SWITCHER_ON = len(WATCHES) > 1 and not os.environ.get("NO_SWITCHER")

SWITCHER_CSS = """
/* watch switcher: the Babuwatch family strip above the masthead */
.watchbar{background:var(--slate);color:#fff;font-family:var(--sans);font-size:13px}
.watchbar .wrap{display:flex;align-items:center;gap:16px;min-height:40px;max-width:1280px;overflow-x:auto}
.watchbar .wb-lab{opacity:.72;text-transform:uppercase;letter-spacing:.08em;font-size:11px;white-space:nowrap}
.watchbar nav{display:flex;gap:4px}
.watchbar a{color:#fff;text-decoration:none;padding:6px 10px;border-radius:4px;white-space:nowrap}
.watchbar a span{opacity:.78;margin-left:6px;font-weight:400}
.watchbar a:hover{background:rgba(255,255,255,.12)}
.watchbar a.on{background:var(--saffron)}
@media(max-width:760px){.watchbar a span{display:none}.watchbar .wb-lab{display:none}}
"""


def watch_switcher():
    """Strip above the masthead linking the umbrella and every sub-watch.
    Links are site-root paths (@ROOT@, resolved in prefix_html) so they
    work on preview deployments as well as the production domain."""
    if not SWITCHER_ON:
        return ""
    family = next((w["name"] for w in WATCHES if not w["parent"]), SITE_NAME)
    items = []
    for w in WATCHES:
        on = w["slug"] == WATCH
        items.append('<a href="@ROOT@%s"%s><strong>%s</strong><span>%s</span>'
                     "</a>" % (w["base"],
                               ' class="on" aria-current="page"' if on
                               else "", esc(w["short_name"]),
                               esc(w["blurb"])))
    return ('<div class="watchbar"><div class="wrap"><span class="wb-lab">'
            '%s registers</span><nav aria-label="%s registers">%s</nav>'
            "</div></div>" % (esc(family), esc(family), "".join(items)))


def page_shell(title, desc, path, main_html, route=None, og_type="website",
               extra_head="", ld_graph=None, md_rel=None, extra_ld=None):
    canon = SITE_URL + path
    # AI-access alternates (reference convention: markdown twin + llms.txt +
    # structured JSON, absolute served URLs).
    _alt = ['<link rel="alternate" type="text/markdown" title="Markdown"'
            ' href="%s%s">' % (PUBLIC_BASE, md_rel or
                               (path.rstrip("/") + "/index.md")),
            '<link rel="alternate" type="text/plain" title="llms.txt"'
            ' href="%s/llms.txt">' % PUBLIC_BASE,
            '<link rel="alternate" type="application/json" title="Cases JSON"'
            ' href="%s/data/cases.json">' % PUBLIC_BASE]
    extra_head = "".join(_alt) + extra_head
    if ld_graph is None:
        ld_graph = [
            org_ld_node(),
            {"@type": "WebSite", "@id": SITE_URL + "/#website",
             "url": SITE_URL, "name": SITE_NAME,
             "description": T["website_description"],
             "publisher": {"@id": SITE_URL + "/#organization"},
             "inLanguage": "en-IN"},
            {"@type": "WebPage", "@id": canon + "#webpage", "url": canon,
             "name": title,
             "description": desc, "isPartOf": {"@id": SITE_URL + "/#website"},
             "about": {"@id": SITE_URL + "/#organization"},
             "inLanguage": "en-IN"},
        ]
    if extra_ld:
        ld_graph = list(ld_graph) + list(extra_ld)
    ld = ('<script type="application/ld+json">%s</script>'
          % json.dumps({"@context": "https://schema.org", "@graph": ld_graph},
                       ensure_ascii=False))
    nav = _nav(route or path.rstrip("/") or "/")
    # Route "/" has no nav entry; never mark anything .on for home.
    if (route or path) in ("/", ""):
        nav = _nav("__none__")
    return shell_tokens("""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>%s</title>
<meta name="description" content="%s">
<meta name="robots" content="index, follow">
<link rel="canonical" href="%s"><meta property="og:site_name" content="%s">
<meta property="og:locale" content="en_IN">
<meta property="og:type" content="%s">
<meta property="og:title" content="%s">
<meta property="og:description" content="%s">
<meta property="og:url" content="%s">
<meta property="og:image" content="%s/assets/brand/social-card.jpg">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="@@OG_ALT@@">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="%s">
<meta name="twitter:description" content="%s">
<meta name="twitter:image" content="%s/assets/brand/social-card.jpg">
<meta name="twitter:image:alt" content="@@OG_ALT@@">%s<link rel="icon" href="/assets/brand/favicon.ico" sizes="48x48">
<link rel="icon" type="image/svg+xml" href="/assets/brand/logo-glyph-saffron.svg">
<link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="%s" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
<script src="/public-nav.js" defer></script>
%s</head>
<body>

<a href="#main" class="skip">Skip to content</a>
@@SWITCHER@@
<header class="masthead">
  <div class="wrap">
    <a class="brand" href="/">
      <span class="seal" aria-hidden="true"><img src="/assets/brand/logo-mark-saffron.svg" width="40" height="40" alt=""></span>
      <span class="brand-text">
        <span class="name">@@SITE_NAME@@</span>
        <span class="tagline">@@TAGLINE@@</span>
      </span>
    </a>
    <nav class="links" aria-label="Primary">%s</nav>    <button class="navtoggle" type="button" aria-label="Open menu" aria-controls="mobile-navigation" aria-expanded="false">&#9776;</button>
  </div>
  <nav class="mobilenav" id="mobile-navigation" aria-label="Primary mobile">%s</nav></header>

<main id="main">
%s
</main>

<footer>
  <div class="wrap">
    <div class="foot-top">
      <div class="foot-brand">
        <div class="name">@@SITE_NAME@@</div>
        <div class="tagline">@@FOOT_TAGLINE@@</div>
        <p>@@FOOT_ABOUT@@</p>
      </div>
      <div class="foot-cols">
@@FOOT_COLS@@
      </div>
    </div>
    <div class="foot-base">
      @@FOOT_DISCLAIMER@@
      <div class="foot-legal">&copy; 2026 @@SITE_NAME@@ &middot; Nothing on this site is legal advice. For advice on a specific case, consult a lawyer or your State Legal Services Authority.</div>
    </div>
  </div>
</footer>
</body>
</html>
""") % (esc(title), esc(desc), esc(canon), esc(SITE_NAME), og_type,
       esc(title), esc(desc), esc(canon), SITE_URL, esc(title), esc(desc),
       SITE_URL, ld, FONTS_URL, extra_head, nav, nav, main_html)


def read_ref(name):
    with open(os.path.join(REF_DIR, name), encoding="utf-8") as f:
        return f.read()


def extract_main(ref_html):
    m = re.search(r"<main[^>]*>(.*?)</main>", ref_html, re.S)
    return m.group(1).strip() if m else ""


def extract_section(ref_html, cls):
    m = re.search(r'<section class="%s".*?</section>' % re.escape(cls),
                  ref_html, re.S)
    return m.group(0) if m else ""


def static_links(main_html):
    """Drop backend-dependent /report + /volunteer targets -> mailto."""
    h = main_html
    h = h.replace('href="/report/public-source"', 'href="%s"' % MAILTO)
    h = re.sub(r'href="/report(#[^"]*)?"', 'href="%s"' % MAILTO, h)
    h = re.sub(r'href="/volunteer(#[^"]*)?"', 'href="%s"' % MAILTO, h)
    h = h.replace(">Report an incident<", ">Contact us<")
    h = h.replace(">Volunteer with us<", ">Contact us<")
    h = h.replace(">Volunteer your skills<", ">Contact us<")
    h = h.replace("Report an incident &rarr;",
                  "Contact us &rarr;")
    return h


def prefix_html(html_out):
    """Rewrite every root-relative link/src/action to the served base
    path (BASE). Absolute, protocol-relative, mailto, anchor and data
    URLs are untouched."""
    html_out = re.sub(r'((?:href|src|action)=")/(?!/)',
                        r"\1" + BASE + "/", html_out)
    # Cross-watch links are written @ROOT@/<path>: site-root relative,
    # never prefixed with this watch's BASE.
    html_out = re.sub(r'((?:href|src|action)=")@ROOT@', r"\1", html_out)
    # Site root stays noslash (the proxy strips trailing slashes with
    # 308, so the home canonical/link must be the noslash form).
    return html_out.replace('href="%s/"' % BASE, 'href="%s"' % BASE)


def action_summary(c):
    acts = actions(c)
    n = len(acts)
    if not n:
        return "0 institutional actions"
    statuses = []
    for a in acts:
        s = (a.get("status") or "").lower()
        if s and s not in statuses:
            statuses.append(s)
    return "%d institutional action%s &middot; %s" % (
        n, "" if n == 1 else "s", " &middot; ".join(statuses))


def officers_search_text(c):
    # OFFICER GATE for the search index: display-safe text only —
    # name_public when named_safe, else the rank+unit display label.
    # Mirrors tracker.js officersText(); never the raw name.
    bits = []
    for o in (c.get("officers") or []):
        if not isinstance(o, dict):
            continue
        if o.get("publish_grade") == "named_safe":
            bits.append(o.get("name_public") or o.get("display") or "")
        else:
            bits.append(o.get("display") or "")
    return " ".join(b for b in bits if b)


# Slim tracker index: only the fields the tracker table/filters need.
# Short keys keep it under ~400 KB raw; tracker.js reads these with a
# fallback to the full cases.json shape. Defaults are omitted (tracker
# restores them): v=V2, tr=A, pp=Reported allegation, as=[concluded] when
# na>0, ns=1, jy=jd[:4]. Summaries truncate at 320 chars — beyond the
# 3-line card clamp, so rendered cards are unchanged; full text stays in
# cases.json, per-record JSON and the incident pages.
INDEX_SUMMARY_CHARS = 320


def build_index_record(c):
    title = c.get("display_title") or c.get("case_title") or ""
    summ = c.get("summary") or ""
    if len(summ) > INDEX_SUMMARY_CHARS:
        summ = summ[:INDEX_SUMMARY_CHARS].rstrip() + "\u2026"
    rec = {"id": rec_id(c), "mid": c.get("merged_id"), "ti": title,
           "su": summ, "tier": "hc_sc"}
    if c.get("state"):
        rec["st"] = c["state"]
    if c.get("district"):
        rec["di"] = c["district"]
    if c.get("court"):
        rec["co"] = c["court"]
    if c.get("case_number"):
        rec["cn"] = c["case_number"]
    rec["ca"] = site_category(c)
    sub = ((c.get("subcategory_display") or "").strip()
           or pretty_label(c.get("subcategory")).lower())
    if sub:
        rec["sc"] = sub
    if c.get("outcome_type"):
        rec["ou"] = outcome_code(c)
    rec["jd"] = c.get("judgment_date") or ""
    jy = c.get("judgment_year")
    if jy is not None and str(jy) != rec["jd"][:4]:
        rec["jy"] = jy
    ct = c.get("case_title") or ""
    if ct and ct != title:
        rec["ct"] = ct
    v = v_level(c)
    if v != "V2":
        rec["v"] = v
    t = tier(c)
    if t != "A":
        rec["tr"] = t
    pp = evidence_position(c)
    if pp != "Reported allegation":
        rec["pp"] = pp
    acts = actions(c)
    rec["na"] = len(acts)
    statuses = []
    for a in acts:
        s = (a.get("status") or "").lower()
        if s and s not in statuses:
            statuses.append(s)
    if statuses != ["concluded"]:
        rec["as"] = statuses
    if c.get("followup_history"):
        rec["ch"] = True
    if c.get("last_checked"):
        rec["lc"] = c["last_checked"]
    if is_retracted(c):
        rec["re"] = True
    ns = source_count(c)
    if ns != 1:
        rec["ns"] = ns
    ot = officers_search_text(c)
    if ot:
        rec["ot"] = ot
    news_fields(rec, c, rec_id(c), c.get("merged_id"))
    return index_watch_keys(rec, c)


def index_watch_keys(rec, c):
    """Umbrella-only index keys: `w` = path of the record's home watch
    under this one (records rendered elsewhere), `sv` = service (only when
    this watch mixes services, so single-service indexes stay unchanged)."""
    w = watch_prefix(c)
    if w:
        rec["w"] = w
    if MULTI_SERVICE:
        rec["sv"] = c.get("service") or ""
    return rec


NEWS_OUTCOME = {
    "trial_court_conviction": "Convicted", "conviction_by_hc": "Convicted",
    "conviction_by_sc": "Convicted", "conviction_upheld": "Conviction upheld",
    "adverse_finding_compensation": "Compensation ordered",
    "adverse_finding": "Adverse finding", "disciplinary_upheld": "Penalty upheld"}


def news_card_html(c, kind="incident"):
    """Server-side twin of tracker.js cardHtml(): the news-style card with
    category + outcome chips, the RTO-style plate, headline, meta line,
    paragraph and the record link. Used where no script renders cards."""
    trial = kind == "trial-court"
    rid = t2_id(c) if trial else rec_id(c)
    url = rec_path(c, kind, rid)
    pn = PLAIN.get(rid) or PLAIN.get(c.get("merged_id") or "") or {}
    head = pn.get("headline") or (c.get("case_title_or_number") if trial else
                                  c.get("display_title") or c.get("case_title")) or rid
    para = pn.get("paragraph") or c.get("summary") or ""
    if len(para) > INDEX_SUMMARY_CHARS:
        para = para[:INDEX_SUMMARY_CHARS].rsplit(" ", 1)[0].rstrip(",;:") + "\u2026"
    outc = NEWS_OUTCOME.get(outcome_code(c, "trial_court_conviction" if trial else ""),
                            "Convicted" if trial else tier_label(c))
    jd = (c.get("conviction_date") if trial else c.get("judgment_date")) or ""
    meta = [x for x in (fmt_date(jd, c.get("date_precision")) if jd else "",
                        location_short(c)) if x]
    if pn.get("role"):
        meta.append(pn["role"] + " (name withheld)")
    plate = PLATES.get(rid) or PLATES.get(c.get("merged_id") or "")
    return (
        '<article class="tracker-card news-card" data-id="%s">'
        '<div class="news-top"><div class="news-chips"><span class="chip">%s'
        '</span><span class="chip chip-out">%s</span></div>%s</div>'
        '<h2 class="news-head"><a href="%s">%s</a></h2>'
        '<p class="news-meta">%s</p><p class="news-para">%s</p>'
        '<a class="tracker-card-open" href="%s" aria-label="Read the court record %s">'
        'Read the court record <span aria-hidden="true">&rarr;</span></a></article>'
        % (esc(rid), esc(site_category(c)), esc(outc),
           '<span class="plate" title="Case number">%s</span>' % esc(plate)
           if plate else "", esc(url), esc(head),
           " &middot; ".join(esc(x) for x in meta), esc(para), esc(url),
           esc(plate or rid)))


def home_record_card(c):
    return news_card_html(c, "incident")




def build_home(cases, ref_index, t2=None, n_overturned=0):
    """Home page: the profile's home_sections, in order. 'hero', 'tracker',
    'patterns' and 'watches' are generated from profile copy; 'ref:<cls>'
    lifts <section class="<cls>"> from the watch's templates/<>/index.html."""
    recent = sorted(cases, key=lambda c: (c.get("judgment_date") or ""),
                    reverse=True)[:3]
    cards = ('<div class="home-news-list">%s</div>'
             % "".join(home_record_card(c) for c in recent))
    t2 = t2 or []
    n1, n2 = len(cases), len(t2)
    total = n1 + n2
    states_n = len(set([c.get("state") for c in cases if c.get("state")]
                       + [r.get("state") for r in t2 if r.get("state")]))
    head = headline_sentence(n1, n2)
    parts = []
    for sec in P["home_sections"]:
        if sec == "hero":
            parts.append(fill(T["home_hero"], headline=head, mailto=MAILTO))
        elif sec == "tracker":
            parts.append(fill(T["home_tracker"], total=fmt_thousands(total),
                              n1=n1, n2=n2, states=states_n,
                              overturned=overturned_note(n_overturned),
                              cards=cards))
        elif sec == "patterns":
            parts.append(fill(T["home_patterns"],
                              total=fmt_thousands(total)))
        elif sec == "watches":
            parts.append(watches_section(cases, t2))
        elif sec.startswith("ref:"):
            parts.append(fill(static_links(extract_section(ref_index, sec[4:])),
                              total=fmt_thousands(total)))
        else:
            raise SystemExit("unknown home section %r" % sec)
    return "\n".join(parts)


def watches_section(cases, t2):
    """Umbrella home: one card per kind of public servant, linking to the
    register that hosts its pages (a sub-watch) or to this watch's tracker
    filtered to that service."""
    groups = {}
    for r in list(cases) + list(t2):
        groups.setdefault((r.get("service") or "", r.get("watch") or WATCH),
                          []).append(r)
    cards = []
    for (svc, home), recs in sorted(groups.items(),
                                    key=lambda kv: (kv[0][1] != WATCH,
                                                    kv[0][0])):
        other = next((w for w in WATCHES if w["slug"] == home), None)
        if home != WATCH and other:
            href = "@ROOT@" + other["base"]
            title = other["name"]
            blurb = T.get("watch_card_" + home, other["blurb"])
        else:
            href = "/tracker?service=%s" % svc
            title = T.get("service_label_" + svc) or svc.title()
            blurb = T.get("watch_card_" + svc, "")
        cards.append(
            '<div class="verb"><div class="w"><a href="%s">%s</a></div>'
            '<p><strong>%s records.</strong> %s</p>'
            '<p><a href="%s">Open &rarr;</a></p></div>'
            % (href, esc(title), fmt_thousands(len(recs)), esc(blurb), href))
    return """
<section class="does watches">
  <div class="wrap">
    <div class="doeshead">
      <div class="kicker">%s</div>
      <h2>%s</h2>
      <p>%s</p>
    </div>
    <div class="verbs">%s</div>
  </div>
</section>
""" % (esc(T.get("watches_kicker", "")), esc(T.get("watches_h2", "")),
       esc(T.get("watches_lede", "")), "".join(cards))


def tracker_card(c):
    return news_card_html(c, "incident")


def filter_pills(active=""):
    main = []
    for val, label in FILTER_MAIN:
        href = "/tracker" if not val else "/tracker?filter=%s" % val
        cls = "tracker-filter on" if val == active else "tracker-filter"
        main.append('<a class="%s" href="%s" data-filter="%s">%s</a>'
                    % (cls, href, val, label))
    more = []
    for val, label in FILTER_MORE:
        href = "/tracker?filter=%s" % val
        cls = "tracker-filter on" if val == active else "tracker-filter"
        more.append('<a class="%s" href="%s" data-filter="%s">%s</a>'
                    % (cls, href, val, label))
    return "".join(main), "".join(more)


def extra_filter_ui(cases, t2cases=None):
    # R86/R90: no sub-category or confidence public facets. Category uses
    # the five site labels. Every facet unions both tiers so state,
    # district, year, category, outcome and court all filter across the
    # full dataset; Court level defaults to All.
    t2cases = t2cases or []
    both = list(cases) + list(t2cases)
    states = sorted(set(c.get("state", "") for c in both if c.get("state")))
    cats = [v for v in SITE_CATEGORIES
            if any(site_category(c) == v for c in both)]
    outs = sorted(set(outcome_code(c) for c in both
                      if c.get("outcome_type")))
    courts = sorted(
        set([c.get("court", "") for c in cases if c.get("court")]
            + [r.get("trial_court_name", "") for r in t2cases
               if r.get("trial_court_name")]),
        key=lambda s: (s != "Supreme Court of India", s))
    years = sorted(set(
        [c.get("judgment_year") for c in cases if c.get("judgment_year")]
        + [r.get("conviction_year") or t2_year(r) for r in t2cases
           if (r.get("conviction_year") or t2_year(r))]))

    def opts(vals, labfn=None):
        labfn = labfn or (lambda v: v)
        return ('<option value="">All</option>' + "".join(
            '<option value="%s">%s</option>' % (esc(v), esc(labfn(v)))
            for v in vals))

    simple = """
      <div class="tracker-extra tracker-extra-simple" aria-label="Quick case filters">
        <div class="tracker-extra-row">
          %s<label>State<select id="x-state">%s</select></label>
          <label>Category<select id="x-category">%s</select></label>
          <button type="button" id="x-reset" class="tracker-filter">Reset</button>
        </div>
      </div>""" % (
        service_select(both),
        opts(states),
        opts(cats))
    more = """
        <div class="tracker-extra-row tracker-extra-more" aria-label="More case filters">
          <label>Court level<select id="x-level"><option value="all" selected>All levels</option><option value="hc_sc">High Court / Supreme Court</option><option value="trial">Trial court</option></select></label>
          <label>Year<select id="x-year">%s</select></label>
          <label>District<select id="x-district" disabled><option value="">Choose a state first</option></select></label>
          <label>Police station / unit<select id="x-ps" disabled><option value="">Choose a state first</option></select></label>
          <label>Outcome<select id="x-outcome">%s</select></label>
          <label>Court<select id="x-court">%s</select></label>
        </div>""" % (
        opts([str(y) for y in years]),
        opts(outs, lambda v: OUTCOME_LABEL.get(v, pretty_label(v))),
        opts(courts))
    geo = {}
    for r in list(cases) + list(t2cases):
        st, di = r.get("state"), r.get("district")
        if not st or not di:
            continue
        units = geo.setdefault(st, {}).setdefault(di, [])
        u = first_unit(r)
        if u and u not in units:
            units.append(u)
    more += ('\n        <script type="application/json" id="x-geo">%s</script>'
             % json.dumps(geo, ensure_ascii=False, sort_keys=True).replace("</", "<\\/"))
    return simple, more


def service_select(records):
    """'Who' facet for watches that mix services (the umbrella)."""
    if not MULTI_SERVICE:
        return ""
    present = [s for s in SERVICE_WORDS
               if any((r.get("service") or "") == s for r in records)]
    return ('<label>Who<select id="x-service"><option value="">Everyone'
            "</option>%s</select></label>\n          " % "".join(
                '<option value="%s">%s</option>'
                % (s, esc(T.get("service_label_" + s)
                          or SERVICE_WORDS[s]["label"] + "s"))
                for s in present))


def build_tracker(cases, pre_render=60, t2cases=None, n_overturned=0):
    pills_main, pills_more = filter_pills("")
    t2cases = t2cases or []
    n1, n2 = len(cases), len(t2cases)
    total = n1 + n2
    pool = ([(c.get("judgment_date") or "", 0, c) for c in cases]
            + [(t2_iso_date(r.get("conviction_date")) or "", 1, r)
               for r in t2cases])
    recent = sorted(pool, key=lambda t: (t[0], t[1]), reverse=True)[:pre_render]
    cards = "".join(tracker_card(c) if tag == 0 else trial_card(c)
                    for _k, tag, c in recent)
    head = headline_sentence(n1, n2)
    simple_ui, more_ui = extra_filter_ui(cases, t2cases)
    main = """
  <header class="tracker-pagehead">
    <div class="wrap">
      <div class="eyebrow">The public record</div>
      <h1>Incident tracker</h1>
      <p>Browse %s quickly, then open a record for its complete sources, court findings, institutional response, and procedural history.</p>
    </div>
  </header>

  <section class="tracker-browser" aria-label="Published incident records">
    <div class="wrap">
      <div class="tracker-context"><strong>How to read this tracker</strong><span>Each record documents a court judgment or trial-court conviction; findings are attributed to the deciding court. Verification and institutional actions are assessed separately. %s</span><a href="/methodology">Methodology &rarr;</a></div>

      <form class="tracker-search" action="/tracker" method="get" role="search" id="tracker-search-form">
        <label for="tracker-query">Search cases</label>
        <div class="tracker-search-row"><input id="tracker-query" name="q" value="" placeholder="Search cases (live)"><button type="submit">Search</button></div>
      </form>

      <nav class="tracker-filterbar" aria-label="Main record filters">
        %s
      </nav>
%s
      <details class="tracker-more">
        <summary>More filters</summary>
        <nav aria-label="Additional record filters">%s</nav>
%s
      </details>
      <div class="tracker-results-head" aria-live="polite"><strong id="tracker-count">%s</strong><span></span></div>
      <div class="tracker-records" id="tracker-records">
%s
      </div>
      <noscript><div class="tracker-empty"><h2>Filtering needs JavaScript</h2><p>Showing the %d most recent of %s records. Browse by state from the <a href="/tracker">tracker&rsquo;s state filter</a> or <a href="/data">download the dataset</a>.</p></div></noscript>
    </div>
  </section>
""" % (head, overturned_note(n_overturned), pills_main, simple_ui,
       pills_more, more_ui,
       results_line(min(pre_render, total), n1, n2), cards,
       min(pre_render, total), fmt_thousands(total))
    return main


def officer_lines(c):
    # OFFICER GATE: render ONLY the pre-rendered safe `display` text
    # (rank + unit unless the two-key + subsequent-history gate graded the
    # officer named_safe). NEVER render officers[].name here.
    return [officer_display(o, c) for o in (c.get("officers") or [])]


def role_noun(age, gender):
    g = (gender or "").strip().lower()
    try:
        a = int(age) if age is not None else None
    except (TypeError, ValueError):
        a = None
    if a is not None and a < 18:
        if g.startswith("f"):
            return "a %d-year-old girl" % a
        if g.startswith("m"):
            return "a %d-year-old boy" % a
        return "a %d-year-old child" % a
    if g.startswith("f"):
        return "a woman"
    if g.startswith("m"):
        return "a man"
    return "a person"


def victim_descriptors(c):
    """Role nouns for anonymised records (victims_redacted only; legal
    names never render — R40-R43); names as recorded otherwise."""
    vics = c.get("victims") or []
    if any(isinstance(v, dict) and v.get("descriptor") for v in vics):
        return [(v.get("descriptor") if isinstance(v, dict) else str(v))
                or "a person" for v in vics if v]
    if is_anonymised(c):
        red = c.get("victims_redacted") or []
        out = []
        for i, v in enumerate(vics):
            d = None
            if i < len(red) and isinstance(red[i], dict):
                d = red[i].get("descriptor")
            if not d and isinstance(v, dict):
                nm = (v.get("name") or "")
                # Already non-identifying placeholders stay as-is.
                if nm in ("Not named in judgment",
                          "Prosecutrix (name withheld)"):
                    d = nm
                else:
                    d = role_noun(v.get("age"), v.get("gender"))
            out.append(d or "a person")
        if not out:
            for r in red:
                if isinstance(r, dict) and r.get("descriptor"):
                    out.append(r["descriptor"])
        return out
    bits = []
    for v in vics:
        if isinstance(v, dict):
            bit = v.get("name") or "Unnamed victim"
            extra = ", ".join(x for x in [
                ("age %s" % v["age"]) if v.get("age") else "",
                v.get("gender") or ""] if x)
            bits.append(bit + (" (%s)" % extra if extra else ""))
        else:
            bits.append(str(v))
    return bits


def victim_line(c):
    bits = victim_descriptors(c)
    return "; ".join(bits) if bits else "Not stated"


# Hosts whose pages are news reporting (R89 Newsroom). Every other source
# URL in this dataset is a judgment text or court-mirror page and cites as
# Court Record — {Court} (via {host}) per R62.
NEWSROOM_HOSTS = {
    "timesofindia.indiatimes.com": "The Times of India",
    "indianexpress.com": "The Indian Express",
    "thehindu.com": "The Hindu",
    "hindustantimes.com": "Hindustan Times",
    "ndtv.com": "NDTV",
    "indiatoday.in": "India Today",
    "theprint.in": "ThePrint",
    "scroll.in": "Scroll",
    "thewire.in": "The Wire",
    "news18.com": "News18",
    "firstpost.com": "Firstpost",
    "dnaindia.com": "DNA",
    "deccanherald.com": "Deccan Herald",
    "telegraphindia.com": "The Telegraph",
    "tribuneindia.com": "The Tribune",
    "eisamay.com": "Ei Samay",
    "dtnext.in": "DT Next",
    "theleaflet.in": "The Leaflet",
    "barandbench.com": "Bar and Bench",
    "livelaw.in": "LiveLaw",
}


def outlet_name(host):
    h = re.sub(r"^www\.", "", (host or "").lower())
    if h in NEWSROOM_HOSTS:
        return NEWSROOM_HOSTS[h]
    return " ".join(w.capitalize() for w in re.split(r"[.-]", h) if w)


def link_checked_lookup(c):
    out = {}
    for e in (c.get("link_checked_per_url") or []):
        if isinstance(e, dict) and e.get("url") and e.get("url") not in out:
            out[e["url"]] = e.get("link_checked")
    return out


def source_list_html(c):
    # R61/R62: kind line + hyperlinked outlet/court name + Link checked
    # date. Raw URLs never display. Secondary court-mirrors cite as Court
    # Record. Link-checked dates render ONLY from recorded values — never
    # auto-filled (R63,R65).
    items = []
    seen = set()
    checked = link_checked_lookup(c)
    court = c.get("court") or "Court not stated"

    def add(url):
        u = (url or "").strip()
        if not u or u in seen:
            return
        seen.add(u)
        if not u.startswith("http"):
            items.append('<li><div class="source-kind">Note</div>'
                         "<strong>%s</strong></li>" % esc(u))
            return
        host = re.sub(r"^https?://(www\.)?", "", u).split("/")[0]
        bare = re.sub(r"^www\.", "", host.lower())
        lc = checked.get(u)
        lc_txt = ("Link checked %s" % fmt_date_short(lc)) if lc else \
            "Link checked \u2014 not yet recorded"
        if bare in NEWSROOM_HOSTS and "doc/" not in u and "judg" not in u:
            items.append('<li><div class="source-kind">Newsroom</div>'
                         '<strong><a href="%s" rel="noopener">%s</a></strong>'
                         "<span>%s</span></li>"
                         % (esc(u), esc(outlet_name(host)), esc(lc_txt)))
        else:
            items.append('<li><div class="source-kind">Court Record</div>'
                         '<strong><a href="%s" rel="noopener">%s '
                         "(via %s)</a></strong>"
                         "<span>%s</span></li>"
                         % (esc(u), esc(court), esc(host), esc(lc_txt)))

    add(c.get("primary_source_url"))
    for u in (c.get("secondary_sources") or []):
        add(u)
    if not items:
        items.append("<li><strong>No sources recorded.</strong></li>")
    html_out = "<ol>%s</ol>" % "".join(items)
    sa = c.get("source_assessment") or {}
    if not isinstance(sa, dict) or sa.get("established") is None:
        html_out += ('<p class="source-assessment">Source assessment: '
                     "pending editorial review. Whether each cited outlet "
                     "is established and each link safe to cite remains an "
                     "editorial decision, not an automated finding.</p>")
    return html_out


def truncate_quote(q, n=40):
    words = (q or "").split()
    if len(words) <= n:
        return " ".join(words)
    return " ".join(words[:n]) + " \u2026"


def allegation_items_html(c):
    allegs = [a for a in (c.get("allegations") or []) if isinstance(a, dict)]
    bits = []
    for a in allegs:
        tag = ('<span class="mini-tag">Primary</span>'
               if a.get("primary") else "")
        pos = a.get("position") or "Reported allegation"
        if a.get("position_explainer"):
            expl = a["position_explainer"]
        elif pos == "Reported allegation":
            expl = ("A source makes or records this allegation; %s "
                    "has not independently established it." % SHORT_NAME)
        else:
            expl = ("Reliable material supports a specifically documented "
                    "fact relevant to that allegation.")
        rel = a.get("official_finding_relation")
        rel_html = ("<p>Official finding: %s.</p>" % esc(rel)) if rel else ""
        bits.append(
            '<div class="incident-assessment"><div><strong>%s</strong>%s</div>'
            '<div class="assessment-state">%s</div><p>%s</p>%s</div>'
            % (esc(a.get("category") or "Other"), tag, esc(pos),
               esc(expl), rel_html))
    if not bits:
        bits.append(
            '<div class="incident-assessment"><div><strong>%s</strong>'
            '<span class="mini-tag">Primary</span></div>'
            '<div class="assessment-state">Reported allegation</div>'
            "<p>A source makes or records this allegation; %s has "
            "not independently established it.</p></div>"
            % (esc(site_category(c)), esc(SHORT_NAME)))
        return "".join(bits), 1
    return "".join(bits), len(allegs)


def action_cards_html(c):
    cards = []
    for a in actions(c):
        d = a.get("date")
        date_txt = fmt_date_short(d) if d else "Date not established"
        status = a.get("status") or "Concluded"
        cls = {"Pending": "pending", "Initiated": "initiated"}.get(
            status, "concluded")
        disp = (a.get("disposition") or "").strip()
        if status == "Concluded" and disp:
            # A pending action has no disposition (R67).
            if "\u00b7" in disp:
                head, rest = disp.split("\u00b7", 1)
                disp_html = ('<div class="action-dispositions"><span>'
                             "<strong>%s</strong> \u00b7 %s.</span></div>"
                             % (esc(head.strip()),
                                esc(rest.strip().rstrip("."))))
            else:
                disp_html = ('<div class="action-dispositions"><span>'
                             "<strong>%s</strong>.</span></div>"
                             % esc(disp.rstrip(".")))
        else:
            disp_html = ""
        recheck = (a.get("recheck") or "Not yet re-checked.").strip()
        rcls = "unchecked" if "not yet" in recheck.lower() else "checked"
        cards.append(
            '<article class="action-card"><div class="action-date">%s</div>'
            '<div class="action-card-head"><h3>%s</h3>'
            '<span class="action-state %s">%s</span></div>'
            '<div class="action-authority">%s <span>%s \u00b7 %s</span></div>'
            "<p>%s</p>%s"
            '<div class="action-source">Source: %s</div>'
            '<div class="action-followup %s"><strong>%s</strong></div>'
            "</article>"
            % (esc(date_txt),
               esc(a.get("action_type") or "Order issued"),
               cls, esc(status),
               esc(a.get("authority") or "Authority not stated"),
               esc(a.get("independence") or "Unknown"),
               esc(a.get("legal_effect") or "Unknown"),
               esc(a.get("description") or ""), disp_html,
               source_label_html(a.get("source")),
               rcls, esc(recheck)))
    return "".join(cards)


def source_label_html(src):
    """A source cell: a URL shows as a link named after its outlet (raw URLs
    can carry party names, e.g. order.law download names), text as text."""
    s = (src or "").strip()
    if re.match(r"https?://", s):
        return '<a href="%s" rel="nofollow noopener">%s</a>' % (
            esc(s), esc(outlet_name(_host(s))))
    return esc(s or "judgment text (see public sources)")


def followup_block_html(c):
    hist = [h for h in (c.get("followup_history") or [])
            if isinstance(h, dict)]
    if not hist:
        block = ('<div class="followup-empty"><strong>Not yet re-checked.'
                 "</strong><p>No published follow-up check has been "
                 "recorded for this incident.</p></div>")
    else:
        items = []
        for h in hist:
            when = h.get("date") or "Date not stated"
            finding = (h.get("finding_sentence") or h.get("finding") or "")
            scope = h.get("scope") or h.get("period") or ""
            method = h.get("method") or ""
            by = " / ".join(x for x in [h.get("author"),
                                        h.get("approver")] if x)
            extra = "; ".join(x for x in [scope, method, by] if x)
            items.append("<div><strong>%s</strong><p>%s%s</p></div>"
                         % (esc(fmt_date_short(when)
                                if re.match(r"\d{4}-\d{2}-\d{2}",
                                            str(when)) else when),
                            esc(finding),
                            " (%s)" % esc(extra) if extra else ""))
        block = '<div class="incident-simple-list">%s</div>' % "".join(items)
    corr = c.get("corrections") or []
    if corr:
        rows = "".join("<li><strong>%s</strong> \u2014 %s</li>"
                       % (esc(x.get("date") or "Date not stated"),
                          esc(x.get("change") or x.get("note") or ""))
                       for x in corr if isinstance(x, dict))
        corr_html = ("<p>Corrections (%d):</p><ul>%s</ul>"
                     % (len(corr), rows))
    else:
        corr_html = "<p>Corrections (0): No corrections recorded.</p>"
    revs = c.get("reviews") or []
    if revs:
        rows = []
        for r in revs:
            if not isinstance(r, dict):
                continue
            who = " / ".join(x for x in [
                r.get("verification_by"), r.get("legal_by"),
                r.get("combined_by")] if x)
            rows.append("%s%s%s" % (
                r.get("policy") or "Review",
                " \u2014 %s" % who if who else "",
                " (%s)" % r.get("date") if r.get("date") else ""))
        rev_html = "<p>Review: %s.</p>" % esc("; ".join(rows))
    else:
        rev_html = ("<p>Review: Solo Staff combined review (one combined "
                    "attestation) \u2014 not yet recorded.</p>")
    return block + corr_html + rev_html, len(hist)


# ---- Report card (police records only; shown on the opened record page) ----
# A structured, formally worded card: reference, officers, provisions, the
# court's finding, disposition, present status and sources. Every field
# comes from the gated public record (officers via officer_display only);
# nothing here adds a finding of its own.
_ACTS = [  # (pattern at the start of a provision, statute name, unit)
    (r"(?:PC Act|Prevention of Corruption Act)(?:,?\s*(?P<y>1947|1988))?",
     "Prevention of Corruption Act", "Section"),
    (r"IPC|I\.P\.C\.?", "Indian Penal Code, 1860", "Section"),
    (r"CrPC|Cr\.P\.C\.?", "Code of Criminal Procedure, 1973", "Section"),
    (r"BNSS", "Bharatiya Nagarik Suraksha Sanhita, 2023", "Section"),
    (r"BNS", "Bharatiya Nyaya Sanhita, 2023", "Section"),
    (r"BSA", "Bharatiya Sakshya Adhiniyam, 2023", "Section"),
    (r"(?:Constitution(?: of India)?(?:\s+Art(?:icle)?\.?)?|Article|Art\.?)",
     "Constitution of India", "Article"),
    (r"NDPS Act(?:,?\s*1985)?",
     "Narcotic Drugs and Psychotropic Substances Act, 1985", "Section"),
    (r"SC/ST (?:\(PoA\) )?Act(?:,?\s*1989)?",
     "Scheduled Castes and the Scheduled Tribes (Prevention of Atrocities) "
     "Act, 1989", "Section"),
    (r"POCSO(?: Act)?(?:,?\s*2012)?",
     "Protection of Children from Sexual Offences Act, 2012", "Section"),
    (r"Arms Act(?:,?\s*1959)?", "Arms Act, 1959", "Section"),
    (r"RPC", "Ranbir Penal Code", "Section"),
    (r"MV Act(?:,?\s*1988)?", "Motor Vehicles Act, 1988", "Section"),
    (r"Evidence Act(?:,?\s*1872)?", "Indian Evidence Act, 1872", "Section"),
    (r"CPC|C\.P\.C\.?", "Code of Civil Procedure, 1908", "Section"),
    (r"UAPA(?:,?\s*1967)?", "Unlawful Activities (Prevention) Act, 1967",
     "Section"),
    (r"POTA(?:,?\s*2002)?", "Prevention of Terrorism Act, 2002", "Section"),
    (r"NSA(?:,?\s*1980)?", "National Security Act, 1980", "Section"),
    (r"COTPA(?:,?\s*2003)?",
     "Cigarettes and Other Tobacco Products Act, 2003", "Section"),
    (r"J&K PSA(?:,?\s*1978)?", "Jammu and Kashmir Public Safety Act, 1978",
     "Section"),
]
_UNIT_RX = re.compile(r"^(?:(?P<rule>Rules?\b|r\.)|(?P<art>Art(?:icle)?\.?)|"
                      r"(?:ss?\.|Sections?\b|Sec\.))\s*", re.I)
_GENERIC_ACT_RX = re.compile(
    r"^(?P<name>[A-Z][\w&().,/'\- ]*?(?:Act|Rules|Regulations|Code|Manual|"
    r"Order|Sanhita|Adhiniyam))(?:,?\s*(?P<y>1[89]\d\d|20\d\d))?\b\.?\s*(?P<rest>.*)$")
_JOIN_RX = re.compile(r"\s+(r/w|read with|punishable under|punishable u/s)\s+",
                      re.I)


def _unit_num(rest, unit):
    rest = rest.strip().strip(",").strip()
    m = _UNIT_RX.match(rest)
    if m:
        unit = "Rule" if m.group("rule") else (
            "Article" if m.group("art") else "Section")
        rest = rest[m.end():]
    return ("%s %s" % (unit, rest.strip())) if rest.strip() else None


def _provision_part(p, prev_act):
    """One provision -> (\"Section 7\" or None, statute) or None."""
    for rx, name, unit in _ACTS:
        m = re.match(r"^(?:%s)(?![A-Za-z])\.?\s*(?P<rest>.*)$" % rx, p, re.I)
        if m:
            y = m.groupdict().get("y")
            act = name + (", " + y if y else "") if "," not in name else name
            return _unit_num(m.group("rest"), unit), act
    m = _GENERIC_ACT_RX.match(p)
    if m:
        act = m.group("name").strip() + (", " + m.group("y")
                                         if m.group("y") else "")
        name = m.group("name").strip()
        unit = ("Rule" if name.endswith("Rules") else "Regulation"
                if name.endswith("Regulations") else "Section")
        return _unit_num(m.group("rest"), unit), act
    if prev_act and re.match(r"^(?:ss?\.|Sections?|Sec\.|Art\.?|Article|"
                             r"Rules?|r\.)?\s*\d", p, re.I):
        return _unit_num(p, "Section"), prev_act
    return None


_SUFFIX_RX = re.compile(
    r"^(?:(?:Sections?|Sec\.?|ss?\.|u/s)\s*)?(?P<nums>\d[\w()/\-.]*"
    r"(?:\s*\([IVXivx]+\))?(?:\s+Part\s+[IVX]+)?"
    r"(?:\s+(?:r/w|read with)\s+\d[\w()/\-.]*)*)\s*,?\s+"
    r"(?:of\s+(?:the\s+)?)?(?P<act>[A-Za-z][^()]*?)\s*(?P<note>\([^)]*\))?$")


def legal_provision(s):
    """'PC Act 1988 s.13(1)(d) r/w s.13(2)' -> 'Section 13(1)(d) read with
    Section 13(2) of the Prevention of Corruption Act, 1988'. Anything it
    cannot parse is shown exactly as recorded."""
    s = re.sub(r"\s+", " ", (s or "").strip().rstrip(".,;"))
    if not s:
        return ""
    out = _legal_provision(s)
    if out is None:
        m = _SUFFIX_RX.match(s)
        if m:
            out = _legal_provision("%s %s" % (m.group("act"), m.group("nums")))
            if out and m.group("note"):
                out += " " + m.group("note")
    return out or s


def _legal_provision(s):
    bits = _JOIN_RX.split(s)
    parts = [("", bits[0])] + [
        ("read with" if bits[i].lower() == "r/w" else
         "punishable under" if bits[i].lower().startswith("punishable")
         else bits[i].lower(), bits[i + 1]) for i in range(1, len(bits) - 1, 2)]
    parsed, act = [], None
    for sep, p in parts:
        r = _provision_part(p.strip(), act)
        if r is None:
            return None
        parsed.append((sep, r[0], r[1]))
        act = r[1]
    out, i = "", 0
    while i < len(parsed):
        sep0, a = parsed[i][0], parsed[i][2]
        seg = ""
        while i < len(parsed) and parsed[i][2] == a:
            sep, num = parsed[i][0], parsed[i][1]
            if num:
                seg += (" %s " % sep if seg else "") + num
            i += 1
        seg = (seg + " of the " + a) if seg else ("the " + a)
        out += (", %s %s" % (sep0, seg)) if out else seg
    return out


def legal_provisions(c):
    seen, out = set(), []
    for s in c.get("sections") or []:
        t = legal_provision(s)
        if t and t.lower() not in seen:
            seen.add(t.lower())
            out.append(t)
    return out


_SERVICE_STATUS = [  # explicit wording only; "dismissed" alone often means a petition
    (r"\bdismissed from (?:the )?(?:police )?service\b|"
     r"\bdismissal from (?:the )?service\b", "dismissed from service"),
    (r"\bremoved from (?:the )?service\b|\bremoval from (?:the )?service\b",
     "removed from service"),
    (r"\bcompulsor(?:y|ily) retire", "compulsorily retired"),
    (r"\breinstate(?:d|ment) (?:in|into) (?:the )?service\b", "reinstated in service"),
]


def officer_present_status(c):
    blob = " ".join(str(x or "") for x in [
        c.get("summary"), c.get("verification_note"), c.get("display_title")]
        + [a.get("description") for a in (c.get("institutional_response")
                                          or []) if isinstance(a, dict)])
    hits = [label for rx, label in _SERVICE_STATUS if re.search(rx, blob, re.I)]
    if len(hits) == 1:
        return "Recorded in the cited sources as %s." % hits[0]
    if hits:
        return ("The cited sources refer to the officer being %s; the present "
                "position is not ascertained." % " and ".join(hits))
    return "Not ascertained from the cited sources."


_LATER_OUTCOME = {"conviction_set_aside": "conviction set aside",
                  "pending_appeal": "appeal pending",
                  "acquitted_on_appeal": "acquitted on appeal",
                  "upheld": "upheld", "dismissed": "appeal dismissed",
                  "pending": "appeal pending", "allowed": "appeal allowed"}


def _coram(c):
    js = [re.sub(r"^(?:Hon'?ble\s+)?(?:(?:Mr|Mrs|Ms|Dr)\.?\s+)?(?:Justice\s+)?",
                 "", j.strip(), flags=re.I) for j in (c.get("judges") or []) if j]
    js = [j for j in js if j]
    if not js:
        return ""
    return ", ".join(js) + (", J." if len(js) == 1 else ", JJ.")


def _accused_phrase(offs, c):
    if len(offs) == 1:
        return "the " + offs[0]
    if offs:
        return "%d police personnel, namely: %s" % (len(offs), "; ".join(offs))
    return sw(c, "accused")


def report_card_data(c, kind):
    """kind 'hc' (court-adjudicated incident) or 'trial' (trial-court
    conviction). Returns (operative sentence, [(label, text)], [(label, url)])
    or None for records that are not police records."""
    if (c.get("service") or "police") != "police":
        return None
    offs = [o for o in (officer_display(o, c) for o in (c.get("officers") or []))
            if o]
    who = _accused_phrase(offs, c)
    rows, links = [], []
    if kind == "trial":
        court = (c.get("trial_court_name") or "the trial court").strip()
        court = court if court.lower().startswith("the ") else "the " + court
        cdate = (c.get("conviction_date") or "").strip()
        if re.match(r"^\d{4}-\d\d-\d\d$", cdate):
            when = " dated %s" % fmt_date(cdate)
        elif re.match(r"^\d{4}(-\d\d)?$", cdate):
            when = " in %s" % t2_date_display(c)
        elif cdate:
            when = " of %s" % cdate
        else:
            note = (c.get("conviction_date_note") or "").strip()
            when = " (date not stated in the sources%s)" % ("; " + note if note else "")
        operative = "By judgment%s, %s convicted %s." % (when, court, who)
        ref = c.get("case_number") or c.get("case_title_or_number")
        src_court = c.get("court")
        rows.append(("Case reference", "; ".join(x for x in [
            ref, "reported in the judgment of the %s" % src_court
            if src_court and src_court.lower() not in court.lower() else ""]
            if x) or "Not stated"))
        rows.append(("Court and date", "%s%s" % (
            court[0].upper() + court[1:], ", %s" % (fmt_date(cdate) if re.match(
                r"^\d{4}-\d\d-\d\d$", cdate) else cdate) if cdate else "")))
        disposition = "Conviction recorded by the trial court. Sentence: %s" % (
            (c.get("sentence") or "not stated in the cited sources").rstrip("."))
        ap = c.get("appeal_status") or "unknown"
        status = {
            "upheld": "The conviction was affirmed in appeal.",
            "set_aside": "The conviction was set aside in appeal; the "
                         "acquittal on appeal is the present position.",
            "pending": "An appeal is pending; the pendency of an appeal is "
                       "not a finding.",
            "none_known": "No appeal is known from the cited sources.",
        }.get(ap, "Whether the conviction was appealed is not known from "
                  "the cited sources.")
        if c.get("appeal_url"):
            links.append(("Appellate judgment", c["appeal_url"]))
        path = "/trial-court/%s" % t2_id(c)
        rid = t2_id(c)
    else:
        jdate = fmt_date(c.get("judgment_date"), c.get("date_precision"))
        court = c.get("court") or "the Court"
        coram = _coram(c)
        verb = {
            "conviction_upheld": "affirmed the conviction of",
            "conviction_by_hc": "recorded the conviction of",
            "conviction_by_sc": "recorded the conviction of",
            "disciplinary_upheld": "upheld the disciplinary action taken "
                                   "against",
            "adverse_finding_compensation": "returned findings adverse to",
        }.get(c.get("outcome_type"), "adjudicated the matter concerning")
        comp = c.get("compensation_inr")
        operative = "By judgment dated %s%s, the %s%s %s %s%s." % (
            jdate, " in %s" % c["case_number"] if c.get("case_number") else "",
            court, " (Coram: %s)" % coram if coram else "", verb, who,
            ", and directed payment of compensation of %s" % fmt_inr(comp)
            if comp else "")
        rows.append(("Case reference", " / ".join(x for x in [
            c.get("case_number"), c.get("citation")] if x) or "Not stated"))
        rows.append(("Court and date", "%s%s, %s" % (
            court, " (Coram: %s)" % coram if coram else "", jdate)))
        sent = []
        if c.get("sentence_type"):
            sent.append({"imprisonment": "imprisonment",
                         "mixed": "imprisonment and fine", "fine": "fine"}.get(
                c["sentence_type"], pretty_label(c["sentence_type"]).lower()))
        if c.get("sentence_max_years") is not None:
            sent.append("maximum substantive term of %s year%s" % (
                c["sentence_max_years"],
                "" if str(c["sentence_max_years"]) == "1" else "s"))
        disposition = "%s.%s%s" % (
            OUTCOME_LABEL.get(outcome_code(c),
                              pretty_label(outcome_code(c)) or
                              "Outcome not stated"),
            " Sentence: %s." % "; ".join(sent) if sent else "",
            " Compensation: %s." % fmt_inr(comp) if comp else "")
        later = []
        for lp in c.get("later_proceedings") or []:
            if not isinstance(lp, dict):
                continue
            later.append("%s%s: %s." % (
                lp.get("court") or "Appellate court",
                ", " + fmt_date(lp["date"]) if lp.get("date") else "",
                _LATER_OUTCOME.get(lp.get("outcome"),
                                   pretty_label(lp.get("outcome")).lower()
                                   or "outcome not recorded")))
            if lp.get("url"):
                links.append(("%s order" % (lp.get("court") or "Appellate"),
                              lp["url"]))
        acts = [a.get("action_type") for a in (c.get("institutional_response")
                                               or []) if isinstance(a, dict)]
        for a in ("Acquitted on appeal", "Order set aside", "Appeal pending"):
            if a in acts and not later:
                later.append("Recorded in the cited sources: %s." % a.lower())
        if later:
            status = " ".join(later)
        elif appeal_caveat(c):
            status = ("The judgment is recent and may be subject to appeal; "
                      "the pendency of an appeal is not a finding.")
        else:
            status = ("No further proceedings are recorded in the cited "
                      "sources; the judgment is the concluded position shown.")
        rid = rec_id(c)
        path = "/incident/%s" % rid
    station = c.get("police_station_or_unit") or ""
    rows.append(("Officer(s) at the material time", "; ".join(offs) if offs
                 else "Not identified in the cited sources" + (
                     " (%s)" % station if station else "")))
    rows.append(("Present service status", officer_present_status(c)))
    provs = legal_provisions(c)
    rows.append(("Provisions invoked", "; ".join(provs) if provs
                 else "Not stated in the cited sources"))
    quote = truncate_quote((c.get("court_quote") or "").strip())
    if quote:
        para = c.get("court_quote_para")
        rows.append(("Finding of the Court (extract)", "“%s”%s" % (
            quote, " (at para %s)" % para if para else "")))
    else:
        rows.append(("Facts in brief", c.get("summary") or
                     "Not recorded."))
    rows.append(("Verdict, sentence and quantum", disposition))
    rows.append(("Present status of the proceedings", status))
    if c.get("primary_source_url"):
        links.insert(0, ("Judgment / order (primary source)",
                         c["primary_source_url"]))
    links.append(("Permanent link to this record", SITE_URL + path))
    plate = PLATES.get(rid) or PLATES.get(c.get("merged_id") or "")
    if plate:
        rows.insert(0, ("Register number", plate))
    return operative, rows, links


def report_card_html(c, kind):
    d = report_card_data(c, kind)
    if not d:
        return ""
    operative, rows, links = d
    items = "".join('<div><dt>%s</dt><dd>%s</dd></div>' % (esc(k), esc(v))
                    for k, v in rows)
    src = "".join('<li><a href="%s" rel="nofollow noopener">%s</a></li>'
                  % (esc(u), esc(k)) for k, u in links)
    return ("""
        <section class="incident-section report-card" id="report-card">
          <div class="incident-section-head"><div><div class="incident-section-label">Detailed record</div><h2>Report card</h2></div></div>
          <p class="rc-operative">%s</p>
          <dl class="rc-grid">%s<div><dt>Source orders</dt><dd><ul class="rc-links">%s</ul></dd></div></dl>
          <p class="rc-note">Compiled from the judgment and the cited sources. Findings are those of the court; this card adds none of its own.</p>
        </section>""" % (esc(operative), items, src))


def report_card_md(c, kind):
    d = report_card_data(c, kind)
    if not d:
        return []
    operative, rows, links = d
    return (["## Report card", "", md_esc(operative), ""]
            + ["- %s: %s" % (md_esc(k), md_esc(v)) for k, v in rows]
            + ["- Source orders: " + "; ".join(md_link(k, u) for k, u in links),
               ""])


def build_incident(c):
    rid = rec_id(c)
    mid = c["merged_id"]
    path = "/incident/%s" % rid
    # H1/title/index always use the redacted display title (R46); the
    # record arrives pre-scrubbed from redact_record().
    title = c.get("display_title") or c.get("case_title") or rid
    loc = location_short(c)
    jdate = fmt_date(c.get("judgment_date"), c.get("date_precision"))
    idate = fmt_date(c.get("incident_date"))
    cat = site_category(c)
    sub = (c.get("subcategory_display")
           or pretty_label(c.get("subcategory")).lower()
           or "Not stated")
    out = OUTCOME_LABEL.get(outcome_code(c),
                            pretty_label(outcome_code(c)) or "Not stated")
    case_ref = " / ".join(x for x in [c.get("case_number"), c.get("citation")]
                          if x) or "Not stated"
    officers = officer_lines(c)
    off_txt = "; ".join(officers) if officers else "None named"
    vic_txt = victim_line(c)
    sent_txt = sentence_compact(c)
    station = c.get("police_station_or_unit") or ""

    quote = truncate_quote((c.get("court_quote") or "").strip())
    para = c.get("court_quote_para")
    if quote:
        quote_html = ('<blockquote class="court-quote">\u201c%s\u201d%s'
                      "</blockquote>"
                      % (esc(quote),
                         " <cite>(para %s)</cite>" % esc(str(para))
                         if para else ""))
    else:
        quote_html = "<p>No verbatim extract recorded.</p>"
    holding = (c.get("verification_note") or "").strip()

    if appeal_caveat(c):
        current = ("Judgment dated %s. This judgment may still be subject "
                   "to appeal; initiation or pendency of an appeal is not "
                   "a finding." % jdate)
    else:
        current = ("The %s judgment dated %s is the concluded position "
                   "shown in the cited sources."
                   % (c.get("court") or "court", jdate))

    nsrc = source_count(c)
    desc = ("Court-adjudicated %s: %s \u2014 %s, "
            "judgment %s." % (sw(c, "case"), title, c.get("court") or "court",
                              jdate))[:300]
    summary = c.get("summary") or "Summary not recorded."
    alleg_html, nalleg = allegation_items_html(c)
    cards_html = action_cards_html(c)
    nactions = len(actions(c))
    follow_html, nfollow = followup_block_html(c)
    lc = c.get("last_checked")
    lc_txt = fmt_date(lc) if lc else "Never re-checked"
    if is_retracted(c):
        r = c.get("retracted") if isinstance(c.get("retracted"), dict) else {}
        tombstone = (
            '<div class="incident-retracted"><strong>This record has been '
            "retracted.</strong><p>%s</p></div>"
            % esc(r.get("reason") or "It is retained here as a tombstone "
                  "so the withdrawal stays visible."))
    else:
        tombstone = ""

    station_html = ('<div><dt>Station or unit</dt><dd>%s</dd></div>'
                    % esc(station)) if station else ""
    main = """
  <div class="wrap">
    <nav class="incident-breadcrumb" aria-label="Breadcrumb"><a href="/tracker">Incident tracker</a><span aria-hidden="true">/</span><span>%s</span></nav>
    %s
    <header class="incident-hero">
      <div class="incident-hero-copy">
        <div class="incident-overline"><span>%s</span><span>%s</span><span>Judgment %s</span></div>
        <h1>%s</h1>
        <p class="incident-summary">%s</p>
      </div>
      <div class="incident-hero-badges"><span class="record-badge %s">%s</span><span class="record-badge level">%s</span></div>
    </header>

    <div class="incident-reading-note"><strong>What this record means</strong><p>This page documents a court-adjudicated case from the judgment and cited sources below. Findings are attributed to the court; this record does not add findings of its own.</p><a href="/methodology">How verification works &rarr;</a></div>

    <div class="incident-layout">
      <div class="incident-main">%s
        <section class="incident-section incident-current"><div class="incident-section-label">Current position</div><p>%s</p></section>

        <section class="incident-section" id="allegations">
          <div class="incident-section-head"><div><div class="incident-section-label">Evidence position</div><h2>Recorded allegations</h2></div><span>%d</span></div>
          <div class="incident-assessment-list">
            %s
          </div>
        </section>

        <section class="incident-section" id="court-findings">
          <div class="incident-section-head"><div><div class="incident-section-label">Attributed to the court</div><h2>What the court found</h2></div></div>
          <div class="incident-simple-list"><div><p>%s</p></div></div>
          %s
        </section>

        <section class="incident-section" id="institutional-response">
          <div class="incident-section-head"><div><div class="incident-section-label">Separate from verification</div><h2>Institutional response</h2></div><span>%d</span></div>
          <div class="action-timeline">
            %s
          </div>
        </section>

        <section class="incident-section" id="follow-up">
          <div class="incident-section-head"><div><div class="incident-section-label">Continuing record</div><h2>Follow-up history</h2></div><span>%d</span></div>
          %s
        </section>
      </div>

      <aside class="incident-sidebar" aria-label="Record details and sources">
        <section class="incident-facts"><h2>At a glance</h2><dl><div><dt>Primary category</dt><dd>%s</dd></div><div><dt>Location</dt><dd>%s</dd></div><div><dt>Incident date</dt><dd>%s</dd></div>%s<div><dt>Court</dt><dd>%s</dd></div><div><dt>Case title</dt><dd>%s</dd></div><div><dt>Case number/citation</dt><dd>%s</dd></div><div><dt>Date of judgment</dt><dd>%s</dd></div><div><dt>Sub-category</dt><dd>%s</dd></div><div><dt>Outcome type</dt><dd>%s</dd></div><div><dt>Officers</dt><dd>%s</dd></div><div><dt>Victim(s)</dt><dd>%s</dd></div><div><dt>Sentence/compensation</dt><dd>%s</dd></div><div><dt>Verification</dt><dd>%s</dd></div><div><dt>Published</dt><dd>%s</dd></div><div><dt>Last checked</dt><dd>%s</dd></div></dl></section>
        <section class="incident-sources" id="sources"><div class="incident-section-head"><div><div class="incident-section-label">Citations</div><h2>Public sources</h2></div><span>%d</span></div>
          %s
        </section>
        <a class="incident-back" href="/tracker">&larr; Back to all records</a>
      </aside>
    </div>
  </div>
""" % (
        esc(rid), tombstone, esc(rid), esc(loc), esc(jdate),
        esc(title), esc(summary),
        tier_badge_class(c), esc(tier_label(c)), esc(v_level(c)),
        report_card_html(c, "hc"),
        esc(current),
        nalleg, alleg_html,
        esc(holding or "Holding not recorded separately."),
        quote_html,
        nactions, cards_html,
        nfollow, follow_html,
        esc(cat), esc(loc), esc(idate), station_html,
        esc(c.get("court") or "Not stated"),
        esc(c.get("case_title") or title), esc(case_ref),
        esc(jdate), esc(sub), esc(out),
        esc(off_txt), esc(vic_txt), esc(sent_txt),
        esc(verification_line(c)), esc(fmt_date(BUILD_DATE)), esc(lc_txt),
        nsrc, source_list_html(c))
    ld_graph = [
        org_ld_node(),
        {"@type": "WebSite", "@id": SITE_URL + "/#website",
         "url": SITE_URL, "name": SITE_NAME,
         "description": T["website_description"],
         "publisher": {"@id": SITE_URL + "/#organization"},
         "inLanguage": "en-IN"},
        {"@type": "WebPage", "@id": SITE_URL + path + "#webpage",
         "url": SITE_URL + path, "name": title + " | " + SITE_NAME,
         "description": summary[:300],
         "isPartOf": {"@id": SITE_URL + "/#website"},
         "about": {"@id": SITE_URL + "/#organization"}, "inLanguage": "en-IN"},
        {"@type": "Article", "@id": SITE_URL + path + "#article",
         "mainEntityOfPage": {"@id": SITE_URL + path + "#webpage"},
         "headline": title, "description": summary[:300],
         "publisher": {"@id": SITE_URL + "/#organization"},
         "inLanguage": "en-IN",
         "datePublished": c.get("judgment_date"),
         "dateModified": c.get("judgment_date")},
    ]
    return main, desc, ld_graph


def bars_html(items, total, alt=False):
    rows = []
    for label, n in items:
        pct = (100.0 * n / total) if total else 0
        cls = "fill alt" if alt else "fill"
        rows.append('<div class="bar"><div class="top"><span>%s</span>'
                    '<span class="n">%d record%s</span></div>'
                    '<div class="track"><div class="%s" style="width:%d%%">'
                    "</div></div></div>"
                    % (esc(label), n, "" if n == 1 else "s", cls,
                       max(1, round(pct)) if n else 0))
    return '<div class="bars">%s</div>' % "".join(rows)


def bars_expandable_html(items, total, submap, level_qs=""):
    """Category bars that expand (click) to a sub-category breakdown.
    Every category and sub-category row links to the tracker pre-filtered
    (?category= / ?subcategory=, plus the court's level when needed)."""
    rows = []
    for label, n in items:
        pct = (100.0 * n / total) if total else 0
        curl = "/tracker?category=%s%s" % (urlquote(label), level_qs)
        subs = [(s, m) for s, m in submap.get(label, []) if s]
        head = ('<div class="bar"><div class="top bar-rowline">'
                "<span>%s</span>"
                '<span class="n">%d record%s &middot; '
                '<a class="bar-link" href="%s">view in tracker</a></span>'
                "</div>"
                '<div class="track"><div class="fill" style="width:%d%%">'
                "</div></div></div>"
                % (esc(label), n, "" if n == 1 else "s", esc(curl),
                   max(1, round(pct)) if n else 0))
        if not subs:
            rows.append(head)
            continue
        subrows = []
        for sub, m in sorted(subs, key=lambda kv: (-kv[1], kv[0])):
            spct = (100.0 * m / n) if n else 0
            surl = "/tracker?category=%s&subcategory=%s%s" % (
                urlquote(label), urlquote(sub), level_qs)
            subrows.append(
                '<div class="bar"><div class="top bar-rowline">'
                "<span>%s</span>"
                '<span class="n">%d &middot; '
                '<a class="bar-link" href="%s">view in tracker</a></span>'
                "</div>"
                '<div class="track"><div class="fill alt" '
                'style="width:%d%%"></div></div></div>'
                % (esc(sub), m, esc(surl),
                   max(1, round(spct)) if m else 0))
        rows.append('<details class="bar-details"><summary>%s</summary>'
                    '<div class="bar-sub">%s</div></details>'
                    % (head, "".join(subrows)))
    return '<div class="bars">%s</div>' % "".join(rows)


def fmt_num(v):
    try:
        return "%d" % int(v)
    except (TypeError, ValueError):
        return "n/a"


def context_table_html(title_years, columns, note, sources):
    """One NCRB time-series table. columns: [(heading, {year: value})].
    Each column scales to its own maximum (values printed; scales differ)."""
    years = sorted(title_years)
    heads = "".join('<th class="num">%s</th>' % esc(h)
                    for h, _ in columns)
    maxima = [max([v for v in vals.values()
                   if isinstance(v, (int, float))] + [0])
              for _, vals in columns]
    body = []
    for y in years:
        cells = []
        for (h, vals), mx in zip(columns, maxima):
            v = vals.get(y)
            w = max(1, round(100.0 * v / mx)) if (v and mx) else 0
            cells.append('<td class="num">%s<div class="track">'
                         '<div class="fill" style="width:%d%%"></div>'
                         "</div></td>" % (fmt_num(v), w))
        body.append("<tr><td>%d</td>%s</tr>" % (y, "".join(cells)))
    src = "; ".join(
        '%s (<a href="%s" rel="nofollow noopener">%s</a>)'
        % (esc(label), esc(url), esc(ref))
        for label, url, ref in sources)
    return ('<table class="dtable ctx-table"><thead><tr><th>Year</th>%s</tr>'
            "</thead><tbody>%s</tbody></table>"
            '<p class="ctx-scale">%s</p><p class="ctx-scale">Sources: %s.</p>'
            % (heads, "".join(body), esc(note), src))


def context_charts_html(context):
    """'Complaints vs convictions' charts from data/context.json (NCRB
    national series). External statistics, not Copwatch records."""
    series = (context or {}).get("series") or []
    india = [x for x in series if x.get("state") == "India"]
    if not india:
        return ""

    def col(metric):
        return {x["year"]: x["value"] for x in india
                if x.get("metric") == metric
                and isinstance(x.get("year"), int)}

    def src_for(metric, label):
        rows = [x for x in india if x.get("metric") == metric]
        if not rows:
            return None
        latest = max(rows, key=lambda x: x.get("year") or 0)
        return (label, latest.get("source_url") or "",
                latest.get("source_page_or_table") or "NCRB")

    note = ("Bars within each column scale to that column's maximum — "
            "columns use different scales. Values are printed.")
    out = []
    comp = col("ncrb_complaints_received_against_police")
    conv = col("ncrb_police_personnel_convicted")
    if comp and conv:
        years = sorted(set(comp) & set(conv))
        out.append(
            '<div class="sec-head"><div class="kicker">National context'
            "</div><h2>Complaints vs convictions</h2><p>Complaints received "
            "against police personnel vs police personnel convicted, "
            "all-India (NCRB). The funnel between complaint and conviction "
            "passes through registration, investigation, charge-sheet and "
            "trial — this chart shows only its two ends.</p></div>"
            + context_table_html(
                years,
                [("Complaints received",
                  {y: comp[y] for y in years}),
                 ("Personnel convicted",
                  {y: conv[y] for y in years})],
                note,
                [s for s in
                 (src_for("ncrb_complaints_received_against_police",
                          "Complaints"),
                  src_for("ncrb_police_personnel_convicted",
                          "Convictions"))
                 if s and s[1]]))
    reg = col("ncrb_cases_registered_against_police")
    chg = col("ncrb_police_personnel_chargesheeted")
    if reg and conv:
        years = sorted(set(reg) & set(conv))
        cols = [("Cases registered", {y: reg[y] for y in years})]
        if chg:
            cy = sorted(set(reg) & set(chg) & set(conv))
            years = cy
            cols = [("Cases registered", {y: reg[y] for y in years}),
                    ("Personnel charge-sheeted",
                     {y: chg[y] for y in years}),
                    ("Personnel convicted",
                     {y: conv[y] for y in years})]
        else:
            cols.append(("Personnel convicted",
                         {y: conv[y] for y in years}))
        out.append(
            '<div class="sec-head"><div class="kicker">National context'
            "</div><h2>Cases registered vs convictions</h2><p>Cases "
            "registered against police, personnel charge-sheeted and "
            "personnel convicted, all-India (NCRB).</p></div>"
            + context_table_html(
                years, cols, note,
                [s for s in
                 (src_for("ncrb_cases_registered_against_police",
                          "Cases registered"),
                  src_for("ncrb_police_personnel_convicted",
                          "Convictions"))
                 if s and s[1]]))
    deaths = col("ncrb_custodial_deaths_total")
    cconv = col("ncrb_custodial_police_convicted")
    if deaths and cconv:
        years = sorted(set(deaths) & set(cconv))
        out.append(
            '<div class="sec-head"><div class="kicker">National context'
            "</div><h2>Custodial deaths vs custodial convictions</h2><p>"
            "Deaths in police custody vs police personnel convicted in "
            "custodial-crime cases, all-India (NCRB).</p></div>"
            + context_table_html(
                years,
                [("Custodial deaths", {y: deaths[y] for y in years}),
                 ("Custodial convictions",
                  {y: cconv[y] for y in years})],
                note,
                [s for s in
                 (src_for("ncrb_custodial_deaths_total",
                          "Custodial deaths"),
                  src_for("ncrb_custodial_police_convicted",
                          "Custodial convictions"))
                 if s and s[1]]))
    if not out:
        return ""
    return "".join(
        '<section class="section"><div class="wrap">%s</div></section>'
        % block for block in out)


def build_patterns(cases, t2cases=None, context=None, n_overturned=0):
    n = len(cases)
    t2cases = t2cases or []
    t2n = len(t2cases)
    total = n + t2n
    head = headline_sentence(n, t2n)
    by_cat = Counter(site_category(c) for c in cases)
    sub_cat = {}
    for c in cases:
        sub = ((c.get("subcategory_display") or "").strip()
               or pretty_label(c.get("subcategory")).lower())
        if sub:
            sub_cat.setdefault(site_category(c), Counter())[sub] += 1
    t2_by_cat = Counter(site_category(r) for r in t2cases)
    t2_sub_cat = {}
    for r in t2cases:
        sub = t2_subcategory(r)
        if sub:
            t2_sub_cat.setdefault(site_category(r), Counter())[sub] += 1
    by_out = Counter(c.get("outcome_type", "") for c in cases)
    by_state = Counter(c.get("state", "") for c in cases if c.get("state"))
    by_dec = Counter(
        "%ds" % (c["judgment_year"] // 10 * 10) for c in cases
        if c.get("judgment_year"))
    by_court = Counter(c.get("court", "") for c in cases if c.get("court"))
    t2_by_out = Counter(r.get("outcome_type") or "trial_court_conviction"
                        for r in t2cases)
    t2_by_state = Counter(r.get("state", "") for r in t2cases
                          if r.get("state"))
    t2_years = [y for y in (r.get("conviction_year") or t2_year(r)
                            for r in t2cases) if y]
    t2_by_dec = Counter("%ds" % (y // 10 * 10) for y in t2_years)
    t2_by_court = Counter(r.get("trial_court_name", "") for r in t2cases
                          if r.get("trial_court_name"))
    all_by_cat = by_cat + t2_by_cat
    all_sub_cat = {}
    for _cc in set(list(sub_cat) + list(t2_sub_cat)):
        _m = Counter()
        _m.update(sub_cat.get(_cc, Counter()))
        _m.update(t2_sub_cat.get(_cc, Counter()))
        all_sub_cat[_cc] = _m
    all_by_out = by_out + t2_by_out
    all_by_state = by_state + t2_by_state
    hc_years = [c.get("judgment_year") for c in cases
                if c.get("judgment_year")]
    n_states_all = len(all_by_state)
    n_v3 = sum(1 for c in cases if v_level(c) == "V3")
    n_v2 = n - n_v3
    n_pending = sum(1 for c in cases if is_pending(c))
    n_never = sum(1 for c in cases if is_never_checked(c))
    n_followed = sum(1 for c in cases if is_checked(c))
    n_stale = sum(1 for c in cases if is_stale(c))
    n_appeal = sum(1 for c in cases if appeal_caveat(c))
    # Per-proceeding follow-up counts (R77): latest check per exact action.
    proc_types = Counter(a.get("action_type") or "Order issued"
                         for c in cases for a in actions(c))
    proc_never = Counter()
    for c in cases:
        for a in actions(c):
            t = a.get("action_type") or "Order issued"
            if "not yet" in (a.get("recheck") or "Not yet re-checked.").lower():
                proc_never[t] += 1
    cat_items = [(k, by_cat.get(k, 0)) for k in SITE_CATEGORIES
                 if by_cat.get(k, 0)]
    t2_cat_items = [(k, t2_by_cat.get(k, 0)) for k in SITE_CATEGORIES
                    if t2_by_cat.get(k, 0)]
    all_cat_items = [(k, all_by_cat.get(k, 0)) for k in SITE_CATEGORIES
                     if all_by_cat.get(k, 0)]
    cat_sub = {k: sorted(v.items()) for k, v in sub_cat.items()}
    t2_cat_sub = {k: sorted(v.items()) for k, v in t2_sub_cat.items()}
    all_cat_sub = {k: sorted(v.items()) for k, v in all_sub_cat.items()}

    def _out_items(ctr):
        return sorted(
            ((OUTCOME_LABEL.get(k, pretty_label(k)), v)
             for k, v in ctr.items() if k), key=lambda kv: -kv[1])

    out_items = _out_items(by_out)
    t2_out_items = _out_items(t2_by_out)
    all_out_items = _out_items(all_by_out)
    state_items = sorted(by_state.items(), key=lambda kv: (-kv[1], kv[0]))
    t2_state_items = sorted(t2_by_state.items(),
                            key=lambda kv: (-kv[1], kv[0]))
    all_state_items = sorted(all_by_state.items(),
                             key=lambda kv: (-kv[1], kv[0]))
    dec_items = sorted(by_dec.items())
    t2_dec_items = sorted(t2_by_dec.items())
    all_dec_items = sorted(
        Counter("%ds" % (y // 10 * 10)
                for y in hc_years + t2_years).items())
    court_items = sorted(by_court.items(), key=lambda kv: (-kv[1], kv[0]))[:12]
    t2_court_items = sorted(t2_by_court.items(),
                            key=lambda kv: (-kv[1], kv[0]))[:12]
    all_court_items = sorted((by_court + t2_by_court).items(),
                             key=lambda kv: (-kv[1], kv[0]))[:12]
    proc_rows = "".join(
        "<tr><td>%s</td><td>%d</td><td>%d</td><td>%d</td><td>%d</td></tr>"
        % (esc(t), proc_types[t], proc_never.get(t, 0),
           proc_types[t] - proc_never.get(t, 0), 0)
        for t in sorted(proc_types))
    def tiered(all_html, hc_html, trial_html):
        # One chart, three pre-rendered tiers; patterns.js shows one.
        # Without JS the combined (All) variant stays visible.
        return ('<div class="pat-tier" data-ptier="all">%s</div>'
                '<div class="pat-tier" data-ptier="hc" hidden>%s</div>'
                '<div class="pat-tier" data-ptier="trial" hidden>%s</div>'
                % (all_html, hc_html, trial_html))

    toggle = """
<section class="section"><div class="wrap">
<div class="tracker-filterbar" role="group" aria-label="Court tier">
<span>Show:</span>
<button type="button" class="tracker-filter on" data-ptier-btn="all">All</button>
<button type="button" class="tracker-filter" data-ptier-btn="hc">HC-SC</button>
<button type="button" class="tracker-filter" data-ptier-btn="trial">Trial court</button>
</div>
<noscript><p class="ctx-scale">Charts show both tiers combined; enable JavaScript to use the tier toggle.</p></noscript>
</div></section>
"""
    cat_sec = tiered(
        bars_expandable_html(all_cat_items, total, all_cat_sub),
        bars_expandable_html(cat_items, n, cat_sub, "&level=hc_sc"),
        bars_expandable_html(t2_cat_items, max(1, t2n), t2_cat_sub,
                             "&level=trial"))
    out_sec = tiered(bars_html(all_out_items, total),
                     bars_html(out_items, max(1, n)),
                     bars_html(t2_out_items, max(1, t2n)))
    state_sec = tiered(bars_html(all_state_items, total),
                       bars_html(state_items, max(1, n)),
                       bars_html(t2_state_items, max(1, t2n)))
    dec_sec = tiered(bars_html(all_dec_items, total),
                     bars_html(dec_items, max(1, n)),
                     bars_html(t2_dec_items, max(1, t2n)))
    court_sec = tiered(bars_html(all_court_items, total),
                       bars_html(court_items, max(1, n)),
                       bars_html(t2_court_items, max(1, t2n)))
    all_years = hc_years + t2_years
    span = ("%d\u2013%d" % (min(all_years), max(all_years)) if all_years
            else "unknown span")
    main = """
<section class="pagehead"><div class="wrap"><div class="eyebrow">What the record shows</div><h1>Patterns dashboard</h1><p class="sub">Anonymised aggregates drawn from %s. Verification and institutional action are reported separately. Use the tier toggle to split High Court / Supreme Court judgments from trial-court convictions.</p></div></section>
<section class="section"><div class="wrap">
<div class="callout"><div class="lab">Live dataset</div><p>The public dataset currently contains <strong>%s</strong> from <strong>%d states and union territories</strong>. %s Counts show recorded allegations regardless of their individual evidence position; they are not counts of proven misconduct. These records are not a representative sample, and they do not claim to estimate the prevalence of misconduct across India. This collection covers only judgments with adverse findings against public servants; acquittals and exonerations on the same facts are retained when found.</p></div><div class="pat-grid" style="margin-top:34px"><div class="pat"><div class="fig">%d</div><div class="cap">States with a published record</div></div><div class="pat"><div class="fig">%d records</div><div class="cap">At V3 verification</div></div><div class="pat"><div class="fig">%d records</div><div class="cap">With a concluded court judgment</div></div><div class="pat"><div class="fig">%d records</div><div class="cap">Recent judgments (appeal possible)</div></div></div>
</div></section>
%s

<section class="section"><div class="wrap"><div class="sec-head"><div class="kicker">By category</div><h2>Cases by category</h2><p>Each case carries one site category with exactly one Primary allegation. Click a category to reveal its sub-category breakdown. Trial-court findings are verified to a lower standard than High Court / Supreme Court judgments. Counts show recorded allegations regardless of their individual evidence position; they are not counts of proven misconduct.</p></div>%s</div></section>
<section class="section"><div class="wrap"><div class="sec-head"><div class="kicker">By outcome</div><h2>What the courts decided</h2><p>Each case carries one outcome type. Compensation figures are amounts ordered, not amounts shown paid or recovered.</p></div>%s</div></section>

<section class="section"><div class="wrap"><div class="sec-head"><div class="kicker">By state</div><h2>Cases by state / UT</h2><p>Coverage reflects what the discovery index returned and what verifiers could corroborate. Absence is not evidence of absence.</p></div>%s</div></section>

<section class="section"><div class="wrap"><div class="sec-head"><div class="kicker">By decade</div><h2>Cases by decade of judgment or conviction</h2><p>Judgments and convictions span %s. Recent judgments may still be under appeal.</p></div>%s</div></section>

<section class="section"><div class="wrap"><div class="sec-head"><div class="kicker">By court</div><h2>Largest courts (top 12)</h2><p>Deciding courts across both tiers; use the tier toggle to split High Courts from trial courts. Every record cites the deciding court and judgment.</p></div>%s</div></section>

<section class="section"><div class="wrap"><div class="sec-head"><div class="kicker">Verification</div><h2>How far material facts have been verified</h2><p>Verification describes the support for material facts. V2 records rest on an authenticated, attributed judgment; V3 requires a recorded authenticity check plus human review, and is rare.</p></div><table class="dtable"><thead><tr><th>Status</th><th>Meaning</th><th>Published records</th></tr></thead><tbody><tr><td class="num">V2</td><td>An attributable claim or public record has been reviewed</td><td>%d records</td></tr><tr><td class="num">V3</td><td>At least one material fact has been independently corroborated</td><td>%d records</td></tr></tbody></table></div></section>

<section class="section"><div class="wrap"><div class="sec-head"><div class="kicker">Follow-up coverage</div><h2>What we checked, and what we did not</h2><p>Each dated follow-up check targets one institutional action or one precisely stated question and records its author, approver, and approval time. A check older than 180 days is shown as stale; its original date and finding remain visible.</p></div><div class="pat-grid"><div class="pat"><div class="fig">%d records</div><div class="cap">Followed up</div></div><div class="pat"><div class="fig">%d records</div><div class="cap">Never re-checked</div></div><div class="pat"><div class="fig">%d records</div><div class="cap">Stale checks</div></div></div><table class="dtable" style="margin-top:28px"><thead><tr><th>Proceeding</th><th>Actions</th><th>Never re-checked</th><th>Followed up</th><th>Stale</th></tr></thead><tbody>%s</tbody></table></div></section>

<section class="section"><div class="wrap"><div class="sec-head"><div class="kicker">Institutional actions</div><h2>What institutions did</h2><p>Appeals are separate actions linked to the decision under review. Recent judgments may still face appeal; initiation or pendency of an appeal is not a finding. Acquittals, exonerations, dismissals, and relief denied are retained alongside convictions and relief granted.</p></div>%s</div></section>
%s
""" % (head, head, n_states_all, overturned_note(n_overturned),
       n_states_all, n_v3, n, n_appeal, toggle,
       cat_sec, out_sec, state_sec, span, dec_sec, court_sec,
       n_v2, n_v3, n_followed, n_never, n_stale, proc_rows,
       bars_html([("Order issued \u00b7 Concluded",
                   proc_types.get("Order issued", 0)),
                  ("Conviction \u00b7 Concluded",
                   proc_types.get("Conviction", 0)),
                  ("Pending action", n_pending)], max(
           1, sum(proc_types.values()))),
       context_charts_html(context))
    return main


def build_state_page(state, cases):
    path = "/state/%s" % slugify(state)
    if not cases:
        main = """
<section class="pagehead"><div class="wrap"><div class="eyebrow">The public record</div><h1>%s</h1><p class="sub">No qualifying judgment located yet for %s.</p></div></section>
<section class="section"><div class="wrap"><div class="tracker-empty"><h2>No records for this state yet</h2><p>Absence from this dataset is not evidence of absence &mdash; it reflects what the discovery index returned and what verifiers could corroborate.</p><a href="/tracker">Show all records</a></div></div></section>
""" % (esc(state), esc(state))
        return main
    cards = "".join(tracker_card(c) for c in sorted(
        cases, key=lambda c: (c.get("judgment_date") or ""), reverse=True))
    main = """
  <header class="tracker-pagehead">
    <div class="wrap">
      <div class="eyebrow">The public record</div>
      <h1>%s &mdash; %d record%s</h1>
      <p>Court-adjudicated cases from %s. <a href="/tracker">Browse all states</a>.</p>
    </div>
  </header>
  <section class="tracker-browser" aria-label="Published incident records">
    <div class="wrap">
      <div class="tracker-results-head" aria-live="polite"><strong>%d records</strong><span>shown</span></div>
      <div class="tracker-records">
%s
      </div>
    </div>
  </section>
""" % (esc(state), len(cases), "" if len(cases) == 1 else "s",
       esc(state), len(cases), cards)
    return main


def trial_card(r):
    cid = t2_id(r)
    url = rec_path(r, "trial-court", cid)
    title = r.get("case_title_or_number") or cid
    loc = location_short(r)
    cdate = t2_date_display(r)
    nsrc = t2_source_count(r)
    return """
          <article class="tracker-card" data-id="%s">
            <div class="tracker-card-topline">
              <div class="tracker-card-kicker"><span>%s</span><span>%s</span><span>Convicted: %s</span></div>
              <div class="tracker-card-badges"><span class="record-badge trial">Trial court</span><span class="record-badge level">%s</span></div>
            </div>
            <h2><a href="%s">%s</a></h2>
            <p class="tracker-card-summary">%s</p>
            <div class="tracker-card-facts">
              <span><strong>%s</strong> &middot; %s</span>
              <span>%d public source%s</span>
              <span>Appeal: %s</span>
            </div>
            <a class="tracker-card-open" href="%s" aria-label="View full record %s">View full record <span aria-hidden="true">&rarr;</span></a>
          </article>""" % (
        esc(cid), esc(cid), esc(loc), esc(cdate),
        esc(t2_v(r)), esc(url), esc(title),
        esc(r.get("summary") or ""),
        esc(site_category(r)), esc(t2_subcategory(r)), nsrc,
        "" if nsrc == 1 else "s", esc(t2_appeal(r)),
        esc(url), esc(cid))


def build_trialcourt_index(t2, by_state):
    n = len(t2)
    states = sorted(by_state)
    ap = Counter((r.get("appeal_status") or "unknown") for r in t2)
    ver = Counter(t2_v(r) for r in t2)
    state_rows = "".join(
        '<div class="bar"><div class="top bar-rowline"><span>'
        '<a href="/trial-court/%s">%s</a></span>'
        '<span class="n">%d record%s</span></div>'
        '<div class="track"><div class="fill" style="width:%d%%">'
        "</div></div></div>"
        % (slugify(s), esc(s), len(by_state[s]),
           "" if len(by_state[s]) == 1 else "s",
           max(1, round(100.0 * len(by_state[s]) / n)) if n else 0)
        for s in sorted(states, key=lambda s: (-len(by_state[s]), s)))
    return """
<section class="pagehead"><div class="wrap"><div class="eyebrow">Trial-court convictions</div><h1>Trial-court convictions</h1><p class="sub">@@TRIAL_INDEX_SUB@@</p></div></section>
<section class="section"><div class="wrap">
<div class="callout"><div class="lab">How to read these records</div><p>These are <strong>trial-court convictions</strong>, not High Court or Supreme Court findings. Trial convictions can be appealed and sometimes set aside; each record shows its <strong>verification status</strong> and <strong>appeal status</strong> as known from the cited sources. @@TRIAL_INDEX_CALLOUT@@</p></div>
<div class="pat-grid" style="margin-top:34px"><div class="pat"><div class="fig">%d</div><div class="cap">Trial-court convictions</div></div><div class="pat"><div class="fig">%d</div><div class="cap">States with a published record</div></div><div class="pat"><div class="fig">%d</div><div class="cap">Convictions upheld on appeal</div></div><div class="pat"><div class="fig">%d</div><div class="cap">Convictions set aside on appeal</div></div></div>
</div></section>
<section class="section"><div class="wrap"><div class="sec-head"><div class="kicker">By state</div><h2>Trial-court convictions by state / UT</h2><p>Coverage reflects ACB, CBI and court press releases and lists. Absence is not evidence of absence.</p></div><div class="bars">%s</div></div></section>
<section class="section"><div class="wrap"><div class="sec-head"><div class="kicker">Appeal status</div><h2>What happened after conviction</h2><p>Appeal status as known from the cited sources. "Unknown" means the sources located so far do not say whether the conviction was appealed.</p></div>%s</div></section>
<section class="section"><div class="wrap"><div class="sec-head"><div class="kicker">Verification</div><h2>How far material facts have been verified</h2><p>Trial-court records are verified to a lower standard than the High Court / Supreme Court tracker: most rest on a single official release or list.</p></div><table class="dtable"><thead><tr><th>Status</th><th>Published records</th></tr></thead><tbody>%s</tbody></table></div></section>
""".replace("@@TRIAL_INDEX_SUB@@",
           fill(T["trial_index_sub"], n=n).replace("%", "%%")).replace(
           "@@TRIAL_INDEX_CALLOUT@@",
           T["trial_index_callout"].replace("%", "%%")) % (
       n, len(states), ap.get("upheld", 0), ap.get("set_aside", 0),
       state_rows,
       bars_html([("Upheld on appeal", ap.get("upheld", 0)),
                  ("Set aside on appeal", ap.get("set_aside", 0)),
                  ("Appeal pending", ap.get("pending", 0)),
                  ("No appeal known", ap.get("none_known", 0)),
                  ("Unknown", ap.get("unknown", 0))], max(1, n)),
       "".join("<tr><td class=\"num\">%s</td><td>%d records</td></tr>"
               % (esc(v), ver[v]) for v in ("V1", "V1+", "V2")
               if ver.get(v)))


def build_trialcourt_state(state, clist):
    if not clist:
        return """
<section class="pagehead"><div class="wrap"><div class="eyebrow">Trial-court convictions</div><h1>%s</h1><p class="sub">No qualifying trial-court conviction located yet for %s.</p></div></section>
<section class="section"><div class="wrap"><div class="tracker-empty"><h2>No records for this state yet</h2><p>Absence from this dataset is not evidence of absence.</p><a href="/trial-court">Show all trial-court records</a></div></div></section>
""" % (esc(state), esc(state))
    cards = "".join(trial_card(r) for r in sorted(
        clist, key=lambda r: (t2_iso_date(r.get("conviction_date")),
                              t2_id(r)), reverse=True))
    return """
  <header class="tracker-pagehead">
    <div class="wrap">
      <div class="eyebrow">Trial-court convictions</div>
      <h1>%s &mdash; %d record%s</h1>
      <p>@@TRIAL_STATE_SUB@@ Each record shows its verification status and appeal status. <a href="/trial-court">All states</a> &middot; <a href="/tracker?level=trial">Browse in the tracker</a>.</p>
    </div>
  </header>
  <section class="tracker-browser" aria-label="Published trial-court records">
    <div class="wrap">
      <div class="tracker-results-head" aria-live="polite"><strong>%d records</strong><span>shown</span></div>
      <div class="tracker-records">
%s
      </div>
    </div>
  </section>
""".replace("@@TRIAL_STATE_SUB@@", fill(T["trial_state_sub"],
                                        state=esc(state)).replace("%", "%%")
           ) % (esc(state), len(clist), "" if len(clist) == 1 else "s",
                len(clist), cards)


def t2_source_list_html(r):
    # Tier-2 citations mirror the R61/R62 shape (kind — outlet, hyperlinked,
    # raw URL hidden); no link-checked dates exist yet for this tier.
    kind = {"press_release": "Press release", "judgment": "Court Record",
            "list": "Official list", "news": "Newsroom"}.get(
                r.get("source_kind"), pretty_label(r.get("source_kind"))
                or "Source")
    rows = []
    urls = ([r.get("primary_source_url")] if r.get("primary_source_url")
            else []) + [u for u in (r.get("secondary_sources") or []) if u]
    for u in urls:
        host = _host(u)
        rows.append('<div class="incident-source"><p>%s &mdash; '
                    '<a href="%s" rel="nofollow noopener">%s</a> '
                    '&mdash; Link checked: not yet recorded.</p></div>'
                    % (esc(kind), esc(u), esc(outlet_name(host))))
        kind = "Source"
    if not rows:
        rows.append('<div class="incident-source"><p>No public source '
                    "recorded.</p></div>")
    return "".join(rows)


def t2_current_position(r):
    court = esc(r.get("trial_court_name") or "The trial court")
    date = esc(t2_date_display(r, "a date not stated in the cited sources"))
    ap = r.get("appeal_status") or "unknown"
    base = "%s convicted %s on %s." % (court, sw(r, "accused"), date)
    if ap == "upheld":
        return (base + " The conviction was upheld on appeal."
                + (" <a href=\"%s\" rel=\"nofollow noopener\">Appeal text"
                   "</a>." % esc(r["appeal_url"]) if r.get("appeal_url")
                   else ""))
    if ap == "set_aside":
        return (base + " The conviction was later set aside on appeal; "
                "the acquittal on appeal is the current position."
                + (" <a href=\"%s\" rel=\"nofollow noopener\">Appeal text"
                   "</a>." % esc(r["appeal_url"]) if r.get("appeal_url")
                   else ""))
    if ap == "pending":
        return (base + " An appeal is pending; initiation or pendency of "
                "an appeal is not a finding.")
    if ap == "none_known":
        return (base + " No appeal is known from the cited sources.")
    return (base + " Whether the conviction was appealed is not known "
            "from the cited sources; treat recent convictions as "
            "possibly appealable.")


def people_facts_html(p, off_txt, vic_txt):
    """At-a-glance people rows. Police records keep Officers + Victim(s);
    other services show the convicted official(s) only: complainants in
    corruption cases are private persons and are never listed."""
    rows = '<div><dt>%s</dt><dd>%s</dd></div>' % (sw(p, "people"),
                                                  esc(off_txt))
    if sw(p, "show_victims"):
        rows += '<div><dt>Victim(s)</dt><dd>%s</dd></div>' % esc(vic_txt)
    return rows


def build_trialcourt_record(p):
    cid = t2_id(p)
    path = "/trial-court/%s" % cid
    title = p.get("case_title_or_number") or cid
    loc = location_short(p)
    cdate = t2_date_display(p)
    idate = (p.get("incident_date") or "Date not stated").strip()
    officers = [officer_display(o, p) for o in (p.get("officers") or [])]
    off_txt = "; ".join(officers) if officers else "None stated"
    vics = [(v if isinstance(v, str) else (v.get("descriptor") or v.get("role") or v.get("description") or "")) for v in (p.get("victims") or []) if v]
    vics = [v for v in vics if v]
    vic_txt = "; ".join(vics) if vics else "Not stated"
    nsrc = t2_source_count(p)
    desc = ("Trial-court conviction of %s: %s \u2014 %s, "
            "convicted %s. Appeal status: %s."
            % (sw(p, "of"), title, p.get("trial_court_name")
               or "trial court", cdate, t2_appeal(p)))[:300]
    summary = p.get("summary") or "Summary not recorded."
    appeal_link = (' <a href="%s" rel="nofollow noopener">Appeal text</a>'
                   % esc(p["appeal_url"])) if p.get("appeal_url") else ""
    main = """
  <div class="wrap">
    <nav class="incident-breadcrumb" aria-label="Breadcrumb"><a href="/tracker?level=trial">Trial-court records</a><span aria-hidden="true">/</span><span>%s</span></nav>
    <header class="incident-hero">
      <div class="incident-hero-copy">
        <div class="trial-flag">Trial-court conviction</div>
        <div class="incident-overline"><span>%s</span><span>%s</span><span>Convicted %s</span></div>
        <h1>%s</h1>
        <p class="incident-summary">%s</p>
      </div>
      <div class="incident-hero-badges"><span class="record-badge trial">Trial-court conviction</span><span class="record-badge level">%s</span></div>
    </header>

    <div class="incident-reading-note"><strong>What this record means</strong><p>This page documents a trial-court conviction from the cited sources below. It is not a High Court or Supreme Court finding; the conviction may have been appealed. Findings are attributed to the convicting court; this record does not add findings of its own.</p><a href="/methodology">How verification works &rarr;</a></div>

    <div class="incident-layout">
      <div class="incident-main">%s
        <section class="incident-section incident-current"><div class="incident-section-label">Current position</div><p>%s</p></section>

        <section class="incident-section" id="sentence">
          <div class="incident-section-head"><div><div class="incident-section-label">Attributed to the court</div><h2>Sentence &amp; charges</h2></div></div>
          <div class="incident-simple-list"><div><p><strong>Sentence:</strong> %s</p><p><strong>Sections:</strong> %s</p></div></div>
        </section>

        <section class="incident-section" id="appeal">
          <div class="incident-section-head"><div><div class="incident-section-label">Continuing record</div><h2>Appeal status</h2></div></div>
          <div class="incident-simple-list"><div><p><strong>%s.</strong>%s</p></div></div>
        </section>
      </div>

      <aside class="incident-sidebar" aria-label="Record details and sources">
        <section class="incident-facts"><h2>At a glance</h2><dl><div><dt>Record</dt><dd>Trial-court conviction</dd></div><div><dt>Primary category</dt><dd>%s</dd></div><div><dt>Location</dt><dd>%s</dd></div><div><dt>Incident date</dt><dd>%s</dd></div><div><dt>Court level</dt><dd>%s</dd></div><div><dt>Court</dt><dd>%s</dd></div><div><dt>Case reference</dt><dd>%s</dd></div><div><dt>Date of conviction</dt><dd>%s</dd></div><div><dt>Sub-category</dt><dd>%s</dd></div>%s<div><dt>Sentence</dt><dd>%s</dd></div><div><dt>Verification</dt><dd>%s &middot; Trial court</dd></div><div><dt>Appeal status</dt><dd>%s</dd></div><div><dt>Source kind</dt><dd>%s</dd></div><div><dt>Published</dt><dd>%s</dd></div></dl></section>
        <section class="incident-sources" id="sources"><div class="incident-section-head"><div><div class="incident-section-label">Citations</div><h2>Public sources</h2></div><span>%d</span></div>
          %s
        </section>
        <a class="incident-back" href="/tracker?level=trial">&larr; Back to all trial-court records</a>
      </aside>
    </div>
  </div>
""" % (
        esc(cid), esc(cid), esc(loc), esc(cdate),
        esc(title), esc(summary), esc(t2_v(p)),
        report_card_html(p, "trial"),
        t2_current_position(p),
        esc(p.get("sentence") or "Not stated"),
        esc("; ".join(p.get("sections") or []) or "Not stated"),
        esc(t2_appeal(p)), appeal_link,
        esc(site_category(p)), esc(loc), esc(idate),
        esc(t2_court_level(p)),
        esc(p.get("trial_court_name") or "Not stated"),
        esc(title), esc(cdate), esc(t2_subcategory(p)),
        people_facts_html(p, off_txt, vic_txt),
        esc(p.get("sentence") or "Not stated"),
        esc(t2_v(p)), esc(t2_appeal(p)),
        esc(pretty_label(p.get("source_kind")) or "Not stated"),
        esc(fmt_date(BUILD_DATE)),
        nsrc, t2_source_list_html(p))
    ld_graph = [
        org_ld_node(),
        {"@type": "WebSite", "@id": SITE_URL + "/#website",
         "url": SITE_URL, "name": SITE_NAME,
         "description": T["website_description"],
         "publisher": {"@id": SITE_URL + "/#organization"},
         "inLanguage": "en-IN"},
        {"@type": "WebPage", "@id": SITE_URL + path + "#webpage",
         "url": SITE_URL + path, "name": title + " | " + SITE_NAME,
         "description": summary[:300],
         "isPartOf": {"@id": SITE_URL + "/#website"},
         "about": {"@id": SITE_URL + "/#organization"}, "inLanguage": "en-IN"},
        {"@type": "Article", "@id": SITE_URL + path + "#article",
         "mainEntityOfPage": {"@id": SITE_URL + path + "#webpage"},
         "headline": title, "description": summary[:300],
         "publisher": {"@id": SITE_URL + "/#organization"},
         "inLanguage": "en-IN",
         "datePublished": t2_iso_date(p.get("conviction_date")) or None,
         "dateModified": t2_iso_date(p.get("conviction_date")) or None},
    ]
    return main, desc, ld_graph




def methodology_appendix(n1, n2, n_overturned):
    """The watch's court-adjudicated appendix (templates/<watch>/
    methodology-appendix.html, optional) with the build-time dataset size
    inserted before its inclusion rules."""
    path = os.path.join(REF_DIR, "methodology-appendix.html")
    if not os.path.exists(path):
        return ""
    para = fill(T["methodology_size"], headline=headline_sentence(n1, n2),
                overturned=overturned_note(n_overturned))
    return read_ref("methodology-appendix.html").replace(
        "<h3>Inclusion rules</h3>", para + "\n      <h3>Inclusion rules</h3>",
        1)


def about_counts_section(n1, n2, n_overturned):
    return """
<section class="section">
  <div class="wrap">
    <div class="callout"><div class="lab">The record</div><p>@@SITE_NAME@@ publishes %s. %s</p></div>
  </div>
</section>
""".replace("@@SITE_NAME@@", esc(SITE_NAME)) % (
    headline_sentence(n1, n2), overturned_note(n_overturned))


def dataset_ld_node(n1, n2, n_overturned):
    return {
        "@type": "Dataset",
        "@id": SITE_URL + "/data#dataset",
        "name": T["dataset_name"],
        "description": "%s. %s" % (headline_sentence(n1, n2),
                                   overturned_note(n_overturned)),
        "url": SITE_URL + "/data",
    }


def build_data_page(n_cases, files, n1=None, n2=None, n_overturned=0):
    rows = []
    for name, size, note in files:
        rows.append('<tr><td><a href="/data/%s">%s</a></td><td>%s</td>'
                    "<td>%s</td></tr>" % (esc(name), esc(name),
                                          esc(human_size(size)), esc(note)))
    n1 = n1 if n1 is not None else n_cases
    n2 = n2 or 0
    return """
<section class="pagehead"><div class="wrap"><div class="eyebrow">Open data</div><h1>Download the dataset</h1><p class="sub">%s, rebuilt %s. %s Free to reuse with attribution to @@SITE_NAME@@.</p></div></section>
<section class="section"><div class="wrap">
<table class="dtable"><thead><tr><th>File</th><th>Size</th><th>Notes</th></tr></thead><tbody>%s</tbody></table>
<div class="prose" style="margin-top:28px"><h3>Fields</h3><p><code>cases.json</code> is an array of case objects with fields including <code>record_id</code>, <code>state</code>, <code>district</code>, <code>court</code>, <code>case_title</code>, <code>case_number</code>, <code>citation</code>, <code>judgment_date</code>, <code>incident_date</code>, <code>category</code>, <code>outcome_type</code>, <code>verification_status</code>, <code>tier</code>, <code>allegations</code>, <code>institutional_response</code>, <code>followup_history</code>, <code>officers</code> (gated <code>display</code> forms only), <code>victims</code> (role nouns where redacted), <code>sentence_type</code>, <code>sentence_max_years</code>, <code>compensation_inr</code>, <code>primary_source_url</code>, <code>secondary_sources</code>, <code>summary</code>, <code>court_quote</code>. <code>tier2.json</code> carries the trial-court convictions (<code>case_id</code>, <code>trial_court_name</code>, <code>court_level</code>, <code>conviction_date</code>, <code>appeal_status</code>, <code>sentence</code>, gated <code>officers</code>). Officer names appear only where the naming gate graded them <code>named_safe</code>; legal names of minors and sexual-assault survivors never appear. Every field is described in <a href="/data/schema.json">schema.json</a>; per-state slices live at <code>/data/state/&lt;state-slug&gt;.json</code> (36 files); single records at <code>/data/case/&lt;record-id&gt;.json</code>; the slim tracker index at <code>index.json</code> (both tiers; rows carry a <code>tier</code> field, <code>hc_sc</code> or <code>trial</code>). See <a href="/methodology">methodology</a> for definitions and limitations.</p></div>
</div></section>
""".replace("@@SITE_NAME@@", esc(SITE_NAME)) % (
    headline_sentence(n1, n2), esc(BUILD_DATE),
    overturned_note(n_overturned), "".join(rows))


def human_size(n):
    for unit in ("B", "KB", "MB"):
        if n < 1024 or unit == "MB":
            return "%d %s" % (n, unit) if unit == "B" else "%.1f %s" % (n, unit)
        n /= 1024.0


TRACKER_JS = r"""// CopwatchIndia tracker — client-side filter/search over /data/index.json
// (slim precomputed records; full cases stay in /data/cases.json and
// /data/case/<id>.json for bulk/API use). Honours the original ?filter= /
// ?q= vocabulary so shared links behave the same.
(function () {
  "use strict";
  var DATA_URL = "__BASE__/data/index.json";
  var TRIAL_URL = "__BASE__/data/index-trial.json";
  var PAGE = 100;
  var mount = document.getElementById("tracker-records");
  if (!mount) return;

  var els = {
    q: document.getElementById("tracker-query"),
    form: document.getElementById("tracker-search-form"),
    count: document.getElementById("tracker-count"),
    service: document.getElementById("x-service"),
    level: document.getElementById("x-level"),
    state: document.getElementById("x-state"),
    district: document.getElementById("x-district"),
    ps: document.getElementById("x-ps"),
    year: document.getElementById("x-year"),
    category: document.getElementById("x-category"),
    outcome: document.getElementById("x-outcome"),
    court: document.getElementById("x-court"),
    reset: document.getElementById("x-reset")
  };

  var OUTCOME_LABEL = {
    adverse_finding_compensation: "Adverse finding + compensation",
    adverse_finding: "Adverse finding",
    conviction_upheld: "Conviction upheld",
    conviction_by_hc: "Conviction entered by High Court",
    conviction_by_sc: "Conviction entered by Supreme Court",
    disciplinary_upheld: "Disciplinary action upheld",
    trial_court_conviction: "Trial-court conviction"
  };
  var APPEAL_LABEL = {
    unknown: "Unknown",
    upheld: "Upheld on appeal",
    set_aside: "Set aside on appeal",
    none_known: "No appeal known",
    pending: "Appeal pending"
  };
  var MONTHS = ["", "January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];

  var allCases = [];
  var trialCases = null;
  var trialFailed = false;
  var trialPending = [];
  var activeFilter = "";
  var activeSubcat = "";
  var searchTimer = null;
  var shown = PAGE;
  var lastRows = [];

  function label(v) { return String(v == null ? "" : v).replace(/_/g, " "); }
  function escHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }
  function fmtDate(ds) {
    var s = String(ds || "");
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (m) return parseInt(m[3], 10) + " " + MONTHS[parseInt(m[2], 10)] + " " + m[1];
    m = /^(\d{4})-(\d{2})$/.exec(s);
    if (m) return MONTHS[parseInt(m[2], 10)] + " " + m[1];
    m = /^(\d{4})$/.exec(s);
    if (m) return m[1];
    return "Date not stated";
  }
  function isSlim(c) { return c.id !== undefined; }
  function ridOf(c) { return c.id || c.record_id || c.merged_id || c.mid || ""; }
  function midOf(c) { return c.mid || c.merged_id || ""; }
  function titleOf(c) { return c.ti || c.display_title || c.case_title || ridOf(c); }
  function caseTitleOf(c) { return c.ct || c.case_title || titleOf(c); }
  function summaryOf(c) { return c.su || c.summary || ""; }
  function stateOf(c) { return c.st || c.state || ""; }
  function districtOf(c) { return c.di || c.district || ""; }
  function courtOf(c) { return c.co || c.court || ""; }
  function caseNumOf(c) { return c.cn || c.case_number || ""; }
  function outcomeOf(c) { return c.ou || c.outcome_type || ""; }
  function jdateOf(c) { return c.jd || c.judgment_date || ""; }
  function jyearOf(c) {
    if (c.jy != null) return String(c.jy);
    if (c.judgment_year != null) return String(c.judgment_year);
    return jdateOf(c).slice(0, 4);
  }
  function v3earned(c) {
    var vb = c.v3_basis || {};
    if (c.authenticity_check == null) return false;
    if (vb.corroborated_fact == null || vb.limits == null) return false;
    if (c.privacy_review == null || c.publication_basis == null) return false;
    if (!c.reviews || !c.reviews.length) return false;
    var named = (c.officers || []).some(function (o) { return o && o.publish_grade === "named_safe"; });
    if (named && c.legal_review == null) return false;
    return true;
  }
  function vLevel(c) {
    if (c.v) return c.v;
    if (isSlim(c)) return "V2";
    var v = String(c.verification_status || "V2").toUpperCase();
    if (v === "V3" && !v3earned(c)) return "V2";
    return (v === "V1" || v === "V2" || v === "V3") ? v : "V2";
  }
  function tier(c) {
    if (levelOf(c) === "trial") return "T";
    if (c.tr) return c.tr;
    if (isSlim(c)) return "A";
    if (vLevel(c) === "V3") return "B";
    return String(c.tier || "").indexOf("Tier B") !== -1 ? "B" : "A";
  }
  function tierLabel(c) {
    if (levelOf(c) === "trial") return "Trial-court conviction";
    return tier(c) === "B" ? "__VERIFIED_LABEL__" : "Externally reported";
  }
  function tierClass(c) {
    if (levelOf(c) === "trial") return "trial";
    return tier(c) === "B" ? "verified" : "reported";
  }
  function levelOf(c) {
    // Slim rows carry tier/lv codes ("hc_sc"/"trial"); full tier-1
    // records carry a prose tier ("Tier A ...") which must NOT divert
    // them from the HC/SC pool — only exact codes count.
    var t = c.lv || c.tier;
    if (t === "trial") return "trial";
    if (t === "hc_sc") return "hc_sc";
    return "hc_sc";
  }
  function tierBadge(c) {
    return levelOf(c) === "trial" ? "Trial court" : "High Court/Supreme Court";
  }
  function fmtN(x) {
    return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  function subcatOf(c) { return c.sc || c.subcategory_display || ""; }
  function appealOf(c) { return c.ap || c.appeal_status || ""; }
  function appealLabel(c) {
    var a = appealOf(c);
    return APPEAL_LABEL[a] || (a ? String(a).replace(/_/g, " ") : "Unknown");
  }
  function siteCat(c) { return c.ca || c.category || "Other"; }
  function primaryPos(c) {
    if (c.pp !== undefined) return c.pp;
    if (isSlim(c)) return "Reported allegation";
    var allegs = c.allegations || [];
    for (var i = 0; i < allegs.length; i++) {
      if (allegs[i] && allegs[i].primary) return allegs[i].position || "Reported allegation";
    }
    return (allegs[0] && allegs[0].position) || "Reported allegation";
  }
  function nActions(c) {
    if (c.na !== undefined) return c.na;
    return (c.institutional_response || []).length;
  }
  function actStatuses(c) {
    if (c.as !== undefined) return c.as;
    if (isSlim(c)) return nActions(c) > 0 ? ["concluded"] : [];
    var st = [];
    (c.institutional_response || []).forEach(function (a) {
      var s = String((a && a.status) || "").toLowerCase();
      if (s && st.indexOf(s) === -1) st.push(s);
    });
    return st;
  }
  function actionSummary(c) {
    var n = nActions(c);
    if (!n) return "0 institutional actions";
    return n + " institutional action" + (n === 1 ? "" : "s") + " &middot; " + actStatuses(c).join(" &middot; ");
  }
  function isPending(c) {
    return actStatuses(c).some(function (s) { return s === "pending" || s === "initiated"; });
  }
  function isConcluded(c) {
    return actStatuses(c).indexOf("concluded") !== -1;
  }
  function isChecked(c) {
    if (c.ch !== undefined) return !!c.ch;
    if (isSlim(c)) return false;
    return (c.followup_history || []).length > 0;
  }
  function lastCheckedOf(c) { return c.lc || c.last_checked || null; }
  function isStale(c) {
    var lc = lastCheckedOf(c);
    if (!lc) return false;
    var t = Date.parse(lc);
    if (isNaN(t)) return false;
    return (Date.now() - t) > 180 * 86400000;
  }
  function isRetracted(c) {
    if (c.re !== undefined) return !!c.re;
    if (isSlim(c)) return false;
    if (!c.retracted) return false;
    if (typeof c.retracted === "object") return !!c.retracted.is_retracted;
    return true;
  }
  function sourceCount(c) {
    if (c.ns !== undefined) return c.ns;
    if (isSlim(c)) return 1;
    var seen = {}, n = 0;
    if (c.primary_source_url) { seen[c.primary_source_url] = 1; n++; }
    (c.secondary_sources || []).forEach(function (u) {
      if (u && !seen[u]) { seen[u] = 1; n++; }
    });
    return n;
  }
  function locationOf(c) {
    var bits = [];
    if (districtOf(c)) bits.push(districtOf(c));
    if (stateOf(c)) bits.push(stateOf(c));
    return bits.join(", ") || stateOf(c) || "Location not stated";
  }
  function officersText(c) {
    // OFFICER GATE: search display-safe text only, never raw name.
    if (c.ot !== undefined) return c.ot;
    if (isSlim(c)) return "";
    return (c.officers || []).map(function (o) {
      if (!o) return "";
      if (o.publish_grade === "named_safe") return o.name_public || o.display || "";
      return o.display || "";
    }).join(" ");
  }

  function matchesFilter(c, f) {
    if (f === "retracted") return isRetracted(c);
    if (isRetracted(c)) return false;
    if (!f) return true;
    if (f === "A") return tier(c) === "A";
    if (f === "B") return tier(c) === "B";
    if (f === "actions") return nActions(c) > 0;
    if (f === "V2") return vLevel(c) === "V2";
    if (f === "V3") return vLevel(c) === "V3";
    if (f === "pending") return isPending(c);
    if (f === "concluded") return isConcluded(c);
    if (f === "checked") return isChecked(c);
    if (f === "never_checked") return !isChecked(c);
    if (f === "stale_checks") return isStale(c);
    return true;
  }

  function readUrl() {
    var p = new URLSearchParams(window.location.search);
    return {
      filter: p.get("filter") || "",
      q: p.get("q") || "",
      service: p.get("service") || "",
      level: p.get("level") || "all",
      state: p.get("state") || "",
      district: p.get("district") || "",
      ps: p.get("ps") || "",
      year: p.get("year") || "",
      category: p.get("category") || "",
      subcategory: p.get("subcategory") || "",
      outcome: p.get("outcome") || "",
      court: p.get("court") || ""
    };
  }

  function writeUrl(s) {
    var p = new URLSearchParams();
    ["filter", "q", "service", "level", "state", "district", "ps", "year", "category", "subcategory", "outcome", "court"].forEach(function (k) {
      if (k === "level") {
        if (s[k] && s[k] !== "all") p.set(k, s[k]);
      } else if (s[k]) {
        p.set(k, s[k]);
      }
    });
    var qs = p.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : ""));
  }

  function currentState() {
    return {
      filter: activeFilter,
      q: els.q ? els.q.value.trim() : "",
      service: els.service ? els.service.value : "",
      level: els.level ? els.level.value : "all",
      state: els.state ? els.state.value : "",
      district: els.district ? els.district.value.trim() : "",
      ps: els.ps ? els.ps.value : "",
      year: els.year ? els.year.value : "",
      category: els.category ? els.category.value : "",
      subcategory: activeSubcat,
      outcome: els.outcome ? els.outcome.value : "",
      court: els.court ? els.court.value : ""
    };
  }

  function haystack(c) {
    // Prebuilt lowercase search blob (built once at load; keeps a 10k-row
    // index responsive). Falls back to on-the-fly join for foreign shapes.
    if (c._hay !== undefined) return c._hay;
    return (caseTitleOf(c) + " " + titleOf(c) + " " +
      summaryOf(c) + " " + (c.h || "") + " " + (c.pl || "") + " " + (c.ps || "") + " " + officersText(c) + " " + caseNumOf(c) +
      " " + ridOf(c) + " " + midOf(c) + " " + locationOf(c)).toLowerCase();
  }

  function buildHay(c) {
    c._hay = (caseTitleOf(c) + " " + titleOf(c) + " " +
      summaryOf(c) + " " + (c.h || "") + " " + (c.pl || "") + " " + (c.ps || "") + " " + officersText(c) + " " + caseNumOf(c) +
      " " + ridOf(c) + " " + midOf(c) + " " + locationOf(c)).toLowerCase();
  }

  function matches(c, s) {
    if (!matchesFilter(c, s.filter)) return false;
    if (s.service && (c.sv || "") !== s.service) return false;
    var lv = s.level || "all";
    if (lv !== "all" && levelOf(c) !== lv) return false;
    if (s.state && stateOf(c) !== s.state) return false;
    if (s.district && districtOf(c) !== s.district) return false;
    if (s.ps && (c.ps || "") !== s.ps) return false;
    if (s.year && jyearOf(c) !== s.year) return false;
    if (s.category && siteCat(c) !== s.category) return false;
    if (s.subcategory && subcatOf(c) !== s.subcategory) return false;
    if (s.outcome && outcomeOf(c) !== s.outcome) return false;
    if (s.court && courtOf(c) !== s.court) return false;
    if (s.q) {
      var hay = haystack(c);
      var words = s.q.toLowerCase().split(/\s+/);
      for (var i = 0; i < words.length; i++) {
        if (hay.indexOf(words[i]) === -1) return false;
      }
    }
    return true;
  }

  var NEWS_OUTCOME = {
    trial_court_conviction: "Convicted", conviction_by_hc: "Convicted", conviction_by_sc: "Convicted",
    conviction_upheld: "Conviction upheld", adverse_finding_compensation: "Compensation ordered", adverse_finding: "Adverse finding",
    adverse_finding: "Adverse finding", disciplinary_upheld: "Penalty upheld"
  };
  function cardHtml(c) {
    var rid = ridOf(c);
    var trial = levelOf(c) === "trial";
    // c.w: path of the record's home watch under this one ("" = here).
    var pre = c.w || "";
    var url = trial ? "__BASE__" + pre + "/trial-court/" + encodeURIComponent(rid)
      : "__BASE__" + pre + "/incident/" + encodeURIComponent(rid);
    var head = c.h || titleOf(c);
    var para = c.pa || summaryOf(c);
    var outc = NEWS_OUTCOME[outcomeOf(c)] || (trial ? "Convicted" : tierLabel(c));
    var meta = [fmtDate(jdateOf(c)), locationOf(c)];
    if (c.ro) meta.push(c.ro + " (name withheld)");
    return '<article class="tracker-card news-card" data-id="' + escHtml(rid) + '">' +
      '<div class="news-top"><div class="news-chips"><span class="chip">' + escHtml(siteCat(c)) +
      '</span><span class="chip chip-out">' + escHtml(outc) + "</span></div>" +
      (c.pl ? '<span class="plate" title="Case number">' + escHtml(c.pl) + "</span>" : "") + "</div>" +
      '<h2 class="news-head"><a href="' + escHtml(url) + '">' + escHtml(head) + "</a></h2>" +
      '<p class="news-meta">' + meta.filter(Boolean).map(escHtml).join(" &middot; ") + "</p>" +
      '<p class="news-para">' + escHtml(para) + "</p>" +
      '<a class="tracker-card-open" href="' + escHtml(url) + '" aria-label="Read the court record ' +
      escHtml(c.pl || rid) + '">Read the court record <span aria-hidden="true">&rarr;</span></a></article>';
  }

  function render(rows, s) {
    lastRows = rows;
    if (!rows.length) {
      mount.innerHTML = '<div class="tracker-empty"><h2>No matching records</h2>' +
        "<p>Try a broader search or choose a different filter.</p>" +
        '<a href="__BASE__/tracker">Show all records</a></div>';
    } else {
      var vis = rows.slice(0, shown);
      var html = vis.map(cardHtml).join("");
      if (rows.length > shown) {
        html += '<button type="button" class="show-more" id="tracker-more">Show more (' +
          (rows.length - shown) + " remaining)</button>";
      }
      mount.innerHTML = html;
      var more = document.getElementById("tracker-more");
      if (more) more.addEventListener("click", function () {
        shown += PAGE;
        render(lastRows, currentState());
      });
    }
    if (els.count) {
      var vis = Math.min(shown, rows.length), all = "__TOTAL_ALL__";
      els.count.textContent = "showing " + fmtN(vis) + " of " +
        (fmtN(rows.length) === all
          ? all + " records (__N_HCSC__ HC/SC \u00b7 __N_TRIAL__ trial court)"
          : fmtN(rows.length) + " matching records (" + all + " in all)");
      var sib = els.count.nextElementSibling;
      if (sib) sib.textContent = "";
    }
    document.querySelectorAll("a.tracker-filter[data-filter]").forEach(function (a) {
      a.classList.toggle("on", (a.getAttribute("data-filter") || "") === (s.filter || ""));
    });
  }

  function hasTrialRows() {
    return allCases.some(function (c) { return levelOf(c) === "trial"; });
  }

  function poolFor(s) {
    // index.json carries both tiers; the level facet partitions it.
    var lv = s.level || "all";
    if (lv === "all") return allCases;
    if (lv === "trial") {
      return allCases.filter(function (c) { return levelOf(c) === "trial"; });
    }
    return allCases.filter(function (c) { return levelOf(c) !== "trial"; });
  }

  function ensureTrial(s, done) {
    var lv = s.level || "all";
    if (lv === "hc_sc" || trialCases || trialFailed || hasTrialRows()) {
      done();
      return;
    }
    trialPending.push(done);
    if (trialPending.length > 1) return;
    fetch(TRIAL_URL, { credentials: "same-origin" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function (data) {
      // Fallback for a stale index.json without trial rows: merge any
      // missing records into the pool (dedupe by id), then proceed.
      trialCases = [];
      var seen = {};
      allCases.forEach(function (c) { seen[ridOf(c)] = 1; });
      data.forEach(function (c) {
        if (!seen[ridOf(c)]) { buildHay(c); allCases.push(c); }
      });
      var q = trialPending;
      trialPending = [];
      q.forEach(function (fn) { fn(); });
    }).catch(function () {
      trialFailed = true;
      var q = trialPending;
      trialPending = [];
      q.forEach(function (fn) { fn(); });
    });
  }

  function apply(pushUrl) {
    var s = currentState();
    if (pushUrl !== false) writeUrl(s);
    shown = PAGE;
    ensureTrial(s, function () {
      var lv = s.level || "all";
      if (lv !== "hc_sc" && trialFailed && !hasTrialRows()) {
        mount.innerHTML = '<div class="tracker-empty"><h2>Could not load trial-court records</h2>' +
          "<p>Please check your connection and reload, or browse the High Court / Supreme Court records.</p></div>";
        if (els.count) els.count.textContent = "0 records";
        return;
      }
      var rows = poolFor(s).filter(function (c) { return matches(c, s); });
      rows.sort(function (a, b) {
        return String(jdateOf(b)) < String(jdateOf(a)) ? -1 : 1;
      });
      render(rows, s);
    });
  }

  var GEO = {};
  try { GEO = JSON.parse((document.getElementById("x-geo") || {}).textContent || "{}"); } catch (e) { GEO = {}; }
  function fillSel(sel, vals, first, keep) {
    if (!sel) return;
    sel.innerHTML = '<option value="">' + escHtml(first) + '</option>' + vals.map(function (v) {
      return '<option value="' + escHtml(v) + '">' + escHtml(v) + '</option>';
    }).join("");
    sel.disabled = !vals.length;
    sel.value = keep && vals.indexOf(keep) !== -1 ? keep : "";
  }
  function fillGeo(st, di, ps) {
    var ds = st && GEO[st] ? Object.keys(GEO[st]).sort() : [];
    fillSel(els.district, ds, st ? "All districts" : "Choose a state first", di);
    var units = [];
    if (st && GEO[st]) {
      (di && GEO[st][di] ? [di] : ds).forEach(function (d) {
        (GEO[st][d] || []).forEach(function (u) { if (units.indexOf(u) === -1) units.push(u); });
      });
    }
    units.sort();
    fillSel(els.ps, units, st ? "All stations / units" : "Choose a state first", ps);
  }

  function setFromState(s) {
    activeFilter = s.filter || "";
    activeSubcat = s.subcategory || "";
    if (els.q) els.q.value = s.q || "";
    if (els.service) els.service.value = s.service || "";
    if (els.level) els.level.value = s.level || "all";
    if (els.state) els.state.value = s.state || "";
    fillGeo(s.state || "", s.district || "", s.ps || "");
    if (els.year) els.year.value = s.year || "";
    if (els.category) els.category.value = s.category || "";
    if (els.outcome) els.outcome.value = s.outcome || "";
    if (els.court) els.court.value = s.court || "";
  }

  function bind() {
    // Live-as-you-type filtering AND an explicit Search button (form
    // submit, incl. Enter) call the same apply(): identical results.
    if (els.form) els.form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      apply(true);
    });
    if (els.state) els.state.addEventListener("change", function () { fillGeo(els.state.value, "", ""); });
    if (els.district) els.district.addEventListener("change", function () { fillGeo(els.state.value, els.district.value, ""); });
    ["service", "level", "state", "district", "ps", "year", "category", "outcome", "court"].forEach(function (k) {
      if (els[k]) els[k].addEventListener("change", function () { apply(true); });
    });
    ["q"].forEach(function (k) {
      if (els[k]) els[k].addEventListener("input", function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () { apply(true); }, 180);
      });
    });
    document.querySelectorAll("a.tracker-filter[data-filter]").forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        activeFilter = a.getAttribute("data-filter") || "";
        apply(true);
      });
    });
    if (els.reset) els.reset.addEventListener("click", function () {
      activeFilter = "";
      activeSubcat = "";
      if (els.q) els.q.value = "";
      fillGeo("", "", "");
      if (els.level) els.level.value = "all";
      ["service", "state", "year", "category", "outcome", "court"].forEach(function (k) {
        if (els[k]) els[k].value = "";
      });
      apply(true);
    });
    window.addEventListener("popstate", function () {
      setFromState(readUrl());
      apply(false);
    });
  }

  fetch(DATA_URL, { credentials: "same-origin" }).then(function (r) {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  }).then(function (data) {
    allCases = data;
    allCases.forEach(buildHay);
    setFromState(readUrl());
    bind();
    apply(false);
    writeUrl(currentState());
  }).catch(function () {
    mount.innerHTML = '<div class="tracker-empty"><h2>Could not load records</h2>' +
      "<p>Please check your connection and reload.</p></div>";
  });
})();
"""

PATTERNS_JS = r"""// CopwatchIndia patterns — tier toggle over pre-rendered chart variants.
// Each chart ships All / HC-SC / Trial-court variants server-side; this
// script only switches visibility (external file: inline scripts are
// blocked by the site Content-Security-Policy).
(function () {
  "use strict";
  var btns = document.querySelectorAll("[data-ptier-btn]");
  if (!btns.length) return;
  function show(tier) {
    document.querySelectorAll(".pat-tier").forEach(function (el) {
      el.hidden = el.getAttribute("data-ptier") !== tier;
    });
    btns.forEach(function (b) {
      var on = b.getAttribute("data-ptier-btn") === tier;
      if (on) {
        b.classList.add("on");
      } else {
        b.classList.remove("on");
      }
    });
  }
  btns.forEach(function (b) {
    b.addEventListener("click", function () {
      var tier = b.getAttribute("data-ptier-btn");
      show(tier);
      try {
        var u = new URL(window.location.href);
        u.searchParams.set("tier", tier);
        window.history.replaceState(null, "", u.toString());
      } catch (e) { /* non-fatal */ }
    });
  });
  try {
    var t = new URLSearchParams(window.location.search).get("tier");
    if (t === "hc" || t === "trial" || t === "all") show(t);
  } catch (e) { /* non-fatal */ }
})();
"""

CSS_ADDITIONS = """/* Record pages never scroll sideways on phones: grid/flex children may shrink */
.incident-layout>*,.action-timeline>*,.action-card-head>*{min-width:0}
.action-card-head{flex-wrap:wrap}
.action-card,.action-card h3,.action-authority{overflow-wrap:anywhere}
.home-news-list{display:grid;gap:16px;margin:22px 0 8px}
/* Report card (police records, opened record page) */
.report-card{border:1px solid var(--line);background:#fffdf8;padding:22px 24px;margin-top:26px}
.report-card .incident-section-head{margin-bottom:10px}
.rc-operative{font-family:var(--serif);font-size:1.06rem;line-height:1.6;color:var(--ink);margin:0 0 14px;text-wrap:pretty}
.rc-grid{margin:0;display:grid;gap:0}
.rc-grid>div{display:grid;grid-template-columns:minmax(0,13rem) minmax(0,1fr);gap:4px 18px;padding:11px 0;border-top:1px solid var(--paper-edge)}
.rc-grid dt{font-family:var(--sans);font-size:.74rem;letter-spacing:.06em;text-transform:uppercase;color:var(--slate)}
.rc-grid dd{margin:0;font-family:var(--serif);line-height:1.55;color:var(--ink);overflow-wrap:anywhere}
.rc-links{margin:0;padding-left:1.1em}
.rc-links li{margin:2px 0}
.rc-note{margin:12px 0 0;font-size:.82rem;color:var(--grey)}
@media (max-width:640px){.report-card{padding:16px}.rc-grid>div{grid-template-columns:minmax(0,1fr)}}

.news-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.news-chips{display:flex;gap:8px;flex-wrap:wrap}
.chip{display:inline-block;padding:5px 12px;border-radius:999px;border:1px solid var(--line);background:#f1efe8;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#3a3f48}
.chip-out{background:#f0f7f2;border-color:#9ab6a7;color:#2f6b4a}
.plate{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-weight:700;font-size:13px;letter-spacing:.1em;padding:4px 10px;border:2px solid #1d2230;border-radius:5px;background:#fff;color:#1d2230;white-space:nowrap}
.news-head{margin-top:14px;font-family:var(--serif);font-size:clamp(20px,2.4vw,25px);font-weight:600;line-height:1.25}
.news-head a{color:inherit;text-decoration:none}
.news-head a:hover{text-decoration:underline}
.news-meta{margin-top:8px;color:var(--grey);font-size:13.5px;line-height:1.5}
.news-para{margin-top:12px;color:#363c44;font-size:15px;line-height:1.65}
.news-card .tracker-card-open{position:static;display:inline-block;margin-top:14px}
/* === court-adjudicated additions (minimal; tokens reused verbatim) === */
.tracker-extra{margin:18px 0 6px;max-width:100%}
.tracker-extra-row{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end}
.tracker-extra label{display:flex;flex-direction:column;gap:5px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--grey)}
.tracker-extra select,.tracker-extra input{border:1px solid var(--line);border-radius:999px;padding:7px 13px;background:var(--paper);color:#2E333B;font:400 12.5px var(--sans);min-width:130px;max-width:230px}
.tracker-extra input{min-width:150px}
.tracker-extra select:focus,.tracker-extra input:focus{outline:2px solid var(--slate);outline-offset:1px;border-color:var(--slate)}
#x-reset{cursor:pointer;font-family:var(--sans)}
.court-quote{margin:16px 0 0;padding:14px 18px;border-left:3px solid var(--brass);background:var(--paper-edge);font-family:var(--serif);font-size:15px;line-height:1.65;color:#2E333B}
.court-quote cite{font-family:var(--sans);font-size:12px;color:var(--grey);font-style:normal}
.source-assessment{margin:12px 0 0;font-size:12.5px;color:var(--grey)}
.incident-retracted{margin:0 0 18px;padding:14px 18px;border:1px solid var(--brass);background:var(--paper-edge)}
.incident-retracted strong{display:block;margin-bottom:4px}
.bar-details{margin:0 0 14px}
.bar-details summary{list-style:none;cursor:pointer}
.bar-details summary::-webkit-details-marker{display:none}
.bar-details summary .bar{margin-bottom:0}
.bar-details summary:focus-visible{outline:2px solid var(--slate);outline-offset:2px}
.bar-sub{margin:6px 0 10px 18px;padding-left:14px;border-left:2px solid var(--line)}
.bar-sub .bar{margin-bottom:10px}
.bar-rowline{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.bar-link{font:400 12px var(--sans);white-space:nowrap}
.ctx-table td.num,.ctx-table th.num{text-align:right;font-variant-numeric:tabular-nums}
.ctx-scale{font-size:12px;color:var(--grey)}
.record-badge.trial{background:var(--paper-edge);border:1px solid var(--brass)}
.trial-flag{display:inline-block;margin:0 0 12px;padding:6px 12px;border:1px solid var(--brass);background:var(--paper-edge);font:700 12px var(--sans);letter-spacing:.04em;text-transform:uppercase}
.show-more{display:block;margin:22px auto 0;border:1px solid var(--line);border-radius:999px;padding:10px 26px;background:var(--paper);color:#2E333B;font:600 13px var(--sans);cursor:pointer}
.show-more:hover{border-color:var(--slate)}
"""


# ---- AI / LLM access layer (regenerated on every build) ----
# Three mechanisms mirroring the reference site (short map / full text /
# structured JSON), adapted to this dataset. Every absolute URL emitted here
# uses PUBLIC_BASE (served under /copwatchindia/). Officer names are gated:
# 'display' forms only, never the raw 'name' field.

def md_esc(s):
    t = "" if s is None else str(s)
    return (t.replace("\\", "\\\\").replace("[", "\\[").replace("]", "\\]")
             .replace("<", "&lt;").replace(">", "&gt;"))


def md_cell(s):
    return md_esc(s).replace("|", "\\|").replace("\n", " ")


def md_link(text, url):
    t = ("" if text is None else str(text)).replace("[", "\\[").replace(
        "]", "\\]")
    return "[%s](%s)" % (t, url)


def officer_display(o, c=None):
    """Gated officer label: the gate's 'display' form when present, else
    rank + unit only. Never the raw 'name'. `c` (the record) picks the
    fallback noun for its service."""
    if isinstance(o, dict):
        if o.get("display"):
            return str(o["display"])
        rank = (o.get("rank") or "").strip()
        unit = (o.get("unit") or o.get("role") or "").strip()
        if rank and unit:
            return "%s, %s" % (rank, unit)
        return rank or unit or sw(c, "fallback")
    return sw(c, "fallback")


def _one_line(s, n=160):
    t = re.sub(r"\s+", " ", "" if s is None else str(s)).strip()
    return t if len(t) <= n else t[:n - 1].rstrip() + "\u2026"


def _val_list(v):
    if v is None:
        return ""
    if isinstance(v, (list, tuple)):
        return "; ".join(str(x) for x in v if x not in (None, ""))
    return str(v)


def _host(url):
    u = (url or "").strip()
    if not u.startswith("http"):
        return ""
    return re.sub(r"^https?://(www\.)?", "", u).split("/")[0]


def case_md_body(c):
    """Full case record as Markdown lines (all fields). Officer display
    forms only. Returns (lines, rendered_keys)."""
    mid = c.get("merged_id") or ""
    rid = c.get("record_id") or mid
    title = c.get("display_title") or c.get("case_title") or rid
    cat = site_category(c)
    out = OUTCOME_LABEL.get(outcome_code(c),
                            pretty_label(outcome_code(c)) or "Not stated")
    lines = []
    rendered = set()

    def row(label, value):
        if value not in (None, "", [], {}):
            lines.append("**%s:** %s" % (label, value))

    ids = rid
    if mid != rid:
        ids += " (compiler id %s)" % mid
    if c.get("merged_case_id") and c["merged_case_id"] != mid:
        ids += "; case %s" % c["merged_case_id"]
    if c.get("alias_merged_ids"):
        ids += "; aliases: %s" % _val_list(c["alias_merged_ids"])
    lines.append("**Record:** %s" % md_esc(ids))
    rendered.update(["record_id", "merged_id", "merged_case_id",
                     "alias_merged_ids"])
    row("Title", md_esc(title) if title != mid else None)
    rendered.update(["display_title", "case_title"])
    court = c.get("court") or "Court not stated"
    if c.get("court_as_verified") and c["court_as_verified"] != court:
        court += " (verified as %s)" % c["court_as_verified"]
    if c.get("bench"):
        court += "; bench: %s" % _val_list(c["bench"])
    if c.get("judges"):
        court += "; judges: %s" % _val_list(c["judges"])
    lines.append("**Court:** %s" % md_esc(court))
    rendered.update(["court", "court_as_verified", "bench", "judges"])
    ref = " / ".join(x for x in [c.get("case_number"), c.get("citation")]
                     if x) or "Not stated"
    row("Case number / citation", md_esc(ref))
    rendered.update(["case_number", "citation"])
    jd = c.get("judgment_date") or "Date not stated"
    if c.get("judgment_year"):
        jd += " (%s" % c["judgment_year"]
        if c.get("date_precision"):
            jd += ", %s precision" % c["date_precision"]
        jd += ")"
    lines.append("**Judgment:** %s" % md_esc(jd))
    idate = c.get("incident_date") or "Not stated"
    if c.get("incident_year"):
        idate += " (%s)" % c["incident_year"]
    lines.append("**Incident date:** %s" % md_esc(idate))
    rendered.update(["judgment_date", "judgment_year", "date_precision",
                     "incident_date", "incident_year"])
    place = ", ".join(x for x in [c.get("district"), c.get("state")] if x)
    if c.get("district_at_time") and c["district_at_time"] != c.get("district"):
        place += " (district at time: %s)" % c["district_at_time"]
    for k in ("city_town", "police_station_or_unit", "force"):
        if c.get(k):
            place += "; %s: %s" % (pretty_label(k), c[k])
    lines.append("**Place:** %s" % md_esc(place or "Not stated"))
    rendered.update(["district", "state", "district_at_time", "city_town",
                     "police_station_or_unit", "force"])
    lines.append("**Category:** %s" % md_esc(cat))
    lines.append("**Sub-category:** %s" % md_esc(
        c.get("subcategory_display")
        or pretty_label(c.get("subcategory")).lower() or "Not stated"))
    lines.append("**Outcome:** %s (%s)" % (
        md_esc(out), md_esc(c.get("outcome_type") or "not stated")))
    rendered.update(["category", "subcategory", "outcome_type"])
    row("Sections", md_esc(_val_list(c.get("sections"))))
    rendered.add("sections")
    offs = [officer_display(o, c) for o in (c.get("officers") or [])]
    olab = "**Officers (gated display forms):** %s" % (
        md_esc("; ".join(offs)) if offs else "None named")
    if c.get("officer_count") is not None:
        olab += " (%s in record)" % c["officer_count"]
    lines.append(olab)
    rendered.update(["officers", "officer_count", "officers_named_public"])
    vic = victim_line(c)
    if c.get("victim_count") is not None:
        vic += " (%s in record)" % c["victim_count"]
    lines.append("**Victims:** %s" % md_esc(vic))
    rendered.update(["victims", "victim_count"])
    lines.append("**Sentence / compensation:** %s"
                 % md_esc(sentence_compact(c)))
    if c.get("sentence_type"):
        lines.append("**Sentence type:** %s (%s)" % (
            md_esc(pretty_label(c["sentence_type"])),
            md_esc(c["sentence_type"])))
    rendered.update(["sentence_type", "sentence_max_years",
                     "compensation_inr"])
    lines.append("")
    lines.append(md_esc(c.get("summary") or "Summary not recorded."))
    rendered.update(["summary", "summary_verified"])
    if (c.get("verification_note") or "").strip():
        lines.append("")
        lines.append("**Holding:** %s"
                     % md_esc(c["verification_note"].strip()))
    rendered.add("verification_note")
    if (c.get("court_quote") or "").strip():
        q = c["court_quote"].strip().replace("\n", " ")
        lines.append("")
        lines.append("> %s" % md_esc(q))
    rendered.add("court_quote")
    srcs = []
    seen = set()
    for u in ([c.get("primary_source_url")]
              + list(c.get("secondary_sources") or [])):
        u = (u or "").strip()
        if not u or u in seen:
            continue
        seen.add(u)
        srcs.append(md_link(_host(u) or u, u) if u.startswith("http")
                    else md_esc(u))
    lines.append("")
    lines.append("**Sources (%d):** %s"
                 % (len(srcs), "; ".join(srcs) if srcs else "None recorded"))
    rendered.update(["primary_source_url", "secondary_sources"])
    lines.append("**Verification:** %s" % md_esc(verification_line(c)))
    revs = c.get("reviews") or []
    if revs:
        lines.append("**Review:** %s"
                     % md_esc("; ".join(
                         str(r.get("policy") or "Review")
                         for r in revs if isinstance(r, dict))))
    else:
        lines.append("**Review:** Solo Staff combined review (one combined "
                     "attestation) \u2014 not yet recorded")
    rendered.update(["verified_by", "confidence", "reviews",
                     "fidelity_checked", "fidelity_changes", "fidelity_from"])
    # Dynamic fallback: any field not explicitly rendered above is still
    # emitted, so the record always carries every field.
    for k in sorted(c.keys()):
        if k in rendered or k == "officers":
            continue
        if any(s in k for s in MD_SKIP_SUBSTRINGS):
            continue
        v = c[k]
        if v in (None, "", [], {}):
            continue
        lines.append("**%s:** %s" % (md_esc(pretty_label(k)),
                                     md_esc(_val_list(v)
                                            if not isinstance(v, dict)
                                            else json.dumps(v, ensure_ascii=False))))
    lines.append("")
    lines.append("Status: %s." % md_esc(out))
    lines.append("")
    lines.append("[Open %s](%s%s)"
                 % (md_esc(rid), PUBLIC_BASE, rec_path(c, "incident", rid)))
    return lines, rendered


def case_md_section(c):
    rid = c.get("record_id") or c.get("merged_id") or ""
    title = c.get("display_title") or c.get("case_title") or rid
    body, _ = case_md_body(c)
    return "## %s (%s)\n\n%s\n" % (md_esc(title), md_esc(rid),
                                    "\n".join(body))


def llms_txt(cases, by_state, t2=None, n_overturned=0):
    n = len(cases)
    t2 = t2 or []
    n2 = len(t2)
    states_n = len(set([c.get("state") for c in cases if c.get("state")]
                       + [r.get("state") for r in t2 if r.get("state")]))
    L = ["# " + SITE_NAME, "",
         "> %s, from %d states and union territories. %s"
         % (headline_sentence(n, n2), states_n,
            overturned_note(n_overturned)), "",
         "- [Full text](%s/llms-full.txt): the whole dataset as Markdown, "
         "one section per case." % PUBLIC_BASE,
         "- [Structured data](%s/data/cases.json): all %d cases as JSON."
         % (PUBLIC_BASE, n),
         "- [Combined data](%s/data/all-cases.json): every published "
         "record as one JSON array (HC/SC + trial-court, set-aside "
         "included; rows carry a tier field, hc_sc or trial)."
         % PUBLIC_BASE,
         "- [Tracker index](%s/data/index.json): slim table/filter fields "
         "only; single records at `/data/case/<record-id>.json`."
         % PUBLIC_BASE,
         "- [Field schema](%s/data/schema.json): every field described."
         % PUBLIC_BASE,
         "- [Dataset descriptor](%s/data/dataset.jsonld): schema.org "
         "Dataset." % PUBLIC_BASE,
         "- [Home](%s): what the project does." % PUBLIC_BASE,
         "- [Incident tracker](%s/tracker): browse and filter all records."
         % PUBLIC_BASE,
         "- [Patterns dashboard](%s/patterns): aggregate counts."
         % PUBLIC_BASE] + (
         ["- [Trial-court convictions](%s/trial-court): %d trial-court "
          "convictions (lower verification standard; appeal status shown)."
          % (PUBLIC_BASE, len(t2)),
          "- [Trial-court data](%s/data/tier2.json): all %d trial-court "
          "records as JSON (slim index: index-trial.json)."
          % (PUBLIC_BASE, len(t2))] if t2 else []) + [
         ] + ([
         "- [Know your rights](%s/rights): arrest, detention, custody."
         % PUBLIC_BASE] if "rights" in P["static_pages"] else []) + ([
         "- [Seek a remedy](%s/remedy): lawful escalation routes."
         % PUBLIC_BASE] if "remedy" in P["static_pages"] else []) + [
         "- [Methodology](%s/methodology): verification policy and "
         "definitions." % PUBLIC_BASE,
         "- [About](%s/about): the project, plus machine-access endpoints."
         % PUBLIC_BASE,
         "- [Open data](%s/data): downloadable files." % PUBLIC_BASE,
         "", "## Cases by state", ""]
    for s in STATES_36:
        clist = sorted(by_state.get(s, []),
                       key=lambda c: (c.get("judgment_date") or ""),
                       reverse=True)
        slug = slugify(s)
        L.append("### %s — %d record%s" % (
            s, len(clist), "" if len(clist) == 1 else "s"))
        L.append("- [State page](%s/state/%s): %d records."
                 % (PUBLIC_BASE, slug, len(clist)))
        L.append("- [State JSON](%s/data/state/%s.json): %d records as JSON."
                 % (PUBLIC_BASE, slug, len(clist)))
        for c in clist:
            rid = c.get("record_id") or c["merged_id"]
            title = c.get("display_title") or c.get("case_title") or rid
            one = _one_line(c.get("summary"), 140)
            tail = "%s, %s" % (c.get("court") or "court not stated",
                               c.get("judgment_year") or "year not stated")
            L.append("- [%s](%s%s): %s (%s)"
                     % (title.replace("[", "\\[").replace("]", "\\]"),
                        PUBLIC_BASE, rec_path(c, "incident", rid), one,
                        tail))
        L.append("")
    return "\n".join(L).rstrip() + "\n"


def t2_md_section(p):
    """One trial-court conviction as Markdown, same house-style fields as
    case_md_section. Officers only via their display field; no raw names."""
    cid = t2_id(p)
    title = p.get("case_title_or_number") or cid
    offs = [officer_display(o, p) for o in (p.get("officers") or [])]
    vics = [(v if isinstance(v, str)
             else (v.get("descriptor") or v.get("role") or v.get("description")
                   or "")) for v in (p.get("victims") or []) if v]
    vics = [v for v in vics if v]
    srcs = []
    for u in ([p.get("primary_source_url")]
              + list(p.get("secondary_sources") or [])):
        u = (u or "").strip()
        if not u or u in [s for s in srcs]:
            continue
        srcs.append(u)
    srclinks = "; ".join(md_link(_host(u) or u, u) if u.startswith("http")
                         else md_esc(u) for u in srcs)
    cdate = t2_date_display(p)
    if p.get("conviction_year") and str(p["conviction_year"]) not in cdate:
        cdate += " (%s)" % p["conviction_year"]
    idate = (p.get("incident_date") or "Not stated").strip()
    if p.get("incident_year"):
        idate += " (%s)" % p["incident_year"]
    L = ["## %s (%s)" % (md_esc(title), md_esc(cid)), "",
         "**Record:** %s" % md_esc(cid),
         "**Title:** %s" % md_esc(title),
         "**Court:** %s (%s)"
         % (md_esc(p.get("trial_court_name") or "Not stated"),
            md_esc(t2_court_level(p))),
         "**Case reference:** %s" % md_esc(title),
         "**Conviction:** %s" % md_esc(cdate),
         "**Incident date:** %s" % md_esc(idate),
         "**Place:** %s" % md_esc(location_short(p)),
         "**Category:** %s" % md_esc(site_category(p)),
         "**Sub-category:** %s" % md_esc(t2_subcategory(p)),
         "**Outcome:** Trial-court conviction (trial_court_conviction)",
         "**Sections:** %s"
         % (md_esc("; ".join(p.get("sections") or []))
            if p.get("sections") else "Not stated"),
         "**%s (gated display forms):** %s"
         % (sw(p, "people"),
            md_esc("; ".join(offs)) if offs else "None stated")] + ([
         "**Victims:** %s"
         % (md_esc("; ".join(vics)) if vics else "Not stated")]
         if sw(p, "show_victims") else []) + [
         "**Sentence:** %s"
         % md_esc(p.get("sentence") or "Not stated"),
         "",
         md_esc(p.get("summary") or "Summary not recorded."),
         "",
         "**Sources (%d):** %s"
         % (len(srcs), srclinks if srclinks else "None recorded"),
         "**Verification:** %s \u00b7 Trial court" % md_esc(t2_v(p)),
         "**Appeal status:** %s" % md_esc(t2_appeal(p)),
         "",
         "Status: Trial-court conviction.",
         "",
         "[Open %s](%s%s)"
         % (md_esc(cid), PUBLIC_BASE, rec_path(p, "trial-court", cid)),
         ""]
    return "\n".join(L)


def llms_full_txt(cases, t2=None, n_overturned=0):
    n = len(cases)
    t2 = t2 or []
    n2 = len(t2)
    states_n = len(set([c.get("state") for c in cases if c.get("state")]
                       + [r.get("state") for r in t2 if r.get("state")]))
    years = sorted(c.get("judgment_year") for c in cases
                   if c.get("judgment_year"))
    cyears = sorted(y for y in ((r.get("conviction_year") or t2_year(r))
                                for r in t2) if y)
    span = ("%d\u2013%d" % (years[0], years[-1]) if years
            else "unknown span")
    cspan = ("%d\u2013%d" % (cyears[0], cyears[-1]) if cyears
             else "unknown span")
    head = ("# %s\n\n%s\n\n"
            "%s, from %d states and union territories. %s "
            "High Court / Supreme Court judgments span %s; trial-court "
            "convictions span %s. Findings are attributed to "
            "the deciding court; %s adds no findings of its own. "
            "Officer names below use gated display forms (a name appears "
            "only where the two-key plus subsequent-history gate graded "
            "the officer safe; all others appear as rank and unit only). "
            "Compensation figures are amounts ordered, not amounts shown "
            "paid.\n" % (SITE_NAME, T["md_strap"],
                         headline_sentence(n, n2), states_n,
                         overturned_note(n_overturned), span, cspan,
                         SHORT_NAME))
    parts = [case_md_section(c) for c in cases]
    if t2:
        parts.append(
            "# Trial-court convictions\n\n"
            + fill(T["md_trial_intro"], n2=n2) + "\n")
        parts.extend(t2_md_section(p) for p in t2)
    return head + "\n" + "\n".join(parts)


class _HTML2MD(HTMLParser):
    """Small HTML→Markdown converter for evergreen-page twins (stdlib)."""

    def __init__(self, page_url):
        super().__init__(convert_charrefs=True)
        self.page_url = page_url
        self.page_dir = page_url.rsplit("/", 1)[0] + "/"
        self.stack = [("root", None, [])]
        self.blocks = []
        self.list_stack = []
        self.table = None
        self.skip = 0

    def _cur(self):
        return self.stack[-1][2]

    def _push(self, kind, extra=None):
        self.stack.append((kind, extra, []))

    def _pop_text(self, collapse=True):
        _kind, extra, buf = self.stack.pop()
        txt = "".join(buf)
        if collapse:
            txt = "\n".join(" ".join(p.split()) for p in txt.split("\n"))
        return txt.strip("\n").strip(), extra

    def resolve(self, href):
        h = (href or "").strip()
        if not h:
            return ""
        if h.startswith(("http://", "https://", "mailto:")):
            return h
        if h.startswith("#"):
            return self.page_url + h
        if h.startswith("@ROOT@"):          # cross-watch: site-root path
            return SITE_ORIGIN + h[len("@ROOT@"):]
        if h.startswith("/"):
            return PUBLIC_BASE + h
        return self.page_dir + h

    def _flush_para(self, text):
        if text:
            self.blocks.append(text)

    # -- block tags --
    def handle_starttag(self, tag, attrs):
        at = dict(attrs)
        if tag in ("script", "style"):
            self.skip += 1
        elif tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            self._push("h" + tag[1])
        elif tag == "p":
            self._push("p")
        elif tag == "li":
            self._push("li")
        elif tag in ("ul", "ol"):
            self.list_stack.append([tag, 0])
        elif tag == "br":
            self._cur().append("\n")
        elif tag == "hr":
            self.blocks.append("---")
        elif tag == "blockquote":
            self._push("quote")
        elif tag == "pre":
            self._push("pre")
        elif tag == "table":
            self.table = {"rows": [], "row": None, "cell": None,
                          "head": False}
        elif tag == "tr" and self.table is not None:
            self.table["row"] = []
        elif tag in ("th", "td") and self.table is not None:
            self.table["cell"] = []
            if tag == "th":
                self.table["head"] = True
        elif tag == "a":
            self._push("a", at.get("href", ""))
        elif tag in ("strong", "b"):
            self._push("strong")
        elif tag in ("em", "i"):
            self._push("em")
        elif tag == "code":
            self._push("code")
        elif tag == "img":
            alt = (at.get("alt") or "").strip()
            if alt:
                self._cur().append(alt)

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.skip = max(0, self.skip - 1)
        elif tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            txt, _x = self._pop_text()
            if txt:
                self.blocks.append("#" * int(tag[1]) + " " + txt)
        elif tag == "p":
            txt, _x = self._pop_text()
            self._flush_para(txt)
        elif tag == "li":
            txt, _x = self._pop_text()
            if txt:
                depth = max(0, len(self.list_stack) - 1)
                if self.list_stack and self.list_stack[-1][0] == "ol":
                    self.list_stack[-1][1] += 1
                    bullet = "%d." % self.list_stack[-1][1]
                else:
                    bullet = "-"
                pad = "  " * depth
                first, _, rest = txt.partition("\n")
                out = pad + bullet + " " + first
                if rest:
                    out += "\n" + rest
                self.blocks.append(out)
        elif tag in ("ul", "ol"):
            if self.list_stack:
                self.list_stack.pop()
        elif tag == "blockquote":
            txt, _x = self._pop_text()
            if txt:
                self.blocks.append("\n".join("> " + p for p in txt.split("\n")))
        elif tag == "pre":
            txt, _x = self._pop_text(collapse=False)
            self.blocks.append("```\n" + txt + "\n```")
        elif tag == "table" and self.table is not None:
            rows = self.table["rows"]
            if rows:
                width = max(len(r) for r in rows)
                norm = [r + [""] * (width - len(r)) for r in rows]
                md = ["| " + " | ".join(md_cell(x) for x in norm[0]) + " |",
                      "|" + "|".join(["---"] * width) + "|"]
                for r in norm[1:]:
                    md.append("| " + " | ".join(md_cell(x) for x in r) + " |")
                self.blocks.append("\n".join(md))
            self.table = None
        elif tag == "tr" and self.table is not None:
            if self.table["row"] is not None:
                self.table["rows"].append(self.table["row"])
            self.table["row"] = None
        elif tag in ("th", "td") and self.table is not None:
            if self.table["cell"] is not None:
                txt = " ".join("".join(self.table["cell"]).split())
                self.table["row"].append(txt)
            self.table["cell"] = None
        elif tag == "a":
            txt, href = self._pop_text()
            if txt:
                self._cur().append("[%s](%s)" % (
                    txt.replace("[", "\\[").replace("]", "\\]"),
                    self.resolve(href)))
        elif tag in ("strong", "b"):
            txt, _x = self._pop_text()
            self._cur().append("**%s**" % txt if txt else "")
        elif tag in ("em", "i"):
            txt, _x = self._pop_text()
            self._cur().append("*%s*" % txt if txt else "")
        elif tag == "code":
            # inside pre this stays raw text; outside, backticks
            txt, _x = self._pop_text()
            in_pre = any(k == "pre" for k, _, _ in self.stack)
            self._cur().append("`%s`" % txt if txt and not in_pre else txt)

    def handle_startendtag(self, tag, attrs):
        if tag == "br":
            self._cur().append("\n")
        elif tag == "hr":
            self.blocks.append("---")
        elif tag == "img":
            alt = (dict(attrs).get("alt") or "").strip()
            if alt:
                self._cur().append(alt)

    def handle_data(self, data):
        if self.skip:
            return
        if self.table is not None and self.table.get("cell") is not None:
            self.table["cell"].append(data)
            return
        in_pre = any(k == "pre" for k, _, _ in self.stack)
        if not in_pre and not data.strip():
            self._cur().append(" ")
            return
        self._cur().append(data)


def html_main_to_md(main_html, page_url):
    cv = _HTML2MD(page_url)
    cv.feed(main_html)
    cv.close()
    out = []
    for b in cv.blocks:
        b = b.strip()
        if b:
            out.append(b)
    return "\n\n".join(out) + "\n"


def md_evergreen(title, path, main_html):
    url = PUBLIC_BASE + path
    body = html_main_to_md(main_html, url)
    return ("# %s\n\nHTML version: %s\n\n%s"
            % (md_esc(title), md_link(url, url), body))


def md_home(cases, by_state, t2=None, n_overturned=0):
    n = len(cases)
    t2 = t2 or []
    n2 = len(t2)
    total = n + n2
    states_n = len(set([c.get("state") for c in cases if c.get("state")]
                       + [r.get("state") for r in t2 if r.get("state")]))
    L = ["# " + T["md_home_title"], "",
         "HTML version: %s" % md_link(PUBLIC_BASE, PUBLIC_BASE),
         "", T["slogan"], "",
         fill(T["md_home_lede"], headline=headline_sentence(n, n2),
              overturned=overturned_note(n_overturned)), "",
         "- %s" % md_link("Incident tracker (%s records)"
                          % fmt_thousands(total),
                          PUBLIC_BASE + "/tracker"),
         "- %s" % md_link("Trial-court convictions (%d records)" % n2,
                          PUBLIC_BASE + "/trial-court"),
         "- %s" % md_link("Patterns dashboard", PUBLIC_BASE + "/patterns"),
         ] + (["- %s" % md_link("Know your rights", PUBLIC_BASE + "/rights")]
              if "rights" in P["static_pages"] else []) + (
             ["- %s" % md_link("Seek a remedy", PUBLIC_BASE + "/remedy")]
              if "remedy" in P["static_pages"] else []) + [
         "- %s" % md_link("Methodology", PUBLIC_BASE + "/methodology"),
         "- %s" % md_link("About", PUBLIC_BASE + "/about"),
         "- %s" % md_link("Open data", PUBLIC_BASE + "/data"), "",
         "## Records by state (%d states and UTs with records)" % states_n,
         ""]
    for s in STATES_36:
        k = len(by_state.get(s, []))
        L.append("- %s — %d record%s"
                 % (md_link(s, PUBLIC_BASE + "/state/" + slugify(s)),
                    k, "" if k == 1 else "s"))
    L.append("")
    return "\n".join(L)


def md_tracker(cases, t2=None, n_overturned=0):
    n = len(cases)
    t2 = t2 or []
    n2 = len(t2)
    states = sorted(set(
        [c.get("state", "") for c in cases if c.get("state")]
        + [r.get("state", "") for r in t2 if r.get("state")]))
    L = ["# Incident tracker — " + SITE_NAME, "",
         "HTML version: %s"
         % md_link(PUBLIC_BASE + "/tracker", PUBLIC_BASE + "/tracker"), "",
         ("Browse %s. %s Each record documents a "
          "court judgment or trial-court conviction; findings are "
          "attributed to the deciding court. "
          "The human page filters client-side over %s (both tiers; rows "
          "carry a `tier` field: `hc_sc` or `trial`); agents should use "
          "that JSON, the per-state slices, the per-record endpoints "
          "(`/data/case/<record-id>.json`), or llms-full.txt directly."
          % (headline_sentence(n, n2), overturned_note(n_overturned),
             md_link("index.json",
                     PUBLIC_BASE + "/data/index.json"))),
         "", "## Saved filter views", ""]
    for val, label in FILTER_MAIN + FILTER_MORE:
        url = PUBLIC_BASE + "/tracker" + ("?filter=%s" % val if val else "")
        L.append("- %s" % md_link(label, url))
    L += ["", "## Browse by state", ""]
    for s in states:
        k = (sum(1 for c in cases if c.get("state") == s)
             + sum(1 for r in t2 if r.get("state") == s))
        L.append("- %s — %d record%s"
                 % (md_link(s, PUBLIC_BASE + "/state/" + slugify(s)),
                    k, "" if k == 1 else "s"))
    L.append("")
    return "\n".join(L)


def md_patterns(cases, t2cases=None, context=None, n_overturned=0):
    n = len(cases)
    t2cases = t2cases or []
    n2 = len(t2cases)
    by_cat = Counter(site_category(c) for c in cases)
    by_sub = Counter(
        ((c.get("subcategory_display") or "").strip()
         or pretty_label(c.get("subcategory")).lower())
        for c in cases)
    by_out = Counter(c.get("outcome_type", "") for c in cases)
    by_state = Counter(c.get("state", "") for c in cases if c.get("state"))
    by_dec = Counter("%ds" % (c["judgment_year"] // 10 * 10) for c in cases
                     if c.get("judgment_year"))
    n_v3 = sum(1 for c in cases if v_level(c) == "V3")
    L = ["# Patterns dashboard — " + SITE_NAME, "",
         "HTML version: %s"
         % md_link(PUBLIC_BASE + "/patterns", PUBLIC_BASE + "/patterns"), "",
         ("Aggregates drawn from %s. %s Counts show recorded "
          "allegations regardless of their individual evidence position; "
          "they are not counts of proven misconduct. These records are "
          "not a representative sample. The human page offers a tier "
          "toggle (All / HC-SC / Trial court)."
          % (headline_sentence(n, n2), overturned_note(n_overturned))),
         "", "## By category", ""]
    for k in SITE_CATEGORIES:
        if by_cat.get(k):
            L.append("- %s: %d" % (k, by_cat[k]))
    L += ["", "## By outcome", ""]
    for k, v in sorted(by_out.items(), key=lambda kv: -kv[1]):
        L.append("- %s: %d" % (OUTCOME_LABEL.get(k, pretty_label(k)), v))
    L += ["", "## By state", ""]
    for k, v in sorted(by_state.items(), key=lambda kv: (-kv[1], kv[0])):
        L.append("- %s: %d" % (k, v))
    L += ["", "## By decade of judgment", ""]
    for k, v in sorted(by_dec.items()):
        L.append("- %s: %d" % (k, v))
    L += ["", "## Verification",
          "", "- V3 (at least one material fact independently corroborated): %d" % n_v3,
          "- V2 (an attributable claim or public record has been reviewed): %d" % (n - n_v3),
          "", "## Follow-up",
          "", "- Followed up: %d"
          % sum(1 for c in cases if is_checked(c)),
          "- Never re-checked: %d"
          % sum(1 for c in cases if is_never_checked(c)),
          "- Stale checks: %d"
          % sum(1 for c in cases if is_stale(c))]
    if t2cases:
        t2_by_cat = Counter(site_category(r) for r in t2cases)
        t2_by_sub = Counter(t2_subcategory(r) for r in t2cases)
        L += ["", "## Trial-court convictions by category",
              "", "(%d trial-court convictions; lower verification standard "
              "than the tracker above.)" % len(t2cases), ""]
        for k in SITE_CATEGORIES:
            if t2_by_cat.get(k):
                L.append("- %s: %d" % (k, t2_by_cat[k]))
        L += ["", "## Trial-court convictions by sub-category", ""]
        for k, v in sorted(t2_by_sub.items(), key=lambda kv: (-kv[1], kv[0])):
            if k:
                L.append("- %s: %d" % (k, v))
    series = (context or {}).get("series") or []
    india = [x for x in series if x.get("state") == "India"]
    if india:
        L += ["", "## Complaints vs convictions (NCRB, all-India)", "",
              "(National context from NCRB Crime in India; not %s "
              "records. Latest year available per series.)" % SHORT_NAME, ""]
        for metric, label in (
                ("ncrb_complaints_received_against_police",
                 "Complaints received"),
                ("ncrb_cases_registered_against_police",
                 "Cases registered"),
                ("ncrb_police_personnel_chargesheeted",
                 "Personnel charge-sheeted"),
                ("ncrb_police_personnel_convicted",
                 "Personnel convicted"),
                ("ncrb_custodial_deaths_total", "Custodial deaths"),
                ("ncrb_custodial_police_convicted",
                 "Custodial convictions")):
            rows = [x for x in india if x.get("metric") == metric]
            if rows:
                last = max(rows, key=lambda x: x.get("year") or 0)
                L.append("- %s (%d): %s" % (label, last.get("year"),
                                            fmt_num(last.get("value"))))
    L.append("")
    return "\n".join(L)


def md_state_page(state, clist):
    slug = slugify(state)
    url = PUBLIC_BASE + "/state/" + slug
    L = ["# %s — %d record%s" % (state, len(clist),
                                 "" if len(clist) == 1 else "s"), "",
         "HTML version: %s" % md_link(url, url),
         "State JSON: %s" % md_link(PUBLIC_BASE + "/data/state/%s.json" % slug,
                                    PUBLIC_BASE + "/data/state/%s.json" % slug),
         ""]
    if not clist:
        L += [("No qualifying judgment located yet for %s. Absence from "
               "this dataset is not evidence of absence." % state), ""]
        return "\n".join(L)
    for c in sorted(clist, key=lambda c: (c.get("judgment_date") or ""),
                    reverse=True):
        rid = c.get("record_id") or c["merged_id"]
        title = c.get("display_title") or c.get("case_title") or rid
        L.append("- [%s](%s%s): %s, %s — %s"
                 % (title.replace("[", "\\[").replace("]", "\\]"),
                    PUBLIC_BASE, rec_path(c, "incident", rid),
                    c.get("court") or "court not stated",
                    c.get("judgment_year") or "year not stated",
                    _one_line(c.get("summary"), 140)))
    L.append("")
    return "\n".join(L)


def md_trialcourt_index(t2, by_state):
    n = len(t2)
    url = PUBLIC_BASE + "/trial-court"
    ap = Counter((r.get("appeal_status") or "unknown") for r in t2)
    L = ["# Trial-court convictions — " + SITE_NAME, "",
         "HTML version: %s" % md_link(url, url), "",
         (fill(T["md_trial_index"], n=n) + " These are NOT High Court or "
          "Supreme Court findings; each record shows verification status "
          "and appeal status. Upheld: %d. Set aside: %d. Pending: %d. No "
          "appeal known: %d. Unknown: %d."
          % (ap.get("upheld", 0), ap.get("set_aside", 0),
             ap.get("pending", 0), ap.get("none_known", 0),
             ap.get("unknown", 0))),
         "", "## Browse by state", ""]
    for s in sorted(by_state, key=lambda s: (-len(by_state[s]), s)):
        k = len(by_state[s])
        L.append("- %s — %d record%s"
                 % (md_link(s, PUBLIC_BASE + "/trial-court/" + slugify(s)),
                    k, "" if k == 1 else "s"))
    L.append("")
    return "\n".join(L)


def md_trialcourt_state(state, clist):
    slug = slugify(state)
    url = PUBLIC_BASE + "/trial-court/" + slug
    L = ["# %s — %d trial-court conviction%s" % (state, len(clist),
                                                 "" if len(clist) == 1
                                                 else "s"), "",
         "HTML version: %s" % md_link(url, url), ""]
    if not clist:
        L += [("No qualifying trial-court conviction located yet for %s. "
               "Absence from this dataset is not evidence of absence."
               % state), ""]
        return "\n".join(L)
    for r in sorted(clist, key=lambda r: (t2_iso_date(r.get(
            "conviction_date")), t2_id(r)), reverse=True):
        cid = t2_id(r)
        title = r.get("case_title_or_number") or cid
        L.append("- [%s](%s%s): %s, convicted %s — appeal: %s"
                 % (title.replace("[", "\\[").replace("]", "\\]"),
                    PUBLIC_BASE, rec_path(r, "trial-court", cid),
                    r.get("trial_court_name") or "court not stated",
                    t2_date_display(r, "date not stated"),
                    t2_appeal(r)))
    L.append("")
    return "\n".join(L)


def md_trialcourt_record(p):
    cid = t2_id(p)
    title = p.get("case_title_or_number") or cid
    url = PUBLIC_BASE + "/trial-court/" + cid
    officers = [officer_display(o, p) for o in (p.get("officers") or [])]
    L = ["# %s" % md_esc(title), "",
         "HTML version: %s" % md_link(url, url),
         "Record JSON: %s" % md_link(
             PUBLIC_BASE + "/data/case/%s.json" % cid,
             PUBLIC_BASE + "/data/case/%s.json" % cid), "",
         "Trial-court conviction (%s; %s). Convicted %s. Appeal status: %s."
         % (md_esc(p.get("trial_court_name") or "court not stated"),
            md_esc(t2_court_level(p)),
            md_esc(t2_date_display(p, "date not stated")),
            md_esc(t2_appeal(p))), "",
         "## Summary", "", md_esc(p.get("summary") or "Not recorded."), ""]
    L += report_card_md(p, "trial")
    L += ["## At a glance", "",
         "- Category: %s" % md_esc(site_category(p)),
         "- Sub-category: %s" % md_esc(t2_subcategory(p)),
         "- Location: %s" % md_esc(location_short(p)),
         "- Officers: %s" % (md_esc("; ".join(officers))
                             if officers else "None stated"),
         "- Sentence: %s" % md_esc(p.get("sentence") or "Not stated"),
         "- Verification: %s · Trial court" % md_esc(t2_v(p)), ""]
    return "\n".join(L)


def md_incident(c):
    rid = c.get("record_id") or c["merged_id"]
    title = c.get("display_title") or c.get("case_title") or rid
    url = PUBLIC_BASE + "/incident/" + rid
    body, _ = case_md_body(c)
    body = report_card_md(c, "hc") + list(body)
    return ("# %s\n\nHTML version: %s\n\n%s\n"
            % (md_esc(title), md_link(url, url), "\n".join(body)))


def md_data_page(n_cases, files, n1=None, n2=None, n_overturned=0):
    n1 = n1 if n1 is not None else n_cases
    n2 = n2 or 0
    L = ["# Download the dataset — " + SITE_NAME, "",
         "HTML version: %s" % md_link(PUBLIC_BASE + "/data",
                                      PUBLIC_BASE + "/data"), "",
         ("%s, rebuilt %s. %s "
          "Free to reuse with attribution to %s."
          % (headline_sentence(n1, n2), BUILD_DATE,
             overturned_note(n_overturned), SITE_NAME)), "", "## Files", ""]
    for name, size, note in files:
        L.append("- [%s](%s/data/%s) (%s): %s"
                 % (name, PUBLIC_BASE, name, human_size(size), note))
    L += ["",
          "Per-state slices live at `/data/state/<state-slug>.json` "
          "(36 files, one per state/UT, same record shape as cases.json). "
          "Single records at `/data/case/<record-id>.json`; the slim "
          "tracker index at `/data/index.json` (both tiers; rows carry a "
          "`tier` field, `hc_sc` or `trial`). Trial-court convictions at "
          "`/data/tier2.json` (slim slice: `/data/index-trial.json`).",
          "", "Field definitions: %s"
          % md_link("schema.json", PUBLIC_BASE + "/data/schema.json"), ""]
    return "\n".join(L)


# Curated descriptions for every record field (top level + officers.* +
# victims.* + gate extras). Observed-but-undocumented fields get a generic
# entry at build time so coverage stays complete.
FIELD_DOCS = {
    "record_id": "Public record ID (CW-YYYY-NNNN). Record URLs are "
                 "/incident/CW-YYYY-NNNN.",
    "merged_id": "Compiler record key (CWC-NNNN). One record per judgment; "
                 "kept for traceability, not used in public URLs.",
    "merged_case_id": "Internal compiler case key, usually equal to merged_id.",
    "alias_merged_ids": "Older IDs merged into this record after dedup.",
    "display_title": "Short human-readable case title used on the site.",
    "case_title": "Full case title as given in the judgment.",
    "court": "Deciding court (Supreme Court of India or a High Court).",
    "court_as_verified": "Court name as the verifier recorded it, when it differs.",
    "bench": "Bench strength / composition notes, if recorded.",
    "judges": "Judges on the bench, if recorded.",
    "case_number": "Court case number (appeal / petition / suit number).",
    "citation": "Law-report citation (SCC / AIR / other neutral cite).",
    "judgment_date": "Date of judgment, ISO 8601 (YYYY-MM-DD).",
    "date_precision": "'day' normally; 'month' where only month is known.",
    "judgment_year": "Calendar year of the judgment.",
    "incident_date": "Date of the underlying incident, ISO 8601, if known.",
    "incident_year": "Calendar year of the underlying incident, if known.",
    "state": "State / union territory of the incident (present-day).",
    "district": "Present-day district of the incident, if known.",
    "district_at_time": "District name at the time, when it differs.",
    "city_town": "City / town / village, if recorded.",
    "police_station_or_unit": "Police station or unit involved, if recorded.",
    "force": "Police force (e.g. state police, special cell), if recorded.",
    "category": "Site category: " + " | ".join(SITE_CATEGORIES) + ".",
    "subcategory": "Internal house sub-category code (twelve values).",
    "outcome_type": "One of five controlled outcome values.",
    "sections": "Statutes / sections invoked, as recorded.",
    "officers": "Police personnel in the record. Raw 'name' is gated: "
                 "consumers must use 'display' (safe label) and 'name_public' "
                 "(name only when publish_grade is named_safe).",
    "officers.name": "Raw officer name as recorded. GATED: do not publish "
                      "unless publish_grade is 'named_safe'; use 'display'.",
    "officers.rank": "Officer rank, if recorded.",
    "officers.unit": "Officer unit / posting; may carry 'role' instead.",
    "officers.display": "Gated safe label: name (+rank) when named_safe, "
                         "else rank + unit only.",
    "officers.name_public": "Officer name when publish_grade is named_safe, else null.",
    "officers.publish_grade": "'named_safe' or 'unnamed' (officer-naming gate).",
    "officers.gate_reasons": "Why the officer was unnamed, if applicable.",
    "officers.ledger_role": "Ledger role_in_judgment used by the gate.",
    "officers.key2": "Second-key confirmation answer used by the gate.",
    "officers.later_outcome": "Later appellate outcome, if any.",
    "officer_count": "Number of officers in the record.",
    "officers_named_public": "How many officers are graded named_safe.",
    "victims": "Victims as recorded in the judgment (name/age/gender).",
    "victims.name": "Victim name as recorded, if stated.",
    "victims.age": "Victim age, if stated.",
    "victims.gender": "Victim gender, if stated.",
    "victim_count": "Number of victims in the record.",
    "sentence_type": "Sentence imposed on convicted personnel, if any.",
    "sentence_max_years": "Maximum sentence length in years, if applicable.",
    "compensation_inr": "Compensation ordered in rupees (ordered, not shown paid).",
    "summary": "Verified summary text of the case.",
    "verification_note": "Verifier holding: what the court found.",
    "court_quote": "Verbatim extract from the judgment.",
    "court_quote_para": "Paragraph number of the verbatim extract, if known.",
    "primary_source_url": "Primary source: judgment text URL.",
    "secondary_sources": "Further source URLs (judgment mirrors, newsroom).",
    "verified_by": "Verification agent IDs that reviewed the record.",
    "confidence": "Verifier confidence: high | medium.",
    "fidelity_checked": "True once a fidelity check re-read the judgment (V3).",
    "flagged": "True if the record needs review (excluded from v1).",
    "retracted": "True if the record was withdrawn.",
    "adversarial": "Adversarial-review marker from the compiler, if any.",
    "record_flag": "Gate record flag (e.g. review_remove), if any.",
    "admin_category": "Compiler admin category (workflow copy of category).",
    "admin_subcategory": "Compiler admin sub-category (workflow copy).",
    "allegations": "Structured allegation/position items from verification.",
    "anonymised": "True when the record has been through anonymisation.",
    "authenticity_check": "Authenticity-check record, when present.",
    "corrections": "Published corrections to this record, when present.",
    "display_title_redacted": "Redacted display title safe for publication.",
    "docket_title_nonpublic": "NONPUBLIC docket title. Present in JSON only; "
                              "withheld from text endpoints.",
    "editor_notes": "Internal editor notes, when present.",
    "fidelity_changes": "What the fidelity check reconciled, when present.",
    "fidelity_from": "Fidelity-check source reference, when present.",
    "followup_history": "Dated follow-up checks, when present.",
    "followup_status": "Follow-up state (e.g. never_checked).",
    "institutional_response": "Structured institutional-action items.",
    "last_checked": "Date of the latest follow-up check, when present.",
    "legal_review": "Legal-review record, when present.",
    "link_checked_per_url": "Per-URL link-check results.",
    "privacy_review": "Privacy-review record, when present.",
    "protest_override_heuristic": "Compiler heuristic marker, if set.",
    "publication_basis": "Publication-basis record, when present.",
    "reviews": "Review records attached to the case, when present.",
    "source_assessment": "Source-reliability assessment object.",
    "subcategory_display": "Display label for the sub-category.",
    "summary_verified": "Verifier-approved summary text.",
    "tier": "Publication tier label (Tier A / Tier B).",
    "tier_history": "Tier changes over time.",
    "v3_basis": "Basis recorded for V3 status, when present.",
    "verdict": "Resolved verification verdict (accept for all published).",
    "verdict_note": "Note explaining the verification verdict.",
    "verification_status": "Verification level (V2, or V3 once checked).",
    "victims_legal_names_nonpublic": "NONPUBLIC victim legal names. Present "
                                     "in JSON only; withheld from text endpoints.",
    "victims_redacted": "Redacted victim descriptors safe for publication.",
}

# Fields withheld from Markdown/text endpoints: non-public legal-name
# stores plus internal pipeline fields (verifier chunk ids, fidelity flags,
# confidence, adversarial markers). Internal fields never render on public
# pages (R93); the shipped JSON carries the same redacted records.
MD_SKIP_SUBSTRINGS = ("nonpublic", "verified_by", "fidelity", "confidence",
                      "flagged", "adversarial", "protest_override_heuristic")

CONTROLLED_ENUMS = {
    "category": list(SITE_CATEGORIES),
    "outcome_type": ["adverse_finding_compensation", "conviction_upheld",
                     "conviction_by_hc", "conviction_by_sc",
                     "disciplinary_upheld"],
    "subcategory": ["custodial_death", "custodial_torture",
                    "custodial_rape_sexual_assault",
                    "fake_encounter_extrajudicial_killing",
                    "enforced_disappearance", "disproportionate_force",
                    "illegal_detention_false_imprisonment",
                    "false_implication_fabrication",
                    "dereliction_evidence_tampering", "bribery_pc_act",
                    "extortion", "other"],
    "confidence": ["high", "medium"],
    "date_precision": ["day", "month"],
}


def _infer_type(values):
    kinds = set()
    for v in values:
        if v is None:
            kinds.add("null")
        elif isinstance(v, bool):
            kinds.add("boolean")
        elif isinstance(v, int):
            kinds.add("integer")
        elif isinstance(v, float):
            kinds.add("number")
        elif isinstance(v, list):
            kinds.add("array")
        elif isinstance(v, dict):
            kinds.add("object")
        else:
            kinds.add("string")
    kinds.discard("null")
    if not kinds:
        return "null"
    if len(kinds) == 1:
        return kinds.pop()
    return sorted(kinds)


TIER2_FIELD_DOCS = {
    "case_id": "Public trial-court record ID. Record URLs are "
               "/trial-court/<case_id>.",
    "alias_case_ids": "Older IDs merged into this record after dedup.",
    "verification_status": "Verification level (V1, V1+, or V2). "
                           "Trial-court records verify to a lower standard "
                           "than High Court / Supreme Court records.",
    "gate_status": "Officer-gate status for this record.",
    "state": "State / union territory of the case (present-day).",
    "district": "Present-day district, if known.",
    "court": "Convicting court as recorded in the source.",
    "court_level": "One of special_acb | cbi_court | sessions | "
                   "magistrate | lokayukta_court.",
    "trial_court_name": "Full name of the convicting trial court.",
    "case_title": "Case title as given in the source.",
    "case_title_or_number": "Display title / case reference used on site.",
    "case_number": "Court case number, if stated.",
    "conviction_date": "Date of conviction as stated in the source "
                       "(prose or ISO; normalised to ISO in index.json).",
    "conviction_year": "Calendar year of the conviction.",
    "date_precision": "'day' normally; 'month'/'year' where less is known.",
    "incident_date": "Date of the underlying incident, if known.",
    "incident_year": "Calendar year of the underlying incident, if known.",
    "category": "Site category (usually Other for trial convictions).",
    "subcategory": "House sub-category code (e.g. bribery_pc_act).",
    "outcome_type": "Always trial_court_conviction for this tier.",
    "officers": "Convicted police personnel. Gated like tier 1: consumers "
                "must use 'display' and 'name_public' (name only when "
                "publish_grade is named_safe).",
    "victims": "Victims / complainants as recorded, if stated.",
    "sections": "Statutes / sections of conviction, as recorded.",
    "sentence": "Sentence as stated in the source.",
    "sentence_type": "Sentence type, if coded.",
    "sentence_max_years": "Maximum sentence length in years, if coded.",
    "appeal_status": "One of upheld | set_aside | pending | none_known | "
                     "unknown, as known from the cited sources.",
    "appeal_url": "Appeal judgment URL, when located.",
    "source_kind": "Kind of the primary source: press_release | judgment "
                   "| list | news.",
    "primary_source_url": "Primary source URL.",
    "secondary_sources": "Further source URLs.",
    "summary": "Verified summary text of the conviction.",
    "court_quote": "Verbatim extract, when recorded.",
    "confidence": "Verifier confidence: high | medium.",
    "tier": "Publication tier label for this record.",
}


def build_schema(cases, t2cases=None, n1=None, n2=None, n_overturned=0):
    t2cases = t2cases or []
    n1 = len(cases) if n1 is None else n1
    n2 = len(t2cases) if n2 is None else n2
    observed = {}
    for c in cases:
        for k, v in c.items():
            observed.setdefault(k, []).append(v)
    off_obs = {}
    for c in cases:
        for o in (c.get("officers") or []):
            if isinstance(o, dict):
                for k, v in o.items():
                    off_obs.setdefault(k, []).append(v)
    vic_obs = {}
    for c in cases:
        for v in (c.get("victims") or []):
            if isinstance(v, dict):
                for k, val in v.items():
                    vic_obs.setdefault(k, []).append(val)
    props = {}
    for k in sorted(set(observed) | {x for x in FIELD_DOCS
                                     if "." not in x}):
        # Input-only stores never appear in the public schema (P0-3: a
        # dist-wide grep for _nonpublic must be clean).
        if k.endswith("_nonpublic"):
            continue
        entry = {"type": _infer_type(observed.get(k, []))}
        entry["description"] = FIELD_DOCS.get(
            k, "Observed in data; no curated description yet.")
        if k in CONTROLLED_ENUMS:
            entry["enum"] = CONTROLLED_ENUMS[k]
        if k == "officers":
            oprops = {}
            for ok in sorted(set(off_obs) | {x[9:] for x in FIELD_DOCS
                                             if x.startswith("officers.")}):
                vals = off_obs.get(ok, [])
                oprops[ok] = {
                    "type": _infer_type(vals) if vals else "string",
                    "description": FIELD_DOCS.get(
                        "officers." + ok,
                        "Observed in data; no curated description yet.")}
            entry["items"] = {"type": "object", "properties": oprops}
        if k == "victims":
            entry["items"] = {
                "type": "object",
                "properties": {
                    vk: {"type": _infer_type(vv),
                         "description": FIELD_DOCS.get(
                             "victims." + vk,
                             "Observed in data; no curated description yet.")}
                    for vk, vv in sorted(vic_obs.items())},
            }
        props[k] = entry
    t2_obs = {}
    for r in t2cases:
        for k, v in r.items():
            t2_obs.setdefault(k, []).append(v)
    t2props = {}
    for k in sorted(set(t2_obs) | set(TIER2_FIELD_DOCS)):
        if k.endswith("_nonpublic"):
            continue
        t2props[k] = {
            "type": _infer_type(t2_obs.get(k, [])),
            "description": TIER2_FIELD_DOCS.get(
                k, "Observed in data; no curated description yet.")}
    return {
        "$schema": "https://json-schema.org/draft/07/schema#",
        "$id": PUBLIC_BASE + "/data/schema.json",
        "title": SITE_NAME + " court-adjudicated cases — record schema",
        "description": ("%s. %s One object per judgment in cases.json; "
                        "one object per conviction in tier2.json. Officer "
                        "names are gated: use officers[].display, never "
                        "officers[].name, unless officers[].publish_grade "
                        "is 'named_safe'."
                        % (headline_sentence(n1, n2),
                           overturned_note(n_overturned))),
        "type": "array",
        "items": {"type": "object", "required": ["merged_id"],
                  "properties": props},
        "tier2": {
            "description": ("Trial-court conviction record shape "
                            "(data/tier2.json, one object per conviction; "
                            "record URLs /trial-court/<case_id>)."),
            "type": "array",
            "items": {"type": "object", "required": ["case_id"],
                      "properties": t2props},
        },
        "tracker_index": {
            "description": ("Slim tracker rows (data/index.json, both "
                            "tiers; data/index-trial.json carries the "
                            "trial-court slice). Short keys; every row "
                            "carries a tier field."),
            "tier": {"type": "string", "enum": ["hc_sc", "trial"],
                     "description": "Court tier of the row: hc_sc for High "
                                    "Court / Supreme Court judgments, trial "
                                    "for trial-court convictions."},
        },
        "combined": {
            "description": ("Every published record as one JSON array "
                            "(data/all-cases.json: HC/SC gated records + "
                            "trial-court current + set-aside, full record "
                            "shapes). Rows carry a tier field with the "
                            "tracker_index vocabulary (hc_sc or trial); "
                            "the verification Tier A/B string is replaced "
                            "by it and stays derivable from "
                            "verification_status."),
            "tier": {"type": "string", "enum": ["hc_sc", "trial"],
                     "description": "Dataset origin of the row: hc_sc for "
                                    "High Court / Supreme Court records, "
                                    "trial for trial-court convictions "
                                    "(including appeal_status=set_aside)."},
        },
        "controlled_vocabularies": {
            k: {"values": v,
                "counts": {x: sum(1 for c in cases if c.get(k) == x)
                           for x in v}}
            for k, v in CONTROLLED_ENUMS.items()},
        "generated": BUILD_DATE,
    }


def build_dataset_meta(cases, t2cases=None, n_overturned=0):
    n = len(cases)
    t2cases = t2cases or []
    n2 = len(t2cases)
    states = sorted(set([c.get("state") for c in cases if c.get("state")]
                        + [r.get("state") for r in t2cases
                           if r.get("state")]))
    years = sorted(y for y in ([c.get("judgment_year") for c in cases]
                               + [(r.get("conviction_year") or t2_year(r))
                                  for r in t2cases]) if y)
    dist = [
        {"@type": "DataDownload", "name": "cases.json",
         "contentUrl": PUBLIC_BASE + "/data/cases.json",
         "encodingFormat": "application/json"},
        {"@type": "DataDownload", "name": "tier2.json",
         "contentUrl": PUBLIC_BASE + "/data/tier2.json",
         "encodingFormat": "application/json"},
        {"@type": "DataDownload", "name": "index.json",
         "contentUrl": PUBLIC_BASE + "/data/index.json",
         "encodingFormat": "application/json"},
        {"@type": "DataDownload", "name": "index-trial.json",
         "contentUrl": PUBLIC_BASE + "/data/index-trial.json",
         "encodingFormat": "application/json"},
        {"@type": "DataDownload", "name": "all-cases.json",
         "contentUrl": PUBLIC_BASE + "/data/all-cases.json",
         "encodingFormat": "application/json"},
        {"@type": "DataDownload", "name": "cases.csv",
         "contentUrl": PUBLIC_BASE + "/data/cases.csv",
         "encodingFormat": "text/csv"},
        {"@type": "DataDownload", "name": "schema.json",
         "contentUrl": PUBLIC_BASE + "/data/schema.json",
         "encodingFormat": "application/schema+json"},
    ]
    for s in STATES_36:
        dist.append({"@type": "DataDownload",
                     "name": "state/%s.json" % slugify(s),
                     "contentUrl": PUBLIC_BASE + "/data/state/%s.json"
                     % slugify(s),
                     "encodingFormat": "application/json"})
    for s in STATES_36:
        dist.append({"@type": "DataDownload",
                     "name": "states/%s.json" % slugify(s),
                     "contentUrl": PUBLIC_BASE + "/data/states/%s.json"
                     % slugify(s),
                     "encodingFormat": "application/json"})
    return {
        "@context": "https://schema.org",
        "@type": "Dataset",
        "name": T["dataset_name"],
        "description": ("%s, from %d states and union territories, "
                        "with sources, verification status, and court "
                        "findings kept distinct. %s Free to reuse with "
                        "attribution to %s."
                        % (headline_sentence(n, n2), len(states),
                           overturned_note(n_overturned), SITE_NAME)),
        "hasPart": [
            {"@type": "Dataset",
             "name": "High Court / Supreme Court judgments",
             "description": fill(T["dataset_part_hcsc"], n=n),
             "url": PUBLIC_BASE + "/tracker"},
            {"@type": "Dataset",
             "name": "Trial-court convictions",
             "description": fill(T["dataset_part_trial"], n=n2),
             "url": PUBLIC_BASE + "/trial-court"},
        ],
        "url": PUBLIC_BASE + "/data",
        "identifier": PUBLIC_BASE + "/data/cases.json",
        "creator": dict({"@type": "Organization",
                         "@id": PUBLIC_BASE + "/#org",
                         "name": SITE_NAME, "url": PUBLIC_BASE},
                        **({"parentOrganization": {
                            "@type": "Organization",
                            "name": P["parent_org"]["name"],
                            "url": P["parent_org"]["url"]}}
                           if P.get("parent_org") else {})),
        "publisher": {"@type": "Organization", "@id": PUBLIC_BASE + "/#org",
                      "name": SITE_NAME, "url": PUBLIC_BASE},
        "inLanguage": "en-IN",
        "spatialCoverage": {"@type": "Place", "name": "India"},
        "temporalCoverage": ("%d/%d" % (years[0], years[-1]) if years
                             else "unknown"),
        "dateModified": BUILD_DATE,
        "distribution": dist,
    }


def build_robots():
    L = ["# " + SITE_NAME + " — AI agent access",
         "# Agent map: %s/llms.txt" % PUBLIC_BASE,
         "# Full text: %s/llms-full.txt" % PUBLIC_BASE,
         "# Structured data: %s/data/cases.json" % PUBLIC_BASE,
         "# Tracker index: %s/data/index.json" % PUBLIC_BASE,
         "# Field schema: %s/data/schema.json" % PUBLIC_BASE]
    for bot in AI_BOTS + ["*"]:
        L += ["User-agent: %s" % bot, "Allow: /"]
    L.append("Sitemap: %s/sitemap.xml" % PUBLIC_BASE)
    return "\n".join(L) + "\n"


def about_ai_section():
    B = PUBLIC_BASE
    return """
<section class="section" id="for-ai-agents">
  <div class="wrap">
    <div class="sec-head">
      <div class="kicker">Machine access</div>
      <h2>For AI agents</h2>
      <p>Agents can read a short map at <a href="%s/llms.txt">llms.txt</a>, the full text at <a href="%s/llms-full.txt">llms-full.txt</a>, or JSON at <a href="%s/data/cases.json">cases.json</a> (High Court / Supreme Court) and <a href="%s/data/tier2.json">tier2.json</a> (trial-court convictions); the combined <a href="%s/data/all-cases.json">all-cases.json</a> carries every published record as one array (set-aside included; rows carry a <code>tier</code> field, <code>hc_sc</code> or <code>trial</code>); the slim tracker index at <a href="%s/data/index.json">index.json</a> covers both tiers (rows carry a <code>tier</code> field), and single records sit under <code>/data/case/&lt;record-id&gt;.json</code>. Every page has a Markdown twin (this page: <a href="%s/about/index.md">about/index.md</a>); field definitions live in <a href="%s/data/schema.json">schema.json</a>, the dataset descriptor in <a href="%s/data/dataset.jsonld">dataset.jsonld</a>, and per-state slices under <code>/data/state/&lt;state-slug&gt;.json</code> (36 files). Officer names in text endpoints use gated display forms only.</p>
    </div>
  </div>
</section>
""" % (B, B, B, B, B, B, B, B, B)


def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if path.endswith(".html"):
        content = prefix_html(content)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def gate_records(raw_cases):
    """Hard pre-publish gates. Returns the publishable records; raises
    SystemExit with a loud message on any violation."""
    kept = []
    for c in raw_cases:
        mid = c.get("merged_id") or "?"
        if c.get("record_flag") == "review_remove":
            print("gate: %s excluded (record_flag=review_remove)" % mid)
            continue
        if (c.get("verdict") or "accept") != "accept":
            sys.exit("BUILD REFUSED: %s has verdict=%r (only accept may "
                     "publish)" % (mid, c.get("verdict")))
        if str(c.get("verification_status") or "V2").upper() == "V3" \
                and not v3_earned(c):
            sys.exit("BUILD REFUSED: %s claims V3 without the promotion "
                     "checklist" % mid)
        kept.append(c)
    n_pending_priv = sum(1 for c in kept if c.get("privacy_review") is None)
    if n_pending_priv:
        print("gate: privacy_review pending on %d records "
              "(rendered as pending; human review queue)"
              % n_pending_priv)
    return kept


# ---- Publish holds (owner decision 2026-09-25) ----
# A record publishes only when one of its links is the court order itself
# or an official agency page; a record that rests on news reports alone is
# held until an official copy is added. High Court / Supreme Court records
# publish at V2 and above (V1 is internal only, as the methodology says).
# Employees of public-sector enterprises (banks, CPSEs) are held until the
# core civil services are covered. Held records still feed the name-scrub
# patterns and leak assertions; they are only kept off the site.
DOC_HOSTS = ("indiankanoon.org", "courtkutchehry.com", "casemine.com",
             "advocatekhoj.com", "the-laws.com", "courtbook.in",
             "refread.com", "caseon.in", "legalindia.com")
PSU_EMPLOYER = re.compile(r"public sector|\bPSU\b|\bbank\b|Corporation of "
                          r"India|\bLimited\b|\bLtd\b", re.I)
HOLD_REASON_TEXT = {
    "news_only": "it rests on news reports alone. It will return once an "
                 "official copy of the court order or agency record is "
                 "added.",
    "v1_hcsc": "its source has not yet been checked to the standard a High "
               "Court or Supreme Court record needs (V2).",
    "psu": "it concerns an employee of a public-sector enterprise. Babuwatch "
           "covers the core civil services first and will add public-sector "
           "enterprises, starting with government banks, after that.",
}


def source_is_document(u):
    """True when a URL is the court order or an official record itself:
    a government host, a judgment repository, a hosted PDF, or an archived
    copy of one of those."""
    from urllib.parse import urlparse
    p = urlparse(u)
    host = p.netloc.lower().split(":")[0]
    host = host[4:] if host.startswith("www.") else host
    if host in ("web.archive.org", "archive.org"):
        rest = p.path[1:] + ("?" + p.query if p.query else "")
        m = re.search(r"https?://\S+", rest)
        if m:
            return source_is_document(m.group(0))
        # archive.org items of Indian government orders and gazettes
        return bool(re.search(r"/(?:download|details)/in\.(?:gov|gazette)\.",
                              p.path))
    if host.endswith((".gov.in", ".nic.in")) or host == "gov.in":
        return True
    if any(host == d or host.endswith("." + d) for d in DOC_HOSTS):
        return True
    path = p.path.lower()
    return path.endswith(".pdf") or "/pdf_upload/" in path


def record_source_urls(r):
    out = [r.get("primary_source_url")]
    for s in r.get("secondary_sources") or []:
        out.append(s.get("url") if isinstance(s, dict) else s)
    return [u.strip().split()[0] for u in out
            if isinstance(u, str) and u.strip().startswith("http")]


def publish_hold(r, tier):
    """The reason a record is held off the site, or None. `tier` is
    "hcsc" (cases.json) or "trial" (tier2 / overturned rows)."""
    if tier == "hcsc" and str(r.get("verification_status")
                              or "V2").strip().upper() == "V1":
        return "v1_hcsc"
    if not any(source_is_document(u) for u in record_source_urls(r)):
        return "news_only"
    if r.get("service") == "civil" and PSU_EMPLOYER.search(
            r.get("department") or ""):
        return "psu"
    return None


def held_page(rid, reason, path):
    main = ('<section class="wrap narrow"><h1>This record is not '
            'published</h1><p>Record %s is held back because %s</p>'
            '<p><a href="/tracker">Search the published records</a></p>'
            '</section>' % (esc(rid), esc(HOLD_REASON_TEXT[reason])))
    return page_shell("Record not published \u2014 " + SITE_NAME,
                      "This record is held back pending an official source.",
                      path, main, route="/tracker",
                      extra_head='<meta name="robots" content="noindex">')


def _name_literals(name):
    """Literal candidate strings for one name: spelling variants, every
    contiguous word-run of length >= 2, distinctive singles (len >= 5,
    non-surname).
    Same candidate definition as _name_patterns (which adds regex
    spacing flexibility for the scrubber)."""
    lits = []
    for var in _name_variants(name):
        words = [w for w in var.split(" ") if w.strip()]
        if not _content_words(words) or not _variant_shaped(words):
            continue
        lits.append(var)
        for i in range(len(words)):
            for j in range(i + 2, len(words) + 1):
                run = words[i:j]
                if _run_kept(run):
                    lits.append(" ".join(run))
        for w in words:
            core = w.strip().strip("().,;:'\"-")
            if (len(core) >= 5 and re.search(r"[A-Za-z]", core)
                    and core.lower() not in GENERIC_NAME_WORDS
                    and core.lower() not in COMMON_SURNAMES
                    and re.match(r"^[A-Z0-9]", core)):
                lits.append(core)
    return sorted(set(l for l in lits if len(l) >= 4),
                  key=len, reverse=True)


# Adjudicated same-name collisions: the literal may legitimately appear
# outside its source record (a different person, or a named_safe holder
# elsewhere). Each stays checked in its SOURCE record's own rendered
# files, where a scrub miss would necessarily show. Reasons are
# documented; additions require the same per-case adjudication.
EXEMPT_GLOBAL = {
    # Common name. Legitimate holders: CWC-0177 (named_safe officer alias
    # "Ranjan Kumar @ Santosh Kumar"), CWC-0521 (named_safe "Santosh Kumar
    # Jaiswal (A1)"); different person in CWC-0218 ("Santosh Kumar Dohare
    # (dead)", M.P. matter vs CWC-0038's Bihar IO).
    "santosh kumar": "CWC-0038",
    # Different person in CWC-0040's docket title ("Dinesh Kumar Singh",
    # Bihar petitioner; CWC-0040's officers are Vinay Pratap Singh /
    # Subodh Singh) vs CWC-0175's unnamed officer "Dinesh Kumar".
    "dinesh kumar": "CWC-0175",
    # Different person in CWC-0065 ("SP Intelligence Baldev Singh's
    # inquiry"; CWC-0065's officer is Mohinder Singh) vs unnamed
    # "Baldev Singh" in CWC-0307 / CWC-0309.
    "baldev singh": "CWC-0307",
    # Different person in CWC-0060's fidelity note ("co-delinquent
    # C-Rajesh Kumar (enquiry co-accused, not a party)"; CWC-0060's
    # officer is Pardeep Kumar) vs CWC-0319's unnamed "Rajesh Kumar".
    "rajesh kumar": "CWC-0319",
    # Different person in CWC-0125 ("acquitting co-appellants Mukul Kumar
    # and Ramesh Kumar"; CWC-0125's officer is Tara Dutt, named_safe) vs
    # CWC-0311's unnamed officer "Ramesh Kumar".
    "ramesh kumar": "CWC-0311",
    # Different person in CWC-0436's complaint narrative ("Ramesh Chandra
    # had snatched Rs. 915"; CWC-0436's officer is Keshram Chaudhary) vs
    # the "Ramesh Chandra" run of CWC-0286's unnamed "Ramesh Chandra
    # Nayak".
    "ramesh chandra": "CWC-0286",
    # Different person: CWC-0528's habeas petitioner "Gurmukh Singh"
    # (father of disappeared Dalbir Singh, Kharar 1991; CWC-0528's
    # officers are Harbans Lal / Ramesh Chander) vs CWC-0316's unnamed
    # officer "Gurmukh Singh" (Dhilwan 2009).
    "gurmukh singh": "CWC-0316",
    # Case citation, not a person mention: CWC-0087's summary cites the
    # "Sube Singh" precedent (with Nilabati Behera, D.K. Basu) vs
    # CWC-0114's unnamed officer "Sube Singh".
    "sube singh": "CWC-0114",
    # Different person: CWC-0496's title petitioner "Radheshyam
    # Bhagwandas Shah" (Bilkis Bano matter) vs the "Bhagwandas Shah"
    # run of CWC-0149's unnamed "Dipakkumar Bhagwandas Shah".
    "bhagwandas shah": "CWC-0149",
    # Different person and era: CWC-0156's "Head Constable Jagat Singh"
    # (1975 bribery trap, Murthal) vs CWC-0396's unnamed "Jagat Singh".
    "jagat singh": "CWC-0396",
    # Different person: CWC-0055's title accused "Ranjit Singh" (1979
    # Himachal matter) vs CWC-0505's unnamed "Ranjit Singh" (and the
    # run inside CWC-0476's "Rakesh s/o Ranjit Singh").
    "ranjit singh": "CWC-0505",
    # Different person: CWC-0069's habeas petitioner "Kirpal Singh
    # Randhawa" (Punjab) vs CWC-0298's unnamed officer "Kirpal Singh".
    "kirpal singh": "CWC-0298",
    # Different person: CWC-0224's title petitioner "Ramu @ Manvendra
    # Singh Gurjar" (M.P.) vs the "Singh Gurjar" run of CWC-0231's
    # unnamed "Ravindra Singh Gurjar".
    "singh gurjar": "CWC-0231",
    # Different person: CWC-0261's title petitioner "Hasan Ali"
    # (Meghalaya) vs the "Hasan Ali" run of CWC-0386's unnamed "Syed
    # Hasan Ali".
    "hasan ali": "CWC-0386",
    # Different person and a case citation: CWC-0307's title petitioner
    # "Inder Singh" and CWC-0342's "Inder Singh habeas compensation
    # order" vs the "Inder Singh" run of CWC-0112's unnamed "Inder
    # Singh Rana".
    "inder singh": "CWC-0112",
    # Different person (definitive): CWC-0309's title petitioner "Sadhu
    # Singh" (2013 Banur matter) vs CWC-0307's anonymised victim "Sadhu
    # Singh", who was extrajudicially liquidated in 1995 and cannot be
    # the 2013 petitioner. Also CWC-0158's unnamed officer "Sadhu
    # Singh" and CWC-0342's victim "Sadhu Singh".
    "sadhu singh": "CWC-0307",
    # Case citation, not a person mention: CWC-0357's summary cites the
    # "Shyamsunder Trivedi" precedent (with Nilabati Behera, D.K. Basu)
    # vs CWC-0216's unnamed officer "Shyamsunder Trivedi".
    "shyamsunder trivedi": "CWC-0216",
    # Different person and era: CWC-0407's "eyewitness constable Prem
    # Singh" (1992 Khatima) vs CWC-0299's unnamed officer "Prem Singh".
    "prem singh": "CWC-0299",
    # Different person: CWC-0521's title petitioner "Jaspal Singh
    # Gosain" (convicted Uttarakhand policeman appealing, 2009 Dehradun
    # Ranbir Singh matter) vs unnamed "Jaspal Singh" officers in
    # CWC-0304 / CWC-0534 / CWC-0297 (1990s Punjab matters).
    "jaspal singh": "CWC-0304",
    # Case citation, not a person mention: CWC-0653's summary cites
    # "State of WB v. Sankar Ghosh" vs CWC-0652's unnamed officer
    # "Sankar Ghosh".
    "sankar ghosh": "CWC-0652",
    # Different person: CWC-0446's fidelity note discusses removing A-1
    # "Kunwar Pal Singh" (a civilian property dealer, Noida 2023; not
    # police) from its officer list vs CWC-0510's unnamed officer
    # "Kunwar Pal Singh" (PAC, Meerut 2018).
    "kunwar pal singh": "CWC-0510",
    # Case citation, not a person mention: CWC-0175's fidelity note
    # discusses a borrowed "Kishore Singh AIR 1981 SC 625" epigraph vs
    # unnamed officers "Kishore Singh" in CWC-0330 / CWC-0490.
    "kishore singh": "CWC-0330",
    # Different persons: co-accused "Bahadur Singh" in CWC-0217's
    # fidelity note (2004 Bhopal; acquitted with Pooran Singh and
    # Dhanraj Dubey) and a mention in CWC-0400's note (2017 Chandauli)
    # vs CWC-0326's unnamed officer "Bahadur Singh" (2023 Tonk).
    "bahadur singh": "CWC-0326",
    # Different person: civilian co-convict "Nand Kishore" in
    # CWC-0084's fidelity note (2016 Bilaspur) vs unnamed officers
    # "Nand Kishore" in CWC-0120 (2000 Delhi) / CWC-0320 (2024 Kota).
    "nand kishore": "CWC-0120",
    # Different persons: CWC-0408's court quote names "Constable Surendra
    # Singh ... on reserve duty" (Uttarakhand 2007, 31st PAC Rudrapur, a
    # comparator to appellant Baram Dutt) and CWC-0403 lists judge
    # "Surendra Singh-I" (Allahabad HC, UP 2024) vs CWC-0050's unnamed
    # "Surendra Singh" (Constable bodyguard, Bhagalpur, Bihar 1997).
    # Different state, decade, unit and role in each case.
    "surendra singh": "CWC-0050",
    # Different person: CWC-0544's summary names extortion victim "Roshan
    # Lal" (Delhi 1968, gold ring seized) vs CWC-0509's unnamed SHO
    # "Roshan Lal" (Jaito, Punjab 1964). Victim vs officer, Delhi vs Punjab.
    "roshan lal": "CWC-0509",
    # Different person: CWC-0162's summary names 1993 victim's father "Ram
    # Sarup" (Kurukshetra) vs CWC-0158's unnamed ASI "Ram Sarup" (Bawal,
    # Rewari, 2013). Different district and role.
    "ram sarup": "CWC-0158",
    # Case citation, not a person mention: CWC-0534's summary /
    # verification_note cite the "Karnail Singh (2001)" P&H High Court
    # precedent corroborating the SC Khalra order (with its secondary-source
    # URL slug) vs CWC-0718's unnamed Head Constable "Karnail Singh"
    # (PS Bhikhi, Mansa; 2013 incident). Different unit, era and matter.
    "karnail singh": "CWC-0718",
    # Different person: CWC-0168's summary names bribe complainant "Rakesh
    # Kumar" (Haryana 2022) vs CWC-0225's unnamed Constable "Rakesh Kumar"
    # (Mohangarh, MP 2008). Complainant vs officer, Haryana vs MP.
    "rakesh kumar": "CWC-0225",
    # Different person: CWC-0059's summary/verdict name custody-death victim
    # "Gulab Singh (28)" (HP 2001) vs unnamed officers "Gulab Singh"
    # (Bawal, Haryana 2013) and "Gulab Singh Chaudhury" (MP 2004). Victim
    # vs officers, HP vs Haryana/MP.
    "gulab singh": "CWC-0158",
    # Different person: CWC-0173's summary names custodial-death victim
    # "Umesh Singh" (Ghanudih, Jharkhand 2015) vs CWC-0401's unnamed SI
    # "Umesh Singh" (Khiri, Prayagraj, UP 2026). Victim vs officer.
    "umesh singh": "CWC-0401",
    # Different person: CWC-0220's summary names complainant's nephew
    # "Jaipal Singh" (Rajgarh, MP 2024) vs CWC-0396's unnamed "Jaipal
    # Singh" (Baradhpur, Bijnor, UP 2020). Civilian vs officer, MP vs UP.
    "jaipal singh": "CWC-0396",
    # Different person: CWC-0266's summary names victim "Ningombam Gopal
    # Singh" (HC employee, Manipur 2008) vs CWC-0312's unnamed Constable
    # "Gopal Singh" (Punjab 2006). Manipur vs Punjab.
    "gopal singh": "CWC-0312",
    # Different persons: CWC-0301 names arrested constable "Mukhtiar Singh"
    # (Jalandhar, Sept 1992) and CWC-0532 names compensated deceased
    # "Mukhtiar Singh" (Ludhiana 1995) vs CWC-0341's unnamed HC "Mukhtiar
    # Singh" (CIA Amritsar, 1992). Different districts/units; common name.
    "mukhtiar singh": "CWC-0341",
    # Different person: CWC-0535's summary names abducted victim "Harpal
    # Singh" (Punjab 1993) vs CWC-0390's unnamed SO "Harpal Singh"
    # (Pilibhit, UP 2022). Victim vs officer, Punjab vs UP, 1993 vs 2022.
    "harpal singh": "CWC-0390",
    # Different person: CWC-0303's summary names disappeared person
    # "Balwinder Singh" (Batala, ~1994) vs unnamed constables "Balwinder
    # Singh" (Amritsar, 2013). Disappeared civilian vs officers, 1994 vs
    # 2013, Gurdaspur vs Amritsar.
    "balwinder singh": "CWC-0309",
    # Different person: CWC-0314's summary names bribe complainant "Prem
    # Kumar" (Punjab 2015) vs CWC-0604's unnamed DSP "Prem Kumar"
    # (Mananthavady, Kerala 2015). Complainant vs officer, Punjab vs Kerala.
    "prem kumar": "CWC-0604",
    # Case citation, not a person mention: CWC-0403's summary cites
    # the Allahabad HC "Ramesh Chand Gupta ruling" (preventive-detention
    # precedent; petitioner Ramesh Chand Gupta, UP 2024) vs CWC-0098's
    # unnamed convicted "Ramesh Chand" (Special Staff North-East, Delhi
    # Police; 2017 Delhi matter). Different person, state and role.
    "ramesh chand": "CWC-0098",
    # Different person: t2-09-006 / t2-13-013 (Bihar) name CBI Special
    # Court judge "Avinash Kumar" (Patna, 1998 Purnia fake-encounter
    # trial, convicted Oct 2024) vs CWC-0098's unnamed officer "Avinash
    # Kumar" (Special Staff North-East, Delhi Police; withheld on
    # key2_gemapi unclear). Judge vs officer, Bihar vs Delhi.
    "avinash kumar": "CWC-0098",
    # Different person: CWC-0315's summary names victim "Sohan Singh @
    # Sohanjit Singh" (Punjab 2011) vs unnamed SHOs "Sohan Singh" (Sadar
    # Barmer, Rajasthan 2008/2010). Victim vs officers, Punjab vs Rajasthan.
    "sohan singh": "CWC-0330",
    # Different person: CWC-0521's summary names encounter victim "Ranbir
    # Singh" (20-year-old, Dehradun 2009) vs CWC-0302's unnamed Inspector
    # "Ranbir Singh" (Nawanshahr, Punjab 2001). Victim vs officer,
    # Uttarakhand vs Punjab. (CWC-0111's Delhi SI Ranbir Singh is a
    # separate holder in its own record.)
    "ranbir singh": "CWC-0302",
    # Different persons: CWC-0565 names shooting victim "Raj Kumar"
    # (21-year-old driver, Chandigarh 1990) and CWC-0045 names arrestee
    # "Raj Kumar Choudhary" (Bihar 2000) vs CWC-0396's unnamed "Raj Kumar"
    # (UP 2020). Victims/arrestee vs officer; different state and decade.
    "raj kumar": "CWC-0396",
    # Different persons: CWC-0068 names custody victim "Anil Kumar"
    # (21-year-old, Chandigarh 2007), CWC-0179 names petitioner "Anil Kumar
    # Singh" (Jharkhand 2024) and CWC-0201 names judge "N. Anil Kumar" vs
    # unnamed officers "Anil Kumar" (Delhi 2011/1992) and "Anil Kumar Singh
    # Kushwaha" (MP 2011). (CWC-0093's convicted constable Anil Kumar is
    # named_safe in its own record.)
    "anil kumar": "CWC-0106",
    # Different persons: CWC-0120 names custodial-death victim "Jaswant
    # Singh" (Delhi 1992) and CWC-0297/CWC-0534 name activist "Jaswant Singh
    # Khalra" vs unnamed officers "Jaswant Singh" (Punjab 1994/2024).
    # (CWC-0067's convicted SI Jaswant Singh is named_safe in its own.)
    "jaswant singh": "CWC-0298",
    # Different person: CWC-0103 names kidnapping complainant "Sunil Kumar
    # Aggarwal" (Delhi 1996) vs CWC-0106's unnamed "Sunil Kumar" (Delhi
    # 2011). Complainant (full name Aggarwal) vs officer, different matter.
    "sunil kumar": "CWC-0106",
    # Different person: CWC-0124 names trap decoy "Neeraj Kumar" (Delhi
    # 2005) vs CWC-0521's unnamed "Neeraj Kumar (A4)" (Uttarakhand 2009
    # matter). Decoy witness vs accused officer.
    "neeraj kumar": "CWC-0521",
    # Different persons: CWC-0461 names torture victim "Ashok Kumar"
    # (Haryana 1993) and CWC-0532 names compensated deceased "Ashok Kumar"
    # (Punjab 1995) vs unnamed officers "Ashok Kumar" (UP 2003, Delhi 1993)
    # and "Ashok Kumar Sharma/Jain" (MP). Victims vs officers.
    "ashok kumar": "CWC-0397",
    # Different person: CWC-0597 names false-case complainant "Suresh Kumar"
    # (HP 2009) vs CWC-0121's unnamed "Suresh Kumar" (Delhi 1999).
    # Complainant vs officer, HP vs Delhi. (CWC-0113's HC Suresh Kumar is
    # named_safe in its own record.)
    "suresh kumar": "CWC-0121",
    # Case citation, not a person mention: CWC-0896's summary cites the
    # "State of Punjab v. Ram Singh" service-law precedent vs CWC-0571's
    # unnamed convicted Constable "Ram Singh" (PS Misrikh, Sitapur, UP
    # 2015). Punjab precedent vs UP officer.
    "ram singh": "CWC-0571",
    # Different person: CWC-0899's summary names the target of a false
    # ACB trap, "Inspector (Wireless) Mohan Singh" (Rajasthan 2010), vs
    # unnamed officers "Mohan Singh" in CWC-0188 (convicted Constable,
    # Doddapet, Shimoga, Karnataka 2009) and CWC-0303 (Constable, Sadar
    # Batala, Punjab 2002). Trap target vs officers.
    "mohan singh": "CWC-0188",
    # Different person: CWC-0900's summary names escaped accused "Nakli @
    # Darshan Singh" (MJM Sadulshahar, Rajasthan 1994) vs unnamed officers
    # "Darshan Singh" in CWC-0778 (ASI, Ropar, Punjab 1996) and CWC-0317
    # (convicted SI, Payal, Punjab 2005). Escaped civilian vs officers.
    "darshan singh": "CWC-0317",
    # Case citation, not a person mention: CWC-0949's summary cites the
    # "Paramvir Singh Saini" CCTV precedent vs CWC-0532's unnamed "Sumedh
    # Singh Saini" (SSP Ludhiana, Punjab 1995). Precedent vs officer.
    "singh saini": "CWC-0532",
    # Different person: CWC-0044's docket title names petitioner "Arvind
    # Kumar Gupta" (Bihar) vs CWC-0914's unnamed convicted Constable
    # "Arvind Kumar" (I.P. Estate, Delhi Police 2023). Petitioner vs
    # officer, Bihar vs Delhi.
    "arvind kumar": "CWC-0914",
    # Different person: CWC-0885's docket title names petitioner "Amar Nath
    # Poddar" (Bihar) vs CWC-0934's unnamed convicted Constable "Amar Nath"
    # (PS Kairana, UP 1963). Petitioner vs officer, Bihar vs UP.
    "amar nath": "CWC-0934",
    # Different person: CWC-0007's summary names compensation victim "Y.
    # Rajendra Prasad" (AP 2002) vs CWC-0875's unnamed "Rajendra Prasad
    # Mahto" (ASI, Matihani, Begusarai, Bihar 2007). Victim vs officer,
    # AP vs Bihar.
    "rajendra prasad": "CWC-0875",
    # Different person: CWC-0565's docket title names petitioner "Rattan
    # Chand" (Chandigarh) vs CWC-0863's unnamed "Rattan Chand" (Constable
    # No. 602, JKAP/SOG Lethpora, J&K 2003). Petitioner vs officer.
    "rattan chand": "CWC-0863",
    # Different person and era: CWC-0892's summary names enquiry officer
    # "Sub-Inspector Basant Singh" (Ambala, 1965) vs CWC-0317's unnamed
    # "Basant Singh" (Punjab Police, Payal 2005). Enquiry officer vs
    # named_only officer, 1965 vs 2005.
    "basant singh": "CWC-0317",
    # Different person: CWC-0324's summary names motorcyclist "Mahesh Kumar"
    # (civilian accosted by Phool Singh, Dholpur, Rajasthan 1987) vs
    # CWC-0071's unnamed "Mahesh Kumar Verma" (Suhela, Raipur,
    # Chhattisgarh 2006). Civilian vs officer, Rajasthan vs Chhattisgarh.
    "mahesh kumar": "CWC-0071",
    # Different person: CWC-0306's summary names disappearance victim
    # "Maninder Singh @ Dalli" (Bhawanigarh, Punjab 1993) vs CWC-0315's
    # unnamed "Maninder Singh" (SSOC Amritsar, Punjab 2017). Victim vs
    # officer, 1993 vs 2017.
    "maninder singh": "CWC-0315",
    # Different person: CWC-0322's summary names bribe complainant "Om
    # Prakash" (Rajgarh, Churu, Rajasthan 1977) vs unnamed officers "Om
    # Prakash" in CWC-0118 / CWC-0485 / CWC-0092 / CWC-0343 (Delhi) and
    # CWC-0597 (HP). Complainant vs officers, Rajasthan vs Delhi/HP.
    "om prakash": "CWC-0118",
    # Different person: t2-16-011's case title names convict "Dalip Singh"
    # (Sessions Karkardooma, Delhi 2001) vs unnamed officers "Dalip Singh"
    # in CWC-0681 (Cheeka, Guhla, Haryana 1993) and CWC-0306 (Bhawanigarh,
    # Punjab 1994). Delhi convict vs Haryana/Punjab officers.
    "dalip singh": "CWC-0681",
    # Different person: t2w3-17-005's source agency names judge "Deepak
    # Kumar Agarwal" (MP High Court, Gwalior) vs CWC-0904's unnamed "Deepak
    # Kumar" (SHO Suhagpura, Pratapgarh, Rajasthan 2019). Judge vs officer,
    # MP vs Rajasthan.
    "deepak kumar": "CWC-0904",
    # Different person: t2w2-10-050's verdict note names judge "ASJ Narinder
    # Kumar" (Delhi) vs CWC-0720's anonymised victim legal "Narinder Kumar"
    # (Abohar, Punjab 2019). Judge vs victim, Delhi vs Punjab.
    "narinder kumar": "CWC-0720",
    # Different person: t2w2-10-032's quote and title name acquitted
    # co-accused "ASI Ram Chander" (Tilak Nagar ACB matter, Delhi
    # 2004/2009) vs CWC-0890's unnamed convicted SHO "Ram Chander" (PS City
    # Bhiwani, Haryana 1984). Acquitted Delhi co-accused vs convicted
    # Haryana SHO, different era.
    "ram chander": "CWC-0890",
    # Different persons (common "Singh Malik" run): CWC-0793's fidelity
    # note names acquitted co-accused "Azad Singh Malik" (Usmanpur CBI
    # trap, Delhi 2013; correctly excluded from its officers) vs unnamed
    # officers "Jasbir Singh Malik" (Model Town, Delhi 1993) and "Joginder
    # Singh Malik" (convicted SI, Mayapuri, Delhi 2014). Different full
    # names, units and years.
    "singh malik": "CWC-0458",
    # Different person (round 4): CWC-0717's title petitioner "Mohinder
    # Singh" (CW-2019-0012, Punjab 2019, P&H HC; kin petition in the 2012
    # Kot Bhai custodial-death matter, PS Kot Bhai officers) vs CWC-0065's
    # unnamed officer SI "Mohinder Singh" (No. CHG/1, PS North, UT Police
    # Chandigarh; 1991 Chandigarh torture/extortion, SC 1997). Petitioner
    # vs officer, Punjab vs Chandigarh UT, 2012 vs 1991.
    "mohinder singh": "CWC-0065",
    # Different person (round 5): CWC-1071's summaries name bribe
    # co-accused "Head Constable Shamsher Singh" (CW-2013-0030, Karnal
    # FIR 465/2007, Haryana Police; acquitted by the Special Judge) vs
    # CWC-1192's unnamed convicted "Shamsher Singh" (CW-2020-0017, HC
    # PS Kirti Nagar, Delhi Police, 2003 matter, 'State vs Shamsher
    # Singh'). Different force, state, matter and outcome.
    "shamsher singh": "CWC-1192",
    # Case citation, not a person mention (round 5): CWC-1268's summaries
    # apply the "Avtar Singh objective test" (CW-2026-0051, MP; the SC
    # 2016 attestation-suppression precedent) vs CWC-1059's unnamed
    # "Avtar Singh" (CW-2001-0018, HC, PS Lopoke escort party, Amritsar,
    # Punjab 1988). Precedent vs officer, MP vs Punjab, 2016 vs 1988.
    "avtar singh": "CWC-1059",
    # Case citation, not a person mention (round 5): CWC-0895's summaries
    # compute compensation on "Rajesh vs Rajbir Singh" (CW-2014-0035,
    # Punjab; the 2013 SC motor-accident multiplier/consortium precedent)
    # vs CWC-1170's unnamed SI "Rajbir Singh" (CW-2005-0020, Delhi
    # Police 2005). Precedent respondent vs officer, Punjab vs Delhi.
    "rajbir singh": "CWC-1170",
    # Case citation, not a person mention (round 5): CWC-1002's summaries
    # follow "the Supreme Court in Ghulam Mohd. Bhat" (CW-2017-0021,
    # Tripura; CRPF-dismissal precedent) vs unnamed "Ghulam Mohd.
    # Tantray" (CW-2026-0024/CW-2026-0050, driver constable, J&K Police).
    # Different surnames (Bhat vs Tantray), precedent vs officer,
    # Tripura vs J&K.
    "ghulam mohd.": "CWC-0063",
    # Different person (round 5): CWC-0793's fidelity note names
    # acquitted co-accused "Azad Singh Malik" (CW-2013-0022 CSV row;
    # Usmanpur CBI trap, Delhi 2013; correctly excluded from its
    # officers — not police; same mention already adjudicated under
    # "singh malik") vs unnamed officers "Azad Singh" in CWC-1071
    # (Exemptee Head Constable, Haryana Police Karnal, 2007 bribe
    # matter) and CWC-1186 (Delhi Police Constable, ACB FIR 41/2009,
    # dismissed 2013). Different full names (Malik), matters and roles.
    "azad singh": "CWC-1071",
}


def holders_for_public(pub):
    """Lowercased strings in which a gated literal may legitimately
    appear inside THIS record's own rendering: named_safe officer name
    variants, non-anonymised victim names, judges, courts, places."""
    holds = set()
    for o in (pub.get("officers") or []):
        if isinstance(o, dict) and o.get("publish_grade") == "named_safe":
            for v in _name_variants(o.get("name") or ""):
                holds.add(v.lower())
    if not is_anonymised(pub):
        for v in (pub.get("victims") or []):
            if isinstance(v, dict) and v.get("name"):
                holds.add(v["name"].lower())
    judges = pub.get("judges") or []
    if isinstance(judges, str):
        judges = [judges]
    for j in judges:
        if j:
            holds.add(str(j).lower())
    for k in ("court", "trial_court_name", "state", "district",
              "district_at_time", "city_town", "police_station_or_unit",
              "force", "case_number"):
        if pub.get(k):
            holds.add(str(pub[k]).lower())
    # Place/court holders also cover their word-prefixes: meta
    # descriptions truncate holder strings (desc[:300]), and a gated
    # literal inside the truncated remainder is still the same
    # legitimate place/court mention. Person holders (officers,
    # victims, judges) stay exact-only, so a same-named different
    # person elsewhere in the file is never masked.
    for k in ("court", "trial_court_name", "state", "district",
              "district_at_time", "city_town", "police_station_or_unit"):
        words = str(pub.get(k) or "").lower().split()
        for j in range(2, len(words)):
            pre = " ".join(words[:j])
            if len(pre) >= 12:
                holds.add(pre)
    return [h for h in holds if len(h) >= 3]


def _t2_effective_names(r, downgraded_names=()):
    """(name, kind) pairs needing patterns for one RAW tier-2 record:
    unnamed officers with real (non-descriptive) names, plus downgraded
    ex-named_safe officers (fail-closed cross-tier collisions)."""
    out = []
    down = set(downgraded_names or ())
    for o in (r.get("officers") or []):
        if not isinstance(o, dict):
            continue
        if o.get("publish_grade") == "named_safe" and \
                (o.get("name") or "") not in down and \
                (o.get("name_public") or "") not in down:
            continue
        if _is_descriptive_officer_name(o):
            continue
        if (o.get("name") or "").strip():
            out.append((o["name"], "officer"))
    return out


def leak_literals_for_assertion(raw_cases, oracle_by_id=None,
                               nosp_extras=None, raw_t2=None,
                               t2_downgraded=None):
    """(multis, singles, sources): multi-word literals plus, per record,
    bare singles. Bare singles can coincide with a different same-named
    person in another record, so each record's singles are checked only
    in that record's own rendered files — which carry the same redacted
    dict as every aggregate, so a scrub miss necessarily shows there.
    Names come from the gated records plus the ungated oracle (for
    gate-redacted descriptive entries and stripped legal stores), plus
    tier-2 unnamed officer names (same treatment as tier-1 unnamed)."""
    multi = []
    singles = {}
    sources = {}
    # exempt_map: every literal of an adjudicated name -> source rids.
    # Runs/singles of an exempt full name are skipped outside the
    # source records (same adjudicated identity) but still checked in
    # the source records' own files.
    exempt_map = {}
    oracle_by_id = oracle_by_id or {}
    t2_downgraded = t2_downgraded or {}
    for c in raw_cases:
        rid = c.get("record_id") or c.get("merged_id")
        oracle = oracle_by_id.get(c.get("merged_id"))
        for nm, _kind in gated_effective_names(c, oracle):
            lows = {lit.lower() for lit in _name_literals(nm)}
            if lows & set(EXEMPT_GLOBAL):
                for low in lows:
                    exempt_map.setdefault(low, set()).add(rid)
    for r in (raw_t2 or []):
        rid = t2_id(r)
        for nm, _kind in _t2_effective_names(r, t2_downgraded.get(rid)):
            lows = {lit.lower() for lit in _name_literals(nm)}
            if lows & set(EXEMPT_GLOBAL):
                for low in lows:
                    exempt_map.setdefault(low, set()).add(rid)
    for c in raw_cases:
        rid = c.get("record_id") or c.get("merged_id")
        oracle = oracle_by_id.get(c.get("merged_id"))
        lits = []
        oracle_names = oracle_officer_names(c, oracle)
        for i, o in enumerate(c.get("officers") or []):
            if not isinstance(o, dict):
                continue
            if o.get("publish_grade") == "named_safe":
                continue
            if i in oracle_names:
                lits.extend(_name_literals(oracle_names[i]))
            elif not _is_descriptive_officer_name(o):
                lits.extend(_name_literals(o.get("name") or ""))
        for nm in oracle_victim_legals(c, oracle):
            lits.extend(_name_literals(nm))
        for nm, kind in (nosp_extras or {}).get(rid, []):
            if kind == "officer" or is_anonymised(c):
                lits.extend(_name_literals(nm))
        own = []
        for lit in lits:
            sources.setdefault(lit.lower(), set()).add(rid)
            (multi if " " in lit.strip() else own).append(lit)
        if own:
            singles[rid] = sorted(set(own), key=len, reverse=True)
    for r in (raw_t2 or []):
        rid = t2_id(r)
        lits = []
        for nm, _kind in _t2_effective_names(r, t2_downgraded.get(rid)):
            lits.extend(_name_literals(nm))
        own = []
        for lit in lits:
            sources.setdefault(lit.lower(), set()).add(rid)
            (multi if " " in lit.strip() else own).append(lit)
        if own:
            singles[rid] = sorted(set(own), key=len, reverse=True)
    return (sorted(set(multi), key=len, reverse=True), singles, sources,
            exempt_map)


def _read_dist(rel):
    # Original case: the single-token guard needs capitalisation.
    try:
        with open(os.path.join(DIST, rel), encoding="utf-8") as f:
            return f.read()
    except (OSError, UnicodeDecodeError):
        return ""


def _file_spans(text_low, holders):
    spans = _protected_spans(text_low, holders)
    # Citation URLs are required (R57); a gated name inside a
    # third-party URL slug is not our publication of the name.
    for m in re.finditer(r"https?://\S+", text_low):
        spans.append((m.start(), m.end()))
    return spans


def _match_outside_holders(text_low, lit_low, holders):
    if lit_low not in text_low:
        return False
    spans = _file_spans(text_low, holders)
    for m in re.finditer(r"(?<!\w)%s(?!\w)" % re.escape(lit_low), text_low):
        if not _in_spans(m.start(), m.end(), spans):
            return True
    return False


# Aggregate files render record dicts; a gated literal there is a leak
# unless some record legitimately holds it (union holders). The CSV is
# checked PER ROW with that row's record holders instead: its
# fidelity_changes / editor_notes columns carry text found nowhere
# else, and union-wide spans would mask a cross-record name sitting in
# another record's row.
AGGREGATE_PREFIXES = ("data/", "llms", "index.html", "tracker.html",
                      "tracker/", "state/", "trial-court/")


# Adjudicated same-identity cross-record scrubs: (merged_id -> [(name,
# kind)]). The named string is scrubbed from that record's fields even
# though the name is gated in a DIFFERENT record, because the evidence
# says it is the same human (or cannot rule it out). Audited case by
# case; never a dumping ground for common names.
SCRUB_EXTRA = {
    # CWC-0297's fidelity note names ASI "Amarjit Singh ... acquitted
    # by HC" (Khalra matter); CWC-0310's unnamed officer is ASI
    # "Amarjit Singh" (CIA Patiala, same era). Same rank, same force,
    # same crackdown apparatus; identity cannot be ruled out, so the
    # note is scrubbed safety-first.
    "CWC-0297": [("Amarjit Singh", "officer")],
    # CWC-0938's summary reproduces the Lakhan Bhaiya-conviction roster
    # (Dilip Palande, Tanaji Desai, Pradeep Suryavanshi, ...) including
    # "Pradeep Sharma" — the same distinctive name as CWC-0950's unnamed
    # convicted Senior Inspector (Mumbai Police, 2024 appeal). Same roster,
    # same force; identity cannot be ruled out, so scrubbed safety-first.
    "CWC-0938": [("Pradeep Sharma", "officer")],
    # CWC-1197's docket title names petitioner "Ex Ct/GD Om Parkash"
    # (round 5): the same human as its own withheld officer "Om Prakash
    # Yadav" (dismissed CRPF Constable/GD, D Coy 176 Bn Waripora; the
    # Delhi HC judgment dismisses the dismissed constable's own writ).
    # Parkash/Prakash spelling + dropped surname; like round 4's Hans
    # Raj, redacted on the same-person ground, never exempted. Mirrors
    # xwithheld.T1_OWN_ALIASES at gate level.
    "CWC-1197": [("Om Parkash", "officer")],
}


# ---- Fast single-regex matcher (round 6c) ----
# Round 6 looped literals × files (one substring scan + one regex scan
# per literal per file): correct but >15min on 127MB / 7392 files.
# Round 6c compiles ONE case-insensitive alternation regex (longest
# names first, word boundaries) per scope and scans each text once;
# holder spans are verified lazily in a window around each candidate
# match instead of once per holder per file. Same matches, same
# overlap rule, same spans — a pure speedup, plus the single-token
# proper-noun guard.
_ALT_RX_CACHE = {}
_GLOBAL_MULTI_RX = None
_GLOBAL_MULTI_SET = frozenset()


def _alt_rx_for(lows):
    """Compiled (?<!\\w)(?:lits)(?!\\w) over lowercased lits, longest
    first (alternation order = longest match wins at each position).
    Cached per literal set; one scan replaces one scan per literal.
    Case-insensitive via lowered text (same result, no IGNORECASE)."""
    key = frozenset(lows)
    if not key:
        return None
    rx = _ALT_RX_CACHE.get(key)
    if rx is None:
        alt = "|".join(re.escape(l) for l in
                       sorted(key, key=len, reverse=True))
        rx = re.compile(r"(?<!\w)(?:%s)(?!\w)" % alt)
        _ALT_RX_CACHE[key] = rx
    return rx


def _rx_find_all(rx, text_low):
    """Yield matches including different-start overlaps (a consuming
    scan would miss the second — fail-open; TestSharedMatcher pins
    this). Linear when matches don't overlap: the re-scan from
    start+1 runs only while an overlapping match actually exists."""
    pos = 0
    n = len(text_low)
    seen = set()
    while pos <= n:
        m = rx.search(text_low, pos)
        if m is None:
            return
        s, e = m.start(), m.end()
        if (s, e) not in seen:
            seen.add((s, e))
            yield m
        m2 = rx.search(text_low, s + 1)
        if m2 is not None and m2.start() < e:
            pos = s + 1
        elif e > pos:
            pos = e
        else:
            pos = pos + 1


def _match_covered(text_low, s, e, holders, maxh):
    """True when (s,e) overlaps a holder occurrence or citation-URL
    span — the same _in_spans overlap semantics _file_spans feeds,
    verified lazily in a window around the match (whole-file holder
    scans were the >15min blowup on 12MB aggregates)."""
    for pos in (s, e - 1):
        a = pos
        while a > 0 and not text_low[a - 1].isspace():
            a -= 1
        b = pos
        n = len(text_low)
        while b < n and not text_low[b].isspace():
            b += 1
        run = text_low[a:b]
        for tag in ("https://", "http://"):
            p = run.find(tag)
            if p != -1 and a + p < e and s < b:
                return True
    if not holders:
        return False
    lo = max(0, s - maxh)
    seg = text_low[lo:e + maxh]
    for h in holders:
        start = 0
        while True:
            i = seg.find(h, start)
            if i < 0:
                break
            o = lo + i
            if o < e and s < o + len(h):
                return True
            start = i + 1
    return False


def _collect_matches(text_low, lows, spans=None, text_orig=None,
                     holders=None):
    """{low: [(start, end), ...]} for every low matching outside holder
    and citation-URL spans. THE ONE matcher: the final scrub and the
    leak assertion both decide exclusively through this function (same
    lits via _leak_context, same holders, same word-boundary regex).
    Pure function of its inputs — running it once per file serves
    both, and a second run on scrubbed text can only find a genuine
    scrub bug.

    Round 6c: `spans` (precomputed whole-text spans) is legacy, kept
    for the pinned per-literal path; pass `holders` (+ `text_orig`
    for the single-token guard) for the fast single-regex path: one
    compiled alternation per scope, one scan, lazy span checks."""
    if spans is not None:
        found = {}
        for low in lows:
            if low not in text_low:
                continue
            hits = []
            for m in re.finditer(r"(?<!\w)%s(?!\w)" % re.escape(low),
                                 text_low):
                if not _in_spans(m.start(), m.end(), spans):
                    hits.append((m.start(), m.end()))
            if hits:
                found[low] = hits
        return found
    lows_set = set(lows)
    if not lows_set:
        return {}
    multis = {l for l in lows_set if " " in l}
    singles = lows_set - multis
    jobs = []
    if multis:
        if _GLOBAL_MULTI_RX is not None:
            jobs.append((_GLOBAL_MULTI_RX, multis))
            extra = multis - _GLOBAL_MULTI_SET
            if extra:
                rx = _alt_rx_for(extra)
                if rx is not None:
                    jobs.append((rx, extra))
        else:
            rx = _alt_rx_for(multis)
            if rx is not None:
                jobs.append((rx, multis))
    if singles:
        rx = _alt_rx_for(singles)
        if rx is not None:
            jobs.append((rx, singles))
    hlows = [(h or "").strip().lower() for h in (holders or [])]
    hlows = [h for h in hlows if len(h) >= 3]
    maxh = max([len(h) for h in hlows] or [0])
    found = {}
    for rx, want in jobs:
        single_rx = want is singles
        for m in _rx_find_all(rx, text_low):
            low = m.group(0)
            if low not in want:
                continue
            s, e = m.start(), m.end()
            if single_rx and text_orig is not None \
                    and _single_guarded(text_orig, s, e):
                continue
            if _match_covered(text_low, s, e, hlows, maxh):
                continue
            found.setdefault(low, []).append((s, e))
    return found


def _apply_matches(text, matches):
    """Replace matched spans with "[name withheld]", longest-first wins
    on overlap (exactly as sequential longest-first redaction would).
    Returns (new_text, n)."""
    ordered = sorted(((s, e) for hits in matches.values()
                      for s, e in hits),
                     key=lambda x: (-(x[1] - x[0]), x[0]))
    taken = []
    for s, e in ordered:
        if all(e <= a or s >= b for a, b in taken):
            taken.append((s, e))
    taken.sort()
    parts = []
    last = 0
    for s, e in taken:
        parts.append(text[last:s])
        parts.append("[name withheld]")
        last = e
    parts.append(text[last:])
    return "".join(parts), len(taken)


def redact_text_with_holders(text, lits, holders):
    """Replace every literal outside holder/citation-URL spans with
    "[name withheld]". THE shared exact-redaction primitive: match
    semantics (word-boundary, longest-first, holder + URL spans) are
    identical to the leak assertion's _check, and courts/scrub.py
    imports this same function for gate.py/gate2.py/tier2-split.py —
    one implementation, so redaction and assertion cannot drift apart.
    One pass over one compiled alternation per scope (round 6c);
    holder occurrences are never altered — in-span matches are
    skipped. Returns (text, n)."""
    if not isinstance(text, str) or not text or not lits:
        return text, 0
    low = text.lower()
    lows = list(dict.fromkeys(lit.lower() for lit in lits))
    matches = _collect_matches(low, lows, None, text, holders)
    if not matches:
        return text, 0
    return _apply_matches(text, matches)


def _leak_context(raw_cases, public_cases, oracle_by_id=None,
                  nosp_extras=None, raw_t2=None, public_t2=None,
                  t2_downgraded=None):
    """ONE computation of the assertion's literals/holders/sources,
    shared by scrub_dist_final (redact) and assert_no_leaks (verify)."""
    multis, singles, sources, exempt_map = leak_literals_for_assertion(
        raw_cases, oracle_by_id, nosp_extras, raw_t2, t2_downgraded)
    global _GLOBAL_MULTI_RX, _GLOBAL_MULTI_SET
    _GLOBAL_MULTI_SET = frozenset(m.lower() for m in multis)
    _GLOBAL_MULTI_RX = _alt_rx_for(_GLOBAL_MULTI_SET)
    pub_by_rid = {c.get("record_id") or c.get("merged_id"): c
                  for c in public_cases}
    for p in (public_t2 or []):
        pub_by_rid[t2_id(p)] = p
    union_holders = set()
    for pub in public_cases:
        union_holders.update(holders_for_public(pub))
    for pub in (public_t2 or []):
        union_holders.update(holders_for_public(pub))
    return {"multi_low": [(l, l.lower()) for l in multis],
            "singles": singles, "sources": sources,
            "exempt_map": exempt_map, "pub_by_rid": pub_by_rid,
            "union_holders": sorted(union_holders),
            "n_multis": len(multis)}


def _t1_record_lits(ctx, rid):
    """Exactly the multi+single literals the assertion checks in one
    tier-1 record's own dict/files: exempt collisions are skipped
    outside their source records but still checked inside them."""
    return ([(o, l) for o, l in ctx["multi_low"]
             if rid in ctx["sources"].get(l, ())
             or l not in ctx["exempt_map"]]
            + [(l, l.lower()) for l in ctx["singles"].get(rid, [])])


def _t2_record_lits(ctx, rid, pub):
    """Tier-2 per-record literals: as tier-1, plus the record skips
    exactly its own named_safe literals (the same strings its holder
    spans already allow; robust to HTML-escaped court strings and
    truncated descriptions — nothing new publishes)."""
    t2_held = set()
    for o in (pub.get("officers") or []):
        if isinstance(o, dict) and o.get("publish_grade") == "named_safe":
            for nm in (o.get("name"), o.get("name_public")):
                if nm:
                    for lit in _name_literals(nm):
                        t2_held.add(lit.lower())
    return ([(o, l) for o, l in ctx["multi_low"]
             if (rid in ctx["sources"].get(l, ())
                 or l not in ctx["exempt_map"])
             and l not in t2_held]
            + [(l, l.lower()) for l in ctx["singles"].get(rid, [])
               if l.lower() not in t2_held])


_PUB_ID_KEYS = frozenset(("record_id", "merged_id", "case_id",
                          "merged_case_id", "alias_case_ids",
                          "alias_merged_ids"))


def _redact_pub_value(value, lits, holders, key=None):
    """Recursively redact every string in a public dict (keys and id
    scalars are kept verbatim)."""
    if isinstance(value, str):
        if key in _PUB_ID_KEYS:
            return value, 0
        return redact_text_with_holders(value, lits, holders)
    if isinstance(value, dict):
        n = 0
        out = {}
        for k, v in value.items():
            v2, c = _redact_pub_value(v, lits, holders, k)
            out[k] = v2
            n += c
        return out, n
    if isinstance(value, list):
        n = 0
        out = []
        for v in value:
            v2, c = _redact_pub_value(v, lits, holders)
            out.append(v2)
            n += c
        return out, n
    return value, 0


def _scrub_public_dicts(ctx, public_cases, t2public, over_public=None):
    """Scrub the in-memory public dicts with the assertion's own
    per-record literals/holders (shared _leak_context + _collect_
    matches), blob-verifying every changed dict. Round 6c runs this
    ONCE on the data before rendering, so dist files are born clean;
    the post-render dist pass is then purely the final assertion
    (plus fail-closed fixing of rendered-only residuals). Mutates
    the passed lists in place. Returns (spans, log, bad)."""
    log = []
    bad = []
    spans = 0

    def _note(label, lit):
        if len(log) < 200:
            log.append("SCRUB %s: %r" % (label, lit))

    # A clean dict needs no blob re-verify: the per-string matcher
    # finds a superset of what the blob check could find (JSON
    # escaping can only hide a raw match from the blob, never invent
    # one), so n == 0 proves the dict check passes; changed dicts
    # are blob-verified below.
    for i, pub in enumerate(public_cases):
        rid = pub.get("record_id") or pub.get("merged_id")
        lits = _t1_record_lits(ctx, rid)
        holders = holders_for_public(pub)
        new, n = _redact_pub_value(
            pub, [o for o, _l in lits], holders)
        if n:
            public_cases[i] = new
            ctx["pub_by_rid"][rid] = new
            spans += n
            _note("record %s (dict)" % rid, "%d span(s)" % n)
            blob = json.dumps(new, ensure_ascii=False)
            ms = _collect_matches(blob.lower(), [l for _, l in lits],
                                  None, blob, holders)
            if ms:
                first = next(o for o, l in lits if l in ms)
                bad.append("LEAK record %s (dict): %r" % (rid, first))
    for lst in (t2public or [], over_public or []):
        for i, pub in enumerate(lst):
            rid = t2_id(pub)
            lits = _t2_record_lits(ctx, rid, pub)
            holders = holders_for_public(pub)
            new, n = _redact_pub_value(
                pub, [o for o, _l in lits], holders)
            if n:
                lst[i] = new
                ctx["pub_by_rid"][rid] = new
                spans += n
                _note("trial-court %s (dict)" % rid, "%d span(s)" % n)
                blob = json.dumps(new, ensure_ascii=False)
                ms = _collect_matches(blob.lower(), [l for _, l in lits],
                                      None, blob, holders)
                if ms:
                    first = next(o for o, l in lits if l in ms)
                    bad.append("LEAK trial-court %s (dict): %r"
                               % (rid, first))
    return spans, log, bad


def assert_no_victim_names(dist, raw_records, fail=True):
    """Complainants and victims are never named. A record's own page must not
    carry its victims' full names; site-wide files must not carry any
    victim's full name, except names that also belong to a cleared officer
    or a judge somewhere (same string, different person)."""
    def full_names(r):
        out = set()
        for n in victim_names_of(r):
            if PLACEHOLDER_NAME_RX.search(n):
                continue
            words = re.findall(r"[A-Za-z][A-Za-z.'-]*", n)
            if len(words) >= 2 and len(" ".join(words)) >= 6 and \
                    all(w[:1].isupper() for w in words if len(w) > 2):
                out.add(" ".join(words))
        return out

    def rx_of(names):
        return re.compile(r"\b(?:%s)\b" % "|".join(
            re.escape(n).replace(r"\ ", r"\s+")
            for n in sorted(names, key=len, reverse=True))) if names else None

    by_id, allowed = {}, set()
    for r in raw_records:
        rid = r.get("record_id") or r.get("case_id") or r.get("merged_id")
        by_id[rid] = full_names(r)
        for o in r.get("officers") or []:
            if isinstance(o, dict) and o.get("publish_grade") == "named_safe":
                allowed |= {x for x in (o.get("name"), o.get("name_public")) if x}
        allowed |= {j for j in (r.get("judges") or []) if isinstance(j, str)}
    everyone = set().union(*by_id.values()) if by_id else set()
    site_rx = rx_of({n for n in everyone
                     if not any(n in a or a in n for a in allowed)})
    judge_ctx = re.compile(r"(?i)(judge|justice|presiding officer|magistrate|"
                           r"hon'?ble|court\b[^.;:\n]{0,60}\()[^;:\n]{0,24}$"
                           r"|(?:following|distinguished|relied on|in|per|see|"
                           r"cited|applying|awarded in)\s+$")
    hits = []
    for root, _d, files in os.walk(dist):
        rel_root = os.path.relpath(root, dist).split(os.sep)
        own = None
        if len(rel_root) == 2 and rel_root[0] in ("incident", "trial-court"):
            own = rx_of(by_id.get(rel_root[1], set()))
        for f in files:
            if not f.endswith((".html", ".json", ".md", ".txt", ".csv",
                               ".xml")):
                continue
            rx = own if len(rel_root) == 2 and rel_root[0] in (
                "incident", "trial-court") else site_rx
            if rx is None:
                continue
            path = os.path.join(root, f)
            text = open(path, encoding="utf-8", errors="replace").read()
            for m in rx.finditer(text):
                if judge_ctx.search(text[max(0, m.start() - 100):m.start()]) \
                        or re.match(r"\s*(?:\(\d{4}\)|v\.|vs\.?\s)",
                                    text[m.end():m.end() + 8]):
                    continue
                hits.append((os.path.relpath(path, dist), m.group(0)))
                break
    for h in hits[:int(os.environ.get("VICTIM_SHOW", "15"))]:
        print("VICTIM-NAME LEAK: %s: %s" % h)
    if hits:
        print("VICTIM-NAME LEAK TOTAL: %d files" % len(hits))
    if hits and fail:
        raise SystemExit("victim names found in %d published files" % len(hits))
    return hits


def scrub_dist_final(raw_cases, public_cases, oracle_by_id=None,
                     nosp_extras=None, raw_t2=None, public_t2=None,
                     t2_downgraded=None, ctx=None, skip_dicts=False):
    """Fail-closed final pass (round 6), MERGED scrub+verify: every
    public dict and every file under dist/ (HTML, JSON, CSV,
    llms*.txt, Markdown) is decided through the shared matcher
    (_collect_matches) with the assertion's own literals and holders
    (shared _leak_context) — per-record units with their own holders,
    aggregates with union holders, other chrome strictly. Matches are
    redacted, written back, and the scrubbed text is verified with a
    fresh matcher run; anything still matching is a genuine scrub bug
    and fails the build as a LEAK (same format as the assertion).
    Adjudicated EXEMPT_GLOBAL collisions are skipped outside their
    source records, exactly like the assertion, so adjudicated
    publishes survive; everything else brackets. Every redaction is
    logged (file + literal) for later human adjudication, which can
    restore a mention via EXEMPT_GLOBAL. The standalone
    assert_no_leaks (same matcher, independent walk) remains for
    tests and manual verification. Returns (spans, files_changed).

    Round 6c: the data dicts are scrubbed once before rendering
    (main() calls _scrub_public_dicts, reusing its ctx here via
    `ctx` + `skip_dicts`), so this pass only asserts/fixes the
    rendered files."""
    import time as _time
    _t0 = _time.time()
    if ctx is None:
        ctx = _leak_context(raw_cases, public_cases, oracle_by_id,
                            nosp_extras, raw_t2, public_t2, t2_downgraded)
    log = []
    bad = []
    spans = 0
    files_changed = 0
    if not skip_dicts:
        s0, log0, bad0 = _scrub_public_dicts(ctx, public_cases,
                                             public_t2)
        spans += s0
        log.extend(log0)
        bad.extend(bad0)

    def _note(label, lit):
        if len(log) < 200:
            log.append("SCRUB %s: %r" % (label, lit))

    def _scrub_unit(text, lits, holders, label):
        """(new_text, n): scrub one text through the shared matcher;
        verify the scrubbed text; record LEAK residuals (genuine bugs)
        and SCRUB trail lines. Pure verification for clean texts."""
        lows = [l for _, l in lits]
        if not lows:
            return text, 0
        ms = _collect_matches(text.lower(), lows, None, text, holders)
        if not ms:
            return text, 0
        new, n = _apply_matches(text, ms)
        for o, l in lits:
            if l in ms:
                _note(label, o)
        ms2 = _collect_matches(new.lower(), lows, None, new, holders)
        if ms2:
            first = next(o for o, l in lits if l in ms2)
            bad.append("LEAK %s: %r" % (label, first))
        return new, n

    def _scrub_file(path, lits, holders, label):
        try:
            with open(path, encoding="utf-8") as f:
                text = f.read()
        except (OSError, UnicodeDecodeError):
            return 0
        new, n = _scrub_unit(text, lits, holders, label)
        if n:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new)
        return n

    # 1. In-memory public dicts are scrubbed by _scrub_public_dicts
    # (before rendering when skip_dicts, else above); the passes
    # below cover dist.
    # 2. Per-record files with their own holders.
    for raw in raw_cases:
        rid = raw.get("record_id") or raw.get("merged_id")
        pub = ctx["pub_by_rid"].get(rid)
        if pub is None:
            continue
        lits = _t1_record_lits(ctx, rid)
        holders = holders_for_public(pub)
        for rel in ("incident/%s/index.html" % rid,
                    "incident/%s/index.md" % rid,
                    "data/case/%s.json" % rid):
            n = _scrub_file(os.path.join(DIST, rel), lits, holders,
                            "record %s (%s)" % (rid, rel))
            spans += n
            files_changed += bool(n)
    for raw in (raw_t2 or []):
        rid = t2_id(raw)
        pub = ctx["pub_by_rid"].get(rid)
        if pub is None:
            continue
        lits = _t2_record_lits(ctx, rid, pub)
        holders = holders_for_public(pub)
        for rel in ("trial-court/%s/index.html" % rid,
                    "trial-court/%s/index.md" % rid,
                    "data/case/%s.json" % rid):
            n = _scrub_file(os.path.join(DIST, rel), lits, holders,
                            "trial-court %s (%s)" % (rid, rel))
            spans += n
            files_changed += bool(n)
    # 3. Every remaining file: aggregates with union holders, other
    # chrome strictly (it must contain no record names at all).
    # data/case/*.json files are already covered per-record above with
    # superset lits and subset holders (this pass would provably
    # no-op there); the standalone assertion still walks them.
    for root, _dirs, files in os.walk(DIST):
        for fn in files:
            p = os.path.join(root, fn)
            rel = os.path.relpath(p, DIST)
            if re.match(REC_INCIDENT_RX, rel):
                continue  # covered per-record above
            if re.match(REC_TRIAL_RX, rel):
                continue  # covered per-record above
            if re.match(REC_CASEJSON_RX, rel):
                continue  # covered per-record above (superset lits)
            if rel.startswith(AGGREGATE_PREFIXES):
                lits = [(o, l) for o, l in ctx["multi_low"]
                        if l not in ctx["exempt_map"]]
                n = _scrub_file(p, lits, ctx["union_holders"], rel)
            else:
                n = _scrub_file(p, ctx["multi_low"], [], rel)
            spans += n
            files_changed += bool(n)
    for line in log:
        print(line)
    print("scrub: %d span(s) redacted in %d dist file(s) (%.0fs)"
          % (spans, files_changed, _time.time() - _t0))
    if bad:
        for b in bad[:200]:
            print(b)
        sys.exit("BUILD REFUSED: %d scrub-residual leak(s) in dist/ "
                 "(genuine scrub bug; showing %d)"
                 % (len(bad), min(200, len(bad))))
    print("gate: dist/ clean (%d multi-word literals, singles in %d "
          "record files, %d exempted collisions)"
          % (ctx["n_multis"], len(ctx["singles"]), len(EXEMPT_GLOBAL)))
    return spans, files_changed


def assert_no_leaks(raw_cases, public_cases, oracle_by_id=None,
                    nosp_extras=None, raw_t2=None, public_t2=None,
                    t2_downgraded=None):
    """Grep dist/ for every unnamed officer name (both tiers) and every
    anonymised legal victim name; fail the build if any appears outside
    a legitimate holder span. Per-record dict + record files are
    checked precisely; aggregates with union holders; remaining chrome
    strictly (it must contain no record names at all). Literals and
    holders come from the shared _leak_context (same as the final
    scrub), so a failure here is a genuine bug, never new data."""
    ctx = _leak_context(raw_cases, public_cases, oracle_by_id,
                        nosp_extras, raw_t2, public_t2, t2_downgraded)
    multi_low = ctx["multi_low"]
    singles = ctx["singles"]
    sources = ctx["sources"]
    exempt_map = ctx["exempt_map"]
    pub_by_rid = ctx["pub_by_rid"]
    union_holders = ctx["union_holders"]
    bad = []

    def _check(text_orig, lits, holders, label):
        lows = [l for _, l in lits]
        if not lows:
            return
        ms = _collect_matches(text_orig.lower(), lows, None,
                              text_orig, holders)
        if ms:
            first = next(o for o, l in lits if l in ms)
            bad.append("LEAK %s: %r" % (label, first))

    # 1. Per-record: redacted dict + own incident page + md twin.
    for raw in raw_cases:
        rid = raw.get("record_id") or raw.get("merged_id")
        pub = pub_by_rid.get(rid)
        if pub is None:
            continue
        holders = holders_for_public(pub)
        lits = _t1_record_lits(ctx, rid)
        blob = json.dumps(pub, ensure_ascii=False)
        _check(blob, lits, holders, "record %s (dict)" % rid)
        for rel in ("incident/%s/index.html" % rid,
                    "incident/%s/index.md" % rid,
                    "data/case/%s.json" % rid):
            _check(_read_dist(rel), lits, holders, "record %s (%s)"
                   % (rid, rel))
        if len(bad) >= 200:
            break
    # 1b. Tier-2 per-record: redacted dict + own record files.
    for raw in (raw_t2 or []):
        rid = t2_id(raw)
        pub = pub_by_rid.get(rid)
        if pub is None:
            continue
        holders = holders_for_public(pub)
        lits = _t2_record_lits(ctx, rid, pub)
        blob = json.dumps(pub, ensure_ascii=False)
        _check(blob, lits, holders, "trial-court %s (dict)" % rid)
        for rel in ("trial-court/%s/index.html" % rid,
                    "trial-court/%s/index.md" % rid,
                    "data/case/%s.json" % rid):
            _check(_read_dist(rel), lits, holders, "trial-court %s (%s)"
                   % (rid, rel))
        if len(bad) >= 200:
            break
    # 2. Aggregates (union holders) + strict chrome.
    if len(bad) < 20:
        for root, _dirs, files in os.walk(DIST):
            for fn in files:
                p = os.path.join(root, fn)
                rel = os.path.relpath(p, DIST)
                if re.match(REC_INCIDENT_RX, rel):
                    continue  # covered per-record above
                if re.match(REC_TRIAL_RX, rel):
                    continue  # covered per-record above
                try:
                    with open(p, encoding="utf-8") as f:
                        txt = f.read()
                except (OSError, UnicodeDecodeError):
                    continue
                if rel.startswith(AGGREGATE_PREFIXES):
                    lits = [(o, l) for o, l in multi_low
                            if l not in exempt_map]
                    _check(txt, lits, union_holders, rel)
                else:
                    _check(txt, multi_low, [], rel)
                if len(bad) >= 200:
                    break
            if len(bad) >= 200:
                break
    if bad:
        for b in bad[:200]:
            print(b)
        sys.exit("BUILD REFUSED: %d gated-name leak(s) in dist/ "
                 "(showing %d)" % (len(bad), min(200, len(bad))))
    print("gate: dist/ clean (%d multi-word literals, singles in %d "
          "record files, %d exempted collisions)"
          % (ctx["n_multis"], len(singles), len(EXEMPT_GLOBAL)))


def csv_officers_cell(c):
    bits = []
    for o in (c.get("officers") or []):
        if not isinstance(o, dict):
            continue
        if o.get("publish_grade") == "named_safe" and o.get("name"):
            bit = o["name"]
            if o.get("rank"):
                bit += " \u2014 %s" % o["rank"]
            if o.get("unit"):
                bit += ", %s" % o["unit"]
            bits.append(bit)
        else:
            bits.append(officer_display(o, c))
    return "; ".join(bits) if bits else "Not stated"


def csv_victims_cell(c):
    if is_anonymised(c):
        red = c.get("victims_redacted") or []
        vics = c.get("victims") or []
        bits = []
        for i, d in enumerate(victim_descriptors(c)):
            v = vics[i] if i < len(vics) and isinstance(vics[i], dict) else {}
            r = red[i] if i < len(red) and isinstance(red[i], dict) else {}
            age = r.get("age") if r.get("age") is not None else v.get("age")
            gender = r.get("gender") or v.get("gender") or ""
            extra = []
            if age is not None and str(age) not in d:
                extra.append(str(age))
            if gender and gender.lower() not in d.lower():
                extra.append(gender)
            bits.append(d + (" (%s)" % ", ".join(extra) if extra else ""))
        return "; ".join(bits) if bits else "Not stated"
    return victim_line(c)


def write_public_csv(upstream_csv, dest, public_cases, raw_by_id=None,
                     oracle_by_id=None, nosp_extras=None):
    """Regenerate cases.csv from the PUBLIC-SAFE records: gated officer
    display forms, victim role nouns, scrubbed narrative/title cells.
    Internal-notes columns (fidelity_changes, editor_notes) are
    scrubbed with the record's full pattern set."""
    import csv as _csv
    by_id = {c.get("merged_id"): c for c in public_cases}
    raw_by_id = raw_by_id or {}
    oracle_by_id = oracle_by_id or {}
    with open(upstream_csv, encoding="utf-8") as f:
        reader = _csv.DictReader(f)
        header = list(reader.fieldnames or [])
        rows = list(reader)
    if "record_id" not in header:
        header.insert(1, "record_id")
    out = []
    for row in rows:
        c = by_id.get(row.get("merged_id"))
        if c is None:
            continue  # gated out (review_remove)
        raw = raw_by_id.get(row.get("merged_id"), c)
        oracle = oracle_by_id.get(row.get("merged_id"))
        row["record_id"] = c.get("record_id") or ""
        for k in ("display_title", "display_title_redacted", "case_title",
                  "citation", "summary", "verification_note",
                  "court_quote"):
            if k in row:
                row[k] = c.get(k) or ""
        for k in ("fidelity_changes", "editor_notes"):
            if k in row and row[k]:
                row[k] = scrub_text_with_record(row[k], raw, oracle,
                                                nosp_extras)
        vic = anonymise_victims({k: v for k, v in row.items()
                                 if isinstance(v, str) and k != "victims"}
                                | {"victims": raw.get("victims"),
                                   "district": c.get("district"),
                                   "city_town": c.get("city_town"),
                                   "state": c.get("state")},
                                raw, (), oracle)
        for k, v in vic.items():
            if k in row and k not in ("victims", "merged_id", "record_id") and \
                    isinstance(v, str) and not re.search(r"(url|_id)$", k):
                row[k] = v
        if "officers" in row:
            row["officers"] = csv_officers_cell(c)
        if "victims" in row:
            row["victims"] = csv_victims_cell(c)
        if "victims_redacted" in row:
            row["victims_redacted"] = "; ".join(
                r.get("descriptor") for r in (c.get("victims_redacted") or [])
                if isinstance(r, dict) and r.get("descriptor"))
        out.append(row)
    with open(dest, "w", encoding="utf-8", newline="") as f:
        w = _csv.DictWriter(f, fieldnames=header, extrasaction="ignore")
        w.writeheader()
        w.writerows(out)


def is_local(c):
    """True when this watch renders the record's page (its home)."""
    return (c.get("watch") or WATCH) == WATCH


def watch_prefix(c):
    """Root-relative prefix (under this watch's BASE) for a record whose
    home is another watch: '' when local, '/copwatchindia' when the
    umbrella lists a police record. A home outside this watch's base is
    linked absolutely."""
    w = c.get("watch") or WATCH
    if w == WATCH:
        return ""
    other = next((x["base"] for x in WATCHES if x["slug"] == w), None)
    if other is None:
        sys.exit("BUILD REFUSED: record %s has unknown home watch %r"
                 % (c.get("record_id") or c.get("case_id"), w))
    if other.startswith(BASE + "/"):
        return other[len(BASE):]
    return SITE_ORIGIN + other


def rec_path(c, kind, rid):
    """Path of a record page: /incident/<id> or /trial-court/<id>, under
    the record's home watch."""
    return "%s/%s/%s" % (watch_prefix(c), kind, rid)


# Per-record page paths (checked against the record's own names in the
# final leak pass; everything else is checked as an aggregate/chrome file).
# Record-id shapes: CW-/CWC- (HC/SC), t2*/T2* (police trial court),
# bx-* (civil-servant trial court).
REC_INCIDENT_RX = r"incident/(CW-|CWC-)"
REC_TRIAL_RX = r"trial-court/([tT]2|bx-)"
REC_CASEJSON_RX = r"data/case/(CW-|CWC-|[tT]2|bx-)"


def load_dataset_rows(fname):
    """Concatenate `fname` across the profile's datasets, tagging each row
    with its service and home watch. A missing file is an empty list; an
    unreadable one stops the build (fail closed, never publish partial)."""
    rows = []
    for d in DATASETS:
        path = os.path.join(d["dir"], fname)
        if not os.path.exists(path):
            continue
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, list):
            sys.exit("BUILD REFUSED: %s is not a JSON array" % path)
        for r in data:
            if isinstance(r, dict):
                r.setdefault("service", d["service"])
                r["watch"] = d["home"]
                rows.append(r)
        print("data: %s %d rows (%s, home %s)"
              % (os.path.relpath(path, ROOT), len(data), d["service"],
                 d["home"]))
    return rows


def main():
    # Inputs: the profile's datasets, committed under data/ and already
    # name-gated upstream (this repo is public: nothing ungated lives here).
    # Each record is tagged with its `service` (police / civil / ...) and
    # its home `watch` (the watch whose pages render it).
    raw_cases = load_dataset_rows("cases.json")
    # Optional ungated oracle (--oracle /private/cases.json): supplies scrub
    # patterns for gate-redacted names so a maintainer's LOCAL build can run
    # the full leak assertion. Never committed; absent on Vercel.
    oracle_by_id = {}
    oracle_path = profiles.cli_arg("--oracle")
    if oracle_path:
        with open(oracle_path, encoding="utf-8") as f:
            for c in json.load(f):
                if isinstance(c, dict) and c.get("merged_id"):
                    oracle_by_id[c["merged_id"]] = c
        print("oracle: %d ungated records loaded" % len(oracle_by_id))
    else:
        print("oracle: none (patterns from gated data only)")
    # Pre-publish gates on the RAW records (verdict, V3 checklist,
    # review_remove), then deterministic record IDs, then redaction.
    # Every render below consumes ONLY the public-safe records.
    publishable = gate_records(raw_cases)
    assign_record_ids(publishable)
    nosp_extras = build_nosp_extras(publishable, oracle_by_id)
    if nosp_extras:
        print("nosp: %d records share %d spelling variants"
              % (len(nosp_extras),
                 sum(len(v) for v in nosp_extras.values())))
    cases = [redact_record(c, oracle_by_id.get(c.get("merged_id")),
                           nosp_extras)
             for c in publishable]
    n_restored = sum(1 for raw, pub in zip(publishable, cases)
                     if not raw.get("verification_note")
                     and pub.get("verification_note"))
    if n_restored:
        DERIVED_LOG.append("verification_note restored from oracle for "
                           "%d records" % n_restored)
    # Carry record_id back onto the raw records for the leak assertion.
    for raw, pub in zip(publishable, cases):
        raw["record_id"] = pub.get("record_id")
    raw_by_id = {c.get("merged_id"): c for c in publishable}
    # Tier-2 pipeline: cross-tier scrub patterns come from the tier-1
    # withheld names (fail-closed, dynamic per build).
    raw_t2 = load_dataset_rows("tier2.json")
    context = {}
    if P.get("context_charts") and os.path.exists(CONTEXT_JSON):
        try:
            with open(CONTEXT_JSON, encoding="utf-8") as f:
                context = json.load(f)
        except (OSError, ValueError) as e:
            print("context: unreadable (%s); charts skipped" % e)
            context = {}
    t2_pats, t2_lows = t2_scrub_patterns(publishable, oracle_by_id,
                                         nosp_extras)
    t2_prot = t1_held_names(publishable)
    t2public = []
    t2_downgraded = {}
    for r in raw_t2:
        p, down = build_t2_public(r, t2_pats, t2_lows, t2_prot)
        t2public.append(p)
        if down:
            t2_downgraded[t2_id(r)] = down
    if t2_downgraded:
        print("tier2: %d named_safe officers downgraded to rank+unit "
              "(tier-1 withhold wins): %s"
              % (sum(len(v) for v in t2_downgraded.values()),
                 ", ".join("%s=%s" % (k, ";".join(v))
                           for k, v in sorted(t2_downgraded.items()))))
    print("tier2: %d records, %d cross-tier scrub patterns"
          % (len(t2public), len(t2_pats)))
    over_rows = load_dataset_rows("tier2-overturned.json")
    n_overturned = len(over_rows)
    print("overturned: %d convictions set aside (kept out of counts)"
          % n_overturned)
    # Public-safe copies of the set-aside rows through the same scrub
    # pipeline as the counted trial-court records. They stay out of
    # every count and page, but ship inside data/all-cases.json.
    over_public = []
    for r in over_rows:
        if not isinstance(r, dict):
            continue
        p, down = build_t2_public(r, t2_pats, t2_lows, t2_prot)
        over_public.append(p)
        if down:
            t2_downgraded[t2_id(r)] = down
    if over_public:
        print("overturned: %d public-safe set-aside rows for "
              "all-cases.json" % len(over_public))
    # Round 6c: scrub the DATA once, before rendering (and before
    # any grouping/sorting takes references), with the assertion's
    # own literals/holders — files are then born clean and the
    # post-render dist pass is purely the final assertion (plus
    # fail-closed fixing of rendered-only residuals).
    _assert_t2_raw = list(raw_t2) + [r for r in over_rows
                                    if isinstance(r, dict)]
    _assert_t2_pub = t2public + over_public
    _pre_ctx = _leak_context(publishable, cases, oracle_by_id,
                             nosp_extras, _assert_t2_raw,
                             _assert_t2_pub, t2_downgraded)
    _pre_spans, _pre_log, _pre_bad = _scrub_public_dicts(
        _pre_ctx, cases, t2public, over_public)
    for _line in _pre_log:
        print(_line)
    print("scrub: %d span(s) redacted in public dicts pre-render"
          % _pre_spans)
    if _pre_bad:
        for _b in _pre_bad[:200]:
            print(_b)
        sys.exit("BUILD REFUSED: %d scrub-residual leak(s) in public "
                 "dicts (genuine scrub bug; showing %d)"
                 % (len(_pre_bad), min(200, len(_pre_bad))))
    # Publish holds: drop held records from every rendered set (after the
    # scrub, which keeps their names in the patterns).
    held = {}
    for c in publishable:
        why = publish_hold(c, "hcsc")
        if why:
            held[("incident", c.get("record_id") or c.get("merged_id"))] = why
    for r in raw_t2:
        why = publish_hold(r, "trial")
        if why:
            held[("trial-court", t2_id(r))] = why
    held_over = {t2_id(r) for r in over_rows
                 if isinstance(r, dict) and publish_hold(r, "trial")}
    cases = [c for c in cases if ("incident", rec_id(c)) not in held]
    t2public = [p for p in t2public if ("trial-court", t2_id(p)) not in held]
    over_public = [p for p in over_public if t2_id(p) not in held_over]
    n_overturned = len(over_public)
    print("hold: %d HC/SC and %d trial-court records held off the site "
          "(%s); %d set-aside rows held"
          % (sum(1 for k in held if k[0] == "incident"),
             sum(1 for k in held if k[0] == "trial-court"),
             ", ".join("%s=%d" % kv for kv in
                       sorted(Counter(held.values()).items())),
             len(held_over)))
    SERVICE_COUNTS.update({s: 0 for s in SERVICE_WORDS})
    SERVICE_COUNTS.update(Counter((r.get("service") or "")
                                  for r in list(cases) + list(t2public)))
    cases.sort(key=lambda c: (c.get("state") or "",
                              c.get("judgment_date") or ""))
    by_state = {}
    for c in cases:
        by_state.setdefault(c.get("state", ""), []).append(c)
    t2_by_state = {}
    for r in t2public:
        t2_by_state.setdefault(r.get("state", ""), []).append(r)

    ref_index = read_ref("index.html")
    ref_method = read_ref("methodology.html")
    with open(REF_STYLES, encoding="utf-8") as f:
        orig_css = f.read()
    with open(REF_NAVJS, encoding="utf-8") as f:
        nav_js = f.read()

    if os.path.isdir(DIST):
        shutil.rmtree(DIST)
    os.makedirs(os.path.join(DIST, "data"), exist_ok=True)
    os.makedirs(os.path.join(DIST, "assets", "brand"), exist_ok=True)

    # Verbatim assets + minimal additions.
    write(os.path.join(DIST, "styles.css"), orig_css + CSS_ADDITIONS
          + (SWITCHER_CSS if SWITCHER_ON else ""))
    write(os.path.join(DIST, "public-nav.js"), nav_js)
    _n1, _n2 = len(cases), len(t2public)
    write(os.path.join(DIST, "tracker.js"),
          TRACKER_JS.replace("__BASE__", BASE)
          .replace("__VERIFIED_LABEL__", "%s-verified" % SHORT_NAME)
          .replace("__TOTAL_ALL__", fmt_thousands(_n1 + _n2))
          .replace("__N_HCSC__", str(_n1))
          .replace("__N_TRIAL__", str(_n2)))
    write(os.path.join(DIST, "patterns.js"), PATTERNS_JS)
    for fn in os.listdir(REF_BRAND):
        src = os.path.join(REF_BRAND, fn)
        if os.path.isfile(src):
            shutil.copy(src, os.path.join(DIST, "assets", "brand", fn))

    # Public data files: the REDACTED records (unnamed officers lose
    # `name`, anonymised victims lose `name`, non-public stores dropped,
    # narrative leftovers scrubbed).
    with open(os.path.join(DIST, "data", "cases.json"), "w",
              encoding="utf-8") as f:
        json.dump(cases, f, ensure_ascii=False, indent=1)
        f.write("\n")
    data_files = [("cases.json",
                   os.path.getsize(os.path.join(DIST, "data", "cases.json")),
                   "Full dataset as one JSON array (bulk download).")]
    # Slim tracker index: only the fields the table/filters need (compact,
    # short keys). tracker.js loads this instead of cases.json; its gated
    # names cannot leak through search (display-safe officers text only,
    # no victim names, no raw officer names).
    index_recs = ([build_index_record(c) for c in cases]
                  + [build_t2_index_record(p) for p in t2public])
    with open(os.path.join(DIST, "data", "index.json"), "w",
              encoding="utf-8") as f:
        json.dump(index_recs, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    data_files.append(
        ("index.json",
         os.path.getsize(os.path.join(DIST, "data", "index.json")),
         "Slim tracker index covering both tiers (rows carry a tier "
         "field); powers on-site search and filters."))
    # Tier-2 public data: scrubbed records + slim tracker index (fetched
    # lazily when the Court-level facet leaves HC/SC) + NCRB context.
    with open(os.path.join(DIST, "data", "tier2.json"), "w",
              encoding="utf-8") as f:
        json.dump(t2public, f, ensure_ascii=False, indent=1)
        f.write("\n")
    data_files.append(
        ("tier2.json",
         os.path.getsize(os.path.join(DIST, "data", "tier2.json")),
         "Trial-court convictions as one JSON array (scrubbed; officers "
         "by gated display forms only)."))
    t2_index = [build_t2_index_record(p) for p in t2public]
    with open(os.path.join(DIST, "data", "index-trial.json"), "w",
              encoding="utf-8") as f:
        json.dump(t2_index, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    data_files.append(
        ("index-trial.json",
         os.path.getsize(os.path.join(DIST, "data", "index-trial.json")),
         "Trial-court slice of the slim tracker index (fallback; "
         "index.json already carries both tiers)."))
    # Combined machine file for AI consumers: every published record
    # (HC/SC gated records + trial-court current + set-aside) as one
    # JSON array. `tier` marks the dataset origin ("hc_sc" or "trial",
    # the index.json vocabulary); the verification Tier A/B string it
    # replaces stays derivable from `verification_status` (uniformly
    # Tier A / V2 in this dataset). Set-aside rows keep
    # appeal_status=set_aside and stay out of every count and page.
    all_cases = []
    for c in cases:
        d = dict(c)
        d["tier"] = "hc_sc"
        all_cases.append(d)
    for p in t2public + over_public:
        d = dict(p)
        d["tier"] = "trial"
        all_cases.append(d)
    with open(os.path.join(DIST, "data", "all-cases.json"), "w",
              encoding="utf-8") as f:
        json.dump(all_cases, f, ensure_ascii=False, indent=1)
        f.write("\n")
    data_files.append(
        ("all-cases.json",
         os.path.getsize(os.path.join(DIST, "data", "all-cases.json")),
         "Every published record as one JSON array (HC/SC judgments + "
         "trial-court convictions including set-aside; rows carry a "
         "tier field, hc_sc or trial)."))
    if context:
        with open(os.path.join(DIST, "data", "context.json"), "w",
                  encoding="utf-8") as f:
            json.dump(context, f, ensure_ascii=False, indent=1)
            f.write("\n")
        data_files.append(
            ("context.json",
             os.path.getsize(os.path.join(DIST, "data", "context.json")),
             "National context series (NCRB/NHRC) behind the Patterns "
             "complaints-vs-convictions charts."))
    # Record pages + per-record JSON exist only for records whose home is
    # this watch; the rest are listed here and link to their home watch.
    local_cases = [c for c in cases if is_local(c)]
    local_t2 = [p for p in t2public if is_local(p)]
    # Per-record JSON, fetched on demand: one file per case at
    # /data/case/<record_id>.json (same redacted shape as cases.json).
    os.makedirs(os.path.join(DIST, "data", "case"), exist_ok=True)
    for c in local_cases:
        rid = c.get("record_id") or c["merged_id"]
        with open(os.path.join(DIST, "data", "case", "%s.json" % rid), "w",
                  encoding="utf-8") as f:
            json.dump(c, f, ensure_ascii=False, indent=1)
            f.write("\n")
    for p in local_t2:
        cid = t2_id(p)
        with open(os.path.join(DIST, "data", "case", "%s.json" % cid), "w",
                  encoding="utf-8") as f:
            json.dump(p, f, ensure_ascii=False, indent=1)
            f.write("\n")
    if os.path.exists(DATA_CSV):
        write_public_csv(DATA_CSV, os.path.join(DIST, "data", "cases.csv"),
                         cases, raw_by_id, oracle_by_id, nosp_extras)
        data_files.append(
            ("cases.csv",
             os.path.getsize(os.path.join(DIST, "data", "cases.csv")),
             "Same dataset as CSV, one row per case."))

    n = len(cases)
    n2 = len(t2public)
    total = n + n2
    head = headline_sentence(n, n2)
    # Home.
    home_main = build_home(cases, ref_index, t2public, n_overturned)
    home_desc = fill(T["home_desc"], headline=head)
    write(os.path.join(DIST, "index.html"),
          page_shell(T["home_title"], home_desc, "", home_main,
                     route="/", md_rel="/index.md",
                     extra_ld=[dataset_ld_node(n, n2, n_overturned)]))
    write(os.path.join(DIST, "index.md"),
          md_home(cases, by_state, t2public, n_overturned))
    # Tracker.
    tracker_main = build_tracker(cases, 60, t2public, n_overturned)
    tracker_desc = ("Browse %s in India, with sources, verification "
                    "status, court findings, and procedural history kept "
                    "distinct." % head)
    tracker_html = page_shell("Incident Tracker \u2014 " + SITE_NAME,
                              tracker_desc, "/tracker", tracker_main,
                              route="/tracker",
                              extra_head='<script src="/tracker.js" defer>'
                                         "</script>",
                              md_rel="/tracker/index.md")
    write(os.path.join(DIST, "tracker", "index.html"), tracker_html)
    write(os.path.join(DIST, "tracker.html"), tracker_html)
    tracker_md = md_tracker(cases, t2public, n_overturned)
    write(os.path.join(DIST, "tracker", "index.md"), tracker_md)
    write(os.path.join(DIST, "tracker.md"), tracker_md)
    # Patterns.
    patterns_main = build_patterns(cases, t2public, context,
                                  n_overturned)
    patterns_desc = ("Where adjudicated cases occur, how facts were verified, "
                     "and what the courts decided\u2014drawn from %s."
                     % head)
    patterns_html = page_shell("Patterns \u2014 " + SITE_NAME, patterns_desc,
                               "/patterns", patterns_main, route="/patterns",
                               extra_head='<script src="/patterns.js" defer>'
                                          "</script>",
                               md_rel="/patterns/index.md")
    write(os.path.join(DIST, "patterns", "index.html"), patterns_html)
    write(os.path.join(DIST, "patterns.html"), patterns_html)
    patterns_md = md_patterns(cases, t2public, context, n_overturned)
    write(os.path.join(DIST, "patterns", "index.md"), patterns_md)
    write(os.path.join(DIST, "patterns.md"), patterns_md)
    # Evergreen pages (reference main content, static links, trimmed chrome).
    # (slug, template html, title, description) from the profile.
    evergreen = [(slug, read_ref("%s.html" % slug),
                  "%s \u2014 %s" % (T["static_%s_title" % slug], SITE_NAME),
                  fill(T["static_%s_desc" % slug], headline=head))
                 for slug in P["static_pages"]]
    for slug, ref_html, title, desc in evergreen:
        main_html = static_links(extract_main(ref_html))
        if slug == "about":
            main_html = (about_counts_section(n, n2, n_overturned)
                         + main_html + about_ai_section())
        html_out = page_shell(title, desc, "/%s" % slug, main_html,
                              route="/%s" % slug,
                              md_rel="/%s/index.md" % slug)
        write(os.path.join(DIST, slug, "index.html"), html_out)
        write(os.path.join(DIST, "%s.html" % slug), html_out)
        twin = md_evergreen(title.split(" \u2014 ")[0], "/%s" % slug,
                            main_html)
        write(os.path.join(DIST, slug, "index.md"), twin)
        write(os.path.join(DIST, "%s.md" % slug), twin)
    # Methodology + court-adjudicated appendix.
    method_main = (static_links(extract_main(ref_method))
                   + methodology_appendix(n, n2, n_overturned))
    method_html = page_shell(
        "Methodology \u2014 " + SITE_NAME,
        ("How %s are verified: tiers, verification levels, and "
         "tracking of court action." % head),
        "/methodology", method_main, route="/methodology",
        md_rel="/methodology/index.md")
    write(os.path.join(DIST, "methodology", "index.html"), method_html)
    write(os.path.join(DIST, "methodology.html"), method_html)
    method_md = md_evergreen("Methodology", "/methodology", method_main)
    write(os.path.join(DIST, "methodology", "index.md"), method_md)
    write(os.path.join(DIST, "methodology.md"), method_md)
    # State pages.
    for s in STATES_36:
        smain = build_state_page(s, by_state.get(s, []))
        if by_state.get(s):
            sdesc = fill(T["state_desc"], n=len(by_state[s]), state=s)
            stitle = "%s \u2014 %d records \u2014 %s" % (
                s, len(by_state[s]), SITE_NAME)
        else:
            sdesc = fill(T["state_desc_empty"], state=s)
            stitle = "%s \u2014 %s" % (s, SITE_NAME)
        write(os.path.join(DIST, "state", slugify(s), "index.html"),
              page_shell(stitle, sdesc, "/state/%s" % slugify(s), smain,
                         route="/tracker",
                         md_rel="/state/%s/index.md" % slugify(s)))
        write(os.path.join(DIST, "state", slugify(s), "index.md"),
              md_state_page(s, by_state.get(s, [])))
    # Incident pages (+ Markdown twins) at /incident/CW-YYYY-NNNN (noslash).
    for c in cases:
        if not is_local(c):
            continue            # rendered by its home watch; linked there
        rid = c.get("record_id") or c["merged_id"]
        main_html, desc, ld_graph = build_incident(c)
        title = c.get("display_title") or c.get("case_title") or rid
        html_out = page_shell(title + " | " + SITE_NAME, desc,
                              "/incident/%s" % rid, main_html,
                              route="/tracker", og_type="article",
                              ld_graph=ld_graph,
                              md_rel="/incident/%s/index.md" % rid)
        write(os.path.join(DIST, "incident", rid, "index.html"), html_out)
        write(os.path.join(DIST, "incident", rid, "index.md"),
              md_incident(c))
        # Legacy compiler-ID URL keeps resolving via redirect stub.
        mid = c["merged_id"]
        if mid != rid:
            new_url = SITE_URL + "/incident/%s" % rid
            stub = ("<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n"
                    "<meta charset=\"UTF-8\">\n"
                    "<title>%s | %s</title>\n"
                    "<link rel=\"canonical\" href=\"%s\">\n"
                    "<meta http-equiv=\"refresh\" content=\"0; url=%s\">\n"
                    "<meta name=\"robots\" content=\"noindex\">\n"
                    "</head>\n<body>\n<p>This record moved to "
                    "<a href=\"%s\">%s</a>.</p>\n</body>\n</html>\n"
                    % (esc(rid), esc(SITE_NAME), esc(new_url),
                       esc(new_url), esc(new_url), esc(rid)))
            write(os.path.join(DIST, "incident", mid, "index.html"), stub)
    # Held records keep their old URLs as a noindex notice page.
    for (kind, hid), why in sorted(held.items()):
        path = "/%s/%s" % (kind, hid)
        write(os.path.join(DIST, kind, hid, "index.html"),
              held_page(hid, why, path))
        write(os.path.join(DIST, kind, hid, "index.md"),
              "# This record is not published\n\nRecord %s is held back "
              "because %s\n" % (hid, HOLD_REASON_TEXT[why]))
    # Trial-court records (+ Markdown twins). The section's index and its
    # per-state listings build only when the watch wants them: owner
    # decision 2026-09-23 — Babuwatch has no Trial Courts section; the
    # records themselves stay published at /trial-court/<id>.
    if P.get("trial_section_index", True):
        t2_main = build_trialcourt_index(t2public, t2_by_state)
        t2_desc = fill(T["trial_desc"], n2=n2, headline=head)
        t2_html = page_shell("Trial-court convictions \u2014 " + SITE_NAME,
                             t2_desc, "/trial-court", t2_main,
                             route="/trial-court",
                             md_rel="/trial-court/index.md")
        write(os.path.join(DIST, "trial-court", "index.html"), t2_html)
        write(os.path.join(DIST, "trial-court.html"), t2_html)
        t2_md = md_trialcourt_index(t2public, t2_by_state)
        write(os.path.join(DIST, "trial-court", "index.md"), t2_md)
        write(os.path.join(DIST, "trial-court.md"), t2_md)
        for s in sorted(t2_by_state):
            slug = slugify(s)
            smain = build_trialcourt_state(s, t2_by_state[s])
            sdesc = fill(T["trial_state_desc"], n=len(t2_by_state[s]),
                         state=s)
            stitle = ("%s \u2014 %d trial-court convictions \u2014 %s"
                      % (s, len(t2_by_state[s]), SITE_NAME))
            write(os.path.join(DIST, "trial-court", slug, "index.html"),
                  page_shell(stitle, sdesc, "/trial-court/%s" % slug, smain,
                             route="/trial-court",
                             md_rel="/trial-court/%s/index.md" % slug))
            write(os.path.join(DIST, "trial-court", slug, "index.md"),
                  md_trialcourt_state(s, t2_by_state[s]))
    for p in t2public:
        if not is_local(p):
            continue            # rendered by its home watch; linked there
        cid = t2_id(p)
        main_html, desc, ld_graph = build_trialcourt_record(p)
        title = p.get("case_title_or_number") or cid
        html_out = page_shell(title + " | " + SITE_NAME, desc,
                              "/trial-court/%s" % cid, main_html,
                              route="/trial-court", og_type="article",
                              ld_graph=ld_graph,
                              md_rel="/trial-court/%s/index.md" % cid)
        write(os.path.join(DIST, "trial-court", cid, "index.html"), html_out)
        write(os.path.join(DIST, "trial-court", cid, "index.md"),
              md_trialcourt_record(p))
    # Machine-readable JSON endpoints under /data/. Per-state slices are
    # published at /data/state/<slug>.json (and kept at the legacy
    # /data/states/<slug>.json path for compatibility).
    for s in STATES_36:
        slug = slugify(s)
        clist = sorted(by_state.get(s, []),
                       key=lambda c: (c.get("judgment_date") or ""))
        payload = (json.dumps({"state": s, "slug": slug,
                               "count": len(clist),
                               "url": PUBLIC_BASE + "/state/" + slug,
                               "cases": clist},
                              ensure_ascii=False, indent=1) + "\n")
        write(os.path.join(DIST, "data", "state", "%s.json" % slug), payload)
        write(os.path.join(DIST, "data", "states", "%s.json" % slug), payload)
    write(os.path.join(DIST, "data", "schema.json"),
          json.dumps(build_schema(cases, t2public, n, n2, n_overturned),
                     ensure_ascii=False, indent=1) + "\n")
    write(os.path.join(DIST, "data", "dataset.jsonld"),
          json.dumps(build_dataset_meta(cases, t2public, n_overturned),
                     ensure_ascii=False, indent=1) + "\n")
    data_files.append(
        ("schema.json",
         os.path.getsize(os.path.join(DIST, "data", "schema.json")),
         "Every field described; controlled vocabularies with counts."))
    data_files.append(
        ("dataset.jsonld",
         os.path.getsize(os.path.join(DIST, "data", "dataset.jsonld")),
         "schema.org Dataset descriptor with file distribution list."))
    # Data page (+ Markdown twin).
    data_main = build_data_page(total, data_files, n, n2, n_overturned)
    data_html = page_shell("Download the dataset \u2014 " + SITE_NAME,
                           ("Download %s as JSON or CSV." % head),
                           "/data", data_main, route="/tracker",
                           md_rel="/data/index.md",
                           extra_ld=[dataset_ld_node(n, n2, n_overturned)])
    write(os.path.join(DIST, "data", "index.html"), data_html)
    write(os.path.join(DIST, "data", "index.md"),
          md_data_page(total, data_files, n, n2, n_overturned))

    # Short map + full text for AI agents.
    write(os.path.join(DIST, "llms.txt"),
          llms_txt(cases, by_state, t2public, n_overturned))
    write(os.path.join(DIST, "llms-full.txt"),
          llms_full_txt(cases, t2public, n_overturned))

    # Sitemap + robots. All locs are served absolute URLs under BASE;
    # record URLs are noslash (/incident/CW-YYYY-NNNN): the proxy
    # strips trailing slashes with 308, so every canonical must be the
    # noslash form. Home ("") likewise emits the bare SITE_URL loc.
    statics = [s for s in ("rights", "remedy", "about")
               if s in P["static_pages"]]
    urls = (["", "/tracker", "/patterns"]
            + (["/trial-court"] if P.get("trial_section_index", True)
               else [])
            + ["/%s" % s for s in statics if s != "about"]
            + ["/methodology"]
            + ["/%s" % s for s in statics if s == "about"] + ["/data"])
    urls += ["/state/%s" % slugify(s) for s in STATES_36]
    urls += ["/incident/%s" % (c.get("record_id") or c["merged_id"])
             for c in local_cases]
    if P.get("trial_section_index", True):
        urls += ["/trial-court/%s" % slugify(s) for s in sorted(t2_by_state)]
    urls += ["/trial-court/%s" % t2_id(p) for p in local_t2]
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        sm.append("  <url><loc>%s%s</loc><lastmod>%s</lastmod></url>"
                  % (SITE_URL, u, BUILD_DATE))
    # AI endpoints use served absolute URLs (reference: sitemap lists them).
    def _has(slug):
        return slug not in ("rights", "remedy", "about") or slug in statics
    ai_urls = [u for u in (
               "/llms.txt", "/llms-full.txt", "/index.md", "/tracker.md",
               "/patterns.md", "/trial-court.md", "/rights.md", "/remedy.md",
               "/methodology.md", "/about.md", "/tracker/index.md",
               "/patterns/index.md", "/trial-court/index.md",
               "/rights/index.md", "/remedy/index.md", "/methodology/index.md",
               "/about/index.md", "/data/index.md", "/data/cases.json",
               "/data/cases.csv", "/data/index.json", "/data/tier2.json",
               "/data/index-trial.json", "/data/all-cases.json",
               "/data/context.json",
               "/data/schema.json", "/data/dataset.jsonld")
               if _has(u.strip("/").split("/")[0].split(".")[0])
               and (u != "/data/context.json" or context)
               and (u != "/data/cases.csv" or os.path.exists(DATA_CSV))]
    ai_urls += ["/trial-court/%s/index.md" % slugify(s)
                for s in sorted(t2_by_state)]
    ai_urls += ["/trial-court/%s/index.md" % t2_id(p) for p in local_t2]
    ai_urls += ["/data/case/%s.json" % t2_id(p) for p in local_t2]
    ai_urls += ["/data/state/%s.json" % slugify(s) for s in STATES_36]
    ai_urls += ["/data/states/%s.json" % slugify(s) for s in STATES_36]
    ai_urls += ["/data/case/%s.json"
                % (c.get("record_id") or c["merged_id"]) for c in local_cases]
    ai_urls += ["/state/%s/index.md" % slugify(s) for s in STATES_36]
    ai_urls += ["/incident/%s/index.md"
                % (c.get("record_id") or c["merged_id"]) for c in local_cases]
    for u in ai_urls:
        sm.append("  <url><loc>%s%s</loc><lastmod>%s</lastmod></url>"
                  % (PUBLIC_BASE, u, BUILD_DATE))
    sm.append("</urlset>")
    write(os.path.join(DIST, "sitemap.xml"), "\n".join(sm) + "\n")
    write(os.path.join(DIST, "robots.txt"), build_robots())

    # Post-build assertion: no gated name anywhere in dist/. The
    # set-aside rows join both sides: their unnamed-officer literals
    # must not leak, and their own named_safe holders legitimise the
    # names they publish inside all-cases.json (an aggregate file).
    # They have no incident pages; missing page files read empty.
    # Merged scrub+verify (round 6): every dist file is decided
    # through the shared matcher with the assertion's own
    # literals/holders; scrubbed texts are re-verified and residuals
    # fail as LEAKs (genuine scrub bugs). Dicts were already scrubbed
    # once pre-render (round 6c; same ctx reused). A separate full
    # assert_no_leaks here would re-run the identical pure computation
    # over the identical bytes (provably redundant); the standalone
    # assertion remains for tests and manual verification.
    scrub_dist_final(publishable, cases, oracle_by_id, nosp_extras,
                     _assert_t2_raw, _assert_t2_pub, t2_downgraded,
                     ctx=_pre_ctx, skip_dicts=True)
    assert_no_victim_names(DIST, list(publishable) + list(_assert_t2_raw),
                           fail=os.environ.get("VICTIM_CHECK") == "fail")

    idx_kb = os.path.getsize(os.path.join(DIST, "index.html")) / 1024.0
    trk_kb = os.path.getsize(os.path.join(DIST, "tracker", "index.html")) / 1024.0
    n_zero = sum(1 for s in STATES_36 if not by_state.get(s))
    print("cases=%d states_with_cases=%d zero_case_states=%d urls=%d "
          "ai_urls=%d index=%.1fKB tracker=%.1fKB llms=%.1fKB full=%.1fKB "
          "slim=%.1fKB trial=%d slim_trial=%.1fKB" % (
              n, len(by_state), n_zero, len(urls), len(ai_urls), idx_kb,
              trk_kb,
              os.path.getsize(os.path.join(DIST, "llms.txt")) / 1024.0,
              os.path.getsize(os.path.join(DIST, "llms-full.txt")) / 1024.0,
              os.path.getsize(os.path.join(DIST, "data", "index.json"))
              / 1024.0, len(t2public),
              os.path.getsize(os.path.join(DIST, "data", "index-trial.json"))
              / 1024.0))
    print("derived: %d record_ids; category fallbacks: %d" % (
        sum(1 for c in cases if c.get("record_id")),
        sum(1 for d in DERIVED_LOG if "category" in d)))
    for d in DERIVED_LOG[:10]:
        print("derived-detail: %s" % d)
    if len(DERIVED_LOG) > 10:
        print("derived-detail: ... +%d more" % (len(DERIVED_LOG) - 10))


if __name__ == "__main__":
    main()




