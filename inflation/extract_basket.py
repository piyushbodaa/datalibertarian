#!/usr/bin/env python3
"""Reproduce the CPI 2024 basket and state-sector weights from official Annex 5.3.

Read-only XLSX extraction uses only Python's standard library. It does not alter
or recalculate the source workbook. The source's N column is the contribution to
All-India combined expenditure, NOT a normalized rural or urban basket weight.
"""
from collections import defaultdict
from decimal import Decimal
from pathlib import Path
import argparse
import datetime as dt
import hashlib
import json
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE_URL = 'https://www.mospi.gov.in/uploads/documents/documents/1769670019171-Annex_5.3.xlsx'
ARCHIVE = '/data/inflation/sources/cpi-2024-annex-5.3.xlsx'
NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
ZERO = Decimal(0)
HUNDRED = Decimal(100)

def require(test, message):
    if not test:
        raise ValueError(message)

def sheets(path):
    with zipfile.ZipFile(path) as book:
        strings = [''.join(cell.itertext()) for cell in ET.fromstring(book.read('xl/sharedStrings.xml'))]
        relations = {item.attrib['Id']: item.attrib['Target'] for item in ET.fromstring(book.read('xl/_rels/workbook.xml.rels'))}
        for sheet in ET.fromstring(book.read('xl/workbook.xml')).findall('m:sheets/m:sheet', NS):
            rel = sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
            source = relations[rel]
            source = source.lstrip('/') if source.startswith('/') else 'xl/' + source
            records = []
            for row in ET.fromstring(book.read(source)).findall('.//m:row', NS):
                cells = {}
                for cell in row:
                    value = cell.find('m:v', NS)
                    value = value.text if value is not None else ''
                    if cell.attrib.get('t') == 's' and value:
                        value = strings[int(value)]
                    cells[''.join(c for c in cell.attrib['r'] if c.isalpha())] = value
                records.append((int(row.attrib['r']), cells))
            yield sheet.attrib['name'], records

