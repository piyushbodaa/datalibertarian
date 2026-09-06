import { Link } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";
import { citations, EXTRACT_DATE } from "../data/sources";

export function SourcesPage() {
  return (
    <article className="max-w-2xl">
      <p className="kicker">Method</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Sources</h1>
      <p className="mt-4 text-ink/80">
        If a number cannot be tied to a document, it is not shown. We type tables from official
        PDFs. We do not scrape, and we do not fill gaps from news sites. Empty doors have no
        rupee.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">How a figure gets onto the page</h2>
        <ol className="mt-4 list-none space-y-3 p-0">
          <li className="docket-slip text-ink/80">Open the official PDF (White Book, Notes on Demands, or Demand for Grants).</li>
          <li className="docket-slip text-ink/80">Read the printed amount and its unit (thousands, lakhs, or crore).</li>
          <li className="docket-slip text-ink/80">Convert to crore if needed. Store the series (Actuals / Budget / Revised), the year, and the page.</li>
          <li className="docket-slip text-ink/80">If the page cannot be tied, the number is omitted.</li>
        </ol>
        <p className="mt-4 text-sm text-ink/65">Extracted {EXTRACT_DATE}.</p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">What is live</h2>
        <ul className="mt-4 list-none space-y-3 p-0">
          <li className="docket-slip text-ink/80">
            <strong>Maharashtra Police</strong> — Home Department White Book 2026-27. Headline is
            heads 2055 + 4055. Grant B-1 is quieter and not police-only.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>Union Demand 51 Police</strong> — Notes on Demands, Union Budget 2026-27.
            Headline is the demand net total. It is not all Indian police.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">What is not live</h2>
        <ul className="mt-4 list-none space-y-3 p-0">
          <li className="docket-slip text-ink/80">
            Other states and Union Territories — listed as doors. Telangana Home Department books
            exist; 2055 + 4055 are not typed in this pass. The Home Department total is not Police.
          </li>
          <li className="docket-slip text-ink/80">
            Municipal corporations — civic books later. Mumbai Police is state police, not BMC.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">Two layers, never mixed</h2>
        <ul className="mt-4 list-none space-y-3 p-0">
          <li className="docket-slip text-ink/80">
            State <strong>Police spending</strong> = 2055 + 4055 (or that state’s equivalent). Not
            the whole Home Department.
          </li>
          <li className="docket-slip text-ink/80">
            Union <strong>Demand 51</strong> is the Centre’s Police demand. The Ministry of Home
            Affairs as a whole is larger (Cabinet, UT demands, transfers).
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">Limitations</h2>
        <ul className="mt-4 list-none space-y-3 p-0">
          <li className="docket-slip text-ink/80">
            <strong>Budget</strong> is a plan. <strong>Revised</strong> is a mid-year plan.{" "}
            <strong>Actuals</strong> is what was booked.
          </li>
          <li className="docket-slip text-ink/80">
            Delhi Police and Jammu and Kashmir Police in Demand 51 are Union books, not municipal
            or state White Books.
          </li>
          <li className="docket-slip text-ink/80">Numbers freeze at extract date.</li>
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

      <p className="mt-10 text-sm">
        <Link to="/">Home</Link>
      </p>
    </article>
  );
}
