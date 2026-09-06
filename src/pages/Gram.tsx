import { Link } from "react-router-dom";

export function GramPage() {
  return (
    <article>
      <p className="kicker">Village books</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Gram Panchayats</h1>
      <p className="mt-3 max-w-2xl text-ink">
        PRI spend is not state police and not a municipal corporation. Village books are a fourth
        layer. They are not added into Union, State, or Municipal totals.
      </p>

      <section className="carbon-sheet mt-10 px-4 py-8 sm:px-6">
        <p className="kicker text-ochre">Not extracted yet</p>
        <h2 className="mt-2 font-display text-xl font-semibold">Village books not typed</h2>
        <div className="mt-6 border border-dashed border-ink/25 px-3 py-10 text-center text-[0.7rem] uppercase tracking-[0.16em] text-ink/40">
          No hatch · no guessed rupee
        </div>
        <p className="mt-5 max-w-2xl text-sm text-ink/70">
          Next search: XV / XVI Finance Commission grants to Rural Local Bodies (labelled as an FC
          grant, not all GP spend); state Panchayat Raj / RD Demand, head 2515; Ministry of
          Panchayati Raj notes if they print expenditure; CAG local-fund audit. We do not divide a
          state RD demand by the number of gram panchayats.
        </p>
      </section>

      <p className="mt-8 text-sm">
        <Link to="/">Home</Link>
        {" · "}
        <Link to="/municipal">Municipal</Link>
        {" · "}
        <Link to="/sources">Method</Link>
      </p>
    </article>
  );
}
