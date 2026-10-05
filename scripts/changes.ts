// Replays the git history of the record and budget-coverage files and writes
// src/data/changes.json: the date each record first appeared, and, per day,
// what was added, withdrawn, re-decided and newly read. The build reads that
// committed file (Vercel's clone may be shallow), so run this after changing
// data:  npm run changes
//
// Rules, kept deliberately literal:
//  - A register record counts from the first commit where it is V2 (the
//    registers' publish rule). Leaving V2 or the file counts as withdrawn.
//  - A Babuwatch record counts from the first commit it is in the data files
//    (the engine's own publish gate is applied later, at build time, by only
//    ever showing records that are in the published index).
//  - An outcome change is a change of the record's outcome field between
//    commits, or a trial conviction moving to the set-aside file.
//  - A budget book counts as read when a state's police tier, or its health
//    head, first becomes "gold" in src/data/states.ts.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const git = (...args: string[]) =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
const show = (sha: string, path: string): string | null => {
  try { return git("show", `${sha}:${path}`); } catch { return null; }
};

const REGISTERS = ["civilliberties", "victimlesscrimes", "economicfreedom", "psu"] as const;
const BW_FILES = {
  cases: "babuwatch/data/copwatchindia/cases.json",
  policeTrial: "babuwatch/data/copwatchindia/tier2.json",
  civilTrial: "babuwatch/data/civil/tier2.json",
  overturned: "babuwatch/data/copwatchindia/tier2-overturned.json",
};
const STATES_FILE = "src/data/states.ts";
const PATHS = [...REGISTERS.map((r) => `registers/data/${r}.json`), ...Object.values(BW_FILES), STATES_FILE];

type Snap = { published: Map<string, string>; overturned: Set<string>; books: Set<string> };

function snapshot(sha: string): Snap {
  const published = new Map<string, string>(); // key -> outcome
  for (const reg of REGISTERS) {
    const raw = show(sha, `registers/data/${reg}.json`);
    if (!raw) continue;
    for (const r of JSON.parse(raw).records ?? []) {
      if (r.verification === "V2") published.set(`${reg}:${r.id}`, String(r.outcome ?? r.status ?? ""));
    }
  }
  const rows = (path: string) => {
    const raw = show(sha, path);
    if (!raw) return [];
    const d = JSON.parse(raw);
    return (Array.isArray(d) ? d : Object.values(d).find(Array.isArray) ?? []) as Record<string, unknown>[];
  };
  for (const r of rows(BW_FILES.cases)) {
    const id = String(r.merged_id ?? r.record_id ?? "");
    if (id) published.set(`babuwatch:${id}`, String(r.outcome_type ?? ""));
  }
  for (const path of [BW_FILES.policeTrial, BW_FILES.civilTrial]) {
    for (const r of rows(path)) {
      const id = String(r.case_id ?? "");
      if (id) published.set(`babuwatch:${id}`, String(r.outcome_type ?? "conviction"));
    }
  }
  const overturned = new Set(rows(BW_FILES.overturned).map((r) => `babuwatch:${String(r.case_id ?? "")}`));
  const books = new Set<string>();
  const states = show(sha, STATES_FILE) ?? "";
  for (const line of states.split("\n")) {
    const slug = /slug: "([^"]+)"/.exec(line)?.[1];
    if (!slug) continue;
    if (/\btier: "gold"/.test(line)) books.add(`${slug}:police`);
    if (/health: "gold"/.test(line)) books.add(`${slug}:health`);
  }
  return { published, overturned, books };
}

type Day = {
  date: string;
  subjects: string[];
  added: Record<string, string[]>;
  withdrawn: Record<string, string[]>;
  outcome: Record<string, { id: string; from: string; to: string }[]>;
  books: string[];
};

const log = git("log", "--reverse", "--format=%H\t%cs\t%s", "--", ...PATHS).trim().split("\n").filter(Boolean);
const firstSeen: Record<string, string> = {};
const days = new Map<string, Day>();
let prev: Snap = { published: new Map(), overturned: new Set(), books: new Set() };

for (const line of log) {
  const [sha, date, subject] = line.split("\t") as [string, string, string];
  const cur = snapshot(sha);
  const day = days.get(date) ?? { date, subjects: [], added: {}, withdrawn: {}, outcome: {}, books: [] };
  const push = <T>(bucket: Record<string, T[]>, key: string, v: T) => { const reg = key.split(":")[0]!; (bucket[reg] ??= []).push(v); };
  let touched = false;
  for (const [key, outcome] of cur.published) {
    const before = prev.published.get(key);
    if (before === undefined) {
      firstSeen[key] ??= date;
      push(day.added, key, key.slice(key.indexOf(":") + 1));
      touched = true;
    } else if (before !== outcome && before && outcome) {
      push(day.outcome, key, { id: key.slice(key.indexOf(":") + 1), from: before, to: outcome });
      touched = true;
    }
  }
  for (const key of prev.published.keys()) {
    if (cur.published.has(key)) continue;
    if (cur.overturned.has(key) && !prev.overturned.has(key)) {
      push(day.outcome, key, { id: key.slice(key.indexOf(":") + 1), from: prev.published.get(key) ?? "", to: "set_aside_on_appeal" });
    } else {
      push(day.withdrawn, key, key.slice(key.indexOf(":") + 1));
    }
    touched = true;
  }
  for (const b of cur.books) if (!prev.books.has(b)) { day.books.push(b); touched = true; }
  if (touched && !day.subjects.includes(subject)) day.subjects.push(subject.replace(/\s*\(#\d+\)$/, ""));
  days.set(date, day);
  prev = cur;
}

// An id added then withdrawn on the same day nets out; drop empty days.
const out = [...days.values()]
  .map((d) => {
    for (const reg of Object.keys(d.added)) {
      const gone = new Set(d.withdrawn[reg] ?? []);
      const back = new Set(d.added[reg]);
      d.added[reg] = d.added[reg]!.filter((id) => !gone.has(id));
      if (d.withdrawn[reg]) d.withdrawn[reg] = d.withdrawn[reg]!.filter((id) => !back.has(id));
    }
    return d;
  })
  .filter((d) => Object.values(d.added).some((a) => a.length) || Object.values(d.withdrawn).some((a) => a.length) || Object.values(d.outcome).some((a) => a.length) || d.books.length)
  .reverse();

writeFileSync(
  "src/data/changes.json",
  JSON.stringify({ note: "Generated by scripts/changes.ts from git history. Run `npm run changes` after changing record data.", head: git("rev-parse", "--short", "HEAD").trim(), firstSeen, days: out }, null, 0) + "\n",
);
console.log(`changes: ${Object.keys(firstSeen).length} records dated, ${out.length} days with changes`);
