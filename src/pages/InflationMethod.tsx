import { Link } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";

export function InflationMethodPage() {
  return (
    <article className="max-w-2xl">
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        How this bulletin is built
      </h1>
      <p className="mt-4 text-ink/80">
        Two columns. Observed rupees from the Price Monitoring Division (and PPAC for Delhi fuel).
        What they printed from MoSPI’s CPI. No third invented index.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Observed rupees</h2>
        <p className="mt-3 text-ink/80">
          The Department of Consumer Affairs prints all-India average retail prices for essential
          commodities every working day. That is a rupee, not a basket. Twelve-month change is
          this day’s printed rupee divided by the rupee printed on that report for one year back.
          Missing dates stay empty. A printed 0 is not a price.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">What they printed</h2>
        <p className="mt-3 text-ink/80">
          MoSPI’s CPI is a weighted index. The basket was rebased from 2012=100 to 2024=100 (first
          prints in 2026). Weights come from the Household Consumption Expenditure Survey. We do
          not splice the two series. We do not back out a fake egg rupee from an index.
        </p>
        <p className="mt-3 text-ink/80">
          Where MoSPI printed an item inflation rate (onion, potato, tomato in July 2026), it sits
          beside the PMD rupee. Headline CPI 4.45% is the government’s all-items number — never
          the hero of this bulletin.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">What this is not</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-ink/80">
          <li>Not a live ticker. Figures freeze at extract.</li>
          <li>Not a scrape of grocery apps.</li>
          <li>Not housing, health, or education — those rooms are empty.</li>
          <li>Not an all-India petrol average. PPAC printed Delhi IOCL outlet rates.</li>
        </ul>
      </section>

      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 list-decimal space-y-4 pl-5">
          <CitationFootnote citationId="pmd-retail-2026-09-10" />
          <CitationFootnote citationId="ppac-fuel-2026-09-10" />
          <CitationFootnote citationId="mospi-cpi-2026-07" />
        </ol>
        <p className="mt-6">
          <Link to="/inflation">Inflation</Link>
          {" · "}
          <Link to="/sources">Method (books)</Link>
        </p>
      </section>
    </article>
  );
}
