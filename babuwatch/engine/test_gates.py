#!/usr/bin/env python3
"""Focused tests for build.py's naming-gate helpers (stdlib unittest).

Run:  python3 test_gates.py
Covers: candidate generation (runs/singles/variants), placeholder and
descriptive-name exclusion, scrub replacement, record-ID shape, and
the round-6 shared matcher + walk-skip rules. The merged scrub+verify
pass runs inside every build (scrub_dist_final, same matcher as the
standalone assert_no_leaks, which remains for manual verification).
"""
import re
import sys
import unittest

sys.path.insert(0, __file__.rsplit("/", 1)[0])
import build as B


class TestCandidates(unittest.TestCase):
    def test_full_name_and_runs(self):
        lits = B._name_literals("Santosh Kumar")
        self.assertIn("Santosh Kumar", lits)

    def test_all_surname_run_dropped(self):
        # "Kumar Singh" as a pure run of common surnames is dropped;
        # full names containing them are still kept.
        self.assertFalse(B._run_kept(["Kumar", "Singh"]))
        self.assertIn("Bipin Kumar Singh",
                      B._name_literals("Bipin Kumar Singh"))

    def test_initials_only_run_dropped(self):
        self.assertFalse(B._run_kept(["K.", "N."]))
        self.assertFalse(B._run_kept(["Son", "of"]))

    def test_honorific_run_kept(self):
        self.assertTrue(B._run_kept(["Md.", "Jahid"]))
        self.assertTrue(B._run_kept(["K.", "N.", "Mohan"]))

    def test_placeholder_names_yield_nothing(self):
        for nm in ["Unnamed members of the police party",
                   "Not legible in available text (9th accused)",
                   "Officers on duty",
                   "Police Constables, served under the Sub-Inspector",
                   "Jail authorities including Medical Officer",
                   "Station House Officer"]:
            self.assertEqual(B._name_literals(nm), [], nm)
            self.assertEqual(B._name_patterns(nm), [], nm)

    def test_paren_and_alias_variants(self):
        lits = B._name_literals("P. Murugesan (Murugeshan)")
        for want in ["P. Murugesan", "Murugeshan", "P. Murugeshan",
                     "Murugesan"]:
            self.assertIn(want, lits)
        lits = B._name_literals("Maninder Singh @ Dalli")
        self.assertIn("Dalli", lits)
        self.assertIn("Maninder Singh", lits)

    def test_surname_singles_excluded(self):
        lits = B._name_literals("Yogesh Kumar Singh")
        self.assertNotIn("Singh", lits)
        self.assertNotIn("Kumar", lits)
        self.assertIn("Yogesh", lits)

    def test_single_word_name_kept(self):
        self.assertIn("Sodhi", B._name_literals("Sodhi"))
        self.assertIn("Husan", B._name_literals("Husan"))

    def test_descriptive_officer(self):
        o = {"name": "Sub-Inspector, Mangaldoi PS, Darrang",
             "rank": "Sub-Inspector", "unit": "Mangaldoi PS, Darrang"}
        self.assertTrue(B._is_descriptive_officer_name(o))
        o2 = {"name": "Ashish Kumar", "rank": "Constable",
              "unit": "Patliputra PS"}
        self.assertFalse(B._is_descriptive_officer_name(o2))


class TestScrub(unittest.TestCase):
    def test_officer_full_name_replaced(self):
        pats = B._name_patterns("Ashish Kumar")
        out = B.scrub_names("dismissal of constable Ashish Kumar was upheld",
                            pats, "the constable", rank_prefix=True)
        self.assertNotIn("Ashish Kumar", out)
        self.assertIn("the constable", out)

    def test_rank_prefix_collapses(self):
        pats = B._name_patterns("Md. Jalil Ali")
        out = B.scrub_names("party led by SI Md. Jalil Ali apprehended him",
                            pats, lambda hr: "the officer" if hr
                            else "the sub-inspector",
                            rank_prefix=True)
        self.assertNotIn("Jalil", out)
        self.assertIn("led by the officer", out)

    def test_victim_fragment_initialised(self):
        pats = B._name_patterns("Navinchandra Dahyalal Dholakia")
        out = B.scrub_names("theft suspect Navinchandra a man", pats,
                            "N. D. D.")
        self.assertNotIn("Navinchandra", out)

    def test_protected_spans_survive(self):
        pats = B._name_patterns("Ravindra Singh")
        out = B.scrub_names("Inspector Ravindra Singh Gurjar was SHO",
                            pats, "the officer",
                            literals=["Ravindra Singh Gurjar"],
                            rank_prefix=True)
        self.assertIn("Ravindra Singh Gurjar", out)

    def test_sentence_start_capitalised(self):
        pats = B._name_patterns("Ashish Kumar")
        out = B.scrub_names("Ashish Kumar vs State of Bihar", pats,
                            "the constable", rank_prefix=True)
        self.assertTrue(out.startswith("The constable"))


