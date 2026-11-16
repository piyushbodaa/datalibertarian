import { mkdir, readFile, writeFile } from "node:fs/promises";
import {
  calculateBasket,
  DEFAULT_BASE_SPEND,
  INDEX_VERSION,
  PUBLISHED_BASE_DATE,
  PUBLISHED_ITEM_IDS,
  type PrivatePriceRow,
} from "../src/data/inflation/private-index";

const snapshot = JSON.parse(
  await readFile("src/data/inflation/private-snapshot.json", "utf8"),
);
const rows: PrivatePriceRow[] = snapshot.rows;
if (
  !Array.isArray(rows) ||
  rows.length !== PUBLISHED_ITEM_IDS.length ||
  PUBLISHED_ITEM_IDS.some((id) => !rows.some((row) => row.id === id))
) {
  throw new Error(
    "Published E22 membership is frozen; a change requires a documented index version.",
  );
}
if (snapshot.metadata.yearAgo !== PUBLISHED_BASE_DATE) {
  throw new Error(
    "The published base date changed. Preserve the original base quantities or document a new index version; do not splice rolling equal-weight baskets.",
  );
}
const calculation = calculateBasket(rows);
if (calculation.status !== "ok" || calculation.momPct === null)
  throw new Error(
    `Cannot publish an incomplete E22 snapshot: ${JSON.stringify(calculation.errors)}`,
  );
const output = {
  indexVersion: INDEX_VERSION,
  name: "Data Libertarian Essentials Index",
  scope:
    "Experimental 22-commodity essentials basket. Independently calculated from government price observations; not national all-items inflation.",
  methodology: {
    baseDate: snapshot.metadata.yearAgo,
    baseIndex: 100,
    baseSpendPerItemRupees: DEFAULT_BASE_SPEND,
    weighting: "Equal base-period expenditure; fixed quantities",
    formula:
      "q_i = base_spend_i / price_i_base; I_t = 100 * sum(q_i * price_i_t) / sum(base_spend_i)",
    monthFormula:
      "100 * (sum(q_i * price_i_current) / sum(q_i * price_i_month_ago) - 1)",
    missingData:
      "Withhold the aggregate if any selected annual price is missing or non-positive. Never renormalize missing items.",
  },
  ...snapshot,
  calculation,
};
const csvRows = rows.map((row) => {
  const item = calculation.contributions.find((item) => item.id === row.id)!;
  return {
    index_version: INDEX_VERSION,
    item_id: row.id,
    item: row.name,
    category: row.category,
    unit: row.unit,
    base_date: snapshot.metadata.yearAgo,
    base_price: row.yearAgo,
    month_date: snapshot.metadata.monthAgo,
    month_price: row.monthAgo,
    current_date: snapshot.metadata.asOf,
    current_price: row.current,
    base_spend_rupees: item.baseSpend,
    base_weight_pct: item.weightPct,
    fixed_quantity: item.quantity,
    current_basket_cost_rupees: item.currentCost,
    month_basket_cost_rupees: item.monthCost,
    item_yoy_pct: item.yoyPct,
    contribution_percentage_points: item.contributionPp,
    source_url: snapshot.metadata.sourceUrl,
    source_archive: snapshot.metadata.sourceArchive,
    source_sha256: snapshot.metadata.sourceSha256,
    retrieved_at: snapshot.metadata.retrievedAt,
  };
});
const columns = Object.keys(csvRows[0]);
const cell = (value: unknown) => {
  const str = String(value ?? "");
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};
await mkdir("dist/data/inflation", { recursive: true });
await writeFile(
  "dist/data/inflation/private-index.json",
  JSON.stringify(output, null, 2) + "\n",
);
await writeFile(
  "dist/data/inflation/private-index.csv",
  [
    columns.join(","),
    ...csvRows.map((row) =>
      columns
        .map((column) => cell((row as Record<string, unknown>)[column]))
        .join(","),
    ),
  ].join("\n") + "\n",
);
console.log(
  `inflation: ${INDEX_VERSION}, ${calculation.yoyPct!.toFixed(4)}% YoY; 22-item JSON and CSV exported`,
);
