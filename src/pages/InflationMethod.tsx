import { Link } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";

export function InflationMethodPage() {
  return (
    <article className="max-w-2xl">
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        How this bulletin is built
      </h1>
      <p className="mt-4 text-ink/80">
        The layout follows a statistics-office bulletin: headline, basket, division rooms, then
        average prices with from and to. India’s extra column is the observed rupee beside the
        printed index.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">The pie</h2>
        <p className="mt-3 text-ink/80">
          Slices are Combined CPI 2024 weights from MoSPI’s Annex V (Household Consumption
          Expenditure Survey 2023-24). Food is 36.75% of that basket, down from 42.62% in the 2012
          series. The pie is the basket they use. It is not a mix of PMD items.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">From → to</h2>
        <p className="mt-3 text-ink/80">
          A twelve-month change always names both printed rupees and both dates. Example: ₹43.03/kg
          on 10 Sep 2025 → ₹46.34/kg on 10 Sep 2026. A bare “+7%” is not shown. A printed 0 is not a
          price.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">What they printed</h2>
        <p className="mt-3 text-ink/80">
          MoSPI CPI is a weighted index (2024=100). Where they printed an item inflation rate
          (onion, potato, tomato in July 2026), it sits in the government column. We do not back out
          a fake government rupee for rice from an index. Health, housing and education rooms show
          the official division rate and leave observed rupees empty.
        </p>
      </section>

      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 list-decimal space-y-4 pl-5">
          <CitationFootnote citationId="pmd-retail-2026-09-10" />
          <CitationFootnote citationId="ppac-fuel-2026-09-10" />
          <CitationFootnote citationId="mospi-cpi-2026-07" />
          <CitationFootnote citationId="mospi-cpi-2024-weights" />
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
