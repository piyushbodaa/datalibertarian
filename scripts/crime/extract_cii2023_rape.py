"""Regenerate src/data/crime/ncrb2023Rape.ts from NCRB Crime in India 2023, Volume I.

    curl -sSLo cii2023.pdf https://www.ncrb.gov.in/uploads/files/1CrimeinIndia2023PartI.pdf
    pdftotext -layout cii2023.pdf c23.txt
    python3 scripts/crime/extract_cii2023_rape.py c23.txt > src/data/crime/ncrb2023Rape.ts

Line ranges are for that exact PDF (pdftotext 24.x). Every block is checked against the
Bureau's printed all-India totals; a moved line fails an assert rather than a silent number.
National rows (Tables 1.2, 3A.3-3A.7 totals) are copied from the printed totals.
"""
import json
import re
import sys

L = open(sys.argv[1]).read().split('\n')
def block(start, end):
    rows = {}
    pend = None
    for line in L[start-1:end]:
        m = re.match(r'\s*(\d+)\s+([A-Za-z&. ]+?)\s{2,}([\d.\s]+)$', line)
        if m:
            name = m.group(2).strip()
            nums = m.group(3).split()
            if name and name != 'D&N Haveli and': rows[name] = nums
        m2 = re.match(r'\s*31\s+([\d.\s]+)$', line)
        if m2: rows['D&N Haveli and Daman & Diu'] = m2.group(1).split()
    return rows
rape = block(15760, 15806)
pocso = block(16200, 16246)
rel = block(16460, 16510)
out = []
for name, n in rape.items():
    if name.startswith('TOTAL'): continue
    p = pocso[name]; r = rel[name]
    out.append(dict(name=name, rape=int(n[3]), victims=int(n[4]), ratePerLakhWomen=float(n[5]), girlsUnder18=int(n[9]),
        childRapePocso=int(p[3]), childRapePocsoRate=float(p[5]),
        known=int(r[0]), family=int(r[1]), friendsOrPartners=int(r[2]), otherKnown=int(r[3]), unknown=int(r[4])))
assert sum(o['rape'] for o in out)==29670, sum(o['rape'] for o in out)
assert sum(o['childRapePocso'] for o in out)==40046
assert sum(o['known'] for o in out)==28915 and sum(o['unknown'] for o in out)==755
for o in out: assert o['known']+o['unknown']==o['rape'], o
CITIES = ["Ahmedabad","Bengaluru","Chennai","Coimbatore","Delhi City","Ghaziabad","Hyderabad","Indore","Jaipur","Kanpur","Kochi","Kolkata","Kozhikode","Lucknow","Mumbai","Nagpur","Patna","Pune","Surat"]
def cityrows(a,b):
    rows=[]
    for line in L[a-1:b]:
        m=re.match(r'^\s*(\d{1,2})\s+(?:Delhi City\s+)?([\d.\s]+)$', line)
        if m: rows.append(m.group(2).split())
    assert len(rows)==19, len(rows)
    return rows
