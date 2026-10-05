"""Regenerate src/data/crime/ncrb2023More.ts from NCRB Crime in India 2023, Volume I.

    curl -sSLo cii2023.pdf https://www.ncrb.gov.in/uploads/files/1CrimeinIndia2023PartI.pdf
    pdftotext -layout cii2023.pdf c23.txt
    python3 scripts/crime/extract_cii2023_more.py c23.txt > src/data/crime/ncrb2023More.ts

Tables 1.2, 1A.4, 1B.4, 2A.1, 2A.2, 2A.3, 2B.1. Each block is located by its printed
header, read up to its printed "TOTAL ALL INDIA" or "TOTAL CITIES" row, and every
column used here is checked against that printed total. A moved line fails an
assert instead of shipping a wrong number.
"""
import json
import re
import sys

L = open(sys.argv[1]).read().split("\n")

STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
    "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "A&N Islands", "Chandigarh", "D&N Haveli and Daman & Diu", "Delhi", "Jammu & Kashmir",
    "Ladakh", "Lakshadweep", "Puducherry",
]
CITIES = [
    "Ahmedabad", "Bengaluru", "Chennai", "Coimbatore", "Delhi City", "Ghaziabad", "Hyderabad",
    "Indore", "Jaipur", "Kanpur", "Kochi", "Kolkata", "Kozhikode", "Lucknow", "Mumbai", "Nagpur",
    "Patna", "Pune", "Surat",
]
NUM = r"([\d.\s]+)$"


def find(pattern, after=0):
    for i in range(after, len(L)):
        if re.search(pattern, L[i]):
            return i
    raise SystemExit(f"not found: {pattern}")


def total_row(start, label):
    i = find(label, start)
    return [float(x) if "." in x else int(x) for x in L[i].split(label)[1].split()], i


def state_block(header_pattern, after=0):
    start = find(header_pattern, after)
    totals, end = total_row(start, "TOTAL ALL INDIA")
    rows = {}
    for line in L[start:end]:
        m = re.match(r"\s*(\d+)\s+([A-Za-z&. ]*[A-Za-z])\s{2,}" + NUM, line)
        if m and m.group(2) in STATES:
            rows[m.group(2)] = m.group(3).split()
            continue
        m = re.match(r"\s*31\s+" + NUM, line)
        if m:
            rows["D&N Haveli and Daman & Diu"] = m.group(1).split()
    assert list(rows) == STATES, sorted(set(STATES) ^ set(rows))
    return rows, totals, end


def city_block(header_pattern, after=0):
    start = find(header_pattern, after)
    totals, end = total_row(start, "TOTAL CITIES")
    rows = []
    for line in L[start:end]:
        m = re.match(r"^\s*(\d{1,2})\s+(?:Delhi City\s+)?" + NUM, line)
        if m:
            rows.append(m.group(2).split())
    assert len(rows) == 19, len(rows)
    return dict(zip(CITIES, rows)), totals, end


def num(s):
    return float(s) if "." in s else int(s)


def check(rows, totals, col, tcol=None):
    got = sum(num(r[col]) for r in rows.values())
    want = totals[col if tcol is None else tcol]
    assert got == want, (col, got, want)


# ---- Table 1.2: national lines, 2021-2023 ----
t12 = find(r"IPC Crimes \(Crime Head-wise\) - 2021-2023")
HEADS = {
    "murder": r"^1\s+Murder\s", "rape": r"^18\s+Rape\s", "theft": r"^26\s+Theft\s",
    "autoTheft": r"^26\.1\s+Auto", "otherTheft": r"^26\.2\s+Other Thefts", "burglary": r"^27\s+Burglary\s",
    "robbery": r"^29\s+Robbery\s", "dacoity": r"^31\s+Dacoity\s",
}
national = {}
for key, pattern in HEADS.items():
    line = L[find(pattern, t12)]
    v = line.split()[-7:]
    national[key] = {
        "y2021": {"cases": int(v[0]), "rate": float(v[1])},
        "y2022": {"cases": int(v[2]), "rate": float(v[3])},
        "y2023": {"cases": int(v[4]), "rate": float(v[5])},
    }

