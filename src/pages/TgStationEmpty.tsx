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
      <p className="kicker text-ochre">EMPTY · not printed in Demand books</p>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{ps.name}</h1>
      <p className="mt-3 max-w-2xl text-ink">
        Under {unit.name}. This page has no rupee because the books have no station rupee.
      </p>

      <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
        <p className="kicker text-ochre">Honesty slip</p>
        <h2 className="mt-2 font-display text-xl font-semibold">No station allotment in Law+Home</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          Law+Home prints commissionerate HoD totals. Individual police-station allotments (e.g.{" "}
          {ps.name}) are not in the public Demand books. We do not invent a station share.
        </p>
        <div className="mt-6 border border-dashed border-ink/25 px-3 py-10 text-center text-[0.7rem] uppercase tracking-[0.16em] text-ink/40">
          No hatch · no guessed rupee
        </div>
        <p className="mt-5 max-w-2xl text-sm text-ink/70">
          News, tenders, and press notes are not citation for station rupees. The Cyberabad HoD
          total is not divided across stations.
        </p>
      </section>

      <p className="mt-8">
        <Link to={`/telangana/${unit.slug}`} className="file-cta">
          <span className="file-cta-notch" aria-hidden="true" />
          Open the {unit.name} HoD ledger
        </Link>
      </p>
      <p className="mt-6 text-sm">
        <Link to={`/telangana/${unit.slug}/stations`}>Station index</Link>
        {" · "}
        <Link to="/telangana/police">Statewide object 010</Link>
        {" · "}
        <Link to="/sources">Method</Link>
      </p>
    </article>
  );
}
