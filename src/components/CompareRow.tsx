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
    <li className="border-b border-ink/15 py-4">
      <p className="text-sm font-medium">
        {field.label}
        {field.notPoliceOnly ? (
          <span className="ml-2 text-[0.65rem] uppercase tracking-[0.12em] text-ochre">
            not police-only
          </span>
        ) : null}
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Bar money={left} hatch="hatch-rust" max={max} />
        <Bar money={mid?.money} hatch="hatch-ochre" max={max} empty={!mid} />
        <Bar money={right} hatch="hatch-carbon" max={max} />
      </div>
      <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <Cell label="Left" money={left} />
        <Cell label={mid ? `Median of ${mid.n}` : "Median"} money={mid?.money} blank={mid ? undefined : "no GOLD peer printed this line"} />
        <Cell label="Right" money={right} />
        {leftVsMid !== undefined ? (
          <div>
            <dt className="inline text-ink/55">Left − median · </dt>
            <dd className="inline num">
              {leftVsMid >= 0 ? "+" : "−"}₹{formatCrore(Math.abs(leftVsMid))} crore
            </dd>
          </div>
        ) : null}
        {rightVsMid !== undefined ? (
          <div>
            <dt className="inline text-ink/55">Right − median · </dt>
            <dd className="inline num">
              {rightVsMid >= 0 ? "+" : "−"}₹{formatCrore(Math.abs(rightVsMid))} crore
            </dd>
          </div>
        ) : null}
      </dl>
      {mid?.thin ? (
        <p className="mt-1 text-[0.7rem] uppercase tracking-[0.12em] text-ochre">
          Thin peer set · N = {mid.n}
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
      <dt className="inline text-ink/55">{label} · </dt>
      <dd className="inline">
        {money ? (
          <>
            <span className="num">₹{formatCrore(money.crore)} crore</span>
            <CitationChip citationId={money.citationId} compact />
          </>
        ) : (
          <span className="text-ink/45">— {blank ?? "not printed in this book"}</span>
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
      <div className="h-5 w-full border border-dashed border-ink/25 bg-ink/[0.03]" aria-hidden="true" />
    );
  }
  const width = (money.crore / max) * 100;
  return (
    <div className="h-5 w-full bg-ink/[0.05]" role="img" aria-label={formatMoneyShort(money)}>
      <div className={`${hatch} h-5 border border-carbon/40`} style={{ width: `${width}%` }} />
    </div>
  );
}
