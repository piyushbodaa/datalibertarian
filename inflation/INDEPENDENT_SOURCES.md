# Independent price collection

This collection contains **34 published retailer/provider quotes for 29 of the 358 CPI item categories, across 11 divisions**. It was retrieved on **16 November 2026**. There is currently **no independently measured all-India index or inflation rate**: no item has the complete reference-year price chain and representative geographical sample required for that result. The retrieved evidence includes tariffs with stated effective dates and a restaurant menu with unverified current validity; retrieval does not make every price contemporaneous.

The quotes are in `src/data/inflation/independent-quotes.json`. Evidence and its SHA-256 manifest are in `public/data/inflation/sources/independent/`. Each quote maps to an actual item code in the official 2024 basket. One branded offer is an example within an item category, not a representative price for that entire category.

These are directly collected seller/provider prices. Government CPI item indices and the Department of Consumer Affairs Price Monitoring Division averages are **not** counted as independent quote coverage. “Independent” describes collection outside those statistical series; it does not establish that an offered price is what a representative household actually paid.

## Observed prices

| Provider | Specified product or service | Published price | Evidence scope |
|---|---|---:|---|
| BigBasket | Amul Taaza toned milk, 1 L Tetra Pak | ₹77 | Locality unspecified |
| BigBasket | Aashirvaad Select MP Sharbati atta, 5 kg | ₹310 | Locality unspecified; ₹326 MRP |
| BigBasket | Tata iodised salt, 1 kg | ₹28 | Locality unspecified |
| BigBasket | bb Popular red raw rice, 1 kg | ₹79 | Locality unspecified; ₹80 MRP |
| BigBasket | bb SUPER SAVER sugar, 1 kg | ₹55 | Locality unspecified |
| BigBasket | Surf Excel Easy Wash powder, 5 kg | ₹705 | Locality unspecified; ₹780 MRP |
| BigBasket | Colgate Strong Teeth toothpaste, 200 g | ₹125 | Locality unspecified |
| BigBasket | Clinic Plus Strength & Shine shampoo, 650 ml | ₹572 | Locality unspecified; ₹880 MRP |
| Tata 1mg | Dolo 650 mg, 15 tablets | ₹29.70 | Page displayed Gurgaon; ₹32.28 MRP |
| IKEA India | MARIUS white stool, article 301.840.50 | ₹449 | Delivery and assembly excluded |
| Netflix India | Mobile / Basic / Standard / Premium | ₹149 / ₹199 / ₹499 / ₹649 per month | Four different service specifications |
| Decathlon | Domyos men's white T-shirt, product 8667940 | ₹199 | Size and stock unverified; ₹399 MRP |
| Decathlon | Domyos women's pink T-shirt, product 8888185 | ₹199 | Size and stock unverified; ₹399 MRP |
| Decathlon | Kipsta Mini Football Sunny 300 | ₹129 | Current page product ID 8949353 differs from URL ID |
| Decathlon | Btwin My Bike, product 8865743 | ₹6,999 | Single speed; frame size and stock unverified |
| Apollo Diagnostics | CBC / fasting glucose / thyroid profile | ₹395 / ₹90 / ₹670 | Hyderabad; collection charges unverified |
| DPS Raj Nagar Extension | Class I standard tuition | ₹38,400 per quarter | School's 2026–27 fee table |
| DPS Raj Nagar Extension | Class IX standard tuition | ₹38,400 per quarter | Same Classes I–XII fee band |
| DPS Raj Nagar Extension | School bus, GZB CITY-A zone | ₹11,400 per quarter | 2026–27 tariff; June exemption needs separate treatment |
| MK Retail | Nivea body milk, 120 ml | ₹130 | Tax included; delivery locality unverified |
| MK Retail | Nivea Frangipani shower gel, 125 ml | ₹110 | Tax included; delivery locality unverified |
| BigBasket | Whisper Ultra XL+, 30 pads | ₹315 | Locality unspecified; ₹420 MRP |
| BigBasket | Dettol hand sanitizer, 500 ml | ₹250 | Locality unspecified |
| BigBasket | Pampers Premium Care Large pants, 44 pieces | ₹764 | Locality unspecified; ₹1,499 MRP |
| Naturals | Classic haircut, non-member guide price | ₹450 | No branch selected; taxes unspecified |
| IGL | Delhi domestic piped gas | ₹50.59 per SCM | Tariff effective 2 September 2026; full bill unverified |
| IGL | Delhi compressed natural gas | ₹86.98 per kg | Tariff effective 29 August 2026; no matched October panel |
| Taj Tirupati | Southern Spice vegetarian thali | ₹2,200 | Taxes extra; undated menu title identifies 2025 |
| Taj Tirupati | Paniyaram, 260 g serving | ₹650 | Taxes extra; current validity unverified |

