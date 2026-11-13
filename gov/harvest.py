#!/usr/bin/env python3
"""Harvest and reconcile all Indian .gov.in websites into gov/data/snapshot.json.

Sources merged:
1. Integrated Government Online Directory (igod.gov.in) across all 6 branches:
   Apex Bodies, Union Government (plus Ministry child trees), 36 States & UTs,
   Districts, Legislature (including Local Bodies & Panchayats), Judiciary, and
   International Missions.
2. Data Libertarian's verified repo datasets (public/entities.json,
   public/governments.json, V2 records in registers/data/psu.json, and
   citations in src/data/sources.ts).
3. Tranco full subdomains ranking (CrUX, Cloudflare Radar, Farsight DNS,
   Majestic, Umbrella).
4. Historical GoI Web Directory archive (ABHISHEKVALSAN/Indian-Government-Websites)
   and URLScan public scans.
5. Concurrent live DNS resolution check (socket.getaddrinfo) for every domain.

Python 3 stdlib only. Caches raw responses under .cache/gov/ (gitignored).
"""
from __future__ import annotations

import argparse
import concurrent.futures
import csv
import datetime
import hashlib
import html
import io
import json
import os
import re
import socket
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CACHE_DIR = os.path.join(ROOT, ".cache", "gov")
IGOD_CACHE = os.path.join(CACHE_DIR, "igod")
EXT_CACHE = os.path.join(CACHE_DIR, "ext")
ONEHOP_CACHE_PATH = os.path.join(CACHE_DIR, "onehop_v1.json")
DNS_CACHE_PATH = os.path.join(CACHE_DIR, "dns_cache_v2.json")
OUT_PATH = os.path.join(HERE, "data", "snapshot.json")

SSL_UNVERIFIED = ssl._create_unverified_context()
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; DataLibertarianGovDirectory/1.0; +https://datalibertarian.in/gov)"}

# Exact jurisdiction names from src/data/states.ts
IGOD_STATES = {
    "AN": "Andaman and Nicobar Islands",
    "AP": "Andhra Pradesh",
    "AR": "Arunachal Pradesh",
    "AS": "Assam",
    "BR": "Bihar",
    "CG": "Chhattisgarh",
    "CH": "Chandigarh",
    "DL": "Delhi",
    "GA": "Goa",
    "GJ": "Gujarat",
    "HP": "Himachal Pradesh",
    "HR": "Haryana",
    "JH": "Jharkhand",
    "JK": "Jammu and Kashmir",
    "KA": "Karnataka",
    "KL": "Kerala",
    "LA": "Ladakh",
    "LD": "Lakshadweep",
    "MH": "Maharashtra",
    "ML": "Meghalaya",
    "MN": "Manipur",
    "MP": "Madhya Pradesh",
    "MZ": "Mizoram",
    "ND": "Dadra and Nagar Haveli and Daman and Diu",
    "NL": "Nagaland",
    "OD": "Odisha",
    "PB": "Punjab",
    "PY": "Puducherry",
    "RJ": "Rajasthan",
    "SK": "Sikkim",
    "TN": "Tamil Nadu",
    "TR": "Tripura",
    "TS": "Telangana",
    "UK": "Uttarakhand",
    "UP": "Uttar Pradesh",
    "WB": "West Bengal",
}

STATE_SLUG_TO_NAME = {
    "andaman-and-nicobar-islands": "Andaman and Nicobar Islands",
    "andhra-pradesh": "Andhra Pradesh",
    "arunachal-pradesh": "Arunachal Pradesh",
    "assam": "Assam",
    "bihar": "Bihar",
    "chandigarh": "Chandigarh",
    "chhattisgarh": "Chhattisgarh",
    "dadra-and-nagar-haveli-and-daman-and-diu": "Dadra and Nagar Haveli and Daman and Diu",
    "delhi": "Delhi",
    "goa": "Goa",
    "gujarat": "Gujarat",
    "haryana": "Haryana",
    "himachal-pradesh": "Himachal Pradesh",
    "jammu-and-kashmir": "Jammu and Kashmir",
    "jharkhand": "Jharkhand",
    "karnataka": "Karnataka",
    "kerala": "Kerala",
    "ladakh": "Ladakh",
    "lakshadweep": "Lakshadweep",
    "madhya-pradesh": "Madhya Pradesh",
    "maharashtra": "Maharashtra",
    "manipur": "Manipur",
    "meghalaya": "Meghalaya",
    "mizoram": "Mizoram",
    "nagaland": "Nagaland",
    "odisha": "Odisha",
    "puducherry": "Puducherry",
    "punjab": "Punjab",
    "rajasthan": "Rajasthan",
    "sikkim": "Sikkim",
    "tamil-nadu": "Tamil Nadu",
    "telangana": "Telangana",
    "tripura": "Tripura",
    "uttar-pradesh": "Uttar Pradesh",
    "uttarakhand": "Uttarakhand",
    "west-bengal": "West Bengal",
}

MUNICIPAL_SLUG_TO_STATE = {
    "bbmp-bengaluru": "Karnataka",
    "bmc-mumbai": "Maharashtra",
    "cmc-chennai": "Tamil Nadu",
    "ghmc-hyderabad": "Telangana",
    "jmc-jaipur": "Rajasthan",
    "kmc-kolkata": "West Bengal",
    "lmc-lucknow": "Uttar Pradesh",
    "mcd-delhi": "Delhi",
    "pmc-pune": "Maharashtra",
    "smc-surat": "Gujarat",
}

# Known state/UT root .gov.in zones (plus common police/assembly variants) for attributing uncharted subdomains
STATE_ROOT_ZONES = {
    "andaman.gov.in": "Andaman and Nicobar Islands",
    "ap.gov.in": "Andhra Pradesh",
    "appolice.gov.in": "Andhra Pradesh",
    "arunachal.gov.in": "Arunachal Pradesh",
    "arunachalpradesh.gov.in": "Arunachal Pradesh",
    "assam.gov.in": "Assam",
    "bihar.gov.in": "Bihar",
    "cg.gov.in": "Chhattisgarh",
    "cgstate.gov.in": "Chhattisgarh",
    "chd.gov.in": "Chandigarh",
    "chandigarh.gov.in": "Chandigarh",
    "delhi.gov.in": "Delhi",
    "delhipolice.gov.in": "Delhi",
    "dnh.gov.in": "Dadra and Nagar Haveli and Daman and Diu",
    "ddd.gov.in": "Dadra and Nagar Haveli and Daman and Diu",
    "dnhdd.gov.in": "Dadra and Nagar Haveli and Daman and Diu",
    "goa.gov.in": "Goa",
    "gujarat.gov.in": "Gujarat",
    "gujaratpolice.gov.in": "Gujarat",
    "haryana.gov.in": "Haryana",
    "haryanapolice.gov.in": "Haryana",
    "hp.gov.in": "Himachal Pradesh",
    "hppolice.gov.in": "Himachal Pradesh",
    "jharkhand.gov.in": "Jharkhand",
    "jk.gov.in": "Jammu and Kashmir",
    "jkpolice.gov.in": "Jammu and Kashmir",
    "karnataka.gov.in": "Karnataka",
    "ksp.gov.in": "Karnataka",
    "kerala.gov.in": "Kerala",
    "keralapolice.gov.in": "Kerala",
    "ladakh.gov.in": "Ladakh",
    "lakshadweep.gov.in": "Lakshadweep",
    "maharashtra.gov.in": "Maharashtra",
    "mahapolice.gov.in": "Maharashtra",
    "manipur.gov.in": "Manipur",
    "meghalaya.gov.in": "Meghalaya",
    "megpolice.gov.in": "Meghalaya",
    "mizoram.gov.in": "Mizoram",
    "mp.gov.in": "Madhya Pradesh",
    "mppolice.gov.in": "Madhya Pradesh",
    "nagaland.gov.in": "Nagaland",
    "odisha.gov.in": "Odisha",
    "odishapolice.gov.in": "Odisha",
    "punjab.gov.in": "Punjab",
    "punjabpolice.gov.in": "Punjab",
    "py.gov.in": "Puducherry",
    "puducherry.gov.in": "Puducherry",
    "rajasthan.gov.in": "Rajasthan",
    "sikkim.gov.in": "Sikkim",
    "sikkimpolice.gov.in": "Sikkim",
    "telangana.gov.in": "Telangana",
    "tspolice.gov.in": "Telangana",
    "tn.gov.in": "Tamil Nadu",
    "tripura.gov.in": "Tripura",
    "tripurapolice.gov.in": "Tripura",
    "uk.gov.in": "Uttarakhand",
    "up.gov.in": "Uttar Pradesh",
    "uppolice.gov.in": "Uttar Pradesh",
    "wb.gov.in": "West Bengal",
    "wbpolice.gov.in": "West Bengal",
}

GOV_IN_HOST_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.gov\.in$")
S3WAAS_DEPLOY_HASH_RE = re.compile(r"^s3[0-9a-f]{16,}\.s3waas\.gov\.in$")

INFRA_LABELS = {
    "mail", "webmail", "smtp", "imap", "pop", "pop3", "mx", "mx1", "mx2", "mx3",
    "ns", "ns1", "ns2", "ns3", "ns4", "dns", "dns1", "dns2", "vpn", "sslvpn",
    "autoconfig", "autodiscover", "ftp", "sftp", "ntp", "relay", "ldap",
}

