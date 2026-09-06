import type { LineItem, Money, Series } from "../maharashtra-police";

const CITE = "kl-afs-2026-27";

/** AFS 2026-27: Accounts 2024-25 printed in rupees; estimates in thousands. */
function fromRupees(rupees: number, series: Series, fiscalYear: string): Money {
  return {
    crore: rupees / 10_000_000,
    rupees,
    series,
    fiscalYear,
    citationId: CITE,
  };
}

function fromThousands(thousands: number, series: Series, fiscalYear: string): Money {
  const rupees = thousands * 1000;
  return {
    crore: rupees / 10_000_000,
    rupees,
    series,
    fiscalYear,
    citationId: CITE,
  };
}

function four(actualRupees: number, be25k: number, re25k: number, be26k: number): Money[] {
  return [
    fromRupees(actualRupees, "actual", "2024-25"),
    fromThousands(be25k, "be", "2025-26"),
    fromThousands(re25k, "re", "2025-26"),
    fromThousands(be26k, "be", "2026-27"),
  ];
}

/** Statement B — 2055 Police Demand XII total (voted + charged). Not jails 2056, not vigilance 2062. */
export const kl2055: LineItem = {
  id: "kl-2055",
  plainLabel: "Running costs",
  officialName: "2055 Police — AFS Statement B, Demand XII (accounts in rupees; estimates in thousands)",
  head: "2055",
  amounts: four(45_097_484_486, 50_446_702, 50_847_679, 65_795_289),
};

/** Statement C — 4055 Capital Outlay on Police, Demand XII. */
export const kl4055: LineItem = {
  id: "kl-4055",
  plainLabel: "Buildings and gear",
  officialName: "4055 Capital Outlay on Police — AFS Statement C, Demand XII",
  head: "4055",
  amounts: four(378_206_415, 534_899, 1_025_107, 546_000),
};

export const klFunctional: LineItem = {
  id: "kl-functional",
  plainLabel: "Kerala Police spending",
  officialName: "2055 Police + 4055 Capital Outlay on Police (AFS Demand XII slices)",
  head: "total",
  amounts: kl2055.amounts.map((m, i) => {
    const cap = kl4055.amounts[i];
    return {
      crore: m.crore + cap.crore,
      rupees: m.rupees + cap.rupees,
      series: m.series,
      fiscalYear: m.fiscalYear,
      citationId: CITE,
    };
  }),
};

export const KL_HEADLINE_YEAR = "2026-27";
export const KL_HEADLINE_SERIES: Series = "be";
