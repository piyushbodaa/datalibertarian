import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import changes from "./changes.json" with { type: "json" };

// The What changed page reads changes.json, which `npm run changes` writes from
// git history. If this fails, run `npm run changes` and commit the result.
test("every published register record has an added date", () => {
  const seen = changes.firstSeen as Record<string, string>;
  const missing: string[] = [];
  for (const reg of ["civilliberties", "victimlesscrimes", "economicfreedom", "psu"]) {
    const data = JSON.parse(readFileSync(`registers/data/${reg}.json`, "utf8"));
    for (const r of data.records) if (r.verification === "V2" && !seen[`${reg}:${r.id}`]) missing.push(`${reg}:${r.id}`);
  }
  assert.deepEqual(missing, [], "run `npm run changes`");
});

test("every Babuwatch record in the data files has an added date", () => {
  const seen = changes.firstSeen as Record<string, string>;
  const rows = (p: string) => JSON.parse(readFileSync(p, "utf8")) as Record<string, string>[];
  const ids = [
    ...rows("babuwatch/data/copwatchindia/cases.json").map((r) => r.merged_id ?? r.record_id),
    ...rows("babuwatch/data/copwatchindia/tier2.json").map((r) => r.case_id),
    ...rows("babuwatch/data/civil/tier2.json").map((r) => r.case_id),
  ];
  assert.deepEqual(ids.filter((id) => !seen[`babuwatch:${id}`]), [], "run `npm run changes`");
});
