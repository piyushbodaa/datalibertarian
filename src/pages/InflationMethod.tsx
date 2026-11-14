import { Link } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";

export function InflationMethodPage() {
  return (
    <article className="max-w-2xl">
      <p className="kicker">Methodology · Prices &amp; CPI</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        How price &amp; inflation data is compiled
      </h1>
      <p className="mt-3 text-ink/80">
        This section pairs two independent official sources side by side: MoSPI’s published CPI index rates alongside national retail price averages released by the Price Monitoring Division (food &amp; essentials) and PPAC (motor fuels).
      </p>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">2024 CPI basket weights</h2>
        <p className="mt-2.5 text-ink/80">
          Category shares reflect Combined CPI 2024 weights from MoSPI Annex V (Household Consumption Expenditure Survey 2023–24). Food accounts for 36.75% of the updated basket, compared with 42.62% in the 2012 base series.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">Twelve-month retail change</h2>
        <p className="mt-2.5 text-ink/80">
          Every year-on-year comparison states both observed retail averages and exact publication dates (e.g., ₹43.03/kg on 10 Sep 2025 → ₹46.34/kg on 10 Sep 2026). Unreported prices stay empty rather than imputed or shown as ₹0.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">Official item vs division rates</h2>
        <p className="mt-2.5 text-ink/80">
          MoSPI CPI uses base 2024=100. Where item-level CPI rates are released (such as onion, potato, and tomato), they appear directly; for items without item-level disclosures, the parent CPI division rate is cited and clearly labelled as a division index.
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
