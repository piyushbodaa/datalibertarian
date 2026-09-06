import { Link, Navigate, useParams } from "react-router-dom";
import { getJurisdiction } from "../data/states";

export function EmptyPolicePage() {
  const { slug } = useParams();
  const j = slug ? getJurisdiction(slug) : undefined;
  if (!j) return <Navigate to="/states" replace />;
  if (j.police === "live") return <Navigate to={`/${j.slug}/police`} replace />;

  return (
    <article>
      <p className="kicker">
        {j.kind === "ut" ? "Union Territory" : "State"} books → Police
      </p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        {j.name} Police
      </h1>
      <p className="mt-4 max-w-2xl text-ink">
        We have not typed {j.name} Police books yet. Until an official White Book or Demand is
        read into this ledger, there is no number here. We do not guess.
      </p>
      {j.unionBooks ? (
        <p className="mt-4 max-w-2xl text-sm text-ink/75">
          Police for this Union Territory often sits in the Centre’s Ministry of Home Affairs
          demands — not a municipal corporation. Delhi Police and Jammu and Kashmir Police are
          printed in <Link to="/union/police">Union Demand 51</Link>.
        </p>
      ) : null}
      <p className="mt-8">
        <Link to="/maharashtra/police" className="file-cta">
          <span className="file-cta-notch" aria-hidden="true" />
          See the Maharashtra Police ledger
        </Link>
      </p>
      <p className="mt-6 text-sm">
        <Link to="/states">All states</Link>
        {" · "}
        <Link to="/sources">How a figure gets onto the page</Link>
      </p>
    </article>
  );
}
