import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CompareRow } from "../components/CompareRow";
import { Money } from "../components/Money";
import { CitationChip, CitationFootnote } from "../components/CitationChip";
import { formatCrore, SERIES_LABEL } from "../lib/money";
import type { LayerId } from "../data/layers";
import type { Series } from "../data/maharashtra-police";
import { tierLabel } from "../data/states";
import type { CompareFieldId, CompareGrain } from "../data/compare/fields";
import { COMPARE_FIELDS, SERIES_OPTIONS } from "../data/compare/fields";
import { grainLabel, type MedianCell } from "../data/compare/median";
import {
  compareRows,
  entitiesFor,
  getCompareEntity,
  intersectYears,
  isCrossLayer,
  resolveSide,
  suggestedPairs,
  yearsOf,
} from "../data/compare/resolve";

const LAYER_OPTS: { id: LayerId; label: string }[] = [
  { id: "union", label: "Centre" },
  { id: "state", label: "State" },
  { id: "municipal", label: "City" },
  { id: "gram", label: "Village" },
];

export function ComparePage() {
  const [params, setParams] = useSearchParams();
  const [copyStatus, setCopyStatus] = useState("");
  async function copyLink() {
    try { await navigator.clipboard.writeText(window.location.href); setCopyStatus("Link copied."); }
    catch { setCopyStatus("Copy was unavailable. Select and copy the address from your browser."); }
  }
  const grainRaw = params.get("grain");
  const grain: CompareGrain = grainRaw === "city" || grainRaw === "station" ? grainRaw : "layer";
  const leftSlug =
    params.get("left") ||
    (grain === "city" ? "hyderabad-city" : grain === "station" ? "bachupally" : "maharashtra");
  const rightSlug = params.get("right") || "";
  const series = (params.get("series") as Series) || "be";
  const year = params.get("year") || "2026-27";
  const exclude = params.get("exclude") === "1";
  const focusRaw = params.get("field") as CompareFieldId | null;
  const focus = COMPARE_FIELDS.some((f) => f.id === focusRaw) ? (focusRaw as CompareFieldId) : "police-functional";

  const left = resolveSide(leftSlug);
  const right = rightSlug ? resolveSide(rightSlug) : undefined;

  const intersection = useMemo(() => {
    if (!left || left.tier !== "gold") return [];
    if (right && right.tier === "gold") return intersectYears(left, right);
    return yearsOf(left);
  }, [left, right]);

  const yearOk = intersection.some((y) => y.fiscalYear === year && y.series === series);
  const latest = (ys: typeof intersection) =>
    [...ys].sort((a, b) => b.fiscalYear.localeCompare(a.fiscalYear))[0];
  const fallback = latest(intersection.filter((y) => y.series === series)) ?? latest(intersection);
  const useYear = yearOk ? year : fallback?.fiscalYear;
  const useSeries = yearOk ? series : fallback?.series;

  const rows =
    left && left.tier === "gold" && useYear && useSeries
      ? compareRows(left, right?.tier === "gold" ? right : undefined, useYear, useSeries, {
          grain,
          excludePicked: exclude,
        })
      : [];

  const heroField = rows.find((r) => r.field.id === "police-functional") ?? rows[0];
  const tableField = rows.find((r) => r.field.id === focus) ?? heroField;
  const cross = left && right ? isCrossLayer(left, right) : false;

  function set(next: Record<string, string | undefined>) {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (!v) p.delete(k);
      else p.set(k, v);
    }
    setParams(p, { replace: true });
  }

  function downloadCsv() {
    if (!left || !useYear || !useSeries) return;
    const header = [
      "field",
      "left",
      "left_crore",
      "left_cite",
      "median_crore",
      "median_n",
      "median_peers",
      "right",
      "right_crore",
      "right_cite",
      "year",
      "series",
    ];
    const lines = rows.map((r) =>
      [
        r.field.id,
        left.entity.slug,
        r.left?.crore ?? "",
        r.left?.citationId ?? "",
        r.mid?.money.crore ?? "",
        r.mid?.n ?? 0,
        r.mid?.peers.map((p) => p.slug).join("|") ?? "",
        right?.entity.slug ?? "",
        r.right?.crore ?? "",
        r.right?.citationId ?? "",
        useYear,
        useSeries,
      ].join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `compare-${left.entity.slug}-${right?.entity.slug ?? "median"}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const citeIds = [
    ...new Set(
      rows
        .flatMap((r) => [r.left?.citationId, r.mid?.money.citationId, r.right?.citationId, ...(r.mid?.peers.map((peer) => peer.money.citationId) ?? [])])
        .filter(Boolean) as string[],
    ),
  ];

  const stationEmpty = grain === "station" && left?.tier !== "gold";

  return (
    <article>
      <p className="kicker">Budget Comparison Tool</p>
      <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">Compare two budgets</h1>
      <p className="mt-2 max-w-2xl text-ink/80">
        Compare any two verified official books side by side, benchmarked against the median of peer
        jurisdictions read so far.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold uppercase tracking-wider text-ink/55">Quick presets:</span>
        {grain === "city" ? (
          <button
            type="button"
            className="live-tag"
            onClick={() => set({ grain: "city", left: "hyderabad-city", right: "cyberabad", series: "be", year: "2026-27" })}
          >
            Hyderabad CP vs Cyberabad
          </button>
        ) : grain === "station" ? (
          <button
            type="button"
            className="live-tag"
            onClick={() => set({ grain: "station", left: "bachupally", right: "" })}
          >
            Named station
          </button>
        ) : (
          <>
            {suggestedPairs().slice(0, 3).map(([a, b]) => (
              <button
                key={`${a}-${b}`}
                type="button"
                className="live-tag"
                onClick={() => set({ grain: "layer", left: a, right: b, series: "be", year: "2026-27" })}
              >
                {getCompareEntity(a)?.name} vs {getCompareEntity(b)?.name}
              </button>
            ))}
            <button
              type="button"
              className="live-tag"
              onClick={() => set({ grain: "layer", left: "telangana", right: "maharashtra", series: "be", year: "2026-27" })}
            >
              Telangana vs Maharashtra
            </button>
            <button
              type="button"
              className="live-tag"
              onClick={() => set({ grain: "layer", left: "ghmc", right: "", series: "be", year: "2025-26" })}
            >
              GHMC (City)
            </button>
          </>
        )}
      </div>

      <section className="carbon-sheet mt-5 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Picker
            label="Left"
            slug={leftSlug}
            grain={grain}
            onLayer={(layer) => {
              const first = entitiesFor(layer, grain)[0];
              set({ left: first?.slug, year: undefined });
            }}
            onEntity={(slug) => set({ left: slug })}
          />
          <Picker
            label="Right"
            slug={rightSlug}
            grain={grain}
            allowEmpty
            onLayer={(layer) => {
              const first = entitiesFor(layer, grain)[0];
              set({ right: first?.slug, year: undefined });
            }}
            onEntity={(slug) => set({ right: slug })}
          />
        </div>

        <details className="mt-4 border-t border-[var(--rule)] pt-3 text-sm text-ink/75">
          <summary className="cursor-pointer font-medium text-ink">Comparison scope &amp; options</summary>
          <div className="mt-3 flex flex-wrap items-center gap-5">
            <label className="inline-flex min-h-9 items-center gap-2">
              <input
                type="checkbox"
                checked={exclude}
                onChange={(e) => set({ exclude: e.target.checked ? "1" : undefined })}
              />
              Exclude picked books from peer median
            </label>
            <label className="flex items-center gap-2">
              <span>Scope</span>
              <select
                className="field w-auto py-1 text-sm"
                value={grain}
                onChange={(e) =>
                  set({
                    grain: e.target.value,
                    left: e.target.value === "city" ? "hyderabad-city" : e.target.value === "station" ? "bachupally" : "maharashtra",
                    right: "",
                  })
                }
              >
                <option value="layer">States / Centre / Cities</option>
                <option value="city">City police commissionerates</option>
                <option value="station">Named police station</option>
              </select>
            </label>
          </div>
        </details>
      </section>

      {cross ? (
        <section className="carbon-sheet mt-6 border-l-4 border-l-ochre px-4 py-4 sm:px-5">
          <p className="kicker text-ochre">Cross-tier comparison</p>
          <p className="mt-1 max-w-2xl text-sm text-ink/80">
            These two books belong to different tiers of government. The peer median column follows the left selection.
          </p>
        </section>
      ) : null}

      {stationEmpty ? (
        <section className="carbon-sheet mt-6 px-4 py-6 sm:px-6">
          <p className="kicker text-ochre">Named police station</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <EmptyWell label="Left station" />
            <EmptyWell label="Peer median" />
            <EmptyWell label="Right station" />
          </div>
          <p className="mt-4 max-w-2xl text-sm text-ink/75">
            Station-level rupee allocations are not published in primary budget volumes, and we never divide state or city totals by station count.
          </p>
        </section>
      ) : !left || left.tier !== "gold" ? (
        <section className="carbon-sheet mt-6 px-4 py-6 sm:px-6">
          <p className="kicker text-ochre">Book pending</p>
          <p className="mt-2 text-sm text-ink/80">
            {left
              ? `${left.entity.name}: ${tierLabel(left.tier)}. ${left.note ?? "This primary volume has not been parsed yet."}`
              : "Select a state or jurisdiction whose official book has been parsed."}
          </p>
        </section>
      ) : useYear && useSeries ? (
        <>
          {right && right.tier !== "gold" ? (
            <p className="mt-5 max-w-2xl text-sm text-ink/75">
              {right.entity.name}’s primary budget volume is not yet parsed here. The peer median still reflects available verified books.
            </p>
          ) : null}

          <div className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <label className="block font-medium text-ink/80">
              Series
              <select
                className="field mt-1"
                value={useSeries}
                onChange={(e) => set({ series: e.target.value })}
              >
                {SERIES_OPTIONS.filter((s) => intersection.some((y) => y.series === s)).map((s) => (
                  <option key={s} value={s}>
                    {SERIES_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block font-medium text-ink/80">
              Fiscal year
              <select
                className="field mt-1"
                value={useYear}
                onChange={(e) => set({ year: e.target.value })}
              >
                {[...new Set(intersection.filter((y) => y.series === useSeries).map((y) => y.fiscalYear))].map(
                  (y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ),
                )}
              </select>
            </label>
            <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
              <button
                type="button"
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-md border border-[var(--rule-strong)] bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:border-rust hover:text-rust"
                onClick={copyLink}
              >
                Copy link
              </button>
              <button
                type="button"
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-md bg-rust px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#162C49]"
                onClick={downloadCsv}
              >
                CSV
              </button>
              <p role="status" className="text-xs text-ink/70">{copyStatus}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Hero kicker="Left" side={left} money={heroField?.left} rule="rust" />
            <MedianHero
              cell={heroField?.mid}
              grain={grain}
              layer={left.entity.layer}
              fieldLabel={heroField?.field.label}
            />
            {right && right.tier === "gold" ? (
              <Hero kicker="Right" side={right} money={heroField?.right} rule="carbon" />
            ) : (
              <section className="docket-door bone layer-state">
                <p className="kicker">Right</p>
                <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">
                  {right ? right.entity.name : "Pick a second book"}
                </h2>
                <p className="mt-6 text-sm text-ink/65">
                  {right ? `${right.entity.name}’s primary budget volume has not been parsed here yet.` : "Select a book in Right book above to compare directly."}
                </p>
              </section>
            )}
          </div>

          {heroField?.left && heroField?.right ? (
            <section className="index-slip mt-6">
              <p className="kicker">Comparison Summary</p>
              <p className="mt-1 text-sm text-ink/85">
                For <strong>{heroField.field.label.toLowerCase()}</strong> ({useYear} {SERIES_LABEL[useSeries]}),{" "}
                <strong>{left.entity.name}</strong> budgets{" "}
                <span className="num font-semibold">₹{formatCrore(heroField.left.crore)} crore</span> vs{" "}
                <strong>{right?.entity.name}</strong>’s{" "}
                <span className="num font-semibold">₹{formatCrore(heroField.right.crore)} crore</span> — a difference of{" "}
                <span className="num font-semibold">
                  ₹{formatCrore(Math.abs(heroField.left.crore - heroField.right.crore))} crore
                </span>{" "}
                ({heroField.left.crore >= heroField.right.crore ? "+" : "−"}
                {heroField.right.crore > 0
                  ? Math.abs(((heroField.left.crore - heroField.right.crore) / heroField.right.crore) * 100).toFixed(1)
                  : "0.0"}
                %).
              </p>
            </section>
          ) : heroField?.left && heroField?.mid ? (
            <section className="index-slip mt-6">
              <p className="kicker">Comparison Summary</p>
              <p className="mt-1 text-sm text-ink/85">
                <strong>{left.entity.name}</strong> budgets{" "}
                <span className="num font-semibold">₹{formatCrore(heroField.left.crore)} crore</span> for{" "}
                <strong>{heroField.field.label.toLowerCase()}</strong> ({useYear} {SERIES_LABEL[useSeries]}), compared to a peer median of{" "}
                <span className="num font-semibold">₹{formatCrore(heroField.mid.money.crore)} crore</span> across {heroField.mid.n} books.
              </p>
            </section>
          ) : null}

          <ol className="mt-6 p-0">
            {rows.map((r) => (
              <CompareRow key={r.field.id} field={r.field} left={r.left} mid={r.mid} right={r.right} />
            ))}
          </ol>

          {tableField?.mid ? (
            <MedianTable
              cell={tableField.mid}
              fieldId={tableField.field.id}
              fieldIds={rows.map((r) => r.field.id)}
              leftSlug={left.entity.slug}
              rightSlug={right?.entity.slug}
              onField={(id) => set({ field: id })}
            />
          ) : tableField && !tableField.mid ? (
            <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
              <p className="kicker text-ochre">Peer median</p>
              <p className="mt-2 text-sm text-ink/75">No official book printed this line.</p>
            </section>
          ) : null}
        </>
      ) : null}

      <section className="index-slip mt-10">
        <p className="kicker">Methodology note</p>
        <p className="mt-2 max-w-2xl text-sm text-ink/75">
          The peer median is computed directly across the verified official books currently published for this tier — never a national average or estimated placeholder. Blank cells indicate lines not separated in that volume.
        </p>
      </section>

      {citeIds.length ? (
        <section className="mt-10 text-sm text-ink/70">
          <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
          <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
            {citeIds.map((id) => (
              <CitationFootnote key={id} citationId={id} />
            ))}
          </ol>
        </section>
      ) : null}

      <p className="mt-8 text-sm">
        <Link to="/sources">Sources &amp; methodology</Link>
        {" · "}
        <Link to="/search">Search</Link>
      </p>
    </article>
  );
}

function EmptyWell({ label }: { label: string }) {
  return (
    <div>
      <p className="text-[0.7rem] uppercase tracking-[0.14em] text-ink/45">{label}</p>
      <p className="mt-2 text-sm text-ink/55">No figure yet.</p>
    </div>
  );
}

function MedianHero({
  cell,
  grain,
  layer,
  fieldLabel,
}: {
  cell?: MedianCell | null;
  grain: CompareGrain;
  layer: LayerId;
  fieldLabel?: string;
}) {
  const midNames = cell?.midSlugs
    .map((s) => cell.peers.find((p) => p.slug === s)?.label ?? s)
    .join(" and ");
  return (
    <section className="docket-door" style={{ borderLeftColor: "var(--ochre)" }}>
      <p className="kicker text-ochre">
        {cell ? (cell.thin ? `Limited books · ${cell.n}` : `Peer median · ${cell.n} books`) : "Peer median"}
      </p>
      <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">
        {cell ? `Median across ${cell.n} ${grainLabel(grain, layer)}` : "Peer median"}
      </h2>
      {cell ? (
        <>
          <div className="mt-4">
            <Money money={cell.money} size="hero" showSeries />
          </div>
          <p className="mt-3 text-sm text-ink/70">
            Median of {cell.n} official books
            {fieldLabel ? ` for ${fieldLabel.toLowerCase()}` : ""}.
            {cell.method === "mid-pair"
              ? ` Mid-pair average of ${midNames}.`
              : null}
          </p>
          <p className="mt-2 text-xs text-ink/55">
            Mean across {cell.n} books: <span className="num">₹{formatCrore(cell.meanCrore)} crore</span>
          </p>
        </>
      ) : (
        <p className="mt-6 text-sm text-ink/55">No figure yet.</p>
      )}
    </section>
  );
}

function MedianTable({
  cell,
  fieldId,
  fieldIds,
  leftSlug,
  rightSlug,
  onField,
}: {
  cell: MedianCell;
  fieldId: string;
  fieldIds: CompareFieldId[];
  leftSlug: string;
  rightSlug?: string;
  onField: (id: CompareFieldId) => void;
}) {
  const field = COMPARE_FIELDS.find((f) => f.id === fieldId);
  const switcher = COMPARE_FIELDS.filter((f) => fieldIds.includes(f.id));
  return (
    <section className="mt-10">
      <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">
        Official books in the peer distribution
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-ink/70">
        Ranked smallest to largest for this accounting line so the peer median sits at center.
      </p>
      <p className="mt-3 flex flex-wrap gap-2 text-sm">
        {switcher.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`live-tag ${f.id === fieldId ? "border-rust bg-[#EEF2F7] text-rust" : "text-ink"}`}
            onClick={() => onField(f.id)}
          >
            {f.label}
          </button>
        ))}
      </p>
      <div className="ledger-scroll mt-4">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            {field?.label} · median of {cell.n}
          </caption>
          <thead>
            <tr className="border-b border-[var(--rule)] bg-slate-50 text-[0.7rem] uppercase tracking-[0.1em] text-ink/55">
              <th className="px-4 py-2.5 font-semibold">Book</th>
              <th className="px-4 py-2.5 font-semibold">Value</th>
              <th className="px-4 py-2.5 font-semibold">Citation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--rule)]">
            {cell.peers.map((p) => {
              const mark =
                cell.midSlugs.includes(p.slug) || p.slug === leftSlug || p.slug === rightSlug;
              return (
                <tr key={p.slug} className={mark ? "bg-[#EEF2F7]/65 font-medium" : undefined}>
                  <td className="px-4 py-2.5">
                    <Link to={p.href}>{p.label}</Link>
                    {cell.midSlugs.includes(p.slug) ? (
                      <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-ochre">
                        median
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="num">₹{formatCrore(p.money.crore)} crore</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <CitationChip citationId={p.money.citationId} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Hero({
  kicker,
  side,
  money,
  rule,
}: {
  kicker: string;
  side: NonNullable<ReturnType<typeof resolveSide>>;
  money?: { crore: number; rupees: number; series: Series; fiscalYear: string; citationId: string };
  rule: "rust" | "carbon";
}) {
  return (
    <section className={`docket-door ${rule === "carbon" ? "layer-state" : "layer-union"}`}>
      <p className="kicker">{kicker}</p>
      <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">{side.entity.name}</h2>
      {money ? (
        <div className="mt-4">
          <Money money={money} size="hero" showSeries />
        </div>
      ) : (
        <p className="mt-6 text-sm text-ink/55">No figure yet.</p>
      )}
      <p className="mt-3 text-sm">
        <Link to={side.entity.href}>Open this book</Link>
      </p>
    </section>
  );
}

function Picker({
  label,
  slug,
  grain,
  allowEmpty,
  onLayer,
  onEntity,
}: {
  label: string;
  slug: string;
  grain: CompareGrain;
  allowEmpty?: boolean;
  onLayer: (layer: LayerId) => void;
  onEntity: (slug: string) => void;
}) {
  const entity = slug ? getCompareEntity(slug) : undefined;
  const layer = entity?.layer ?? "state";
  const options = entitiesFor(layer, grain);
  return (
    <div className="min-w-0">
      <div className="flex flex-col gap-2 text-sm">
        {grain === "layer" ? (
          <details><summary className="cursor-pointer text-ink/65">{label}: {LAYER_OPTS.find((option) => option.id === layer)?.label}</summary><label className="block">
            Kind
            <select
              className="field mt-1"
              value={layer}
              onChange={(e) => onLayer(e.target.value as LayerId)}
            >
              {LAYER_OPTS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </label></details>
        ) : null}
        <label className="block">
          {label} book
          <select
            className="field mt-1"
            value={slug}
            onChange={(e) => onEntity(e.target.value)}
          >
            {allowEmpty ? <option value="">Pick a book</option> : null}
            {options.map((e) => (
              <option key={e.slug} value={e.slug}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