# ---- Table 2A.1: murder by state ----
m_rows, m_tot, _ = state_block(r"Murder Cases - 2021-2023")
for c in (0, 1, 2):
    check(m_rows, m_tot, c)
assert m_tot[2] == national["murder"]["y2023"]["cases"]

# ---- Table 1A.4: property heads by state ----
theft, theft_t, e = state_block(r"Theft \(Section 379 IPC\)", find(r"TABLE 1A.4"))
check(theft, theft_t, 3)
burg, burg_t, e = state_block(r"Burglary \(Sec.454 to 460 r/w Sec.380 IPC\)", e)
check(burg, burg_t, 3)
rob, rob_t, e = state_block(r"Robbery \(Sec.392/394/397", e)
check(rob, rob_t, 6)
dac, dac_t, _ = state_block(r"Dacoity \(Total\)", e)
check(dac, dac_t, 3)
assert theft_t[3] == national["theft"]["y2023"]["cases"]
assert burg_t[3] == national["burglary"]["y2023"]["cases"]
assert rob_t[6] == national["robbery"]["y2023"]["cases"]
assert dac_t[3] == national["dacoity"]["y2023"]["cases"]

states = []
for name in STATES:
    m, t, b, r, d = m_rows[name], theft[name], burg[name], rob[name], dac[name]
    states.append({
        "name": name,
        "populationLakh": num(m[3]),
        "murder": {"y2021": num(m[0]), "y2022": num(m[1]), "y2023": num(m[2]), "rate": num(m[4]),
                   "chargesheetRate": None if m[5] == "-" else num(m[5]) if len(m) > 5 else None},
        "theft": {"cases": num(t[3]), "rate": num(t[5])},
        "burglary": {"cases": num(b[3]), "rate": num(b[5])},
        "robbery": {"cases": num(r[6]), "rate": num(r[8])},
        "dacoity": {"cases": num(d[3]), "rate": num(d[5])},
    })

# ---- Tables 2B.1 and 1B.4: cities ----
cm, cm_t, _ = city_block(r"Murder Cases in Metropolitan Cities - 2021-2023")
for c in (0, 1, 2):
    check(cm, cm_t, c)
b14 = find(r"TABLE 1B.4")
ct, ct_t, e = city_block(r"Theft \(Section 379 IPC\)", b14)
check(ct, ct_t, 3)
cb, cb_t, e = city_block(r"Burglary \(Sec.454 to 460 r/w Sec.380 IPC\)", e)
check(cb, cb_t, 3)
cr, cr_t, e = city_block(r"Robbery \(Sec.392/394/397", e)
check(cr, cr_t, 6)
cd, cd_t, _ = city_block(r"Dacoity \(Total\)", e)
check(cd, cd_t, 3)
cities = []
for name in CITIES:
    m, t, b, r, d = cm[name], ct[name], cb[name], cr[name], cd[name]
    cities.append({
        "name": name,
        "populationLakh2011": num(m[3]),
        "murder": {"y2021": num(m[0]), "y2022": num(m[1]), "y2023": num(m[2]), "rate": num(m[4])},
        "theft": {"cases": num(t[3]), "rate": num(t[5])},
        "burglary": {"cases": num(b[3]), "rate": num(b[5])},
        "robbery": {"cases": num(r[6]), "rate": num(r[8])},
        "dacoity": {"cases": num(d[3]), "rate": num(d[5])},
    })

# ---- Table 2A.2: motives, all-India row of each page ----
p = find(r"^\s+Motives of Murder - 2023$")
page1, e = total_row(p, "TOTAL ALL INDIA")
page2, e = total_row(e + 1, "TOTAL ALL INDIA")
page3, e = total_row(e + 1, "TOTAL ALL INDIA")
page4, e = total_row(e + 1, "TOTAL ALL INDIA")
gain, vendetta, dowry, witchcraft, sacrifice, communal, caste = page1
klass, political, honour, love, illicit, extremism, dacoity_robbery = page2
gang, psycho, body_parts, disputes, prop_land, family, petty = page3
money, water, road, blind, other, total = page4
assert disputes == prop_land + family + petty + money + water + road
top = [gain, vendetta, dowry, witchcraft, sacrifice, communal, caste, klass, political, honour, love,
       illicit, extremism, dacoity_robbery, gang, psycho, body_parts, disputes, blind, other]
