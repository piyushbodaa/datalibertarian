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
DNS_CACHE_PATH = os.path.join(CACHE_DIR, "dns_cache.json")
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
    if bare == "gov.in" or not GOV_IN_HOST_RE.match(bare):
        # Return TLD category in 3rd slot for reconciliation
        return None, host, None
    labels = bare.split(".")
    root_domain = ".".join(labels[-3:])  # e.g. maharashtra.gov.in or finmin.gov.in
    scheme = parsed.scheme.lower() if parsed.scheme.lower() in ("http", "https") else "https"
    clean_u = urllib.parse.urlunsplit((scheme, host, parsed.path or "/", parsed.query, ""))
    if clean_u.endswith("/") and parsed.path in ("", "/") and not parsed.query:
        clean_u = f"{scheme}://{host}"
    return bare, root_domain, clean_u


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
                        }
                    )

    # 3. registers/data/psu.json (V2 only)
    psu_path = os.path.join(ROOT, "registers", "data", "psu.json")
    if os.path.exists(psu_path):
        with open(psu_path, encoding="utf-8") as f:
            psu = json.load(f)
        for r in psu.get("records", []):
            if r.get("verification") != "V2":
                continue
            st = None if r.get("state") in ("Union", "All India", "Centre", None) else r.get("state")
            tier = "union" if r.get("owner") == "Central government" or not st else "state"
            for src in r.get("sources", []):
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


