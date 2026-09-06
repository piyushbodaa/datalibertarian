import { Link, Navigate, useParams } from "react-router-dom";
import { getCommissionerate } from "../data/telangana/commissionerates";
import { stationsFor } from "../data/telangana/stations";

export function TgStationIndexPage() {
  const { cp } = useParams();
  const unit = cp ? getCommissionerate(cp) : undefined;
  if (!unit) return <Navigate to="/telangana/commissionerates" replace />;
  const named = stationsFor(unit.slug);

  return (
    <article>
      <p className="kicker">EMPTY · stations not in Demand books</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        {unit.name} · stations
      </h1>
      <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
        <p className="kicker text-ochre">Honesty slip</p>
        <h2 className="mt-2 font-display text-xl font-semibold">Stations not enumerated in budget books</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          Law+Home prints commissionerate HoD totals. Individual police-station allotments are not
          in the public Demand books. We do not invent a station share, and we do not divide the
          HoD total by N stations.
        </p>
        <div className="mt-6 border border-dashed border-ink/25 px-3 py-8 text-center text-[0.7rem] uppercase tracking-[0.16em] text-ink/40">
          No hatch · no guessed rupee
        </div>
      </section>

      {named.length ? (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold tracking-tight">Named EMPTY doors</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink/70">
            A named station here is a drill endpoint, not a printed allotment.
          </p>
          <ul className="mt-4 divide-y divide-ink/15 border-y border-ink/20">
            {named.map((s) => (
              <li key={s.slug} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                <Link
                  to={`/telangana/${unit.slug}/stations/${s.slug}`}
                  className="font-medium text-ink no-underline hover:text-rust"
                >
                  {s.name}
                </Link>
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ochre">
                  EMPTY
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-8">
        <Link to={`/telangana/${unit.slug}`} className="file-cta">
          <span className="file-cta-notch" aria-hidden="true" />
          Back to the {unit.name} HoD ledger
        </Link>
      </p>
    </article>
  );
}
