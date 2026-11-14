import { useMemo, useState } from "react";
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
  empty: "text-ink/50",
};

export function StatesPage() {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"budget" | "alpha">("budget");

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

  const goldRows = useMemo(
    () => [
      { to: "/maharashtra/police", name: "Maharashtra", money: mh },
      { to: "/uttar-pradesh/police", name: "Uttar Pradesh", money: up },
      { to: "/west-bengal/police", name: "West Bengal", money: wb },
      { to: "/telangana/police", name: "Telangana", money: tg },
      { to: "/gujarat/police", name: "Gujarat", money: gj },
      { to: "/tamil-nadu/police", name: "Tamil Nadu", money: tn },
      { to: "/karnataka/police", name: "Karnataka", money: ka },
      { to: "/kerala/police", name: "Kerala", money: kl },
      { to: "/odisha/police", name: "Odisha", money: od },
      { to: "/andhra-pradesh/police", name: "Andhra Pradesh", money: ap },
      { to: "/uttarakhand/police", name: "Uttarakhand", money: uk },
      { to: "/assam/police", name: "Assam", money: as },
      { to: "/chhattisgarh/police", name: "Chhattisgarh", money: cg },
      { to: "/jharkhand/police", name: "Jharkhand", money: jh },
      { to: "/goa/police", name: "Goa", money: ga },
      { to: "/punjab/police", name: "Punjab", money: pb },
      { to: "/haryana/police", name: "Haryana", money: hr },
      { to: "/tripura/police", name: "Tripura", money: tr },
      { to: "/meghalaya/police", name: "Meghalaya", money: ml },
      { to: "/manipur/police", name: "Manipur", money: mn },
      { to: "/nagaland/police", name: "Nagaland", money: nl },
      { to: "/mizoram/police", name: "Mizoram", money: mz },
      { to: "/arunachal-pradesh/police", name: "Arunachal Pradesh", money: ar },
      { to: "/sikkim/police", name: "Sikkim", money: sk },
      { to: "/rajasthan/police", name: "Rajasthan", money: rj },
      { to: "/himachal-pradesh/police", name: "Himachal Pradesh", money: hp },
      { to: "/bihar/police", name: "Bihar", money: br },
    ],
    [mh, up, wb, tg, gj, tn, ka, kl, od, ap, uk, as, cg, jh, ga, pb, hr, tr, ml, mn, nl, mz, ar, sk, rj, hp, br],
  );

  const maxGold = useMemo(() => Math.max(...goldRows.map((r) => r.money.crore), 1), [goldRows]);

  const visibleGold = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? goldRows.filter((r) => r.name.toLowerCase().includes(q)) : goldRows;
    return [...list].sort((a, b) =>
      sortBy === "budget" ? b.money.crore - a.money.crore : a.name.localeCompare(b.name),
    );
  }, [goldRows, query, sortBy]);

  return (
    <article>
      <p className="kicker">State &amp; UT Police Budgets</p>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">States</h1>
      <p className="mt-3 max-w-2xl text-ink/80">
        Primary police budget totals extracted from official state Annual Financial Statements and
        Demand books. {goldN} states verified for FY 2026–27 BE. For crime, schools, and court records
        per jurisdiction, open <a href="/by-state">browse by state</a>.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="carbon-sheet p-4">
          <p className="kicker">Verified 2026–27 Books</p>
          <p className="num mt-1.5 text-2xl font-semibold text-ink">{goldN} States</p>
          <p className="mt-1 text-xs text-ink/65">Parsed straight from state AFS &amp; Demand PDFs</p>
        </div>
        <div className="carbon-sheet p-4">
          <p className="kicker">Highest State Police Allocation</p>
          <p className="num mt-1.5 text-2xl font-semibold text-ink">
            ₹{formatCrore(maxGold)} cr
          </p>
          <p className="mt-1 text-xs text-ink/65">Rank #1 among verified 2026–27 official books</p>
        </div>
        <Link to="/compare?left=maharashtra&right=uttar-pradesh" className="docket-door layer-union flex flex-col justify-center">
          <p className="kicker">Interactive Benchmark</p>
          <p className="mt-1 text-base font-semibold text-rust">Compare any two states →</p>
          <p className="mt-0.5 text-xs text-ink/65">Side-by-side revenue, capital &amp; peer medians</p>
        </Link>
      </div>

      <section className="carbon-sheet mt-8 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--rule)] pb-4">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">
              2026–27 Official Police Budgets
            </h2>
            <p className="mt-0.5 text-xs text-ink/65">
              Ranked by crore rupees · Major Heads 2055 + 4055 (click any state for full breakdown)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="states-filter" className="sr-only">
              Filter states
            </label>
            <input
              id="states-filter"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter state…"
              className="field w-44 py-1.5 text-sm"
            />
            <div className="inline-flex rounded-md border border-[var(--rule-strong)] bg-paper p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setSortBy("budget")}
                className={`rounded px-2.5 py-1.5 transition ${
                  sortBy === "budget" ? "bg-white font-semibold text-rust shadow-sm" : "text-ink/70"
                }`}
              >
                Highest budget
              </button>
              <button
                type="button"
                onClick={() => setSortBy("alpha")}
                className={`rounded px-2.5 py-1.5 transition ${
                  sortBy === "alpha" ? "bg-white font-semibold text-rust shadow-sm" : "text-ink/70"
                }`}
              >
                A–Z
              </button>
            </div>
          </div>
        </div>

        <ul className="mt-3 divide-y divide-[var(--rule)]">
          {visibleGold.map((row, idx) => {
            const pct = Math.max((row.money.crore / maxGold) * 100, 1.5);
            return (
              <li
                key={row.to}
                className="grid items-center gap-2 py-3 sm:grid-cols-[2rem_13rem_1fr_auto]"
              >
                <span className="num text-xs text-ink/45">
                  {sortBy === "budget" ? `#${idx + 1}` : ""}
                </span>
                <Link
                  to={row.to}
                  className="font-semibold text-ink no-underline hover:text-rust"
                >
                  {row.name}
                </Link>
                <div className="hidden h-2.5 w-full overflow-hidden rounded-full bg-slate-100 sm:block" aria-hidden="true">
                  <div
                    className="h-full rounded-full bg-rust/80"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="sm:text-right">
                  <Money money={row.money} size="row" />
                </div>
              </li>
            );
          })}
          {visibleGold.length === 0 ? (
            <li className="py-6 text-sm text-ink/60">No state matched “{query}”.</li>
          ) : null}
        </ul>

        <div className="mt-6 border-t border-[var(--rule)] pt-4">
          <HeadSplit
            run={run}
            cap={cap}
            title="Reference split · Maharashtra 2026–27"
            note="Running costs (Revenue 2055) vs buildings and gear (Capital 4055)."
          />
        </div>
      </section>

      <section className="index-slip mt-10">
        <h2 className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">
          Secondary index · Research summaries (2025–26)
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-ink/75">
          PRS research summaries cover {indexN} states for FY 2025–26 BE. They use broader sector
          groupings than primary Major Head books — for example, Maharashtra’s verified AFS police
          book is ₹{formatCrore(mh.crore)} crore (2026–27), compared to the summary figure of ₹
          {mhIndex.be2526.toLocaleString("en-IN")} crore (2025–26). Kept strictly separate from
          primary state rankings.
        </p>
        <RankedHatch
          tone="index"
          showAll
          items={indexPoliceLines}
          fiscalYear={INDEX_YEAR}
          series={INDEX_SERIES}
          title="PRS research summary estimates, 2025–26"
          note="Secondary digest figures — not primary budget book totals."
        />
      </section>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <Section title="All States — book status" rows={states} />
        <Section title="Union Territories — book status" rows={uts} />
      </div>

      <p className="mt-10 max-w-2xl text-sm text-ink/70">
        Delhi Police is budgeted directly by the Union Ministry of Home Affairs under Demand 51.{" "}
        <Link to="/union/delhi-police">Open Delhi Police</Link>
        {" · "}
        <Link to="/sources">Sources &amp; methodology</Link>
      </p>
    </article>
  );
}

function Section({ title, rows }: { title: string; rows: typeof jurisdictions }) {
  return (
    <section className="carbon-sheet p-5">
      <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
      <ul className="mt-3 divide-y divide-[var(--rule)]">
        {rows.map((j) => (
          <li key={j.slug} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-sm">
            <Link to={doorPath(j)} className="font-medium text-ink no-underline hover:text-rust">
              {j.name}
            </Link>
            {j.tier === "gold" ? (
              <span className="rounded-full bg-[#EEF2F7] px-2 py-0.5 text-xs font-semibold text-rust">
                Official book
              </span>
            ) : (
              <span className={`text-xs font-medium ${TIER_CLASS[j.tier]}`}>
                {j.tier === "blocked" ? "Pending format" : "Pending"}
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
