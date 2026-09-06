import { getCitation } from "../data/sources";

type Props = {
  citationId: string;
  compact?: boolean;
};

export function CitationChip({ citationId, compact }: Props) {
  const c = getCitation(citationId);
  const short =
    citationId === "mh-home-whitebook-2026-27"
      ? "Home White Book"
      : citationId === "mh-pink-book-2026-27"
        ? "Budget in Brief"
        : citationId === "union-sbe51-2026-27"
          ? "Demand 51 PDF"
          : citationId === "union-sumsbe-2026-27"
            ? "SBE summary"
            : "Appropriation Act";

  return (
    <a
      href={`#cite-${c.id}`}
      className="citation-chip ml-1 inline-flex items-baseline gap-0.5 align-super text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-rust no-underline hover:text-ochre"
      title={`${c.title}${c.pages ? ` — p. ${c.pages}` : ""}`}
    >
      <span aria-hidden="true">†</span>
      {compact ? null : (
        <span>
          {short} {c.fiscalYear}
        </span>
      )}
      <span className="sr-only">
        Source: {c.title}, {c.publisher}, FY {c.fiscalYear}
        {c.pages ? `, ${c.pages}` : ""}
      </span>
    </a>
  );
}

export function CitationFootnote({ citationId }: { citationId: string }) {
  const c = getCitation(citationId);
  return (
    <li id={`cite-${c.id}`} className="scroll-mt-24">
      <p className="font-medium text-ink">
        {c.title}
        {c.table ? ` — ${c.table}` : ""}
      </p>
      <p className="text-ink/70">
        {c.publisher}. Fiscal year {c.fiscalYear}
        {c.pages ? `. ${c.pages}` : ""}. Extracted {c.accessedOn}.
      </p>
      <p>
        <a href={c.url} rel="noreferrer" target="_blank">
          Open the official document
        </a>
      </p>
      {c.notes ? <p className="text-ink/60">{c.notes}</p> : null}
    </li>
  );
}
