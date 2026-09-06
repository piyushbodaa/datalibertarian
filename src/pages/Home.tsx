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
import { EXTRACT_DATE } from "../data/sources";
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
      <p className="kicker">Live dockets · extracted {EXTRACT_DATE}</p>
      <h1 className="mt-2 font-display text-[1.85rem] font-semibold leading-[1.15] tracking-tight sm:text-4xl">
        Union. State. City. Village.
      </h1>
      <p className="layer-caption mt-3">
        Four layers, four books. They are not added into one India-total.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <section className="docket-door layer-union">
          <p className="kicker">Union</p>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">Union Government</h2>
          <p className="layer-caption mt-1">Budget at a Glance · total expenditure · FY {unionTotal.fiscalYear} plan</p>
          <div className="mt-4">
            <Money money={unionTotal} size="hero" showSeries />
          </div>
          <PrintedColumns
            compact
            barsOnly
            run={unionRevenueExpenditure}
            cap={unionCapitalExpenditure}
            title="Booked · plan · mid-year · next plan"
            caption="Same Budget at a Glance. Revenue plus capital. Not Demand 51. Not the states."
          />
          <p className="mt-3 text-sm text-ink/70">
            Police demand only: <Money money={policeDemand} size="row" />
          </p>
          <p className="mt-4">
            <Link to="/union" className="file-cta">
              <span className="file-cta-notch" aria-hidden="true" />
              Open the Union ledger
            </Link>
          </p>
        </section>

        <section className="docket-door layer-state">
          <p className="kicker">State</p>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">State Governments</h2>
          <p className="layer-caption mt-1">One state book — Maharashtra total expenditure</p>
          <div className="mt-4">
            <Money money={mhState} size="hero" showSeries />
          </div>
          <p className="mt-2 text-[0.7rem] uppercase tracking-[0.14em] text-zinc">
            {cov.gold} GOLD · {cov.index} INDEX · {cov.blocked} BLOCKED · {cov.empty} EMPTY
          </p>
          <ShareSplit compact police={mhPolice} state={mhState} />
          <p className="mt-4">
            <Link to="/states" className="file-cta">
              <span className="file-cta-notch" aria-hidden="true" />
              Open the state index
            </Link>
          </p>
        </section>

        <section className="docket-door bone layer-municipal">
          <p className="kicker text-ochre">Municipal</p>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">Municipal Corporations</h2>
          <p className="layer-caption mt-3">Civic PDFs not typed. City police sits in state books.</p>
          <div className="mt-6 border border-dashed border-ink/25 px-3 py-10 text-center text-[0.7rem] uppercase tracking-[0.16em] text-ink/40">
            No hatch · no guessed rupee
          </div>
          <p className="mt-4">
            <Link to="/municipal" className="file-cta">
              <span className="file-cta-notch" aria-hidden="true" />
              Why this door is empty
            </Link>
          </p>
        </section>

        <section className="docket-door bone layer-gram">
          <p className="kicker" style={{ color: "var(--zinc)" }}>
            Gram
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">Gram Panchayats</h2>
          <p className="layer-caption mt-3">Village books not typed.</p>
          <p className="mt-2 max-w-[35ch] text-[0.75rem] text-zinc">
            Next search: XV FC RLB grant 2026-27 + state PR demand 2515.
          </p>
          <div className="mt-6 border border-dashed border-ink/25 px-3 py-10 text-center text-[0.7rem] uppercase tracking-[0.16em] text-ink/40">
            No hatch · no guessed rupee
          </div>
          <p className="mt-4">
            <Link to="/gram" className="file-cta">
              <span className="file-cta-notch" aria-hidden="true" />
              Why this door is empty
            </Link>
          </p>
        </section>
      </div>

      <ul className="mt-10 flex flex-wrap gap-2" aria-label="GOLD police ledgers">
        <li>
          <Link to="/maharashtra/police" className="live-tag no-underline text-ink">
            Maharashtra · GOLD
          </Link>
        </li>
        <li>
          <Link to="/uttar-pradesh/police" className="live-tag no-underline text-ink">
            Uttar Pradesh · GOLD
          </Link>
        </li>
        <li>
          <Link to="/telangana/police" className="live-tag no-underline text-ink">
            Telangana · GOLD
          </Link>
        </li>
        <li>
          <Link to="/west-bengal/police" className="live-tag no-underline text-ink">
            West Bengal · GOLD
          </Link>
        </li>
        <li>
          <Link to="/gujarat/police" className="live-tag no-underline text-ink">
            Gujarat · GOLD
          </Link>
        </li>
        <li>
          <Link to="/tamil-nadu/police" className="live-tag no-underline text-ink">
            Tamil Nadu · GOLD
          </Link>
        </li>
        <li>
          <Link to="/union/police" className="live-tag no-underline text-ink">
            Union Demand 51 · GOLD
          </Link>
        </li>
        <li>
          <Link to="/union/delhi-police" className="live-tag no-underline text-ink">
            Delhi Police · Union
          </Link>
        </li>
      </ul>

      <p className="mt-6 max-w-2xl text-sm text-ink/65">
        The book stops where the printed line stops.{" "}
        <Link to="/sources">Method</Link>
        {" · "}
        Not NGOs.
      </p>
    </article>
  );
}
