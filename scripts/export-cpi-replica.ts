/** Export the full official basket and independent evidence without inventing an index. */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { auditReplicaCoverage, type IndexSector } from "../src/data/inflation/cpi-replica";

type Label = { code: string; name: string };
type BasketItem = Label & {
  id: string;
  kind: string;
  division: Label;
  group: Label;
  class: Label;
  subclass: Label;
  weights: Record<IndexSector, number>;
};
type OfficialRow = {
  code: string;
  sector: IndexSector;
  level: string;
  currentIndex: number | null;
  previousIndex: number | null;
  yoy: number | null;
  imputation: string | null;
};
type Quote = {
  id: string;
  itemCode: string;
  provider: string;
  productName: string;
  price: number;
  quantity: number;
  unit: string;
  observedAt: string;
  sourceUrl: string;
  indexEligible: boolean;
  matchedAnnualComparison: unknown | null;
};

// Also protect direct invocation outside the npm build pipeline.
execFileSync("python3", ["inflation/check_public_secrets.py"], { stdio: "inherit" });
execFileSync("python3", ["inflation/verify_independent.py"], { stdio: "inherit" });
const basket = JSON.parse(await readFile("src/data/inflation/cpi-basket.json", "utf8"));
const official = JSON.parse(await readFile("src/data/inflation/cpi-official.json", "utf8"));
const independent = JSON.parse(await readFile("src/data/inflation/independent-quotes.json", "utf8"));
const items: BasketItem[] = basket.items;
const quotes: Quote[] = independent.quotes;
const officialRows: OfficialRow[] = official.rows;
const codes = new Set(items.map(item => item.code));
if (items.length !== 358 || codes.size !== 358) throw new Error("Export requires the complete 358-item official basket.");
if (independent.metadata.targetCPIMonth !== official.metadata.period) throw new Error("Independent evidence and official target months differ.");
if (quotes.some(q => !codes.has(q.itemCode)) || new Set(quotes.map(q => q.id)).size !== quotes.length) throw new Error("Unmatched or duplicate independent quotation.");
// This source is a quotation inventory, not compiled and geographically complete item panels.
// Eligible item evidence must be added as a separately reviewed input before publication.
if (quotes.some(q => q.indexEligible) || independent.metadata.indexEligibleItemCount !== 0 || independent.metadata.nationalIndex !== null || independent.metadata.nationalInflationPct !== null) {
  throw new Error("Independent eligibility changed: integrate and audit completed item panels before exporting an index.");
}
const sectors: IndexSector[] = ["rural", "urban", "combined"];
const audits = Object.fromEntries(sectors.map(sector => [sector, auditReplicaCoverage(items, [], official.metadata.period, sector)]));
const officialMap = new Map(officialRows.map(row => [`${row.code}:${row.sector}`, row]));
for (const sector of sectors) {
  const rows = officialRows.filter(r => r.level === "item" && r.sector === sector);
  if (rows.length !== 358 || rows.some(r => !codes.has(r.code)) || new Set(rows.map(r => r.code)).size !== 358) throw new Error(`Incomplete official ${sector} item indices.`);
}
const rows = items.map(item => {
  const found = quotes.filter(q => q.itemCode === item.code);
  return {
    item_code: item.code,
    item_name: item.name,
    kind: item.kind,
    division_code: item.division.code,
    division_name: item.division.name,
    group_code: item.group.code,
    group_name: item.group.name,
    class_code: item.class.code,
    class_name: item.class.name,
    subclass_code: item.subclass.code,
    subclass_name: item.subclass.name,
    base_year: official.metadata.baseYear,
    current_period: official.metadata.period,
    previous_period: official.metadata.previousPeriod,
    ...Object.fromEntries(sectors.flatMap(sector => {
      const row = officialMap.get(`${item.code}:${sector}`)!;
      return [
        [`weight_${sector}_pct`, item.weights[sector]],
        [`official_${sector}_current_index`, row.currentIndex],
        [`official_${sector}_previous_index`, row.previousIndex],
        [`official_${sector}_yoy_pct`, row.yoy],
        [`official_${sector}_imputation`, row.imputation],
        [`independent_${sector}_current_index`, null],
        [`independent_${sector}_previous_index`, null],
        [`independent_${sector}_yoy_pct`, null],
      ];
    })),
    independent_quote_count: found.length,
    independent_provider_annual_comparison_count: found.filter(q => q.matchedAnnualComparison !== null).length,
    independent_quote_ids: found.map(q => q.id).join(" | "),
    independent_providers: [...new Set(found.map(q => q.provider))].join(" | "),
    independent_quote_observation_dates: [...new Set(found.map(q => q.observedAt))].join(" | "),
    independent_source_urls: [...new Set(found.map(q => q.sourceUrl))].join(" | "),
    independent_replica_status: found.length ? "quotation-evidence-only; item-index-incomplete" : "no-independent-quotation; item-index-incomplete",
    weight_source_url: basket.metadata.sourceUrl,
    official_index_source_url: official.metadata.sourceUrl,
  };
});
const template = items.map(item => ({
  item_code: item.code,
  item_name: item.name,
  kind: item.kind,
  division_code: item.division.code,
  division_name: item.division.name,
  state_code: "", state_name: "", sector: "", market_id: "", outlet_id: "", quotation_id: "",
  specification_id: "", brand: "", model_quality: "", quantity: "", unit: "",
  period: "", observation_date: "", rupees: "", taxes_included: "", compulsory_charges_rupees: "",
  discount_treatment: "", availability: "", temporary_missing: "", replacement_overlap: "",
  source_url: "", source_archive: "", source_sha256: "", notes: "",
}));
const basketRows = items.map(item => ({
  item_code: item.code, item_name: item.name, kind: item.kind,
  division_code: item.division.code, division_name: item.division.name,
  group_code: item.group.code, group_name: item.group.name,
  class_code: item.class.code, class_name: item.class.name,
  subclass_code: item.subclass.code, subclass_name: item.subclass.name,
  rural_weight_pct: item.weights.rural, urban_weight_pct: item.weights.urban,
  combined_weight_pct: item.weights.combined, base_year: 2024,
  weight_reference: basket.metadata.weightReference,
  source_url: basket.metadata.sourceUrl, source_sha256: basket.metadata.sourceSha256,
}));
const csvCell = (value: unknown) => {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
const csv = (values: Record<string, unknown>[]) => {
  const columns = Object.keys(values[0]);
  return [columns.join(","), ...values.map(row => columns.map(column => csvCell(row[column])).join(","))].join("\n") + "\n";
};
const output = "dist/data/inflation";
await mkdir(output, { recursive: true });
for (const [name, value] of [
  ["basket", basket], ["official", official],
  ["cpi-basket", basket], ["cpi-official", official], ["independent-quotes", independent],
  ["cpi-comparison", {
    metadata: {
      baseYear: 2024, period: official.metadata.period, previousPeriod: official.metadata.previousPeriod,
      itemCount: items.length,
      explanation: "Official indices are dimensionless. Independent provider quotes are evidence inventory only; incomplete item and national indices remain null. Quotation discovery counts do not measure national index coverage.",
      basketSourceSha256: basket.metadata.sourceSha256, officialSourceSha256: official.metadata.sourceSha256,
    },
    independentAudits: audits,
    rows,
  }],
] as const) await writeFile(`${output}/${name}.json`, JSON.stringify(value, null, 2) + "\n");
await writeFile(`${output}/cpi-comparison.csv`, csv(rows));
await writeFile(`${output}/cpi-ledger.csv`, csv(rows));
await writeFile(`${output}/cpi-basket.csv`, csv(basketRows));
await writeFile(`${output}/cpi-collection-template.csv`, csv(template));
const method = (await readFile("inflation/CPI_METHOD.md", "utf8")).replaceAll("../public/data/inflation/", "/data/inflation/");
await writeFile(`${output}/cpi-method.md`, method);
await writeFile(`${output}/cpi-collection-template-readme.txt`, [
  "CPI 2024 independent collection scaffold — all 358 official item categories",
  "",
  "This file provides an empty starter row per category. It is not a 358-quote national sample.",
  "Repeat each category for the required state, rural/urban sector, sampled market, outlet, exact product/service specification and monthly observation.",
  "Use stable quotation, outlet and specification IDs to match consecutive months. Record quantity, unit, all compulsory charges, taxes and discounts; keep missing prices blank.",
  "Record the actual reference month (YYYY-MM) separately from observation/retrieval date. Do not relabel a November web offer as an October price.",
  "The workbook source's state code mapping is in basket.json. Do not assume another API uses the same numeric state codes.",
  "An anchored 2024 monthly chain and specialist-item procedures are also required. This scaffold is not an automatic import or evidence of complete sampling.",
  "Method and source: https://www.mospi.gov.in/uploads/documents/documents/1770882257889-Expert_Group_Report_CPI.pdf",
  "",
].join("\n"));
console.log(`CPI comparison: ${rows.length} complete basket rows, ${quotes.length} provider quotes; independent indices withheld pending complete panels.`);