def check_dns_all(domains: list[str], refresh: bool = False) -> dict[str, bool]:
    print(f"[5/5] Checking DNS resolution for {len(domains)} unique .gov.in domains...")
    cache: dict[str, bool] = {}
    if not refresh and os.path.exists(DNS_CACHE_PATH):
        with open(DNS_CACHE_PATH, encoding="utf-8") as f:
            cache = json.load(f)

    todo = [d for d in domains if d not in cache]
    if todo:
        print(f"    Resolving {len(todo)} uncached domains via socket.getaddrinfo (64 workers)...")
        socket.setdefaulttimeout(3.0)

        def probe(d: str) -> tuple[str, bool]:
            for host in (d, "www." + d):
                try:
                    socket.getaddrinfo(host, None)
                    return d, True
                except OSError:
                    continue
            return d, False

        done = 0
        with concurrent.futures.ThreadPoolExecutor(max_workers=64) as pool:
            for d, ok in pool.map(probe, todo):
                cache[d] = ok
                done += 1
                if done % 1000 == 0:
                    print(f"      DNS checked {done}/{len(todo)}...")
        with open(DNS_CACHE_PATH, "w", encoding="utf-8") as f:
            json.dump(cache, f)

    live = sum(1 for d in domains if cache.get(d))
    print(f"    DNS live: {live}/{len(domains)} ({100.0 * live / max(1, len(domains)):.1f}%)")
    return {d: bool(cache.get(d)) for d in domains}


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

    records: dict[str, dict] = {}
    portal_titles: dict[str, set[str]] = {}

    def upsert(
        domain: str,
        root_domain: str,
        url: str,
        title: str | None,
        kind: str,
        tier: str,
        state: str | None,
        ministry: str | None,
        source: str,
        catalogued: bool,
        note: str | None = None,
        abbrev: str | None = None,
    ):
        if title:
            portal_titles.setdefault(domain, set()).add(title)
        rec = records.get(domain)
        if not rec:
            records[domain] = {
                "domain": domain,
                "root_domain": root_domain,
                "url": url,
                "name": title or "",
                "abbrev": abbrev,
                "note": note,
                "kind": kind,
                "tier": tier,
                "state": state,
                "ministry": ministry,
                "catalogued": catalogued,
                "sources": [source],
                "sub_portals": 1,
                "tranco_rank": tranco_ranks.get(domain),
            }
            return

        if source not in rec["sources"]:
            rec["sources"].append(source)
        if catalogued:
            rec["catalogued"] = True
        if KIND_PRIORITY.get(kind, 99) < KIND_PRIORITY.get(rec["kind"], 99):
            rec["kind"] = kind
        if TIER_PRIORITY.get(tier, 99) < TIER_PRIORITY.get(rec["tier"], 99):
            rec["tier"] = tier
        if not rec["state"] and state:
            rec["state"] = state
        if not rec["ministry"] and ministry:
            rec["ministry"] = ministry
        if not rec["note"] and note:
            rec["note"] = note
        if not rec["abbrev"] and abbrev:
            rec["abbrev"] = abbrev
        # Prefer richer descriptive title (unless current is empty or synthetic)
        if title and (not rec["name"] or (source == "igod" and len(title) > len(rec["name"]))):
            if source != "dl-budgets" or not rec["name"]:
                rec["name"] = title
        # Prefer HTTPS root URL over deep sub-links when upgrading from citations
        if source in ("igod", "igod-tree", "dl-entities") and url.startswith("https://"):
            rec["url"] = url

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
        upsert(
            domain=dom,
            root_domain=root_or_host,
            url=clean_u,
            title=e.get("title"),
            kind=e["kind"],
            tier=e["tier"],
            state=e.get("state"),
            ministry=ministry,
            source=e["source"],
            catalogued=True,
        )

    # 2. Process Data Libertarian repo entries
    for e in repo_entries:
        dom, root, clean_u = normalize_url_and_host(e.get("url"))
        if not dom:
            continue
        ministry = resolve_ministry_name(e.get("ministry")) or domain_to_ministry.get(dom)
        upsert(
            domain=dom,
            root_domain=root,
            url=clean_u,
            title=e.get("title"),
            kind=e["kind"],
            tier=e["tier"],
            state=e.get("state"),
            ministry=ministry,
            source=e["source"],
            catalogued=True,
            note=e.get("note"),
            abbrev=e.get("abbrev"),
        )

    # Build root-domain -> ministry fallback map from catalogued Union entries
    root_to_ministry = {}
    for rec in records.values():
        if rec["ministry"] and rec["root_domain"] not in STATE_ROOT_ZONES and rec["root_domain"] != "gov.in":
            root_to_ministry.setdefault(rec["root_domain"], rec["ministry"])

    # 3. Process Tranco, GoI Archive, URLScan
    for dom in tranco_ranks:
        root = ".".join(dom.split(".")[-3:])
        st = STATE_ROOT_ZONES.get(root)
        min_name = domain_to_ministry.get(dom) or root_to_ministry.get(root)
        upsert(
            domain=dom,
            root_domain=root,
            url=f"https://{dom}",
            title=None,
            kind="portal",
            tier="uncharted",
            state=st,
            ministry=min_name,
            source="tranco",
            catalogued=False,
        )

    for raw_u in archive_urls:
        dom, root, clean_u = normalize_url_and_host(raw_u)
        if not dom:
            continue
        st = STATE_ROOT_ZONES.get(root)
        min_name = domain_to_ministry.get(dom) or root_to_ministry.get(root)
        upsert(
            domain=dom,
            root_domain=root,
            url=clean_u,
            title=None,
            kind="portal",
            tier="uncharted",
            state=st,
            ministry=min_name,
            source="goi-archive",
            catalogued=False,
        )

    for raw_d in urlscan_domains:
        dom, root, clean_u = normalize_url_and_host(raw_d)
        if not dom:
            continue
        st = STATE_ROOT_ZONES.get(root)
        min_name = domain_to_ministry.get(dom) or root_to_ministry.get(root)
        upsert(
            domain=dom,
            root_domain=root,
            url=clean_u,
            title=None,
            kind="portal",
            tier="uncharted",
            state=st,
            ministry=min_name,
            source="urlscan",
            catalogued=False,
        )

    # Reconcile IGOD E042 District Roster against uncatalogued district .gov.in portals
    for dom, rec in records.items():
        if rec["catalogued"]:
            continue
        labels = dom.split(".")
        matched_dist = None
        matched_state = None
        if len(labels) == 3 and dom not in STATE_ROOT_ZONES:
            slug = dom[:-7]
            candidates = slug_to_districts.get(slug, ())
            if len(candidates) == 1:
                matched_dist, matched_state = next(iter(candidates))
        elif (
            rec["root_domain"] in STATE_ROOT_ZONES
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
            rec["catalogued"] = True
            if "igod-district" not in rec["sources"]:
                rec["sources"].append("igod-district")

    # Finalize names, sub_portals, and ministry counts
    for dom, rec in records.items():
        if not rec["state"] and rec["root_domain"] in STATE_ROOT_ZONES:
            rec["state"] = STATE_ROOT_ZONES[rec["root_domain"]]
        if not rec["ministry"] and rec["root_domain"] in root_to_ministry:
            rec["ministry"] = root_to_ministry[rec["root_domain"]]
        if not rec["name"]:
            rec["name"] = infer_title_from_domain(dom, rec["state"], rec["ministry"])
        rec["sub_portals"] = max(1, len(portal_titles.get(dom, ())))

    # DNS liveness check
    all_domains = sorted(records.keys())
    dns_map = check_dns_all(all_domains, refresh=args.refresh)
    for dom, rec in records.items():
        rec["dns_live"] = dns_map[dom]

    # Sort records cleanly: Tranco rank first, then catalogued, then domain
    sorted_records = sorted(
        records.values(),
        key=lambda r: (
            0 if r["tranco_rank"] is not None else 1,
            r["tranco_rank"] if r["tranco_rank"] is not None else 999_999_999,
            0 if r["catalogued"] else 1,
            0 if r["dns_live"] else 1,
            r["domain"],
        ),
    )

    # Update ministry reconciliation counts
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
            "tranco_list_id": tranco_id,
            "total_domains": len(sorted_records),
            "dns_live_domains": sum(1 for r in sorted_records if r["dns_live"]),
            "catalogued_domains": sum(1 for r in sorted_records if r["catalogued"]),
            "uncharted_domains": sum(1 for r in sorted_records if not r["catalogued"]),
            "root_zones": len({r["root_domain"] for r in sorted_records}),
            "listed_portals": sum(r["sub_portals"] for r in sorted_records),
            "sources": [
                {"name": "Integrated Government Online Directory (igod.gov.in)", "url": "https://igod.gov.in", "role": "Official NIC/MeitY hierarchy across Union, 36 States/UTs, Districts, Local Bodies, Legislature, Judiciary & Missions"},
                {"name": f"Tranco Subdomains List ({tranco_id})", "url": f"https://tranco-list.eu/list/{tranco_id}/full", "role": "Real-world traffic & passive DNS (CrUX, Cloudflare Radar, Farsight DNS, Majestic, Umbrella)"},
                {"name": "Data Libertarian Registers", "url": "https://datalibertarian.in/sources", "role": "Verified state agencies, municipal bodies, budget books, and V2 PSUs"},
                {"name": "GoI Web Directory Archive & URLScan", "url": "https://github.com/ABHISHEKVALSAN/Indian-Government-Websites", "role": "Historical GoI directory crawl & public web scan discovery"},
                {"name": "Live DNS Verification", "url": "https://registry.gov.in", "role": "Concurrent A/AAAA DNS resolution check across all compiled .gov.in hosts"},
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
    print(f"Wrote {OUT_PATH} ({len(sorted_records)} unique .gov.in domains, {os.path.getsize(OUT_PATH) / 1e6:.2f} MB)")


if __name__ == "__main__":
    main()
