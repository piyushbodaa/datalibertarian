import { Link } from "react-router-dom";
import { Money } from "../components/Money";
import { PrintedColumns } from "../components/PrintedColumns";
import { ShareSplit } from "../components/ShareSplit";
import { coverageCounts } from "../data/coverage";
import {
  functionalPolice,
  HEADLINE_SERIES,
  HEADLINE_YEAR,
  pickAmount,
  stateTotalExpenditure,
} from "../data/maharashtra-police";
import {
  UNION_TOTAL_SERIES,
  UNION_TOTAL_YEAR,
  unionCapitalExpenditure,
  unionRevenueExpenditure,
  unionTotalExpenditure,
} from "../data/union/budget-at-a-glance";
import {
  demand51Net,
  UNION_HEADLINE_SERIES,
  UNION_HEADLINE_YEAR,
} from "../data/union/demand-51";

export function HomePage() {
  const unionTotal = pickAmount(unionTotalExpenditure, UNION_TOTAL_YEAR, UNION_TOTAL_SERIES);
  const policeDemand = pickAmount(demand51Net, UNION_HEADLINE_YEAR, UNION_HEADLINE_SERIES);
  const mhState = stateTotalExpenditure.find(
    (m) => m.fiscalYear === HEADLINE_YEAR && m.series === HEADLINE_SERIES,
  );
  const mhPolice = pickAmount(functionalPolice, HEADLINE_YEAR, HEADLINE_SERIES);
  if (!unionTotal || !policeDemand || !mhState || !mhPolice) {
    throw new Error("Missing home layer figures");
  }
  const cov = coverageCounts();

  return (
    <article>
      <h1 className="mt-2 font-display text-[1.85rem] font-semibold leading-[1.15] tracking-tight sm:text-4xl">
        Union. State. City. Village.
      </h1>
      <p className="layer-caption mt-3">These are four different books. Do not add them.</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <section className="docket-door layer-union">
          <h2 className="font-display text-xl font-semibold tracking-tight">Union</h2>
          <p className="layer-caption mt-1">What Delhi’s Union budget planned to spend, 2026-27</p>
          <div className="mt-4">
            <Money money={unionTotal} size="hero" showSeries />
          </div>
          <PrintedColumns
            compact
            barsOnly
            run={unionRevenueExpenditure}
            cap={unionCapitalExpenditure}
            title="Spent · plan · updated · next plan"
            caption=""
          />
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
          <h2 className="font-display text-xl font-semibold tracking-tight">State</h2>
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

        <section className="docket-door bone layer-municipal">
          <h2 className="font-display text-xl font-semibold tracking-tight">City</h2>
          <p className="mt-3 max-w-[40ch] text-sm text-ink/75">No city book typed yet.</p>
          <p className="mt-4">
            <Link to="/municipal" className="file-cta">
              <span className="file-cta-notch" aria-hidden="true" />
              Why city is empty
            </Link>
          </p>
        </section>

        <section className="docket-door bone layer-gram">
          <h2 className="font-display text-xl font-semibold tracking-tight">Village</h2>
          <p className="mt-3 max-w-[40ch] text-sm text-ink/75">No village book typed yet.</p>
          <p className="mt-4">
            <Link to="/gram" className="file-cta">
              <span className="file-cta-notch" aria-hidden="true" />
              Why village is empty
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
