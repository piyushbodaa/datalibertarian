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
  const fallback = intersection.find((y) => y.series === series) ?? intersection[0];
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
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Compare two states</h1>
      <p className="mt-3 max-w-2xl text-ink">
        Pick two. The middle number is the middle of the official state books we have already read.
      </p>

      <details className="mt-4 text-sm"><summary className="cursor-pointer min-h-11 flex items-center">Advanced comparison options</summary>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="inline-flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={exclude}
            onChange={(e) => set({ exclude: e.target.checked ? "1" : undefined })}
          />
          Don’t count these two
        </label>
        <details className="text-sm text-ink/70">
          <summary className="cursor-pointer">More</summary>
          <label className="mt-2 block">
            What to compare{" "}
            <select
              className="field mt-1 max-w-xs"
              value={grain}
              onChange={(e) =>
                set({
                  grain: e.target.value,
                  left: e.target.value === "city" ? "hyderabad-city" : e.target.value === "station" ? "bachupally" : "maharashtra",
                  right: "",
                })
              }
            >
              <option value="layer">States / Centre</option>
              <option value="city">City police</option>
              <option value="station">Named police station</option>
            </select>
          </label>
        </details>
      </div>

      </details>
      <div className="mt-3 grid grid-cols-2 gap-3">
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

      <details className="mt-3 text-sm"><summary className="cursor-pointer">Suggested comparisons</summary>
      <p className="mt-2 flex flex-wrap gap-2 text-sm">
        {grain === "city" ? (
          <button
            type="button"
            className="live-tag text-ink"
            onClick={() => set({ grain: "city", left: "hyderabad-city", right: "cyberabad", series: "be", year: "2026-27" })}
          >
            Hyderabad CP / Cyberabad
          </button>
        ) : grain === "station" ? (
          <button
            type="button"
            className="live-tag text-ink"
            onClick={() => set({ grain: "station", left: "bachupally", right: "" })}
          >
            Named station (no figure yet)
          </button>
        ) : (
          suggestedPairs().map(([a, b]) => (
            <button
              key={`${a}-${b}`}
              type="button"
              className="live-tag text-ink"
              onClick={() => set({ grain: "layer", left: a, right: b, series: "be", year: "2026-27" })}
            >
              {getCompareEntity(a)?.name} / {getCompareEntity(b)?.name}
            </button>
          ))
        )}
      </p>

      </details>
      {cross ? (
        <section className="carbon-sheet mt-8 px-4 py-5 sm:px-6">
          <p className="kicker text-ochre">Different books — not a like-for-like</p>
          <p className="mt-2 max-w-2xl text-sm text-ink/75">
            These two are not the same kind of book. The middle number follows the left side.
          </p>
        </section>
      ) : null}

      {stationEmpty ? (
        <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
          <p className="kicker text-ochre">Named police station</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <EmptyWell label="Left station" />
            <EmptyWell label="Median station" />
            <EmptyWell label="Right station" />
          </div>
          <p className="mt-4 max-w-2xl text-sm text-ink/75">
            No named police-station figure is in the books we have read. We do not divide a city or
            state total by the number of stations.
          </p>
        </section>
      ) : !left || left.tier !== "gold" ? (
        <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
          <p className="kicker text-ochre">Left side not ready</p>
          <p className="mt-2 text-sm text-ink/75">
            {left
              ? `${left.entity.name}: ${tierLabel(left.tier)}. ${left.note ?? "We have not read this book yet."}`
              : "Pick a state we have already read."}
          </p>
        </section>
      ) : useYear && useSeries ? (
        <>
          {right && right.tier !== "gold" ? (
            <p className="mt-6 max-w-2xl text-sm text-ink/70">
              {right.entity.name}’s official police book is not on this site yet. The middle number
              still uses the official books we have.
            </p>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
            <label className="block">
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
            <label className="block">
              Year
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
            <div className="flex flex-wrap items-end gap-3 sm:col-span-2">
              <button type="button" className="file-cta" onClick={copyLink}>
                <span className="file-cta-notch" aria-hidden="true" />
                Copy link
              </button>
              <button type="button" className="file-cta" onClick={downloadCsv}>
                <span className="file-cta-notch" aria-hidden="true" />
                CSV
              </button>
              <p role="status" className="col-span-2 text-sm">{copyStatus}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
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
                  {right ? right.entity.name : "Pick a second state"}
                </h2>
                <p className="mt-6 text-sm text-ink/60">
                  {right ? `${right.entity.name}’s official police book is not on this site yet.` : "No figure yet."}
                </p>
              </section>
            )}
          </div>

          <p className="mt-6 max-w-xl text-sm text-zinc">
            Three numbers. Not a ranking.
          </p>

          <ol className="mt-4 p-0">
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
              <p className="kicker text-ochre">Middle of the books</p>
              <p className="mt-2 text-sm text-ink/75">No official book printed this line.</p>
            </section>
          ) : null}
        </>
      ) : null}

      <section className="index-slip mt-10">
        <p className="kicker">How it works</p>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          The middle number is not a third government’s budget. It is the middle of the official
          books we have already read. A blank means that book did not print the line — not that it
          spent zero.
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
        <Link to="/sources">Method</Link>
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
        {cell ? (cell.thin ? `Not enough books yet · ${cell.n}` : `Middle of ${cell.n} states`) : "Middle"}
      </p>
      <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">
        {cell ? `Middle of ${cell.n} ${grainLabel(grain, layer)}` : "Middle of the books"}
      </h2>
      {cell ? (
        <>
          <div className="mt-4">
            <Money money={cell.money} size="hero" showSeries />
          </div>
          <p className="mt-3 text-sm text-ink/70">
            Middle value of {cell.n} official books
            {fieldLabel ? ` for ${fieldLabel.toLowerCase()}` : ""}.
            {cell.method === "mid-pair"
              ? ` When there are two in the middle, we average those two (${midNames}).`
              : null}
          </p>
          <p className="mt-2 text-sm text-ink/45">
            Simple average of those {cell.n}: ₹{formatCrore(cell.meanCrore)} crore
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
        The official books behind the middle number
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-ink/70">
        Sorted smallest to largest so the middle sits in the middle.
      </p>
      <p className="mt-3 flex flex-wrap gap-2 text-sm">
        {switcher.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`live-tag ${f.id === fieldId ? "text-rust" : "text-ink"}`}
            onClick={() => onField(f.id)}
          >
            {f.label}
          </button>
        ))}
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full max-w-3xl border-y border-ink/20 text-left text-sm">
          <caption className="sr-only">
            {field?.label} · median of {cell.n}
          </caption>
          <thead>
            <tr className="text-[0.7rem] uppercase tracking-[0.12em] text-ink/45">
              <th className="py-2 font-medium">Book</th>
              <th className="py-2 font-medium">Value</th>
              <th className="py-2 font-medium">Citation</th>
            </tr>
          </thead>
          <tbody>
            {cell.peers.map((p) => {
              const mark =
                cell.midSlugs.includes(p.slug) || p.slug === leftSlug || p.slug === rightSlug;
              return (
                <tr key={p.slug} className={mark ? "bg-ink/[0.04]" : undefined}>
                  <td className="py-2">
                    <Link to={p.href}>{p.label}</Link>
                    {cell.midSlugs.includes(p.slug) ? (
                      <span className="ml-2 text-sm text-ochre">middle</span>
                    ) : null}
                  </td>
                  <td className="py-2">
                    <span className="num">₹{formatCrore(p.money.crore)} crore</span>
                  </td>
                  <td className="py-2">
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