cr = cityrows(19325,19385); cp = cityrows(19868,19930)
cities=[dict(name=n, rape=int(a[3]), ratePerLakhWomen=float(a[5]), childRapePocso=int(p[3]), childRapePocsoRate=float(p[5])) for n,a,p in zip(CITIES,cr,cp)]
assert sum(c['rape'] for c in cities)==3606 and sum(c['childRapePocso'] for c in cities)==4321
states=out
data = {
 "year": 2023,
 "national": {
   "rape": 29670, "rapeVictims": 29909, "rapeRatePerLakhWomen": 4.4,
   "womenVictims18plus": 29057, "girlVictimsUnder18": 852,
   "attemptRape": 2796,
   "childRapePocso": 40046, "childRapePocsoVictims": 40423,
   "crimeAgainstWomen": 448211, "crimeAgainstWomenRate": 66.2,
 },
 "series": [
   {"year": 2021, "rape": 31677, "rate": 4.8},
   {"year": 2022, "rape": 31516, "rate": 4.7},
   {"year": 2023, "rape": 29670, "rate": 4.4},
 ],
 "victimAge": {"below6":18,"age6to12":87,"age12to16":284,"age16to18":463,"child":852,"age18to30":19751,"age30to45":8275,"age45to60":961,"age60plus":70,"adult":29057,"victims":29909},
 "relation": {"known":28915,"family":1750,"friendsOrPartners":14633,"otherKnown":12532,"unknown":755,"total":29670,"knownShare":97.5},
 "pocsoRelation": {"known":39076,"family":3224,"otherKnown":15146,"friendsOrPartners":20706,"unknown":1358,"total":40434,"knownShare":96.6},
 "police": {"pendingFromPriorYear":10703,"reported":29670,"reopened":20,"forInvestigation":40393,
   "transferred":93,"withdrawn":1,"nonCognizable":26,"finalReportFalse":3959,"mistakeOfFactOrLawOrCivil":627,
   "trueButInsufficientOrUntraced":1308,"abated":13,"finalReports":5933,"chargesheeted":24582,
   "disposedByPolice":30608,"quashed":58,"stayed":37,"pendingAtYearEnd":9726,"chargesheetRate":80.3,"pendencyPercent":24.1},
 "court": {
   "rape": {"pendingFromPriorYear":178485,"sentForTrial":24582,"forTrial":203067,"convicted":4464,"discharged":1055,"acquitted":14158,"trialsCompleted":19677,"pendingAtYearEnd":182163,"convictionRate":22.7,"pendencyPercent":89.7},
   "childRapePocso": {"pendingFromPriorYear":139092,"sentForTrial":38019,"forTrial":177111,"convicted":6927,"discharged":687,"acquitted":16883,"trialsCompleted":24497,"pendingAtYearEnd":151116,"convictionRate":28.3,"pendencyPercent":85.3},
 },
 "sectionWise": {"gangRape376D":1753,"custodialTotal":26,"custodialByPolice":3,"total":29670},
 "states": states,
 "cities": cities,
}
# internal checks
v=data["victimAge"]; assert v["below6"]+v["age6to12"]+v["age12to16"]+v["age16to18"]==v["child"]; assert v["age18to30"]+v["age30to45"]+v["age45to60"]+v["age60plus"]==v["adult"]; assert v["child"]+v["adult"]==v["victims"]==29909
r=data["relation"]; assert r["family"]+r["friendsOrPartners"]+r["otherKnown"]==r["known"]; assert r["known"]+r["unknown"]==r["total"]
q=data["pocsoRelation"]; assert q["family"]+q["otherKnown"]+q["friendsOrPartners"]==q["known"]; assert q["known"]+q["unknown"]==q["total"]
p=data["police"]; assert p["pendingFromPriorYear"]+p["reported"]+p["reopened"]==p["forInvestigation"]
assert p["nonCognizable"]+p["finalReportFalse"]+p["mistakeOfFactOrLawOrCivil"]+p["trueButInsufficientOrUntraced"]+p["abated"]==p["finalReports"]
for c in data["court"].values():
    assert c["pendingFromPriorYear"]+c["sentForTrial"]==c["forTrial"]; assert c["convicted"]+c["discharged"]+c["acquitted"]==c["trialsCompleted"]
    assert round(c["convicted"]/c["trialsCompleted"]*100,1)==c["convictionRate"], (c["convicted"]/c["trialsCompleted"]*100)
hdr = """// Extracted by script from National Crime Records Bureau, Crime in India 2023, Volume I (PDF).
// Tables 1.2, 3A.2, 3A.3, 3A.4, 3A.5, 3A.7, 3A.11, 3B.2, 4A.10. Do not type over these figures.
// State and city rows sum to the Bureau's all-India totals (see crime.test.ts). Accessed 2026-09-27.
// https://www.ncrb.gov.in/uploads/files/1CrimeinIndia2023PartI.pdf
"""
sys.stdout.write(hdr+"export const ncrb2023Rape = "+json.dumps(data, indent=2)+" as const;\n")

