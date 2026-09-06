import type { LineItem } from "../maharashtra-police";
import { fromCrore } from "../../lib/money";

const CITE = "wb-demand68-2026-27";

export const wb2055Net: LineItem = {
  id: "wb-2055-net",
  plainLabel: "Police running costs (2055 net)",
  officialName: "Demand 68 — 2055 Police Net",
  head: "2055",
  amounts: [fromCrore(13806.68, "be", "2026-27", CITE)],
};

export const wb2055Gross: LineItem = {
  id: "wb-2055-gross",
  plainLabel: "Police running costs (2055 gross)",
  officialName: "Demand 68 — 2055 Police Gross",
  head: "2055",
  amounts: [fromCrore(13806.83, "be", "2026-27", CITE)],
};

export const wb4055: LineItem = {
  id: "wb-4055",
  plainLabel: "Police capital (4055)",
  officialName: "Demand 68 — 4055 Capital Outlay on Police",
  head: "4055",
  amounts: [fromCrore(471.57, "be", "2026-27", CITE)],
};

export const wbFunctional: LineItem = {
  id: "wb-functional",
  plainLabel: "West Bengal Police (2055 net + 4055)",
  officialName: "Demand 68 slices — 2055 Net + 4055 (not whole Home & Hill Affairs)",
  head: "total",
  amounts: [fromCrore(13806.68 + 471.57, "be", "2026-27", CITE)],
};

export const wbSalariesDesk: LineItem = {
  id: "wb-2055-01-desk",
  plainLabel: "2055 object 01 salaries (desk-sum)",
  officialName: "2055-01 Salaries — desk-sum",
  head: "2055",
  amounts: [fromCrore(10763.83, "be", "2026-27", CITE)],
};

export const wbArms: LineItem = {
  id: "wb-22-arms",
  plainLabel: "Arms (object 22)",
  officialName: "Object 22",
  head: "2055",
  amounts: [fromCrore(81.54, "be", "2026-27", CITE)],
};

export const wbClothing: LineItem = {
  id: "wb-25-clothing",
  plainLabel: "Clothing (object 25)",
  officialName: "Object 25",
  head: "2055",
  amounts: [fromCrore(1.65, "be", "2026-27", CITE)],
};