def extract(path, retrieved_at):
    tables = dict(sheets(path))
    require(set(tables) == {'5.3a', '5.3b', '5.3c', '5.3d'}, 'Unexpected workbook sheet set')
    item_rows = [(row, cells) for row, cells in tables['5.3d'] if cells.get('C') in ('1', '2') and cells.get('N')]
    require(len(item_rows) == 23208, 'Unexpected state-sector-item row count; review the new source release')
    seen = set()
    all_items = {}
    states = {}
    strata = []
    totals = {'rural': ZERO, 'urban': ZERO}
    for row_number, r in item_rows:
        sector = {'1': 'rural', '2': 'urban'}[r['C']]
        key = (r['A'], sector, r['E'])
        require(key not in seen, f'Duplicate weight stratum: {key}')
        seen.add(key)
        contribution = Decimal(r['N'])
        state_share = Decimal(r['O'])
        require(contribution >= 0 and state_share >= 0, f'Negative weight on row {row_number}')
        # Expert Group report, Annexure 5.2 p.82: sixth digit is goods (1) or services (2).
        kind_code = r['E'].split('.')[-2]
        require(kind_code in ('1', '2'), f'Unknown goods/services code on row {row_number}')
        identity = dict(id=r['E'], code=r['E'], name=r['D'], kind={'1': 'goods', '2': 'services'}[kind_code],
                        division={'code': r['L'], 'name': r['M']},
                        group={'code': r['J'], 'name': r['K']},
                        **{'class': {'code': r['H'], 'name': r['I']}},
                        subclass={'code': r['F'], 'name': r['G']})
        if r['E'] in all_items:
            require(all_items[r['E']]['identity'] == identity, f'Conflicting item identity: {r["E"]}')
        else:
            all_items[r['E']] = {'identity': identity, 'rural': ZERO, 'urban': ZERO, 'sourceRows': 0}
        all_items[r['E']][sector] += contribution
        all_items[r['E']]['sourceRows'] += 1
        totals[sector] += contribution
        state = states.setdefault(r['A'], {'code': r['A'], 'name': r['B'], 'rural': ZERO, 'urban': ZERO})
        require(state['name'] == r['B'], 'Conflicting state name')
        state[sector] += contribution
        strata.append({'stateCode': r['A'], 'sector': sector, 'itemCode': r['E'],
                       'combinedWeight': float(contribution), 'withinStateCombinedWeight': float(state_share),
                       'sourceRow': row_number})
    require(len(all_items) == 358, 'Expected all 358 weighted CPI items')
    require(sum(i['identity']['kind'] == 'goods' for i in all_items.values()) == 308, 'Expected 308 goods and 50 services')
    require(len(states) == 36, 'Expected 36 states/UTs')
    require(abs(sum(totals.values()) - HUNDRED) < Decimal('0.00000001'), 'All-India weights do not sum to 100')
    def weights(rural, urban):
        return {'rural': float(rural / totals['rural'] * HUNDRED),
                'urban': float(urban / totals['urban'] * HUNDRED),
                'combined': float(rural + urban)}
    items = []
    hierarchy = {name: {} for name in ('division', 'group', 'class', 'subclass')}
    for code, entry in sorted(all_items.items()):
        item = dict(entry['identity'], weights=weights(entry['rural'], entry['urban']),
                    combinedContributions={sector: float(entry[sector]) for sector in totals},
                    stateSectorCount=entry['sourceRows'])
        items.append(item)
        for level in hierarchy:
            label = item[level]
            group = hierarchy[level].setdefault(label['code'], {**label, 'rural': ZERO, 'urban': ZERO, 'itemCount': 0})
            require(group['name'] == label['name'], f'Conflicting {level} name')
            group['rural'] += entry['rural']
            group['urban'] += entry['urban']
            group['itemCount'] += 1
    # Reconcile to independent control tables, retaining full source precision.
    division_controls = {r['A']: r for _, r in tables['5.3a'] if r.get('A') in {v['name'] for v in hierarchy['division'].values()}}
    for div in hierarchy['division'].values():
        control = division_controls[div['name']]
        for sector, col in [('rural', 'B'), ('urban', 'C')]:
            require(abs(div[sector] - Decimal(control[col])) < Decimal('0.00000001'), f'Division control mismatch: {div["code"]} {sector}')
    state_controls = {r['A']: r for _, r in tables['5.3c'] if r.get('A') in states}
    for state in states.values():
        for sector, col in [('rural', 'C'), ('urban', 'D')]:
            require(abs(state[sector] - Decimal(state_controls[state['code']][col] or '0')) < Decimal('0.00000001'), f'State control mismatch: {state["code"]} {sector}')
    def level_output(level):
        return [{**{k: v for k, v in entry.items() if k not in ('rural', 'urban')},
                 'weights': weights(entry['rural'], entry['urban']),
                 'combinedContributions': {sector: float(entry[sector]) for sector in totals}}
                for _, entry in sorted(hierarchy[level].items())]
    metadata = {
        'schemaVersion': 1, 'baseYear': 2024, 'weightReference': 'HCES 2023–24',
        'sourceUrl': SOURCE_URL, 'sourceArchive': ARCHIVE,
        'sourceTitle': 'MoSPI Expert Group Report — Annex 5.3: CPI 2024 weights',
        'sourceSha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        'retrievedAt': retrieved_at, 'sourceSheet': '5.3d', 'sourceRange': 'A5:O23212',
        'itemCount': len(items), 'stateCount': len(states), 'stateSectorItemCount': len(strata),
        'sectorShares': {sector: float(total) for sector, total in totals.items()},
        'weightUnit': 'percent',
        'normalization': 'Combined: sum Share in All India (column N) over all states and sectors per item. Rural/urban: sum column N for that sector and item, divided by the all-item sector total, multiplied by 100.',
        'definitionNote': 'Item names and COICOP hierarchy identify expenditure categories, not a single nationally identical product specification or rupee price. Source workbook does not disclose individual outlet quotations.',
        'itemKindSource': 'Expert Group Report, Annexure 5.2, printed page 82: the sixth code digit is goods (1) or services (2).',
        'stateSectorWeightsArchive': '/data/inflation/cpi-state-item-weights.json',
    }
    basket = {'metadata': metadata, 'items': items,
              'divisions': level_output('division'), 'groups': level_output('group'),
              'classes': level_output('class'), 'subclasses': level_output('subclass'),
              'states': [{'code': state['code'], 'name': state['name'],
                          'combinedContributions': {sector: float(state[sector]) for sector in totals},
                          'combinedWeight': float(state['rural'] + state['urban'])}
                         for _, state in sorted(states.items())]}
    require([len(basket[k]) for k in ['divisions', 'groups', 'classes', 'subclasses']] == [12, 43, 92, 162], 'Unexpected classification counts')
    stratum_output = {'metadata': metadata, 'records': strata}
    return basket, stratum_output

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--input', type=Path, default=ROOT / 'public' / ARCHIVE.lstrip('/'))
    ap.add_argument('--retrieved-at', help='Actual UTC retrieval timestamp; required for writing a new extraction')
    ap.add_argument('--check', '--verify', dest='check', action='store_true', help='Verify the committed JSON reproduces from the archived workbook without modifying files')
    ap.add_argument('--output', type=Path, default=ROOT / 'src/data/inflation/cpi-basket.json')
    ap.add_argument('--strata-output', type=Path, default=ROOT / 'public/data/inflation/cpi-state-item-weights.json')
    args = ap.parse_args()
    retrieved = args.retrieved_at
    if args.check and not retrieved:
        retrieved = json.loads(args.output.read_text())['metadata']['retrievedAt']
    if not retrieved:
        ap.error('--retrieved-at is required when creating an extraction')
    timestamp = dt.datetime.fromisoformat(retrieved.replace('Z', '+00:00'))
    require(timestamp.tzinfo is not None, 'Retrieval timestamp must include a timezone')
    basket, strata = extract(args.input, retrieved)
    for destination, value in [(args.output, basket), (args.strata_output, strata)]:
        if args.check:
            require(json.loads(destination.read_text()) == value, f'Archived workbook does not reproduce {destination}')
        else:
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    print(f'Extracted {len(basket["items"])} CPI items, {len(strata["records"])} state-sector weights; all classification and total controls passed.')

if __name__ == '__main__':
    main()
