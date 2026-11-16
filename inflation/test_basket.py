"""The full official basket must remain exactly reproducible from its evidence."""
import hashlib
import json
from pathlib import Path
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parent))
from extract_basket import ROOT, ARCHIVE, extract

class FullBasketTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.basket = json.loads((ROOT / 'src/data/inflation/cpi-basket.json').read_text())
        cls.archive = ROOT / 'public' / ARCHIVE.lstrip('/')
        cls.reproduced, cls.strata = extract(cls.archive, cls.basket['metadata']['retrievedAt'])

    def test_archive_checksum_and_sidecar(self):
        digest = hashlib.sha256(self.archive.read_bytes()).hexdigest()
        self.assertEqual(digest, self.basket['metadata']['sourceSha256'])
        self.assertEqual(self.archive.with_suffix('.xlsx.sha256').read_text().strip(), digest + '  ' + self.archive.name)

    def test_every_item_and_weight_reproduces(self):
        self.assertEqual(self.basket, self.reproduced)
        self.assertEqual(len(self.basket['items']), 358)
        self.assertEqual(len({item['id'] for item in self.basket['items']}), 358)
        self.assertEqual(sum(item['kind'] == 'goods' for item in self.basket['items']), 308)
        self.assertEqual(sum(item['kind'] == 'services' for item in self.basket['items']), 50)

    def test_both_sectors_and_combined_are_normalized(self):
        for sector in ('rural', 'urban', 'combined'):
            self.assertAlmostEqual(sum(item['weights'][sector] for item in self.basket['items']), 100, places=9)
        self.assertAlmostEqual(sum(self.basket['metadata']['sectorShares'].values()), 100, places=9)

    def test_contribution_normalization_is_reversible(self):
        for item in self.basket['items']:
            for sector in ('rural', 'urban'):
                self.assertAlmostEqual(item['weights'][sector] * self.basket['metadata']['sectorShares'][sector] / 100,
                                       item['combinedContributions'][sector], places=10)
            self.assertAlmostEqual(sum(item['combinedContributions'].values()), item['weights']['combined'], places=10)

    def test_geographic_ledger_and_hierarchy_are_complete(self):
        saved = json.loads((ROOT / 'public/data/inflation/cpi-state-item-weights.json').read_text())
        self.assertEqual(saved, self.strata)
        self.assertEqual(len(saved['records']), 23208)
        self.assertAlmostEqual(sum(r['combinedWeight'] for r in saved['records']), 100, places=9)
        self.assertEqual([len(self.basket[k]) for k in ('divisions', 'groups', 'classes', 'subclasses')], [12,43,92,162])

if __name__ == '__main__':
    unittest.main()
