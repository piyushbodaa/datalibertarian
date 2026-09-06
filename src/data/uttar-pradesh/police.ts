import type { LineItem } from "../maharashtra-police";
import { fromCrore } from "../../lib/money";

const CITE = "up-grant26-2026-27";

/** 2055 voted printed BE 2026-27 — Grant 26. Not a desk-sum. */
export const up2055Voted: LineItem = {
  id: "up-2055-voted",
  plainLabel: "Police running costs (2055, voted, printed)",
  officialName: "2055 Police — voted printed total, Grant 26",
  head: "2055",
  amounts: [fromCrore(37880.58, "be", "2026-27", CITE)],
};

export const up4055: LineItem = {
  id: "up-4055",
  plainLabel: "Police capital (4055, printed योग)",
  officialName: "4055 Capital Outlay on Police — printed योग, Grant 26",
  head: "4055",
  amounts: [fromCrore(4052.29, "be", "2026-27", CITE)],
};

export const upFunctional: LineItem = {
  id: "up-functional",
  plainLabel: "Uttar Pradesh Police (2055 voted + 4055 printed)",
  officialName: "Grant 26 Home (Police) — 2055 voted printed + 4055 printed योग",
  head: "total",
  amounts: [fromCrore(37880.58 + 4052.29, "be", "2026-27", CITE)],
};

/** Desk-sum of object 01 वेतन — not the 2055 printed total. */
export const upSalariesDesk: LineItem = {
  id: "up-2055-01-desk",
  plainLabel: "2055 object 01 salaries (desk-sum)",
  officialName: "2055-01 वेतन — desk-sum of printed object lines",
  head: "2055",
  amounts: [fromCrore(18570.02, "be", "2026-27", CITE)],
};

export const upUniforms: LineItem = {
  id: "up-51-uniform",
  plainLabel: "Uniforms (object 51 वर्दी)",
  officialName: "Object 51 वर्दी",
  head: "2055",
  amounts: [fromCrore(42.03, "be", "2026-27", CITE)],
};
