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
      <p className="kicker">Union books</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Union Government</h1>
      <p className="mt-3 max-w-2xl text-ink">
        The Centre’s books — not the sum of the states. First ledger: Demand 51 Police.
      </p>

      <section className="mt-8 border-y border-ink/20 py-8">
        <p className="kicker">Demand 51 Police · net</p>
        <div className="mt-4">
          <Money money={hero} size="hero" showSeries />
        </div>
        <HeadSplit
          run={rev}
          cap={cap}
          title="Revenue and capital"
          note="Same Budget column. Not all Indian police."
          runLabel="Revenue"
          capLabel="Capital"
        />
        <PrintedColumns
          compact
          run={demand51Revenue}
          cap={demand51Capital}
          title="Four printed columns"
          caption="Demand 51 net. Actuals, Budget, and Revised — not one trend."
        />
        <p className="mt-8">
          <Link to="/union/police" className="file-cta">
            <span className="file-cta-notch" aria-hidden="true" />
            Open the Union police ledger
          </Link>
        </p>
      </section>

      <p className="mt-8 max-w-2xl text-sm text-ink/65">
        Other Union demands are not extracted.{" "}
        <Link to="/sources">Method</Link>.
      </p>
    </article>
  );
}
