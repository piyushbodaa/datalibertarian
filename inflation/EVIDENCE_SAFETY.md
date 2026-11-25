# Public evidence capture

Retailer pages can embed credentials in scripts even when their prices are public.
Never download a new response directly into `public/`. Keep the input in private,
ignored scratch storage, then prepare a new public capture:

```sh
python3 inflation/capture_evidence.py \
  --input /tmp/provider-response.html \
  --output public/data/inflation/sources/independent/provider-YYYY-MM-DD.html.txt
```

The command screens literal Google API key candidates and common HTML entity,
percent, JSON Unicode and JavaScript hex escape forms before writing any public
bytes. It replaces matches with a marker, preserves other response bytes, refuses
active HTML extensions and existing output paths, and prints metadata only.
Do not copy the private input into the repository or a build artifact.

Review the capture for unrelated personal data and other credentials. This focused
Google-key check is not a universal secret detector and does not test key validity.
Do not call provider APIs with captured credentials.

Copy the returned `sha256`, `bytes`, `evidenceType` and, when present,
`sanitization` object into the source record in
`src/data/inflation/independent-quotes.json` and the matching public
`manifest.json` entry. Keep the original source URL and retrieval timestamp.
For affected quotes update `sourceSha256` and `evidenceType` to match the source.
Do not change observation dates, prices, units or eligibility for a redaction.

A sanitized capture uses `sanitized-fetched-html`. Its public checksum describes
the sanitized bytes; `sanitization.originalSha256` and `originalBytes` describe
the original response without retaining the credential itself in public metadata.
`method` names the transformation and `redactions` records its count. The
archived page link labels these captures explicitly.

Run:

```sh
npm run test:secrets
python3 inflation/verify_independent.py
npm test
npm run build
npm run test:browser
```

The source check scans tracked and nonignored source files plus every file in
`public/`, including unreferenced and ignored files. It reports paths/counts,
never matched values. Tests and the build run it; direct Vite builds and direct CPI
exports also run the gate. The completed npm build scans all of `dist/` after
all exporters and generators finish. Do not publish output from a failed build.
The existing GitHub checks execute these gates without a new service or credential.

The government PMD and official CPI collectors retain exact response bytes, so
they reject key-bearing inputs instead of silently modifying official evidence.

Repository cleanup changes the current candidate tree only. It does not revoke
third-party keys, remove older Git objects, purge previous deployments, or prove
the credentials restricted or unused. Credential owners must assess their Google
Cloud restrictions and usage. Do not close an incident on the basis of a clean
working-tree scan alone.
