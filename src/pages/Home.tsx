import { Link } from "react-router-dom";
import { HeadSplit } from "../components/HeadSplit";
import { Money } from "../components/Money";
import { PrintedColumns } from "../components/PrintedColumns";
import { RankedHatch } from "../components/RankedHatch";
import {
  functionalPolice,
  HEADLINE_SERIES,
  HEADLINE_YEAR,
  pickAmount,
  police2055,
  police4055,
} from "../data/maharashtra-police";
import { coverageCounts } from "../data/coverage";
import { INDEX_SERIES, INDEX_YEAR, indexPoliceLines } from "../data/prs-index/afs-police";
import { EXTRACT_DATE } from "../data/sources";
import {
  demand51Groups,
  demand51Net,
  demand51Revenue,
  demand51Capital,
  UNION_HEADLINE_SERIES,
  UNION_HEADLINE_YEAR,
} from "../data/union/demand-51";

export function HomePage() {
  const mh = pickAmount(functionalPolice, HEADLINE_YEAR, HEADLINE_SERIES);
  const mhRun = pickAmount(police2055, HEADLINE_YEAR, HEADLINE_SERIES);
  const mhCap = pickAmount(police4055, HEADLINE_YEAR, HEADLINE_SERIES);
  const union = pickAmount(demand51Net, UNION_HEADLINE_YEAR, UNION_HEADLINE_SERIES);
  if (!mh || !mhRun || !mhCap || !union) throw new Error("Missing live headline figures");
  const cov = coverageCounts();

  return (
    <article>
      <p className="kicker">Live dockets · extracted {EXTRACT_DATE}</p>
      <h1 className="mt-2 max-w-3xl font-display text-[1.85rem] font-semibold leading-[1.15] tracking-tight sm:text-4xl">
        Official books. Cited rupees. Not NGOs.
      </h1>
      <p className="mt-3 max-w-2xl text-ink/80">
        GOLD ledgers are typed from government books. INDEX is PRS AFS Police functional — a
        different slip. Empty doors have no number.
      </p>

      <ul className="mt-5 flex flex-wrap gap-2" aria-label="What is live">
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
        <li>
          <Link to="/states" className="live-tag index no-underline text-ink">
            27 INDEX · PRS AFS
          </Link>
        </li>
        <li>
          <span className="live-tag empty text-ink/60">Municipal · not extracted</span>
        </li>
      </ul>

      <section className="mt-8 border-y border-ink/20 py-8">
        <div className="grid gap-10 md:grid-cols-2 md:gap-12">
          <div>
            <p className="kicker">Maharashtra White Book · Police</p>
            <p className="mt-2 text-sm text-ink/65">
              Heads 2055 + 4055 · FY {mh.fiscalYear} budget. Not Union police. Not BMC. Not the PRS
              INDEX envelope.
            </p>
            <div className="mt-4">
              <Money money={mh} size="hero" showSeries />
            </div>
            <PrintedColumns
              compact
              run={police2055}
              cap={police4055}
              title="Four printed columns"
              caption="Actuals, Budget, and Revised as printed — not one trend."
            />
          </div>
          <div>
            <p className="kicker">Union Demand 51 · Police</p>
            <p className="mt-2 text-sm text-ink/65">
              Centre’s Police demand, net. Not the sum of the states.
            </p>
            <div className="mt-4">
              <Money money={union} size="hero" showSeries />
            </div>
            <PrintedColumns
              compact
              run={demand51Revenue}
              cap={demand51Capital}
              title="Four printed columns"
              caption="Demand 51 net (revenue plus capital). Same four official series — not one trend."
            />
          </div>
        </div>
      </section>

      <section className="index-slip mt-10">
        <p className="kicker">INDEX · PRS AFS</p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
          Cited rank, FY 2025-26 budget
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          PRS AFS Police functional — not state White Book depth yet. Zinc hatch, not the rust
          White Book ledger. Maharashtra’s INDEX ₹33,743 crore is not the GOLD hero above.
        </p>
        <RankedHatch
          compact
          tone="index"
          showAll
          limit={8}
          items={indexPoliceLines}
          fiscalYear={INDEX_YEAR}
          series={INDEX_SERIES}
          title="Largest INDEX envelopes"
          note="INDEX, not GOLD LIVE. Top 8 of 27 PRS AFS Police functional envelopes, FY 2025-26 budget. Share of those 27 listed rows."
        />
        <p className="mt-4">
          <Link to="/states" className="file-cta">
            <span className="file-cta-notch" aria-hidden="true" />
            Open all 27 INDEX envelopes
          </Link>
        </p>
      </section>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <section className="docket-door">
          <p className="kicker">Centre</p>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">Union Government</h2>
          <p className="mt-1 text-sm text-ink/70">Demand 51 Police · FY {union.fiscalYear} budget</p>
          <div className="mt-3">
            <Money money={union} size="row" />
          </div>
          <RankedHatch
            compact
            limit={4}
            items={demand51Groups}
            fiscalYear={UNION_HEADLINE_YEAR}
            series={UNION_HEADLINE_SERIES}
            shareOf={union}
            title="Largest groups"
            note="Share of Demand 51 net. Smaller lines omitted; bars will not fill 100%."
          />
          <p className="mt-4">
            <Link to="/union/police" className="file-cta">
              <span className="file-cta-notch" aria-hidden="true" />
              Open the Union ledger
            </Link>
          </p>
        </section>

        <section className="docket-door">
          <p className="kicker">States</p>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">State Governments</h2>
          <p className="mt-1 text-sm text-ink/70">
            {cov.gold} GOLD · {cov.index} INDEX · {cov.blocked} BLOCKED · {cov.empty} EMPTY. We do
            not guess.
          </p>
          <div className="mt-3">
            <Money money={mh} size="row" />
          </div>
          <HeadSplit
            run={mhRun}
            cap={mhCap}
            title="Running costs and capital"
            note="Same Maharashtra Budget column. Capital is the thin slice as printed."
          />
          <p className="mt-4">
            <Link to="/states" className="file-cta">
              <span className="file-cta-notch" aria-hidden="true" />
              Open the state index
            </Link>
          </p>
        </section>

        <section className="docket-door empty">
          <p className="kicker text-ink/50">Cities</p>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">Municipal Corporations</h2>
          <p className="mt-3 text-sm text-ink/75">
            Civic books are not typed. City police is usually state police. No rupee here.
          </p>
          <div className="mt-6 border border-dashed border-ink/25 px-3 py-6 text-center text-[0.7rem] uppercase tracking-[0.16em] text-ink/40">
            No hatch · no guessed rupee
          </div>
          <p className="mt-4">
            <Link to="/municipal" className="file-cta">
              <span className="file-cta-notch" aria-hidden="true" />
              Why this door is empty
            </Link>
          </p>
        </section>
      </div>

      <p className="mt-10 max-w-2xl text-sm text-ink/65">
        <Link to="/sources">How the books were read</Link>
        {" · "}
        <Link to="/maharashtra/police">Maharashtra Police ledger</Link>
        {" · "}
        <Link to="/union/delhi-police">Delhi Police (Union)</Link>
      </p>
    </article>
  );
}
