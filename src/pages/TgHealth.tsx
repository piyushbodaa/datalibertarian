import { Link } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";
import { HeadSplit } from "../components/HeadSplit";
import { LedgerTable } from "../components/LedgerTable";
import { Money } from "../components/Money";
import { PrintedColumns } from "../components/PrintedColumns";
import { TraceRail } from "../components/TraceRail";
import { pickAmount } from "../data/maharashtra-police";
import {
  TG_HEALTH_HEADLINE_SERIES,
  TG_HEALTH_HEADLINE_YEAR,
  tg2210,
  tg2211,
  tg4210,
  tg4211,
  tgHealthCap,
  tgHealthDepartment,
  tgHealthFunctional,
  tgHealthRun,
} from "../data/telangana/health";
import { formatCrore } from "../lib/money";
import { jurisdictions } from "../data/states";

export function TgHealthPage() {
  const hero = pickAmount(tgHealthFunctional, TG_HEALTH_HEADLINE_YEAR, TG_HEALTH_HEADLINE_SERIES);
  const run = pickAmount(tgHealthRun, TG_HEALTH_HEADLINE_YEAR, TG_HEALTH_HEADLINE_SERIES);
  const cap = pickAmount(tgHealthCap, TG_HEALTH_HEADLINE_YEAR, TG_HEALTH_HEADLINE_SERIES);
  const dept = pickAmount(tgHealthDepartment, TG_HEALTH_HEADLINE_YEAR, TG_HEALTH_HEADLINE_SERIES);
  if (!hero || !run || !cap || !dept) throw new Error("Missing Telangana health figures");
  const citeIds = [...new Set([hero.citationId, dept.citationId])];

  return (
    <article>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Telangana Health</h1>
      <p className="mt-4 max-w-2xl text-ink">
        What the state budget set aside to run hospitals and public health, family welfare, and to
        build or equip them. Not water supply, not nutrition, not medical colleges booked under
        education.
      </p>

      <div className="mt-8 border-y border-ink/20 py-8">
        <p className="text-sm text-ink/55">2026-27 plan</p>
        <div className="mt-3">
          <Money money={hero} size="hero" />
        </div>
        <p className="mt-4 max-w-xl text-sm text-ink/70">
          Running hospitals ₹{formatCrore(run.crore)} crore · Hospital buildings and gear ₹
          {formatCrore(cap.crore)} crore.
        </p>
      </div>

      <PrintedColumns
        run={tgHealthRun}
        cap={tgHealthCap}
        caption="Spent, plan, updated plan, and next plan. Printed in lakhs; shown in crore."
      />
      <HeadSplit
        run={run}
        cap={cap}
        runLabel="Running hospitals"
        capLabel="Buildings and gear"
        title="Running hospitals vs buildings and gear"
        note="Same year’s plan. Buildings and gear are the thin slice — that is the book."
      />

      <LedgerTable
        items={[tg2210, tg2211, tg4210, tg4211]}
        caption="The four account heads behind the total, as printed in the Annual Financial Statement. A dash means the book printed '..' — not zero."
      />

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">The department total is bigger</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          The Budget in Brief lists the Health, Medical &amp; Family Welfare Department at ₹
          {formatCrore(dept.crore)} crore for 2026-27. A department mixes many account heads. The
          number above is only the four health heads, so it is smaller and is the one we compare.
        </p>
      </section>

      <TraceRail
        stops={[
          { id: "book", label: "Book", detail: "Telangana Annual Financial Statement 2026-27" },
          { id: "major", label: "Health", money: hero, detail: "Running plus buildings and gear." },
          { id: "run", label: "Running hospitals", money: run },
          { id: "cap", label: "Buildings and gear", money: cap },
          {
            id: "hospital",
            label: "Named hospital",
            empty: "The statement stops at the account head. We do not divide that total by the number of hospitals.",
          },
        ]}
      />

      <h2 className="mt-12 font-display text-xl font-semibold tracking-tight">Health in other states</h2>
      <p className="mt-2 max-w-2xl text-sm text-ink/70">Not read yet. Each door says so; none shows a guessed rupee.</p>
      <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 md:grid-cols-3" aria-label="Health in other states">
        {jurisdictions
          .filter((j) => j.kind === "state" && j.slug !== "telangana")
          .map(({ slug, name }) => (
            <li key={slug}>
              <Link to={`/${slug}/health`} className="inline-flex min-h-11 items-center text-ink/70 no-underline hover:text-rust">
                {name}
              </Link>
            </li>
          ))}
      </ul>

      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          {citeIds.map((id) => (
            <CitationFootnote key={id} citationId={id} />
          ))}
        </ol>
        <p className="mt-6">
          Account codes in the book: 2210, 2211 (running), 4210, 4211 (buildings).{" "}
          <Link to="/telangana/police">Telangana Police</Link>
          {" · "}
          <Link to="/compare?left=telangana&right=maharashtra">Compare with Maharashtra</Link>
          {" · "}
          <Link to="/sources">Method</Link>
        </p>
      </section>
    </article>
  );
}
