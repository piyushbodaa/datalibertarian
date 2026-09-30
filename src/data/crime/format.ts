export function inr(n: number): string {
  return new Intl.NumberFormat("en-IN").format(n);
}

export function rate(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** Cases divided by the Bureau's mid-year population, which is stored in lakh. */
export function perLakhPeople(cases: number, populationLakh: number): number {
  return Math.round((cases / populationLakh) * 10) / 10;
}

export function rankBy<T>(rows: readonly T[], value: (row: T) => number, n = 3): T[] {
  return [...rows].sort((a, b) => value(b) - value(a)).slice(0, n);
}

export function placeLabel(name: string, parent: string | null): string {
  return parent ? `${name}, ${parent}` : name;
}

/** One decimal share, from two figures the Bureau printed. */
export function sharePercent(part: number, whole: number): number {
  return Math.round((part / whole) * 1000) / 10;
}
