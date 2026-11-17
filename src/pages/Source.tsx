import { useMemo, useState } from "react";
import datasetsData from "../data/source/datasets.json" with { type: "json" };

type LinkStatus = "ok" | "unreachable";

type Dataset = {
  category: string;
  organisation: string;
  ministry: string;
  dataset: string;
  url: string;
  summary: string;
  frequency: string;
  formats: string;
  linkStatus: LinkStatus;
  note: string;
};

const CATEGORIES: { id: string; label: string; blurb: string }[] = [
  { id: "economy", label: "Economy & prices", blurb: "National accounts, price indices, household surveys and RBI macro series." },
  { id: "public-finance", label: "Public finance & tax", blurb: "Budgets, accounts, audit reports, tax collections and procurement." },
  { id: "finance-insurance", label: "Banking, insurance & markets", blurb: "Insurance, bank credit, payments, pensions and securities markets." },
  { id: "health", label: "Health & population", blurb: "Health surveys, facility data, births and deaths, disease programmes and the Census." },
  { id: "crime-justice", label: "Crime & justice", blurb: "Crime, police strength, court pendency, prisons and oversight bodies." },
  { id: "trade-industry", label: "Trade, industry & sales", blurb: "Exports and imports, factory output, company filings, vehicle and fuel sales." },
  { id: "agri-environment", label: "Agriculture, food & environment", blurb: "Crops, mandi prices, food stocks, rural schemes, water, weather and forests." },
  { id: "energy-transport", label: "Energy, transport & telecom", blurb: "Power, coal, petroleum, railways, roads, aviation, ports and telecom." },
  { id: "education-labour", label: "Education, labour & welfare", blurb: "Schools, colleges, jobs surveys, wages, provident fund and welfare schemes." },
  { id: "governance-opendata", label: "Elections, governance & open data", blurb: "Open data portals, election results, Parliament records and grievance data." },
];

