import type { ReactNode } from "react";
import type { LineItem, Money as Figure } from "../data/maharashtra-police";
import { formatCrore } from "../lib/money";
import { Money } from "./Money";
import { PrintedColumns } from "./PrintedColumns";
import { HeadSplit } from "./HeadSplit";

/** Shared presentation only. Each state supplies its own accounting scope and source lines. */
export function PoliceOverview({ name, description, hero, run, cap, runningLine, capitalLine, caption }: {
  name: string; description: ReactNode; hero: Figure; run: Figure; cap: Figure;
  runningLine: LineItem; capitalLine: LineItem; caption: string;
}) {
  return <>
    <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">{name} Police</h1>
    <p className="mt-4 max-w-2xl text-ink">{description}</p>
    <div className="mt-8 border-y border-ink/20 py-8">
      <div className="mt-3"><Money money={hero} size="hero" showSeries /></div>
      <p className="mt-4 max-w-xl text-sm text-ink/70">Running costs ₹{formatCrore(run.crore)} crore · Buildings and gear ₹{formatCrore(cap.crore)} crore.</p>
    </div>
    <PrintedColumns run={runningLine} cap={capitalLine} caption={caption} />
    <HeadSplit run={run} cap={cap} />
  </>;
}
