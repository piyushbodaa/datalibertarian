import { Link } from "react-router-dom";
import { Money } from "../components/Money";
import { seriesYearLabel } from "../lib/money";
import { commissionerates, cpHero } from "../data/telangana/commissionerates";

export function TgCommissioneratesPage() {
  return (
    <article>
      <p className="kicker">Telangana · Law+Home · HoDs</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Metro commissionerates
      </h1>
      <p className="mt-3 max-w-2xl text-ink">
        Law+Home prints <strong>commissionerate HoD totals</strong>. These are not statewide Police
        object 010, not Demand X Home, and not police-station allotments. We do not add them into
        the INDEX envelope, and we do not total the five as metro Police.
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
                <p className="text-sm text-ink/60">
                  {cp.hod} · MH {cp.majorHead}
                  {cp.missingYears.length ? " · year-gap in the books" : ""}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-[0.7rem] uppercase tracking-[0.12em] text-ink/50">
                  {seriesYearLabel(hero)}
                </p>
                <Money money={hero} size="row" />
              </div>
            </li>
          );
        })}
      </ul>

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <p className="kicker text-ochre">Not a metro total</p>
        <h2 className="mt-2 font-display text-xl font-semibold">No sum of these HoDs</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          Adding the rows would not be statewide Police, would not be Demand X Home, and would
          still not be station money. The statewide GOLD hero stays object 010 on{" "}
          <Link to="/telangana/police">Telangana Police</Link>.
        </p>
      </section>

      <p className="mt-8 text-sm">
        <Link to="/telangana/police">Statewide object 010</Link>
        {" · "}
        <Link to="/sources">Method</Link>
      </p>
    </article>
  );
}
