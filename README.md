# Data Libertarian

A public ledger of government spending in India. This prototype covers **Maharashtra Police** only.

This is not an NGO or grant tracker. It follows taxpayer money through official state books.

## Run

```
npm install
npm run dev
```

```
npm test
npm run build
```

## Data

Figures are typed from the Maharashtra Home Department White Book (Civil Budget Estimates 2026-27, Part II) and Budget in Brief. See `src/data/EXTRACT.md`. Every number in the UI carries a citation.

## Scope

In: Maharashtra Police (heads 2055 + 4055), with Grant B-1 shown separately as not police-only.

Out: Union Demand 51, other states, municipalities, user accounts.
