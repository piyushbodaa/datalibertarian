#!/usr/bin/env python3
"""Retrieve official base-2024 all-India October indices; preserve exact API pages."""
import concurrent.futures
import argparse
import datetime as dt
import hashlib
import json
import math
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'https://api.mospi.gov.in/api/cpi/getCPIData?base_year=2024&series=Current&year=2026,2025&month_code=10&state_code=1&sector_code=1,2,3&limit=100'
ARCHIVE = ROOT / 'public/data/inflation/sources/cpi-official-october-2026-api.json'

def fetch(page):
    url = SOURCE + f'&page={page}'
    raw = urllib.request.urlopen(url, timeout=50).read()
    data = json.loads(raw)
    if not data.get('statusCode') or not data.get('data'):
        raise ValueError(f'API returned no data for page {page}: {data.get("msg")}')
    return {'url': url, 'retrievedAt': dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'), 'response': data}

def number(value):
    if value is None or value in ('', '-', '--'): return None
    result = float(value)
    if not math.isfinite(result): raise ValueError('Non-finite official value')
    return result

def compile_archive(pages):
    if not pages: raise ValueError('No official API pages')
    metadata = pages[0]['response']['meta_data']
    if len(pages) != metadata['totalPages']: raise ValueError('Incomplete official API page set')
    for page_number, page in enumerate(pages, 1):
        response = page['response']
        meta = response['meta_data']
        if page['url'] != SOURCE + f'&page={page_number}' or not response['statusCode']:
            raise ValueError('Unexpected official API page URL or unsuccessful response')
        if meta['page'] != page_number or any(meta[key] != metadata[key] for key in ('totalPages','totalRecords','recordPerPage')):
            raise ValueError('Inconsistent official API pagination')
        timestamp = dt.datetime.fromisoformat(page['retrievedAt'].replace('Z', '+00:00'))
        if timestamp.tzinfo is None: raise ValueError('Missing retrieval timezone')
        expected_size = min(metadata['recordPerPage'], metadata['totalRecords'] - (page_number-1)*metadata['recordPerPage'])
        if len(response['data']) != expected_size: raise ValueError('Incomplete official API page')
    records = [row for page in pages for row in page['response']['data']]
    expected = pages[0]['response']['meta_data']['totalRecords']
    if len(records) != expected: raise ValueError(f'Incomplete API pagination: {len(records)} of {expected}')
    pairs = {}
    for r in records:
        if r['state'] != 'All India' or r['base_year'] != '2024' or r['month'] != 'October' or r['series'] != 'Current' or r['sector'] not in ('Rural','Urban','Combined'):
            raise ValueError('API returned an unexpected series/geography/period')
        key = (r['code'] or 'general', r['sector'].lower())
        year = r['year']
        if year not in ('2025','2026') or year in pairs.setdefault(key, {}): raise ValueError('Duplicate or unexpected year')
        pairs[key][year] = r
    result = []
    for (code, sector), pair in pairs.items():
        if set(pair) != {'2025','2026'}: raise ValueError('Unmatched official annual index')
        current, previous = pair['2026'], pair['2025']
        if any(current[key] != previous[key] for key in ('division','group','class','sub_class','item')): raise ValueError('Changed official classification between years')
        level = next((k for k in ['item','sub_class','class','group','division'] if current[k]), 'general')
        if code == 'general': level = 'general'
        result.append({'code': code, 'name': current['item'] or current['sub_class'] or current['class'] or current['group'] or current['division'], 'level': level, 'sector': sector, 'currentIndex': number(current['index']), 'previousIndex': number(previous['index']), 'yoy': number(current['inflation']), 'imputation': current['imputation']})
    for sector in ['rural','urban','combined']:
        if len([r for r in result if r['sector'] == sector and r['level']=='item']) != 358: raise ValueError('Expected exactly 358 official items per sector')
    return sorted(result, key=lambda r:(r['code'],r['sector']))

def compile_snapshot(raw):
    pages = json.loads(raw)
    rows = compile_archive(pages)
    return {'metadata': {'baseYear':2024,'period':'2026-10','previousPeriod':'2025-10','geography':'All India','currentStatus':'Provisional','sourceUrl':SOURCE,'sourceArchive':'/data/inflation/sources/'+ARCHIVE.name,'sourceSha256':hashlib.sha256(raw).hexdigest(),'retrievedAt':pages[-1]['retrievedAt'],'recordCount':sum(len(p['response']['data']) for p in pages),'note':'Official item indices are dimensionless, not retail rupee prices. CPI2024 API omits per-row release status; October2026 provisional status is from the MoSPI release.'},'rows':rows}

def validate_snapshot(snapshot, basket):
    rows = {(r['code'],r['sector']):r for r in snapshot['rows']}
    if len(rows) != len(snapshot['rows']): raise ValueError('Duplicate compiled official code/sector')
    codes = {item['code'] for item in basket['items']}
    for sector in ('rural','urban','combined'):
        if {r['code'] for r in snapshot['rows'] if r['sector'] == sector and r['level'] == 'item'} != codes:
            raise ValueError('Official item codes differ from complete basket')
        for item in basket['items']:
            row = rows[(item['code'],sector)]
            if any(row[key] is None or row[key] <= 0 or not math.isfinite(row[key]) for key in ('currentIndex','previousIndex')):
                raise ValueError('Missing/non-positive official item index')
        for level, key in (('general',None),('division','divisions'),('group','groups'),('class','classes'),('subclass','subclasses')):
            groups = [{'code':'general'}] if key is None else basket[key]
            for group in groups:
                children = basket['items'] if key is None else [item for item in basket['items'] if item[level]['code'] == group['code']]
                denominator = sum(item['weights'][sector] for item in children)
                for period in ('currentIndex','previousIndex'):
                    reproduced = sum(item['weights'][sector]*rows[(item['code'],sector)][period] for item in children)/denominator
                    published = rows[(group['code'],sector)][period]
                    # Source item indices and aggregate indices are both independently rounded to 2dp.
                    if published is None or abs(reproduced-published) > 0.01000001:
                        raise ValueError(f'Official weighted aggregation differs beyond rounding: {group["code"]} {sector} {period}')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--verify', action='store_true', help='Check archived evidence and generated JSON offline without downloading or writing')
    args = parser.parse_args()
    if not ARCHIVE.exists():
        if args.verify: raise ValueError('Official API archive missing; offline verification cannot retrieve it')
        first = fetch(1)
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
            pages = [first, *pool.map(fetch, range(2, first['response']['meta_data']['totalPages']+1))]
        ARCHIVE.parent.mkdir(parents=True, exist_ok=True)
        ARCHIVE.write_text(json.dumps(pages,ensure_ascii=False,indent=2)+'\n')
    output=compile_snapshot(ARCHIVE.read_bytes())
    target=ROOT/'src/data/inflation/cpi-official.json'
    validate_snapshot(output, json.loads((ROOT/'src/data/inflation/cpi-basket.json').read_text()))
    if args.verify:
        if output != json.loads(target.read_text()): raise ValueError('Official JSON does not reproduce from the archived API pages or checksum changed')
    else:
        target.write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
    print(f'Official CPI: {len(output["rows"])} paired rows, 358 items in each of 3 sectors; archived evidence and weighted aggregation verified.')
if __name__=='__main__': main()
