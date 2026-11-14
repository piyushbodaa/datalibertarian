import type { Money } from "../data/maharashtra-police";
import type { CompareField } from "../data/compare/fields";
import type { MedianCell } from "../data/compare/median";
import { formatCrore, formatMoneyShort } from "../lib/money";
import { CitationChip } from "./CitationChip";

export function CompareRow({
  field,
  left,
  mid,
  right,
}: {
  field: CompareField;
  left?: Money;
  mid?: MedianCell | null;
  right?: Money;
}) {
  const max = Math.max(left?.crore ?? 0, mid?.money.crore ?? 0, right?.crore ?? 0, 0.01);
  const leftVsMid = left && mid ? left.crore - mid.money.crore : undefined;
  const rightVsMid = right && mid ? right.crore - mid.money.crore : undefined;

  return (
    <li className="carbon-sheet mb-3 list-none p-4">
      <p className="text-sm font-semibold text-ink">{field.label}</p>
      <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Bar money={left} hatch="hatch-rust" max={max} />
        <Bar money={mid?.money} hatch="hatch-ochre" max={max} empty={!mid} />
        <Bar money={right} hatch="hatch-carbon" max={max} />
      </div>
      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
        <Cell label="Left" money={left} />
        <Cell label={mid ? `Peer median (${mid.n})` : "Peer median"} money={mid?.money} blank={mid ? undefined : "not reported in peer books"} />
        <Cell label="Right" money={right} />
        {leftVsMid !== undefined ? (
          <div>
            <dt className="inline text-ink/55">Left − median · </dt>
            <dd className="inline num font-medium">
              {leftVsMid >= 0 ? "+" : "−"}₹{formatCrore(Math.abs(leftVsMid))} crore
            </dd>
          </div>
        ) : null}
        {rightVsMid !== undefined ? (
          <div>
            <dt className="inline text-ink/55">Right − median · </dt>
            <dd className="inline num font-medium">
              {rightVsMid >= 0 ? "+" : "−"}₹{formatCrore(Math.abs(rightVsMid))} crore
            </dd>
          </div>
        ) : null}
      </dl>
      {mid?.thin ? (
        <p className="mt-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ochre">
          Limited sample · {mid.n} {mid.n === 1 ? "book" : "books"}
        </p>
      ) : null}
    </li>
  );
}

function Cell({
  label,
  money,
  blank,
}: {
  label: string;
  money?: Money;
  blank?: string;
}) {
  return (
    <div>
      <dt className="inline text-ink/60">{label} · </dt>
      <dd className="inline">
        {money ? (
          <>
            <span className="num font-medium">₹{formatCrore(money.crore)} crore</span>
            <CitationChip citationId={money.citationId} compact />
          </>
        ) : (
          <span className="text-ink/50">— {blank ?? "not available in this book"}</span>
        )}
      </dd>
    </div>
  );
}

function Bar({
  money,
  hatch,
  max,
  empty,
}: {
  money?: Money;
  hatch: string;
  max: number;
  empty?: boolean;
}) {
  if (!money || empty) {
    return (
      <div className="h-2.5 w-full rounded bg-slate-100 border border-dashed border-slate-300" aria-hidden="true" />
    );
  }
  const width = (money.crore / max) * 100;
  return (
    <div className="h-2.5 w-full overflow-hidden rounded bg-slate-100" role="img" aria-label={formatMoneyShort(money)}>
      <div className={`${hatch} h-2.5 rounded`} style={{ width: `${width}%` }} />
    </div>
  );
}
