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
      <div className="ledger-scroll">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-ink/20 bg-shade">
              <th className="sticky left-0 bg-shade px-3 py-2.5 font-sans font-semibold">Line</th>
              {COLS.map((c) => (
                <th
                  key={`${c.fiscalYear}-${c.series}`}
                  className={`px-3 py-2.5 text-right font-sans font-semibold ${
                    c.fiscalYear === "2026-27" ? "bg-ink/[0.04]" : ""
                  }`}
                >
                  <span className="block">{SERIES_LABEL[c.series]}</span>
                  <span className="block text-[0.7rem] font-normal text-ink/55">{c.fiscalYear}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-ink/10">
                <th className="sticky left-0 bg-paper px-3 py-2.5 font-sans font-normal">
                  {item.plainLabel}
                </th>
                {COLS.map((c) => {
                  const m = pickAmount(item, c.fiscalYear, c.series);
                  return (
                    <td
                      key={`${item.id}-${c.fiscalYear}-${c.series}`}
                      className={`px-3 py-2.5 text-right ${c.fiscalYear === "2026-27" ? "bg-ink/[0.03]" : ""}`}
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
      <p className="mt-2 text-xs text-ink/50 sm:hidden">Swipe sideways to read later years.</p>
    </div>
  );
}
