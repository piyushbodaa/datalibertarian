"""Guard against price/date/unit mistakes and disconnected published evidence."""
import copy
import json
from pathlib import Path
import re
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from collect import extract, price
from verify import ROOT, verify_snapshot

SNAPSHOT = json.loads((ROOT / 'src/data/inflation/private-snapshot.json').read_text())
META = SNAPSHOT['metadata']
RAW = (ROOT / 'public' / META['sourceArchive'].lstrip('/')).read_bytes()

def parse(raw=RAW, retrieved=META['retrievedAt']):
    return extract(raw, retrieved, META['sourceArchive'])

class CollectorTests(unittest.TestCase):
    def test_all_published_prices_reproduce(self):
        self.assertEqual(parse()['rows'], SNAPSHOT['rows'])
        self.assertEqual(len(parse()['rows']), 22)

    def test_wrong_year_comparator_rejected(self):
        with self.assertRaisesRegex(ValueError, 'year comparator'):
            parse(RAW.replace(b'16/11/2025', b'16/10/2025'))

    def test_wrong_month_comparator_year_rejected(self):
        with self.assertRaises(ValueError):
            parse(RAW.replace(b'16/10/2026', b'16/10/2025'))

    def test_future_observation_rejected(self):
        with self.assertRaisesRegex(ValueError, 'later than retrieval'):
            parse(retrieved='2026-11-15T12:00:00+00:00')

    def test_milk_unit_change_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Unit changed'):
            parse(RAW.replace(b'1 Ltr', b'1 Dozen'))

    def test_missing_member_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Expected one row for Rice'):
            parse(RAW.replace(b'>Rice<', b'>Rice missing<'))

    def test_duplicate_member_rejected(self):
        row = next(r for r in re.findall(rb'<tr>.*?</tr>', RAW, re.S) if b'>Rice<' in r)
        with self.assertRaisesRegex(ValueError, 'Expected one row for Rice'):
            parse(RAW.replace(row, row + row))

    def test_zero_and_missing_not_treated_as_price(self):
        for cell in ('--', '-', '', '0', '0.00', '0 (0.00)'):
            with self.subTest(cell=cell):
                self.assertIsNone(price(cell))
        self.assertEqual(price('48.88 (16.24)'), 48.88)
        self.assertEqual(price('40.91 (-7.65)'), 40.91)

    def test_invalid_numeric_cells_rejected(self):
        for cell in ('NaN', 'Infinity', '-1', '₹48.88', '48.88 unknown'):
            with self.subTest(cell=cell), self.assertRaises(ValueError):
                price(cell)

class EvidenceTests(unittest.TestCase):
    def test_current_snapshot_and_both_sources_verify(self):
        self.assertEqual(verify_snapshot(SNAPSHOT), 22)

    def test_changed_price_rejected(self):
        data = copy.deepcopy(SNAPSHOT)
        data['rows'][0]['current'] += 1
        with self.assertRaisesRegex(ValueError, 'differ from archived'):
            verify_snapshot(data)

    def test_changed_snapshot_date_rejected(self):
        data = copy.deepcopy(SNAPSHOT)
        data['metadata']['asOf'] = '2026-11-15'
        with self.assertRaisesRegex(ValueError, 'asOf'):
            verify_snapshot(data)

    def test_each_source_hash_checked(self):
        for key in ('metadata', 'official'):
            data = copy.deepcopy(SNAPSHOT)
            data[key]['sourceSha256'] = '0' * 64
            with self.subTest(source=key), self.assertRaisesRegex(ValueError, 'checksum mismatch'):
                verify_snapshot(data)

    def test_official_values_and_period_checked(self):
        for key, value in [('headlineYoy', 7), ('foodYoy', 9), ('period', '2026-11'), ('headlineIndex', 111), ('foodIndex', 114), ('status', 'final'), ('baseYear', 2012)]:
            data = copy.deepcopy(SNAPSHOT)
            data['official'][key] = value
            with self.subTest(field=key), self.assertRaisesRegex(ValueError, key):
                verify_snapshot(data)

if __name__ == '__main__':
    unittest.main()
