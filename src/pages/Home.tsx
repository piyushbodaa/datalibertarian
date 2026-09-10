import { Link } from "react-router-dom";
import { CitationChip } from "../components/CitationChip";
import { LayerPie } from "../components/LayerPie";
import { Money } from "../components/Money";
import { ShareSplit } from "../components/ShareSplit";
import { formatCrore } from "../lib/money";
import { coverageCounts } from "../data/coverage";
import { LAYERS } from "../data/layers";
import {
  functionalPolice,
  HEADLINE_SERIES,
  HEADLINE_YEAR,
  pickAmount,
  stateTotalExpenditure,
} from "../data/maharashtra-police";
import {
  UNION_DEBT_SERIES,
  UNION_DEBT_YEAR,
  UNION_TOTAL_SERIES,
  UNION_TOTAL_YEAR,
  unionOutstandingLiabilities,
  unionTotalExpenditure,
} from "../data/union/budget-at-a-glance";
import {
  demand51Net,
  UNION_HEADLINE_SERIES,
  UNION_HEADLINE_YEAR,
} from "../data/union/demand-51";

const READ_STATES: [string, string][] = [
  ["/maharashtra/police", "Maharashtra"],
  ["/uttar-pradesh/police", "Uttar Pradesh"],
  ["/telangana/police", "Telangana"],
  ["/west-bengal/police", "West Bengal"],
  ["/gujarat/police", "Gujarat"],
  ["/tamil-nadu/police", "Tamil Nadu"],
  ["/karnataka/police", "Karnataka"],
  ["/kerala/police", "Kerala"],
  ["/odisha/police", "Odisha"],
  ["/andhra-pradesh/police", "Andhra Pradesh"],
  ["/sikkim/police", "Sikkim"],
  ["/rajasthan/police", "Rajasthan"],
  ["/himachal-pradesh/police", "Himachal Pradesh"],
  ["/bihar/police", "Bihar"],
  ["/tripura/police", "Tripura"],
  ["/meghalaya/police", "Meghalaya"],
  ["/manipur/police", "Manipur"],
  ["/nagaland/police", "Nagaland"],
  ["/mizoram/police", "Mizoram"],
  ["/arunachal-pradesh/police", "Arunachal Pradesh"],
  ["/union/police", "Centre police"],
];

export function HomePage() {
  const debt = pickAmount(unionOutstandingLiabilities, UNION_DEBT_YEAR, UNION_DEBT_SERIES);
  const unionTotal = pickAmount(unionTotalExpenditure, UNION_TOTAL_YEAR, UNION_TOTAL_SERIES);
  const policeDemand = pickAmount(demand51Net, UNION_HEADLINE_YEAR, UNION_HEADLINE_SERIES);
  const mhState = stateTotalExpenditure.find(
    (m) => m.fiscalYear === HEADLINE_YEAR && m.series === HEADLINE_SERIES,
  );
  const mhPolice = pickAmount(functionalPolice, HEADLINE_YEAR, HEADLINE_SERIES);
  if (!debt || !unionTotal || !policeDemand || !mhState || !mhPolice) {
    throw new Error("Missing home layer figures");
  }
  const cov = coverageCounts();

  return (
    <article>
      <p className="kicker">Public ledger</p>
      <h1 className="mt-2 font-display text-[1.85rem] font-semibold leading-[1.15] tracking-tight sm:text-4xl">
        Government spending, as printed
      </h1>
      <p className="mt-3 max-w-2xl text-ink">
        Official budget books only. Every rupee is cited. Empty means we have not read that book
        yet — not that it is zero. This is not an NGO or grant tracker.
      </p>

      <p className="mt-8 text-sm text-ink/55">Union books · end of 2026-27, as printed</p>
      <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        Union outstanding liabilities
      </h2>
      <p className="mt-3 max-w-2xl text-ink">
        Outstanding liabilities of the Government of India. Centre only. Not the states, not the
        cities, not a live ticker.
      </p>
      <div className="mt-6 border-y border-ink/20 py-7 sm:py-8">
        <p className="num num-hero m-0">₹{formatCrore(debt.crore)} crore</p>
        <p className="mt-4 text-sm text-ink/70">
          End of 2026-27, as printed
          <CitationChip citationId={debt.citationId} />
        </p>
      </div>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {LAYERS.map((layer) => (
          <li key={layer.id}>
            <Link to={layer.href} className={`docket-door layer-${layer.id} ${layer.empty ? "empty" : ""}`}>
              <p className="kicker">{layer.kicker}</p>
              <p className="mt-2 font-display text-lg font-semibold tracking-tight">{layer.title}</p>
              <p className="mt-2 text-sm text-ink/60">{layer.empty ? "No figure yet" : layer.cta}</p>
            </Link>
          </li>
        ))}
      </ul>

      <LayerPie
        title="Spend in the books we have read"
        note="Union plan vs one state book (Maharashtra). City and village are empty — not zero. Do not add these into one India total."
        slices={[
          { id: "union", label: "Union plan", money: unionTotal, hatch: "rust" },
          { id: "state", label: "Maharashtra (one state)", money: mhState, hatch: "carbon" },
          { id: "city", label: "City", empty: "No city book typed yet.", hatch: "ochre" },
          { id: "village", label: "Village", empty: "No village book typed yet.", hatch: "zinc" },
        ]}
      />

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <section className="docket-door layer-union">
          <h2 className="font-display text-xl font-semibold tracking-tight">Union spend</h2>
          <p className="layer-caption mt-1">What the Union budget planned to spend, 2026-27</p>
          <div className="mt-4">
            <Money money={unionTotal} size="hero" showSeries />
          </div>
          <p className="mt-3 text-sm text-ink/70">
            Centre police only: <Money money={policeDemand} size="row" />
          </p>
          <p className="mt-4">
            <Link to="/union" className="file-cta">
              <span className="file-cta-notch" aria-hidden="true" />
              Open the Union book
            </Link>
          </p>
        </section>

        <section className="docket-door layer-state">
          <h2 className="font-display text-xl font-semibold tracking-tight">One state book</h2>
          <p className="layer-caption mt-1">Maharashtra’s whole budget, 2026-27</p>
          <div className="mt-4">
            <Money money={mhState} size="hero" showSeries />
          </div>
          <p className="mt-2 text-sm text-ink/65">
            {cov.gold} states read from official books. Rest not ready.
          </p>
          <ShareSplit compact police={mhPolice} state={mhState} />
          <p className="mt-4">
            <Link to="/states" className="file-cta">
              <span className="file-cta-notch" aria-hidden="true" />
              All states
            </Link>
          </p>
        </section>
      </div>

      <p className="mt-8 flex flex-wrap gap-x-6 gap-y-1">
        <Link to="/compare?left=maharashtra&right=karnataka" className="file-cta">
          <span className="file-cta-notch" aria-hidden="true" />
          Compare two states
        </Link>
        <Link to="/search" className="file-cta">
          <span className="file-cta-notch" aria-hidden="true" />
          Search
        </Link>
      </p>

      <h2 className="mt-12 font-display text-xl font-semibold tracking-tight">States we have read</h2>
      <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 md:grid-cols-3" aria-label="States we have read">
        {READ_STATES.map(([to, name]) => (
          <li key={to}>
            <Link to={to} className="inline-flex min-h-11 items-center text-ink no-underline hover:text-rust">
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
