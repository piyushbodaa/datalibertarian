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
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        {unit.name} stations
      </h1>
      <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">Stations are not in the book</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          The state book prints a total for this city-police office. Individual police-station
          allotments are not in it. We do not invent a station share, and we do not divide the
          office total by the number of stations.
        </p>
        <p className="mt-4 text-sm text-ink/60">No figure yet.</p>
      </section>

      {named.length ? (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold tracking-tight">Named stations</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink/70">
            A named station here is a door, not a printed allotment.
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
                <span className="text-sm text-ink/55">Not ready</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-8">
        <Link to={`/telangana/${unit.slug}`} className="file-cta">
          <span className="file-cta-notch" aria-hidden="true" />
          Back to {unit.name}
        </Link>
      </p>
    </article>
  );
}
