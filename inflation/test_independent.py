"""Regression checks for price evidence, units, date matching and publication gates."""
from copy import deepcopy
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from verify_independent import ROOT, verify_archive, verify_independent


class IndependentPriceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((ROOT / 'src/data/inflation/independent-quotes.json').read_text())
        cls.basket = json.loads((ROOT / 'src/data/inflation/cpi-basket.json').read_text())

    def setUp(self):
        self.changed = deepcopy(self.data)

    def quote(self, id):
        return next(quote for quote in self.changed['quotes'] if quote['id'] == id)

    def rejects(self, message, check_archives=False):
        with self.assertRaisesRegex(ValueError, message):
            verify_independent(self.changed, self.basket, check_archives=check_archives)

    def test_current_release_reproduces_from_offline_evidence(self):
        result = verify_independent(self.data, self.basket)
        self.assertEqual(result['quoteCount'], len(self.data['quotes']))
        self.assertEqual(result['indexEligibleItemCount'], 0)

    def test_pack_quantity_cannot_silently_be_treated_as_one_unit(self):
        self.quote('bb-atta')['quantity'] = 1
        self.rejects('normalized pack price')

    def test_facts_bind_price_and_pack_even_if_normalization_is_changed(self):
        quote = self.quote('bb-atta')
        quote['quantity'] = 1
        quote['normalizedPrice'] = quote['price']
        self.rejects('quantity differs from archived facts', check_archives=True)

    def test_sale_price_cannot_be_replaced_with_mrp(self):
        quote = self.quote('1mg-dolo-650')
        quote['price'] = quote['mrp']
        quote['normalizedPrice'] = quote['price'] / quote['quantity']
        self.rejects('displayed price differs from archived provider offer', check_archives=True)

    def test_tablet_pack_and_piece_price_are_distinct(self):
        quote = self.quote('1mg-dolo-650')
        quote['quantity'] = 1
        quote['normalizedPrice'] = quote['price']
        self.rejects('strip size differs', check_archives=True)

    def test_wrong_item_code_is_rejected(self):
        self.changed['quotes'][0]['itemCode'] = '12.0.0.0.0.00'
        self.rejects('unknown CPI basket item code')

    def test_correct_code_with_wrong_item_label_is_rejected(self):
        self.changed['quotes'][0]['itemName'] = 'Petrol'
        self.rejects('label does not match')

    def test_duplicate_observation_does_not_inflate_coverage(self):
        self.changed['quotes'].append(deepcopy(self.changed['quotes'][0]))
        self.rejects('Duplicate independent quote ID')

    def test_source_url_cannot_be_changed_without_changing_manifest(self):
        self.changed['quotes'][0]['sourceUrl'] = 'https://example.com/price'
        self.rejects('source provenance mismatch')

    def test_transcribed_facts_cannot_be_relabelled_as_raw_html(self):
        self.changed['quotes'][0]['evidenceType'] = 'complete-fetched-html'
        self.rejects('source provenance mismatch')

    def test_retrieval_date_cannot_be_backdated_to_target_cpi_month(self):
        self.changed['quotes'][0]['observedAt'] = self.changed['metadata']['targetCPIMonth'] + '-16'
        self.rejects('retrieval date differs')

    def test_future_source_date_is_rejected(self):
        self.changed['sources'][0]['retrievedAt'] = '2099-01-01'
        self.rejects('later than collection release')

    def test_unitless_or_nonfinite_prices_are_rejected(self):
        for field, value in [('price', float('nan')), ('quantity', 0), ('normalizedPrice', True)]:
            with self.subTest(field=field):
                self.changed = deepcopy(self.data)
                self.changed['quotes'][0][field] = value
                self.rejects('finite positive number')

    def test_comparison_cannot_be_called_annual_for_nonconsecutive_years(self):
        self.quote('dps-rnext-primary')['matchedAnnualComparison']['previousPeriod'] = 'Academic year 2024–25'
        self.rejects('not consecutive')

    def test_provider_growth_is_recalculated(self):
        self.quote('dps-rnext-primary')['matchedAnnualComparison']['changePct'] = 8.0
        self.rejects('calculation is incorrect')

    def test_fabricated_historical_price_rejected_even_with_correct_arithmetic(self):
        comparison = self.quote('dps-rnext-primary')['matchedAnnualComparison']
        comparison['previousPrice'] = 36000
        comparison['changePct'] = (comparison['currentPrice'] / 36000 - 1) * 100
        self.rejects('previous price differs from archived', check_archives=True)

    def test_provider_comparison_does_not_unlock_national_eligibility(self):
        self.quote('dps-rnext-primary')['indexEligible'] = True
        self.rejects('national-index eligibility')

    def test_offers_cannot_be_relabelled_as_paid_receipts(self):
        self.changed['quotes'][0]['transactionVerified'] = True
        self.rejects('verified transactions')

    def test_missing_requirements_must_remain_visible(self):
        self.changed['quotes'][0]['missingRequirements'] = []
        self.rejects('missing requirements')

    def test_count_cannot_confuse_quotes_with_distinct_items(self):
        self.changed['metadata']['distinctItemCount'] = len(self.changed['quotes'])
        self.rejects('collection count is incorrect')

    def test_incomplete_evidence_cannot_publish_national_inflation(self):
        self.changed['metadata']['nationalInflationPct'] = 6.75
        self.rejects('must not produce an independent national result')

    def test_archive_tampering_is_detected_offline(self):
        source = self.data['sources'][0]
        original = (ROOT / 'public' / source['archive'].lstrip('/')).read_bytes()
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            file = root / 'public' / source['archive'].lstrip('/')
            file.parent.mkdir(parents=True)
            file.write_bytes(bytes([original[0] ^ 1]) + original[1:])
            with self.assertRaisesRegex(ValueError, 'checksum mismatch'):
                verify_archive(source, root)

    def test_archive_path_cannot_escape_evidence_directory(self):
        source = deepcopy(self.data['sources'][0])
        source['archive'] = '/data/inflation/sources/independent/../../../../private.txt'
        with self.assertRaisesRegex(ValueError, 'escapes evidence directory'):
            verify_archive(source, ROOT)

    def test_salon_membership_price_cannot_replace_public_guide_price(self):
        quote = self.quote('naturals-classic-cut')
        quote['price'] = quote['normalizedPrice'] = 400
        self.rejects('displayed price differs from archived provider offer', check_archives=True)

    def test_added_retail_offer_is_bound_to_its_fact_sheet(self):
        quote = self.quote('bb-whisper-pads')
        quote['price'] = quote['mrp']
        quote['normalizedPrice'] = quote['price'] / quote['quantity']
        self.rejects('price differs from archived facts', check_archives=True)

    def test_gas_tariff_cannot_be_replaced_by_an_unverified_number(self):
        quote = self.quote('igl-delhi-png')
        quote['price'] = quote['normalizedPrice'] = 45.0
        self.rejects('price differs from archived facts', check_archives=True)

    def test_image_only_menu_price_stays_bound_to_visually_reviewed_pdf(self):
        quote = self.quote('taj-tirupati-veg-thali')
        quote['price'] = quote['normalizedPrice'] = 2000
        self.rejects('differs from reviewed PDF', check_archives=True)

    def test_image_only_menu_serving_size_cannot_be_dropped(self):
        quote = self.quote('taj-tirupati-paniyaram')
        quote['quantity'] = 1
        quote['normalizedPrice'] = quote['price']
        self.rejects('differs from reviewed PDF', check_archives=True)


if __name__ == '__main__':
    unittest.main()
