import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Money } from "../components/Money";
import { searchHeads, type SearchHit } from "../lib/searchIndex";
import { facets, queryTerms, searchPages, searchRecords, type SiteIndex, type SitePage, type SiteRecord } from "../lib/siteSearch";

// One kind of result per group. "court", "register" and "enterprise" come from
// /search-index.json (built from published records only); the rest are in the app.
const GROUPS = [
  { id: "court", label: "Court records", note: "Babuwatch" },
  { id: "register", label: "Register records", note: "Civil Liberties, Victimless Crimes, Economic Freedom" },
  { id: "enterprise", label: "Government-owned businesses", note: "PSUs" },
  { id: "pages", label: "Pages", note: "Sections, states, crime and budget pages" },
  { id: "budget", label: "Budget lines", note: "Lines typed from official budget books" },
  { id: "prices", label: "Prices", note: "Inflation items" },
] as const;
type GroupId = (typeof GROUPS)[number]["id"];
const PER_PAGE = 20;
const PREVIEW = 5;

let indexPromise: Promise<SiteIndex> | null = null;
function loadIndex() {
  indexPromise ??= fetch("/search-index.json").then((r) => {
    if (!r.ok) throw new Error(String(r.status));
    return r.json() as Promise<SiteIndex>;
  });
  indexPromise.catch(() => { indexPromise = null; });
  return indexPromise;
}

