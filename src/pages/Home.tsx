import { Link } from "react-router-dom";
import { CitationChip } from "../components/CitationChip";
import { LayerPie } from "../components/LayerPie";
import { Money } from "../components/Money";
import { ShareSplit } from "../components/ShareSplit";
import { formatCrore } from "../lib/money";
import { coverageCounts } from "../data/coverage";
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
      <p className="text-sm text-ink/55">Union books · end of 2026-27, as printed</p>
      <h1 className="mt-2 font-display text-[1.85rem] font-semibold leading-[1.15] tracking-tight sm:text-4xl">
        Union outstanding liabilities
      </h1>
      <p className="mt-3 max-w-2xl text-ink">
        Outstanding liabilities of the Government of India. Centre only. Not the states, not the
        cities, not a live ticker.
      </p>
      <div className="mt-6 border-y border-ink/20 py-8">
        <p className="num m-0 text-[2.4rem] font-medium leading-[0.95] tracking-tight sm:text-6xl md:text-7xl">
          ₹{formatCrore(debt.crore)} crore
        </p>
        <p className="mt-4 text-sm text-ink/70">
          End of 2026-27, as printed
          <CitationChip citationId={debt.citationId} />
        </p>
      </div>

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

      <p className="mt-8 flex flex-wrap gap-6">
        <Link to="/compare?left=maharashtra&right=karnataka" className="file-cta">
          <span className="file-cta-notch" aria-hidden="true" />
          Compare two states
        </Link>
        <Link to="/search" className="file-cta">
          <span className="file-cta-notch" aria-hidden="true" />
          Search
        </Link>
      </p>

      <ul className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-sm" aria-label="States we have read">
        {[
          ["/maharashtra/police", "Maharashtra"],
          ["/uttar-pradesh/police", "Uttar Pradesh"],
          ["/telangana/police", "Telangana"],
          ["/west-bengal/police", "West Bengal"],
          ["/gujarat/police", "Gujarat"],
          ["/tamil-nadu/police", "Tamil Nadu"],
          ["/karnataka/police", "Karnataka"],
          ["/kerala/police", "Kerala"],
          ["/odisha/police", "Odisha"],
          ["/union/police", "Centre police"],
        ].map(([to, name]) => (
          <li key={to}>
            <Link to={to}>{name}</Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
