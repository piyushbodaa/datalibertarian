# Complete CPI 2024 basket: source and extraction

The 358 weighted items in `src/data/inflation/cpi-basket.json` are extracted from the Ministry of Statistics and Programme Implementation's [Annex 5.3 workbook](https://www.mospi.gov.in/uploads/documents/documents/1769670019171-Annex_5.3.xlsx), accompanying its Expert Group report on comprehensive updation of CPI. No item names or weights were generated or approximated.

The original downloaded workbook is archived unchanged at `public/data/inflation/sources/cpi-2024-annex-5.3.xlsx`. It was retrieved at **2026-11-16T16:41:16+00:00**. SHA-256: `cae0f770cdace596929a1ccb89d2b4bca15c573accf9fa06a17222ce2be9b80d`. The source's release timestamp in its URL is not the retrieval date.

## What the workbook supplies

- Sheet **5.3a**: All-India division weights.
- Sheet **5.3b**: All-India group weights.
- Sheet **5.3c**: State/UT contributions to rural, urban, and combined expenditure.
- Sheet **5.3d**, **A5:O23212**: 23,208 state × sector × item records, covering 358 unique item codes and 36 states/UTs. Each record supplies item name, COICOP division/group/class/subclass, contribution to All-India expenditure (column N), and share within the state's combined expenditure (column O).

The hierarchy contains **12 divisions, 43 groups, 92 classes, and 162 subclasses**. The extractor checks those counts, unique state-sector-item keys, consistent labels, non-negative weights, and the total of all column N weights. It reconciles division and state totals against independent workbook sheets. Chandigarh has no rural weight rows; its blank rural control cell is reconciled to the absence of rural expenditure contribution, not treated as a missing observed price.

Each item's `kind` follows the explicit coding rule in the [Expert Group report](https://www.mospi.gov.in/uploads/documents/documents/1770882257889-Expert_Group_Report_CPI.pdf), Annexure 5.2, printed page 82: the sixth digit is **1** for goods and **2** for services. This yields **308 goods and 50 services**. The report is archived at `public/data/inflation/sources/cpi-2024-expert-report.pdf`.

## Correct normalization

The rural and urban values in the source tables are contributions to **combined** All-India expenditure. They do not each sum to 100. Their totals are:

- Rural: **55.41920562300627%** of combined expenditure.
- Urban: **44.58079437699342%** of combined expenditure.

For each item, sum column N over all states and both sectors to get its `weights.combined`. Divide its rural column N sum by the all-item rural sum, then multiply by 100, to obtain `weights.rural`. Apply the analogous normalization for `weights.urban`. Each normalized sector basket sums to 100%. Full source precision is retained during Decimal aggregation; JSON numbers are converted to floating-point only after aggregation.

The source contributions are also retained as `combinedContributions.rural` and `.urban`, so normalization is reversible. Rice, for example, has combined weight **2.013186374446197%**, rural within-sector weight **2.3086639214528732%**, and urban within-sector weight **1.64587279999373%**.

These are base expenditure weights derived from **HCES 2023–24** for the **2024=100** series. They are not prices, price relatives, current expenditure shares, or evidence of any item’s inflation.

## State-sector detail

`public/data/inflation/cpi-state-item-weights.json` retains all 23,208 state-sector-item records. `combinedWeight` is column N; `withinStateCombinedWeight` is column O. Each record has its original worksheet row number. State codes in this workbook are source codes; do not assume another portal or API uses the same numeric mapping. State labels are retained in the main basket file.

The state detail is an external download rather than an application import. It supports transparent reconstruction of the geographic weighting stage without loading all strata into the browser bundle.

## Reproduce and verify

Read-only extraction uses Python's standard library: ZIP/XML parsing of XLSX, and Decimal arithmetic. It does not recalculate or modify the workbook.

```sh
python3 inflation/extract_basket.py --check
```

`--verify` is an alias for `--check`; both work offline and compare both generated JSON files with the archived source.

To reproduce the committed outputs explicitly:

```sh
python3 inflation/extract_basket.py \
  --retrieved-at 2026-11-16T16:41:16+00:00
```

A newly downloaded source or changed reference date must not overwrite the existing evidence or its retrieval timestamp without a documented revision.

## What remains outside this source

Item names identify expenditure categories, not one nationally uniform product/service with one rupee price. The workbook does not provide individual outlet prices, brand/quality specifications, monthly base-year quote panels, or current and previous-year monthly prices. Those data cannot be inferred from weights. The official price-collection and aggregation methodology is documented separately in the Expert Group report; independent replication requires matching its geographic, product, timing, and special-item procedures.
