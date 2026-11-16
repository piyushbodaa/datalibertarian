#!/usr/bin/env python3
"""Offline build gate: reproduce the released data from both archived sources."""
import calendar
import datetime as dt
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re

from collect import TableParser, extract

ROOT = Path(__file__).resolve().parents[1]

class TextParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
    def handle_data(self, value):
        self.parts.append(value)

def require(condition, message):
    if not condition:
        raise ValueError(message)

def verify_archive(meta, root=ROOT):
    archive = meta['sourceArchive']
    require(isinstance(archive, str) and archive.startswith('/data/inflation/sources/'), 'Unexpected source archive path')
    directory = (root / 'public/data/inflation/sources').resolve()
    path = (root / 'public' / archive.lstrip('/')).resolve()
    require(path.is_relative_to(directory), 'Source archive escapes evidence directory')
    raw = path.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    require(digest == meta['sourceSha256'], f'Source checksum mismatch: {path.name}')
    sidecar = path.with_name(path.name + '.sha256').read_text().strip()
    require(sidecar == f'{digest}  {path.name}', f'Checksum sidecar mismatch: {path.name}')
    return raw

def official_values(raw):
    text = TextParser()
    html = raw.decode('utf-8-sig')
    text.feed(html)
    plain = re.sub(r'\s+,', ',', ' '.join(' '.join(text.parts).split()))
    pattern = (r'Year-on-year inflation rate based on All India Consumer Price Index '
               r'\(CPI\) with base year (\d{4}) for the month of ([A-Za-z]+), '
               r'(\d{4}) over ([A-Za-z]+), (\d{4}) is ([0-9.]+)%\s*\((Provisional|Final)\)')
    headline = re.search(pattern, plain)
    require(headline is not None, 'Cannot locate unambiguous official headline period/rate/status')
    base, month_name, year, previous_month, previous_year, rate, status = headline.groups()
    month_names = list(calendar.month_name)
    require(month_name in month_names, 'Invalid official month')
    require(previous_month == month_name and int(previous_year) == int(year) - 1, 'Official annual comparison dates do not match')
    period = f'{year}-{month_names.index(month_name):02d}'
    food_pattern = (r'Year-on-year inflation rate based on All India Consumer Food Price Index '
                    r'\(CFPI\) for the month of ' + re.escape(month_name + ', ' + year) +
                    r' over ' + re.escape(previous_month + ', ' + previous_year) +
                    r' is ([0-9.]+)%\s*\((Provisional|Final)\)')
    food = re.search(food_pattern, plain)
    require(food is not None and food[2] == status, 'Cannot verify official food rate and status')
    release = re.search(r'Posted On:\s*(\d{1,2}) ([A-Z]{3}) (\d{4})', plain)
    require(release is not None, 'Cannot verify official release date')
    released = dt.datetime.strptime(' '.join(release.groups()), '%d %b %Y').date().isoformat()

    table = TableParser()
    table.feed(html)
    rows = [[cell for cell in row if cell] for row in table.rows]
    # Validate the summary table's column period before taking its Combined column.
    header = next((r for r in rows if any(re.fullmatch(r'[A-Za-z]+, \d{4} \((?:Provisional|Final)\)', c) for c in r)), None)
    require(header and header[-1] == f'{month_name}, {year} ({status})', 'Official summary-table period mismatch')
    headline_rows = [r for r in rows if r[:2] == ['Inflation (%)', 'CPI (General)']]
    index_rows = [(i, r) for i, r in enumerate(rows) if r[:2] == ['Index', 'CPI (General)']]
    require(headline_rows and all(r == headline_rows[0] and len(r) == 8 for r in headline_rows), 'Unexpected or inconsistent official headline tables')
    require(float(headline_rows[0][-1]) == float(rate), 'Official headline prose/table disagree')
    require(index_rows and all(r == index_rows[0][1] and len(r) == 8 for _, r in index_rows), 'Unexpected or inconsistent official index tables')
    i, index_row = index_rows[0]
    food_index = rows[i + 1]
    require(food_index[0] == 'CFPI' and len(food_index) == 7, 'Unexpected official food-index table structure')
    require(all(rows[j + 1] == food_index for j, _ in index_rows), 'Official food-index table copies disagree')
    return dict(period=period, headlineYoy=float(rate), foodYoy=float(food[1]),
                baseYear=int(base), status=status.lower(), headlineIndex=float(index_row[-1]),
                foodIndex=float(food_index[-1]), releasedAt=released)

def verify_snapshot(data, root=ROOT):
    meta = data['metadata']
    raw = verify_archive(meta, root)
    reproduced = extract(raw, meta['retrievedAt'], meta['sourceArchive'])
    require(data['rows'] == reproduced['rows'], 'Published prices, units, IDs, membership, categories or row order differ from archived PMD evidence')
    for key, expected in reproduced['metadata'].items():
        require(meta.get(key) == expected, f'Published PMD metadata does not reproduce: {key}')
    official = data['official']
    official_raw = verify_archive(official, root)
    require(official['sourceUrl'].startswith('https://www.pib.gov.in/PressReleasePage.aspx?PRID='), 'Unexpected official CPI source URL')
    expected_official = official_values(official_raw)
    for key, expected in expected_official.items():
        require(official.get(key) == expected, f'Published CPI field differs from archived release: {key}')
    retrieved = dt.datetime.fromisoformat(official['retrievedAt'].replace('Z', '+00:00'))
    require(retrieved.tzinfo is not None, 'CPI retrieval timestamp must have a timezone')
    require(dt.date.fromisoformat(official['releasedAt']) <= retrieved.date(), 'CPI release is later than retrieval')
    return len(data['rows'])

def main():
    data = json.loads((ROOT / 'src/data/inflation/private-snapshot.json').read_text())
    count = verify_snapshot(data)
    print(f'Inflation source verification passed: {count} commodities, {count * 3} price cells, dates/units/membership, both archive checksums and official CPI fields.')

if __name__ == '__main__':
    main()
