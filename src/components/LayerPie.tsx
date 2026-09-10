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

export function LayerPie({
  slices,
  title = "Spend in the books we have read",
  note = "Two books. They are not added into one India total. Empty is not zero.",
}: Props) {
  const citationId = slices.find((s) => s.money)?.money?.citationId;

  return (
    <figure className="mt-8">
      <ChartCaption title={title}>
        {note}
        {citationId ? <CitationChip citationId={citationId} compact /> : null}
      </ChartCaption>
      <ul className="m-0 grid max-w-3xl gap-3 p-0 sm:grid-cols-2">
        {slices.map((s) => (
          <li key={s.id} className={`docket-door layer-${s.id === "union" ? "union" : s.id === "state" ? "state" : s.id === "city" ? "municipal" : "gram"} ${s.money ? "" : "empty"}`}>
            <p className="text-sm font-medium">{s.label}</p>
            {s.money ? (
              <p className="num mt-2 text-lg">₹{formatCrore(s.money.crore)} crore</p>
            ) : (
              <p className="mt-2 text-sm text-ink/55">{s.empty ?? "No figure yet."}</p>
            )}
          </li>
        ))}
      </ul>
    </figure>
  );
}
