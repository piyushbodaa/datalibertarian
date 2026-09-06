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
import { coverageCounts } from "../data/coverage";
import { gjFunctional } from "../data/gujarat/police";
import { type Jurisdiction, jurisdictions, type PoliceTier } from "../data/states";
import { tnFunctional } from "../data/tamil-nadu/police";
import { tgObject010 } from "../data/telangana/police";
import { upFunctional } from "../data/uttar-pradesh/police";
import { wbFunctional } from "../data/west-bengal/police";
import { kaFunctional } from "../data/karnataka/police";
import { klFunctional } from "../data/kerala/police";
import { odFunctional } from "../data/odisha/police";
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
  const cov = coverageCounts();
  const goldN = cov.gold;
  const indexN = indexPoliceLines.length;
  const mh = pickAmount(functionalPolice, HEADLINE_YEAR, HEADLINE_SERIES);
  const run = pickAmount(police2055, HEADLINE_YEAR, HEADLINE_SERIES);
  const cap = pickAmount(police4055, HEADLINE_YEAR, HEADLINE_SERIES);
  const up = pickAmount(upFunctional, "2026-27", "be");
  const tg = pickAmount(tgObject010, "2026-27", "be");
  const wb = pickAmount(wbFunctional, "2026-27", "be");
  const gj = pickAmount(gjFunctional, "2026-27", "be");
  const tn = pickAmount(tnFunctional, "2026-27", "be");
  const ka = pickAmount(kaFunctional, "2026-27", "be");
  const kl = pickAmount(klFunctional, "2026-27", "be");
  const od = pickAmount(odFunctional, "2026-27", "be");
  const mhIndex = getIndexRow("maharashtra");
  if (!mh || !run || !cap || !up || !tg || !wb || !gj || !tn || !ka || !kl || !od || !mhIndex) {
    throw new Error("Missing state headline figures");
  }

  return (
    <article>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">States</h1>
      <p className="mt-3 max-w-2xl text-ink">
        Official police figures where we have read the book. {goldN} states from official books.
        The rest are not ready.
      </p>

      <section className="mt-8 border-y border-ink/20 py-8">
        <h2 className="font-display text-2xl font-semibold tracking-tight">From official books</h2>
        <ul className="mt-5 divide-y divide-ink/15 border-y border-ink/20">
          <GoldRow to="/maharashtra/police" name="Maharashtra" money={mh} />
          <GoldRow to="/uttar-pradesh/police" name="Uttar Pradesh" money={up} />
          <GoldRow to="/west-bengal/police" name="West Bengal" money={wb} />
          <GoldRow to="/telangana/police" name="Telangana" money={tg} />
          <GoldRow to="/gujarat/police" name="Gujarat" money={gj} />
          <GoldRow to="/tamil-nadu/police" name="Tamil Nadu" money={tn} />
          <GoldRow to="/karnataka/police" name="Karnataka" money={ka} />
          <GoldRow to="/kerala/police" name="Kerala" money={kl} />
          <GoldRow to="/odisha/police" name="Odisha" money={od} />
        </ul>
        <div className="mt-6">
          <HeadSplit run={run} cap={cap} title="Maharashtra police, this plan" note="Running the force vs buildings and gear." />
        </div>
      </section>

      <section className="index-slip mt-10">
        <h2 className="mt-2 font-display text-xl font-semibold tracking-tight sm:text-2xl">
          Not read from the book yet
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          A research summary lists police figures for {indexN} states for 2025-26. Those are not
          from the official books, so they are not the numbers we compare. Maharashtra’s official
          police figure is ₹{formatCrore(mh.crore)} crore, not the summary’s ₹
          {mhIndex.be2526.toLocaleString("en-IN")} crore.
        </p>
        <RankedHatch
          tone="index"
          showAll
          items={indexPoliceLines}
          fiscalYear={INDEX_YEAR}
          series={INDEX_SERIES}
          title="Research summaries, 2025-26"
          note="Not official books. We do not use these as the main number."
        />
      </section>

      <Section title="States" rows={states} />
      <Section title="Union Territories" rows={uts} />

      <p className="mt-10 max-w-2xl text-sm text-ink/65">
        Delhi Police sits in the Centre’s books. <Link to="/union/delhi-police">Open Delhi Police</Link>
        {" · "}
        <Link to="/sources">Method</Link>
      </p>
    </article>
  );
}

function GoldRow({
  to,
  name,
  money,
}: {
  to: string;
  name: string;
  money: { crore: number; rupees: number; series: "actual" | "be" | "re"; fiscalYear: string; citationId: string };
}) {
  return (
    <li className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between">
      <Link to={to} className="font-medium text-ink no-underline hover:text-rust">
        {name}
      </Link>
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
            {j.tier === "gold" ? (
              <span className="text-sm text-ink/55">Official</span>
            ) : (
              <span className={`text-sm ${TIER_CLASS[j.tier]}`}>
                {j.tier === "blocked" ? "Can't read a clean number" : "Not ready"}
              </span>
            )}
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
