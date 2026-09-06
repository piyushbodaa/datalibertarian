import { Link } from "react-router-dom";
import { HeadSplit } from "../components/HeadSplit";
import { Money } from "../components/Money";
import { PrintedColumns } from "../components/PrintedColumns";
import { pickAmount } from "../data/maharashtra-police";
import {
  demand51Capital,
  demand51Net,
  demand51Revenue,
  UNION_HEADLINE_SERIES,
  UNION_HEADLINE_YEAR,
} from "../data/union/demand-51";

export function UnionPage() {
  const hero = pickAmount(demand51Net, UNION_HEADLINE_YEAR, UNION_HEADLINE_SERIES);
  const rev = pickAmount(demand51Revenue, UNION_HEADLINE_YEAR, UNION_HEADLINE_SERIES);
  const cap = pickAmount(demand51Capital, UNION_HEADLINE_YEAR, UNION_HEADLINE_SERIES);
  if (!hero || !rev || !cap) throw new Error("Missing Union Demand 51 headline");

  return (
    <article>
      <p className="kicker">Union books</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Union Government</h1>
      <p className="mt-3 max-w-2xl text-ink">
        The Centre’s books — not the sum of the states. First ledger: Demand 51 Police.
      </p>

      <section className="mt-8 border-y border-ink/20 py-8">
        <p className="kicker">Demand 51 Police · net</p>
        <div className="mt-4">
          <Money money={hero} size="hero" showSeries />
        </div>
        <HeadSplit
          run={rev}
          cap={cap}
          title="Revenue and capital"
          note="Same Budget column. Not all Indian police."
          runLabel="Revenue"
          capLabel="Capital"
        />
        <PrintedColumns
          compact
          run={demand51Revenue}
          cap={demand51Capital}
          title="Four printed columns"
          caption="Demand 51 net. Actuals, Budget, and Revised — not one trend."
        />
        <p className="mt-8">
          <Link to="/union/police" className="file-cta">
            <span className="file-cta-notch" aria-hidden="true" />
            Open the Union police ledger
          </Link>
        </p>
      </section>

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <p className="kicker">Union sub-door</p>
        <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">
          Delhi Police (establishment + infrastructure)
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          Demand 51 item 5 plus Police Infrastructure earmarked Delhi Police. Not GNCTD AFS. Not
          the Demand 51 net total. Not a state INDEX row.
        </p>
        <p className="mt-4">
          <Link to="/union/delhi-police" className="file-cta">
            <span className="file-cta-notch" aria-hidden="true" />
            Open the Delhi Police ledger
          </Link>
        </p>
      </section>

      <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
        <p className="kicker text-ochre">Not extracted</p>
        <h2 className="mt-2 font-display text-xl font-semibold">Other Union demands</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          Notes on Demands SBE 52–56 (Union Territory and Home-adjacent demands) are not typed.
          Isolate 2055 + 4055 when those PDFs are read. They are not Demand 51 net, and they are
          not zeros.
        </p>
        <ul className="mt-4 list-none space-y-2 p-0 text-sm text-ink/70">
          <li>
            <a href="https://www.indiabudget.gov.in/doc/eb/sbe52.pdf" rel="noreferrer" target="_blank">
              sbe52.pdf
            </a>
            {" — EMPTY until 2055+4055 is isolated"}
          </li>
          <li>
            <a href="https://www.indiabudget.gov.in/doc/eb/sbe53.pdf" rel="noreferrer" target="_blank">
              sbe53.pdf
            </a>
          </li>
          <li>
            <a href="https://www.indiabudget.gov.in/doc/eb/sbe54.pdf" rel="noreferrer" target="_blank">
              sbe54.pdf
            </a>
          </li>
          <li>
            <a href="https://www.indiabudget.gov.in/doc/eb/sbe55.pdf" rel="noreferrer" target="_blank">
              sbe55.pdf
            </a>
          </li>
          <li>
            <a href="https://www.indiabudget.gov.in/doc/eb/sbe56.pdf" rel="noreferrer" target="_blank">
              sbe56.pdf
            </a>
          </li>
        </ul>
        <div className="mt-6 border border-dashed border-ink/25 px-3 py-6 text-center text-[0.7rem] uppercase tracking-[0.16em] text-ink/40">
          No hatch · no guessed rupee
        </div>
      </section>

      <p className="mt-8 max-w-2xl text-sm text-ink/65">
        <Link to="/sources">Method</Link>.
      </p>
    </article>
  );
}
