import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BasketPie } from "../components/BasketPie";
import { CitationChip, CitationFootnote } from "../components/CitationChip";
import { DivisionBars } from "../components/DivisionBars";
import { PrintedPaidRow } from "../components/PrintedPaidRow";
import type { InflationCategory } from "../data/inflation/types";
import {
  AS_OF,
  CPI_COMBINED_YOY,
  CPI_DEC_2025_INDEX,
  CPI_FOOD,
  CPI_HEADLINE,
  CPI_JUNE_INDEX,
  CPI_RURAL_YOY,
  CPI_URBAN_YOY,
  INFLATION_ITEMS,
} from "../data/inflation/items";
import { CPI_DIVISIONS, ROOMS, WEIGHTS_CITE } from "../data/inflation/weights";
import { formatDay, formatPct, formatPrice, indexChangePct, yearPair } from "../data/inflation/yoy";

const FILTER_GROUPS: { id: "all" | "food" | "fuel" | "other"; label: string; cats?: InflationCategory[] }[] = [
  { id: "all", label: "All items" },
  { id: "food", label: "Food & Kitchen", cats: ["grains", "pulses", "oils", "veg", "dairy", "sugar"] },
  { id: "fuel", label: "Fuel & Energy", cats: ["fuel"] },
  { id: "other", label: "Other", cats: ["other"] },
];

