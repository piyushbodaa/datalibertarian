# Night shift log — 2026-09-07

## Usage

No usage meter visible in this session (Settings / `/usage` / MCP). Fallback cap: **four successful GOLD promotions (Karnataka + 3 more)** or two failed PDF attempts on the same slug.

Stopped after Karnataka (already GOLD) + **two new GOLD** (Kerala, Odisha). Rajasthan PDFs opened but 2055 was not isolable with a page cite. Did not start Madhya Pradesh. No municipalities.

## Why stop

1. No weekly % meter — leave headroom for the owner.
2. Rajasthan Vol2b/Vol1 OCR is not a safe 2055 total.
3. Hard lock: empty is allowed; guessed rupees are not.

## Compare URL (morning)

https://datalibertarian.in/compare?left=maharashtra&right=karnataka

Also works: `?left=maharashtra&right=kerala` and `?left=maharashtra&right=odisha`.

Karnataka was already GOLD on `f092355` (Expenditure Volume-1, lakhs). This night did not retouch those amounts.

## Commits this night

| Hash | What |
|---|---|
| ac69ab2 | Human copy: drop 2055 / GOLD / INDEX from the glass (sitting work, tests green) |
| 4c2440d | Kerala GOLD from AFS 2026-27 2055+4055 |
| d9677ec | Odisha GOLD from Demand 01 Home 2055 (4055 not printed) |

## Table of slugs

| slug | result | pdf | unit | 2055 BE 2026-27 | 4055 BE 2026-27 | note |
|---|---|---|---|---|---|---|
| karnataka | gold (pre-existing) | https://finance.karnataka.gov.in/uploads/EXPVOL1_1772787253.pdf | lakhs | 12,094.4194 cr | 453.00 cr | Compare MH vs KA is two official books |
| kerala | gold | https://www.budget.kerala.gov.in/keralabudgetdoc/2026_27/AFS.pdf | accounts rupees; estimates thousands | 6,579.5289 cr | 54.60 cr | Statement B p.24–25, C p.38–39. Demand XII volume 404 |
| odisha | gold | https://finance.odisha.gov.in/sites/default/files/2025-08/D-01.pdf | thousands | 7,100.9420 cr | — | 4055 not a major head (4059/4216 mixed). Hero is 2055 only |
| rajasthan | index | https://finance.rajasthan.gov.in/docs/budget/statebudget/2026-2027/Vol2b.pdf | thousands (Vol2b) | not typed | not typed | Vol1 + Vol2b opened; no clean 2055 page. Do not use glance ₹556.16 cr |
| madhya-pradesh | not opened | — | — | — | — | Not started |
| bihar … | not opened | — | — | — | — | Not started |

## First job after coffee

1. Rajasthan Volume 2b (`Vol2b.pdf`, 7.5 MB on disk under `data/raw/rajasthan/`) — find **2055 वृहद योग** with a printed page, then Volume 3a for **4055**.
2. Confirm Kerala Demand XII detailed volume if a new URL appears; AFS hero already ships.
3. Odisha: only add buildings if a Police line is isolated under 4059/4216. Do not take those mixed totals.
4. Then Madhya Pradesh, Bihar, Andhra (only if 2026-27 prints rupees, not percent).

`npm test` (35) and `npm run build` were green after Kerala and after Odisha.