AUTHORITATIVE_HOST_OVERRIDES = {
    "cag.gov.in": {
        "name": "Comptroller and Auditor General of India (CAG)",
        "url": "https://cag.gov.in",
        "kind": "regulator",
        "tier": "apex",
        "state": None,
        "ministry": None,
    },
    "indiapost.gov.in": {
        "name": "Department of Posts (India Post)",
        "url": "https://www.indiapost.gov.in",
        "kind": "department",
        "tier": "union",
        "state": None,
        "ministry": "Ministry of Communications",
    },
    "mca.gov.in": {
        "name": "Ministry of Corporate Affairs (MCA)",
        "url": "https://www.mca.gov.in",
        "kind": "ministry",
        "tier": "union",
        "state": None,
        "ministry": "Ministry of Corporate Affairs",
    },
    "mausam.imd.gov.in": {
        "name": "India Meteorological Department (IMD)",
        "url": "https://mausam.imd.gov.in",
        "kind": "agency",
        "tier": "union",
        "state": None,
        "ministry": "Ministry of Earth Sciences",
    },
    "navodaya.gov.in": {
        "name": "Navodaya Vidyalaya Samiti (NVS)",
        "url": "https://navodaya.gov.in",
        "kind": "autonomous",
        "tier": "union",
        "state": None,
        "ministry": "Ministry of Education",
    },
    "southernrailway.gov.in": {
        "name": "Southern Railway, Indian Railways",
        "url": "https://southernrailway.gov.in",
        "kind": "agency",
        "tier": "union",
        "state": None,
        "ministry": "Ministry of Railways",
    },
}

VERIFIED_OFFICIAL_ADDITIONS = [
    ("dgll.gov.in", "https://dgll.gov.in", "Directorate General of Lighthouses and Lightships", "agency", "union", None, "Ministry of Ports, Shipping and Waterways", "official-link"),
    ("dmeo.gov.in", "https://dmeo.gov.in", "Development Monitoring and Evaluation Office (DMEO), NITI Aayog", "agency", "union", None, "Ministry of Planning", "official-link"),
    ("rohtak.gov.in", "https://rohtak.gov.in", "District Administration, Rohtak", "district", "local", "Haryana", None, "official-link"),
    ("charkhidadri.gov.in", "https://charkhidadri.gov.in", "District Administration, Charkhi Dadri", "district", "local", "Haryana", None, "official-link"),
    ("goavidhansabha.gov.in", "https://www.goavidhansabha.gov.in", "Goa Legislative Assembly", "legislature", "legislature", "Goa", None, "official-link"),
    ("gobardhan.gov.in", "https://gobardhan.gov.in", "GOBARdhan Unified Portal", "portal", "union", None, "Ministry of Jal Shakti", "official-link"),
    ("mahait.maharashtra.gov.in", "https://mahait.maharashtra.gov.in", "Maharashtra Information Technology Corporation Limited (MahaIT)", "psu", "state", "Maharashtra", None, "official-link"),
    ("highereducation.ladakh.gov.in", "https://highereducation.ladakh.gov.in", "Higher Education Department, UT of Ladakh", "department", "state", "Ladakh", None, "official-link"),
    ("services.nagaland.gov.in", "https://services.nagaland.gov.in", "Government of Nagaland Unified Services Portal", "portal", "state", "Nagaland", None, "official-link"),
    ("tax.berhampur.gov.in", "https://tax.berhampur.gov.in", "Berhampur Municipal Corporation Property Tax Portal", "local", "local", "Odisha", None, "official-link"),
    ("chhatrapatisambhajinagarzp.maharashtra.gov.in", "https://chhatrapatisambhajinagarzp.maharashtra.gov.in", "Zilla Parishad, Chhatrapati Sambhajinagar", "local", "local", "Maharashtra", None, "official-redirect"),
]

KIND_PRIORITY = {
    "ministry": 1,
    "court": 2,
    "legislature": 3,
    "regulator": 4,
    "psu": 5,
    "department": 6,
    "autonomous": 7,
    "institute": 8,
    "agency": 9,
    "district": 10,
    "local": 11,
    "portal": 12,
}

TIER_PRIORITY = {
    "apex": 1,
    "union": 2,
    "judiciary": 3,
    "legislature": 4,
    "state": 5,
    "local": 6,
    "missions": 7,
    "uncharted": 8,
}

# IGOD Union codes -> (kind, tier)
UG_CODES = {
    "E002": ("ministry", "union"),
    "E053": ("ministry", "union"),
    "E003": ("department", "union"),
    "E005": ("agency", "union"),
    "E013": ("regulator", "union"),
    "E051": ("regulator", "union"),
    "STABDY": ("regulator", "union"),
    "AUTBDY": ("autonomous", "union"),
    "E059": ("psu", "union"),
    "E009": ("institute", "union"),
    "SPMA": ("portal", "union"),
    "DUW": ("agency", "union"),
    "RFO": ("agency", "union"),
    "CNCL": ("autonomous", "union"),
    "SOC": ("autonomous", "union"),
    "OTHR": ("portal", "union"),
}

# Five umbrella Union Ministries whose IGOD E002 entry leaves primary URL blank
# because separate child departments hold the executive websites.
UMBRELLA_MINISTRY_FALLBACK_URLS = {
    "Communications": "https://dot.gov.in",
    "Consumer Affairs, Food and Public Distribution": "https://consumeraffairs.gov.in",
    "Finance": "https://finmin.gov.in",
    "Planning": "https://niti.gov.in",
    "Social Justice and Empowerment": "https://socialjustice.gov.in",
}

SG_HEADING_TO_CODE = {
    "state portal": "SPORT",
    "departments": "E003",
    "attached / subordinated offices": "E005",
    "commissions/ committees": "E013",
    "statutory/autonomous bodies": "E051",
    "statutory bodies": "STABDY",
    "autonomous bodies": "AUTBDY",
    "directorates / commissionerates": "E004",
    "boards / undertakings": "E011",
    "revenue divisions": "E043",
    "psus / jvs / companies / societies": "E059",
    "academies / institutions": "E009",
    "districts": "E042",
    "sub districts": "SDST",
    "blocks": "BLCK",
    "schemes / programmes / missions / applications": "SPMA",
    "others": "OTHR",
}

SG_CODE_TO_KIND_TIER = {
    "SPORT": ("department", "state"),
    "E003": ("department", "state"),
    "E005": ("agency", "state"),
    "E013": ("regulator", "state"),
    "E051": ("regulator", "state"),
    "STABDY": ("regulator", "state"),
    "AUTBDY": ("autonomous", "state"),
    "E004": ("agency", "state"),
    "E011": ("psu", "state"),
    "E043": ("district", "local"),
    "E059": ("psu", "state"),
    "E009": ("institute", "state"),
    "E042": ("district", "local"),
    "SDST": ("district", "local"),
    "BLCK": ("district", "local"),
    "SPMA": ("portal", "state"),
    "OTHR": ("portal", "state"),
}

APX_CODES = {
    "APXC": ("regulator", "apex"),
    "APXS": ("regulator", "state"),
    "OTHR": ("regulator", "apex"),
}

LEG_CODES = {
    "L001": ("legislature", "legislature"),
    "L004": ("legislature", "legislature"),
    "L007": ("local", "local"),
    "L008": ("local", "local"),
    "OTHR": ("legislature", "legislature"),
}

JUD_CODES = {
    "J001": ("court", "judiciary"),
    "J002": ("court", "judiciary"),
    "J003": ("court", "judiciary"),
    "E082": ("court", "judiciary"),
    "J009": ("court", "judiciary"),
    "J016": ("court", "judiciary"),
    "OTHR": ("court", "judiciary"),
}

INT_CODES = {
    "INMISS": ("portal", "missions"),
    "HNMISS": ("portal", "missions"),
    "OTHR": ("portal", "missions"),
}

IGOD_ORG_TYPE_NAME_MAP = {
    "ministries": "ministry",
    "independent departments": "ministry",
    "departments": "department",
    "state portal": "department",
    "attached / subordinated offices": "agency",
    "directorates / commissionerates": "agency",
    "divisions / units / wings": "agency",
    "regional / field offices": "agency",
    "commissions/ committees": "regulator",
    "statutory/autonomous bodies": "regulator",
    "statutory bodies": "regulator",
    "apex bodies (central)": "regulator",
    "apex bodies (state)": "regulator",
    "autonomous bodies": "autonomous",
    "councils": "autonomous",
    "societies": "autonomous",
    "psus / jvs / companies / societies": "psu",
    "boards / undertakings": "psu",
    "academies / institutions": "institute",
    "districts": "district",
    "revenue divisions": "district",
    "sub districts": "district",
    "blocks": "district",
    "panchayati raj institutions": "local",
    "local government bodies": "local",
    "supreme court of india": "court",
    "high courts": "court",
    "district courts": "court",
    "tribunals / quasi-judicial bodies": "court",
    "consumer courts": "court",
    "family courts": "court",
    "parliament of india": "legislature",
    "state legislative assemblies/councils of india": "legislature",
    "schemes / programmes / missions / applications": "portal",
    "indian missions": "portal",
    "honorary missions": "portal",
    "others": "portal",
}


def ensure_dirs():
    os.makedirs(IGOD_CACHE, exist_ok=True)
    os.makedirs(EXT_CACHE, exist_ok=True)
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)


def fetch_cached(url: str, cache_dir: str, unverified_ssl: bool = False, refresh: bool = False) -> str:
    key = hashlib.sha1(url.encode("utf-8")).hexdigest()
    path = os.path.join(cache_dir, key + ".txt")
    if not refresh and os.path.exists(path):
        with open(path, encoding="utf-8", errors="ignore") as f:
            return f.read()
    last_err = None
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            ctx = SSL_UNVERIFIED if unverified_ssl else None
            with urllib.request.urlopen(req, context=ctx, timeout=20) as resp:
                body = resp.read().decode("utf-8", "ignore")
            with open(path, "w", encoding="utf-8") as f:
                f.write(body)
            return body
        except Exception as e:
            last_err = e
            time.sleep(0.5 * (attempt + 1))
    raise RuntimeError(f"Failed to fetch {url}: {last_err}")


def fetch_igod(path: str, refresh: bool = False) -> str:
    url = path if path.startswith("http") else "https://igod.gov.in/" + path.lstrip("/")
    return fetch_cached(url, IGOD_CACHE, unverified_ssl=True, refresh=refresh)


def clean_text(s: str) -> str:
    s = re.sub(r"<[^>]+>", " ", s or "")
    s = html.unescape(s)
    return re.sub(r"\s+", " ", s).strip()


