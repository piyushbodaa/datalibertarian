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
  police2055Lines,
  police4055,
} from "../data/maharashtra-police";
import { SERIES_PLAIN } from "../lib/money";

export function HomePage() {
  const hero = pickAmount(functionalPolice, HEADLINE_YEAR, HEADLINE_SERIES);
  const run = pickAmount(police2055, HEADLINE_YEAR, HEADLINE_SERIES);
  const cap = pickAmount(police4055, HEADLINE_YEAR, HEADLINE_SERIES);
  if (!hero || !run || !cap) throw new Error("Missing headline figure");

  return (
    <article>
      <p className="kicker">Maharashtra docket</p>
      <h1 className="mt-2 max-w-3xl font-display text-[2.05rem] font-semibold leading-[1.12] tracking-tight sm:text-5xl">
        Government money is your money. The books are public. They are not readable.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink sm:text-lg">
        Data Libertarian opens official government accounts so an ordinary person can see where a
        rupee was put. This is not a tracker of charities or NGOs. It is taxpayer money, as written
        in the state&rsquo;s own budget.
      </p>

      <section className="mt-8 border-y border-ink/20 py-6 sm:py-8">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Maharashtra Police spending</h2>
        <p className="mt-3 max-w-2xl text-ink/80">
          One state. One department of the books: Police. The number below is{" "}
          {SERIES_PLAIN[hero.series]} for FY {hero.fiscalYear} — running costs plus buildings and
          equipment, as printed under heads 2055 and 4055.
        </p>
        <div className="mt-6">
          <Money money={hero} size="hero" showSeries />
        </div>

        <PrintedColumns run={police2055} cap={police4055} />
        <HeadSplit run={run} cap={cap} />
        <RankedHatch items={police2055Lines} fiscalYear={HEADLINE_YEAR} series={HEADLINE_SERIES} />

        <p className="mt-8">
          <Link to="/maharashtra/police" className="file-cta">
            <span className="file-cta-notch" aria-hidden="true" />
            Open the full police ledger
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
