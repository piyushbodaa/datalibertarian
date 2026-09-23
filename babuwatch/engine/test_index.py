#!/usr/bin/env python3
"""Focused tests for the slim tracker index (stdlib unittest).

Run:  python3 -m unittest discover -s babuwatch/engine -p 'test_*.py'
(from the repo root; `npm run test:babuwatch`). The dist-consistency
checks build the babuwatch watch into a temp dir first (a few
seconds), or use $WATCH_DIST when it points at an existing build.
Covers: index shape (short keys only, no name-bearing structures),
summary truncation, officer-gate-safe search text, filter/facet
equivalence between full records and index records, tracker.js data
source, and per-record file consistency.
"""
import json
import os
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build as B

ALLOWED = {"id", "mid", "ti", "ct", "su", "st", "di", "co", "cn", "ca",
           "sc", "ou", "jd", "jy", "v", "tr", "pp", "na", "as", "ch", "lc",
           "re", "ns", "ot", "lv", "ap", "tier",
           "w", "sv"}   # umbrella only: home-watch prefix, service
REQUIRED = {"id", "mid", "ti", "su", "ca", "jd", "na"}
REQUIRED_T2 = REQUIRED | {"lv"}
# Index fetch budget: each index file stays small (absolute cap) and
# dense (per-record cap), so the default tracker view loads fast.
# index.json carries both tiers (the Court-level facet defaults to All);
# index-trial.json remains as the trial-court fallback slice.
INDEX_FILE_CAP = 2048 * 1024  # 2MB: 2,040 combined rows ≈1.54MB
# (was 1.5MB at 1,534 rows, 1MB at 1,060 rows; per-row cap below is
# the binding density guard — recalibrated for day-N volume 2026-09-19)
INDEX_ROW_CAP = 900
FILTERS = ["", "A", "B", "actions", "V2", "V3", "pending", "concluded",
           "checked", "never_checked", "stale_checks", "retracted"]


def load_input():
    with open(os.path.join(B.ROOT, "data", "copwatchindia", "cases.json"),
              encoding="utf-8") as f:
        return json.load(f)


def idx_matches(r, f):
    """Mirror of tracker.js matchesFilter over an index record."""
    v = r.get("v", "V2")
    tr = r.get("tr", "A")
    na = r.get("na", 0)
    st = r.get("as", ["concluded"] if na > 0 else [])
    re_ = r.get("re", False)
    if f == "retracted":
        return re_
    if re_:
        return False
    if not f:
        return True
    if f == "A":
        return tr == "A"
    if f == "B":
        return tr == "B"
    if f == "actions":
        return na > 0
    if f == "V2":
        return v == "V2"
    if f == "V3":
        return v == "V3"
    if f == "pending":
        return "pending" in st or "initiated" in st
    if f == "concluded":
        return "concluded" in st
    if f == "checked":
        return bool(r.get("ch", False))
    if f == "never_checked":
        return not r.get("ch", False)
    if f == "stale_checks":
        return B.is_stale({"last_checked": r.get("lc")})
    return True


