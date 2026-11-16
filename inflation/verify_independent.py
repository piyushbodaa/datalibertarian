#!/usr/bin/env python3
"""Offline integrity and admission checks for independently collected price offers.

This checks provenance and arithmetic; it cannot establish national
representativeness or prove a consumer paid an advertised price.
"""
from datetime import date, datetime
from hashlib import sha256
from html.parser import HTMLParser
import json
import math
from pathlib import Path
import re
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE_PREFIX = '/data/inflation/sources/independent/'
EVIDENCE_TYPES = {
    'complete-fetched-html',
    'complete-fetched-pdf',
    'transcribed-facts-from-opened-primary-page',
}
# Image-only source: values were visually checked on PDF pages 2 and 3.
# Bind that review to these exact bytes; replacing the PDF requires a new review.
REVIEWED_PDF_QUOTES = {
    'fc1dbbe173a7aafa9a2f0e9930acadad5fbb1377a94c242a08dd0998a2b157d5': {
        'taj-tirupati-veg-thali': (2200, 1, 'meal', 2),
        'taj-tirupati-paniyaram': (650, 260, 'g', 3),
    },
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def positive_number(value, name):
    require(isinstance(value, (int, float)) and not isinstance(value, bool)
            and math.isfinite(value) and value > 0, f'{name}: expected a finite positive number')
    return float(value)


def text_field(value, name):
    require(isinstance(value, str) and bool(value.strip()), f'{name}: expected nonempty text')
    return value


def observation_date(value, name):
    text_field(value, name)
    try:
        if re.fullmatch(r'\d{4}-\d{2}-\d{2}', value):
            return date.fromisoformat(value)
        parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
        require(parsed.tzinfo is not None, f'{name}: timestamp must include a timezone')
        return parsed.date()
    except (TypeError, ValueError) as error:
        raise ValueError(f'{name}: invalid dated observation: {error}') from error


def public_url(value, name):
    text_field(value, name)
    parsed = urlparse(value)
    require(parsed.scheme == 'https' and bool(parsed.hostname) and parsed.username is None
            and parsed.password is None, f'{name}: expected a public HTTPS source URL')


class VisibleText(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'):
            self.skip += 1

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.skip = max(0, self.skip - 1)

    def handle_data(self, value):
        if not self.skip and value.strip():
            self.parts.append(value.strip())


def visible_text(raw):
    parser = VisibleText()
    parser.feed(raw.decode('utf-8-sig'))
    return ' '.join(' '.join(parser.parts).split())


def amount(value):
    return float(value.replace(',', ''))


def captured_number(pattern, text, name, group=1):
    match = re.search(pattern, text)
    require(match is not None, f'{name}: cannot reproduce price from archived provider text')
    return amount(match[group])


def dps_fee(text, period, bus=False):
    match = re.fullmatch(r'Academic year (\d{4})[–-](\d{2})', period)
    require(match is not None, 'DPS fee comparison: invalid academic-year period')
    year, ending = match.groups()
    require((int(year) + 1) % 100 == int(ending), 'DPS fee comparison: academic year must span adjacent years')
    heading = f'Fee Structure ({year}-{ending})'
    require(heading in text, f'DPS fee comparison: period absent from archived source: {period}')
    section = text.split(heading, 1)[1].split('Fee Structure (', 1)[0]
    pattern = r'GZB CITY-A [\d,]+/- \(Quarterly ([\d,]+)/-\)' if bus else r'(?:Classes )?I to XII ([\d,]+)/-'
    return captured_number(pattern, section, 'DPS fee comparison')


def verify_quote_against_archive(quote, source, raw):
    """Re-extract available prices; a transcribed fact sheet stays a fact sheet."""
    kind = source['evidenceType']
    if kind == 'transcribed-facts-from-opened-primary-page':
        saved = json.loads(raw)
        require(saved.get('evidenceType') == kind, f"{quote['id']}: fact sheet relabelled as raw evidence")
        require(saved.get('sourceUrl') == quote['sourceUrl'], f"{quote['id']}: fact-sheet source mismatch")
        facts = saved.get('facts', {})
        for field, saved_field in (('productName', 'product'), ('price', 'offerPriceINR'), ('quantity', 'quantity'), ('unit', 'unit')):
            require(quote[field] == facts.get(saved_field), f"{quote['id']}: {field} differs from archived facts")
        return
    if kind == 'complete-fetched-pdf':
        # The PDF is image-only: retain the result of the explicit visual review
        # rather than claiming that a text extractor reproduced its price.
        reviewed = REVIEWED_PDF_QUOTES.get(source['sha256'], {})
        require(quote['id'] in reviewed, f"{quote['id']}: PDF price needs a recorded visual review")
        recorded = (quote['price'], quote['quantity'], quote['unit'], quote.get('sourcePage'))
        require(recorded == reviewed[quote['id']], f"{quote['id']}: price, pack or page differs from reviewed PDF")
        return
    text = visible_text(raw)
    source_id = source['id']
    expected = None
    if source_id == '1mg-dolo':
        expected = captured_number(r'₹\s*([\d,.]+) MRP ₹', text, quote['id'])
        require(quote['quantity'] == 15 and '15 tablets' in text and quote['unit'] == 'tablet',
                'Dolo quote: strip size differs from archived product')
    elif source_id == 'ikea-marius':
        expected = captured_number(r'Price Rs\.\s*([\d,.]+)', text, quote['id'])
    elif source_id == 'netflix-plans':
        plan = quote['id'].removeprefix('netflix-').title()
        expected = captured_number(re.escape(plan) + r' [^₹]+₹([\d,.]+) /mo', text, quote['id'])
        require(quote['quantity'] == 1 and quote['unit'] == 'month', 'Netflix quote: monthly tariff unit changed')
    elif source_id.startswith('decathlon-'):
        expected = captured_number(r'₹\s*([\d,.]+) MRP ₹', text, quote['id'])
        require(quote['quantity'] == 1 and quote['unit'] == 'piece', 'Decathlon quote: single-item unit changed')
        require(str(quote.get('productId')) in text, f"{quote['id']}: product ID absent from provider page")
    elif source_id == 'apollo-hyderabad':
        names = {'apollo-cbc': 'COMPLETE BLOOD COUNT (CBC)', 'apollo-fasting-glucose': 'GLUCOSE, FASTING',
                 'apollo-thyroid-profile': 'THYROID PROFILE (TOTAL T3, TOTAL T4, TSH)'}
        if quote['id'] in names:
            expected = captured_number(re.escape(names[quote['id']]) + r' Home Collection Available Report delivery- Same Day ₹\s*([\d,.]+)', text, quote['id'])
    elif source_id == 'dps-rnext-fees':
        comparison = quote.get('matchedAnnualComparison')
        require(comparison is not None, 'DPS quote: published dated comparison was removed')
        is_bus = quote['itemCode'] == '07.3.2.3.2.01'
        expected = dps_fee(text, comparison['currentPeriod'], is_bus)
        require(dps_fee(text, comparison['previousPeriod'], is_bus) == comparison['previousPrice'],
                'DPS fee comparison: previous price differs from archived academic-year table')
        earlier = comparison.get('additionalHistoricalQuote')
        if earlier:
            require(dps_fee(text, earlier['period'], is_bus) == earlier['price'],
                    'DPS fee comparison: historical price differs from archived academic-year table')
    elif source_id == 'naturals-classic-cut':
        expected = captured_number(r'Classic Hair Cut: Rs\.\s*([\d,.]+)', text, quote['id'])
    if expected is not None:
        require(expected == quote['price'], f"{quote['id']}: displayed price differs from archived provider offer")
    else:
        # New providers remain admissible. At minimum their number must be in
        # the stored visible page, never only in a search snippet or script.
        numeric_tokens = re.findall(r'(?<![\w.])[0-9][0-9,]*(?:\.[0-9]+)?', text)
        numeric_tokens += re.findall(r'(?:₹|Rs\.?|INR)\s*([0-9][0-9,]*(?:\.[0-9]+)?)', text)
        numbers = {amount(value) for value in numeric_tokens}
        require(quote['price'] in numbers, f"{quote['id']}: offered price absent from archived visible page")


def verify_archive(source, root):
    archive = source['archive']
    require(isinstance(archive, str) and archive.startswith(ARCHIVE_PREFIX), 'Independent archive: unexpected source path')
    directory = (root / 'public' / ARCHIVE_PREFIX.lstrip('/')).resolve()
    path = (root / 'public' / archive.lstrip('/')).resolve()
    require(path.is_relative_to(directory), 'Independent archive escapes evidence directory')
    require(re.fullmatch(r'[0-9a-f]{64}', source.get('sha256', '')) is not None, 'Independent archive: malformed SHA-256')
    raw = path.read_bytes()
    require(len(raw) == source['bytes'], f'Independent archive size mismatch: {path.name}')
    require(sha256(raw).hexdigest() == source['sha256'], f'Independent archive checksum mismatch: {path.name}')
    kind = source['evidenceType']
    require(kind in EVIDENCE_TYPES, f'Unknown independent evidence type: {kind}')
    if kind == 'complete-fetched-html':
        require(path.name.endswith('.html.txt') and b'<html' in raw.lower(), 'Raw HTML evidence has wrong format or unsafe extension')
    elif kind == 'complete-fetched-pdf':
        require(path.suffix == '.pdf' and raw.startswith(b'%PDF'), 'PDF evidence has wrong format')
    else:
        require(path.name.endswith('.observed-facts.json'), 'Transcribed evidence must be explicitly named as a fact sheet')
    return raw


def verify_comparison(quote):
    comparison = quote['matchedAnnualComparison']
    if comparison is None:
        return
    current = positive_number(comparison.get('currentPrice'), 'Comparison current price')
    previous = positive_number(comparison.get('previousPrice'), 'Comparison previous price')
    require(current == quote['price'] and comparison.get('unit') == quote['unit'], 'Comparison uses a different current price or unit')
    require(comparison.get('sourceUrl') == quote['sourceUrl'] and comparison.get('sourceArchive') == quote['sourceArchive'],
            'Comparison source differs from the provider observation')
    for field in ('previousPeriod', 'currentPeriod', 'interpretation'):
        text_field(comparison.get(field), f'Comparison {field}')
    require(comparison['previousPeriod'] != comparison['currentPeriod'], 'Comparison periods must differ')
    academic = [re.fullmatch(r'Academic year (\d{4})[–-](\d{2})', comparison[field]) for field in ('previousPeriod', 'currentPeriod')]
    if all(academic):
        years = [int(match[1]) for match in academic]
        require(years[1] == years[0] + 1 and all((int(match[1]) + 1) % 100 == int(match[2]) for match in academic),
                'Annual comparison academic years are not consecutive')
    else:
        previous_date = observation_date(comparison['previousPeriod'], 'Previous comparison period')
        current_date = observation_date(comparison['currentPeriod'], 'Current comparison period')
        require(current_date.year == previous_date.year + 1 and current_date.month == previous_date.month,
                'Annual comparison must match the same month in consecutive years')
    change = comparison.get('changePct')
    require(isinstance(change, (int, float)) and not isinstance(change, bool) and math.isfinite(change), 'Comparison change must be finite')
    require(math.isclose(change, (current / previous - 1) * 100, rel_tol=0, abs_tol=1e-8), 'Comparison change calculation is incorrect')
    require(isinstance(comparison.get('limitations'), list) and bool(comparison['limitations']), 'Provider comparison needs explicit limitations')
    require(quote['indexEligible'] is False, 'A provider comparison must not confer national-index eligibility')


def verify_independent(data, basket, root=ROOT, check_archives=True):
    meta = data['metadata']
    require(meta.get('schemaVersion') == 1, 'Unsupported independent-observation schema')
    retrieved = observation_date(meta.get('retrievedOn'), 'Collection retrieval date')
    require(re.fullmatch(r'\d{4}-\d{2}', meta.get('targetCPIMonth', '')) is not None, 'Invalid target CPI month')
    date.fromisoformat(meta['targetCPIMonth'] + '-01')
    items = {item['code']: item for item in basket['items']}
    require(len(items) == 358, 'The CPI 2024 collection frame must contain 358 unique item codes')
    sources = data['sources']
    source_by_id = {source['id']: source for source in sources}
    require(len(source_by_id) == len(sources), 'Duplicate independent source ID')
    raw_sources = {}
    for source in sources:
        public_url(source.get('url'), 'Source URL')
        require(observation_date(source.get('retrievedAt'), 'Source retrieval date') <= retrieved, 'Source retrieval is later than collection release')
        require(source.get('evidenceType') in EVIDENCE_TYPES, 'Unknown independent evidence type')
        if check_archives:
            raw_sources[source['id']] = verify_archive(source, root)
    if check_archives:
        saved_manifest = json.loads((root / 'public/data/inflation/sources/independent/manifest.json').read_text())
        require(saved_manifest == sources, 'Independent source manifest differs from published metadata')
    quotes = data['quotes']
    require(len({quote['id'] for quote in quotes}) == len(quotes), 'Duplicate independent quote ID')
    required_text = ('id', 'provider', 'productName', 'unit', 'priceReferencePeriod', 'location',
                     'geographicRepresentativeness', 'taxes', 'discounts', 'deliveryCharges')
    for quote in quotes:
        for field in required_text:
            text_field(quote.get(field), f'Quote {field}')
        require(quote.get('itemCode') in items, f"{quote['id']}: unknown CPI basket item code")
        require(quote.get('itemName') == items[quote['itemCode']]['name'], f"{quote['id']}: CPI item label does not match its code")
        price = positive_number(quote.get('price'), 'Quote price')
        quantity = positive_number(quote.get('quantity'), 'Quote quantity')
        normalized = positive_number(quote.get('normalizedPrice'), 'Normalized quote price')
        require(math.isclose(normalized, price / quantity, rel_tol=0, abs_tol=5.1e-9),
                f"{quote['id']}: normalized pack price is incorrect")
        require(quote.get('currency') == 'INR', 'Independent quote currency must be INR')
        require(quote.get('sourceId') in source_by_id, f"{quote['id']}: missing source manifest entry")
        source = source_by_id[quote['sourceId']]
        for qkey, skey in (('sourceUrl', 'url'), ('sourceArchive', 'archive'), ('sourceSha256', 'sha256'), ('evidenceType', 'evidenceType')):
            require(quote.get(qkey) == source[skey], f"{quote['id']}: source provenance mismatch ({qkey})")
        quote_date = observation_date(quote.get('observedAt'), 'Quote retrieval date')
        require(quote_date == observation_date(source['retrievedAt'], 'Source retrieval date'),
                f"{quote['id']}: retrieval date differs from source evidence")
        require(quote_date <= retrieved, 'Quote retrieval is later than collection release')
        require(quote.get('indexEligible') is False and quote.get('nationallyRepresentative') is False,
                'Published provider offers do not establish national-index eligibility')
        require(quote.get('transactionVerified') is False, 'Published offers must not be relabelled as verified transactions')
        missing = quote.get('missingRequirements')
        require(isinstance(missing, list) and missing and all(isinstance(value, str) and value.strip() for value in missing),
                'Ineligible quote must retain explicit missing requirements')
        require('matchedAnnualComparison' in quote, 'Quote comparison status must be explicit')
        verify_comparison(quote)
        if check_archives:
            verify_quote_against_archive(quote, source, raw_sources[source['id']])
    distinct = {quote['itemCode'] for quote in quotes}
    expected_counts = {'quoteCount': len(quotes), 'distinctItemCount': len(distinct), 'basketItemCount': len(items),
                       'divisionCount': len({code.split('.')[0] for code in distinct}), 'indexEligibleItemCount': 0,
                       'providerAnnualComparisonCount': sum(quote['matchedAnnualComparison'] is not None for quote in quotes)}
    for field, value in expected_counts.items():
        require(meta.get(field) == value, f'Independent collection count is incorrect: {field}')
    require(meta.get('nationalIndex') is None and meta.get('nationalInflationPct') is None,
            'Incomplete provider offers must not produce an independent national result')
    for history in data.get('historicalEvidence', []):
        require(history.get('sourceId') in source_by_id, 'Historical evidence is missing its archive source')
        source = source_by_id[history['sourceId']]
        for field, source_field in (('sourceUrl', 'url'), ('sourceArchive', 'archive'), ('sourceSha256', 'sha256')):
            require(history.get(field) == source[source_field], 'Historical source provenance mismatch')
        require(history.get('indexEligible') is False, 'An isolated historical document must not confer index eligibility')
    return {**expected_counts, 'sourceCount': len(sources)}


def main():
    data = json.loads((ROOT / 'src/data/inflation/independent-quotes.json').read_text())
    basket = json.loads((ROOT / 'src/data/inflation/cpi-basket.json').read_text())
    result = verify_independent(data, basket)
    print(f"Independent-source verification passed: {result['quoteCount']} quotes, {result['distinctItemCount']} CPI items, "
          f"{result['sourceCount']} source checksums, {result['providerAnnualComparisonCount']} dated provider comparisons; national result withheld.")


if __name__ == '__main__':
    main()