type Item =
  | { kind: "record"; r: SiteRecord }
  | { kind: "page"; p: SitePage }
  | { kind: "head"; h: SearchHit };

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const type = (GROUPS.some((g) => g.id === params.get("type")) ? params.get("type") : "") as GroupId | "";
  const state = params.get("state") ?? "";
  const year = Number(params.get("year")) || 0;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [draft, setDraft] = useState(q);
  const [index, setIndex] = useState<SiteIndex | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => setDraft(q), [q]);
  useEffect(() => {
    if (!q || index) return;
    loadIndex().then(setIndex, () => setFailed(true));
  }, [q, index]);

  const filtered = Boolean(state || year);
  const results = useMemo(() => {
    const empty = { groups: new Map<GroupId, Item[]>(), matched: [] as SiteRecord[] };
    if (queryTerms(q).length === 0) return empty;
    const matched = index ? searchRecords(index, q) : [];
    const recs = matched.filter((r) => (!state || r.state === state) && (!year || r.year === year));
    const heads = filtered ? [] : searchHeads(q);
    const groups = new Map<GroupId, Item[]>([
      ["court", recs.filter((r) => r.kind === "court").map((r) => ({ kind: "record", r }))],
      ["register", recs.filter((r) => r.kind === "register").map((r) => ({ kind: "record", r }))],
      ["enterprise", recs.filter((r) => r.kind === "enterprise").map((r) => ({ kind: "record", r }))],
      ["pages", filtered || !index ? [] : searchPages(index, q).map((p) => ({ kind: "page", p }))],
      ["budget", heads.filter((h) => h.entity !== "Inflation").map((h) => ({ kind: "head", h }))],
      ["prices", heads.filter((h) => h.entity === "Inflation").map((h) => ({ kind: "head", h }))],
    ]);
    return { groups, matched };
  }, [q, index, state, year, filtered]);

  const f = useMemo(() => facets(results.matched), [results.matched]);
  const total = [...results.groups.values()].reduce((n, g) => n + g.length, 0);
  const loading = Boolean(q) && !index && !failed;

  function go(next: Record<string, string | number | null>) {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "" || v === 0) p.delete(k); else p.set(k, String(v));
    }
    if (!("page" in next)) p.delete("page");
    setParams(p, { replace: false });
    if ("page" in next) requestAnimationFrame(() => document.getElementById(`sr-${type}`)?.scrollIntoView());
  }

  const shown = type ? GROUPS.filter((g) => g.id === type) : GROUPS;
  const words = q.trim().split(/\s+/);

  return (
    <article>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Search</h1>
      <p className="mt-3 max-w-2xl text-ink">
        Search court records, registers, government-owned businesses, pages, budget lines and prices. Only published
        records are searched. If it is not here, we have not read it yet.
      </p>
      <form
        className="mt-6 max-w-xl"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const p = new URLSearchParams();
          if (draft.trim()) p.set("q", draft.trim());
          setParams(p);
        }}
      >
        <label className="block text-sm font-medium" htmlFor="ledger-search">
          Search the site
        </label>
        <input
          id="ledger-search"
          className="field mt-1"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Maharashtra salaries, UP bribery, POCSO, crypto…"
          type="search"
          autoCapitalize="off"
          autoCorrect="off"
          enterKeyHint="search"
        />
        <button type="submit" className="file-cta mt-2">
          <span className="file-cta-notch" aria-hidden="true" />
          Search
        </button>
      </form>

      {q ? (
        <div className="mt-6 flex flex-wrap items-end gap-x-5 gap-y-3 text-sm">
          <p className="text-ink/70" role="status" aria-live="polite">
            {loading ? "Searching records…" : `${total.toLocaleString("en-IN")} ${total === 1 ? "result" : "results"} for “${q}”`}
          </p>
          <label className="flex flex-col gap-1">
            <span className="text-ink/60">Type</span>
            <select className="field py-1" value={type} onChange={(e) => go({ type: e.target.value })}>
              <option value="">Everything</option>
              {GROUPS.map((g) => (
                <option key={g.id} value={g.id}>{g.label} ({results.groups.get(g.id)?.length ?? 0})</option>
              ))}
            </select>
          </label>
          {f.state.length ? (
            <label className="flex flex-col gap-1">
              <span className="text-ink/60">State (records)</span>
              <select className="field py-1" value={state} onChange={(e) => go({ state: e.target.value })}>
                <option value="">All states</option>
                {state && !f.state.some(([s]) => s === state) ? <option value={state}>{state}</option> : null}
                {f.state.map(([s, n]) => <option key={s} value={s}>{s} ({n})</option>)}
              </select>
            </label>
          ) : null}
          {f.year.length ? (
            <label className="flex flex-col gap-1">
              <span className="text-ink/60">Year (records)</span>
              <select className="field py-1" value={year || ""} onChange={(e) => go({ year: Number(e.target.value) })}>
                <option value="">All years</option>
                {f.year.map(([y, n]) => <option key={y} value={y}>{y} ({n})</option>)}
              </select>
            </label>
          ) : null}
          {filtered ? (
            <button type="button" className="underline" onClick={() => go({ state: null, year: null })}>Clear filters</button>
          ) : null}
        </div>
      ) : null}
      {filtered && q ? (
        <p className="mt-2 text-xs text-ink/60">State and year filters apply to records; pages, budget lines and prices are hidden while they are on.</p>
      ) : null}
      {failed ? (
        <p className="mt-4 text-sm text-ink/70">Court records and pages could not load, so only budget lines and prices are shown. Try reloading the page.</p>
      ) : null}

      {q && !loading && total === 0 ? (
        <section className="carbon-sheet mt-6 px-4 py-6 sm:px-6">
          <h2 className="font-display text-xl font-semibold">Nothing found for “{q}”</h2>
          <p className="mt-2 text-sm text-ink/75">
            No match does not mean it did not happen. It can mean we have not read that source yet. We do not invent it.
          </p>
          <ul className="mt-3 list-disc pl-5 text-sm">
            {filtered ? <li><button type="button" className="underline" onClick={() => go({ state: null, year: null })}>Clear the state and year filters</button></li> : null}
            {type ? <li><button type="button" className="underline" onClick={() => go({ type: null })}>Search every type, not just {GROUPS.find((g) => g.id === type)?.label.toLowerCase()}</button></li> : null}
            {words.length > 1 ? (
              <li>Try fewer words: {words.map((w) => (
                <Link key={w} className="mr-2" to={`/search?q=${encodeURIComponent(w)}`}>“{w}”</Link>
              ))}</li>
            ) : null}
            <li>Browse instead: <Link to="/states">states</Link>, <a href="/babuwatch/tracker">every court record</a>, <a href="/crime">crime figures</a></li>
            <li>See what we have read so far: <Link to="/sources">sources &amp; methodology</Link></li>
          </ul>
        </section>
      ) : null}

      {shown.map((g) => {
        const all = results.groups.get(g.id) ?? [];
        if (!all.length) return null;
        const pages = Math.ceil(all.length / PER_PAGE);
        const at = Math.min(page, pages);
        const items = type ? all.slice((at - 1) * PER_PAGE, at * PER_PAGE) : all.slice(0, PREVIEW);
        return (
          <section key={g.id} className="mt-8" aria-labelledby={`sr-${g.id}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ink/30 pb-1.5">
              <h2 id={`sr-${g.id}`} className="font-display text-xl font-semibold">
                {g.label} <span className="text-base font-normal text-ink/60">{all.length.toLocaleString("en-IN")}</span>
              </h2>
              <span className="text-xs text-ink/60">{g.note}</span>
            </div>
            <ul className="divide-y divide-ink/15 p-0">
              {items.map((it) => <Result key={keyOf(it)} it={it} />)}
            </ul>
            {!type && all.length > PREVIEW ? (
              <p className="mt-2 text-sm">
                <button type="button" className="underline" onClick={() => go({ type: g.id })}>
                  See all {all.length.toLocaleString("en-IN")} {g.label.toLowerCase()}
                </button>
              </p>
            ) : null}
            {type && pages > 1 ? (
              <nav className="mt-4 flex flex-wrap items-center gap-3 text-sm" aria-label="Result pages">
                {at > 1 ? <button type="button" className="underline" onClick={() => go({ page: at - 1 })}>← Previous</button> : null}
                <span className="text-ink/70">
                  {((at - 1) * PER_PAGE + 1).toLocaleString("en-IN")}–{Math.min(at * PER_PAGE, all.length).toLocaleString("en-IN")} of {all.length.toLocaleString("en-IN")}
                </span>
                {at < pages ? <button type="button" className="underline" onClick={() => go({ page: at + 1 })}>Next →</button> : null}
              </nav>
            ) : null}
          </section>
        );
      })}

      <p className="mt-10 text-sm">
        <Link to="/compare">Compare two governments</Link>
        {" · "}
        <Link to="/sources">Sources &amp; methodology</Link>
      </p>
    </article>
  );
}

function keyOf(it: Item) {
  return it.kind === "record" ? it.r.href : it.kind === "page" ? it.p.href : `${it.h.entity}-${it.h.id}`;
}

function fmtDate(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${Number(m[3])} ${months[Number(m[2]) - 1]} ${m[1]}`;
}

function Result({ it }: { it: Item }) {
  if (it.kind === "record") {
    const r = it.r;
    const meta = [r.section, r.topic, [r.place, r.state].filter(Boolean).join(", "), r.date ? fmtDate(r.date) : ""].filter(Boolean);
    return (
      <li className="py-3.5">
        <a href={r.href} className="font-medium text-ink no-underline hover:text-rust">{r.title}</a>
        <p className="text-sm text-ink/60">{meta.join(" · ")}</p>
        {r.text ? <p className="mt-1 text-sm text-ink/80">{r.text}</p> : null}
      </li>
    );
  }
  if (it.kind === "page") {
    return (
      <li className="py-3.5">
        <a href={it.p.href} className="font-medium text-ink no-underline hover:text-rust">{it.p.title}</a>
        {it.p.text ? <p className="text-sm text-ink/60">{it.p.text}</p> : null}
      </li>
    );
  }
  const h = it.h;
  return (
    <li className="py-3.5">
      <Link to={h.href} className="font-medium text-ink no-underline hover:text-rust">{h.plainLabel}</Link>
      <p className="text-sm text-ink/60">{h.entity}</p>
      {h.money ? <p className="mt-1"><Money money={h.money} size="row" /></p> : null}
    </li>
  );
}
