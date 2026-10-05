"""Tests for engine/sections.py and its datasets (commissions, cctv, charged).

Run: npm run test:babuwatch   (builds the babuwatch watch into a temp dir once)
"""
import json
import os
import re
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data", "copwatchindia")
sys.path.insert(0, HERE)
from sections import _station_name, _district_key  # noqa: E402


def load(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as f:
        return json.load(f)


class DataTests(unittest.TestCase):
    def test_commissions_shape(self):
        comm = load("commissions.json")
        ids = [r["id"] for r in comm]
        self.assertEqual(len(ids), len(set(ids)))
        for r in comm:
            self.assertIn(r["body"], ("nhrc", "dpca"))
            self.assertIn(r["status"], ("pending", "challenged", "refused", "recommended", "approved", "sent"))
            self.assertTrue(r["sources"] and all(u.startswith("https://") for u in r["sources"]))
            self.assertTrue(r["state"])
            if r["body"] == "nhrc":
                self.assertRegex(r["case_no"], r"^\d+/\d+/\d+/[\d-]+(-[A-Z]{2,4})?$")
                self.assertGreater(r["relief_inr"], 0)

    def test_no_personal_name_fields(self):
        for name in ("commissions.json", "cctv.json", "charged.json"):
            for r in load(name):
                for k in r:
                    self.assertNotIn(k, ("name", "victim", "victims", "officer_name", "complainant"), name)

    def test_charged_are_allegations(self):
        for r in load("charged.json"):
            self.assertEqual(r["status"], "charged")
            self.assertIn("not a conviction", r["summary"])
            self.assertNotRegex(r["summary"], r"\bTr\.|\bTmt\.")   # DVAC honorifics precede names

    def test_cctv_quotes_attributed(self):
        for r in load("cctv.json"):
            self.assertIn(r["speaker"], ("court", "official report", "police affidavit"))
            self.assertTrue(r["url"].startswith("https://indiankanoon.org/doc/"))
            self.assertGreater(len(r["quote"]), 30)


class ParserTests(unittest.TestCase):
    def test_station_name(self):
        self.assertEqual(_station_name("P.S. George Town, District Prayagraj"), "George Town")
        self.assertEqual(_station_name("E-2 Royapettah Police Station"), "Royapettah")
        self.assertEqual(_station_name("PS New Usmanpur"), "New Usmanpur")
        self.assertIsNone(_station_name("Court of the Additional Sessions Judge"))
        self.assertIsNone(_station_name("Delhi Police"))
        self.assertIsNone(_station_name("Gumla Police Station", "Gumla"))

    def test_district_key(self):
        self.assertEqual(_district_key("Deoria District"), "Deoria")
        self.assertIsNone(_district_key("Unknown (tried at Chandigarh)"))
        self.assertIsNone(_district_key("..."))


class BuiltPagesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.out = tempfile.mkdtemp(prefix="bw-sections-")
        subprocess.run([sys.executable, "-B", os.path.join(HERE, "build.py"), "--watch", "babuwatch",
                        "--out", cls.out], check=True, stdout=subprocess.DEVNULL)

    def read(self, rel):
        with open(os.path.join(self.out, rel), encoding="utf-8") as f:
            return f.read()

    def test_section_pages_exist(self):
        for rel in ("places/index.html", "commissions/index.html", "follow-up/index.html",
                    "compliance/index.html", "charged/index.html", "places/uttar-pradesh/deoria/index.html",
                    "station/uttar-pradesh/gauri-bazar/index.html"):
            self.assertTrue(os.path.exists(os.path.join(self.out, rel)), rel)

    def test_charged_is_noindex_and_not_in_sitemap(self):
        html = self.read("charged/index.html")
        self.assertIn('content="noindex, follow"', html)
        self.assertNotIn('content="index, follow"', html)
        self.assertNotIn("/charged<", self.read("sitemap.xml"))

    def test_commission_record_page(self):
        comm = load("commissions.json")
        r = next(x for x in comm if x["body"] == "nhrc")
        html = self.read("commissions/%s/index.html" % r["id"])
        self.assertIn(r["case_no"], html)
        self.assertIn("is not a court judgment", self.read("commissions/index.html"))

    def test_rti_template_on_follow_up(self):
        html = self.read("follow-up/index.html")
        self.assertIn("Right to Information Act, 2005", html)
        self.assertIn('id="rti"', html)


if __name__ == "__main__":
    unittest.main()
