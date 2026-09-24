"""Number-plate style case numbers, e.g. "KL 05 CW 0001".

  KL    state code, as on Indian vehicle registration plates
  05    the RTO code of the record's district (Kottayam = KL-05); 00 if the district is unknown
  CW    series: CW Copwatch (police), BW Babuwatch civil servants, VC Victimless Crimes,
        CL Civil Liberties, EF Economic Freedom, PS PSUs
  0001  serial within that state-district-series, in the order records were numbered

District codes come from rto-codes.json (parsed from Wikipedia's "List of Regional Transport Office
districts in India", CC BY-SA). Numbers are assigned once and stored in plates.json, so a record keeps
its number for ever; new records get the next free serial. Andhra Pradesh has issued one statewide code
(AP-39) since 2019, so its records carry AP 39.
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
RTO = json.load(open(os.path.join(HERE, "rto-codes.json"), encoding="utf-8"))
PLATES_FILE = os.path.join(HERE, "plates.json")

STATE_CODE = {
    "Andhra Pradesh": "AP", "Arunachal Pradesh": "AR", "Assam": "AS", "Bihar": "BR", "Chhattisgarh": "CG",
    "Chandigarh": "CH", "Dadra and Nagar Haveli and Daman and Diu": "DD", "Delhi": "DL", "Goa": "GA",
    "Gujarat": "GJ", "Himachal Pradesh": "HP", "Haryana": "HR", "Jharkhand": "JH", "Jammu and Kashmir": "JK",
    "Karnataka": "KA", "Kerala": "KL", "Ladakh": "LA", "Lakshadweep": "LD", "Maharashtra": "MH",
    "Meghalaya": "ML", "Manipur": "MN", "Madhya Pradesh": "MP", "Mizoram": "MZ", "Nagaland": "NL",
    "Odisha": "OD", "Punjab": "PB", "Puducherry": "PY", "Rajasthan": "RJ", "Sikkim": "SK", "Telangana": "TG",
    "Tamil Nadu": "TN", "Tripura": "TR", "Uttarakhand": "UK", "Uttar Pradesh": "UP", "West Bengal": "WB",
    "Andaman and Nicobar Islands": "AN",
}
ALIASES = {
    "bangalore": "bengaluru urban", "bengaluru": "bengaluru urban", "mumbai": "mumbai central",
    "bombay": "mumbai central", "calcutta": "kolkata", "madras": "chennai", "gurgaon": "gurugram",
    "trivandrum": "thiruvananthapuram", "cochin": "ernakulam", "kochi": "ernakulam", "vizag": "visakhapatnam",
    "allahabad": "prayagraj", "port blair": "port blair", "south andaman": "port blair", "new delhi": "new delhi",
    "belgaum": "belagavi", "bellary": "ballari", "kanyakumari": "nagercoil", "tiruchirappalli": "tiruchirapalli",
    "trichy": "tiruchirapalli", "sivagangai": "sivaganga", "kancheepuram": "kanchipuram", "tiruppur": "tirupur",
    "khordha": "khurda", "ahilyanagar": "ahmednagar", "kachchh": "kutch", "sahibzada ajit singh nagar": "mohali",
    "sas nagar": "mohali", "sepahijala": "bishramganj", "gautam buddh nagar": "noida", "gautam buddha nagar": "noida",
    "ysr kadapa": "kadapa", "spsr nellore": "nellore", "ntr": "vijayawada", "prayagraj": "prayagraj",
    "ferozepur": "firozpur", "viluppuram": "villupuram", "thiruvarur": "tiruvarur", "narmadapuram": "hoshangabad",
    "pudukkottai": "pudukottai", "kendujhar": "keonjhar", "thiruvallur": "tiruvallur", "gulbarga": "kalaburagi",
    "shaheed bhagat singh nagar": "nawanshahr", "sakti": "sakti",
}
MANUAL = {"AN": {"port blair": "AN-01"}}


def _norm(s):
    s = (s or "").lower()
    s = re.sub(r"\(.*?\)", " ", s)
    s = re.sub(r"\b(district|dist\.?|city|urban|rural|commissionerate|police)\b", " ", s)
    return re.sub(r"[^a-z ]+", " ", s).split()


def district_code(state, district):
    """RTO district code like 'KL-05' for a record's state and district, or 'XX-00' if unknown."""
    sc = STATE_CODE.get(state)
    if not sc:
        return None
    if sc == "AP":
        return "AP-39"
    offices = dict(RTO.get(sc, {}).get("offices", {}))
    offices.update(MANUAL.get(sc, {}))
    if not district:
        return sc + "-00"
    words = _norm(district)
    cands = [" ".join(words)] + words
    for c in list(cands):
        if c in ALIASES:
            cands.insert(0, ALIASES[c])
    for c in cands:
        if c and c in offices:
            return offices[c]
    for c in cands:
        if len(c) >= 4:
            hits = sorted(v for k, v in offices.items() if k.startswith(c) or k.split()[0] == c)
            if hits:
                return hits[0]
    return sc + "-00"


SERIES = {"police": "CW", "civil": "BW", "victimlesscrimes": "VC", "civilliberties": "CL",
          "economicfreedom": "EF", "psu": "PS"}


def load():
    return json.load(open(PLATES_FILE)) if os.path.exists(PLATES_FILE) else {}


def assign(items, save=True):
    """items: iterable of (record_id, series_key, state, district) in a stable order.
    Returns {record_id: 'KL 05 CW 0001'}; existing numbers are never changed."""
    plates = load()
    used = {}
    for p in plates.values():
        head, serial = p.rsplit(" ", 1)
        used[head] = max(used.get(head, 0), int(serial))
    for rid, series, state, district in items:
        if rid in plates:
            continue
        code = district_code(state, district)
        if not code:
            continue
        sc, dc = code.split("-")
        head = "%s %s %s" % (sc, dc, SERIES[series])
        used[head] = used.get(head, 0) + 1
        plates[rid] = "%s %04d" % (head, used[head])
    if save:
        json.dump(plates, open(PLATES_FILE, "w"), indent=0, sort_keys=True)
    return plates


def assign_all(repo=os.path.dirname(HERE)):
    """Give every Babuwatch and register record a plate (existing numbers never change).
    New numbers go out oldest first within each run, so serials roughly follow time."""
    items = []
    bw = os.path.join(repo, "babuwatch", "data")
    for f, key, series in (("copwatchindia/cases.json", "record_id", "police"),
                           ("copwatchindia/tier2.json", "case_id", "police"),
                           ("civil/tier2.json", "case_id", "civil")):
        p = os.path.join(bw, f)
        if not os.path.exists(p):
            continue
        for r in json.load(open(p, encoding="utf-8")):
            rid = r.get(key) or r.get("merged_id")
            if rid:
                date = r.get("judgment_date") or r.get("conviction_date") or ""
                items.append((str(date), rid, series, r.get("state"), r.get("district")))
    for reg in ("victimlesscrimes", "civilliberties", "economicfreedom", "psu"):
        p = os.path.join(HERE, "data", reg + ".json")
        for r in json.load(open(p, encoding="utf-8"))["records"]:
            items.append((r.get("date") or "", r["id"], reg, r.get("state"), r.get("district")))
    items.sort(key=lambda x: (x[0], x[1]))
    return assign([(rid, series, st, di) for _, rid, series, st, di in items])


if __name__ == "__main__":
    pl = assign_all()
    print("plates: %d records numbered" % len(pl))
