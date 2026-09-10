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
  "ka-expvol1-2026-27",
  "kl-afs-2026-27",
  "od-d01-2026-27",
  "ap-afs-2026-27",
  "ap-vol3-3-2026-27",
  "pb-afs-2026-27",
  "pb-capital-2026-27",
  "hr-afs-2026-27",
  "uk-afs-2026-27",
  "uk-vol5-g10-2026-27",
  "as-afs-2026-27",
  "cg-afs-2026-27",
  "cg-t02-2026-27",
  "jh-afs-2026-27",
  "ga-afs-2026-27",
  "ga-vol1-2026-27",
  "tr-afs-2026-27",
  "ml-afs-2026-27",
  "mn-afs-2026-27",
  "mn-dfg-2026-27",
  "nl-afs-2026-27",
  "mz-afs-2026-27",
  "ar-afs-2026-27",
  "union-bag-2026-27",
  "union-rec-annex9-2026-27",
];

export function SourcesPage() {
  const gold = GOLD_IDS.map((id) => citations[id]).filter(Boolean);
  const index = Object.values(citations).filter((c) => c.id.startsWith("prs-"));
  const cov = coverageCounts();

  return (
    <article className="max-w-2xl">
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Method</h1>
      <p className="mt-4 text-ink/80">
        We type numbers from government budget PDFs. If we cannot point at a page, we show nothing.
        Police here means running the force plus buildings and vehicles — not jails, not courts.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">Official book vs a summary</h2>
        <ol className="mt-4 list-none space-y-3 p-0">
          <li className="docket-slip text-ink/80">
            <strong>From the official book</strong> — a government PDF with a clear Police line
            (running costs plus buildings and gear, codes 2055 and 4055 in the book). Every figure
            has a citation.
          </li>
          <li className="index-slip text-ink/80">
            <strong>From a summary (not the book)</strong> — a research table used only as a hint.
            Never the main number on Home or Compare.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>Not read yet / can’t read a clean number</strong> — empty has no rupee. Blocked
            names the last found figure and refuses to turn a percent into crore.
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">How an official figure gets onto the page</h2>
        <ol className="mt-4 list-none space-y-3 p-0">
          <li className="docket-slip text-ink/80">Open the official PDF.</li>
          <li className="docket-slip text-ink/80">Read the printed amount and its unit (thousands, lakhs, or crore).</li>
          <li className="docket-slip text-ink/80">Convert to crore if needed. Store spent / plan / updated plan, the year, and the page.</li>
          <li className="docket-slip text-ink/80">If the page cannot be tied, the number is omitted. Added-from-printed-lines figures are labelled as such.</li>
        </ol>
        <p className="mt-4 text-sm text-ink/65">Figures from {EXTRACT_DATE}.</p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">How a summary figure gets onto the page</h2>
        <ol className="mt-4 list-none space-y-3 p-0">
          <li className="index-slip text-ink/80">
            Copy the police line from a research summary. Do not treat that summary as the official
            book.
          </li>
          <li className="index-slip text-ink/80">
            This site only typed the 2025-26 plan rank from that summary. Other years were not
            typed — we do not invent them.
          </li>
          <li className="index-slip text-ink/80">
            Maharashtra’s summary ₹33,743 crore (2025-26 plan) is not the official-book hero
            ₹33,116.49 crore (2026-27 plan). Telangana’s summary is police ₹9,641 crore, never the
            Home grant.
          </li>
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">How compare works</h2>
        <ul className="mt-4 list-none space-y-3 p-0">
          <li className="docket-slip text-ink/80">
            Two books, same kind of line, and a middle number. We print the lines the books printed.
            If one book is silent, the row stays blank — not zero.
          </li>
          <li className="docket-slip text-ink/80">
            Research summaries are not used to compare. A state book vs Centre police is not the
            same kind of book. That pair is not a ranking.
          </li>
          <li className="docket-slip text-ink/80">
            Search is a client-side index over typed LineItems. Zero hits means not in the typed
            books. Trace is a rail of printed grains; stations stay EMPTY unless a book named them.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">How the compare median is built</h2>
        <ul className="mt-4 list-none space-y-3 p-0">
          <li className="docket-slip text-ink/80">
            The middle column is the middle of every official book in the same layer that printed
            the same field, series, and year. It is not a third government’s budget.
          </li>
          <li className="docket-slip text-ink/80">
            Middle, not average, is the main number. Odd N uses the middle book’s rupees. Even N is
            the average of the two central books after sorting by rupees. The simple average may
            sit as a quieter line. Summaries and unread books never enter that set.
          </li>
          <li className="docket-slip text-ink/80">
            N can differ by row — “middle of 5 books” on running costs, “middle of 2 books” on
            salaries. Fewer than 3 books is not enough. Zero books is a dash: no official book
            printed this line. We never invent a zero middle.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">Median pane — what N is</h2>
        <ul className="mt-4 list-none space-y-3 p-0">
          <li className="docket-slip text-ink/80">
            <strong>State vs state</strong> (Maharashtra vs Telangana) — N is official state books
            that printed that line.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>City-police slices</strong> (Hyderabad vs Cyberabad) — N is official
            city-police books on disk. Maharashtra running costs are not dragged into a city
            middle. Mumbai Police is state police, not the city corporation, and is not a city
            peer.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>Named police station</strong> — no named-station rupee is typed. Official books
            stop at district force or city-police office. We do not divide those totals by the
            number of stations. This stays empty until a book prints a station.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>Municipal / Gram</strong> — civic and village books are not typed. Middle pane
            EMPTY is correct. BMC and GHMC totals are not invented.
          </li>
          <li className="docket-slip text-ink/80">
            This is the middle of N official books on this machine — not a national average
            police station, and not a typical Indian city spend.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">Four layers, four books</h2>
        <ul className="mt-4 list-none space-y-3 p-0">
          <li className="docket-slip text-ink/80">
            <strong>Union</strong> — the Union budget’s total spend. Centre police is a smaller
            inner book.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>State</strong> — one cited state book at a time (Maharashtra’s whole budget on
            Home). Not the sum of 28 state books.
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
          {cov.gold} official · {cov.index} summaries · {cov.blocked + cov.empty} not ready.
          Centre police is a Centre door, not a state rank. We never add Union + State + City +
          Village into one India total.
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
        <h2 className="font-display text-xl font-semibold tracking-tight">Official books we have read</h2>
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
            <strong>Karnataka Police</strong> — Expenditure Volume-1 2026-27, Demand 05 Home. Figures
            printed in lakhs (crore = lakhs ÷ 100). Hero is 2055 + 4055. Demand 05 Home total is
            mixed and quieter. PRS Police is INDEX, not this hero.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>Kerala Police</strong> — Annual Financial Statement 2026-27, Statements B and C.
            Accounts in rupees; estimates in thousands. Hero is 2055 + 4055 (Demand XII slices).
            Jails and vigilance are not Police.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>Odisha Police</strong> — Demand 01 Home 2026-27, thousands converted to crore.
            Hero is 2055 only. 4055 is not a major head in this Demand (capital is mixed 4059/4216).
          </li>
          <li className="docket-slip text-ink/80">
            <strong>Uttarakhand Police</strong> — Annual Financial Statement 2026-27 Volume 2 Part 1,
            thousands converted to crore. Hero is 2055 + 4055. Grant 10 Police and Jail is mixed
            (jails, public works) and quieter.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>Union total expenditure</strong> — Budget at a Glance 2026-27, item 9. ₹53,47,315
            cr BE 2026-27. Not Demand 51. Not the states.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>Union outstanding liabilities</strong> — Receipt Budget Annex 9. ₹2,14,82,050
            crore at end of 2026-27 (BE). Centre stock only. Not state debt. Not a live ticker.
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
        <h2 className="font-display text-xl font-semibold tracking-tight">Not ready yet</h2>
        <ul className="mt-4 list-none space-y-3 p-0">
          <li className="docket-slip text-ink/80">
            <strong>Andhra Pradesh</strong> — can’t read a clean number for 2025-26 / 2026-27. Only
            2024-25 plan and spent found; later years are percent of spend.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>Rajasthan</strong> — Volume 2b 2055 Police summary was opened; Hindi OCR still
            mixes the columns, so no official figure is typed. Budget at a Glance ₹556.16 cr is a
            speech slice, not 2055.
          </li>
          <li className="docket-slip text-ink/80">
            <strong>Himachal Pradesh</strong> — Demand 07 is mixed Police and Allied. The detailed
            2026-27 demand did not open, so 2055 is not isolated yet.
          </li>
          <li className="docket-slip text-ink/80">
            Karnataka and Gujarat pay-line depth — not typed. Summary only.
          </li>
          <li className="docket-slip text-ink/80">
            J&amp;K, Ladakh, Puducherry, and other UTs — not read yet. Delhi Police is the Centre
            door.
          </li>
          <li className="docket-slip text-ink/80">
            Municipal corporations — civic books later. Mumbai Police is state police, not BMC.
          </li>
          <li className="docket-slip text-ink/80">
            Named Telangana police stations (Bachupally and any other named station) — not in the
            book. The state book prints city-police office totals. We do not divide an office
            total by the number of stations.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">Limitations</h2>
        <ul className="mt-4 list-none space-y-3 p-0">
          <li className="docket-slip text-ink/80">
            <strong>Plan</strong> is what was voted. <strong>Updated plan</strong> is the mid-year
            figure. <strong>Spent</strong> is what was booked.
          </li>
          <li className="docket-slip text-ink/80">
            “Added from printed lines” means we added object lines ourselves. It is not a printed
            total.
          </li>
          <li className="docket-slip text-ink/80">Numbers freeze at extract date.</li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">Official documents</h2>
        <ol className="mt-4 list-decimal space-y-5 pl-5 text-sm">
          {gold.map((c) => (
            <CitationFootnote key={c.id} citationId={c.id} />
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">Research summaries</h2>
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
