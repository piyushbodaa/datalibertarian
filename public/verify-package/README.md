# Independent Verification Package

This branch exists ONLY for external re-verification. It is not the website
build; nothing here changes datalibertarian.in.

## Files

- `all-records.jsonl` — every screened record (2,146), published and withheld.
- `published.jsonl` — the 692 records currently live as convictions.
- `withheld.jsonl` — the 1,454 records the gate refuses to publish.

## Record shape

```
{"src": "hc_sc|tier2|babu",
 "section": "copwatch",
 "verdict": "publish|withheld",
 "gate_reasons": [...],        ← why the gate decided this; VERIFY, don't trust
 "record": { ...original fields... }}
```

## What to re-verify (priority order)

1. **published.jsonl (692)** — a conviction is live under this record. Check:
   does the cited judgment actually contain an explicit conviction for THIS
   defendant, for the stated offence? Does the case reference resolve?
2. **tier2 withheld (446)** — mostly V1 (single-extractor) tier-2 trial-court
   convictions lacking a second verification, plus 127 missing case refs.
3. **babu withheld (161)** — extractor-only, zero verification fields.
4. **hc_sc withheld (847)** — outcomes like acquittal/discharge/quash; sample
   these to confirm nothing conviction-like was mis-binned.

## Known defects already found (do not re-report)

- t2w2-05-019: court field showed appellate court; fixed to "Convicting court".
- CW-2024-0033: placeholder source URL; gated out.

## Ground rules

- A charge sheet, FIR, arrest, seizure or "disposed" status is NOT a conviction.
- An appellate judgment QUOTING a conviction is not confirmation of it.
- Verify against the primary source (judgment text), not the summary field.
- Report per record: keep / fix / kill, with the judgment line that decides it.
