import { Link } from "react-router-dom";
import { Money } from "../components/Money";
import { seriesYearLabel } from "../lib/money";
import { commissionerates, cpHero } from "../data/telangana/commissionerates";

export function TgCommissioneratesPage() {
  return (
    <article>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Telangana city police
      </h1>
      <p className="mt-3 max-w-2xl text-ink">
        These are city-police office totals from the state book. They are not the statewide
        police number, not the whole Home grant, and not money for a named police station. We do
        not add the five into one metro total.
      </p>

      <ul className="mt-8 divide-y divide-ink/15 border-y border-ink/20">
        {commissionerates.map((cp) => {
          const hero = cpHero(cp);
          return (
            <li key={cp.slug} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <Link
                  to={`/telangana/${cp.slug}`}
                  className="font-medium text-ink no-underline hover:text-rust"
                >
                  {cp.name}
                </Link>
                {cp.missingYears.length ? (
                  <p className="text-sm text-ink/60">A year is missing in the book.</p>
                ) : null}
              </div>
              <div className="sm:text-right">
                <p className="text-sm text-ink/50">{seriesYearLabel(hero)}</p>
                <Money money={hero} size="row" />
              </div>
            </li>
          );
        })}
      </ul>

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">Not a metro total</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          Adding these rows would still not be statewide police, and still not be station money.
          The statewide number stays on <Link to="/telangana/police">Telangana Police</Link>.
        </p>
      </section>

      <p className="mt-8 text-sm">
        <Link to="/telangana/police">Telangana Police</Link>
        {" · "}
        <Link to="/sources">Method</Link>
      </p>
    </article>
  );
}
