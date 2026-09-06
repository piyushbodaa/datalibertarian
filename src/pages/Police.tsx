import { Link } from "react-router-dom";
import { CitationChip, CitationFootnote } from "../components/CitationChip";
import { LedgerTable } from "../components/LedgerTable";
import { Money } from "../components/Money";
import { ShareStripe } from "../components/ShareStripe";
import {
  functionalPolice,
  grantB1,
  HEADLINE_SERIES,
  HEADLINE_YEAR,
  pickAmount,
  police2055,
  police2055Lines,
  police4055,
  stateTotalExpenditure,
} from "../data/maharashtra-police";
import { formatCrore, SERIES_PLAIN } from "../lib/money";

export function PolicePage() {
  const hero = pickAmount(functionalPolice, HEADLINE_YEAR, HEADLINE_SERIES);
  const run = pickAmount(police2055, HEADLINE_YEAR, HEADLINE_SERIES);
  const cap = pickAmount(police4055, HEADLINE_YEAR, HEADLINE_SERIES);
  const b1 = pickAmount(grantB1, HEADLINE_YEAR, HEADLINE_SERIES);
  const state = stateTotalExpenditure.find(
    (m) => m.fiscalYear === HEADLINE_YEAR && m.series === HEADLINE_SERIES,
  );
  if (!hero || !run || !cap || !b1 || !state) throw new Error("Missing headline series");

  const share = (hero.crore / state.crore) * 100;
  const usedIds = [
    hero.citationId,
    run.citationId,
    cap.citationId,
    b1.citationId,
    state.citationId,
  ].filter((id, i, arr) => arr.indexOf(id) === i);

  return (
    <article>
      <p className="m-0 text-[0.7rem] uppercase tracking-[0.22em] text-tyrian">
        Maharashtra · State books · Police
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Maharashtra Police spending
      </h1>
      <p className="mt-4 max-w-2xl text-ink">
        This is what the state books call Police: pay and running costs (head{" "}
        <strong>2055</strong>) plus buildings and equipment (head <strong>4055</strong>). It is not
        the entire Home Department. Mumbai Police is state police, not a municipal budget.
      </p>

      <div className="mt-8 border-y border-ink/20 py-8">
        <p className="m-0 text-[0.7rem] uppercase tracking-[0.16em] text-ink/50">
          {hero.series === "be" ? "Budget estimate" : hero.series} · FY {hero.fiscalYear}
        </p>
        <Money money={hero} size="hero" />
        <p className="mt-4 max-w-xl text-sm text-ink/70">
          {SERIES_PLAIN[hero.series]}. Running costs ₹{formatCrore(run.crore)} crore
          <CitationChip citationId={run.citationId} compact /> plus capital ₹
          {formatCrore(cap.crore)} crore
          <CitationChip citationId={cap.citationId} compact />.
        </p>
        <p className="mt-3 max-w-xl text-sm text-ink/70">
          That is {share.toFixed(1)}% of Maharashtra&rsquo;s budgeted spending of ₹
          {formatCrore(state.crore)} crore in the same year
          <CitationChip citationId={state.citationId} />. Share uses two official books: Police from
          the Home White Book, state total from Budget in Brief.
        </p>
      </div>

      <dl className="mt-10 divide-y divide-ink/15 border-y border-ink/20">
        <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between">
          <dt>
            <span className="font-display text-lg font-semibold">Running costs · 2055</span>
            <span className="mt-0.5 block text-sm text-ink/65">Pay, stations, investigation, training.</span>
          </dt>
          <dd className="m-0 sm:text-right">
            <Money money={run} size="row" />
          </dd>
        </div>
        <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between">
          <dt>
            <span className="font-display text-lg font-semibold">Capital · 4055</span>
            <span className="mt-0.5 block text-sm text-ink/65">Buildings, vehicles, equipment.</span>
          </dt>
          <dd className="m-0 sm:text-right">
            <Money money={cap} size="row" />
          </dd>
        </div>
      </dl>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">The police ledger</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink/70">
          <span className="hidden md:inline">
            Columns are four official series from the same White Book.{" "}
          </span>
          <span className="md:hidden">
            Each line shows the FY 2026-27 budget first, then revised, prior budget, and actuals
            underneath.{" "}
          </span>
          <strong>Actuals</strong> is money booked. <strong>Budget</strong> is the plan.{" "}
          <strong>Revised</strong> is the mid-year plan. Amounts in crore of rupees.
        </p>
        <div className="mt-6">
          <LedgerTable
            items={[police2055, police4055, ...police2055Lines]}
            caption="2055 net total, 4055 capital, then 2055 voted lines as printed."
          />
        </div>
      </section>

      <ShareStripe items={police2055Lines} fiscalYear={HEADLINE_YEAR} series={HEADLINE_SERIES} />

      <section className="mt-14 border-t border-ink/20 pt-8">
        <p className="m-0 text-[0.7rem] uppercase tracking-[0.16em] text-khaki">Related grant · quieter</p>
        <h2 className="mt-2 font-display text-xl font-semibold text-ink/80">
          Grant B-1 is not police-only
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/70">
          The Assembly votes Grant B-1, labelled &ldquo;Police Administration.&rdquo; That grant
          also includes <strong>courts</strong> (Administration of Justice, head 2014) and{" "}
          <strong>other home services</strong> (head 2070). Do not treat it as Police spending. The
          Police number above is 2055 + 4055.
        </p>
        <p className="mt-4 text-ink/80">
          Grant B-1 total, FY {b1.fiscalYear} {b1.series === "be" ? "budget" : b1.series}:{" "}
          <Money money={b1} size="row" />
        </p>
      </section>

      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          {usedIds.map((id) => (
            <CitationFootnote key={id} citationId={id} />
          ))}
        </ol>
        <p className="mt-6">
          Method, limitations, and White Book status: <Link to="/sources">Sources</Link>.
        </p>
      </section>
    </article>
  );
}
