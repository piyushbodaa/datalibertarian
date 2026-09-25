// Writes the observed prices behind /inflation as dated downloads
// (dist/data/inflation-observed.json and .csv): item, unit, centre, date,
// rupees and the exact source, so a reader can check any cell without
// relying on a live report page (audit follow-up 2026-09-25, finding 8).
import { mkdir, writeFile } from "node:fs/promises";
import { INFLATION_ITEMS } from "../src/data/inflation/items";
import { citations } from "../src/data/sources";

// How each source can be re-checked. A dated file is pinned by checksum;
// a report generated on request says so plainly.
const SNAPSHOT: Record<string, string> = {
  "ppac-fuel-2026-09-10":
    "Dated PDF. SHA-256 6e5289d63391f00cf219ea2b4ae94309a17b75a75d75e376cd59104f259518ae (retrieved 2026-09-25); Delhi figures on page 1.",
  "pmd-retail-2026-09-10":
    "Report generated on request for a chosen date (Dailyprices.aspx, as on 10/09/2026). No dated file was kept at extraction on 2026-09-11 and no archived copy exists; re-run the report for that date to check.",
};

const rows = INFLATION_ITEMS.flatMap((item) =>
  item.observed.map((p) => {
    const c = citations[p.citationId];
    return {
      item_id: item.id,
      item: item.plainLabel,
      official_name: item.officialName,
      date: p.asOf,
      rupees: p.rupees,
      unit: p.unit,
      centre: p.centre,
      source_id: p.citationId,
      source_title: c?.title ?? "",
      source_url: c?.url ?? "",
      source_detail: c?.pages ?? "",
      extracted_on: c?.accessedOn ?? "",
      how_to_check: SNAPSHOT[p.citationId] ?? "",
    };
  }),
);

const cols = Object.keys(rows[0] ?? {});
const cell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
await mkdir("dist/data", { recursive: true });
await writeFile("dist/data/inflation-observed.json", JSON.stringify(rows, null, 1) + "\n");
await writeFile(
  "dist/data/inflation-observed.csv",
  [cols.join(","), ...rows.map((r) => cols.map((k) => cell((r as Record<string, unknown>)[k])).join(","))].join("\n") + "\n",
);
console.log(`inflation: ${rows.length} observed prices written to dist/data/inflation-observed.{json,csv}`);
