import type { LineItem, Series } from "../data/maharashtra-police";
import { pickAmount } from "../data/maharashtra-police";
import { formatCrore, SERIES_LABEL } from "../lib/money";
import { CitationChip } from "./CitationChip";

const COLS: { fiscalYear: string; series: Series }[] = [
  { fiscalYear: "2026-27", series: "be" },
  { fiscalYear: "2025-26", series: "re" },
  { fiscalYear: "2025-26", series: "be" },
  { fiscalYear: "2024-25", series: "actual" },
];

type Props = {
  items: LineItem[];
  caption: string;
};

export function LedgerTable({ items, caption }: Props) {
  return (
    <div>
      <p className="mb-3 max-w-xl text-sm text-ink/70">{caption}</p>
      <div className="overflow-x-auto border border-ink/20 md:hidden">
        <table className="w-full min-w-[22rem] border-collapse text-left text-[0.7rem]">
          <thead>
            <tr className="border-b-2 border-tyrian">
              <th className="px-2 py-2 font-sans">Line</th>
              {COLS.map((c) => (
                <th key={`m-${c.fiscalYear}-${c.series}`} className="px-1 py-2 text-right font-sans font-semibold">
                  {SERIES_LABEL[c.series]}
                  <span className="block font-normal text-ink/50">{c.fiscalYear}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`m-${item.id}`} className="border-b border-ink/15">
                <th className="px-2 py-2 font-sans font-normal">{item.plainLabel}</th>
                {COLS.map((c) => {
                  const m = pickAmount(item, c.fiscalYear, c.series);
                  return (
                    <td key={`m-${item.id}-${c.fiscalYear}-${c.series}`} className="px-1 py-2 text-right">
                      {m ? (
                        <span className="num">
                          {formatCrore(m.crore)}
                          <CitationChip citationId={m.citationId} compact />
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="hidden overflow-x-auto border border-ink/20 md:block">
        <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-tyrian bg-ink/[0.03]">
              <th className="sticky left-0 bg-paper px-3 py-2 font-sans font-semibold">Line</th>
              {COLS.map((c) => (
                <th
                  key={`${c.fiscalYear}-${c.series}`}
                  className={`px-3 py-2 text-right font-sans font-semibold ${c.fiscalYear === "2026-27" ? "bg-khaki/20" : ""}`}
                >
                  <span className="block">{SERIES_LABEL[c.series]}</span>
                  <span className="block text-[0.7rem] font-normal uppercase tracking-wide text-ink/55">
                    FY {c.fiscalYear}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-ink/15">
                <th className="sticky left-0 bg-inherit px-3 py-2 font-sans font-normal">
                  <span className="block">{item.plainLabel}</span>
                  <span className="block text-[0.7rem] uppercase tracking-wide text-ink/50">
                    {item.officialName}
                  </span>
                </th>
                {COLS.map((c) => {
                  const m = pickAmount(item, c.fiscalYear, c.series);
                  return (
                    <td
                      key={`${item.id}-${c.fiscalYear}-${c.series}`}
                      className={`px-3 py-2 text-right ${c.fiscalYear === "2026-27" ? "bg-khaki/15" : ""}`}
                    >
                      {m ? (
                        <>
                          <span className="num">₹{formatCrore(m.crore)}</span>
                          <CitationChip citationId={m.citationId} compact />
                        </>
                      ) : (
                        <span className="text-ink/40">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
