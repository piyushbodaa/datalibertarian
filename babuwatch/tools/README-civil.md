# Civil-servant data pipeline (`babuwatch/tools/`)

Turns PRIVATE extracted rows into the PUBLIC-SAFE `babuwatch/data/civil/tier2.json`.
The private files live OUTSIDE this repository (this repo is public); nothing in
this directory reads or writes anything that may be committed from `private-data/`.

## Files

| File | Role |
|---|---|
| `verify_civil.py` | Deterministic, offline source-match verification. Reads candidate rows, matches each official against the cached source text, dedupes, writes PRIVATE outputs (real names). |
| `gate_civil.py` | Name gate: builds the public `data/civil/tier2.json` from the private files with every name withheld and every string scrubbed; refuses to write if any name term survives. |
| `data/civil/tier2.json` | The publish-safe dataset (committed). |

## Running

```sh
# 1. verify (writes PRIVATE outputs next to the private inputs)
python3 babuwatch/tools/verify_civil.py          # defaults: cloudy-restore candidates -> private-data/babuwatch/

# 2. gate (writes babuwatch/data/civil/tier2.json)
python3 babuwatch/tools/gate_civil.py
```

Both are Python 3 stdlib only, no network, deterministic: same inputs, same
`--seed`, same `--as-of` give byte-identical outputs.

Private outputs of `verify_civil.py` (NEVER commit):

- `civil-verified.jsonl` — V2 rows (name + date/case number + conviction wording
  matched in one window of an official-domain source).
- `civil-v1.jsonl` — V1 rows (name found; some element missing or a caveat).
- `civil-excluded.jsonl` — every other input row, with reasons.
- `VERIFY-REPORT.md` — funnel counts + random V2 rows for human spot-checking.

## What publishes (owner decisions 2026-09-23)

- V2 rows: all of them.
- V1 rows: yes — civil records follow the same standard as the police
  trial-court records, which publish V1 — EXCEPT rows whose verification reasons
  include `missing_c_conviction_wording` or `acquittal_closer_than_conviction`
  (the conviction itself is not established; only convictions publish).
- A published V1 row carries `verification_status: "V1"` and a summary line
  spelling out what kept it from V2 (`V1_GLOSS` in `gate_civil.py`).
- A row whose source URL embeds the official's name is never published unless an
  alternate name-free official source was found at verification time.
- Excluded groups (PSU/bank/company staff, cooperative-society staff, elected
  representatives) stay out; PSU/bank/company and cooperative staff are planned
  for a register of their own.

## Naming

Every official is `publish_grade: "unnamed"` with `name: null`. Naming requires
the two-key gate + subsequent-history check + lawyer review (the Copwatch
standard); none of that has run for this dataset. The gate rewrites each summary
from structured fields (so complainants and co-accused named in extractor prose
never reach the public file), scrubs every field of name variants, and then runs
a LEAK ASSERTION over the finished file: no two-token run of any name in the
private files, and no distinctive single token (>= 5 chars) of any published
official, may appear anywhere. On any hit it writes nothing and exits 1.

Independent second scan (run it after every gate change, over both the public
file and the built `dist/babuwatch`): collect every private official name, check
two-word names and single tokens (>= 5-6 chars) with word boundaries, and
hand-review the hits — single tokens collide with ordinary and administrative
vocabulary (see below).

## Pitfalls

- Single-token names are the weak spot of any leak scan: one official's surname
  was `Mandal` while another row's unit text says "Byrapura Mandal Panchayath".
  The gate's `COMMON` list carries the administrative-vocabulary exclusions;
  `mandal` was added there on 2026-09-23 after exactly that collision.
- The verification window (~600 chars) can miss a date that the extractor saw
  elsewhere in a table row; those rows verify at V1 or V2-by-case-number and the
  summary discloses it.
- DVAC (tn-dvac) items put the conviction date at the end of the sentence
  ("... convicted ... to undergo ... on 24.08.2022"); it is the judgment date,
  confirmed against the dated individual press-release PDFs where the same case
  appears. Trap items use the same trailing-date style for the trap date.
- Re-running `gate_civil.py` must be byte-identical (`sha256sum`) unless the
  private inputs or this code changed; treat any silent drift as a bug.
