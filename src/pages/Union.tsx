import { Link } from "react-router-dom";
import { Money } from "../components/Money";
import { demand51Net, UNION_HEADLINE_SERIES, UNION_HEADLINE_YEAR } from "../data/union/demand-51";
import { pickAmount } from "../data/maharashtra-police";
import { SERIES_PLAIN } from "../lib/money";

export function UnionPage() {
  const hero = pickAmount(demand51Net, UNION_HEADLINE_YEAR, UNION_HEADLINE_SERIES);
  if (!hero) throw new Error("Missing Union Demand 51 headline");

  return (
    <article>
      <p className="kicker">Union books</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Union Government</h1>
      <p className="mt-4 max-w-2xl text-ink">
        The Union Budget is the Centre’s books. It is not the sum of the states. The first Union
        ledger on this site is <strong>Demand 51 — Police</strong>: Central Armed Police Forces,
        Delhi Police, the Intelligence Bureau, and related Union heads.
      </p>
      <p className="mt-3 max-w-2xl text-sm text-ink/70">
        That is not “all Indian police.” Maharashtra, Telangana and the other states vote their own
        police money in state White Books.
      </p>

      <section className="mt-10 border-y border-ink/20 py-8">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Demand 51 Police</h2>
        <p className="mt-3 max-w-2xl text-ink/80">
          {SERIES_PLAIN[hero.series]} for FY {hero.fiscalYear}, net of recoveries, as printed in the
          Notes on Demands.
        </p>
        <div className="mt-6">
          <Money money={hero} size="hero" showSeries />
        </div>
        <p className="mt-8">
          <Link to="/union/police" className="file-cta">
            <span className="file-cta-notch" aria-hidden="true" />
            Open the Union police ledger
          </Link>
        </p>
      </section>

      <p className="mt-8 max-w-2xl text-sm text-ink/65">
        Other Union demands are not extracted yet. We will not guess them.{" "}
        <Link to="/sources">Method</Link>.
      </p>
    </article>
  );
}
