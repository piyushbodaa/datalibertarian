import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CompareRow } from "../components/CompareRow";
import { Money } from "../components/Money";
import { CitationFootnote } from "../components/CitationChip";
import { SERIES_LABEL } from "../lib/money";
import type { LayerId } from "../data/layers";
import type { Series } from "../data/maharashtra-police";
import { tierLabel } from "../data/states";
import {
  compareRows,
  entitiesFor,
  getCompareEntity,
  hatchFor,
  intersectYears,
  isCrossLayer,
  resolveSide,
  suggestedPairs,
} from "../data/compare/resolve";
import { SERIES_OPTIONS } from "../data/compare/fields";

const LAYERS: { id: LayerId; label: string }[] = [
  { id: "union", label: "Union" },
  { id: "state", label: "State" },
  { id: "municipal", label: "Municipal" },
  { id: "gram", label: "Gram" },
];

export function ComparePage() {
  const [params, setParams] = useSearchParams();
  const leftSlug = params.get("left") || "maharashtra";
  const rightSlug = params.get("right") || "";
  const series = (params.get("series") as Series) || "be";
  const year = params.get("year") || "2026-27";

  const left = resolveSide(leftSlug);
  const right = rightSlug ? resolveSide(rightSlug) : undefined;

  const intersection = useMemo(() => {
    if (!left || !right || left.tier !== "gold" || right.tier !== "gold") return [];
    return intersectYears(left, right);
  }, [left, right]);

  const yearOk = intersection.some((y) => y.fiscalYear === year && y.series === series);
  const fallback = intersection.find((y) => y.series === series) ?? intersection[0];
  const useYear = yearOk ? year : fallback?.fiscalYear;
  const useSeries = yearOk ? series : fallback?.series;

  const rows =
    left && right && left.tier === "gold" && right.tier === "gold" && useYear && useSeries
      ? compareRows(left, right, useYear, useSeries)
      : [];

  const heroField = rows.find((r) => r.field.id === "police-functional") ?? rows[0];
  const cross = left && right ? isCrossLayer(left, right) : false;

  function set(next: Record<string, string | undefined>) {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (!v) p.delete(k);
      else p.set(k, v);
    }
    setParams(p, { replace: true });
  }

  function copyLink() {
    void navigator.clipboard.writeText(window.location.href);
  }

  function downloadCsv() {
    if (!left || !right || !useYear || !useSeries) return;
    const header = ["field", "left", "left_crore", "left_cite", "right", "right_crore", "right_cite", "year", "series"];
    const lines = rows.map((r) =>
      [
        r.field.id,
        left.entity.slug,
        r.left?.crore ?? "",
        r.left?.citationId ?? "",
        right.entity.slug,
        r.right?.crore ?? "",
        r.right?.citationId ?? "",
        useYear,
        useSeries,
      ].join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `compare-${left.entity.slug}-${right.entity.slug}.csv`;
    a.click();
  }

  const citeIds = [
    ...new Set(rows.flatMap((r) => [r.left?.citationId, r.right?.citationId].filter(Boolean) as string[])),
  ];

  return (
    <article>
      <p className="kicker">Compare · cited rupees</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Two books. Same kind of line.</h1>
      <p className="mt-3 max-w-2xl text-ink">
        Pick two governments in the same layer. We print what both books printed. Blanks stay blank.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Picker
          label="Left book"
          slug={leftSlug}
          onLayer={(layer) => {
            const first = entitiesFor(layer)[0];
            set({ left: first?.slug, year: undefined });
          }}
          onEntity={(slug) => set({ left: slug })}
        />
        <Picker
          label="Right book"
          slug={rightSlug}
          allowEmpty
          onLayer={(layer) => {
            const first = entitiesFor(layer)[0];
            set({ right: first?.slug, year: undefined });
          }}
          onEntity={(slug) => set({ right: slug })}
        />
      </div>

      <p className="mt-4 flex flex-wrap gap-2 text-sm">
        {suggestedPairs().map(([a, b]) => (
          <button
            key={`${a}-${b}`}
            type="button"
            className="live-tag text-ink"
            onClick={() => set({ left: a, right: b, series: "be", year: "2026-27" })}
          >
            {getCompareEntity(a)?.name} / {getCompareEntity(b)?.name}
          </button>
        ))}
      </p>

      {cross ? (
        <section className="carbon-sheet mt-8 px-4 py-5 sm:px-6">
          <p className="kicker text-ochre">Different books — not a like-for-like</p>
          <p className="mt-2 max-w-2xl text-sm text-ink/75">
            These two ledgers are not the same layer. This is a teaching pair, not a ranking of
            governments.
          </p>
        </section>
      ) : null}

      {!right ? (
        <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
          <p className="kicker text-ochre">Pick a second book</p>
          <p className="mt-2 text-sm text-ink/75">Pick two GOLD books in the same layer.</p>
        </section>
      ) : left && right && (left.tier !== "gold" || right.tier !== "gold") ? (
        <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
          <p className="kicker text-ochre">Not GOLD on both sides</p>
          <p className="mt-2 max-w-2xl text-sm text-ink/75">
            {left.tier !== "gold" ? `${left.entity.name}: ${tierLabel(left.tier)}. ${left.note ?? ""}` : null}{" "}
            {right.tier !== "gold" ? `${right.entity.name}: ${tierLabel(right.tier)}. ${right.note ?? ""}` : null}{" "}
            INDEX envelopes are not compare fodder.
          </p>
          <div className="mt-6 border border-dashed border-ink/25 px-3 py-8 text-center text-[0.7rem] uppercase tracking-[0.16em] text-ink/40">
            No hatch · no guessed rupee
          </div>
        </section>
      ) : intersection.length === 0 && right ? (
        <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
          <p className="kicker text-ochre">No shared year-column</p>
          <p className="mt-2 text-sm text-ink/75">
            These two books have no overlapping printed series. We do not pick a year from thin air.
          </p>
        </section>
      ) : left && right && useYear && useSeries ? (
        <>
          <div className="mt-8 flex flex-wrap gap-4 text-sm">
            <label>
              Series{" "}
              <select
                className="ml-1 border border-ink/20 bg-paper px-2 py-1"
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
            <label>
              Year{" "}
              <select
                className="ml-1 border border-ink/20 bg-paper px-2 py-1"
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
            <button type="button" className="file-cta" onClick={copyLink}>
              <span className="file-cta-notch" aria-hidden="true" />
              Copy link
            </button>
            <button type="button" className="file-cta" onClick={downloadCsv}>
              <span className="file-cta-notch" aria-hidden="true" />
              CSV
            </button>
          </div>

          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <Hero side={left} money={heroField?.left} />
            <Hero side={right} money={heroField?.right} />
          </div>

          <p className="mt-6 max-w-xl text-sm text-zinc">
            Two books. Two citations. Not one ranking of governments. Bars on a row are scaled to
            that row’s larger printed figure — not to one India-total.
          </p>

          <ol className="mt-4 p-0">
            {rows.map((r) => (
              <CompareRow
                key={r.field.id}
                field={r.field}
                left={r.left}
                right={r.right}
                leftHatch={hatchFor(left.entity.layer)}
                rightHatch={hatchFor(right.entity.layer)}
              />
            ))}
          </ol>
        </>
      ) : null}

      <section className="index-slip mt-10">
        <p className="kicker">How it works</p>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">
          Compiled from official budget PDFs typed by hand. A missing row means the book did not
          print that line on this machine, not that the government spent zero. We only compare lines
          both books printed, or we show a blank when one book is silent. INDEX envelopes are not
          used in this compare. We do not scale by population.
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
        <Link to="/search">Search typed heads</Link>
      </p>
    </article>
  );
}

