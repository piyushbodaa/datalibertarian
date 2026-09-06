import { Link, Navigate, useParams } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";
import { Money } from "../components/Money";
import { getIndexLine } from "../data/prs-index/afs-police";
import { getJurisdiction, tierLabel } from "../data/states";

export function EmptyPolicePage() {
  const { slug } = useParams();
  const j = slug ? getJurisdiction(slug) : undefined;
  if (!j) return <Navigate to="/states" replace />;
  if (j.tier === "gold") return <Navigate to={`/${j.slug}/police`} replace />;

  if (j.tier === "index") {
    const line = getIndexLine(j.slug);
    const hero = line?.amounts.find((a) => a.fiscalYear === "2025-26" && a.series === "be");
    if (!hero) return <Navigate to="/states" replace />;
    return (
      <article>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          {j.name} Police
        </h1>
        <div className="index-slip mt-6">
          <p className="mt-2 max-w-2xl text-sm text-ink/75">
            We have not read this state’s official budget book yet. A research summary lists a
            police figure for 2025-26. That is not from the state’s book, so it is not the number
            we use to compare.
          </p>
          <p className="mt-6 text-sm text-ink/60">
            Research summary, 2025-26 plan: <Money money={hero} size="row" />
          </p>
          {j.indexNote ? <p className="mt-4 text-sm text-ink/70">{j.indexNote}</p> : null}
        </div>
        <section className="mt-10 text-sm text-ink/70">
          <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
          <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
            <CitationFootnote citationId={hero.citationId} />
          </ol>
          <p className="mt-6">
            <Link to="/states">All states</Link>
            {" · "}
            <Link to="/sources">Method</Link>
          </p>
        </section>
      </article>
    );
  }

  if (j.tier === "blocked") {
    return (
      <article>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          {j.name} Police
        </h1>
        <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
          <h2 className="mt-2 font-display text-xl font-semibold">{tierLabel(j.tier)}</h2>
          <p className="mt-3 max-w-2xl text-sm text-ink/75">{j.blockReason}</p>
        </section>
        <section className="mt-10 text-sm text-ink/70">
          <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
          <p className="mt-6">
            <Link to="/states">All states</Link>
            {" · "}
            <Link to="/sources">Method</Link>
          </p>
        </section>
      </article>
    );
  }

  return (
    <article>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">{j.name} Police</h1>
      <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">We have not read this book yet</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          No official {j.name} police figure is on this site. We do not guess.
        </p>
        {j.slug === "delhi" ? (
          <p className="mt-5 max-w-2xl text-sm text-ink/75">
            Delhi Police sits in the Centre’s books, not a state book.{" "}
            <Link to="/union/delhi-police">Open Delhi Police</Link>.
          </p>
        ) : j.unionBooks ? (
          <p className="mt-5 max-w-2xl text-sm text-ink/75">
            Police for this Union Territory often sits in the Centre’s books.{" "}
            <Link to="/union/police">Open Centre Police</Link>.
          </p>
        ) : null}
      </section>
      <p className="mt-8">
        <Link to="/states" className="file-cta">
          <span className="file-cta-notch" aria-hidden="true" />
          All states
        </Link>
      </p>
      <p className="mt-6 text-sm">
        <Link to="/sources">Method</Link>
      </p>
    </article>
  );
}