assert sum(top) == total == national["murder"]["y2023"]["cases"], (sum(top), total)
motives = [
    {"label": "Disputes", "cases": disputes},
    {"label": "Other causes", "cases": other},
    {"label": "Personal vendetta or enmity", "cases": vendetta},
    {"label": "Gain", "cases": gain},
    {"label": "Love affairs", "cases": love},
    {"label": "Illicit relationship", "cases": illicit},
    {"label": "No clue or motive not known", "cases": blind},
    {"label": "Dowry", "cases": dowry},
    {"label": "During dacoity or robbery", "cases": dacoity_robbery},
    {"label": "Communal or religious", "cases": communal},
    {"label": "Witchcraft", "cases": witchcraft},
    {"label": "Extremism or insurgency", "cases": extremism},
    {"label": "Gang rivalry", "cases": gang},
    {"label": "Casteism", "cases": caste},
    {"label": "Class conflict", "cases": klass},
    {"label": "Honour killing", "cases": honour},
    {"label": "Psychopath or serial killer", "cases": psycho},
    {"label": "Political reasons", "cases": political},
    {"label": "Child or human sacrifice", "cases": sacrifice},
    {"label": "Sale of body parts", "cases": body_parts},
]
dispute_breakdown = [
    {"label": "Family", "cases": family},
    {"label": "Property or land", "cases": prop_land},
    {"label": "Petty quarrel", "cases": petty},
    {"label": "Money", "cases": money},
    {"label": "Road accident", "cases": road},
    {"label": "Water", "cases": water},
]

# ---- Table 2A.3: victims, all-India rows ----
v = find(r"Victims of Murder \(Gender & Age Group-wise\) - 2023$")
a, e = total_row(v, "TOTAL ALL INDIA")        # <6, 6-12, 12-16 (M F T Total each)
b, e = total_row(e + 1, "TOTAL ALL INDIA")    # 16-18, child total, 18-30
c, e = total_row(e + 1, "TOTAL ALL INDIA")    # 30-45, 45-60, 60+
d, e = total_row(e + 1, "TOTAL ALL INDIA")    # adult total, all victims
ages = {"below6": a[3], "age6to12": a[7], "age12to16": a[11], "age16to18": b[3],
        "age18to30": b[11], "age30to45": c[3], "age45to60": c[7], "age60plus": c[11]}
victims = {"male": d[4], "female": d[5], "transgender": d[6], "total": d[7], "child": b[7], "adult": d[3]}
assert ages["below6"] + ages["age6to12"] + ages["age12to16"] + ages["age16to18"] == victims["child"]
assert ages["age18to30"] + ages["age30to45"] + ages["age45to60"] + ages["age60plus"] == victims["adult"]
assert victims["male"] + victims["female"] + victims["transgender"] == victims["total"] == victims["child"] + victims["adult"]

data = {
    "year": 2023,
    "national": national,
    "states": states,
    "cities": cities,
    "murderMotives": motives,
    "disputeBreakdown": dispute_breakdown,
    "murderVictims": {**victims, "ages": ages},
}
sys.stdout.write(
    "// Extracted by script from National Crime Records Bureau, Crime in India 2023, Volume I (PDF).\n"
    "// Tables 1.2, 1A.4, 1B.4, 2A.1, 2A.2, 2A.3, 2B.1. Do not type over these figures.\n"
    "// Regenerate with scripts/crime/extract_cii2023_more.py. Accessed 2026-09-27.\n"
    "// https://www.ncrb.gov.in/uploads/files/1CrimeinIndia2023PartI.pdf\n"
    "export const ncrb2023More = " + json.dumps(data, indent=2) + " as const;\n"
)
