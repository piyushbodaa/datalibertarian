import { Link } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";
import { citations, EXTRACT_DATE } from "../data/sources";

const GOLD_IDS = [
  "mh-home-whitebook-2026-27",
  "mh-pink-book-2026-27",
  "mh-appropriation-2025-26",
  "union-sbe51-2026-27",
  "union-sbe51-2025-26",
  "union-sumsbe-2026-27",
  "up-grant26-2026-27",
  "tg-law-home-2026-27",
  "wb-demand68-2026-27",
];

export function SourcesPage() {
  const gold = GOLD_IDS.map((id) => citations[id]).filter(Boolean);
  const index = Object.values(citations).filter((c) => c.id.startsWith("prs-"));

  return (
    <article className="max-w-2xl">
      <p className="kicker">Method</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Sources</h1>
      <p className="mt-4 text-ink/80">
        If a number cannot be tied to a document, it is not shown. GOLD figures are typed from
        official PDFs. INDEX figures are copied from PRS AFS Police functional envelopes and
        labelled as INDEX. We do not scrape, invent rupees, or convert percent of spend into
        crore.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">Two tiers — never mixed</h2>
        <ol className="mt-4 list-none space-y-3 p-0">
          <li className="docket-slip text-ink/80">
            <strong>GOLD LIVE</strong> — official Demand / White Book / budget volume with a clear
            Police head (2055 + 4055, or the equivalent slice). Citation chip to the government
            PDF. Rust file-tag.
          </li>
          <li className="index-slip text-ink/80">
            <strong>INDEX</strong> — PRS AFS Police functional. Discovery aid, not gold citation.
            Zinc slip. Must never look like a White Book ledger.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>EMPTY / BLOCKED</strong> — honesty slips. Empty has no rupee. Blocked names
            the last found figure and refuses percent-to-rupee conversion.
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">How a GOLD figure gets onto the page</h2>
        <ol className="mt-4 list-none space-y-3 p-0">
          <li className="docket-slip text-ink/80">Open the official PDF (White Book, Notes on Demands, or Demand for Grants).</li>
          <li className="docket-slip text-ink/80">Read the printed amount and its unit (thousands, lakhs, or crore).</li>
          <li className="docket-slip text-ink/80">Convert to crore if needed. Store the series (Actuals / Budget / Revised), the year, and the page.</li>
          <li className="docket-slip text-ink/80">If the page cannot be tied, the number is omitted. Desk-sums are labelled desk-sum.</li>
        </ol>
        <p className="mt-4 text-sm text-ink/65">Extracted {EXTRACT_DATE}.</p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">How an INDEX figure gets onto the page</h2>
        <ol className="mt-4 list-none space-y-3 p-0">
          <li className="index-slip text-ink/80">
            Copy the Police functional envelope from the PRS state budget analysis. Do not treat
            PRS as a White Book.
          </li>
          <li className="index-slip text-ink/80">
            This hatch ships the FY 2025-26 Budget rank only. Other series years were not typed
            from the staff pack on this machine — we do not invent them.
          </li>
          <li className="index-slip text-ink/80">
            Maharashtra INDEX ₹33,743 crore (2025-26 BE) is not the Home White Book hero ₹33,116.49
            crore (2026-27 BE). Telangana INDEX is Police functional ₹9,641 crore, never Home
            ₹10,188 / ₹11,907.
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">GOLD LIVE</h2>
        <ul className="mt-4 list-none space-y-3 p-0">
          <li className="docket-slip text-ink/80">
            <strong>Maharashtra Police</strong> — Home Department White Book 2026-27. Headline is
            heads 2055 + 4055 (₹33,116.49 cr BE 2026-27). Grant B-1 is quieter and not police-only.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>Uttar Pradesh Police</strong> — Grant 26 Home (Police). 2055 voted printed +
            4055 printed योग. Object 01 salaries is a desk-sum. Object 22 is hospitality, not arms.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>Telangana Police</strong> — Law+Home Police object 010 desk-sum. Not Demand X
            Home. Hyderabad city police is not added in. City 4055 is labelled city.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>West Bengal Police</strong> — Demand 68 slices 2055 / 4055 only, not whole Home
            &amp; Hill Affairs. Kolkata/HQ salaries sit inside statewide object 01.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>Union Demand 51 Police</strong> — Notes on Demands. Headline is the demand net
            total (₹1,73,802.53 cr BE 2026-27). Not all Indian police. Not summed into states.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>Delhi Police</strong> — Union sub-door: Demand 51 item 5 establishment + Police
            Infrastructure (Delhi Police). Not GNCTD AFS. Not a state INDEX row.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">EMPTY / BLOCKED</h2>
        <ul className="mt-4 list-none space-y-3 p-0">
          <li className="docket-slip text-ink/80">
            <strong>Andhra Pradesh</strong> — BLOCKED for 2025-26 / 2026-27. Only 2024-25 BE and
            Actuals found; later years are percent of spend.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>Rajasthan / Tamil Nadu</strong> — INDEX only this pass. Unsafe desk-sums and
            missing later-year Demand PDFs stay off the GOLD ledger.
          </li>
          <li className="docket-slip text-ink/80">
            Karnataka and Gujarat object-head depth — GAP on disk. INDEX headline only.
          </li>
          <li className="docket-slip text-ink/80">
            J&amp;K, Ladakh, Puducherry, and other UTs — EMPTY (not in the 27). Delhi Police is the
            Union door.
          </li>
          <li className="docket-slip text-ink/80">
            Municipal corporations — civic books later. Mumbai Police is state police, not BMC.
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
            Desk-sum means we added printed object lines. It is labelled desk-sum, not a printed
            योग.
          </li>
          <li className="docket-slip text-ink/80">Numbers freeze at extract date.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">GOLD documents</h2>
        <ol className="mt-4 list-decimal space-y-5 pl-5 text-sm">
          {gold.map((c) => (
            <CitationFootnote key={c.id} citationId={c.id} />
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">INDEX documents (PRS)</h2>
        <ol className="mt-4 list-decimal space-y-5 pl-5 text-sm">
          {index.map((c) => (
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
