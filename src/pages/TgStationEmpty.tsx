import { Link, Navigate, useParams } from "react-router-dom";
import { getCommissionerate } from "../data/telangana/commissionerates";
import { getStation } from "../data/telangana/stations";

export function TgStationEmptyPage() {
  const { cp, station } = useParams();
  const unit = cp ? getCommissionerate(cp) : undefined;
  const ps = cp && station ? getStation(cp, station) : undefined;
  if (!unit) return <Navigate to="/telangana/commissionerates" replace />;
  if (!ps) return <Navigate to={`/telangana/${unit.slug}/stations`} replace />;

  return (
    <article>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{ps.name}</h1>
      <p className="mt-3 max-w-2xl text-ink">
        Under {unit.name}. This page has no rupee because the books have no station rupee.
      </p>

      <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">No figure yet</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          The state book prints a total for {unit.name}. It does not print a rupee for {ps.name}.
          We do not invent a station share, and we do not divide the city-police total by the
          number of stations.
        </p>
      </section>

      <p className="mt-8">
        <Link to={`/telangana/${unit.slug}`} className="file-cta">
          <span className="file-cta-notch" aria-hidden="true" />
          Open {unit.name}
        </Link>
      </p>
      <p className="mt-6 text-sm">
        <Link to={`/telangana/${unit.slug}/stations`}>Stations</Link>
        {" · "}
        <Link to="/telangana/police">Telangana Police</Link>
        {" · "}
        <Link to="/sources">Method</Link>
      </p>
    </article>
  );
}
