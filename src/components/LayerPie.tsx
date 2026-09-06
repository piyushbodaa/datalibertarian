import type { Money } from "../data/maharashtra-police";
import { formatCrore } from "../lib/money";
import { ChartCaption } from "./ChartCaption";
import { CitationChip } from "./CitationChip";

type Slice = {
  id: string;
  label: string;
  money?: Money;
  empty?: string;
  hatch: "rust" | "carbon" | "ochre" | "zinc";
};

type Props = {
  slices: Slice[];
  title?: string;
  note?: string;
};

const HATCH: Record<Slice["hatch"], { fill: string; pattern: string }> = {
  rust: { fill: "var(--rust)", pattern: "url(#pie-hatch-rust)" },
  carbon: { fill: "var(--carbon)", pattern: "url(#pie-hatch-carbon)" },
  ochre: { fill: "var(--ochre)", pattern: "url(#pie-hatch-ochre)" },
  zinc: { fill: "var(--zinc)", pattern: "url(#pie-hatch-zinc)" },
};

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSlice(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const large = a1 - a0 > 180 ? 1 : 0;
  const p0 = polar(cx, cy, r1, a0);
  const p1 = polar(cx, cy, r1, a1);
  const q0 = polar(cx, cy, r0, a0);
  const q1 = polar(cx, cy, r0, a1);
  return `M ${p0.x} ${p0.y} A ${r1} ${r1} 0 ${large} 1 ${p1.x} ${p1.y} L ${q1.x} ${q1.y} A ${r0} ${r0} 0 ${large} 0 ${q0.x} ${q0.y} Z`;
}

export function LayerPie({
  slices,
  title = "Spend in the books we have read",
  note = "Two books. They are not added into one India total. Empty is not zero.",
}: Props) {
  const filled = slices.filter((s) => s.money && s.money.crore > 0);
  const total = filled.reduce((n, s) => n + (s.money?.crore ?? 0), 0);
  const citationId = filled[0]?.money?.citationId;

  let cursor = 0;
  const arcs = filled.map((s) => {
    const share = ((s.money?.crore ?? 0) / total) * 360;
    const a0 = cursor;
    const a1 = cursor + Math.max(share, 0.8);
    cursor += share;
    return { ...s, a0, a1, pct: ((s.money?.crore ?? 0) / total) * 100 };
  });

  return (
    <figure className="mt-8">
      <ChartCaption title={title}>
        {note}
        {citationId ? <CitationChip citationId={citationId} compact /> : null}
      </ChartCaption>
      <div className="grid max-w-3xl items-center gap-6 sm:grid-cols-[minmax(0,16rem)_1fr]">
        <svg viewBox="0 0 200 200" className="w-full max-w-[16rem] text-ink" role="img" aria-labelledby="layer-pie-title">
          <title id="layer-pie-title">{title}</title>
          <defs>
            <pattern id="pie-hatch-rust" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(90)">
              <line x1="0" y1="0" x2="0" y2="5" stroke="var(--rust)" strokeWidth="1.8" />
            </pattern>
            <pattern id="pie-hatch-carbon" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="7" stroke="var(--carbon)" strokeWidth="2" />
            </pattern>
            <pattern id="pie-hatch-ochre" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(-45)">
              <line x1="0" y1="0" x2="0" y2="7" stroke="var(--ochre)" strokeWidth="2" />
            </pattern>
            <pattern id="pie-hatch-zinc" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--zinc)" strokeWidth="1.2" />
            </pattern>
          </defs>
          {arcs.map((s) => {
            const skin = HATCH[s.hatch];
            return (
              <g key={s.id}>
                <path d={donutSlice(100, 100, 52, 92, s.a0, s.a1)} fill={skin.fill} fillOpacity="0.28" stroke={skin.fill} strokeWidth="1.2" />
                <path d={donutSlice(100, 100, 52, 92, s.a0, s.a1)} fill={skin.pattern} />
              </g>
            );
          })}
        </svg>
        <ul className="m-0 space-y-3 p-0 text-sm">
          {slices.map((s) => {
            const pct = s.money && total > 0 ? ((s.money.crore / total) * 100).toFixed(1) : null;
            return (
              <li key={s.id} className="flex flex-wrap items-baseline justify-between gap-2">
                <span>
                  <span className={`mr-2 inline-block h-3 w-3 border border-carbon/40 hatch-${s.hatch === "rust" ? "rust" : s.hatch === "ochre" ? "ochre" : s.hatch === "zinc" ? "zinc" : "carbon"}`} />
                  {s.label}
                </span>
                {s.money ? (
                  <span className="num">
                    {pct}% · ₹{formatCrore(s.money.crore)} crore
                    <CitationChip citationId={s.money.citationId} compact />
                  </span>
                ) : (
                  <span className="text-ink/50">{s.empty ?? "No figure yet."}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </figure>
  );
}
