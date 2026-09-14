import type { LineItem, Series } from "../maharashtra-police";
import type { PoliceTier } from "../states";
import { LAYERS, type LayerId } from "../layers";

export type CompareFieldId =
  | "total-exp"
  | "police-functional"
  | "2055"
  | "4055"
  | "obj-01"
  | "obj-13"
  | "109"
  | "108"
  | "115"
  | "mixed-grant"
  | "civic-total"
  | "civic-revenue"
  | "civic-capital"
  | "2515"
  | "4515"
  | "health-functional"
  | "health-run"
  | "health-cap";

export type CompareField = {
  id: CompareFieldId;
  label: string;
  layer: LayerId | "any";
  notPoliceOnly?: boolean;
};

export const COMPARE_FIELDS: CompareField[] = [
  { id: "total-exp", label: "Whole budget", layer: "any" },
  { id: "police-functional", label: "Police", layer: "any" },
  { id: "2055", label: "Running costs", layer: "any" },
  { id: "4055", label: "Buildings and gear", layer: "any" },
  { id: "obj-01", label: "Salaries", layer: "any" },
  { id: "obj-13", label: "Office expenses", layer: "any" },
  { id: "109", label: "District police", layer: "state" },
  { id: "108", label: "Headquarters", layer: "state" },
  { id: "115", label: "Modernisation", layer: "state" },
  { id: "mixed-grant", label: "Home grant (not only police)", layer: "any", notPoliceOnly: true },
  { id: "health-functional", label: "Health", layer: "state" },
  { id: "health-run", label: "Running hospitals", layer: "state" },
  { id: "health-cap", label: "Hospital buildings and gear", layer: "state" },
  { id: "civic-total", label: "City total", layer: "municipal" },
  { id: "civic-revenue", label: "Running the city", layer: "municipal" },
  { id: "civic-capital", label: "Building the city", layer: "municipal" },
  { id: "2515", label: "Village programmes (running)", layer: "gram" },
  { id: "4515", label: "Village works", layer: "gram" },
];

export type CompareGrain = "layer" | "city" | "station";

export type CompareEntity = {
  slug: string;
  name: string;
  layer: LayerId;
  href: string;
  /** city = commissionerate HoD; station = named PS. Default is layer book. */
  grain?: CompareGrain;
};

export type CompareSide = {
  entity: CompareEntity;
  tier: PoliceTier;
  bag: Partial<Record<CompareFieldId, LineItem>>;
  note?: string;
};

export const SERIES_OPTIONS: Series[] = ["actual", "be", "re"];

export { LAYERS };