def ministry_key(name: str | None) -> str:
    s = re.sub(r"\s*\([^)]*\)\s*", " ", (name or "").strip())
    s = re.sub(r",?\s*government of india\b", "", s, flags=re.I)
    s = re.sub(r"^ministry of\s+", "", s, flags=re.I)
    s = s.replace("&", " and ")
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


def strip_aside_footer(page_html: str) -> str:
    s = re.sub(r"<aside[\s\S]*?</aside>", "", page_html, flags=re.I)
    s = re.sub(r"<footer[\s\S]*?</footer>", "", s, flags=re.I)
    return s


def normalize_url_and_host(raw_url: str | None) -> tuple[str | None, str | None, str | None]:
    """Return (canonical_domain_no_www, root_domain, clean_url) or (None, None, raw_tld)."""
    if not raw_url:
        return None, None, None
    u = html.unescape(raw_url).strip()
    if not u or u.startswith("#") or u.startswith("javascript:") or u.startswith("mailto:"):
        return None, None, None
    if not re.match(r"^https?://", u, re.I):
        u = "https://" + u.lstrip("/")
    try:
        parsed = urllib.parse.urlsplit(u)
    except Exception:
        return None, None, None
    host = (parsed.hostname or "").lower().strip().rstrip(".")
    if not host or "translate.goog" in host:
        return None, None, None
    bare = host[4:] if host.startswith("www.") else host
    if bare == "gov.in" or not GOV_IN_HOST_RE.match(bare) or S3WAAS_DEPLOY_HASH_RE.match(bare):
        # Return TLD category in 3rd slot for reconciliation
        return None, host, None
    labels = bare.split(".")
    root_domain = ".".join(labels[-3:])  # e.g. maharashtra.gov.in or finmin.gov.in
    scheme = parsed.scheme.lower() if parsed.scheme.lower() in ("http", "https") else "https"
    clean_u = urllib.parse.urlunsplit((scheme, host, parsed.path or "/", parsed.query, ""))
    if clean_u.endswith("/") and parsed.path in ("", "/") and not parsed.query:
        clean_u = f"{scheme}://{host}"
    return bare, root_domain, clean_u


def classify_host_role(domain: str) -> str:
    labels = domain[:-7].split(".")
    return "infrastructure" if any(lbl in INFRA_LABELS for lbl in labels) else "web"


def is_root_url(url: str) -> bool:
    p = urllib.parse.urlsplit(url or "")
    path = (p.path or "/").rstrip("/").lower()
    return path in ("", "/en", "/hi", "/english", "/hindi", "/home", "/index", "/index.html", "/index.php", "/default.aspx") and not p.query


def classify_tld(host: str | None) -> str:
    if not host:
        return "other"
    for tld in (".nic.in", ".org.in", ".co.in", ".res.in", ".ac.in", ".edu.in", ".ernet.in", ".in", ".org", ".com"):
        if host.endswith(tld):
            return tld
    return "other"


def parse_igod_rows(fragment_html: str) -> list[dict]:
    """Extract [{title, ext_url, org_id}] from an IGOD list page or AJAX fragment."""
    cleaned = strip_aside_footer(fragment_html)
    rows = []
    for block in cleaned.split('<div class="search-row')[1:]:
        title = ""
        ext_url = None
        m_link = re.search(
            r'<a[^>]+href="([^"]+)"[^>]*class="search-title"[^>]*>(.*?)</a>',
            block,
            re.S | re.I,
        )
        if m_link:
            ext_url = html.unescape(m_link.group(1)).strip()
            title = clean_text(m_link.group(2))
        else:
            m_div = re.search(r'<div[^>]+class="search-title"[^>]*>(.*?)</div>', block, re.S | re.I)
            if m_div:
                title = clean_text(m_div.group(1))
        m_org = re.search(r'https://igod\.gov\.in/organization/(\d+)', block)
        org_id = m_org.group(1) if m_org else None
        if title or ext_url:
            rows.append({"title": title, "url": ext_url, "org_id": org_id})
    return rows


def detect_igod_ajax_pattern(page1_html: str, list_path: str) -> tuple[int, str]:
    m_cnt = re.search(r"var\s+count\s*=\s*'(\d+)'", page1_html)
    count = int(m_cnt.group(1)) if m_cnt else 0
    # Detect exact AJAX path from inline script
    m_ajax = re.search(
        r"""url:\s*["']https://igod\.gov\.in["']\s*\+\s*([^\n]+?)\s*\+\s*start\s*\+\s*["']/["']\s*\+\s*limit""",
        page1_html,
        re.S,
    )
    if m_ajax:
        expr = m_ajax.group(1)
        parts = re.findall(r"""'([^']*)'""", expr)
        prefix = "".join(parts).lstrip("/")
        if prefix:
            return count, prefix
    # Fallback heuristic
    base = list_path.rsplit("/organizations", 1)[0]
    suffix = "organizations_more/" if base.startswith(("sg/", "leg/", "apx/")) and len(base.split("/")) == 3 else "organizations_list_more/"
    return count, f"{base}/{suffix}"


def resolve_org_detail_url(org_id: str, refresh: bool = False) -> str | None:
    """Fetch /organization/<id> and return primary official website URL if listed."""
    page = strip_aside_footer(fetch_igod(f"organization/{org_id}", refresh=refresh))
    # Remove header/nav links and social links
    main_idx = page.find("<main")
    if main_idx >= 0:
        page = page[main_idx:]
    socials = ("facebook.com", "twitter.com", "x.com", "youtube.com", "instagram.com", "linkedin.com", "igod.gov.in")
    portal_noise = ("india.gov.in", "mygov.in", "data.gov.in", "pmindia.gov.in", "pgportal.gov.in", "nic.in", "meity.gov.in", "digitalindia.gov.in")
    candidates = []
    for href in re.findall(r'href="(https?://[^"]+)"', page, re.I):
        low = href.lower()
        if any(s in low for s in socials):
            continue
        parsed = urllib.parse.urlsplit(href)
        host = (parsed.hostname or "").lower()
        if host.lstrip("www.") in portal_noise:
            continue
        candidates.append(href)
    if not candidates:
        return None
    # Prefer .gov.in / .nic.in root or first candidate
    for c in candidates:
        h = (urllib.parse.urlsplit(c).hostname or "").lower()
        if h.endswith(".gov.in") or h.endswith(".nic.in"):
            p = urllib.parse.urlsplit(c)
            return f"{p.scheme}://{p.netloc}"
    p = urllib.parse.urlsplit(candidates[0])
    return f"{p.scheme}://{p.netloc}"


