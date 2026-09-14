/**
 * Four homepage layers. Municipal has one city book (GHMC); Gram has one
 * state rural-development head (Telangana 2515 + 4515). Neither is an India total.
 * Never sum these four into one India figure.
 */
export type LayerId = "union" | "state" | "municipal" | "gram";

export const LAYERS: {
  id: LayerId;
  kicker: string;
  title: string;
  href: string;
  cta: string;
  empty: boolean;
}[] = [
  { id: "union", kicker: "Union", title: "Union Government", href: "/union", cta: "Open the Union ledger", empty: false },
  { id: "state", kicker: "State", title: "State Governments", href: "/states", cta: "Open the state index", empty: false },
  { id: "municipal", kicker: "Municipal", title: "Municipal Corporations", href: "/municipal", cta: "Open the city ledger", empty: false },
  { id: "gram", kicker: "Gram", title: "Gram Panchayats", href: "/gram", cta: "Open the village ledger", empty: false },
];