class TestSharedMatcher(unittest.TestCase):
    """Round 6: the final scrub and the leak assertion decide through
    one matcher (_collect_matches) + one applier (_apply_matches)."""

    def test_overlapping_lits_both_found(self):
        # Different-start overlaps must BOTH be found (a consuming
        # scan would miss the second — fail-open).
        ms = B._collect_matches("x aa bb cc y",
                                ["aa bb", "bb cc"], [])
        self.assertIn("aa bb", ms)
        self.assertIn("bb cc", ms)

    def test_longest_wins_overlap(self):
        new, n = B._apply_matches("x aa bb cc y",
                                  {"aa bb": [(2, 7)],
                                   "aa bb cc": [(2, 10)]})
        self.assertEqual((new, n), ("x [name withheld] y", 1))

    def test_holder_and_url_spans_win(self):
        text = ("CBI Special Court judge Avinash Kumar presided, see "
                "https://x.test/yashwant-etc-vs-state for detail")
        new, n = B.redact_text_with_holders(
            text, ["Avinash Kumar", "Yashwant"],
            ["cbi special court judge avinash kumar"])
        self.assertEqual((new, n), (text, 0))

    def test_word_boundary_no_substring_corruption(self):
        new, n = B.redact_text_with_holders(
            "met Raj Kumar and Neeraj Kumar", ["Raj Kumar"], [])
        self.assertEqual(new, "met [name withheld] and Neeraj Kumar")

    def test_step3_skip_rules_cover_only_per_record_files(self):
        # The merged pass skips step-3 files already covered per-record
        # (superset lits); every other rel must fall through to the
        # aggregate/chrome rule. Guards skip-regex overreach.
        import re as _re

        def skipped(rel):
            return bool(
                _re.match(B.REC_INCIDENT_RX, rel)
                or _re.match(B.REC_TRIAL_RX, rel)
                or _re.match(B.REC_CASEJSON_RX, rel))
        for rel in ("incident/CW-2003-0014/index.html",
                    "incident/CWC-0872/index.md",
                    "trial-court/t2-09-004/index.html",
                    "trial-court/t2w2-06-013/index.md",
                    "data/case/CW-2003-0014.json",
                    "data/case/t2-09-004.json",
                    "trial-court/bx-r7-karnataka-lokayukta-07-007/index.html",
                    "data/case/bx-r6-cbi-19-015.json"):
            self.assertTrue(skipped(rel), rel)
        for rel in ("data/cases.json", "data/cases.csv", "llms.txt",
                    "llms-full.txt", "index.html", "tracker/index.html",
                    "state/bihar/index.html", "trial-court/index.html",
                    "trial-court/bihar/index.html",
                    "data/case/index.json", "sitemap.xml", "robots.txt"):
            self.assertFalse(skipped(rel), rel)


class TestRecordIds(unittest.TestCase):
    def test_shape_and_determinism(self):
        cases = [{"merged_id": "CWC-0002", "judgment_year": 2019},
                 {"merged_id": "CWC-0001", "judgment_year": 2019},
                 {"merged_id": "CWC-0003", "judgment_year": 2020}]
        B.assign_record_ids(cases)
        ids = {c["merged_id"]: c["record_id"] for c in cases}
        self.assertEqual(ids["CWC-0001"], "CW-2019-0001")
        self.assertEqual(ids["CWC-0002"], "CW-2019-0002")
        self.assertEqual(ids["CWC-0003"], "CW-2020-0001")
        for rid in ids.values():
            self.assertTrue(re.match(r"^CW-\d{4}-\d{4}$", rid), rid)


if __name__ == "__main__":
    unittest.main(verbosity=1)