def harvest_igod(refresh: bool = False):
    print("[1/5] Discovering IGOD endpoints...")
    list_jobs = []  # (path, kind, tier, state_name, branch_label)
    inline_entries = []  # pre-extracted inline items

    for code, (kind, tier) in APX_CODES.items():
        list_jobs.append((f"apx/{code}/organizations", kind, tier, None, "Apex Bodies"))
    for st_code, st_name in IGOD_STATES.items():
        list_jobs.append((f"apx/{st_code}/APXS/organizations", "regulator", "state", st_name, "Apex Bodies (State)"))

    for code, (kind, tier) in UG_CODES.items():
        list_jobs.append((f"ug/{code}/organizations", kind, tier, None, f"Union Government ({code})"))

    for code, (kind, tier) in LEG_CODES.items():
        if code in ("L007", "L008"):
            for st_code, st_name in IGOD_STATES.items():
                list_jobs.append((f"leg/{st_code}/{code}/organizations", kind, tier, st_name, f"Legislature ({code})"))
        else:
            list_jobs.append((f"leg/{code}/organizations", kind, tier, None, f"Legislature ({code})"))

    for code, (kind, tier) in JUD_CODES.items():
        list_jobs.append((f"jud/{code}/organizations", kind, tier, None, f"Judiciary ({code})"))

    for code, (kind, tier) in INT_CODES.items():
        list_jobs.append((f"int/{code}/organizations", kind, tier, None, f"International ({code})"))

    # Fetch all 36 state category pages in parallel to get inline items + View All endpoints
    seen_sg_paths = set()

    def fetch_state_cats(item):
        st_code, st_name = item
        html_doc = strip_aside_footer(fetch_igod(f"sg/{st_code}/categories", refresh=refresh))
        return st_code, st_name, html_doc

    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
        for st_code, st_name, html_doc in pool.map(fetch_state_cats, IGOD_STATES.items()):
            boxes = html_doc.split('<div class="cat-box">')[1:]
            for box in boxes:
                m_h = re.search(r"<h3>(.*?)</h3>", box, re.S)
                heading = clean_text(m_h.group(1)) if m_h else ""
                sub_code = SG_HEADING_TO_CODE.get(heading.lower(), "OTHR")
                kind, tier = SG_CODE_TO_KIND_TIER.get(sub_code, ("portal", "state"))
                m_va = re.search(r'href="https://igod\.gov\.in/(sg/[^"]+/organizations)"', box)
                if m_va:
                    p = m_va.group(1)
                    if p not in seen_sg_paths:
                        seen_sg_paths.add(p)
                        list_jobs.append((p, kind, tier, st_name, f"State ({st_name})"))
                else:
                    # Inline items (<= 5 entries)
                    for m_it in re.finditer(
                        r'<a[^>]+href="([^"]+)"[^>]*class="search-title"[^>]*>(.*?)</a>',
                        box,
                        re.S | re.I,
                    ):
                        inline_entries.append(
                            {
                                "title": clean_text(m_it.group(2)),
                                "url": html.unescape(m_it.group(1)).strip(),
                                "org_id": None,
                                "kind": kind,
                                "tier": tier,
                                "state": st_name,
                                "ministry": None,
                                "source": "igod",
                            }
                        )
            # Ensure districts (E042) is always crawled
            dist_p = f"sg/{st_code}/E042/organizations"
            if dist_p not in seen_sg_paths:
                seen_sg_paths.add(dist_p)
                list_jobs.append((dist_p, "district", "local", st_name, f"Districts ({st_name})"))

    print(f"    Crawling {len(list_jobs)} IGOD list endpoints (page 1)...")
    ajax_tasks = []  # (ajax_url, kind, tier, state_name, source_tag)
    raw_entries = list(inline_entries)

    def fetch_list_p1(job):
        path, kind, tier, st_name, branch = job
        doc = fetch_igod(path, refresh=refresh)
        return job, doc

    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
        for job, doc in pool.map(fetch_list_p1, list_jobs):
            path, kind, tier, st_name, branch = job
            rows = parse_igod_rows(doc)
            count, ajax_prefix = detect_igod_ajax_pattern(doc, path)
            for r in rows:
                raw_entries.append(
                    {
                        "title": r["title"],
                        "url": r["url"],
                        "org_id": r["org_id"],
                        "kind": kind,
                        "tier": tier,
                        "state": st_name,
                        "ministry": None,
                        "list_path": path,
                        "source": "igod",
                    }
                )
            if count > len(rows):
                # IGOD caps AJAX fragment responses to 5 items per call
                for start in range(len(rows), count, 5):
                    ajax_tasks.append((f"{ajax_prefix}{start}/5", kind, tier, st_name, path))

    print(f"    Fetching {len(ajax_tasks)} IGOD AJAX pagination fragments (5 items each)...")

    def fetch_ajax(task):
        ajax_path, kind, tier, st_name, origin_path = task
        frag = fetch_igod(ajax_path, refresh=refresh)
        return task, parse_igod_rows(frag)

    with concurrent.futures.ThreadPoolExecutor(max_workers=24) as pool:
        for (ajax_path, kind, tier, st_name, origin_path), rows in pool.map(fetch_ajax, ajax_tasks):
            for r in rows:
                raw_entries.append(
                    {
                        "title": r["title"],
                        "url": r["url"],
                        "org_id": r["org_id"],
                        "kind": kind,
                        "tier": tier,
                        "state": st_name,
                        "ministry": None,
                        "list_path": origin_path,
                        "source": "igod",
                    }
                )

    # Fetch Union Ministries (E002), Independent Depts (E053), Union Depts (E003) details & child CSVs
    ug_parents = []
    seen_org_ids = set()
    for e in raw_entries:
        lp = e.get("list_path") or ""
        if lp in ("ug/E002/organizations", "ug/E053/organizations", "ug/E003/organizations") and e.get("org_id"):
            oid = e["org_id"]
            if oid not in seen_org_ids:
                seen_org_ids.add(oid)
                ug_parents.append(e)

    print(f"    Fetching {len(ug_parents)} Union Ministry/Dept detail pages & child_organizations CSVs...")

    def fetch_parent_tree(e):
        oid = e["org_id"]
        if not e.get("url"):
            e["url"] = resolve_org_detail_url(oid, refresh=refresh)
        csv_text = ""
        try:
            csv_text = fetch_igod(f"child_organizations/{oid}", refresh=refresh)
        except Exception:
            csv_text = ""
        return e, csv_text

    ministry_records = []
    domain_to_ministry = {}
    min_key_to_canonical = {}
    dept_to_ministry = {}

    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
        parent_trees = list(pool.map(fetch_parent_tree, ug_parents))

    # Pass 1: build canonical ministry map (E002 Ministries & E053 Independent Depts)
    for parent, _ in parent_trees:
        lp = parent.get("list_path")
        if lp not in ("ug/E002/organizations", "ug/E053/organizations"):
            continue
        parent_title = re.sub(r"\s*\([^)]+\)\s*$", "", parent["title"]).strip()
        if lp == "ug/E053/organizations" or parent_title.lower().startswith("ministry of "):
            canonical_name = parent_title
        else:
            canonical_name = f"Ministry of {parent_title}"
        min_key_to_canonical[ministry_key(canonical_name)] = canonical_name
        min_key_to_canonical[ministry_key(parent_title)] = canonical_name

    # Pass 2: build child Department -> parent Ministry map from E002/E053 child CSVs
    for parent, csv_text in parent_trees:
        lp = parent.get("list_path")
        if lp not in ("ug/E002/organizations", "ug/E053/organizations"):
            continue
        parent_title = re.sub(r"\s*\([^)]+\)\s*$", "", parent["title"]).strip()
        canonical_name = min_key_to_canonical.get(ministry_key(parent_title), parent_title)
        if csv_text and "Organization Title" in csv_text:
            for row in csv.DictReader(io.StringIO(csv_text)):
                c_title = (row.get("Organization Title") or "").strip()
                c_type = (row.get("Organization Type") or "").strip()
                c_min = (row.get("Ministry") or canonical_name).strip()
                resolved_min = min_key_to_canonical.get(ministry_key(c_min), canonical_name)
                if c_title and c_type.lower() in ("departments", "independent departments"):
                    dept_clean = re.sub(r"\s*\([^)]+\)\s*$", "", c_title).strip()
                    dept_to_ministry.setdefault(ministry_key(dept_clean), resolved_min)

    def resolve_ministry_name(raw_name: str | None) -> str | None:
        if not raw_name:
            return None
        k = ministry_key(raw_name)
        if not k:
            return None
        return min_key_to_canonical.get(k) or dept_to_ministry.get(k)

    # Pass 3: emit ministry records and child tree entries with resolved canonical ministries
    for parent, csv_text in parent_trees:
        lp = parent.get("list_path")
        parent_title = re.sub(r"\s*\([^)]+\)\s*$", "", parent["title"]).strip()
        canonical_name = resolve_ministry_name(parent_title)
        umbrella_note = False
        if lp == "ug/E002/organizations" and not parent.get("url") and parent_title in UMBRELLA_MINISTRY_FALLBACK_URLS:
            parent["url"] = UMBRELLA_MINISTRY_FALLBACK_URLS[parent_title]
            umbrella_note = True
        if canonical_name:
            parent["ministry"] = canonical_name
        dom, _, clean_u = normalize_url_and_host(parent.get("url"))
        child_rows = []
        if csv_text and "Organization Title" in csv_text:
            reader = csv.DictReader(io.StringIO(csv_text))
            for row in reader:
                c_title = (row.get("Organization Title") or "").strip()
                c_type = (row.get("Organization Type") or "").strip()
                c_url = (row.get("Url") or "").strip()
                c_min_raw = (row.get("Ministry") or "").strip()
                if not c_title:
                    continue
                c_min = resolve_ministry_name(c_min_raw) or canonical_name
                c_kind = IGOD_ORG_TYPE_NAME_MAP.get(c_type.lower(), "portal")
                child_rows.append((c_title, c_kind, c_url, c_min))
                c_dom, _, _ = normalize_url_and_host(c_url)
                if c_dom and c_min:
                    domain_to_ministry.setdefault(c_dom, c_min)
                raw_entries.append(
                    {
                        "title": c_title,
                        "url": c_url,
                        "org_id": None,
                        "kind": c_kind,
                        "tier": "union",
                        "state": None,
                        "ministry": c_min,
                        "source": "igod-tree",
                    }
                )
        if dom and canonical_name:
            domain_to_ministry.setdefault(dom, canonical_name)
        if lp in ("ug/E002/organizations", "ug/E053/organizations"):
            ministry_records.append(
                {
                    "id": parent["org_id"],
                    "name": parent["title"],
                    "canonical_name": canonical_name or parent_title,
                    "kind": "Independent Department" if lp == "ug/E053/organizations" else "Ministry",
                    "url": clean_u or parent.get("url") or "",
                    "domain": dom,
                    "is_gov_in": bool(dom),
                    "host": (urllib.parse.urlsplit(parent.get("url") or "").hostname or "").lower() or None,
                    "igod_children_count": len(child_rows),
                    "umbrella_portal_note": umbrella_note,
                }
            )

    print(f"    IGOD raw entries collected: {len(raw_entries)} (ministries/indep depts: {len(ministry_records)})")
    return raw_entries, ministry_records, domain_to_ministry, resolve_ministry_name


def load_repo_sources():
    print("[2/5] Loading Data Libertarian repo datasets...")
    entries = []

    # 1. public/entities.json
    ent_path = os.path.join(ROOT, "public", "entities.json")
    if os.path.exists(ent_path):
        with open(ent_path, encoding="utf-8") as f:
            ent = json.load(f)
        cat_map = {
            "agencies": "agency",
            "commissions": "regulator",
            "ministries": "department",
            "orgs": "portal",
            "psus": "psu",
        }
        for slug, cats in ent.items():
            if slug in STATE_SLUG_TO_NAME:
                state_name = STATE_SLUG_TO_NAME[slug]
                tier = "state"
            elif slug in MUNICIPAL_SLUG_TO_STATE:
                state_name = MUNICIPAL_SLUG_TO_STATE[slug]
                tier = "local"
            elif slug == "union":
                state_name = None
                tier = "union"
            else:
                state_name = None
                tier = "state"
            if not isinstance(cats, dict):
                continue
            for cat, obj in cats.items():
                if not isinstance(obj, dict):
                    continue
                kind = cat_map.get(cat, "portal")
                if tier == "local" and kind == "department":
                    kind = "local"
                for it in obj.get("items", []):
                    if not isinstance(it, dict) or not it.get("url"):
                        continue
                    entries.append(
                        {
                            "title": it.get("name") or "",
                            "abbrev": it.get("abbrev"),
                            "note": it.get("note"),
                            "url": it["url"],
                            "kind": kind,
                            "tier": tier,
                            "state": state_name,
                            "ministry": None,
                            "source": "dl-entities",
                        }
                    )

    # 2. public/governments.json
    gov_path = os.path.join(ROOT, "public", "governments.json")
    if os.path.exists(gov_path):
        with open(gov_path, encoding="utf-8") as f:
            govs = json.load(f)
        for slug, obj in govs.items():
            st = MUNICIPAL_SLUG_TO_STATE.get(slug) or STATE_SLUG_TO_NAME.get(slug)
            for mname, mobj in (obj.get("metrics") or {}).items():
                u = mobj.get("source_url")
                if u:
                    entries.append(
                        {
                            "title": mobj.get("source_title") or slug,
                            "url": u,
                            "kind": "local" if slug in MUNICIPAL_SLUG_TO_STATE else "department",
                            "tier": "local" if slug in MUNICIPAL_SLUG_TO_STATE else "state",
                            "state": st,
                            "ministry": None,
                            "source": "dl-governments",
                            "is_citation_only": True,
                        }
                    )

    # 3. registers/data/psu.json (V2 official company sites only; exclude press/order citations)
    psu_path = os.path.join(ROOT, "registers", "data", "psu.json")
    if os.path.exists(psu_path):
        with open(psu_path, encoding="utf-8") as f:
            psu = json.load(f)
        for r in psu.get("records", []):
            if r.get("verification") != "V2":
                continue
            st = None if r.get("state") in ("Union", "All India", "Centre", None) else r.get("state")
            tier = "union" if r.get("owner") == "Central government" or not st else "state"
            if tier == "union":
                st = None
            for src in r.get("sources", []):
                if src.get("kind") != "company_site":
                    continue
                u = src.get("url")
                if u:
                    entries.append(
                        {
                            "title": r.get("name") or src.get("title") or "",
                            "url": u,
                            "kind": "psu",
                            "tier": tier,
                            "state": st,
                            "ministry": r.get("administrative") if tier == "union" else None,
                            "source": "dl-psu",
                        }
                    )

    # 4. src/data/sources.ts
    src_ts = os.path.join(ROOT, "src", "data", "sources.ts")
    if os.path.exists(src_ts):
        with open(src_ts, encoding="utf-8") as f:
            ts_text = f.read()
        for m in re.finditer(r'publisher:\s*"([^"]+)"[\s\S]{0,400}?url:\s*"(https?://[^"]+)"', ts_text):
            pub, u = m.group(1), m.group(2)
            entries.append(
                {
                    "title": pub,
                    "url": u,
                    "kind": "department",
                    "tier": "union" if "India" in pub else "state",
                    "state": None,
                    "ministry": None,
                    "source": "dl-budgets",
                    "is_citation_only": True,
                }
            )

    print(f"    Data Libertarian repo URL entries loaded: {len(entries)}")
    return entries


