import { Link, Navigate, useParams } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";
import { Money } from "../components/Money";
import { apLastFound, getIndexLine } from "../data/prs-index/afs-police";
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
        <p className="kicker" style={{ color: "var(--zinc)" }}>
          {tierLabel(j.tier)}
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          {j.name} Police
        </h1>
        <div className="index-slip mt-6">
          <p className="kicker">INDEX · PRS AFS</p>
          <p className="mt-2 text-sm text-ink/70">
            PRS AFS Police functional — not state White Book depth yet.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-ink/75">
            INDEX envelope only. This is not a Grant, White Book, or Demand extract. We do not
            dress it as GOLD LIVE.
          </p>
          <div className="mt-6 border-y border-ink/15 py-6">
            <p className="kicker text-ink/50">Budget · FY 2025-26</p>
            <div className="mt-3">
              <Money money={hero} size="hero" showSeries />
            </div>
          </div>
          {j.depthGap ? (
            <p className="mt-4 text-sm text-ink/70">
              Object-head depth: <strong>GAP on disk</strong>. Demand PDFs are not typed. Headline
              stays INDEX until they land.
            </p>
          ) : null}
          {j.indexNote ? <p className="mt-4 text-sm text-ink/70">{j.indexNote}</p> : null}
        </div>
        <section className="mt-10 text-sm text-ink/70">
          <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
          <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
            <CitationFootnote citationId={hero.citationId} />
          </ol>
          <p className="mt-6">
            <Link to="/states">All 27 INDEX envelopes</Link>
            {" · "}
            <Link to="/sources">How INDEX differs from GOLD</Link>
          </p>
        </section>
      </article>
    );
  }

  if (j.tier === "blocked") {
    const ap = j.slug === "andhra-pradesh";
    return (
      <article>
        <p className="kicker text-ochre">{tierLabel(j.tier)}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          {j.name} Police
        </h1>
        <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
          <p className="kicker text-ochre">Honesty slip</p>
          <h2 className="mt-2 font-display text-xl font-semibold">Later years are not rupees</h2>
          <p className="mt-3 max-w-2xl text-sm text-ink/75">{j.blockReason}</p>
          {ap ? (
            <dl className="mt-5 max-w-xl divide-y divide-ink/15 border-y border-ink/20 text-sm">
              <div className="flex justify-between gap-4 py-2.5">
                <dt>Last found · Budget FY 2024-25</dt>
                <dd>
                  <Money money={apLastFound.be2425} size="row" />
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2.5">
                <dt>Last found · Actuals FY 2024-25</dt>
                <dd>
                  <Money money={apLastFound.actual2425} size="row" />
                </dd>
              </div>
            </dl>
          ) : null}
        </section>
        <section className="mt-10 text-sm text-ink/70">
          <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
          {ap ? (
            <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
              <CitationFootnote citationId={apLastFound.be2425.citationId} />
            </ol>
          ) : null}
          <p className="mt-6">
            <Link to="/states">States</Link>
            {" · "}
            <Link to="/sources">Method</Link>
          </p>
        </section>
      </article>
    );
  }

  return (
    <article>
      <p className="kicker">{j.kind === "ut" ? "Union Territory" : "State"} books → Police</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">{j.name} Police</h1>
      <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
        <p className="kicker text-ochre">{tierLabel("empty")}</p>
        <h2 className="mt-2 font-display text-xl font-semibold">No rupee until a book is typed</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          {j.name} is not in the PRS AFS Police functional INDEX of 27, and no White Book or Demand
          has been typed here. Empty is honest. We do not guess.
        </p>
        <div className="mt-6 border border-dashed border-ink/25 px-3 py-8 text-center text-[0.7rem] uppercase tracking-[0.16em] text-ink/40">
          No hatch · no guessed rupee
        </div>
        {j.slug === "delhi" ? (
          <p className="mt-5 max-w-2xl text-sm text-ink/75">
            Delhi Police is a <strong>Union</strong> door — establishment plus infrastructure on
            Demand 51 — not a state INDEX row and not GNCTD AFS.{" "}
            <Link to="/union/delhi-police">Open the Union Delhi Police ledger</Link>.
          </p>
        ) : j.unionBooks ? (
          <p className="mt-5 max-w-2xl text-sm text-ink/75">
            Police for this Union Territory often sits in the Centre’s Ministry of Home Affairs
            demands. Printed groups live on <Link to="/union/police">Union Demand 51</Link> — not
            as a state White Book.
          </p>
        ) : null}
      </section>
      <p className="mt-8">
        <Link to="/states" className="file-cta">
          <span className="file-cta-notch" aria-hidden="true" />
          Back to the state index
        </Link>
      </p>
      <p className="mt-6 text-sm">
        <Link to="/sources">How a figure gets onto the page</Link>
      </p>
    </article>
  );
}
