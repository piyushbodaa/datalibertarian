#!/usr/bin/env python3
"""Unit tests for gov/data/snapshot.json and gov/build.py."""
import csv
import json
import os
import re
import tempfile
import unittest
from urllib.parse import urlparse

import build as gov_build

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(HERE, "data", "snapshot.json")
GOV_IN_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.gov\.in$")


class GovSnapshotTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(DATA_PATH, encoding="utf-8") as f:
            cls.snap = json.load(f)

    def test_domains_are_valid_unique_gov_in(self):
        records = self.snap["records"]
        self.assertGreater(len(records), 5000)
        seen = set()
        valid_kinds = set(gov_build.KIND_LABELS.keys())
        valid_tiers = set(gov_build.TIER_LABELS.keys())
        valid_states = set(gov_build.ALL_STATES)
        for r in records:
            dom = r["domain"]
            self.assertNotIn(dom, seen, f"Duplicate domain: {dom}")
            seen.add(dom)
            self.assertNotEqual(dom, "gov.in")
            self.assertFalse(dom.startswith("www."), f"Unexpected www. prefix: {dom}")
            self.assertNotIn("translate.goog", dom)
            self.assertRegex(dom, GOV_IN_RE, f"Invalid .gov.in domain: {dom}")
            self.assertIn(r["kind"], valid_kinds)
            self.assertIn(r["tier"], valid_tiers)
            if r.get("state"):
                self.assertIn(r["state"], valid_states)

    def test_meta_and_reconciliation_match_records(self):
        meta = self.snap["meta"]
        records = self.snap["records"]
        rec_info = self.snap["reconciliation"]
        self.assertEqual(meta["total_domains"], len(records))
        self.assertEqual(meta["dns_live_domains"], sum(1 for r in records if r["dns_live"]))
        self.assertEqual(meta["catalogued_domains"], sum(1 for r in records if r["catalogued"]))
        self.assertEqual(meta["uncharted_domains"], sum(1 for r in records if not r["catalogued"]))
        self.assertGreaterEqual(rec_info["ministries_total"], 50)
        self.assertGreater(rec_info["ministries_gov_in"], 25)
        self.assertEqual(len(rec_info["ministries"]), rec_info["ministries_total"])

    def test_build_outputs_all_pages_and_exports(self):
        with tempfile.TemporaryDirectory() as tmp:
            with open(os.path.join(tmp, "snapshot.html"), "w", encoding="utf-8") as f:
                f.write("<html><body><!--@count:gov-->placeholder<!--@/count:gov--></body></html>")
            gov_build.build(tmp)

            expected_html = [
                "gov.html",
                "gov/index.html",
                "gov/ministries.html",
                "gov/ministries/index.html",
                "gov/regulators.html",
                "gov/regulators/index.html",
                "gov/local-and-courts.html",
                "gov/local-and-courts/index.html",
                "gov/uncharted.html",
                "gov/uncharted/index.html",
            ]
            for rel in expected_html:
                p = os.path.join(tmp, rel)
                self.assertTrue(os.path.exists(p), f"Missing built file: {rel}")
                with open(p, encoding="utf-8") as f:
                    txt = f.read()
                self.assertNotIn("<!--@", txt, f"Unreplaced marker in {rel}")
                self.assertIn(".gov.in", txt)

            with open(os.path.join(tmp, "snapshot.html"), encoding="utf-8") as f:
                snap_html = f.read()
            self.assertNotIn("placeholder", snap_html)
            self.assertIn(".gov.in hostnames", snap_html)

            with open(os.path.join(tmp, "gov", "index.html"), encoding="utf-8") as f:
                gov_html = f.read()
            self.assertIn("Compiled directory of Indian .gov.in hostnames.", gov_html)
            self.assertNotIn("Every .gov.in website", gov_html)
            self.assertNotIn("NXDOMAIN", gov_html)
            self.assertNotIn("In GoI Dir", gov_html)

            with open(os.path.join(tmp, "gov", "data", "gov-domains.json"), encoding="utf-8") as f:
                jdata = json.load(f)
            self.assertEqual(len(jdata["rows"]), self.snap["meta"]["total_domains"])
            self.assertEqual(len(jdata["rows"][0]), 17)

            with open(os.path.join(tmp, "gov", "gov-in-websites.csv"), encoding="utf-8", newline="") as f:
                csv_rows = list(csv.reader(f))
            self.assertEqual(len(csv_rows), self.snap["meta"]["total_domains"] + 1)
            self.assertEqual(len(csv_rows[0]), 17)

    def test_audit_provenance_and_dns_consistency(self):
        valid_dns = {"resolved", "resolved_www", "no_record", "lookup_error"}
        valid_prov = {"igod", "official_verified", "passive_only"}
        for r in self.snap["records"]:
            srcs = set(r["sources"])
            if r["in_igod"]:
                self.assertTrue(
                    "igod" in srcs or "igod-tree" in srcs,
                    f"{r['domain']} has in_igod=True without igod/igod-tree source: {r['sources']}",
                )
                self.assertEqual(r["provenance"], "igod")
            else:
                self.assertIn(r["provenance"], {"official_verified", "passive_only"})
            self.assertIn(r["provenance"], valid_prov)
            self.assertIn(r["dns_status"], valid_dns)
            if r["tier"] in {"union", "apex", "missions"}:
                self.assertIsNone(r["state"], f"{r['domain']} ({r['tier']}) has unexpected state {r['state']}")

    def test_audit_shared_portals_omissions_redirects_and_infra(self):
        by_dom = {r["domain"]: r for r in self.snap["records"]}

        shared_portals = [
            "ladakh.gov.in", "jharkhand.gov.in", "py.gov.in", "sikkim.gov.in",
            "mausam.imd.gov.in", "goa.gov.in", "cag.gov.in", "indiapost.gov.in",
            "mca.gov.in", "tn.gov.in", "mp.gov.in", "wb.gov.in", "punjab.gov.in",
            "hp.gov.in",
        ]
        for dom in shared_portals:
            self.assertIn(dom, by_dom)
            rec = by_dom[dom]
            parsed = urlparse(rec["url"])
            self.assertIn(parsed.netloc.lower(), {dom, f"www.{dom}"}, f"Host mismatch on {dom}: {rec['url']}")
            self.assertIn(parsed.path, {"", "/"}, f"Deep-path URL splice on {dom}: {rec['url']}")

        self.assertIsNone(by_dom["cag.gov.in"]["state"])
        self.assertIsNone(by_dom["indiapost.gov.in"]["state"])
        self.assertIsNone(by_dom["mca.gov.in"]["state"])
        self.assertEqual(by_dom["ladakh.gov.in"]["state"], "Ladakh")
        self.assertEqual(by_dom["jharkhand.gov.in"]["state"], "Jharkhand")
        self.assertEqual(by_dom["py.gov.in"]["state"], "Puducherry")
        self.assertEqual(by_dom["sikkim.gov.in"]["state"], "Sikkim")
        self.assertEqual(by_dom["goa.gov.in"]["state"], "Goa")
        self.assertEqual(by_dom["punjab.gov.in"]["state"], "Punjab")
        self.assertEqual(by_dom["hp.gov.in"]["state"], "Himachal Pradesh")

        omissions = [
            "dgll.gov.in", "dmeo.gov.in", "rohtak.gov.in", "charkhidadri.gov.in",
            "goavidhansabha.gov.in", "gobardhan.gov.in", "mahait.maharashtra.gov.in",
            "highereducation.ladakh.gov.in", "services.nagaland.gov.in",
            "tax.berhampur.gov.in", "chhatrapatisambhajinagarzp.maharashtra.gov.in",
        ]
        for dom in omissions:
            self.assertIn(dom, by_dom, f"Confirmed official omission missing: {dom}")

        for redir_src in ["aurangabadzp.gov.in", "dos.gov.in", "seoni.mp.gov.in"]:
            self.assertIn(redir_src, by_dom)
            self.assertTrue(by_dom[redir_src].get("redirect_to"), f"Missing redirect_to for {redir_src}")

        self.assertEqual(by_dom["mail.gov.in"]["role"], "infrastructure")
        self.assertEqual(by_dom["ns1.gst.gov.in"]["role"], "infrastructure")


if __name__ == "__main__":
    unittest.main()
