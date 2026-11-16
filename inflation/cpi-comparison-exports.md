# Complete CPI comparison evidence and downloads

The official October 2026 and October 2025 indices are retrieved from the [MoSPI CPI API](https://api.mospi.gov.in/api/cpi/getCPIData?base_year=2024&series=Current&year=2026,2025&month_code=10&state_code=1&sector_code=1,2,3&limit=100). The archived JSON preserves all 41 response pages, request URLs and retrieval timestamps. It contains 4,008 observations, paired into 2,004 rows covering the general index, every classification level, all 358 items, and all three sectors.

`src/data/inflation/cpi-official.json` records the exact archive SHA-256 and is reproduced by `inflation/collect_official.py`. Official indices are dimensionless and do not disclose the underlying rupee prices. The current headline is provisional; source metadata explains that the status comes from the MoSPI release rather than per-row API fields.

Offline verification is part of the build:

```sh
python3 inflation/extract_basket.py --verify
python3 inflation/collect_official.py --verify
```

The official verifier checks successful responses, contiguous complete pages, fixed source queries, retrieval timezones, unique item/sector/year observations, both reference years, matching classification, all 358 item codes in each sector, and positive finite index levels. It then recomputes the general index and every division, group, class and subclass from the weighted official item indices, separately for each sector and year. A tolerance of 0.01 index point accounts for the two independent rounding steps: item indices and published aggregates are each rounded to two decimal places. This checks consistency of the published series; it does not independently validate its underlying prices.

The exporter runs after the main static build:

```sh
npx tsx scripts/export-cpi-replica.ts
```

It writes these files under `dist/data/inflation/`:

- `cpi-basket.json` and `cpi-basket.csv`: complete basket, hierarchy, weights and provenance. The JSON is an exact copy of the source dataset; `basket.json` is an alias.
- `cpi-official.json`: exact paired official indices and provenance; `official.json` is an alias.
- `independent-quotes.json`: exact independent quotation evidence inventory, including limitations and source archives.
- `cpi-ledger.csv` and `cpi-comparison.json`: one row for each of the 358 items, all three sector weights and official current/prior index levels and annual inflation, plus independent quote counts and sources. `cpi-comparison.csv` aliases the ledger. Independent indices remain blank in CSV and null in JSON while complete eligible panels are unavailable. Quote counts are discovery coverage, not national index coverage.
- `cpi-collection-template.csv`: 358 rows with official item identity prefilled and blank matching, geography, period, price and source fields.
- `cpi-collection-template-readme.txt`: instructions to repeat item rows across sampled states, sectors, markets, outlets, specifications and monthly periods. One row per item is not a national sampling frame.
- `cpi-method.md`: the documented official method and the implementation's scope, copied from `inflation/CPI_METHOD.md` with public archive links.

The export calls the replica publication gate with no completed item panels. It fails if the quotation inventory starts claiming eligibility or a national figure, requiring explicit integration and review of the corresponding completed panel evidence first. Isolated provider annual comparisons remain provider comparisons, never national item indices.

Validation tests run with:

```sh
python3 -B -m unittest discover -s inflation -p 'test_*.py'
```
