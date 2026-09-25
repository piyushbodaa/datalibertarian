#!/usr/bin/env python3
"""Snapshot UDISE+ school, student and teacher counts by management into education/data/udise.json.

Source: the Ministry of Education's UDISE+ open-services API (the same endpoints the public
dashboard at https://dashboard.udiseplus.gov.in uses). Run by hand when a new UDISE+ year is
published; the site build reads only the committed JSON, never the API.

usage: python3 education/fetch_udise.py [--years 9-12]   (UDISE+ yearId 9 = 2022-23 ... 12 = 2025-26)
Python 3 stdlib only.
"""
import argparse
import json
import os
import time
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "data", "udise.json")
API = "https://api.udiseplus.gov.in/open-services/v1.1/%s/public"
YEAR_LABEL = {9: "2022-23", 10: "2023-24", 11: "2024-25", 12: "2025-26"}
MGMT = ("Govt", "GovtAided", "Pvt", "Other")
FIELDS = {
    "schools-summarised-stats": ["totSchools"] + ["totSchool" + m for m in MGMT] + ["totSchoolRural", "totSchoolUrban"],
    "students-summarised-stats": ["totStudents"] + ["totStudent" + m for m in MGMT] + ["totStudentB", "totStudentG"],
    "teachers-summarised-stats": ["totTch"] + ["totTch" + m for m in MGMT] + ["totTchM", "totTchF"],
}


def post(endpoint, year, region_type, code):
    body = json.dumps({"yearId": year, "regionType": region_type, "regionCode": "%02d" % code}).encode()
    req = urllib.request.Request(API % endpoint, data=body, method="POST", headers={
        "Content-Type": "application/json", "Origin": "https://dashboard.udiseplus.gov.in",
        "User-Agent": "datalibertarian.in (education snapshot)"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                rows = json.load(r).get("data") or []
                return rows[0] if rows else None
        except Exception:
            time.sleep(2 * (attempt + 1))
    raise SystemExit("UDISE+ API failed for %s year %s region %s/%s" % (endpoint, year, region_type, code))


def pick(row, endpoint):
    out = {}
    for f in FIELDS[endpoint]:
        v = row.get(f)
        out[f] = int(v) if v not in (None, "", "null") else None
    return out


def region(year, region_type, code):
    rec = {}
    for ep in FIELDS:
        row = post(ep, year, region_type, code)
        if row is None:
            return None, None
        rec.update(pick(row, ep))
        name = row.get("regionName")
        time.sleep(0.15)
    return name, rec


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--years", default="9-12")
    a, b = (int(x) for x in ap.parse_args().years.split("-"))
    snap = {"source": "UDISE+ (Unified District Information System for Education Plus), Ministry of Education, Government of India",
            "source_url": "https://dashboard.udiseplus.gov.in",
            "api": "https://api.udiseplus.gov.in/open-services/v1.1/{schools,students,teachers}-summarised-stats/public",
            "fetched": time.strftime("%Y-%m-%d"), "years": {}}
    for year in range(a, b + 1):
        label = YEAR_LABEL.get(year, str(year))
        _, india = region(year, 10, 99)
        if india is None:
            print("year %s: no data, skipped" % label)
            continue
        states = {}
        for code in range(1, 41):
            name, rec = region(year, 11, code)
            if rec is not None and rec.get("totSchools"):
                rec["udise_code"] = code
                states[name.title().replace(" And ", " and ")] = rec
        snap["years"][label] = {"india": india, "states": states}
        print("year %s: India %s schools, %d states/UTs" % (label, format(india["totSchools"], ","), len(states)))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(snap, f, indent=1, ensure_ascii=False)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
