import type { Money } from "../data/maharashtra-police";
import { formatMoneyShort } from "../lib/money";
import { CitationChip } from "./CitationChip";

export type TraceStop = {
  id: string;
  label: string;
  detail?: string;
  money?: Money;
  empty?: string;
};

export function TraceRail({
  stops,
  title = "Book stops here",
}: {
  stops: TraceStop[];
  title?: string;
}) {
  return (
    <section className="mt-10">
      <p className="kicker">Trace</p>
      <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-ink/70">
        Each stop is a printed grain, or a dashed EMPTY where the book does not print the next
        line. We do not invent a station share.
      </p>
      <ol className="mt-5 space-y-0 border-l-2 border-ink/15 pl-4 sm:pl-5">
        {stops.map((s) => (
          <li key={s.id} className="relative pb-5 last:pb-0">
            <span
              className={`absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-sm sm:-left-[1.6rem] ${
                s.empty ? "border border-dashed border-ochre bg-transparent" : "bg-rust"
              }`}
              aria-hidden="true"
            />
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink/50">
              {s.label}
            </p>
            {s.money ? (
              <p className="mt-1 text-sm">
                <span className="num">{formatMoneyShort(s.money)}</span>
                <CitationChip citationId={s.money.citationId} compact />
              </p>
            ) : null}
            {s.detail ? <p className="mt-1 max-w-2xl text-sm text-ink/70">{s.detail}</p> : null}
            {s.empty ? (
              <p className="mt-1 max-w-2xl text-sm text-ochre">{s.empty}</p>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
