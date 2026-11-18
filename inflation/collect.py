#!/usr/bin/env python3
"""Collect a dated PMD snapshot; writes a candidate, never promotes it automatically."""
import argparse
import datetime as dt
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import urllib.request
from evidence_safety import require_safe

SOURCE_URL = 'https://fcainfoweb.nic.in/Reports/DB/DBprices.aspx'
# Fixed membership, independent of the direction of observed price changes.
MEMBERS = [
    ('rice', 'Rice', 'grains'), ('wheat', 'Wheat', 'grains'),
    ('atta', 'Atta (Wheat)', 'grains'), ('gram-dal', 'Gram Dal', 'pulses'),
    ('tur-dal', 'Tur/Arhar Dal', 'pulses'), ('urad-dal', 'Urad Dal', 'pulses'),
    ('moong-dal', 'Moong Dal', 'pulses'), ('masoor-dal', 'Masoor Dal', 'pulses'),
    ('groundnut-oil', 'Groundnut Oil (Packed)', 'oils'),
    ('mustard-oil', 'Mustard Oil (Packed)', 'oils'),
    ('vanaspati', 'Vanaspati (Packed)', 'oils'), ('soya-oil', 'Soya Oil (Packed)', 'oils'),
    ('sunflower-oil', 'Sunflower Oil (Packed)', 'oils'), ('palm-oil', 'Palm Oil (Packed)', 'oils'),
    ('potato', 'Potato', 'veg'), ('onion', 'Onion', 'veg'), ('tomato', 'Tomato', 'veg'),
    ('sugar', 'Sugar', 'sugar'), ('gur', 'Gur', 'sugar'),
    ('milk', 'Milk (₹/ltr)', 'dairy'), ('tea', 'Tea Loose', 'other'),
    ('salt', 'Salt Pack (Iodised)', 'other'),
]

class TableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows = []
        self.row = None
        self.cell = None
    def handle_starttag(self, tag, attrs):
        if tag == 'tr':
            self.row = []
        elif tag in ('td', 'th') and self.row is not None:
            self.cell = []
        elif tag == 'br' and self.cell is not None:
            self.cell.append(' ')
    def handle_data(self, text):
        if self.cell is not None:
            self.cell.append(text)
    def handle_endtag(self, tag):
        if tag in ('td', 'th') and self.cell is not None:
            self.row.append(' '.join(''.join(self.cell).split()))
            self.cell = None
        elif tag == 'tr' and self.row is not None:
            self.rows.append(self.row)
            self.row = None

def price(cell):
    if cell.strip() in ('--', '-', '', '0', '0.00'):
        return None
    match = re.fullmatch(r'(\d+(?:\.\d+)?)(?:\s*\(-?\d+(?:\.\d+)?\))?', cell)
    if not match:
        raise ValueError(f'Unexpected price cell: {cell!r}')
    value = float(match[1])
    return value if value > 0 else None

