import { Link, Navigate, useParams } from "react-router-dom";
import { NotFoundPage } from "./NotFound";
import { getHead, headTier, type HeadId } from "../data/heads";
import { getJurisdiction, tierLabel } from "../data/states";

/** Generic door for a head we have not read for this state. Police keeps its own page. */
export function EmptyHeadPage({ head }: { head: Exclude<HeadId, "police"> }) {
  const { slug } = useParams();
  const j = slug ? getJurisdiction(slug) : undefined;
  const h = getHead(head);
  if (!j || !h) return <NotFoundPage />;
  const tier = headTier(j.heads, head);
  if (tier === "gold") return <Navigate to={`/${j.slug}/${head}`} replace />;

  return (
    <article>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        {j.name} {h.label}
      </h1>
      <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">{tierLabel(tier)}</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          No official {j.name} {h.label.toLowerCase()} figure is on this site. We do not guess.
          The account heads we would read are {h.majorHeads.join(", ")}.
        </p>
      </section>
      <p className="mt-8">
        <Link to="/telangana/health" className="file-cta">
          <span className="file-cta-notch" aria-hidden="true" />
          Telangana Health (the one we have read)
        </Link>
      </p>
      <p className="mt-6 text-sm">
        <Link to={`/${j.slug}/police`}>{j.name} Police</Link>
        {" · "}
        <Link to="/states">All states</Link>
        {" · "}
        <Link to="/sources">Method</Link>
      </p>
    </article>
  );
}
