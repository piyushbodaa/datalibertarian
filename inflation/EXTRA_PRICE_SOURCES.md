# Additional primary-provider price observations — 16 November 2026

These ten additional price examples have been merged into the canonical `src/data/inflation/independent-quotes.json`, bringing the inventory to **34 quotations across 29 CPI item categories**. They are published evidence, not an independent inflation calculation. All ten remain ineligible for a national item index. Neither geographic coverage nor the matched monthly chain has been established.

| CPI category | Exact example and quoted amount | Primary source and limitations |
|---|---|---|
| Cream/body lotion | Nivea Nourishing Body Milk, 120 ml: ₹130 | [MK Retail](https://mkretail.com/product/nivea-nourishing-body-milk-120ml); tax-inclusive, shown in stock. Delivery locality and charges unverified. |
| Soap/body wash | Nivea Frangipani & Oil shower gel, 125 ml: ₹110 | [MK Retail](https://mkretail.com/product/nivea-shower-gel-frangipani-oil-125ml); tax-inclusive, shown in stock. Delivery locality and charges unverified. |
| Sanitary napkins | Whisper Ultra XL+, 30 pads: ₹315 | [BigBasket](https://www.bigbasket.com/pd/263493/whisper-sanitary-pads-extra-large-plus-ultra-clean-30-pcs/); displayed offer, tax-inclusive, MRP ₹420. |
| Sanitizer | Dettol Clinical Strength hand sanitizer, 500 ml: ₹250 | [BigBasket](https://www.bigbasket.com/pd/40196348/dettol-clinical-strength-antiseptic-hand-sanitizer-liquid-kills-germs-bacteria-500-ml/); displayed offer, tax-inclusive. |
| Baby products | Pampers Premium Care pants, Large 9–14 kg, 44 pieces: ₹764 | [BigBasket](https://www.bigbasket.com/pd/40141637/pampers-premium-care-diapers-large-44-pcs/); displayed offer, tax-inclusive, MRP ₹1,499. The opened page differs from the search-result price; only the opened-page price is recorded. |
| Barber/beautician | Naturals classic haircut, non-member guide rate: ₹450 | [Naturals](https://naturals.in/services/Hair/); website guide, no branch chosen, tax treatment unspecified. Provider pricing varies by state/city; this is not a confirmed local appointment quote. |
| LPG/PNG | Delhi domestic PNG: ₹50.59 per standard cubic metre | [IGL](https://www.iglonline.net/cng-png-prices); table says effective 2 September 2026. Tax breakdown, connection charges and paid bill unverified. |
| CNG | Delhi CNG retail tariff: ₹86.98/kg | [IGL](https://www.iglonline.net/cng-png-prices); table says effective 29 August 2026 at 06:00. This is provider-specific tariff evidence, not a matched October quotation panel. |
| Cooked meals | Southern Spice Sakhaharam Virundhu vegetarian thali: ₹2,200 | [Taj Tirupati menu](https://assets.tajhotels.com/en-in/hotels/taj-tirupati/restaurants/southern-spice-tirupati/southern-spice-tirupati-menu.pdf), PDF page 2; taxes extra. |
| Cooked snacks | Munthiri Kara Kuzhi Paniyaram, 260 g: ₹650 | Same Taj Tirupati menu, PDF page 3; taxes extra. A single luxury-restaurant offer does not represent national snack prices. |

The Taj menu is currently hosted by the provider but has no printed effective date; its PDF title identifies 2025. Both records explicitly state that October 2026 validity is unverified. Their inclusion records available published evidence, not a contemporaneous transaction. The PDF skill's visual workflow was used to verify the image-only pages, including quantities, prices and the footer specifying additional taxes.

The two MK Retail pages and Naturals service guide were downloaded as complete HTML and stored with the safe `.html.txt` suffix. The complete Taj PDF is archived unchanged. BigBasket and IGL observations are explicitly named `.observed-facts.json` transcriptions from opened primary pages. BigBasket direct HTTP requests returned 403; IGL direct HTTP returned a JavaScript-only response without the tariff table. Neither response was misrepresented as archived price evidence. Source manifests contain actual retrieval dates or recorded UTC download timestamps, byte counts and SHA-256 hashes.

## Evidence excluded from the quotation inventory

- A [NoBroker rental listing](https://www.nobroker.in/property/1-bhk-apartment-for-rent-in-sector-7-dwarka-delhi-for-rs-15000/8aa9afaca0be977d01a0bea5d1fc0934/detail?nbFr=NobrokerBlog) advertised ₹15,000/month but its opened page explicitly said the property was inactive. It is not recorded as an available current rent.
- MK Retail's Nivea deodorant showed a price but was explicitly out of stock. A Gillette Guard listing also said currently unavailable; neither was added.
- The [BSES citizen charter](https://www.bsesdelhi.com/documents/55701/92585/citizens-charter.pdf) discloses energy and fixed-charge components, but a complete contemporaneous consumer bill including applicable surcharges/subsidies was not established. A component rate was not substituted for the electricity expenditure price.
- The opened [MTDC Nagpur page](https://www.mtdc.co/stays/mtdc-nagpur) did not expose an actual dated room quote, despite prices appearing in search excerpts. No hotel amount was admitted from a search excerpt alone.
- No verified current water, alcohol or tobacco offer was added in this batch. No insurance quote was forced into the basket: division 12 is not among the weighted CPI 2024 divisions in the archived workbook.

Retail prices without an explicit effective date are labelled as retrieved on 16 November, not as prices observed during October. No historical prices, completed geographic panels or missing national index levels are manufactured.
