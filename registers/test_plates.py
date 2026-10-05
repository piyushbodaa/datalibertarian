"""Case numbers (registers/plates.json) must agree with the records they number.

Run: npm run test:registers
"""
import json
import os
import unittest

import plates as P

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)


def records():
    """(record_id, series_key, state, district) for every Babuwatch and register record."""
    out = []
    bw = os.path.join(REPO, "babuwatch", "data")
    for f, key, series in (("copwatchindia/cases.json", "record_id", "police"),
                           ("copwatchindia/tier2.json", "case_id", "police"),
                           ("civil/tier2.json", "case_id", "civil")):
        for r in json.load(open(os.path.join(bw, f), encoding="utf-8")):
            out.append((r.get(key) or r.get("merged_id"), series, r.get("state"), r.get("district")))
    for reg in ("victimlesscrimes", "civilliberties", "economicfreedom", "psu"):
        for r in json.load(open(os.path.join(HERE, "data", reg + ".json"), encoding="utf-8"))["records"]:
            out.append((r["id"], reg, r.get("state"), r.get("district")))
    return out


class PlateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.plates = P.load()
        cls.recs = records()

    def test_every_record_has_a_number(self):
        missing = [rid for rid, *_ in self.recs if rid not in self.plates]
        self.assertEqual(missing, [], "records without a case number; run npm run build:registers")

    def test_number_matches_state_district_and_series(self):
        bad = []
        for rid, series, state, district in self.recs:
            p = self.plates.get(rid)
            if not p:
                continue
            sc, dc, ser, _ = p.split(" ")
            code = P.district_code(state, district)
            if code and (f"{sc}-{dc}" != code or ser != P.SERIES[series]):
                bad.append((rid, p, state, district, code))
        self.assertEqual(bad, [], "case number disagrees with the record (renumber, keep the old one as retired:<id>)")

    def test_numbers_are_unique(self):
        seen = {}
        dup = []
        for k, v in self.plates.items():
            if v in seen:
                dup.append((v, seen[v], k))
            seen[v] = k
        self.assertEqual(dup, [])

    def test_compass_word_does_not_pick_a_district(self):
        self.assertEqual(P.district_code("Meghalaya", "East Khasi Hills"), "ML-05")
        self.assertEqual(P.district_code("Meghalaya", "South West Garo Hills"), "ML-00")
        self.assertEqual(P.district_code("Delhi", "North"), "DL-01")
        self.assertEqual(P.district_code("West Bengal", "North 24 Parganas"), "WB-21")


if __name__ == "__main__":
    unittest.main()
