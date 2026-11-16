"""Pinned official CPI pages must reproduce the public all-item comparison."""
import copy
import hashlib
import json
import unittest

from collect_official import ARCHIVE, ROOT, compile_archive, compile_snapshot, validate_snapshot


class OfficialSnapshotTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.raw = ARCHIVE.read_bytes()
        cls.pages = json.loads(cls.raw)
        cls.snapshot = json.loads((ROOT/'src/data/inflation/cpi-official.json').read_text())
        cls.basket = json.loads((ROOT/'src/data/inflation/cpi-basket.json').read_text())

    def test_archive_checksum_and_exact_reproducibility(self):
        self.assertEqual(hashlib.sha256(self.raw).hexdigest(), self.snapshot['metadata']['sourceSha256'])
        self.assertEqual(compile_snapshot(self.raw), self.snapshot)
        self.assertEqual(self.snapshot['metadata']['recordCount'], 4008)
        self.assertEqual(len(self.pages), 41)

    def test_all_items_all_sectors_and_all_aggregation_levels(self):
        validate_snapshot(self.snapshot, self.basket)
        expected = {i['code'] for i in self.basket['items']}
        for sector in ('rural','urban','combined'):
            actual = {r['code'] for r in self.snapshot['rows'] if r['sector'] == sector and r['level'] == 'item'}
            self.assertEqual(actual, expected)
            self.assertEqual(len(actual), 358)

    def test_missing_or_repeated_page_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'page set'):
            compile_archive(self.pages[:-1])
        pages = self.pages.copy()
        pages[-1] = pages[0]
        with self.assertRaisesRegex(ValueError, 'page URL'):
            compile_archive(pages)

    def test_wrong_period_or_duplicate_observation_is_rejected(self):
        pages = copy.deepcopy(self.pages)
        pages[0]['response']['data'][0]['month'] = 'November'
        with self.assertRaisesRegex(ValueError, 'unexpected series'):
            compile_archive(pages)
        pages = copy.deepcopy(self.pages)
        pages[0]['response']['data'][1] = pages[0]['response']['data'][0]
        with self.assertRaisesRegex(ValueError, 'Duplicate'):
            compile_archive(pages)

    def test_changed_headline_beyond_rounding_is_rejected(self):
        snapshot = copy.deepcopy(self.snapshot)
        headline = next(r for r in snapshot['rows'] if r['code'] == 'general' and r['sector'] == 'combined')
        headline['currentIndex'] += 0.1
        with self.assertRaisesRegex(ValueError, 'beyond rounding'):
            validate_snapshot(snapshot, self.basket)


if __name__ == '__main__':
    unittest.main()
