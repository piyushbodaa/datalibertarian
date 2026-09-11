export type PriceCentre = "all-india" | "delhi";

export type PricePoint = {
  rupees: number;
  unit: string;
  asOf: string;
  centre: PriceCentre;
  citationId: string;
};

export type OfficialIndex = {
  period: string;
  yoyPct: number;
  index?: number;
  citationId: string;
  label: string;
};

export type InflationCategory =
  | "grains"
  | "pulses"
  | "oils"
  | "veg"
  | "dairy"
  | "sugar"
  | "fuel"
  | "other";

export type InflationItem = {
  id: string;
  plainLabel: string;
  officialName: string;
  category: InflationCategory;
  observed: PricePoint[];
  official?: OfficialIndex;
};
