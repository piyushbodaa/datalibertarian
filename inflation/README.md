# Data Libertarian Essentials Index — source and extraction record

This release is a privately calculated index of 22 food essentials. The underlying prices are collected by government agencies. It does not independently collect prices and does not establish that India's official CPI is inaccurate. It does not estimate all household living costs.

## Evidence used in the 16 November 2026 release

The Department of Consumer Affairs (DoCA), Price Monitoring Division [daily retail report](https://fcainfoweb.nic.in/Reports/DB/DBprices.aspx) was downloaded on 16 November 2026. The exact retrieval timestamp (recorded from the downloaded file), SHA-256, and archived source location are stored in `src/data/inflation/private-snapshot.json`.

The report itself prints all comparator dates:

| Column | Date | Meaning |
| --- | --- | --- |
| Price As On | 16 November 2026 | Current daily all-India average retail price |
| 1 Month back | 16 October 2026 | Prior daily price, not an October monthly average |
| 1 Year back | 16 November 2025 | Prior daily price, not a November monthly average |

The extraction uses the price before the parenthesized percentage in each cell. Percentages are recalculated from prices; the report's rounded percentage is not an input. Each of the 22 members has all three positive prices in this snapshot. No values are imputed. Milk is rupees per litre; all other basket members, including packed oils, are rupees per kilogram, as printed in the detailed report. The report's generic homepage heading must not override item units.

Raw source bytes are retained in `public/data/inflation/sources/pmd-retail-2026-11-16.html.txt`, with a sibling `.sha256` checksum. The `.txt` suffix deliberately serves the downloaded HTML as text rather than running third-party scripts. The source URL is mutable, so the archive is the evidence for this release.

The fixed membership is the traditional PMD set: rice, wheat, atta, gram dal, tur dal, urad dal, moong dal, masoor dal, groundnut oil, mustard oil, vanaspati, soya oil, sunflower oil, palm oil, potato, onion, tomato, sugar, gur, milk, loose tea, and iodised salt. The unadjusted `Gram Dal` row is used; the alternative Bharat Dal adjusted row is not counted as a second commodity. Additional newer commodities are excluded by the membership definition, not by whether their prices rose or fell. This basket gives oils six of 22 equal base-expenditure shares; it is not a household spending survey.

## Official benchmark

The [MoSPI release published by PIB on 12 November 2026](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2335416&lang=1&reg=3) reports October 2026 CPI Combined inflation of **6.09%** and Consumer Food Price Index inflation of **8.94%**, both provisional, with base 2024=100. Combined CPI index is 110.05 and CFPI index is 113.23. The downloaded release is retained as `public/data/inflation/sources/cpi-october-2026-pib.html.txt`, with checksum and provenance in the snapshot.

These are October monthly comparisons with October 2025. The private basket is a 16 November daily comparison with 16 November 2025. Different periods, coverage, weights, and sampling mean their numerical gap cannot be interpreted as government measurement error. Do not combine base-2012 and base-2024 CPI levels.

## Calculation and interpretation

The published basket assigns ₹100 of expenditure to each commodity at the 16 November 2025 price, total ₹2,200. That fixes quantities `q_i = 100 / p_i,base`. Its index at date `t` is `100 × sum(q_i × p_i,t) / 2200`. The 12-month change is `100 × (I_current / I_base − 1)`. The one-month change uses those same quantities at both current and prior-month prices: `100 × (I_current / I_priorMonth − 1)`.

The current data imply 14.5954959644% year-on-year for this particular equal base-expenditure basket. This is a calculation from observed prices and an explicit weighting convention, not a claim that India's total inflation is 14.60%. Visitors may choose different spending weights; those results are scenarios based on this same limited price sample.

A missing or nonpositive input must not become zero inflation. Suppress an affected fixed-basket result and report coverage. Do not silently renormalize remaining members. Do not annualize the one-month result. Three dated observations do not support a monthly time series; do not fabricate intervening values.

The [DoCA description of price monitoring](https://consumeraffairs.gov.in/pages/price-monitoring-division) identifies State Civil Supplies Departments as sources. National average prices can shift with reporting-centre composition and item varieties. This snapshot contains no centre-level sample panel, so that effect cannot be measured here. Single-day comparisons are noisy. Housing, fuel, health, education, transport, services, and other consumption are excluded.

## Reproduce and refresh

The collector uses Python's standard library and is independent of the web application:

```sh
python inflation/collect.py
```

It fetches the current PMD report, validates the header dates, item membership and units, archives the original bytes with a SHA-256, and writes `inflation/candidate.json`. It never changes the published snapshot automatically. Missing prices become `null`, never fabricated prices. Changed bytes for an already archived date cause a failure so revisions can be preserved and reviewed.

To reproduce this release's 22 rows from archived evidence:

```sh
python inflation/collect.py \
  --input public/data/inflation/sources/pmd-retail-2026-11-16.html.txt \
  --retrieved-at 2026-11-16T16:14:07+00:00 \
  --output /tmp/inflation-reproduced.json
```

The collector does not scrape CPI automatically. Verify each official release separately, preserve its period/status/source, and add its metadata before promotion. Reconcile the candidate against source rows and compare it with the prior release. Keep old archives and expose the observation date; a failed update must retain the last verified snapshot with its original date.

For subsequent daily readings of the same index, retain the original 16 November 2025 base quantities. The report's `1 Year back` column rolls with the current date. Reassigning ₹100 per commodity at each moving year-ago date would create changing baskets; such readings must not be spliced into a continuous fixed-basket series. The build/export guard rejects a changed base date or changed membership; a rebasing decision requires a documented new series version.

A representative private all-items national index would additionally need independently observed matched products/outlets across rural and urban locations, spending weights, non-food and service coverage, quality/pack-size controls, a missing-price policy, sample coverage and uncertainty reporting, and enough historical observations for aligned monthly comparisons. Those data are not present in this release.

## Build-time evidence verification

```sh
python3 inflation/verify.py
python3 -m unittest discover -s inflation -p 'test_*.py'
```

The offline verification gate reproduces every PMD row and all extraction metadata from the archived bytes, verifies both sources' SHA-256 values and sidecars, and parses the official CPI release's period, base year, status, release date, rates, and combined index values. It also checks that the headline prose agrees with the summary table and duplicate desktop/mobile copies agree. Changes to dates, units, membership, prices, evidence hashes, or official benchmark fields stop the gate when they no longer match the sources.
