import { Link } from "react-router-dom";

export function MunicipalPage() {
  return (
    <article>
      <p className="kicker">Civic books</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Municipal Corporations
      </h1>
      <p className="mt-4 max-w-2xl text-ink">
        Municipal corporations spend taxpayer money on civic work: water, roads, schools, health.
        That is not the same as police.
      </p>
      <p className="mt-4 max-w-2xl text-ink">
        In India, city police is usually <strong>state police</strong>. Mumbai Police is in the
        Maharashtra state books, not the Brihanmumbai Municipal Corporation budget.
      </p>

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <p className="kicker text-ochre">Not extracted yet</p>
        <h2 className="mt-2 font-display text-xl font-semibold">No municipal totals on this page</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/70">
          We will not guess a corporation’s spend. Next, when we pick a city: Brihanmumbai civic
          books (OpenCity / BMC PDFs) — labelled civic, never as Police.
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