def load_tranco_gov_in(refresh: bool = False) -> tuple[str, dict[str, int]]:
    print("[3/5] Fetching Tranco subdomains dataset...")
    list_id = "N2GNW"
    try:
        meta_raw = fetch_cached("https://tranco-list.eu/api/lists/date/latest?subdomains=true", EXT_CACHE, refresh=refresh)
        meta = json.loads(meta_raw)
        if meta.get("list_id"):
            list_id = meta["list_id"]
    except Exception:
        pass

    csv_cache = os.path.join(EXT_CACHE, f"tranco_{list_id}_gov_in.json")
    if not refresh and os.path.exists(csv_cache):
        with open(csv_cache, encoding="utf-8") as f:
            data = json.load(f)
        print(f"    Tranco {list_id} (cached): {len(data)} .gov.in domains")
        return list_id, data

    dl_url = f"https://tranco-list.eu/download/{list_id}/full"
    req = urllib.request.Request(dl_url, headers=HEADERS)
    ranks: dict[str, int] = {}
    with urllib.request.urlopen(req, timeout=45) as resp:
        for line in resp:
            s = line.decode("ascii", "ignore").strip()
            if s.endswith(".gov.in") and "," in s:
                rk_s, dom = s.split(",", 1)
                bare, _, _ = normalize_url_and_host(dom)
                if bare:
                    rk = int(rk_s)
                    if bare not in ranks or rk < ranks[bare]:
                        ranks[bare] = rk
    with open(csv_cache, "w", encoding="utf-8") as f:
        json.dump(ranks, f)
    print(f"    Tranco {list_id} (live): {len(ranks)} .gov.in domains")
    return list_id, ranks


def load_archive_and_urlscan(refresh: bool = False):
    print("[4/5] Fetching historical GoI directory archive & URLScan...")
    archive_urls = []
    try:
        csv_text = fetch_cached(
            "https://raw.githubusercontent.com/ABHISHEKVALSAN/Indian-Government-Websites/master/indian_gov_urls.csv",
            EXT_CACHE,
            refresh=refresh,
        )
        for row in csv.reader(io.StringIO(csv_text)):
            if row and row[0].strip().lower() != "url":
                archive_urls.append(row[0].strip())
    except Exception as e:
        print(f"    Warning: GoI GitHub archive failed: {e}")

    urlscan_domains = []
    try:
        us_raw = fetch_cached("https://urlscan.io/api/v1/search/?q=domain:gov.in&size=1000", EXT_CACHE, refresh=refresh)
        us_json = json.loads(us_raw)
        for res in us_json.get("results", []):
            dom = (res.get("page") or {}).get("domain")
            if dom:
                urlscan_domains.append(dom)
    except Exception as e:
        print(f"    Warning: URLScan API skipped: {e}")

    print(f"    Archive URLs: {len(archive_urls)}, URLScan domains: {len(urlscan_domains)}")
    return archive_urls, urlscan_domains


def check_dns_all(domains: list[str], refresh: bool = False) -> tuple[dict[str, dict], str]:
    print(f"[6/6] Checking DNS resolution for {len(domains)} unique .gov.in domains...")
    cache: dict[str, dict] = {}
    if not refresh and os.path.exists(DNS_CACHE_PATH):
        with open(DNS_CACHE_PATH, encoding="utf-8") as f:
            cache = json.load(f)

    noname_errnos = {socket.EAI_NONAME}
    if hasattr(socket, "EAI_NODATA"):
        noname_errnos.add(socket.EAI_NODATA)

    todo = [d for d in domains if d not in cache]
    if todo:
        print(f"    Resolving {len(todo)} uncached domains via socket.getaddrinfo (128 workers)...")
        socket.setdefaulttimeout(2.5)
        now_iso = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        def probe(d: str) -> tuple[str, dict]:
            saw_lookup_err = False
            for idx, host in enumerate((d, "www." + d)):
                for attempt in range(2):
                    try:
                        socket.getaddrinfo(host, None)
                        return d, {
                            "status": "resolved" if idx == 0 else "resolved_www",
                            "live": True,
                            "checked_at": now_iso,
                        }
                    except socket.gaierror as e:
                        if e.errno in noname_errnos:
                            break
                        saw_lookup_err = True
                    except OSError:
                        saw_lookup_err = True
            return d, {
                "status": "lookup_error" if saw_lookup_err else "no_record",
                "live": False,
                "checked_at": now_iso,
            }

        done = 0
        with concurrent.futures.ThreadPoolExecutor(max_workers=128) as pool:
            for d, info in pool.map(probe, todo):
                cache[d] = info
                done += 1
                if done % 2000 == 0:
                    print(f"      DNS checked {done}/{len(todo)}...")
        with open(DNS_CACHE_PATH, "w", encoding="utf-8") as f:
            json.dump(cache, f)

    live = sum(1 for d in domains if cache.get(d, {}).get("live"))
    no_rec = sum(1 for d in domains if cache.get(d, {}).get("status") == "no_record")
    err_n = sum(1 for d in domains if cache.get(d, {}).get("status") == "lookup_error")
    checked_at = max((cache[d]["checked_at"] for d in domains if d in cache), default=datetime.date.today().isoformat())
    print(f"    DNS resolved: {live}/{len(domains)} ({100.0 * live / max(1, len(domains)):.1f}%), no_record: {no_rec}, lookup_error: {err_n}")
    return {d: cache[d] for d in domains}, checked_at


def _good_page_title(html_body: str) -> str | None:
    m = re.search(r"<title[^>]*>(.*?)</title>", html_body, re.S | re.I)
    if not m:
        return None
    t = clean_text(m.group(1))
    low = t.lower()
    bad = ("404", "not found", "403", "forbidden", "apache", "nginx", "iis", "coming soon", "under maintenance", "error", "moved to ksmart", "access denied")
    if not t or len(t) < 4 or any(b in low for b in bad):
        return None
    if "ksmart" in html_body.lower() and "ilgms" in html_body.lower():
        return None
    return re.split(r"\s*[|\-–—:]\s*Government of India", t, flags=re.I)[0].strip()[:140]


