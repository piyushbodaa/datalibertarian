import { Link } from "react-router-dom";
import { NotFoundPage } from "./NotFound";
import { CitationFootnote } from "../components/CitationChip";
import { PoliceOverview } from "../components/PoliceOverview";
import { TraceRail } from "../components/TraceRail";
import { pickAmount } from "../data/maharashtra-police";
import { getJurisdiction } from "../data/states";
import { getUtPoliceBook, UT_HEADLINE_SERIES, UT_HEADLINE_YEAR } from "../data/union/ut-police";

/** Union Territory police from the MHA Detailed Demands for Grants — the UT's own demand, not Demand 51. */
export function UtPolicePage({ slug }: { slug: string }) {
  const j = getJurisdiction(slug);
  const book = getUtPoliceBook(slug);
  if (!j || !book) return <NotFoundPage />;
  const hero = pickAmount(book.functional, UT_HEADLINE_YEAR, UT_HEADLINE_SERIES);
  const run = pickAmount(book.run2055, UT_HEADLINE_YEAR, UT_HEADLINE_SERIES);
  const cap = pickAmount(book.cap4055, UT_HEADLINE_YEAR, UT_HEADLINE_SERIES);
  if (!hero || !run || !cap) throw new Error(`Missing ${j.slug} gold figures`);

  return (
    <article>
      <PoliceOverview
        name={j.name}
        description={
          <>
            What the Centre’s books set aside to run this Union Territory’s police and to build or
            buy for them, from the Territory’s own demand (Demand {book.demand}) in the Home
            Ministry’s detailed grants. Not the CAPF demand, not jails.
          </>
        }
        hero={hero}
        run={run}
        cap={cap}
        runningLine={book.run2055}
        capitalLine={book.cap4055}
        caption="Spent, plan, updated plan, and next plan. Printed in thousands; shown in crore."
      />

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">A Union book, not a state book</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          {j.name} has no legislature budget of its own for police; Parliament votes Demand{" "}
          {book.demand}. {book.note} The Centre’s own police (CAPF) sit on{" "}
          <Link to="/union/police">Demand 51</Link> and are not added here.
        </p>
      </section>

      <TraceRail
        stops={[
          { id: "book", label: "Book", detail: `MHA Detailed Demands for Grants 2026-27, ${book.volume}, Demand ${book.demand}` },
          { id: "major", label: "Police", money: hero, detail: "Running the force plus buildings and gear." },
          { id: "run", label: "Running costs", money: run },
          { id: "cap", label: "Buildings and gear", money: cap },
          {
            id: "station",
            label: "Named police station",
            empty: "The demand stops at the major head. We do not divide that total by the number of stations.",
          },
        ]}
      />

      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          <CitationFootnote citationId={book.citationId} />
        </ol>
        <p className="mt-6">
          Account codes in the book: 2055 (running), 4055 (buildings). Pages: {book.pages}.{" "}
          <Link to="/states">All states</Link>
          {" · "}
          <Link to={`/compare?left=${j.slug}&right=sikkim`}>Compare with Sikkim</Link>
          {" · "}
          <Link to="/sources">Method</Link>
        </p>
      </section>
    </article>
  );
}