function Hero({
  side,
  money,
}: {
  side: NonNullable<ReturnType<typeof resolveSide>>;
  money?: { crore: number; rupees: number; series: Series; fiscalYear: string; citationId: string };
}) {
  return (
    <section className="docket-door">
      <p className="kicker">{side.entity.layer}</p>
      <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">{side.entity.name}</h2>
      <p className="mt-1 text-[0.7rem] uppercase tracking-[0.14em] text-zinc">{tierLabel(side.tier)}</p>
      {money ? (
        <div className="mt-4">
          <Money money={money} size="hero" showSeries />
        </div>
      ) : (
        <div className="mt-6 border border-dashed border-ink/25 px-3 py-8 text-center text-[0.7rem] uppercase tracking-[0.16em] text-ink/40">
          No hatch · no guessed rupee
        </div>
      )}
      <p className="mt-3 text-sm">
        <Link to={side.entity.href}>Open the ledger</Link>
        {" · "}
        <Link to={`/trace/${side.entity.layer}/${side.entity.slug}`}>Trace this book</Link>
      </p>
    </section>
  );
}

function Picker({
  label,
  slug,
  allowEmpty,
  onLayer,
  onEntity,
}: {
  label: string;
  slug: string;
  allowEmpty?: boolean;
  onLayer: (layer: LayerId) => void;
  onEntity: (slug: string) => void;
}) {
  const entity = slug ? getCompareEntity(slug) : undefined;
  const layer = entity?.layer ?? "state";
  const options = entitiesFor(layer);
  return (
    <div className="docket-door">
      <p className="kicker">{label}</p>
      <div className="mt-3 flex flex-col gap-2 text-sm">
        <label>
          Layer{" "}
          <select
            className="ml-1 border border-ink/20 bg-paper px-2 py-1"
            value={layer}
            onChange={(e) => onLayer(e.target.value as LayerId)}
          >
            {LAYERS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Book{" "}
          <select
            className="ml-1 border border-ink/20 bg-paper px-2 py-1"
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
