import { test } from "node:test";
import assert from "node:assert/strict";
import { queryTerms, score, searchRecords, facets, type SiteIndex, type SiteRecord } from "./siteSearch";
import { searchHeads } from "./searchIndex";

const rec = (o: Partial<SiteRecord>): SiteRecord => ({
  kind: "court", section: "Babuwatch", title: "", text: "", href: "/x", state: "", place: "", topic: "", by: "", date: "", year: null, ...o,
});

test("every word must match; aliases expand whole words only", () => {
  assert.ok(score(queryTerms("UP bribery"), "Clerk convicted of bribery", "Uttar Pradesh") > 0);
  assert.equal(score(queryTerms("UP bribery"), "Clerk convicted of bribery", "Madhya Pradesh"), 0);
  assert.equal(score(queryTerms("up"), "supply", "grouping"), 0);
  assert.equal(score(queryTerms("rape"), "therapeutic", ""), 0);
  assert.ok(score(queryTerms("rape"), "Rape in India", "") > 0);
});

test("title matches rank above body matches", () => {
  const t = queryTerms("police");
  assert.ok(score(t, "Police salaries", "") > score(t, "Salaries", "police"));
});

test("records filter by state and year, newest first on ties", () => {
  const index: SiteIndex = { built: "", pages: [], records: [
    rec({ title: "Bribery A", state: "Kerala", date: "2020-01-01", year: 2020, href: "/a" }),
    rec({ title: "Bribery B", state: "Kerala", date: "2024-01-01", year: 2024, href: "/b" }),
    rec({ title: "Bribery C", state: "Goa", date: "2024-02-01", year: 2024, href: "/c" }),
  ] };
  assert.deepEqual(searchRecords(index, "bribery").map((r) => r.href), ["/c", "/b", "/a"]);
  assert.deepEqual(searchRecords(index, "bribery", { state: "Kerala", year: 2024 }).map((r) => r.href), ["/b"]);
  assert.deepEqual(facets(index.records).state, [["Kerala", 2], ["Goa", 1]]);
});

test("budget search combines words and is no longer capped at 40", () => {
  const hits = searchHeads("UP salaries");
  assert.ok(hits.length > 0);
  assert.ok(hits.every((h) => /uttar pradesh/i.test(h.entity)));
  assert.ok(searchHeads("police").length > 40);
});
