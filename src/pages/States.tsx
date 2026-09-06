import { Link } from "react-router-dom";
import { HeadSplit } from "../components/HeadSplit";
import { Money } from "../components/Money";
import { PrintedColumns } from "../components/PrintedColumns";
import {
  functionalPolice,
  HEADLINE_SERIES,
  HEADLINE_YEAR,
  pickAmount,
  police2055,
  police4055,
} from "../data/maharashtra-police";
import { jurisdictions } from "../data/states";

export function StatesPage() {
  const states = jurisdictions.filter((j) => j.kind === "state");
  const uts = jurisdictions.filter((j) => j.kind === "ut");
  const live = jurisdictions.filter((j) => j.police === "live").length;
  const mh = pickAmount(functionalPolice, HEADLINE_YEAR, HEADLINE_SERIES);
  const run = pickAmount(police2055, HEADLINE_YEAR, HEADLINE_SERIES);
  const cap = pickAmount(police4055, HEADLINE_YEAR, HEADLINE_SERIES);
  if (!mh || !run || !cap) throw new Error("Missing Maharashtra headline");

  return (
    <article>
      <p className="kicker">State books</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">State Governments</h1>
      <p className="mt-3 max-w-2xl text-ink">
        {live} police ledger live. The rest have no rupee until a White Book is typed.
      </p>

      <section className="mt-8 border-y border-ink/20 py-8">
        <p className="kicker">Books live</p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">Maharashtra Police</h2>
        <div className="mt-4">
          <Money money={mh} size="hero" showSeries />
        </div>
        <HeadSplit run={run} cap={cap} />
        <PrintedColumns
          compact
          run={police2055}
          cap={police4055}
          title="Four printed columns"
          caption="Maharashtra White Book. Actuals, Budget, Revised — not one trend."
        />
        <p className="mt-6">
          <Link to="/maharashtra/police" className="file-cta">
            <span className="file-cta-notch" aria-hidden="true" />
            Open the Maharashtra ledger
          </Link>
        </p>
      </section>

      <Section title="States" rows={states} />
      <Section title="Union Territories" rows={uts} />

      <p className="mt-10 max-w-2xl text-sm text-ink/65">
        Union Territory police often sits in the Centre’s books. See{" "}
        <Link to="/union/police">Union Demand 51</Link>. <Link to="/sources">Method</Link>.
      </p>
    </article>
  );
}

function Section({
  title,
  rows,
}: {
  title: string;
  rows: typeof jurisdictions;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
      <ul className="mt-4 divide-y divide-ink/15 border-y border-ink/20">
        {rows.map((j) => (
          <li key={j.slug} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
            <Link to={`/${j.slug}/police`} className="font-medium text-ink no-underline hover:text-rust">
              {j.name}
            </Link>
            {j.police === "live" ? (
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-rust">
                Books live
              </span>
            ) : (
              <span className="text-[0.7rem] uppercase tracking-[0.12em] text-ink/45">
                Books not extracted yet
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
