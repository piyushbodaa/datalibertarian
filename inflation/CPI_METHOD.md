# CPI 2024 replication specification

This project uses the complete official 358-item expenditure basket and implements the published elementary and higher-aggregation arithmetic. It has **not collected the independent matched price panel needed to calculate an independent Indian CPI**. Reproducing an aggregate from published official item indices checks the arithmetic; it is not independent price measurement, and does not establish that either series is more accurate.

Primary source: MoSPI, [Report of the Expert Group on Comprehensive Updation of Consumer Price Index](https://www.mospi.gov.in/uploads/documents/documents/1770882257889-Expert_Group_Report_CPI.pdf). [Archived PDF](../public/data/inflation/sources/cpi-2024-expert-report.pdf), [provenance and SHA-256](../public/data/inflation/sources/cpi-2024-expert-report.source.json). All page references below are **printed report pages**, not PDF viewer positions. The archive SHA-256 is `9d36f63d6f25c111df021d0c264a6f1a77efba78ffe319f36348487b7814d6af`.

## Basket, periods and geographical structure

- There are 358 weighted expenditure items, including 308 goods and 50 services. The official collection frame includes 1,465 rural markets, 1,395 urban markets and 12 online markets (§2.1, pp.7–8). The geographical sampling and outlet selection rules are in §§4.3–4.4. A quotation from an unspecified online shop cannot stand in for all these panels.
- Prices were collected from January to December 2024. The geometric mean of the 12 monthly prices forms a quotation's base price, with comparable specifications maintained through the base year (§4.5, pp.46–49). An independently observed first price in 2026 cannot simply be labelled `2024=100`.
- Expenditure weights come from HCES 2023–24, a different period from the 2024 price base. This matters for the name and interpretation of the aggregation formula (§4.6.2, pp.52–54).
- A weighted item is an expenditure category, not necessarily one priced specification. For example, Pears/Nashpati is one weighted item but two separately priced items. Where separate expenditure shares are unavailable, those priced-item indices receive equal weight; administrative items can instead use the prescribed revenue/customer proxy weights (§4.6.3, pp.54–55).
- The 8-digit item code identifies division, group, class, subclass, goods/services (`1`/`2`) and the item serial number (Annexure 5.2, p.82). Do not infer an identical brand, pack size or quality from a weighted-item code.

The official Annex 5.3 workbook is archived separately and extracted by `inflation/extract_basket.py`. `src/data/inflation/cpi-basket.json` contains all 358 item weights and hierarchy. `/data/inflation/cpi-state-item-weights.json` retains 23,208 source state × sector × item records; the original state codes must not be confused with the MoSPI API's state codes. Combined weights are all-India expenditure contributions. Rural and urban item weights each sum to 100 within their sector, and have to be combined using the official sector expenditure shares, not 50/50 shares. State-level item weights are needed before computing a national item index from independent state panels.

## Elementary calculation: short Jevons chain

For one priced item in a state × rural/urban sector panel, use comparable current- and previous-month quotation pairs (§4.6.1, pp.50–52):

```text
relative(q,t) = price(q,t) / price(q,t−1)
link(t)       = exp(mean(log(relative(q,t))))
index(t)      = index(t−1) × link(t)
```

Preserve outlet, specification, quantity/unit, reference month and source evidence for each pair. Prices must represent the same collected specification across the two months; product upgrades, changing pack sizes and changing shops must not create arbitrary price comparisons. The previous index must have a documented chain anchored to the 2024 base. Daily national average prices from a separate monitor are useful price evidence, but are neither the same monthly matched-quotation sample nor independent retail collection by this project.

`compileJevonsLink` implements this monthly calculation for an explicitly supplied quotation panel. It rejects nonconsecutive reference months, mismatched specifications/outlets/pack sizes, invalid prices, duplicates and missing previous indices. It does not create the panel, certify its geographical representativeness, initialise a base-year chain, or automate specialist item subweights.

## Missing quotations and replacement

The official CPI **does impute temporarily unavailable prices**. It does not simply drop every missing item or withhold every national index (§4.6.4, pp.55–57). In CPI 2024 the item weight stays in the basket:

1. For a temporary missing quotation, apply the available comparable movement within the elementary panel. The report's worked example uses the geometric mean of the other observed relatives (§4.6.6, pp.59–62).
2. If the item has no available quotations, use a documented comparable higher aggregate's current/previous movement, excluding the missing item as prescribed. Imputation continues until observations reappear.
3. For administered prices, use the last observed price until an official revision is notified and implemented. Specialist sections refine these rules; see below.
4. Permanent disappearance requires replacement and appropriate linking, not indefinite imputation. A replacement with a comparable overlap pair can be linked. Without that overlap, impute the replacement month and wait until two consecutive new-specification quotations are available (§4.6.5, pp.57–59).

The helper requires explicit temporary-missing records and a documented donor/carry-forward basis. It exposes observed and imputed counts and treatment per quotation. It deliberately does not treat a wrongly dated or zero price as an approved temporary absence. Its fixed-panel interface can accept reviewed overlap pairs; panel maintenance, replacement decisions and historical imputed-price persistence remain collection-pipeline responsibilities.

The site's full-basket publication gate is a **project evidence requirement**, not a claim that MoSPI refuses to publish with imputed prices. With no initial independent observations, no independently anchored previous index and no eligible independent donor aggregates, imputing every entry would not produce an independent CPI. A complete independently compiled panel may include documented official-method imputations.

## Higher aggregation and annual inflation

Use the Young / Modified Laspeyres formula, a fixed-expenditure-weight arithmetic mean of child **index levels** (§4.6.2, pp.52–54):

```text
aggregateIndex(t) = sum(weight(i) × index(i,t)) / sum(weight(i))
annualInflation   = 100 × (aggregateIndex(t) / aggregateIndex(t−12) − 1)
```

Apply the correct shares through priced item → weighted item → subclass → class → group → division, state/sector and all-India aggregation. A fixed-weight mean of item annual inflation rates generally gives a different result from the ratio of the two aggregate levels. Do not silently renormalise the covered portion of the basket into a national headline.

`aggregateYoung` takes the **complete expected child set**, with nulls for unavailable indices. It returns current and annual coverage measured by expenditure weight, current and year-ago levels when calculable, and annual inflation only when both complete aggregate levels exist. Zero-weight children are excluded. It accepts weights on any consistent scale, so it also supports proper hierarchical aggregation.

The fixture tests combine all 358 published official item indices with the exact workbook weights, separately for rural, urban and combined, and reproduce official headline levels within the two-decimal source rounding. This verifies the aggregation of official results, not the unpublished underlying price collection or an independently observed inflation rate.

## Specialist compilation requirements

The generic Jevons/Young primitives are necessary but insufficient to implement these categories. Their data collection and subweight pipelines are **not yet implemented**:

| Category | Required treatment and inputs | Source |
|---|---|---|
| Housing | Separate rural/urban and rented/owner-occupied components. Rental equivalence for owners; 1, 2, 3 and 4+ room categories; Census 2011 dwelling category shares and HCES rented/owner shares. Exclude government/employer dwellings. Six-month dwelling rotation with visits for expected rent revisions. | §4.6.8, pp.64–67 |
| PDS | State/sector category weights for APL/BPL/AAY/SFSS/PHH. Exclude categories free in the base or with no weight. Specific zero/missing-price imputation; all missing carried forward. | §4.6.9, p.67 |
| Rail | Train/class/distance slab prices and revenue proxy weights. Single all-India rail index applied across states; restricted-index donor movement for missing slabs, carry-forward when all missing. Delhi metro is a separate priced item equally weighted with rail within Delhi's rail weighted item. | §4.6.10, pp.68–71 |
| Postage/couriers | Four priced components with equal weights. Three India Post components use uniform national tariffs; non-India-Post courier charges use local markets. Missing movement and administered carry-forward as specified. | §4.6.11, p.71 |
| Streaming | Six named major platforms, up to two base plans each, one-month plans or nearest available validity. Chain geometric mean relatives with missing-platform imputation, and carry-forward if every platform price is unavailable. | §4.6.12, pp.71–72 |
| Electricity | Per-DISCOM total bills at 100/200/300/400 units, including meter/fixed charges; exclude free slabs. CERC domestic-consumer distribution subweights. Specific slab imputation and all-missing carry-forward. | §4.6.13, pp.72–73 |
| Telecom | BSNL, Jio, Vi and Airtel specified prepaid/postpaid plans; normalize tariffs to price per day of validity. TRAI 2023–24 operator/LSA and prepaid/postpaid subscriber shares. Rules for discontinued plans and missing observations. | §4.6.14, pp.73–74 |
| Petrol/diesel/LPG | PPAC's reference-month 15th-day unbranded petrol/diesel quotations from PSU outlets; rural/urban treatment. Domestic non-subsidised 14.2 kg LPG, excluding 5/10 kg cylinders. | §4.6.15, p.75 |

## Evidence gate and remaining collection work

`auditReplicaCoverage(basket.items, evidence, referenceMonth, sector)` requires all 358 unique basket items and sector weights totaling 100%; a filtered basket is rejected. It accepts only records explicitly marked as independently compiled panels, for the same month and year-ago month, on the 2024 base, with complete state/sector aggregation, specialist subweights, an anchored chain, positive index levels and an evidence trail. The boolean audit fields are assertions for a reviewed collection pipeline; they do not independently prove accuracy. Official-index inputs and individual spot quotations are rejected as independent full-item evidence.

To publish a defensible independent national series, the collection system still needs: a documented representative market/outlet panel; repeated comparable quotes and historical base/chain data; full state/sector allocation; audited missing/replacement treatment; category-specific provider/dwelling/slab data; and retained receipts/tariff evidence with review records. Accuracy requires validation of sampling, measurement, classification and processing errors. Agreement or disagreement with official CPI alone does not establish accuracy.

The public MoSPI material retrieved for this release contains basket weights, methodology and published indices. The dissemination specification itself describes item-level indices and inflation rates (§4.7.8, pp.78–79). **A complete public outlet × specification × month rupee-quotation file was not obtained.** Published dimensionless indices cannot be inverted into unique retail rupee prices. The interface must therefore display unavailable price evidence honestly rather than converting an index of 110 into a price of ₹110.

Validation: `npx tsx --test src/data/inflation/cpi-replica.test.ts`.
