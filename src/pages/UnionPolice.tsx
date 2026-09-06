import { Link } from "react-router-dom";
import { CitationChip, CitationFootnote } from "../components/CitationChip";
import { HeadSplit } from "../components/HeadSplit";
import { Money } from "../components/Money";
import { PrintedColumns } from "../components/PrintedColumns";
import { RankedHatch } from "../components/RankedHatch";
import { pickAmount } from "../data/maharashtra-police";
import {
  demand51Capital,
  demand51Groups,
  demand51Net,
  demand51Revenue,
  mhaTotalBe2627,
  UNION_HEADLINE_SERIES,
  UNION_HEADLINE_YEAR,
} from "../data/union/demand-51";
import { formatCrore, SERIES_PLAIN } from "../lib/money";

export function UnionPolicePage() {
  const hero = pickAmount(demand51Net, UNION_HEADLINE_YEAR, UNION_HEADLINE_SERIES);
  const rev = pickAmount(demand51Revenue, UNION_HEADLINE_YEAR, UNION_HEADLINE_SERIES);
  const cap = pickAmount(demand51Capital, UNION_HEADLINE_YEAR, UNION_HEADLINE_SERIES);
  if (!hero || !rev || !cap) throw new Error("Missing Union Demand 51 series");

  const usedIds = [hero.citationId, mhaTotalBe2627.citationId].filter(
    (id, i, arr) => arr.indexOf(id) === i,
  );

  return (
    <article>
      <p className="kicker">Union books → Demand 51 → Police</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Union Demand 51 — Police
      </h1>
      <p className="mt-4 max-w-2xl text-ink">
        This is the Centre’s Police demand: Central Armed Police Forces, Delhi Police, Jammu and
        Kashmir Police, the Intelligence Bureau, border and police infrastructure, and related
        schemes. It is <strong>not</strong> the total of every state’s police budget.
      </p>

      <div className="mt-8 border-y border-ink/20 py-8">
        <p className="kicker text-ink/50">Budget estimate · FY {hero.fiscalYear} · net</p>
        <div className="mt-3">
          <Money money={hero} size="hero" />
        </div>
        <p className="mt-4 max-w-xl text-sm text-ink/70">
          {SERIES_PLAIN[hero.series]}. Revenue ₹{formatCrore(rev.crore)} crore
          <CitationChip citationId={rev.citationId} compact /> plus capital ₹
          {formatCrore(cap.crore)} crore
          <CitationChip citationId={cap.citationId} compact />.
        </p>
      </div>

      <PrintedColumns
        run={demand51Revenue}
        cap={demand51Capital}
        caption="Each bar is Demand 51 net (revenue plus capital) as the Notes on Demands print it. Actuals, Budget, and Revised are different kinds of figure — not one trend."
      />

      <HeadSplit
        run={rev}
        cap={cap}
        title="Revenue and capital, this plan"
        note="Same Budget column as the headline. Capital is the smaller slice of Demand 51 — as printed, not a drawing error."
        runLabel="Revenue"
        capLabel="Capital"
      />

      <RankedHatch
        items={demand51Groups}
        fiscalYear={UNION_HEADLINE_YEAR}
        series={UNION_HEADLINE_SERIES}
        shareOf={hero}
        title="Largest printed groups"
        note={`Share of Demand 51 net, ${UNION_HEADLINE_YEAR} budget. Same document. Smaller printed lines are not listed; the bars will not fill 100%.`}
      />

      <section className="carbon-sheet mt-14 px-4 py-6 sm:px-6">
        <p className="kicker">Union sub-door · not Demand 51 net</p>
        <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">
          Delhi Police — establishment + infrastructure
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          The printed group labelled Delhi Police on this demand is establishment. The Union
          sub-door adds Police Infrastructure earmarked Delhi Police. It is not the Demand 51 net
          total, not GNCTD AFS, and not a state rank.
        </p>
        <p className="mt-4">
          <Link to="/union/delhi-police" className="file-cta">
            <span className="file-cta-notch" aria-hidden="true" />
            Open the Delhi Police ledger
          </Link>
        </p>
      </section>

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <p className="kicker text-ochre">Related ministry · quieter</p>
        <h2 className="mt-2 font-display text-xl font-semibold text-ink/80">
          The Ministry of Home Affairs is not police-only
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/70">
          Demand 51 sits inside the Ministry of Home Affairs. That ministry also includes Cabinet,
          Union Territory demands, and transfers. Do not treat the ministry total as Police
          spending. The Police number above is Demand 51 net.
        </p>
        <p className="mt-4 text-ink/80">
          Ministry of Home Affairs, FY {mhaTotalBe2627.fiscalYear} budget:{" "}
          <Money money={mhaTotalBe2627} size="row" />
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
          Method: <Link to="/sources">Sources</Link>. State police books:{" "}
          <Link to="/states">States</Link>.
        </p>
      </section>
    </article>
  );
}
