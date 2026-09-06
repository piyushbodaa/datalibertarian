import { Link } from "react-router-dom";
import { HeadSplit } from "../components/HeadSplit";
import { Money } from "../components/Money";
import { PrintedColumns } from "../components/PrintedColumns";
import { pickAmount } from "../data/maharashtra-police";
import {
  demand51Capital,
  demand51Net,
  demand51Revenue,
  UNION_HEADLINE_SERIES,
  UNION_HEADLINE_YEAR,
} from "../data/union/demand-51";

export function UnionPage() {
  const hero = pickAmount(demand51Net, UNION_HEADLINE_YEAR, UNION_HEADLINE_SERIES);
  const rev = pickAmount(demand51Revenue, UNION_HEADLINE_YEAR, UNION_HEADLINE_SERIES);
  const cap = pickAmount(demand51Capital, UNION_HEADLINE_YEAR, UNION_HEADLINE_SERIES);
  if (!hero || !rev || !cap) throw new Error("Missing Union Demand 51 headline");

  return (
    <article>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Centre</h1>
      <p className="mt-3 max-w-2xl text-ink">
        The Union’s books — not the sum of the states. First number: Centre police.
      </p>

      <section className="mt-8 border-y border-ink/20 py-8">
        <p className="text-sm text-ink/55">Centre police, 2026-27 plan</p>
        <div className="mt-4">
          <Money money={hero} size="hero" showSeries />
        </div>
        <HeadSplit
          run={rev}
          cap={cap}
          title="Revenue and capital"
          note="Same year’s plan. Not all Indian police."
          runLabel="Revenue"
          capLabel="Capital"
        />
        <PrintedColumns
          compact
          run={demand51Revenue}
          cap={demand51Capital}
          title="Last four official figures"
          caption="Spent, plan, updated plan, next plan."
        />
        <p className="mt-8">
          <Link to="/union/police" className="file-cta">
            <span className="file-cta-notch" aria-hidden="true" />
            Open the Union police ledger
          </Link>
        </p>
      </section>

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">
          Delhi Police
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          Delhi Police sits in the Centre’s books, not the Delhi government book. This is the
          force’s own line plus money set aside for its buildings — not the whole Centre police
          total.
        </p>
        <p className="mt-4">
          <Link to="/union/delhi-police" className="file-cta">
            <span className="file-cta-notch" aria-hidden="true" />
            Open Delhi Police
          </Link>
        </p>
      </section>

      <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">Other Centre books</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          Some Union Territory and Home-adjacent books are not typed yet. They are not this
          Centre police number, and they are not zero.
        </p>
        <p className="mt-4 text-sm text-ink/60">No figure yet.</p>
      </section>

      <p className="mt-8 max-w-2xl text-sm text-ink/65">
        <Link to="/sources">Method</Link>.
      </p>
    </article>
  );
}
