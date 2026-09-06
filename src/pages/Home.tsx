import { Link } from "react-router-dom";
import {
  functionalPolice,
  HEADLINE_SERIES,
  HEADLINE_YEAR,
  pickAmount,
  police2055,
  police2055Lines,
  police4055,
} from "../data/maharashtra-police";
import { Money } from "../components/Money";
import { ShareStripe } from "../components/ShareStripe";
import { SERIES_PLAIN } from "../lib/money";

export function HomePage() {
  const hero = pickAmount(functionalPolice, HEADLINE_YEAR, HEADLINE_SERIES);
  const run = pickAmount(police2055, HEADLINE_YEAR, HEADLINE_SERIES);
  const cap = pickAmount(police4055, HEADLINE_YEAR, HEADLINE_SERIES);
  if (!hero || !run || !cap) throw new Error("Missing headline figure");

  return (
    <article>
      <p className="m-0 text-[0.7rem] uppercase tracking-[0.22em] text-tyrian">Gazette ledger</p>
      <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        Government money is your money. The books are public. They are not readable.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink">
        Data Libertarian opens official government accounts so an ordinary person can see where a
        rupee was put. This is not a tracker of charities or NGOs. It is taxpayer money, as written
        in the state&rsquo;s own budget.
      </p>

      <section className="mt-12 border-y border-ink/20 py-8">
        <h2 className="font-display text-2xl font-semibold">Maharashtra Police spending</h2>
        <p className="mt-3 max-w-2xl text-ink/80">
          One state. One department of the books: Police. The number below is{" "}
          {SERIES_PLAIN[hero.series]} for FY {hero.fiscalYear} — running costs plus buildings and
          equipment, as printed under heads 2055 and 4055.
        </p>
        <div className="mt-6">
          <Money money={hero} size="hero" showSeries />
        </div>
        <dl className="mt-8 max-w-xl divide-y divide-ink/15 border-y border-ink/20 text-sm">
          <div className="flex justify-between gap-4 py-2.5 pl-0">
            <dt>of which running costs (2055)</dt>
            <dd className="m-0">
              <Money money={run} size="row" />
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt>of which capital (4055)</dt>
            <dd className="m-0">
              <Money money={cap} size="row" />
            </dd>
          </div>
        </dl>
        <ShareStripe
          items={police2055Lines}
          fiscalYear={HEADLINE_YEAR}
          series={HEADLINE_SERIES}
        />
        <p className="mt-8">
          <Link
            to="/maharashtra/police"
            className="inline-block border-b-2 border-tyrian pb-0.5 text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-tyrian no-underline hover:border-ink hover:text-ink"
          >
            Open the full police ledger →
          </Link>
        </p>
      </section>

      <p className="mt-10 max-w-2xl text-sm text-ink/65">
        A rupee is voted, revised, or booked — those labels stay on the number. Later: other
        states and Union books, same method. Not NGOs.{" "}
        <Link to="/sources">How the White Book was read</Link>.
      </p>
    </article>
  );
}
