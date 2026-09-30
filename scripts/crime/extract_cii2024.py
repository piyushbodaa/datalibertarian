"""Regenerate src/data/crime/ncrb2024.ts from NCRB Crime in India 2024, Volume I.

    curl -sSLo cii2024.pdf https://www.ncrb.gov.in/uploads/files/1CrimeinIndia2024-VolumeI.pdf
    pdftotext -layout cii2024.pdf c24.txt
    python3 scripts/crime/extract_cii2024.py c24.txt > src/data/crime/ncrb2024.ts

2024 is the year the Bharatiya Nyaya Sanhita replaced the IPC (1 July 2024), so most tables print
IPC, BNS and Total columns; this script takes the Total. Every block is read up to its printed
"TOTAL ALL INDIA" / "TOTAL CITIES" row and each column used is checked against that total.
National rows copied by hand (age, relation, disposal, section-wise, motives) are checked by the
identities printed under the tables (parts add to totals).
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
NUM = r"([\d.\s-]+)$"


def find(pattern, after=0, fixed=False):
    for i in range(after, len(L)):
        if (pattern in L[i]) if fixed else re.search(pattern, L[i]):
            return i
    raise SystemExit(f"not found: {pattern}")


def num(s):
    return float(s) if "." in s else int(s)


def total_row(start, label):
    i = find(label, start, fixed=True)
    return [num(x) for x in L[i].split(label)[1].split()], i


def state_block(start):
    totals, end = total_row(start, "TOTAL ALL INDIA")
    rows = {}
    for line in L[start:end]:
        m = re.match(r"\s*(\d+)\s+([A-Za-z&. ]*[A-Za-z])\s{2,}" + NUM, line)
        if m and m.group(2) in STATES:
            rows.setdefault(m.group(2), m.group(3).split())
            continue
        m = re.match(r"\s*31\s+" + NUM, line)
        if m:
            rows.setdefault("D&N Haveli and Daman & Diu", m.group(1).split())
    assert sorted(rows) == sorted(STATES), sorted(set(STATES) ^ set(rows))
    return rows, totals, end


def city_block(start):
    totals, end = total_row(start, "TOTAL CITIES")
    rows = []
    for line in L[start:end]:
        m = re.match(r"^\s*(\d{1,2})\s+(?:Delhi City\s+)?" + NUM, line)
        if m:
            rows.append(m.group(2).split())
    assert len(rows) == 19, len(rows)
    return dict(zip(CITIES, rows)), totals, end


def check(rows, totals, col):
    got = sum(num(r[col]) for r in rows.values())
    assert got == totals[col], (col, got, totals[col])


def rate_col(col):
    """The rate sits two columns after the total (Total, Victims, Rate); works for negative indexes too."""
    return col + 2


# ---- Table 1.2: national lines, 2022-2024 (2024 = IPC + BNS total) ----
t12 = find(r"IPC/BNS Crimes \(Crime Head-wise\) - 2022-2024", find(r"TABLE 1\.2"))
HEADS = {
    "murder": r"^\s*23\s+Murder\s", "rape": r"^\s*1\s+Rape\s", "theft": r"^\s*41\s+Theft\s",
    "autoTheft": r"^\s*41B\s+Vechicle Theft", "burglary": r"^\s*51\s+Burglary\s",
    "robbery": r"^\s*44\s+Robbery\s", "dacoity": r"^\s*45\s+Dacoity\s", "snatching": r"^\s*42\s+Snatching\s",
}
national = {}
for key, pattern in HEADS.items():
    line = L[find(pattern, t12)]
    toks = line.split()
    v = [x for x in toks[1:] if re.match(r"^[\d.]+$|^-$", x)]  # toks[0] is the serial number
    national[key] = {
        "y2022": None if v[0] == "-" else {"cases": num(v[0]), "rate": num(v[1])},
        "y2023": None if v[2] == "-" else {"cases": num(v[2]), "rate": num(v[3])},
        "y2024": {"cases": num(v[6]), "rate": num(v[7]), "ipc": num(v[4]), "bns": num(v[5])},
    }
    assert national[key]["y2024"]["ipc"] + national[key]["y2024"]["bns"] == national[key]["y2024"]["cases"], key

# ---- Rape by state and city (Table 3A.2(i), 3B.2(i)) ----
r_rows, r_tot, _ = state_block(find("Rape (Sec 64-68,70-71 BNS/Sec.376 IPC)", fixed=True))
check(r_rows, r_tot, 2)
check(r_rows, r_tot, 7)
assert r_tot[2] == national["rape"]["y2024"]["cases"]
p_rows, p_tot, _ = state_block(find("a) POCSO Act Sec. 4 & 6", fixed=True))
check(p_rows, p_tot, 3)
rel_rows, rel_tot, _ = state_block(find("Offenders Relation to Victims of Rape (Section 376 IPC) - 2024", fixed=True))
for c in range(5):
    check(rel_rows, rel_tot, c)

rape_states = []
for name in STATES:
    r, p, rel = r_rows[name], p_rows[name], rel_rows[name]
    rape_states.append({
        "name": name, "rape": num(r[2]), "victims": num(r[3]), "ratePerLakhWomen": num(r[4]),
        "girlsUnder18": num(r[2]) - num(r[7]),
        "childRapePocso": num(p[3]), "childRapePocsoRate": num(p[5]),
        "known": num(rel[0]), "family": num(rel[1]), "friendsOrPartners": num(rel[2]),
        "otherKnown": num(rel[3]), "unknown": num(rel[4]),
    })
for s in rape_states:
    assert s["known"] + s["unknown"] == s["rape"], s["name"]

b32 = find(r"TABLE 3B\.2")
cr, cr_t, _ = city_block(find("Rape (Total a+b)", b32, fixed=True))
check(cr, cr_t, 2)
cp, cp_t, _ = city_block(find("a) POCSO Act Sec. 4 & 6", b32, fixed=True))
check(cp, cp_t, 3)
rape_cities = [{"name": n, "rape": num(cr[n][2]), "ratePerLakhWomen": num(cr[n][4]),
                "childRapePocso": num(cp[n][3]), "childRapePocsoRate": num(cp[n][5])} for n in CITIES]

# ---- National rape rows copied from the printed all-India lines ----
victim_age = {"below6": 15, "age6to12": 52, "age12to16": 252, "age16to18": 473, "child": 792,
              "age18to30": 19489, "age30to45": 8316, "age45to60": 1056, "age60plus": 89,
              "adult": 28950, "victims": 29742}
assert sum(victim_age[k] for k in ("below6", "age6to12", "age12to16", "age16to18")) == victim_age["child"]
assert sum(victim_age[k] for k in ("age18to30", "age30to45", "age45to60", "age60plus")) == victim_age["adult"]
assert victim_age["child"] + victim_age["adult"] == victim_age["victims"]
relation = {"known": rel_tot[0], "family": rel_tot[1], "friendsOrPartners": rel_tot[2], "otherKnown": rel_tot[3],
            "unknown": rel_tot[4], "total": rel_tot[5], "knownShare": rel_tot[6]}
pocso_relation = {"known": 42634, "family": 3658, "otherKnown": 16668, "friendsOrPartners": 22308,
                  "unknown": 1492, "total": 44126, "knownShare": 96.6}
assert pocso_relation["family"] + pocso_relation["otherKnown"] + pocso_relation["friendsOrPartners"] == pocso_relation["known"]
assert pocso_relation["known"] + pocso_relation["unknown"] == pocso_relation["total"]
police = {"pendingFromPriorYear": 9726, "reported": 29536, "reopened": 12, "forInvestigation": 39274,
          "notInvestigated": 1, "transferred": 83, "withdrawn": 1, "nonCognizable": 24, "finalReportFalse": 3776,
          "mistakeOfFactOrLawOrCivil": 714, "trueButInsufficientOrUntraced": 1044, "abated": 16,
          "finalReports": 5574, "chargesheeted": 24614, "disposedByPolice": 30272, "quashed": 96, "stayed": 69,
          "pendingAtYearEnd": 8905, "chargesheetRate": 81.3, "pendencyPercent": 22.7}
assert police["pendingFromPriorYear"] + police["reported"] + police["reopened"] == police["forInvestigation"]
assert police["nonCognizable"] + police["finalReportFalse"] + police["mistakeOfFactOrLawOrCivil"] + police["trueButInsufficientOrUntraced"] + police["abated"] == police["finalReports"]
assert police["forInvestigation"] - police["notInvestigated"] - police["disposedByPolice"] - police["quashed"] == police["pendingAtYearEnd"]
court = {
    "rape": {"pendingFromPriorYear": 182163, "sentForTrial": 24614, "forTrial": 206777, "convicted": 5032,
             "discharged": 1575, "acquitted": 13980, "trialsCompleted": 20587, "pendingAtYearEnd": 185785,
             "convictionRate": 24.4, "pendencyPercent": 89.8},
    "childRapePocso": {"pendingFromPriorYear": 151412, "sentForTrial": 41154, "forTrial": 192566, "convicted": 7916,
                       "discharged": 691, "acquitted": 17742, "trialsCompleted": 26349, "pendingAtYearEnd": 165553,
                       "convictionRate": 30.0, "pendencyPercent": 86.0},
}
for c in court.values():
    assert c["pendingFromPriorYear"] + c["sentForTrial"] == c["forTrial"]
    assert c["convicted"] + c["discharged"] + c["acquitted"] == c["trialsCompleted"]
    assert round(c["convicted"] / c["trialsCompleted"] * 100, 1) == c["convictionRate"]
section_wise = {"gangRape": 1537, "gangRapeWomen": 1507, "gangRapeUnder18": 30,
                "custodialTotal": 27 + 15 + 2 + 3 + 8, "custodialByPolice": 27, "total": 29536}
assert section_wise["gangRapeWomen"] + section_wise["gangRapeUnder18"] == section_wise["gangRape"]
rape_national = {"rape": r_tot[2], "rapeVictims": r_tot[3], "rapeRatePerLakhWomen": r_tot[4],
                 "girlVictimsUnder18": victim_age["child"], "girlCasesUnder18": r_tot[2] - r_tot[7],
                 "childRapePocso": p_tot[3], "childRapePocsoVictims": p_tot[4],
                 "crimeAgainstWomen": 441534, "crimeAgainstWomenRate": 64.6}

# ---- Murder by state and city (2A.1, 2B.1) ----
m_rows, m_tot, _ = state_block(find(r"^\s+Murder Cases - 2022-2024"))
for c in (0, 1, 2):
    check(m_rows, m_tot, c)
assert m_tot[2] == national["murder"]["y2024"]["cases"]
cm, cm_t, _ = city_block(find("Murder Cases in Metropolitan Cities - 2022-2024", fixed=True))
for c in (0, 1, 2):
    check(cm, cm_t, c)

# ---- Property by state and city (1A.4, 1B.4). Total column index per block. ----
def prop_blocks(after, block_fn):
    out = {}
    # Theft and robbery are the last group on their pages, so they are read from the row's end;
    # a blank cell earlier on the line (Ahmedabad, extortion) would otherwise shift them.
    for key, anchor, col in (("theft", "Theft (Total a to g)", -3), ("burglary", "Burglary (Total a+b)", 2),
                             ("robbery", "Robbery (Section 309 (4)", -3), ("dacoity", "Dacoity (Total a+b)", 2)):
        rows, tot, _ = block_fn(find(anchor, after, fixed=True))
        check(rows, tot, col)
        out[key] = (rows, col, tot[col])
    return out

sp = prop_blocks(find(r"TABLE 1A\.4"), state_block)
for key in ("theft", "burglary", "robbery", "dacoity"):
    assert sp[key][2] == national[key]["y2024"]["cases"], key
cpb = prop_blocks(find(r"TABLE 1B\.4"), city_block)

states = []
for name in STATES:
    m = m_rows[name]
    row = {"name": name, "populationLakh": num(m[3]),
           "murder": {"y2022": num(m[0]), "y2023": num(m[1]), "y2024": num(m[2]), "rate": num(m[4]),
                      "chargesheetRate": num(m[5]) if len(m) > 5 and m[5] != "-" else None}}
    for key, (rows, col, _) in sp.items():
        row[key] = {"cases": num(rows[name][col]), "rate": num(rows[name][rate_col(col)])}
    states.append(row)
cities = []
for name in CITIES:
    m = cm[name]
    row = {"name": name, "populationLakh2011": num(m[3]),
           "murder": {"y2022": num(m[0]), "y2023": num(m[1]), "y2024": num(m[2]), "rate": num(m[4])}}
    for key, (rows, col, _) in cpb.items():
        row[key] = {"cases": num(rows[name][col]), "rate": num(rows[name][rate_col(col)])}
    cities.append(row)

# ---- Motives (2A.2, all-India rows; column order as in the 2023 volume, checked by the disputes identity) ----
p = find(r"^\s+Motives of Murder - 2024$")
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
assert sum(top) == total == national["murder"]["y2024"]["cases"], (sum(top), total)
motives = [
    {"label": "Disputes", "cases": disputes}, {"label": "Other causes", "cases": other},
    {"label": "Personal vendetta or enmity", "cases": vendetta}, {"label": "Gain", "cases": gain},
    {"label": "Love affairs", "cases": love}, {"label": "Illicit relationship", "cases": illicit},
    {"label": "No clue or motive not known", "cases": blind}, {"label": "Dowry", "cases": dowry},
    {"label": "During dacoity or robbery", "cases": dacoity_robbery}, {"label": "Communal or religious", "cases": communal},
    {"label": "Witchcraft", "cases": witchcraft}, {"label": "Extremism or insurgency", "cases": extremism},
    {"label": "Gang rivalry", "cases": gang}, {"label": "Casteism", "cases": caste},
    {"label": "Class conflict", "cases": klass}, {"label": "Honour killing", "cases": honour},
    {"label": "Psychopath or serial killer", "cases": psycho}, {"label": "Political reasons", "cases": political},
    {"label": "Child or human sacrifice", "cases": sacrifice}, {"label": "Sale of body parts", "cases": body_parts},
]
dispute_breakdown = [
    {"label": "Family", "cases": family}, {"label": "Property or land", "cases": prop_land},
    {"label": "Petty quarrel", "cases": petty}, {"label": "Money", "cases": money},
    {"label": "Road accident", "cases": road}, {"label": "Water", "cases": water},
]

# ---- Victims (2A.3) ----
v = find(r"Victims of Murder \(Gender & Age Group-wise\) - 2024$")
a, e = total_row(v, "TOTAL ALL INDIA")
b, e = total_row(e + 1, "TOTAL ALL INDIA")
c, e = total_row(e + 1, "TOTAL ALL INDIA")
d, e = total_row(e + 1, "TOTAL ALL INDIA")
ages = {"below6": a[3], "age6to12": a[7], "age12to16": a[11], "age16to18": b[3],
        "age18to30": b[11], "age30to45": c[3], "age45to60": c[7], "age60plus": c[11]}
victims = {"male": d[4], "female": d[5], "transgender": d[6], "total": d[7], "child": b[7], "adult": d[3]}
assert ages["below6"] + ages["age6to12"] + ages["age12to16"] + ages["age16to18"] == victims["child"]
assert ages["age18to30"] + ages["age30to45"] + ages["age45to60"] + ages["age60plus"] == victims["adult"]
assert victims["male"] + victims["female"] + victims["transgender"] == victims["total"] == victims["child"] + victims["adult"]

# ---- Snapshot section (Volume I front matter): disposal lines and property value, parsed from the printed text ----
def snap_line(label):
    i = find(r"^\s*\d\.\s+" + label + r"\s+[\d,]+")
    v = [x.replace(",", "") for x in L[i].split() if re.match(r"^[\d,.]+$", x)][1:]
    return {"forInvestigation": num(v[0]), "chargesheeted": num(v[1]), "chargesheetRate": num(v[2]),
            "forTrial": num(v[3]), "convicted": num(v[4]), "convictionRate": num(v[5])}
disposal = {"murder": snap_line("Murder"), "rape": snap_line("Rape")}
assert disposal["rape"]["forInvestigation"] == police["forInvestigation"] and disposal["rape"]["convicted"] == court["rape"]["convicted"]
pv = L[find(r"Properties worth Rs\.[\d.]+ Crores were stolen")] + " " + L[find(r"Properties worth Rs\.[\d.]+ Crores were stolen") + 1]
m_pv = re.search(r"Rs\.([\d.]+) Crores were stolen and Properties worth Rs\. ([\d.]+)\s*Crore were recovered accounting for ([\d.]+)% recovery", pv)
assert m_pv, pv
property_value = {"stolenCrore": float(m_pv.group(1)), "recoveredCrore": float(m_pv.group(2)), "recoveryPercent": float(m_pv.group(3))}
assert round(property_value["recoveredCrore"] / property_value["stolenCrore"] * 100, 1) == property_value["recoveryPercent"]

rape = {"year": 2024, "national": rape_national, "victimAge": victim_age, "relation": relation,
        "pocsoRelation": pocso_relation, "police": police, "court": court, "sectionWise": section_wise,
        "states": rape_states, "cities": rape_cities}
more = {"year": 2024, "disposal": disposal, "propertyValue": property_value, "national": national, "states": states, "cities": cities, "murderMotives": motives,
        "disputeBreakdown": dispute_breakdown, "murderVictims": {**victims, "ages": ages}}
sys.stdout.write(
    "// Extracted by script from National Crime Records Bureau, Crime in India 2024, Volume I (PDF).\n"
    "// Regenerate with scripts/crime/extract_cii2024.py. Do not type over these figures. Accessed 2026-09-27.\n"
    "// https://www.ncrb.gov.in/uploads/files/1CrimeinIndia2024-VolumeI.pdf\n"
    "export const ncrb2024Rape = " + json.dumps(rape, indent=2) + " as const;\n\n"
    "export const ncrb2024More = " + json.dumps(more, indent=2) + " as const;\n"
)
