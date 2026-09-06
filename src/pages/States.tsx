import { Link } from "react-router-dom";
import { HeadSplit } from "../components/HeadSplit";
import { Money } from "../components/Money";
import { RankedHatch } from "../components/RankedHatch";
import {
  functionalPolice,
  HEADLINE_SERIES,
  HEADLINE_YEAR,
  pickAmount,
  police2055,
  police4055,
} from "../data/maharashtra-police";
import {
  INDEX_SERIES,
  INDEX_YEAR,
  getIndexRow,
  indexPoliceLines,
} from "../data/prs-index/afs-police";
import { type Jurisdiction, jurisdictions, tierLabel, type PoliceTier } from "../data/states";
import { tgObject010 } from "../data/telangana/police";
import { upFunctional } from "../data/uttar-pradesh/police";
import { wbFunctional } from "../data/west-bengal/police";
import { formatCrore } from "../lib/money";

const TIER_CLASS: Record<PoliceTier, string> = {
  gold: "text-rust",
  index: "text-zinc",
  blocked: "text-ochre",
  empty: "text-ink/45",
};

export function StatesPage() {
  const states = jurisdictions.filter((j) => j.kind === "state");
  const uts = jurisdictions.filter((j) => j.kind === "ut");
  const goldN = jurisdictions.filter((j) => j.tier === "gold").length;
  const indexN = indexPoliceLines.length;
  const mh = pickAmount(functionalPolice, HEADLINE_YEAR, HEADLINE_SERIES);
  const run = pickAmount(police2055, HEADLINE_YEAR, HEADLINE_SERIES);
  const cap = pickAmount(police4055, HEADLINE_YEAR, HEADLINE_SERIES);
  const up = pickAmount(upFunctional, "2026-27", "be");
  const tg = pickAmount(tgObject010, "2026-27", "be");
  const wb = pickAmount(wbFunctional, "2026-27", "be");
  const mhIndex = getIndexRow("maharashtra");
  if (!mh || !run || !cap || !up || !tg || !wb || !mhIndex) {
    throw new Error("Missing state headline figures");
  }

  return (
    <article>
      <p className="kicker">State books</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">State Governments</h1>
      <p className="mt-3 max-w-2xl text-ink">
        {goldN} GOLD White Book ledgers. {indexN} INDEX envelopes from PRS AFS Police functional.
        EMPTY and BLOCKED doors have no invented rupee.
      </p>

      <section className="mt-8 border-y border-ink/20 py-8">
        <p className="kicker">GOLD LIVE · official books</p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
          White Book / Demand ledgers
        </h2>
        <ul className="mt-5 divide-y divide-ink/15 border-y border-ink/20">
          <GoldRow
            to="/maharashtra/police"
            name="Maharashtra Police"
            note="Home White Book · 2055 + 4055"
            money={mh}
          />
          <GoldRow
            to="/uttar-pradesh/police"
            name="Uttar Pradesh Police"
            note="Grant 26 · 2055 voted printed + 4055 योग"
            money={up}
          />
          <GoldRow
            to="/west-bengal/police"
            name="West Bengal Police"
            note="Demand 68 slices · 2055 net + 4055"
            money={wb}
          />
          <GoldRow
            to="/telangana/police"
            name="Telangana Police"
            note="Law+Home object 010 desk-sum — not Demand X Home"
            money={tg}
          />
        </ul>
        <div className="mt-6">
          <HeadSplit
            run={run}
            cap={cap}
            title="Maharashtra 2055 and 4055"
            note="Same White Book Budget column. Capital is the thin slice as printed."
          />
        </div>
      </section>

      <section className="index-slip mt-10">
        <p className="kicker">INDEX · PRS AFS</p>
        <h2 className="mt-2 font-display text-xl font-semibold tracking-tight sm:text-2xl">
          Twenty-seven envelopes
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          FY 2025-26 budget, ranked from typed INDEX JSON. Each bar cites that state’s PRS analysis.
          Maharashtra’s INDEX figure is ₹{mhIndex.be2526.toLocaleString("en-IN")} crore — not the
          White Book hero ₹{formatCrore(mh.crore)} crore on the GOLD ledger.
        </p>
        <RankedHatch
          tone="index"
          showAll
          items={indexPoliceLines}
          fiscalYear={INDEX_YEAR}
          series={INDEX_SERIES}
          title="PRS AFS Police functional"
          note="INDEX, not GOLD LIVE. Share of the 27 listed envelopes, FY 2025-26 budget. Other printed series are not typed on this machine — we do not invent them."
        />
      </section>

      <Section title="States" rows={states} />
      <Section title="Union Territories" rows={uts} />

      <p className="mt-10 max-w-2xl text-sm text-ink/65">
        Union Territory police often sits in the Centre’s books. Delhi Police is a{" "}
        <Link to="/union/delhi-police">Union sub-door</Link>, not a state rank. Demand 51 net is{" "}
        <Link to="/union/police">not the sum of the states</Link>. <Link to="/sources">Method</Link>.
      </p>
    </article>
  );
}

function GoldRow({
  to,
  name,
  note,
  money,
}: {
  to: string;
  name: string;
  note: string;
  money: { crore: number; rupees: number; series: "actual" | "be" | "re"; fiscalYear: string; citationId: string };
}) {
  return (
    <li className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between">
      <div>
        <Link to={to} className="font-medium text-ink no-underline hover:text-rust">
          {name}
        </Link>
        <p className="text-sm text-ink/60">{note}</p>
      </div>
      <Money money={money} size="row" />
    </li>
  );
}

function Section({ title, rows }: { title: string; rows: typeof jurisdictions }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
      <ul className="mt-4 divide-y divide-ink/15 border-y border-ink/20">
        {rows.map((j) => (
          <li key={j.slug} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
            <Link to={doorPath(j)} className="font-medium text-ink no-underline hover:text-rust">
              {j.name}
            </Link>
            <span
              className={`text-[0.7rem] font-semibold uppercase tracking-[0.14em] ${TIER_CLASS[j.tier]}`}
            >
              {tierLabel(j.tier)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function doorPath(j: Jurisdiction): string {
  if (j.slug === "delhi") return "/union/delhi-police";
  return `/${j.slug}/police`;
}