const datasets = datasetsData as Dataset[];
const CHECKED_ON = "2026-11-17";

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function DatasetRow({ d }: { d: Dataset }) {
  const meta = [d.frequency, d.formats].filter((v) => v && !v.startsWith("Unknown"));
  return (
    <li className="carbon-sheet p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <p className="kicker m-0">{d.organisation}</p>
        {d.linkStatus === "ok" ? null : (
          <span
            className="inline-block shrink-0 rounded-sm bg-[var(--paper-deep)] px-1.5 py-0.5 text-[0.65rem] font-medium text-ink/60"
            title="The site did not answer our automated check. It may still open in a browser."
          >
            Did not answer our check
          </span>
        )}
      </div>
      <h3 className="mt-1 font-display text-base font-semibold leading-snug">
        <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-ink underline-offset-2 hover:text-rust hover:underline">
          {d.dataset}
        </a>
      </h3>
      <p className="mt-1.5 text-sm text-ink/80">{d.summary}</p>
      <p className="mt-2 break-all text-xs">
        <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-[#1F4FD1] underline-offset-2 hover:underline">
          {d.url}
        </a>
      </p>
      {meta.length > 0 || d.ministry ? (
        <p className="mt-2 text-xs text-ink/60">
          {[d.ministry, ...meta].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      {d.note ? <p className="mt-1 text-xs text-ink/60">Note: {d.note}</p> : null}
    </li>
  );
}

export function SourcePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return datasets.filter((d) => {
      if (category !== "all" && d.category !== category) return false;
      if (!q) return true;
      return `${d.organisation} ${d.ministry} ${d.dataset} ${d.summary} ${hostOf(d.url)}`.toLowerCase().includes(q);
    });
  }, [query, category]);

  const groups = useMemo(
    () =>
      CATEGORIES.map((c) => ({ ...c, items: filtered.filter((d) => d.category === c.id) })).filter(
        (g) => g.items.length > 0,
      ),
    [filtered],
  );

  const organisations = useMemo(() => new Set(datasets.map((d) => d.organisation)).size, []);
  const answered = datasets.filter((d) => d.linkStatus === "ok").length;

  return (
    <article>
      <section aria-labelledby="source-hero">
        <p className="kicker">Directory · All-India government data</p>
        <h1 id="source-hero" className="mt-2 font-display text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl">
          Government data sources
        </h1>
        <p className="mt-3 max-w-2xl text-ink/80">
          Where the Indian government publishes national-level data, by subject. Each entry names the
          organisation, links straight to the dataset, and says in a line or two what the data holds.
          Only sites run by government bodies are listed.
        </p>
        <p className="mt-3 max-w-2xl text-sm text-ink/65">
          Every link was opened by an automated check on <span className="num">{CHECKED_ON}</span>. Government
          sites often block automated visitors or go offline, so a link that did not answer is marked rather
          than removed.
        </p>
      </section>

      <section aria-label="Coverage" className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="carbon-sheet p-4">
          <p className="kicker">Datasets</p>
          <p className="num num-hero mt-1">{datasets.length}</p>
          <p className="mt-1 text-xs text-ink/65">Datasets, publications and data portals listed</p>
        </div>
        <div className="carbon-sheet p-4">
          <p className="kicker">Organisations</p>
          <p className="num num-hero mt-1">{organisations}</p>
          <p className="mt-1 text-xs text-ink/65">Ministries, regulators and agencies publishing them</p>
        </div>
        <div className="carbon-sheet p-4">
          <p className="kicker">Links answered</p>
          <p className="num num-hero mt-1">{answered}</p>
          <p className="mt-1 text-xs text-ink/65">
            Of {datasets.length} links, answered our check on {CHECKED_ON}
          </p>
        </div>
      </section>

      <section aria-label="Filter datasets" className="mt-10">
        <div className="grid gap-3 md:grid-cols-[1fr_280px]">
          <div>
            <label htmlFor="source-search" className="mb-1 block text-sm font-medium text-ink">
              Search organisation, dataset or subject
            </label>
            <input
              id="source-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. insurance, NCRB, vehicle registrations"
              className="field"
            />
          </div>
          <div>
            <label htmlFor="source-category" className="mb-1 block text-sm font-medium text-ink">
              Subject
            </label>
            <select
              id="source-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="field"
            >
              <option value="all">All subjects</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-2 text-xs text-ink/60" role="status" aria-live="polite">
          Showing {filtered.length} of {datasets.length} datasets
          {query.trim() ? ` for “${query.trim()}”` : ""}.
        </p>
        <nav aria-label="Subjects" className="mt-4 flex flex-wrap gap-2">
          {groups.map((g) => (
            <a
              key={g.id}
              href={`#${g.id}`}
              className="rounded-full border border-[var(--rule-strong)] px-3 py-1 text-xs font-medium text-ink/75 no-underline hover:border-[var(--rust)] hover:text-rust"
            >
              {g.label} <span className="num text-ink/50">{g.items.length}</span>
            </a>
          ))}
        </nav>
      </section>

      {groups.length === 0 ? (
        <p className="index-slip mt-8 text-sm text-ink/75">
          No dataset matches that search. Try a broader word, or clear the subject filter.
        </p>
      ) : null}

      {groups.map((g) => (
        <section key={g.id} id={g.id} aria-labelledby={`${g.id}-h`} className="mt-12 scroll-mt-24">
          <h2 id={`${g.id}-h`} className="font-display text-xl font-semibold tracking-tight">
            {g.label} <span className="num text-base font-normal text-ink/50">{g.items.length}</span>
          </h2>
          <p className="mt-1 text-sm text-ink/65">{g.blurb}</p>
          <ul className="mt-4 grid list-none gap-3 p-0 lg:grid-cols-2">
            {g.items.map((d) => (
              <DatasetRow key={`${d.url}|${d.dataset}`} d={d} />
            ))}
          </ul>
        </section>
      ))}
    </article>
  );
}
