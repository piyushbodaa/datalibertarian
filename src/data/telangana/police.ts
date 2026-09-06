import type { LineItem } from "../maharashtra-police";
import { fromCrore } from "../../lib/money";

const CITE = "tg-law-home-2026-27";

/** Statewide object 010 — desk-sum. Not Demand X Home. */
export const tgObject010: LineItem = {
  id: "tg-010",
  plainLabel: "Police pay (added from printed lines)",
  officialName: "Law & Home — Police object 010 Total (desk-sum)",
  head: "010",
  amounts: [
    fromCrore(7252.86, "be", "2025-26", CITE),
    fromCrore(8852.93, "be", "2026-27", CITE),
  ],
};

export const tgArms220: LineItem = {
  id: "tg-220",
  plainLabel: "Arms",
  officialName: "Police object 220",
  head: "220",
  amounts: [fromCrore(24.53, "be", "2026-27", CITE)],
};

/** City Police capital — not statewide Police total. */
export const tgCity4055: LineItem = {
  id: "tg-city-4055",
  plainLabel: "City police buildings (city only)",
  officialName: "City Police 4055",
  head: "4055",
  amounts: [fromCrore(132.25, "be", "2026-27", CITE)],
};
