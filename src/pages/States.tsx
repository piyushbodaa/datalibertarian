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
import { apFunctional } from "../data/andhra-pradesh/police";
import { ukFunctional } from "../data/uttarakhand/police";
import { asFunctional } from "../data/assam/police";
import { cgFunctional } from "../data/chhattisgarh/police";
import { jhFunctional } from "../data/jharkhand/police";
import { gaFunctional } from "../data/goa/police";
import { pbFunctional } from "../data/punjab/police";
import { hrFunctional } from "../data/haryana/police";
import { arFunctional } from "../data/arunachal-pradesh/police";
import { skFunctional } from "../data/sikkim/police";
import { rjFunctional } from "../data/rajasthan/police";
import { hpFunctional } from "../data/himachal-pradesh/police";
import { brFunctional } from "../data/bihar/police";
import { mlFunctional } from "../data/meghalaya/police";
import { mnFunctional } from "../data/manipur/police";
import { mzFunctional } from "../data/mizoram/police";
import { nlFunctional } from "../data/nagaland/police";
import { trFunctional } from "../data/tripura/police";
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
  const ap = pickAmount(apFunctional, "2026-27", "be");
  const uk = pickAmount(ukFunctional, "2026-27", "be");
  const as = pickAmount(asFunctional, "2026-27", "be");
  const cg = pickAmount(cgFunctional, "2026-27", "be");
  const jh = pickAmount(jhFunctional, "2026-27", "be");
  const ga = pickAmount(gaFunctional, "2026-27", "be");
  const pb = pickAmount(pbFunctional, "2026-27", "be");
  const hr = pickAmount(hrFunctional, "2026-27", "be");
  const tr = pickAmount(trFunctional, "2026-27", "be");
  const ml = pickAmount(mlFunctional, "2026-27", "be");
  const mn = pickAmount(mnFunctional, "2026-27", "be");
  const nl = pickAmount(nlFunctional, "2026-27", "be");
  const mz = pickAmount(mzFunctional, "2026-27", "be");
  const ar = pickAmount(arFunctional, "2026-27", "be");
  const sk = pickAmount(skFunctional, "2026-27", "be");
  const rj = pickAmount(rjFunctional, "2026-27", "be");
  const hp = pickAmount(hpFunctional, "2026-27", "be");
  const br = pickAmount(brFunctional, "2026-27", "be");
  const mhIndex = getIndexRow("maharashtra");
  if (
    !mh ||
    !run ||
    !cap ||
    !up ||
    !tg ||
    !wb ||
    !gj ||
    !tn ||
    !ka ||
    !kl ||
    !od ||
    !ap ||
    !uk ||
    !as ||
    !cg ||
    !jh ||
    !ga ||
    !pb ||
    !hr ||
    !tr ||
    !ml ||
    !mn ||
    !nl ||
    !mz ||
    !ar ||
    !sk ||
    !rj ||
    !hp ||
    !br ||
    !mhIndex
  ) {
    throw new Error("Missing state headline figures");
  }

  return (
    <article>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">States</h1>
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
          <GoldRow to="/andhra-pradesh/police" name="Andhra Pradesh" money={ap} />
          <GoldRow to="/uttarakhand/police" name="Uttarakhand" money={uk} />
          <GoldRow to="/assam/police" name="Assam" money={as} />
          <GoldRow to="/chhattisgarh/police" name="Chhattisgarh" money={cg} />
          <GoldRow to="/jharkhand/police" name="Jharkhand" money={jh} />
          <GoldRow to="/goa/police" name="Goa" money={ga} />
          <GoldRow to="/punjab/police" name="Punjab" money={pb} />
          <GoldRow to="/haryana/police" name="Haryana" money={hr} />
          <GoldRow to="/tripura/police" name="Tripura" money={tr} />
          <GoldRow to="/meghalaya/police" name="Meghalaya" money={ml} />
          <GoldRow to="/manipur/police" name="Manipur" money={mn} />
          <GoldRow to="/nagaland/police" name="Nagaland" money={nl} />
          <GoldRow to="/mizoram/police" name="Mizoram" money={mz} />
          <GoldRow to="/arunachal-pradesh/police" name="Arunachal Pradesh" money={ar} />
          <GoldRow to="/sikkim/police" name="Sikkim" money={sk} />
          <GoldRow to="/rajasthan/police" name="Rajasthan" money={rj} />
          <GoldRow to="/himachal-pradesh/police" name="Himachal Pradesh" money={hp} />
          <GoldRow to="/bihar/police" name="Bihar" money={br} />
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