export function InflationPage() {
  const [group, setGroup] = useState<"all" | "food" | "fuel" | "other">("all");
  const [search, setSearch] = useState("");

  const priced = INFLATION_ITEMS.map((item) => {
    const pair = yearPair(item);
    if (!pair) return null;
    return { item, pair };
  }).filter((r): r is NonNullable<typeof r> => r !== null);

  const visibleItems = useMemo(() => {
    const cfg = FILTER_GROUPS.find((g) => g.id === group);
    const q = search.trim().toLowerCase();
    return INFLATION_ITEMS.filter((item) => {
      if (cfg?.cats && !cfg.cats.includes(item.category)) return false;
      if (q && !item.plainLabel.toLowerCase().includes(q) && !item.officialName.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [group, search]);

  const mom = indexChangePct(CPI_HEADLINE.index ?? 0, CPI_JUNE_INDEX);
  const ytd = indexChangePct(CPI_HEADLINE.index ?? 0, CPI_DEC_2025_INDEX);
  const highDiv = [...CPI_DIVISIONS].sort((a, b) => b.yoyPct - a.yoyPct)[0];
  const lowDiv = [...CPI_DIVISIONS].sort((a, b) => a.yoyPct - b.yoyPct)[0];
  const onion = priced.find((r) => r.item.id === "onion");
  const yoyMax = Math.max(...CPI_COMBINED_YOY.map((m) => m.yoyPct));

  return (
    <article>
      <p className="kicker">Consumer Prices &amp; Inflation · India</p>
      <h1 className="mt-2 font-display text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl">
        Consumer Prices: Official CPI vs Observed Retail Averages
      </h1>
      <p className="mt-3 max-w-2xl text-ink/80">
        Each item places two cited official series side by side: MoSPI’s published CPI rate
        (July 2025 → July 2026; parent division where item indices are not released) alongside
        national retail price averages published by the Price Monitoring Division and PPAC (
        {formatDay("2025-09-10")} → {formatDay(AS_OF)}). Because the reporting windows are offset by
        two months, compare patterns rather than treating one figure as an audit of the other.
        Combined CPI is {formatPct(CPI_HEADLINE.yoyPct)}.
        <CitationChip citationId={CPI_HEADLINE.citationId} />
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <section className="carbon-sheet px-5 py-4">
          <p className="kicker text-rust">12-Month Headline CPI</p>
          <p className="num mt-1.5 text-3xl font-semibold whitespace-nowrap">{formatPct(CPI_HEADLINE.yoyPct)}</p>
          <p className="mt-1.5 text-sm text-ink/70">
            July 2025 → July 2026 Combined. Food (CFPI): {formatPct(CPI_FOOD.yoyPct)}.
            <CitationChip citationId={CPI_HEADLINE.citationId} />
          </p>
        </section>
        <section className="carbon-sheet px-5 py-4">
          <p className="kicker">One-Month Change</p>
          <p className="num mt-1.5 text-3xl font-semibold whitespace-nowrap">{mom !== undefined ? formatPct(mom) : "—"}</p>
          <p className="mt-1.5 text-sm text-ink/70">
            Combined index {CPI_JUNE_INDEX} (June) → {CPI_HEADLINE.index} (July).
          </p>
        </section>
        <section className="carbon-sheet px-5 py-4">
          <p className="kicker">Since Dec 2025</p>
          <p className="num mt-1.5 text-3xl font-semibold whitespace-nowrap">{ytd !== undefined ? formatPct(ytd) : "—"}</p>
          <p className="mt-1.5 text-sm text-ink/70">
            Combined index {CPI_DEC_2025_INDEX} (Dec 2025) → {CPI_HEADLINE.index} (July).
          </p>
        </section>
      </div>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">Item-by-item price monitor</h2>
            <p className="mt-1 max-w-2xl text-sm text-ink/70">
              {INFLATION_ITEMS.length} tracked staples pairing MoSPI index rates with PMD / PPAC retail averages.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1.5">
              {FILTER_GROUPS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGroup(g.id)}
                  className={`live-tag ${group === g.id ? "border-rust bg-[#EEF2F7] text-rust" : ""}`}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <label htmlFor="cpi-item-search" className="sr-only">
              Filter price items
            </label>
            <input
              id="cpi-item-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter item…"
              className="field w-40 py-1 text-sm"
            />
          </div>
        </div>
        <ul className="mt-5 list-none p-0">
          {visibleItems.map((item) => (
            <PrintedPaidRow key={item.id} item={item} />
          ))}
          {visibleItems.length === 0 ? (
            <li className="carbon-sheet p-5 text-sm text-ink/65">No items match “{search}”.</li>
          ) : null}
        </ul>
      </section>

      <div className="mt-12">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Official MoSPI Bulletin Breakdown</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-ink/70">
          Headline index divisions, 2024 consumption basket weights, and monthly trajectory.
        </p>
      </div>

      <DivisionBars />

      <section className="carbon-sheet mt-8 px-5 py-6">
        <h3 className="font-display text-lg font-semibold">July 2026 Bulletin Highlights</h3>
        <ul className="mt-3 max-w-2xl list-disc space-y-2.5 pl-5 text-sm text-ink/80">
          <li>
            All-India Combined CPI rose {formatPct(CPI_HEADLINE.yoyPct)} year-on-year; rural CPI was{" "}
            {formatPct(CPI_RURAL_YOY)} and urban CPI {formatPct(CPI_URBAN_YOY)}.
          </li>
          <li>
            Highest division increase: {highDiv.label} ({formatPct(highDiv.yoyPct)}). Lowest:{" "}
            {lowDiv.label} ({formatPct(lowDiv.yoyPct)}).
          </li>
          {onion?.item.official ? (
            <li>
              Observed onion retail average moved from {formatPrice(onion.pair.then)} on{" "}
              {formatDay(onion.pair.then.asOf)} to {formatPrice(onion.pair.now)} on{" "}
              {formatDay(onion.pair.now.asOf)}, compared to a published July CPI index change of{" "}
              {formatPct(onion.item.official.yoyPct)}.
            </li>
          ) : null}
          <li>Core, regulated, and seasonal sub-splits were not issued in the July press note.</li>
        </ul>
      </section>

      <BasketPie />

      <section className="carbon-sheet mt-8 p-5">
        <h3 className="font-display text-lg font-semibold tracking-tight">Rural vs Urban vs Combined</h3>
        <p className="mt-1 text-sm text-ink/70">
          Twelve-month CPI rates as of July 2026 (state-level CPI splits are not included in the national note).
        </p>
        <ul className="mt-4 space-y-3">
          {[
            { label: "Rural", pct: CPI_RURAL_YOY },
            { label: "Urban", pct: CPI_URBAN_YOY },
            { label: "Combined", pct: CPI_HEADLINE.yoyPct },
          ].map((row) => (
            <li key={row.label}>
              <div className="flex justify-between text-sm">
                <span className="font-medium">{row.label}</span>
                <span className="num font-semibold">{formatPct(row.pct)}</span>
              </div>
              <div className="mt-1 h-2.5 w-full overflow-hidden rounded bg-slate-100">
                <div
                  className="hatch-carbon h-2.5 rounded"
                  style={{
                    width: `${(row.pct / Math.max(CPI_RURAL_YOY, CPI_URBAN_YOY, CPI_HEADLINE.yoyPct)) * 100}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="carbon-sheet mt-8 p-5">
        <h3 className="font-display text-lg font-semibold tracking-tight">Twelve-month CPI trajectory</h3>
        <p className="mt-1 text-sm text-ink/70">Monthly Combined CPI progression published in the July 2026 note.</p>
        <ol className="mt-4 flex items-end gap-2">
          {CPI_COMBINED_YOY.map((m) => (
            <li key={m.period} className="flex-1 text-center">
              <div
                className="mx-auto w-full rounded-t bg-[var(--zinc)]"
                style={{ height: `${(m.yoyPct / yoyMax) * 7}rem` }}
                role="img"
                aria-label={`${m.period}, ${formatPct(m.yoyPct)}`}
              />
              <p className="num mt-1 text-[0.65rem] text-ink/65">{m.period.slice(5)}</p>
              <p className="num text-[0.7rem] font-medium">{formatPct(m.yoyPct)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold tracking-tight">CPI Basket Categories</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-ink/70">
          Inspect each expenditure division and its underlying retail price items. Missing observed prices remain blank rather than imputed.
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {ROOMS.map((room) => {
            const div = room.divisionId
              ? CPI_DIVISIONS.find((d) => d.id === room.divisionId)
              : undefined;
            return (
              <li key={room.id} className="list-none">
                <Link
                  to={`/inflation/${room.id}`}
                  className="docket-door block text-ink no-underline hover:text-rust"
                >
                  <p className="font-display text-lg font-semibold">{room.label}</p>
                  <p className="mt-1 text-sm text-ink/70">{room.blurb}</p>
                  {div ? (
                    <p className="num mt-3 text-xs font-medium text-ink/75">
                      Basket weight {div.weight.toFixed(2)}% · Official CPI {formatPct(div.yoyPct)} YoY
                    </p>
                  ) : (
                    <p className="mt-3 text-xs font-medium text-ink/65">Observed PPAC fuel retail prices →</p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Primary Sources</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          <CitationFootnote citationId="pmd-retail-2026-09-10" />
          <CitationFootnote citationId="ppac-fuel-2026-09-10" />
          <CitationFootnote citationId={CPI_HEADLINE.citationId} />
          <CitationFootnote citationId={WEIGHTS_CITE} />
        </ol>
        <p className="mt-6">
          <Link to="/inflation/method">Methodology: how prices &amp; CPI are compiled</Link>
          {" · "}
          <a href="/data/inflation-observed.csv">Download all observed prices (CSV)</a>
        </p>
      </section>
    </article>
  );
}
