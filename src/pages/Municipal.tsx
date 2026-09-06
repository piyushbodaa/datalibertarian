import { Link } from "react-router-dom";

export function MunicipalPage() {
  return (
    <article>
      <p className="kicker">Civic books</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Municipal Corporations
      </h1>
      <p className="mt-3 max-w-2xl text-ink">
        Civic spend — water, roads, schools — is not police. Mumbai Police is in the Maharashtra
        state books, not the corporation.
      </p>

      <section className="carbon-sheet mt-10 px-4 py-8 sm:px-6">
        <p className="kicker text-ochre">Not extracted yet</p>
        <h2 className="mt-2 font-display text-xl font-semibold">No municipal totals</h2>
        <div className="mt-6 border border-dashed border-ink/25 px-3 py-10 text-center text-[0.7rem] uppercase tracking-[0.16em] text-ink/40">
          No hatch · no guessed rupee
        </div>
        <p className="mt-5 max-w-2xl text-sm text-ink/70">
          City police is usually <strong>state</strong> police. Mumbai Police sits in the Maharashtra
          White Book (2055 + 4055), not the BMC. Civic books — water, roads, schools, and any
          municipal chowkidar line — are civic, never Police. Next city, later: Brihanmumbai civic
          PDFs, labelled civic.
        </p>
      </section>

      <p className="mt-8">
        <Link to="/maharashtra/police" className="file-cta">
          <span className="file-cta-notch" aria-hidden="true" />
          Maharashtra Police (state books)
        </Link>
      </p>
      <p className="mt-6 text-sm">
        <Link to="/sources">Method</Link>
      </p>
    </article>
  );
}