def extract(raw, retrieved_at, archive):
    parser = TableParser()
    parser.feed(raw.decode('utf-8-sig'))
    date_rows = [r for r in parser.rows if len(r) == 6 and all(re.fullmatch(r'\d{2}/\d{2}/\d{4}', c) for c in r)]
    if len(date_rows) != 1:
        raise ValueError('Expected exactly one six-column PMD date header')
    dates = [dt.datetime.strptime(x, '%d/%m/%Y').date() for x in date_rows[0]]
    if not dates[0] > dates[2] > dates[4]:
        raise ValueError('PMD report dates out of order')
    if dates[0] > dt.datetime.fromisoformat(retrieved_at.replace('Z', '+00:00')).date():
        raise ValueError('PMD observation is later than retrieval')
    if dates[4].month != dates[0].month or dates[4].day != dates[0].day or dates[4].year != dates[0].year - 1:
        raise ValueError('PMD year comparator is not the same calendar day a year earlier')
    month = dates[0].month - 1 or 12
    year = dates[0].year - (1 if dates[0].month == 1 else 0)
    if dates[2].year != year or dates[2].month != month or dates[2].day != dates[0].day:
        raise ValueError('PMD month comparator is not the expected calendar day')
    rows = []
    for item_id, name, category in MEMBERS:
        matches = [r for r in parser.rows if len(r) == 8 and r[0] == name]
        if len(matches) != 1:
            raise ValueError(f'Expected one row for {name}, got {len(matches)}')
        cells = matches[0]
        expected_unit = '1 Ltr' if item_id == 'milk' else '1 Kg'
        if cells[1].lower() != expected_unit.lower():
            raise ValueError(f'Unit changed for {name}: {cells[1]}')
        rows.append(dict(id=item_id, name=name, category=category,
                         unit='litre' if item_id == 'milk' else 'kg',
                         current=price(cells[2]), monthAgo=price(cells[4]), yearAgo=price(cells[6])))
    return {
        'metadata': {
            'schemaVersion': 1, 'asOf': dates[0].isoformat(),
            'monthAgo': dates[2].isoformat(), 'yearAgo': dates[4].isoformat(),
            'retrievedAt': retrieved_at, 'sourceUrl': SOURCE_URL,
            'sourceTitle': 'Department of Consumer Affairs — Daily Average Retail Prices of Essential Commodities',
            'sourceArchive': archive, 'sourceSha256': hashlib.sha256(raw).hexdigest(),
            'geography': 'All-India averages reported by PMD', 'currency': 'INR',
            'priceCollection': 'State Civil Supplies Departments; published by Department of Consumer Affairs',
            'independentPriceCollection': False,
            'frequency': 'daily snapshot', 'membership': '22 traditional PMD essential commodities',
            'limitations': [
                'This is a privately calculated food-essentials index using government-collected prices.',
                'The basket is not a representative measure of total household expenditure or all-India cost of living.',
                'National averages can change with the mix of reporting centres and varieties; this snapshot cannot hold centres fixed.',
                'The comparisons use single days, not monthly averages or seasonally adjusted prices.',
                'Housing, healthcare, education, services and fuel are outside the basket.',
                'The new broken-rice series and additional commodities are excluded under the fixed 22-item membership rule.'
            ],
        },
        'rows': rows,
    }

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--input', type=Path, help='Previously downloaded PMD HTML; otherwise fetch source')
    ap.add_argument('--output', type=Path, default=Path('inflation/candidate.json'))
    ap.add_argument('--archive-dir', type=Path, default=Path('public/data/inflation/sources'))
    ap.add_argument('--retrieved-at', help='ISO UTC timestamp, required with --input')
    args = ap.parse_args()
    if args.input and not args.retrieved_at:
        ap.error('--retrieved-at is required when reading an archived input')
    raw = args.input.read_bytes() if args.input else urllib.request.urlopen(SOURCE_URL, timeout=45).read()
    # Official captures retain exact bytes. Reject unsafe input before parsing/writing.
    require_safe(raw)
    retrieved = args.retrieved_at or dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')
    candidate = extract(raw, retrieved, '')
    name = f"pmd-retail-{candidate['metadata']['asOf']}.html.txt"
    candidate['metadata']['sourceArchive'] = '/data/inflation/sources/' + name
    args.archive_dir.mkdir(parents=True, exist_ok=True)
    target = args.archive_dir / name
    # Never silently replace an archived report if the publisher revised it.
    if target.exists() and target.read_bytes() != raw:
        raise ValueError(f'Archive already exists with different bytes: {target}; preserve both revisions and review manually')
    target.write_bytes(raw)
    (args.archive_dir / (name + '.sha256')).write_text(hashlib.sha256(raw).hexdigest() + '  ' + name + '\n')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(candidate, ensure_ascii=False, indent=2) + '\n')
    missing = sum(r[k] is None for r in candidate['rows'] for k in ('current', 'monthAgo', 'yearAgo'))
    print(f"Wrote candidate for {candidate['metadata']['asOf']}: {len(candidate['rows'])} commodities; {missing} missing price cells. Review before promotion. Official CPI metadata must be verified separately.")

if __name__ == '__main__':
    main()
