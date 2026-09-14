import { Link } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";
import { HeadSplit } from "../components/HeadSplit";
import { LedgerTable } from "../components/LedgerTable";
import { Money } from "../components/Money";
import { PrintedColumns } from "../components/PrintedColumns";
import { TraceRail } from "../components/TraceRail";
import { pickAmount } from "../data/maharashtra-police";
import {
  TG_GRAM_HEADLINE_SERIES,
  TG_GRAM_HEADLINE_YEAR,
  tg2501,
  tg2506,
  tg2515,
  tg4515,
  tgGramFunctional,
  tgPrrdDepartment,
} from "../data/telangana/gram";
import { formatCrore } from "../lib/money";

export function GramPage() {
  const hero = pickAmount(tgGramFunctional, TG_GRAM_HEADLINE_YEAR, TG_GRAM_HEADLINE_SERIES);
  const run = pickAmount(tg2515, TG_GRAM_HEADLINE_YEAR, TG_GRAM_HEADLINE_SERIES);
  const cap = pickAmount(tg4515, TG_GRAM_HEADLINE_YEAR, TG_GRAM_HEADLINE_SERIES);
  const dept = pickAmount(tgPrrdDepartment, TG_GRAM_HEADLINE_YEAR, TG_GRAM_HEADLINE_SERIES);
  if (!hero || !run || !cap || !dept) throw new Error("Missing Telangana rural figures");
  const citeIds = [...new Set([hero.citationId, dept.citationId])];

  return (
    <article>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Village</h1>
      <p className="mt-3 max-w-2xl text-ink">
        What a state book sets aside for rural development — the money that reaches villages
        through programmes and works. One state so far: Telangana. Village spend is not police.
      </p>

      <div className="mt-8 border-y border-ink/20 py-8">
        <p className="text-sm text-ink/55">Telangana · 2026-27 plan</p>
        <div className="mt-3">
          <Money money={hero} size="hero" />
        </div>
        <p className="mt-4 max-w-xl text-sm text-ink/70">
          Village programmes ₹{formatCrore(run.crore)} crore · Village works ₹{formatCrore(cap.crore)} crore.
        </p>
      </div>

      <PrintedColumns
        run={tg2515}
        cap={tg4515}
        caption="Spent, plan, updated plan, and next plan. Printed in lakhs; shown in crore."
      />
      <HeadSplit
        run={run}
        cap={cap}
        runLabel="Village programmes"
        capLabel="Village works"
        title="Programmes vs works"
        note="Same year’s plan. Works are roads and buildings under the rural development head."
      />

      <LedgerTable
        items={[tg2515, tg2501, tg2506, tg4515]}
        caption="Rural development heads as printed in the Annual Financial Statement. Only 2515 and 4515 make the total above; 2501 and 2506 are shown for the record."
      />

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">Not a panchayat’s money</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          The Budget in Brief lists the Panchayat Raj and Rural Development Department at ₹
          {formatCrore(dept.crore)} crore for 2026-27; that mixes many heads and is not the number
          above. No gram panchayat book is typed. We do not divide a state rural grant by the
          number of panchayats.
        </p>
      </section>

      <TraceRail
        title="Where this book stops"
        stops={[
          { id: "book", label: "Book", detail: "Telangana Annual Financial Statement 2026-27" },
          { id: "major", label: "Rural development", money: hero },
          { id: "run", label: "Village programmes", money: run },
          { id: "cap", label: "Village works", money: cap },
          {
            id: "fc",
            label: "Finance Commission grant to villages",
            empty: "The Union transfer to rural local bodies is not typed here.",
          },
          {
            id: "gp",
            label: "Named gram panchayat",
            empty: "The statement stops at the state head. We do not divide it by the number of panchayats.",
          },
        ]}
      />

      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          {citeIds.map((id) => (
            <CitationFootnote key={id} citationId={id} />
          ))}
        </ol>
        <p className="mt-6">
          Account codes in the book: 2515 (programmes), 4515 (works).{" "}
          <Link to="/telangana/police">Telangana Police</Link>
          {" · "}
          <Link to="/telangana/health">Telangana Health</Link>
          {" · "}
          <Link to="/municipal">City</Link>
          {" · "}
          <Link to="/sources">Method</Link>
        </p>
      </section>
    </article>
  );
}
