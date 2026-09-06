import type { LineItem } from "../maharashtra-police";
import { fromCrore } from "../../lib/money";

const CITE = "union-sbe51-2026-27";
const CITE24 = "union-sbe51-2025-26";

/**
 * Delhi Police establishment (sbe51 item 5) + Police Infrastructure Delhi Police (14.02).
 * Not Demand 51 net. Not GNCTD AFS.
 */
export const delhiEstInfra: LineItem = {
  id: "delhi-est-infra",
  plainLabel: "Delhi Police (establishment + infrastructure)",
  officialName: "Demand 51 item 5 + item 14.02 Delhi Police",
  head: "union-51-delhi",
  amounts: [
    fromCrore(11400.81, "be", "2024-25", CITE24),
    fromCrore(12366.77, "actual", "2024-25", CITE),
    fromCrore(12259.16, "be", "2025-26", CITE),
    fromCrore(12568.21, "re", "2025-26", CITE),
    fromCrore(12846.15, "be", "2026-27", CITE),
  ],
};
