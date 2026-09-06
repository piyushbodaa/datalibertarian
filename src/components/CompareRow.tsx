import type { Money } from "../data/maharashtra-police";
import type { CompareField } from "../data/compare/fields";
import { formatCrore, formatMoneyShort } from "../lib/money";
import { CitationChip } from "./CitationChip";

export function CompareRow({
  field,
  left,
  right,
  leftHatch,
  rightHatch,
}: {
  field: CompareField;
  left?: Money;
  right?: Money;
  leftHatch: string;
  rightHatch: string;
}) {
  const max = Math.max(left?.crore ?? 0, right?.crore ?? 0, 0.01);
  const diff = left && right ? left.crore - right.crore : undefined;

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
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <Bar money={left} hatch={leftHatch} max={max} />
        <Bar money={right} hatch={rightHatch} max={max} />
      </div>
      <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <div>
          <dt className="inline text-ink/55">Left · </dt>
          <dd className="inline">
            {left ? (
              <>
                <span className="num">₹{formatCrore(left.crore)} crore</span>
                <CitationChip citationId={left.citationId} compact />
              </>
            ) : (
              <span className="text-ink/45">— not printed in this book</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="inline text-ink/55">Right · </dt>
          <dd className="inline">
            {right ? (
              <>
                <span className="num">₹{formatCrore(right.crore)} crore</span>
                <CitationChip citationId={right.citationId} compact />
              </>
            ) : (
              <span className="text-ink/45">— not printed in this book</span>
            )}
          </dd>
        </div>
        {diff !== undefined ? (
          <div>
            <dt className="inline text-ink/55">Left − right · </dt>
            <dd className="inline num">
              {diff >= 0 ? "+" : "−"}₹{formatCrore(Math.abs(diff))} crore
            </dd>
          </div>
        ) : null}
      </dl>
    </li>
  );
}

function Bar({ money, hatch, max }: { money?: Money; hatch: string; max: number }) {
  if (!money) {
    return (
      <div className="h-5 w-full border border-dashed border-ink/25 bg-ink/[0.03]" aria-hidden="true" />
    );
  }
  const width = (money.crore / max) * 100;
  return (
    <div
      className="h-5 w-full bg-ink/[0.05]"
      role="img"
      aria-label={`${formatMoneyShort(money)}`}
    >
      <div className={`${hatch} h-5 border border-carbon/40`} style={{ width: `${width}%` }} />
    </div>
  );
}