def discover_onehop_and_redirects(
    igod_entries: list[dict],
    ministry_records: list[dict],
    repo_entries: list[dict],
    known_domains: set[str],
    slug_to_districts: dict[str, set[tuple[str, str]]],
    state_slug_to_district: dict[tuple[str, str], str],
    refresh: bool = False,
) -> tuple[list[dict], dict[str, dict]]:
    print("[4b/6] Discovering one-hop official links, HTTP-verified district portals & redirects...")
    if not refresh and os.path.exists(ONEHOP_CACHE_PATH):
        with open(ONEHOP_CACHE_PATH, encoding="utf-8") as f:
            cached = json.load(f)
        print(f"    One-hop discovery (cached): {len(cached['entries'])} official entries, {len(cached['redirects'])} redirects")
        return cached["entries"], cached["redirects"]

    # Seed official pages across Union Ministries, Depts, Apex, Courts, Legislatures, State roots & Local bodies
    seed_meta: dict[str, tuple[str, str | None, str | None]] = {}
    for mr in ministry_records:
        u = mr.get("url")
        if u and ".gov.in" in u:
            seed_meta[u] = ("union", None, mr["canonical_name"])
    for root, st_name in STATE_ROOT_ZONES.items():
        seed_meta[f"https://{root}"] = ("state", st_name, None)
    for e in igod_entries:
        u = e.get("url") or ""
        dom, _, clean_u = normalize_url_and_host(u)
        if not dom or not clean_u or not is_root_url(clean_u):
            continue
        if e.get("list_path") in ("ug/E003/organizations", "apx/APXC/organizations", "leg/L001/organizations", "leg/L004/organizations", "jud/J001/organizations", "jud/J002/organizations") or e.get("kind") == "local":
            seed_meta.setdefault(clean_u, (e.get("tier") or "union", e.get("state"), e.get("ministry")))
    for extra_u, meta in [
        ("https://aurangabadzp.gov.in", ("local", "Maharashtra", None)),
        ("https://www.dos.gov.in", ("union", None, "Department of Space")),
        ("http://seoni.mp.gov.in", ("local", "Madhya Pradesh", None)),
        ("https://berhampur.gov.in", ("local", "Odisha", None)),
        ("https://niti.gov.in", ("union", None, "Ministry of Planning")),
        ("https://shipmin.gov.in", ("union", None, "Ministry of Ports, Shipping and Waterways")),
        ("https://jalshakti.gov.in", ("union", None, "Ministry of Jal Shakti")),
        ("https://ncrb.gov.in", ("union", None, "Ministry of Home Affairs")),
        ("https://ncte.gov.in", ("union", None, "Ministry of Education")),
        ("https://rti.gov.in", ("union", None, "Ministry of Personnel, Public Grievances and Pensions")),
        ("https://epfindia.gov.in", ("union", None, "Ministry of Labour and Employment")),
    ]:
        seed_meta.setdefault(extra_u, meta)

    discovered: dict[str, dict] = {}
    redirects: dict[str, dict] = {}
    sso_noise = ("parichay", "janparichay", "epramaan", "sso.", "login.", "accounts.")

    def crawl_seed(item):
        u, (s_tier, s_state, s_min) = item
        out_links = []
        redir = None
        init_dom, init_host, _ = normalize_url_and_host(u)
        try:
            req = urllib.request.Request(u, headers=HEADERS)
            with urllib.request.urlopen(req, context=SSL_UNVERIFIED, timeout=8) as resp:
                fin_u = resp.geturl()
                body = resp.read(350_000).decode("utf-8", "ignore")
            fin_dom, fin_host, fin_clean = normalize_url_and_host(fin_u)
            target_h = fin_dom or fin_host
            if init_dom and target_h and target_h != init_dom and not any(s in target_h for s in sso_noise):
                redir = (init_dom, target_h, fin_clean or fin_u)
            for m in re.finditer(r'<a[^>]+href=["\'](https?://[^"\'>\s]+)["\'][^>]*>(.*?)</a>', body, re.S | re.I):
                href = html.unescape(m.group(1)).strip()
                dom, _, clean_u = normalize_url_and_host(href)
                if not dom or S3WAAS_DEPLOY_HASH_RE.match(dom) or dom.endswith(".s3waas.gov.in"):
                    continue
                txt = clean_text(m.group(2))
                out_links.append((dom, clean_u, txt, s_tier, s_state, s_min))
        except Exception:
            pass
        return redir, out_links

    print(f"    Crawling {len(seed_meta)} official seed pages for one-hop links & redirects...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=24) as pool:
        for redir, links in pool.map(crawl_seed, sorted(seed_meta.items())):
            if redir:
                d1, target_h, fin_u = redir
                redirects[d1] = {"target_host": target_h, "target_url": fin_u}
                t_dom, _, t_clean = normalize_url_and_host(fin_u)
                if t_dom:
                    discovered.setdefault(
                        t_dom,
                        {
                            "title": None,
                            "url": t_clean or f"https://{t_dom}",
                            "kind": "local" if "zp." in t_dom else "portal",
                            "tier": "local" if "zp." in t_dom else ("state" if STATE_ROOT_ZONES.get(".".join(t_dom.split(".")[-3:])) else "union"),
                            "state": STATE_ROOT_ZONES.get(".".join(t_dom.split(".")[-3:])),
                            "ministry": None,
                            "source": "official-redirect",
                        },
                    )
            for dom, clean_u, txt, s_tier, s_state, s_min in links:
                if dom in known_domains:
                    continue
                root = ".".join(dom.split(".")[-3:])
                st = STATE_ROOT_ZONES.get(root) or (s_state if s_tier in ("state", "local") else None)
                generic_txt = txt.lower() in ("", "know more", "read more", "click here", "view", "more", "visit", "link", "here", "website", "gov") or len(txt) < 4
                title = None if generic_txt or len(txt) > 120 else txt
                entry = discovered.get(dom)
                if not entry:
                    discovered[dom] = {
                        "title": title,
                        "url": f"https://{dom}" if is_root_url(clean_u) else clean_u,
                        "kind": "local" if st and ("tax." in dom or "zp." in dom or "municipal" in dom) else ("agency" if s_min else "portal"),
                        "tier": "local" if st and ("tax." in dom or "zp." in dom) else ("state" if st else s_tier),
                        "state": None if s_tier in ("union", "apex") and not st else st,
                        "ministry": s_min if s_tier == "union" and not st else None,
                        "source": "official-link",
                    }
                elif not entry["title"] and title:
                    entry["title"] = title

    # Verify DNS + HTTP 200 on unlisted IGOD E042 district candidates (skipping wildcard zone mizoram.gov.in)
    state_to_roots: dict[str, list[str]] = {}
    for root, st in STATE_ROOT_ZONES.items():
        if not root.endswith("police.gov.in") and root != "ksp.gov.in" and root != "mizoram.gov.in":
            state_to_roots.setdefault(st, []).append(root)

    dist_cands: dict[str, tuple[str, str]] = {}
    for slug, pairs in slug_to_districts.items():
        if len(pairs) == 1:
            d_name, st_name = next(iter(pairs))
            h = f"{slug}.gov.in"
            if h not in known_domains and h not in discovered:
                dist_cands[h] = (d_name, st_name)
    for (st_name, slug), d_name in state_slug_to_district.items():
        for root in state_to_roots.get(st_name, []):
            h = f"{slug}.{root}"
            if h not in known_domains and h not in discovered:
                dist_cands[h] = (d_name, st_name)

    def probe_dns_only(h: str):
        for test_h in (h, "www." + h):
            try:
                socket.getaddrinfo(test_h, None)
                return h, True
            except OSError:
                continue
        return h, False

    socket.setdefaulttimeout(2.5)
    resolving_dists = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=64) as pool:
        for h, ok in pool.map(probe_dns_only, dist_cands):
            if ok:
                resolving_dists.append(h)

    def verify_http_candidate(item):
        h, d_name, st_name = item
        for scheme in ("https://", "http://"):
            try:
                req = urllib.request.Request(f"{scheme}{h}", headers=HEADERS)
                with urllib.request.urlopen(req, context=SSL_UNVERIFIED, timeout=8) as resp:
                    if resp.status != 200:
                        continue
                    body = resp.read(200_000).decode("utf-8", "ignore")
                title = _good_page_title(body)
                if title:
                    return h, d_name, st_name, resp.geturl(), title
            except Exception:
                continue
        return h, d_name, st_name, None, None

    print(f"    HTTP-verifying {len(resolving_dists)} resolving IGOD E042 district candidates...")
    dist_ok = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=24) as pool:
        for h, d_name, st_name, fin_u, page_title in pool.map(
            verify_http_candidate, [(h, dist_cands[h][0], dist_cands[h][1]) for h in resolving_dists]
        ):
            if fin_u:
                dist_ok += 1
                discovered[h] = {
                    "title": f"District Administration, {d_name}",
                    "url": f"https://{h}",
                    "kind": "district",
                    "tier": "local",
                    "state": st_name,
                    "ministry": None,
                    "source": "igod-district",
                }

    # Fetch <title> for newly discovered one-hop links lacking a descriptive anchor title (up to 350)
    untitled = [d for d, e in discovered.items() if not e.get("title")][:350]

    def fetch_title(d: str):
        u = discovered[d]["url"]
        try:
            req = urllib.request.Request(u, headers=HEADERS)
            with urllib.request.urlopen(req, context=SSL_UNVERIFIED, timeout=7) as resp:
                body = resp.read(150_000).decode("utf-8", "ignore")
            return d, _good_page_title(body)
        except Exception:
            return d, None

    if untitled:
        print(f"    Fetching titles for {len(untitled)} newly linked .gov.in portals...")
        with concurrent.futures.ThreadPoolExecutor(max_workers=24) as pool:
            for d, title in pool.map(fetch_title, untitled):
                if title:
                    discovered[d]["title"] = title

    # Inject verified audit additions if not already covered cleanly
    for dom, u, title, kind, tier, st, min_name, src in VERIFIED_OFFICIAL_ADDITIONS:
        if dom in discovered:
            if not discovered[dom].get("title"):
                discovered[dom]["title"] = title
            if st and not discovered[dom].get("state"):
                discovered[dom]["state"] = st
            if min_name and not discovered[dom].get("ministry"):
                discovered[dom]["ministry"] = min_name
            discovered[dom]["kind"] = kind
            discovered[dom]["tier"] = tier
            discovered[dom]["url"] = u
        elif dom not in known_domains:
            discovered[dom] = {
                "title": title,
                "url": u,
                "kind": kind,
                "tier": tier,
                "state": st,
                "ministry": min_name,
                "source": src,
            }

    entries = [dict(v, domain=k) for k, v in discovered.items()]
    with open(ONEHOP_CACHE_PATH, "w", encoding="utf-8") as f:
        json.dump({"entries": entries, "redirects": redirects}, f, ensure_ascii=False)
    print(f"    One-hop discovery: {len(entries)} entries ({dist_ok} HTTP-verified districts), {len(redirects)} redirects")
    return entries, redirects


def infer_title_from_domain(domain: str, state: str | None, ministry: str | None) -> str:
    sub = domain[:-7]  # strip .gov.in
    parts = [p for p in sub.split(".") if p]
    label = parts[0] if len(parts) == 1 else " ".join(parts[:-1])
    words = re.sub(r"[-_]+", " ", label).strip().upper() if len(label) <= 5 else re.sub(r"[-_]+", " ", label).strip().title()
    if state:
        return f"{words} ({state})"
    if ministry:
        return f"{words} ({ministry})"
    return f"{words} (.gov.in)"


SOURCE_PRIORITY = {
    "igod": 1,
    "igod-tree": 2,
    "dl-entities": 3,
    "official-link": 4,
    "official-redirect": 5,
    "igod-district": 6,
    "dl-psu": 7,
    "dl-governments": 8,
    "dl-budgets": 9,
    "tranco": 10,
    "goi-archive": 11,
    "urlscan": 12,
}


