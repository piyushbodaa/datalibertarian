import { Link } from "react-router-dom";

export function GramPage() {
  return (
    <article>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Village</h1>
      <p className="mt-3 max-w-2xl text-ink">No village book typed yet. Village spend is not police.</p>

      <section className="carbon-sheet mt-10 px-4 py-8 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">We have not read a village book yet</h2>
        <p className="mt-5 max-w-2xl text-sm text-ink/70">
          We do not divide a state rural grant by the number of panchayats.
        </p>
      </section>

      <p className="mt-8 text-sm">
        <Link to="/">Home</Link>
        {" · "}
        <Link to="/municipal">City</Link>
        {" · "}
        <Link to="/sources">Method</Link>
      </p>
    </article>
  );
}