class TestIndexShape(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.cases = load_input()
        if len(cls.cases) > 60:
            cls.cases = cls.cases[:60]
        cls.idx = [B.build_index_record(c) for c in cls.cases]

    def test_short_keys_only(self):
        for r in self.idx:
            self.assertTrue(REQUIRED <= set(r), r.get("id"))
            self.assertFalse(set(r) - ALLOWED, r.get("id"))
            for banned in ("officers", "victims", "verification_status",
                           "institutional_response", "followup_history",
                           "allegations", "retracted", "primary_source_url",
                           "secondary_sources", "victims_redacted"):
                self.assertNotIn(banned, r)

    def test_no_nonpublic_keys(self):
        blob = json.dumps(self.idx)
        self.assertNotIn("_nonpublic", blob)

    def test_summary_truncation(self):
        for c, r in zip(self.cases, self.idx):
            full = c.get("summary") or ""
            self.assertLessEqual(len(r["su"]), B.INDEX_SUMMARY_CHARS + 1)
            if len(full) > B.INDEX_SUMMARY_CHARS:
                self.assertTrue(r["su"].endswith("\u2026"))
                self.assertTrue(full.startswith(r["su"][:-1].rstrip()[:50]))
            else:
                self.assertEqual(r["su"], full)

    def test_officers_text_is_display_safe(self):
        for c, r in zip(self.cases, self.idx):
            self.assertEqual(r.get("ot", ""), B.officers_search_text(c))
            for o in (c.get("officers") or []):
                if isinstance(o, dict) and \
                        o.get("publish_grade") != "named_safe":
                    nm = o.get("name") or ""
                    # Raw unnamed names never appear verbatim unless the
                    # display label itself carries them (descriptive rows).
                    if nm and nm != o.get("display"):
                        self.assertNotIn(nm, r.get("ot", ""))

    def test_filter_counts_agree(self):
        for f in FILTERS:
            want = sum(1 for c in self.cases if B.matches_filter(c, f))
            got = sum(1 for r in self.idx if idx_matches(r, f))
            self.assertEqual(got, want, "filter=%r" % f)

    def test_facet_values_agree(self):
        for c, r in zip(self.cases, self.idx):
            self.assertEqual(r.get("st", ""), c.get("state") or "")
            self.assertEqual(r.get("di", ""), c.get("district") or "")
            self.assertEqual(r.get("co", ""), c.get("court") or "")
            self.assertEqual(r.get("ou", ""), c.get("outcome_type") or "")
            jy = r.get("jy", r["jd"][:4] if r["jd"] else "")
            self.assertEqual(str(jy), str(c.get("judgment_year") or ""))
            self.assertEqual(r["ca"], B.site_category(c))
            sub = ((c.get("subcategory_display") or "").strip()
                   or B.pretty_label(c.get("subcategory")).lower())
            self.assertEqual(r.get("sc", ""), sub)

    def test_no_trial_level_on_tier1(self):
        for r in self.idx:
            self.assertNotEqual(r.get("lv"), "trial", r.get("id"))


class TestT2Dates(unittest.TestCase):
    def test_iso_precision(self):
        self.assertEqual(B.t2_iso_date("28 August 2026"), "2026-08-28")
        self.assertEqual(B.t2_iso_date("2026-08-28"), "2026-08-28")
        self.assertEqual(B.t2_iso_date("March 2013"), "2013-03")
        self.assertEqual(B.t2_iso_date("2019-08 (decided during August "
                                       "2019)"), "2019-08")
        self.assertEqual(B.t2_iso_date("2003"), "2003")
        self.assertEqual(B.t2_iso_date("1987 (exact date unstated)"),
                         "1987")
        self.assertEqual(B.t2_iso_date(None), "")
        self.assertEqual(B.t2_iso_date("Date not stated"), "")

    def test_year_fallback(self):
        self.assertEqual(B.t2_year({"conviction_date": "28 August 2026"}),
                         2026)
        self.assertIsNone(B.t2_year({"conviction_date": None}))

    def test_tracker_loads_index(self):
        self.assertIn('__BASE__/data/index.json', B.TRACKER_JS)
        self.assertNotIn('DATA_URL = "__BASE__/data/cases.json"',
                         B.TRACKER_JS)
        self.assertEqual(B.BASE, "/babuwatch")

    def test_tracker_loads_trial_index_lazily(self):
        self.assertIn('__BASE__/data/index-trial.json', B.TRACKER_JS)
        self.assertIn("var PAGE = 100", B.TRACKER_JS)
        self.assertIn("tracker-more", B.TRACKER_JS)
        self.assertIn("c._hay", B.TRACKER_JS)
        self.assertIn("setTimeout(function () { apply(true); }, 180)",
                      B.TRACKER_JS)


class TestDistConsistency(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dist = os.environ.get("WATCH_DIST")
        if not cls.dist:
            cls._tmp = tempfile.TemporaryDirectory()
            cls.dist = cls._tmp.name
            subprocess.run([sys.executable, "-B",
                            os.path.join(HERE, "build.py"),
                            "--watch", "babuwatch", "--out", cls.dist],
                           check=True, stdout=subprocess.DEVNULL)
        cls.has_dist = os.path.isdir(os.path.join(cls.dist, "data", "case"))

    def test_index_under_target(self):
        if not self.has_dist:
            self.skipTest("dist/ not built")
        for name in ("index.json", "index-trial.json"):
            p = os.path.join(self.dist, "data", name)
            with open(p, encoding="utf-8") as f:
                rows = json.load(f)
            self.assertLess(os.path.getsize(p), INDEX_FILE_CAP, name)
            self.assertLess(os.path.getsize(p) / max(1, len(rows)),
                            INDEX_ROW_CAP, name)

    def test_index_combined_tiers(self):
        if not self.has_dist:
            self.skipTest("dist/ not built")
        with open(os.path.join(self.dist, "data", "index.json"),
                  encoding="utf-8") as f:
            idx = json.load(f)
        with open(os.path.join(self.dist, "data", "cases.json"),
                  encoding="utf-8") as f:
            n1 = len(json.load(f))
        with open(os.path.join(self.dist, "data", "tier2.json"),
                  encoding="utf-8") as f:
            n2 = len(json.load(f))
        self.assertEqual(len(idx), n1 + n2)
        hc = [r for r in idx if r.get("tier") == "hc_sc"]
        tr = [r for r in idx if r.get("tier") == "trial"]
        self.assertEqual(len(hc), n1)
        self.assertEqual(len(tr), n2)
        for r in idx:
            self.assertIn(r.get("tier"), ("hc_sc", "trial"), r.get("id"))
            self.assertFalse(set(r) - ALLOWED, r.get("id"))
        for r in tr:
            self.assertEqual(r.get("lv"), "trial", r.get("id"))
            self.assertTrue(r.get("ou"), r.get("id"))

    def test_per_record_matches_cases(self):
        if not self.has_dist:
            self.skipTest("dist/ not built")
        with open(os.path.join(self.dist, "data", "cases.json"),
                  encoding="utf-8") as f:
            cases = json.load(f)
        want = len([c for c in load_input()
                    if c.get("record_flag") != "review_remove"])
        self.assertEqual(len(cases), want)
        for c in cases[:40] + cases[-5:]:
            rid = c.get("record_id") or c["merged_id"]
            p = os.path.join(self.dist, "data", "case", "%s.json" % rid)
            with open(p, encoding="utf-8") as f:
                self.assertEqual(json.load(f), c, rid)

    def test_trial_index_shape(self):
        if not self.has_dist:
            self.skipTest("dist/ not built")
        with open(os.path.join(self.dist, "data", "index-trial.json"),
                  encoding="utf-8") as f:
            idx = json.load(f)
        with open(os.path.join(self.dist, "data", "tier2.json"),
                  encoding="utf-8") as f:
            t2 = json.load(f)
        self.assertEqual(len(idx), len(t2))
        self.assertGreater(len(idx), 0)
        for r in idx:
            self.assertTrue(REQUIRED_T2 <= set(r), r.get("id"))
            self.assertFalse(set(r) - ALLOWED, r.get("id"))
            self.assertEqual(r.get("lv"), "trial", r.get("id"))
            for banned in ("officers", "victims", "verification_status",
                           "name", "name_public"):
                self.assertNotIn(banned, r)

    def test_trial_per_record_matches(self):
        if not self.has_dist:
            self.skipTest("dist/ not built")
        with open(os.path.join(self.dist, "data", "tier2.json"),
                  encoding="utf-8") as f:
            t2 = json.load(f)
        for c in t2[:40] + t2[-5:]:
            cid = B.t2_id(c)
            p = os.path.join(self.dist, "data", "case", "%s.json" % cid)
            with open(p, encoding="utf-8") as f:
                self.assertEqual(json.load(f), c, cid)

    def test_trial_officers_display_only(self):
        if not self.has_dist:
            self.skipTest("dist/ not built")
        with open(os.path.join(self.dist, "data", "tier2.json"),
                  encoding="utf-8") as f:
            t2 = json.load(f)
        for c in t2:
            for o in (c.get("officers") or []):
                self.assertIn("display", o, B.t2_id(c))
                if o.get("publish_grade") != "named_safe":
                    self.assertIsNone(o.get("name"), B.t2_id(c))
                    self.assertIsNone(o.get("name_public"), B.t2_id(c))

    def test_per_state_singular(self):
        if not self.has_dist:
            self.skipTest("dist/ not built")
        d = os.path.join(self.dist, "data", "state")
        self.assertEqual(len(os.listdir(d)), 36)

    def test_tracker_level_facet(self):
        if not self.has_dist:
            self.skipTest("dist/ not built")
        with open(os.path.join(self.dist, "tracker", "index.html"),
                  encoding="utf-8") as f:
            html = f.read()
        self.assertIn('id="x-level"', html)
        self.assertIn('value="trial"', html)
        self.assertIn('value="all"', html)
        self.assertIn('placeholder="Search cases (live)"', html)
        self.assertIn(">Search</button>", html)

    def test_patterns_expandable_and_context(self):
        if not self.has_dist:
            self.skipTest("dist/ not built")
        with open(os.path.join(self.dist, "patterns", "index.html"),
                  encoding="utf-8") as f:
            html = f.read()
        self.assertIn("bar-details", html)
        self.assertIn("subcategory=", html)
        self.assertIn("level=trial", html)
        if B.P.get("context_charts"):
            # Context charts need the complaints-authority dataset (the
            # police register's context.json); only watches with that data
            # render the section.
            self.assertIn("Complaints vs convictions", html)
            self.assertIn("ctx-table", html)

    def test_trialcourt_pages(self):
        # Owner decision 2026-09-23: the Trial Courts *section* (index +
        # per-state listings) is gone from the site; the trial-court RECORDS
        # stay published at /trial-court/<id>.
        if not self.has_dist:
            self.skipTest("dist/ not built")
        self.assertFalse(os.path.exists(
            os.path.join(self.dist, "trial-court", "index.html")))
        with open(os.path.join(self.dist, "data", "tier2.json"),
                  encoding="utf-8") as f:
            t2 = json.load(f)
        cid = B.t2_id(t2[0])
        with open(os.path.join(self.dist, "trial-court", cid, "index.html"),
                  encoding="utf-8") as f:
            rec = f.read()
        self.assertIn("Trial-court conviction", rec)
        self.assertIn("Appeal status", rec)
        self.assertIn("Verification", rec)


if __name__ == "__main__":
    unittest.main(verbosity=1)
