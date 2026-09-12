# Publishing and source maintenance

Domain: datalibertarian.in (also www.datalibertarian.in). DNS and hosting: Vercel. Repository: piyushbodaa/datalibertarian, production branch main. Vercel project: datalibertarian, ID prj_C8eKGjmJ8Gk1VCFCQ4LUhAg7oUcT. Team: piyushbodaa-2833. Node: 24.x.

Run `npm ci`, `npm test`, `npm run build`, and `npm run test:browser`. The build writes `dist/`; it first bundles the browser application, then renders public pages as HTML, discovers their internal links, and writes sitemap.xml, robots.txt, and 404.html. No server or database is needed in production. `vercel.json` sets the build and output directory. Do not restore a catch-all homepage rewrite: missing files must return 404.

The local static preview is `node scripts/serve.mjs` (http://127.0.0.1:4173). It models clean HTML URLs and missing-page status. Use the Vercel preview to check actual cache headers and redirects.

Push a feature branch for a Vercel preview. Inspect Home, a state page, a comparison with URL parameters, an inflation item, a citation, and an invalid address on desktop and mobile. Merge the reviewed commit into main for the Git integration to publish. If a regression reaches production, use Vercel's rollback for immediate recovery and revert the offending Git commit before the next deployment.

## Data changes

- Keep fiscal year, series (BE/RE/actual), units, accounting scope, source URL, page/table, and extraction date together.
- `Citation.accessedOn` records extraction, not a fresh independent verification. An optional `reviewedOn` records an actual documented recheck; never stamp today's date without checking the source.
- Use the corrections page to collect the relevant page, official document, and requested correction. Verify against government books, preserve missing-versus-zero semantics, and explain changes in Git history.
- Never replace Maharashtra's protected amounts as part of a presentation refactor. Existing tests cover accounting boundaries and median arithmetic; browser tests cover the journey from a figure to its source.
- Shared presentation starts with `PoliceOverview` for Sikkim and Tripura. Migrate other pages only when their distinct accounting scope can be preserved explicitly.

The personal portfolio is a separate project, `piyushbodaa/piyushbodaa`. Its project descriptions are maintained in that repository's projects.json, not here. Domain renewal and any separately purchased email remain registrar/account responsibilities.
