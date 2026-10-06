# Babuwatch

Court-adjudicated records against India's public servants, served at
**datalibertarian.in/babuwatch**. Babuwatch is a family of *watches*
(registers) built by one engine from one method:

| Watch | URL | Records | Pages for |
|---|---|---|---|
| `babuwatch` (umbrella) | `/babuwatch` | every record, from every dataset | civil servants |
| `copwatchindia` | `/babuwatch/copwatchindia` | police officers | police officers |
| *(next: e.g. `iaswatch`)* | `/babuwatch/iaswatch` | … | … |

Every record has exactly one **home** watch, which renders its page. Owner
decision 2026-09-23: Copwatch India is merged fully under Babuwatch — one
watch, one nav, every record in one URL space. Old `/copwatchindia/*` and
`/babuwatch/copwatchindia/*` URLs redirect permanently (see `vercel.json`).

## Layout

```
babuwatch/
  build_all.py         builds every watch into dist/<base path>/ (npm run build:babuwatch)
  profiles/            one file per watch: base path, names, datasets, nav, categories, ALL copy
    __init__.py        WATCHES = build order + header-switcher order
    babuwatch.py
    copwatchindia.py
  engine/
    build.py           the generator (stdlib Python). Holds no watch-specific text.
    sections.py        pages beyond court records: /places (state, district,
                       police station), /commissions, /follow-up, /compliance,
                       /charged. Copy lives in the profile's "sections" dict.
    check_links.py     internal link check over the combined output
    test_gates.py      naming-gate / scrubber tests
    test_index.py      tracker index + built-output consistency tests
  templates/
    shared/            styles.css, public-nav.js (all watches)
    <watch>/           index.html (home sections), methodology.html, about.html,
                       rights.html/remedy.html (copwatch), methodology-appendix.html,
                       assets/brand/
  data/
    copwatchindia/     cases.json (HC/SC), tier2.json (trial court),
                       tier2-overturned.json, cases.csv, context.json,
                       commissions.json (NHRC + Delhi PCA findings), cctv.json
                       (court orders on police-station CCTV), charged.json
                       (trapped, NOT convicted)
    civil/             tier2.json (civil-servant trial-court convictions)
  tools/               private-data -> public-data pipeline for civil records
```

## Commands (from the repo root)

```sh
npm run build              # whole site; ends with build:babuwatch
npm run build:babuwatch    # just the watches -> dist/babuwatch/... + link check
npm run test:babuwatch     # engine tests (builds copwatchindia into a temp dir)
python3 babuwatch/engine/build.py --watch babuwatch --out /tmp/bw   # one watch
node scripts/serve.mjs dist   # local preview at http://127.0.0.1:4173/babuwatch
```

Python 3 stdlib only; Vercel's build image already has `python3`.

## Rules that must not break

1. **This repository is public. `data/` holds only publish-safe data.**
   Officers not cleared by the naming gate carry `publish_grade: "unnamed"`,
   `name: null`, and a `display` of rank/post and unit; prose already reads
   "[name withheld]". Raw pipeline files (real names, ledgers, blind keys)
   stay private and are never committed. See `tools/README-civil.md`.
   The legacy public `cases.csv` keeps `fidelity_changes` empty: internal
   verifier prose can retain ungated names even when officer columns are safe.
   Preserve its other fields, including amounts, when refreshing the export.
2. **A name is shown only when `publish_grade == "named_safe"`**, which the
   upstream two-key + subsequent-history gate (and legal review) grants.
   The engine never promotes a name; the final dist scrub refuses the build
   if a withheld name appears anywhere in the output.
3. **Findings are the court's.** Copy attributes every finding to the court
   and never asserts more than the record's verification level supports.
4. **Record ids are immutable**: `CW-YYYY-NNNN` (HC/SC), `t2…` (police trial
   court), `bx-…` (civil trial court). They are URLs.
5. **No watch-specific text in `engine/build.py`.** Copy goes in the
   profile's `text` dict or the watch's templates.

## Adding data

- Police (Copwatch India): replace files in `data/copwatchindia/` with the
  gated output of the Copwatch pipeline, in the same schema.
- Civil servants: run the pipeline in `tools/` (verify against the source,
  then gate) to regenerate `data/civil/tier2.json`.
- Each record's `service` (`police` / `civil`) comes from its dataset entry
  in the profile; its `watch` (home) likewise.

## Copwatch beyond the courts (sections.py)

| Page | Data | Source |
|---|---|---|
| `/commissions` | `commissions.json` | NHRC annual-report relief tables 2012-13 to 2023-24 (police incident codes 8xx, 1616; CAPF 17xx); Delhi PCA annual reports (quorum complaints approved by the LG) |
| `/follow-up` | cases.json + commissions.json | court compensation orders; NHRC "pending compliance" listings; RTI template |
| `/compliance` | `cctv.json` + cases.json | High Court orders quoting missing / non-functional CCTV, each attributed to its speaker |
| `/places`, `/station/...` | every police dataset | grouped by state, district, and the police station the source names |
| `/charged` | `charged.json` | TN DVAC trap press releases; **allegations**: noindex, not in the sitemap, counted nowhere |

Regenerate the three data files with `python3 babuwatch/tools/build_copwatch_extras.py --work <dir>`
from the parsed official PDFs (the parsers and PDFs stay in the maintainer's work directory). NHRC
recommendations are recommendations of a statutory body, not judgments: copy must say so, and a case's
status is only ever what NHRC itself last published. Never add a name to any of these files.

## Adding a watch (e.g. IAS officers)

1. `profiles/iaswatch.py`: copy `copwatchindia.py`; set `base`
   `/babuwatch/iaswatch`, `parent` `babuwatch`, names, `datasets` (with
   `home: "iaswatch"`), nav, `site_categories`/`category_map`, and every
   `text` entry.
2. `templates/iaswatch/`: `index.html` with the `<section class="…">` blocks
   named in `home_sections`, `methodology.html`, `about.html`,
   `assets/brand/`.
3. `data/iaswatch/tier2.json` (and/or `cases.json`).
4. Add `"iaswatch"` to `WATCHES` in `profiles/__init__.py`, and add its
   dataset to `profiles/babuwatch.py` so the umbrella lists it.
5. `npm run build:babuwatch && npm run test:babuwatch`, then open a PR: the
   Vercel preview shows the new watch before anything reaches production.

## Deploying

The Vercel project `datalibertarian` builds every push. A branch or PR gets
a preview URL; merging to `main` publishes to datalibertarian.in. Review
the preview (home, tracker filters, a record page on each watch, mobile)
before merging.