The ten additional examples and their exclusions are documented in [EXTRA_PRICE_SOURCES.md](EXTRA_PRICE_SOURCES.md). All 34 records live in the same canonical JSON file; there is no separate staged dataset.

The JSON links each row to its primary source and the local evidence file. Published discounts are retained separately from MRP. First-order coupons, paid memberships, payment-card promotions, and conditional bulk-buy prices are not substituted for the ordinary displayed offer. Tax inclusion is recorded only when the captured source states it; other transaction charges remain explicitly unverified.

The goods quote date is a **retrieval date**, not a purchase date or proof of a monthly average. The BigBasket extracts report web-crawler freshness ranging from the same day to two weeks earlier. No November quote is assigned to October 2026, October 2025, or the 2024 base period.

## A real provider fee comparison

The [DPS Raj Nagar Extension fee page](https://dpsrnext.com/admission/fee-structure) publishes three academic-year tables together. For the standard Classes I–XII band, quarterly tuition is ₹33,000 in 2024–25, ₹35,970 in 2025–26, and ₹38,400 in 2026–27. The last change is:

`100 × (38,400 / 35,970 − 1) = 6.7556296914%`

This maps to primary and secondary tuition as **two CPI categories using the same school fee band**, not two independent schools. The JSON names Class I and Class IX as the fixed comparison specifications. The source specifies quarterly collection in April, July, October and January. Admission and examination charges, transport, and sibling concessions are separate from the quoted standard tuition.

For the school's GZB CITY-A bus zone, the published quarterly tariff rises from ₹11,100 in 2025–26 to ₹11,400 in 2026–27, or **2.7027027027%**. The current schedule exempts June; multiplying the quarterly tariff by four would misstate its annual bill.

These are **provider-level academic-year tariff changes**. They are not estimates of India's education or transport inflation. No paid receipts, independent service-quality assessment, representative school sample, or complete calendar-2024 average have been obtained. The national-index eligibility flag remains false even where these comparisons exist.

## Evidence captured and rejected

HTML captures are saved with `.html.txt` so the public evidence link is inert text. The IKEA and two MK Retail captures are sanitized copies: embedded Google API key candidates have been replaced with a redaction marker. Their source records retain the original response hash and size, the transformation name and redaction count; the current SHA-256 and byte count cover the sanitized public bytes. Prices and other visible source text are unchanged. These three files are labelled `sanitized-fetched-html`, not complete original responses. The other HTML captures retain their original response bytes. The Taj restaurant menu is retained as its original image-only PDF; its prices and serving sizes were visually checked on pages 2 and 3.

Use the [evidence capture and publication checks](EVIDENCE_SAFETY.md) for future captures. An inert text extension prevents script execution; it does not conceal embedded credentials. Sanitizing a current copy does not revoke a key or erase historical commits and previously deployed copies.

BigBasket returned HTTP 403 to the direct download. Its primary product pages were readable through the web tool. Its eleven archived `.observed-facts.json` files explicitly contain **transcribed facts from those opened pages**, not original HTML or receipts. IGL's two tariff observations are also explicitly transcribed: its direct HTTP response did not contain the tariff table read through the web tool. These hashes authenticate the fact sheets only. No access control was bypassed. Retail delivery locations were not inferred from corporate addresses and remain unknown where a locality was not verified.

Three additional primary documents were fetched in full and preserved as historical research evidence:

- [Jio's 27 June 2024 tariff announcement](https://www.ril.com/sites/default/files/2024-06/27062024_MR_Jio_introduces_new_unlimited_plans.pdf) records the 28-day, 2 GB/day plan changing from ₹299 to ₹349 effective 3 July 2024. A tariff start date does not prove continuity through every later month.
- [Jio's 3 September 2025 announcement](https://jep-asset.akamaized.net/cms/assets/pressrelease/3-september-2025.pdf) describes an anniversary bundle available from 5 September to 5 October. Its extras differ from later bundles, and the offer does not cover all of October 2025.
- [Colgate's September 2025 price list](https://www.colgateinvestors.co.in/pdf/revised-price-list-of-cp-india-portfolio.pdf) gives ₹149 and ₹130 as old/new MRP for a 200 g Strong Teeth pack. These are manufacturer MRPs. Comparing that ₹130 with today's BigBasket sale offer would mix different price concepts, outlets and dates.

These documents do not add national-index coverage. Current Jio and Airtel search extracts contained prices, but their opened/fetched plan pages did not expose the same complete plan cards. Those search-only quotes were not admitted to the current-price dataset. A historical IKEA catalogue, wholesale METRO catalogues, third-party price estimates, search-result snippets, and public invoices containing unrelated customers' personal information were also not admitted as independent consumer transactions.

## Collection needed for the whole basket

The full 358-row basket is the collection frame. Every unobserved item stays missing. This snapshot does not extrapolate a retailer offer to villages, replace missing services with food inflation, or renormalize observed items to 100% national coverage.

| Division | Practical collection source | Missing evidence to resolve |
|---|---|---|
| Food and beverages | Fixed outlet/SKU panels, local-market receipts, online listings with a delivery pincode | Local varieties, rural and urban outlets, seasonal replacement, standard quantities and monthly observations |
| Alcohol, tobacco and related goods | Lawful local retail receipts and published outlet schedules | Jurisdiction, brand/specification, taxes and transaction prices |
| Clothing and footwear | Retailer product variants and local shop/tailor receipts | Fixed size, fabric and quality; discount eligibility and product replacements |
| Housing, water, electricity and fuels | Consented matched dwelling rents and actual bills; provider tariff schedules | Same-dwelling panels; block tariffs, fixed charges, subsidies and consumption specification |
| Household goods and services | Fixed appliance/furniture SKUs, consumables, repair and domestic-service invoices | Quality and model continuity; service tasks and actual payable amounts |
| Health | Pharmacy offers/receipts, clinic tariffs and consented bills | Strength/pack matching, exact procedure, provider locality, collection and consultation charges |
| Transport | Fixed vehicle models, fuel-pump receipts, fixed-route fares and bus schedules | Travel date, route, class, booking horizon, tax and subsidy treatment |
| Information and communication | Operator plan tables, handset SKUs and subscription tariffs | Data allowance, validity, bundled benefits, handset quality changes and operator sampling |
| Recreation and culture | Fixed sporting goods, books, tickets and membership schedules | Variant, venue, service access and conditional promotions |
| Education | School/college annual fee tables, coaching tariffs and paid receipts | Fixed grade/course and provider, compulsory additional fees, financial aid and academic-year transitions |
| Restaurants and accommodation | Local menus plus actual bills; hotel quotes with fixed date/class | Portion/specification, tax/service fees, locality and booking-date comparability |
| Personal care and other services | Fixed retail products, salon tariffs and service receipts | Same task/product, outlet panel, tax and actual transaction charges |

The imported basket has 12 divisions; its published codes skip division 12. This collector follows those published rows and does not invent an insurance category or assign it a weight.

The independent engine should accept an item only after its required matched observations, base/chain links, specification treatment and sampling coverage pass validation. Missing observations should be published with explicit reasons. Fieldwork or consented historical receipt data will be necessary for categories that have no suitable public price history.

## Rechecking this snapshot

1. Verify every evidence file against `manifest.json`.
2. Check every `itemCode` against `cpi-basket.json`; keep classification changes reviewable.
3. Confirm the displayed price and exact pack/plan/service at the linked provider before a new collection date is recorded.
4. Retain the original observation and provenance; add a new dated record rather than overwriting past prices. Keep unsanitized downloads outside publication inputs. Record any necessary redaction with original and published hashes.
5. Only compare the same outlet, location, specification, tax treatment and discount eligibility. Record substitutions explicitly.
6. Keep provider tariff changes, quoted-item coverage and national-index eligibility as separate measures.

Run `python3 inflation/verify_independent.py` for the offline source, unit, mapping, date and eligibility checks. Run `python3 -m unittest discover -s inflation -p test_independent.py` for regression tests covering corrupted evidence, pack-size mistakes, MRP/member-price substitution, invented historical prices, backdating, image-only menu review and improper national publication. The PDF menu review is bound to its exact SHA-256; it is not described as automated OCR.
