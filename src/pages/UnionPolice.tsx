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
import { formatCrore } from "../lib/money";

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
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Centre Police
      </h1>
      <p className="mt-4 max-w-2xl text-ink">
        What the Union budget set aside for Central Armed Police Forces, Delhi Police, Jammu and
        Kashmir Police, the Intelligence Bureau, and related schemes. Not the total of every
        state’s police budget.
      </p>

      <div className="mt-8 border-y border-ink/20 py-8">
        <p className="text-sm text-ink/55">2026-27 plan</p>
        <div className="mt-3">
          <Money money={hero} size="hero" />
        </div>
        <p className="mt-4 max-w-xl text-sm text-ink/70">
          Running costs ₹{formatCrore(rev.crore)} crore
          <CitationChip citationId={rev.citationId} compact /> · Buildings and gear ₹
          {formatCrore(cap.crore)} crore
          <CitationChip citationId={cap.citationId} compact />.
        </p>
      </div>

      <PrintedColumns
        run={demand51Revenue}
        cap={demand51Capital}
        caption="Spent, plan, updated plan, and next plan. Each bar is this Centre police book as printed."
      />

      <HeadSplit
        run={rev}
        cap={cap}
        title="Running costs vs buildings and gear"
        note="Same year’s plan. Buildings and gear are the thinner slice — that is the book."
        runLabel="Running costs"
        capLabel="Buildings and gear"
      />

      <RankedHatch
        items={demand51Groups}
        fiscalYear={UNION_HEADLINE_YEAR}
        series={UNION_HEADLINE_SERIES}
        shareOf={hero}
        title="Largest printed groups"
        note={`Share of Centre police, ${UNION_HEADLINE_YEAR} plan. Same document. Smaller printed lines are not listed; the bars will not fill 100%.`}
      />

      <section className="carbon-sheet mt-14 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">
          Delhi Police
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          Delhi Police sits in this Centre book, not the Delhi government book. The Delhi Police
          page adds buildings money earmarked for that force. It is not this whole Centre police
          total.
        </p>
        <p className="mt-4">
          <Link to="/union/delhi-police" className="file-cta">
            <span className="file-cta-notch" aria-hidden="true" />
            Open Delhi Police
          </Link>
        </p>
      </section>

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold text-ink/80">
          The Home ministry is larger than police
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/70">
          Centre police sits inside the Ministry of Home Affairs. That ministry also includes
          Cabinet, Union Territory books, and transfers. Do not treat the ministry total as
          Police. The Police number above is this demand only.
        </p>
        <p className="mt-4 text-ink/80">
          Ministry of Home Affairs, {mhaTotalBe2627.fiscalYear} plan:{" "}
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
          Account in the book: Demand 51 (Police).{" "}
          <Link to="/sources">Method</Link>
          {" · "}
          <Link to="/states">States</Link>.
        </p>
      </section>
    </article>
  );
}