def resolve_host_record(
    dom: str,
    root_domain: str,
    obs_list: list[dict],
    redirects: dict[str, dict],
    tranco_ranks: dict[str, int],
    root_to_ministry: dict[str, str],
) -> dict:
    sources: list[str] = []
    seen_src = set()
    url_title_pairs: dict[str, str] = {}
    abbrevs: list[str] = []
    notes: list[str] = []
    for o in obs_list:
        s = o["source"]
        if s not in seen_src:
            seen_src.add(s)
            sources.append(s)
        u = o.get("url") or f"https://{dom}"
        t = (o.get("title") or "").strip()
        if u not in url_title_pairs or (t and len(t) > len(url_title_pairs[u])):
            url_title_pairs[u] = t
        if o.get("abbrev"):
            abbrevs.append(o["abbrev"])
        if o.get("note"):
            notes.append(o["note"])

    non_citation = [o for o in obs_list if not o.get("is_citation_only")]
    pool = non_citation or obs_list

    in_igod = ("igod" in seen_src) or ("igod-tree" in seen_src)
    official_sources = {"dl-entities", "dl-psu", "official-link", "official-redirect", "igod-district"}
    provenance = "igod" if in_igod else ("official_verified" if any(s in official_sources for s in seen_src) else "passive_only")

    # Select host metadata atomically from a single authoritative source (never field-spliced)
    if dom in AUTHORITATIVE_HOST_OVERRIDES:
        ov = AUTHORITATIVE_HOST_OVERRIDES[dom]
        name = ov["name"]
        url = ov["url"]
        kind = ov["kind"]
        tier = ov["tier"]
        state = ov["state"]
        ministry = ov["ministry"]
    elif dom in STATE_ROOT_ZONES:
        st_name = STATE_ROOT_ZONES[dom]
        is_police = dom.endswith("police.gov.in") or dom == "ksp.gov.in"
        root_obs = sorted(
            [o for o in pool if is_root_url(o.get("url") or "") and not o.get("is_passive")],
            key=lambda o: (SOURCE_PRIORITY.get(o["source"], 99), 0 if o.get("title") else 1),
        )
        if root_obs and root_obs[0].get("title"):
            win = root_obs[0]
            name = win["title"]
            url = win["url"]
        else:
            name = f"{st_name} Police" if is_police else f"Official Portal of {st_name} Government"
            url = f"https://{dom}"
        kind = "agency" if is_police else "department"
        tier = "state"
        state = st_name
        ministry = None
    else:
        inst_obs = [o for o in pool if not o.get("is_passive")]
        root_obs = [o for o in inst_obs if is_root_url(o.get("url") or "")]
        if root_obs:
            win = min(
                root_obs,
                key=lambda o: (
                    SOURCE_PRIORITY.get(o["source"], 99),
                    TIER_PRIORITY.get(o["tier"], 99),
                    KIND_PRIORITY.get(o["kind"], 99),
                    0 if o.get("title") else 1,
                ),
            )
            name = win.get("title") or ""
            url = win.get("url") or f"https://{dom}"
            kind = win["kind"]
            tier = win["tier"]
            state = win.get("state")
            ministry = win.get("ministry")
        else:
            distinct_urls = {o.get("url") for o in inst_obs if o.get("url")}
            if len(inst_obs) >= 2 and len(distinct_urls) >= 2:
                # Multiple sub-path entities on a shared host without a root entry:
                # bind name and URL to the host itself instead of pairing entity A's name with entity B's URL.
                tiers = {o["tier"] for o in inst_obs}
                states = {o.get("state") for o in inst_obs if o.get("state")}
                mins = {o.get("ministry") for o in inst_obs if o.get("ministry")}
                kinds = {o["kind"] for o in inst_obs}
                tier = min(tiers, key=lambda t: TIER_PRIORITY.get(t, 99))
                kind = next(iter(kinds)) if len(kinds) == 1 else ("agency" if tier == "union" else "department")
                state = None if tier in ("apex", "union", "missions") else (next(iter(states)) if len(states) == 1 else STATE_ROOT_ZONES.get(root_domain))
                ministry = next(iter(mins)) if len(mins) == 1 else root_to_ministry.get(root_domain)
                url = f"https://{dom}"
                name = infer_title_from_domain(dom, state, ministry)
            elif inst_obs:
                win = min(
                    inst_obs,
                    key=lambda o: (
                        SOURCE_PRIORITY.get(o["source"], 99),
                        TIER_PRIORITY.get(o["tier"], 99),
                        KIND_PRIORITY.get(o["kind"], 99),
                    ),
                )
                name = win.get("title") or ""
                url = win.get("url") or f"https://{dom}"
                kind = win["kind"]
                tier = win["tier"]
                state = win.get("state")
                ministry = win.get("ministry")
            else:
                win = min(pool, key=lambda o: SOURCE_PRIORITY.get(o["source"], 99))
                name = win.get("title") or ""
                url = f"https://{dom}"
                kind = win["kind"]
                tier = win["tier"]
                state = win.get("state")
                ministry = win.get("ministry")

    # Enforce federal jurisdiction boundaries and root-domain fallbacks
    if tier in ("apex", "union", "missions"):
        state = None
        if tier == "apex":
            ministry = None
    else:
        if not state and root_domain in STATE_ROOT_ZONES:
            state = STATE_ROOT_ZONES[root_domain]
        if not ministry and tier == "union" and root_domain in root_to_ministry:
            ministry = root_to_ministry[root_domain]

    if not name:
        name = infer_title_from_domain(dom, state, ministry)

    preserved_list = [
        {"title": t, "url": u}
        for u, t in sorted(url_title_pairs.items())
        if t
    ][:25]
    distinct_title_count = max(1, len({t for t in url_title_pairs.values() if t}))
    redir_info = redirects.get(dom)

    return {
        "domain": dom,
        "root_domain": root_domain,
        "url": url,
        "name": name,
        "abbrev": abbrevs[0] if abbrevs else None,
        "note": notes[0] if notes else None,
        "role": classify_host_role(dom),
        "kind": kind,
        "tier": tier,
        "state": state,
        "ministry": ministry,
        "in_igod": in_igod,
        "provenance": provenance,
        "catalogued": provenance != "passive_only",
        "sources": sources,
        "preserved_urls_count": max(1, len(url_title_pairs)),
        "sub_portals": distinct_title_count,
        "sub_entries": preserved_list if len(url_title_pairs) > 1 else [],
        "redirect_to": redir_info["target_host"] if redir_info else None,
        "redirect_url": redir_info["target_url"] if redir_info else None,
        "tranco_rank": tranco_ranks.get(dom),
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--refresh", action="store_true", help="Ignore HTTP/DNS caches and re-fetch")
    args = ap.parse_args()

    ensure_dirs()
    igod_entries, ministry_records, domain_to_ministry, resolve_ministry_name = harvest_igod(refresh=args.refresh)
    repo_entries = load_repo_sources()
    tranco_id, tranco_ranks = load_tranco_gov_in(refresh=args.refresh)
    archive_urls, urlscan_domains = load_archive_and_urlscan(refresh=args.refresh)

    # Build district name indices from IGOD sg/<ST>/E042/organizations (plain-text district roster)
    slug_to_districts: dict[str, set[tuple[str, str]]] = {}
    state_slug_to_district: dict[tuple[str, str], str] = {}
    for e in igod_entries:
        if (e.get("list_path") or "").endswith("/E042/organizations") and e.get("title") and e.get("state"):
            d_name = re.sub(r"\s*\([^)]+\)\s*$", "", e["title"]).strip()
            st_name = e["state"]
            for slug in {
                re.sub(r"[^a-z0-9]", "", d_name.lower()),
                re.sub(r"[^a-z0-9]+", "-", d_name.lower()).strip("-"),
            }:
                if len(slug) >= 3:
                    slug_to_districts.setdefault(slug, set()).add((d_name, st_name))
                    state_slug_to_district.setdefault((st_name, slug), d_name)

    # Reconciliation tracking for non-.gov.in IGOD entries
    non_gov_hosts_seen = set()
    non_gov_by_tld: dict[str, int] = {}
    non_gov_by_tier: dict[str, int] = {}

    obs_by_domain: dict[str, list[dict]] = {}
    root_for_domain: dict[str, str] = {}

    def add_obs(
        domain: str,
        root_domain: str,
        url: str,
        title: str | None,
        kind: str,
        tier: str,
        state: str | None,
        ministry: str | None,
        source: str,
        is_passive: bool = False,
        is_citation_only: bool = False,
        note: str | None = None,
        abbrev: str | None = None,
    ):
        root_for_domain.setdefault(domain, root_domain)
        obs_by_domain.setdefault(domain, []).append(
            {
                "url": url,
                "title": title,
                "kind": kind,
                "tier": tier,
                "state": state,
                "ministry": ministry,
                "source": source,
                "is_passive": is_passive,
                "is_citation_only": is_citation_only,
                "note": note,
                "abbrev": abbrev,
            }
        )

    # 1. Process IGOD entries
    for e in igod_entries:
        dom, root_or_host, clean_u = normalize_url_and_host(e.get("url"))
        if not dom:
            if root_or_host and root_or_host not in non_gov_hosts_seen:
                non_gov_hosts_seen.add(root_or_host)
                tld = classify_tld(root_or_host)
                non_gov_by_tld[tld] = non_gov_by_tld.get(tld, 0) + 1
                t_key = e.get("tier") or "other"
                non_gov_by_tier[t_key] = non_gov_by_tier.get(t_key, 0) + 1
            continue
        ministry = resolve_ministry_name(e.get("ministry")) or domain_to_ministry.get(dom)
        add_obs(
            domain=dom,
            root_domain=root_or_host,
            url=clean_u,
            title=e.get("title"),
            kind=e["kind"],
            tier=e["tier"],
            state=e.get("state"),
            ministry=ministry,
            source=e["source"],
        )

    # 2. Process Data Libertarian repo entries
    for e in repo_entries:
        dom, root, clean_u = normalize_url_and_host(e.get("url"))
        if not dom:
            continue
        ministry = resolve_ministry_name(e.get("ministry")) or domain_to_ministry.get(dom)
        add_obs(
            domain=dom,
            root_domain=root,
            url=clean_u,
            title=e.get("title"),
            kind=e["kind"],
            tier=e["tier"],
            state=e.get("state"),
            ministry=ministry,
            source=e["source"],
            is_citation_only=bool(e.get("is_citation_only")),
            note=e.get("note"),
            abbrev=e.get("abbrev"),
        )

    # Build root-domain -> ministry map from IGOD/DL Union entries
    root_to_ministry: dict[str, str] = {}
    for dom, obs_list in obs_by_domain.items():
        root = root_for_domain[dom]
        if root in STATE_ROOT_ZONES or root == "gov.in":
            continue
        for o in obs_list:
            if o["ministry"] and o["tier"] == "union":
                root_to_ministry.setdefault(root, o["ministry"])

    # 4b. One-hop official links, HTTP-verified district additions & redirects
    known_inst_domains = {d for d, olist in obs_by_domain.items() if any(not o["is_passive"] for o in olist)}
    onehop_entries, redirects = discover_onehop_and_redirects(
        igod_entries,
        ministry_records,
        repo_entries,
        known_inst_domains,
        slug_to_districts,
        state_slug_to_district,
        refresh=args.refresh,
    )
    for e in onehop_entries:
        dom, root, clean_u = normalize_url_and_host(e.get("url") or f"https://{e['domain']}")
        if not dom:
            continue
        ministry = resolve_ministry_name(e.get("ministry")) or domain_to_ministry.get(dom) or root_to_ministry.get(root)
        add_obs(
            domain=dom,
            root_domain=root,
            url=clean_u,
            title=e.get("title"),
            kind=e.get("kind") or "portal",
            tier=e.get("tier") or "union",
            state=e.get("state"),
            ministry=ministry,
            source=e["source"],
        )

    # 5. Process Tranco, GoI Archive, URLScan (passive / web-archive observations)
    for dom in tranco_ranks:
        root = ".".join(dom.split(".")[-3:])
        st = STATE_ROOT_ZONES.get(root)
        min_name = domain_to_ministry.get(dom) or root_to_ministry.get(root)
        add_obs(
            domain=dom,
            root_domain=root,
            url=f"https://{dom}",
            title=None,
            kind="portal",
            tier="uncharted",
            state=st,
            ministry=min_name,
            source="tranco",
            is_passive=True,
        )

    for raw_u in archive_urls:
        dom, root, clean_u = normalize_url_and_host(raw_u)
        if not dom:
            continue
        st = STATE_ROOT_ZONES.get(root)
        min_name = domain_to_ministry.get(dom) or root_to_ministry.get(root)
        add_obs(
            domain=dom,
            root_domain=root,
            url=clean_u,
            title=None,
            kind="portal",
            tier="uncharted",
            state=st,
            ministry=min_name,
            source="goi-archive",
            is_passive=True,
        )

    for raw_d in urlscan_domains:
        dom, root, clean_u = normalize_url_and_host(raw_d)
        if not dom:
            continue
        st = STATE_ROOT_ZONES.get(root)
        min_name = domain_to_ministry.get(dom) or root_to_ministry.get(root)
        add_obs(
            domain=dom,
            root_domain=root,
            url=clean_u,
            title=None,
            kind="portal",
            tier="uncharted",
            state=st,
            ministry=min_name,
            source="urlscan",
            is_passive=True,
        )

    # Resolve each host atomically (zero mixed entity/URL field splicing)
    records: dict[str, dict] = {}
    for dom, obs_list in obs_by_domain.items():
        records[dom] = resolve_host_record(
            dom=dom,
            root_domain=root_for_domain[dom],
            obs_list=obs_list,
            redirects=redirects,
            tranco_ranks=tranco_ranks,
            root_to_ministry=root_to_ministry,
        )

    # Classify passive Tranco/archive district domains that match IGOD E042 slugs
    # without upgrading provenance unless HTTP-verified above.
    for dom, rec in records.items():
        if rec["provenance"] != "passive_only":
            continue
        labels = dom.split(".")
        matched_dist = None
        matched_state = None
        if len(labels) == 3 and dom not in STATE_ROOT_ZONES:
            cands = slug_to_districts.get(dom[:-7], ())
            if len(cands) == 1:
                matched_dist, matched_state = next(iter(cands))
        elif (
            rec["root_domain"] in STATE_ROOT_ZONES
            and rec["root_domain"] != "mizoram.gov.in"
            and not rec["root_domain"].endswith("police.gov.in")
            and rec["root_domain"] != "ksp.gov.in"
        ):
            st_name = STATE_ROOT_ZONES[rec["root_domain"]]
            prefix = dom[: -(len(rec["root_domain"]) + 1)]
            if "." not in prefix and (st_name, prefix) in state_slug_to_district:
                matched_dist = state_slug_to_district[(st_name, prefix)]
                matched_state = st_name
        if matched_dist and matched_state:
            rec["kind"] = "district"
            rec["tier"] = "local"
            rec["state"] = matched_state
            rec["name"] = f"District Administration, {matched_dist}"

    # DNS liveness check with response classification & timestamps
    all_domains = sorted(records.keys())
    dns_map, dns_checked_at = check_dns_all(all_domains, refresh=args.refresh)
    for dom, rec in records.items():
        dinfo = dns_map[dom]
        rec["dns_live"] = bool(dinfo["live"])
        rec["dns_status"] = dinfo["status"]
        rec["dns_checked_at"] = dinfo["checked_at"]

    # Sort records cleanly: Tranco rank first, then in_igod / official_verified, then resolved DNS, then domain
    prov_rank = {"igod": 0, "official_verified": 1, "passive_only": 2}
    sorted_records = sorted(
        records.values(),
        key=lambda r: (
            0 if r["tranco_rank"] is not None else 1,
            r["tranco_rank"] if r["tranco_rank"] is not None else 999_999_999,
            prov_rank.get(r["provenance"], 9),
            0 if r["dns_live"] else 1,
            r["domain"],
        ),
    )

    # Update ministry reconciliation counts (include only institutional/web subdomains mapped to ministry)
    min_domain_counts: dict[str, int] = {}
    for rec in sorted_records:
        m = rec.get("ministry")
        if m:
            min_domain_counts[m] = min_domain_counts.get(m, 0) + 1
    for mr in ministry_records:
        mr["gov_in_domains"] = min_domain_counts.get(mr["canonical_name"], 0)
    ministry_records.sort(key=lambda x: (-x["gov_in_domains"], x["name"]))

    snapshot = {
        "meta": {
            "generated_on": datetime.date.today().isoformat(),
            "dns_checked_at": dns_checked_at,
            "tranco_list_id": tranco_id,
            "total_domains": len(sorted_records),
            "web_hosts": sum(1 for r in sorted_records if r["role"] == "web"),
            "infra_hosts": sum(1 for r in sorted_records if r["role"] == "infrastructure"),
            "third_level_domains": sum(1 for r in sorted_records if len(r["domain"].split(".")) == 3),
            "deeper_subdomains": sum(1 for r in sorted_records if len(r["domain"].split(".")) > 3),
            "dns_live_domains": sum(1 for r in sorted_records if r["dns_live"]),
            "dns_no_record_domains": sum(1 for r in sorted_records if r["dns_status"] == "no_record"),
            "dns_lookup_error_domains": sum(1 for r in sorted_records if r["dns_status"] == "lookup_error"),
            "igod_domains": sum(1 for r in sorted_records if r["in_igod"]),
            "official_verified_domains": sum(1 for r in sorted_records if r["provenance"] == "official_verified"),
            "passive_only_domains": sum(1 for r in sorted_records if r["provenance"] == "passive_only"),
            "catalogued_domains": sum(1 for r in sorted_records if r["provenance"] != "passive_only"),
            "uncharted_domains": sum(1 for r in sorted_records if r["provenance"] == "passive_only"),
            "redirects_recorded": sum(1 for r in sorted_records if r.get("redirect_to")),
            "root_zones": len({r["root_domain"] for r in sorted_records}),
            "listed_portals": sum(r["preserved_urls_count"] for r in sorted_records),
            "sources": [
                {"name": "Integrated Government Online Directory (igod.gov.in)", "url": "https://igod.gov.in", "role": "Official NIC/MeitY hierarchy across Union, 36 States/UTs, Districts, Local Bodies, Legislature, Judiciary & Missions"},
                {"name": "One-hop Official Portal Crawl & Redirect Verification", "url": "https://datalibertarian.in/gov", "role": "Direct links extracted from official Union/State/Court/Legislature/Local homepages and HTTP-200 verified district portals"},
                {"name": f"Tranco Subdomains List ({tranco_id})", "url": f"https://tranco-list.eu/list/{tranco_id}/full", "role": "Real-world traffic & passive DNS (CrUX, Cloudflare Radar, Farsight DNS, Majestic, Umbrella)"},
                {"name": "Data Libertarian Registers", "url": "https://datalibertarian.in/sources", "role": "Verified state agencies, municipal bodies, budget books, and V2 PSU company sites"},
                {"name": "GoI Web Directory Archive & URLScan", "url": "https://github.com/ABHISHEKVALSAN/Indian-Government-Websites", "role": "Historical GoI directory crawl & public web scan discovery"},
                {"name": "DNS Resolution Check", "url": "https://registry.gov.in", "role": "Timestamped socket.getaddrinfo probe classifying resolved, resolved via www, no-record (EAI_NONAME), and lookup errors"},
            ],
        },
        "reconciliation": {
            "ministries_total": len(ministry_records),
            "ministries_gov_in": sum(1 for m in ministry_records if m["is_gov_in"]),
            "ministries": ministry_records,
            "non_gov_in_total": sum(non_gov_by_tld.values()),
            "non_gov_in_by_tld": dict(sorted(non_gov_by_tld.items(), key=lambda x: -x[1])),
            "non_gov_in_by_tier": dict(sorted(non_gov_by_tier.items(), key=lambda x: -x[1])),
        },
        "records": sorted_records,
    }

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Wrote {OUT_PATH} ({len(sorted_records)} unique .gov.in hostnames, {os.path.getsize(OUT_PATH) / 1e6:.2f} MB)")


if __name__ == "__main__":
    main()
