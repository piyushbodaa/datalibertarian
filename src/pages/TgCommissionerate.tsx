import { Link, Navigate, useParams } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";
import { Money } from "../components/Money";
import { SERIES_LABEL } from "../lib/money";
import { cpHero, getCommissionerate } from "../data/telangana/commissionerates";

export function TgCommissioneratePage() {
  const { cp } = useParams();
  const unit = cp ? getCommissionerate(cp) : undefined;
  if (!unit) return <Navigate to="/telangana/commissionerates" replace />;

  const hero = cpHero(unit);

  return (
    <article>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">{unit.name}</h1>
      <p className="mt-3 max-w-2xl text-ink">
        {unit.hod}. Pay and schemes as printed for this city-police office. Not the statewide
        police number, not the whole Home grant, and not a named police station.
      </p>

      <div className="mt-8 border-y border-ink/20 py-8">
        <p className="text-sm text-ink/55">
          {SERIES_LABEL[hero.series]} {hero.fiscalYear}
        </p>
        <div className="mt-3">
          <Money money={hero} size="hero" showSeries />
        </div>
      </div>

      <ol className="mt-8 max-w-xl space-y-3">
        {unit.combined.amounts.map((m) => (
          <li key={`${m.fiscalYear}-${m.series}`} className="flex justify-between gap-4 text-sm">
            <span>
              {SERIES_LABEL[m.series]} {m.fiscalYear}
            </span>
            <Money money={m} size="row" />
          </li>
        ))}
      </ol>

      {unit.missingYears.map((gap) => (
        <section key={gap.fiscalYear} className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
          <h2 className="mt-2 font-display text-xl font-semibold">{gap.fiscalYear} is not in the book</h2>
          <p className="mt-3 max-w-2xl text-sm text-ink/75">{gap.reason}</p>
          <p className="mt-4 text-sm text-ink/60">No figure yet.</p>
        </section>
      ))}

      <p className="mt-8">
        <Link to={`/telangana/${unit.slug}/stations`} className="file-cta">
          <span className="file-cta-notch" aria-hidden="true" />
          Named stations — not in the book
        </Link>
      </p>

      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          <CitationFootnote citationId={unit.citationId} />
        </ol>
        <p className="mt-6">
          <Link to="/telangana/commissionerates">City police books</Link>
          {" · "}
          <Link to="/telangana/police">Telangana Police</Link>
          {" · "}
          <Link to="/sources">Method</Link>
        </p>
      </section>
    </article>
  );
}
