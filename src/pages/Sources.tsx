import { Link } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";
import { coverageCounts } from "../data/coverage";
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
  "tg-law-home-2026-27-hyd",
  "tg-law-home-2026-27-cyberabad",
  "tg-law-home-2026-27-hod",
  "wb-demand68-2026-27",
  "gj-home-2026-27",
  "tn-demand22-2026-27",
  "union-bag-2026-27",
];

export function SourcesPage() {
  const gold = GOLD_IDS.map((id) => citations[id]).filter(Boolean);
  const index = Object.values(citations).filter((c) => c.id.startsWith("prs-"));
  const cov = coverageCounts();

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
        <h2 className="font-display text-xl font-semibold tracking-tight">Four layers, four books</h2>
        <ul className="mt-4 list-none space-y-3 p-0">
          <li className="docket-slip text-ink/80">
            <strong>Union</strong> — Budget at a Glance total expenditure. Demand 51 is Police only,
            a smaller inner ledger.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>State</strong> — one cited state book at a time (Maharashtra Pink Book total on
            Home). Not the sum of 28 Pink Books.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>Municipal</strong> — civic PDFs. EMPTY until a corporation total is typed. City
            police sits in state books.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>Gram</strong> — village / PRI books. EMPTY until an FC RLB grant or head 2515
            line is typed. Not a station share and not a GP-count average.
          </li>
        </ul>
        <p className="mt-3 text-sm text-ink/70">
          These four are never added into one India-total on this site.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">Coverage</h2>
        <p className="mt-3 text-sm text-ink/75">
          Counted from the jurisdiction registry — not hardcoded. {cov.gold} GOLD · {cov.index}{" "}
          INDEX · {cov.blocked} BLOCKED · {cov.empty} EMPTY. Union Demand 51 is a Centre door, not
          a state rank. We never sum GOLD + INDEX + Demand 51 into All-India Police.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">Where the book stops</h2>
        <ul className="mt-4 list-none space-y-3 p-0">
          <li className="docket-slip text-ink/80">
            Public Demand volumes print major heads, minor heads, object heads, and sometimes named
            units (a commissionerate, a battalion). They almost never print “this police station
            received ₹X.”
          </li>
          <li className="docket-slip text-ink/80">
            Object 01 Salaries, when printed, is the last honest public destination for pay at that
            grain. We do not then split it across named thanas.
          </li>
          <li className="docket-slip text-ink/80">
            Named police-station rupees exist only if a government book prints that station as its
            own line. Telangana Law+Home prints commissionerate HoD totals, not Bachupally PS.
          </li>
          <li className="docket-slip text-ink/80">
            “All their bills” in public data usually means object-head and scheme lines, not vendor
            invoices. We do not scrape private payroll.
          </li>
        </ul>
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
            <strong>Telangana commissionerates</strong> — Law+Home HoD combined establishment +
            schemes (Hyderabad City, Cyberabad, Rachakonda, Malkajgiri, Future City). Not summed.
            Not INDEX 9,641. Named police stations (Bachupally PS) are EMPTY — not in Demand books.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>West Bengal Police</strong> — Demand 68 slices 2055 / 4055 only, not whole Home
            &amp; Hill Affairs. Kolkata/HQ salaries sit inside statewide object 01.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>Gujarat Police</strong> — Home Book 2026-27. Demand 043 is 2055 (₹9,055.62 cr BE
            2026-27). 4055 (₹964.73 cr) is isolated from Demand 046. Not Home Department total.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>Tamil Nadu Police</strong> — Demand 22 Interim Budget 2026-27, thousands converted
            to crore. Hero is 2055 + 4055 only. The voted Demand 22 total is mixed and quieter.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>Union total expenditure</strong> — Budget at a Glance 2026-27, item 9. ₹53,47,315
            cr BE 2026-27. Not Demand 51. Not the states.
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
            <strong>Rajasthan</strong> — INDEX only this pass. Salary desk-sums stay off GOLD until a
            clean page cite.
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
          <li className="docket-slip text-ink/80">
            Named Telangana police stations (Bachupally PS and any other named PS) — EMPTY. Law+Home
            prints commissionerate HoD totals. We do not divide an HoD by N stations.
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
