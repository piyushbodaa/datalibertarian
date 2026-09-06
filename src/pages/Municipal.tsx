import { Link } from "react-router-dom";

export function MunicipalPage() {
  return (
    <article>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">City</h1>
      <p className="mt-3 max-w-2xl text-ink">No city book typed yet. City police sits in state books.</p>

      <section className="carbon-sheet mt-10 px-4 py-8 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">We have not read a city book yet</h2>
        <p className="mt-5 max-w-2xl text-sm text-ink/70">
          Mumbai Police sits in Maharashtra’s state book, not the city corporation. Civic spend —
          water, roads, schools — is not Police.
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
