import type { PoliceTier } from "./states";

/**
 * Budget heads the site reads per state. Police was first; Health is the second.
 * A state's tier for a head is "empty" unless typed from its book.
 */
export type HeadId = "police" | "health";

export type Head = {
  id: HeadId;
  label: string;
  /** Major heads that make the functional total. */
  majorHeads: string[];
  runLabel: string;
  capLabel: string;
  notIncluded: string;
};

export const HEADS: Head[] = [
  {
    id: "police",
    label: "Police",
    majorHeads: ["2055", "4055"],
    runLabel: "Running costs",
    capLabel: "Buildings and gear",
    notIncluded: "Not jails, not courts, not the vigilance office.",
  },
  {
    id: "health",
    label: "Health",
    majorHeads: ["2210", "2211", "4210", "4211"],
    runLabel: "Running hospitals",
    capLabel: "Hospital buildings and gear",
    notIncluded: "Not water supply, not nutrition, not medical education under other heads.",
  },
];

export function getHead(id: string): Head | undefined {
  return HEADS.find((h) => h.id === id);
}

/** Tier for a head beyond police. */
export function headTier(heads: Partial<Record<HeadId, PoliceTier>> | undefined, head: HeadId): PoliceTier {
  if (head === "police") throw new Error("Use Jurisdiction.tier for police");
  return heads?.[head] ?? "empty";
}
