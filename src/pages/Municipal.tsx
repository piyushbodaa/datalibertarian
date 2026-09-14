import { Link } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";
import { Money } from "../components/Money";
import { seriesYearLabel } from "../lib/money";
import { municipalBodies, municipalHero } from "../data/municipal/ghmc";

export function MunicipalPage() {
  const read = municipalBodies.filter((m) => m.tier === "gold");
  return (
    <article>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">City</h1>
      <p className="mt-3 max-w-2xl text-ink">
        Municipal corporation budget books, one city at a time. A city book is roads, drains,
        garbage, lights and parks. City police sits in the state book, not here.
      </p>

      <ul className="mt-8 divide-y divide-ink/15 border-y border-ink/20">
        {municipalBodies.map((m) => (
          <li key={m.slug} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <Link to={`/municipal/${m.slug}`} className="font-medium text-ink no-underline hover:text-rust">
                {m.name}
              </Link>
              <p className="text-sm text-ink/60">
                {m.body}, {m.state}.
                {m.missingYears.length ? " The newest year is not in a book yet." : ""}
              </p>
            </div>
            <div className="sm:text-right">
              {m.tier === "gold" ? (
                <>
                  <p className="text-sm text-ink/50">{seriesYearLabel(municipalHero(m))}</p>
                  <Money money={municipalHero(m)} size="row" />
                </>
              ) : (
                <p className="text-sm text-ink/45">Not read yet</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">
          {read.length === 1 ? "One city book so far" : `${read.length} city books so far`}
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          We do not add city books into a state or India total, and we do not add a city book to
          the state book that pays it grants. Mumbai Police is in Maharashtra’s state book, not
          BMC’s.
        </p>
      </section>

      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          {read.map((m) => (m.citationId ? <CitationFootnote key={m.citationId} citationId={m.citationId} /> : null))}
        </ol>
      </section>

      <p className="mt-8 text-sm">
        <Link to="/">Home</Link>
        {" · "}
        <Link to="/gram">Village</Link>
        {" · "}
        <Link to="/sources">Method</Link>
      </p>
    </article>
  );
}
