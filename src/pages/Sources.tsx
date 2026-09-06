import { CitationFootnote } from "../components/CitationChip";
import { citations, EXTRACT_DATE } from "../data/sources";

export function SourcesPage() {
  return (
    <article className="max-w-2xl">
      <p className="kicker">Method</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Sources</h1>
      <p className="mt-4 text-ink/80">
        If a number cannot be tied to a document, it is not shown. We type tables from official
        PDFs. We do not scrape, and we do not fill gaps from news sites.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">How a figure gets onto the page</h2>
        <ol className="mt-4 list-none space-y-3 p-0">
          <li className="docket-slip text-ink/80">Open the Home Department White Book (detailed budget estimates) on BEAMS.</li>
          <li className="docket-slip text-ink/80">Read the printed amount in thousands of rupees.</li>
          <li className="docket-slip text-ink/80">
            Convert to crore by dividing by 10,000 (1 crore = 10,000 thousand rupees).
          </li>
          <li className="docket-slip text-ink/80">
            Store the rupee integer, the series (Actuals / Budget / Revised), the year, and the page.
          </li>
        </ol>
        <p className="mt-4 text-sm text-ink/65">Extracted {EXTRACT_DATE}.</p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">White Book status</h2>
        <p className="mt-3 docket-slip text-ink/80">
          <strong>Used.</strong> The Maharashtra Police ledger is taken from Civil Budget Estimates
          2026-2027, Part II, B — Home Department. The 2055 lines are the official I-Summary minor
          heads, not reconstructed from news. Capital is head 4055 from the same book&rsquo;s major-head
          summary.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">Two layers, never mixed</h2>
        <ul className="mt-4 list-none space-y-3 p-0">
          <li className="docket-slip text-ink/80">
            <strong>Police spending</strong> = head 2055 (running costs) + head 4055 (capital). This
            is the headline.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>Grant B-1</strong> is a voted grant named Police Administration. It also includes
            courts (2014) and other home services (2070). It is larger than Police. The page says so.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">Limitations</h2>
        <ul className="mt-4 list-none space-y-3 p-0">
          <li className="docket-slip text-ink/80">
            <strong>Budget</strong> is a plan. <strong>Revised</strong> is a mid-year plan.{" "}
            <strong>Actuals</strong> is what was booked. They are not interchangeable.
          </li>
          <li className="docket-slip text-ink/80">This is Maharashtra Police, not all Indian police, and not Union forces.</li>
          <li className="docket-slip text-ink/80">Mumbai Police is state police. There is no municipal corporation slice here.</li>
          <li className="docket-slip text-ink/80">
            Object-head detail such as &ldquo;salaries only&rdquo; under district police is not
            extracted in this prototype. The 109 District Police Force total is shown instead.
          </li>
          <li className="docket-slip text-ink/80">Numbers freeze at extract date. They are not a live feed from the treasury.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">Documents</h2>
        <ol className="mt-4 list-decimal space-y-5 pl-5 text-sm">
          {Object.values(citations).map((c) => (
            <CitationFootnote key={c.id} citationId={c.id} />
          ))}
        </ol>
      </section>
    </article>
  );
}
