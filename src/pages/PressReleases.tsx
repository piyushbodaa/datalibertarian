import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import citiesData from "../data/press-releases/cities.json" with { type: "json" };
import latestData from "../data/press-releases/latest.json" with { type: "json" };
import apLatestData from "../data/press-releases/ap-latest.json" with { type: "json" };

type City = {
  rank: number;
  city: string;
  state: string;
  policeDept: string;
  website: string;
  pressReleaseUrl: string;
  format: string;
  verified?: boolean;
  verifiedAt?: string;
  unverifiedHint?: string;
  note?: string;
};

type Latest = {
  city: string;
  title: string;
  date: string;
  summary: string;
  mediaUrl: string;
  mediaType: string;
};

type ApLatestEntry = { district: string; language: string };

const cities = citiesData as City[];
const latest = latestData as Latest[];
const apLatest = apLatestData as ApLatestEntry[];

// National pilot city name -> AP state-index district (Vijayawada runs as the NTR commissionerate).
const AP_DISTRICT_ALIAS: Record<string, string> = { vijayawada: "ntr" };
const apLanguageByDistrict = new Map<string, string>(
  apLatest.map((l) => [l.district.toLowerCase(), l.language]),
);
function apLatestLanguage(city: string): string | undefined {
  const d = AP_DISTRICT_ALIAS[city.toLowerCase()] ?? city.toLowerCase();
  return apLanguageByDistrict.get(d);
}

function MediaPreview({ item }: { item: Latest }) {
  const normalized = item.mediaType.toLowerCase();
  if (normalized === "pdf") {
    return (
      <div className="mt-3 flex items-center gap-3 rounded-md border border-[var(--rule)] bg-[var(--paper-deep)] px-3 py-2">
        <span aria-hidden="true" className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-[var(--rule-strong)] bg-white text-[0.65rem] font-bold tracking-wide text-[#A13A2F]">
          PDF
        </span>
        <p className="text-xs text-ink/70">Press note is a PDF. Open the linked copy to read the full text.</p>
      </div>
    );
  }
  if (normalized === "image" || normalized === "jpg" || normalized === "jpeg" || normalized === "png") {
    return (
      <div className="mt-3 overflow-hidden rounded-md border border-[var(--rule)] bg-white">
        <img src={item.mediaUrl} alt={`Press release visual for ${item.city}`} className="h-32 w-full object-cover" loading="lazy" />
      </div>
    );
  }
  return (
    <div className="mt-3 flex items-center gap-3 rounded-md border border-[var(--rule)] bg-white px-3 py-2">
      <span aria-hidden="true" className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-[var(--rule-strong)] bg-[#EEF2FC] text-[0.65rem] font-bold tracking-wide text-[#1F4FD1]">
        HTML
      </span>
      <p className="text-xs text-ink/70">Press release is published as HTML on the department site.</p>
    </div>
  );
}

function isRealLatest(item: Latest): boolean {
  const t = (item.title || "").trim();
  const d = (item.date || "").trim();
  const u = (item.mediaUrl || "").trim();
  if (!t || !d || !u) return false;
  if (t.startsWith("Press Release Archive")) return false;
  if (t.startsWith("Tamil Nadu Police Citizen Portal")) return false;
  if (d.startsWith("Archive checked") || d.startsWith("Portal checked")) return false;
  return true;
}

function parseLatestDate(s: string): number {
  const norm = s.trim();
  // Try numeric dd/mm/yyyy or dd-mm-yyyy or dd.MM.yyyy
  let m = norm.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/);
  if (m) {
    const d = Number(m[1]), mo = Number(m[2]), y = Number(m[3]);
    const yy = y < 100 ? 2000 + y : y;
    return new Date(yy, mo - 1, d).getTime();
  }
  m = norm.match(/^(\d{4})[/.\-](\d{1,2})[/.\-](\d{1,2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
  // e.g. 14-Nov-2026, 12-12-2025 with Nov etc fallback to Date.parse
  const t = Date.parse(norm.replace(/\s+g-/gi, "1 ").replace(/-\d+$/, "")) || Date.parse(norm);
  if (!Number.isNaN(t)) return t;
  // Try stripping non-date parts like "Homepage checked 2026-11-16"
  const iso = norm.match(/(\d{4}-\d{2}-\d{2})/);
  if (iso) return Date.parse(iso[1]) || 0;
  return 0;
}

export function PressReleasesPage() {
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const latestByCity = useMemo(() => {
    const map = new Map<string, Latest>();
    for (const entry of latest) map.set(entry.city.toLowerCase(), entry);
    return map;
  }, []);

  const states = useMemo(() => [...new Set(cities.map((c) => c.state))].sort(), []);
  const formats = useMemo(
    () => [...new Set(cities.map((c) => c.format || "unknown"))].sort(),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cities.filter((c) => {
      if (verifiedOnly && !c.verified) return false;
      if (stateFilter !== "all" && c.state !== stateFilter) return false;
      if (formatFilter !== "all" && (c.format || "unknown") !== formatFilter) return false;
      if (!q) return true;
      const haystack = `${c.city} ${c.state} ${c.policeDept}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query, stateFilter, formatFilter, verifiedOnly]);

  // Sorting: verified first, then by parseable latest date desc, then rank
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a.verified ? 1 : 0, bv = b.verified ? 1 : 0;
      if (bv !== av) return bv - av;
      const ai = latestByCity.get(a.city.toLowerCase());
      const bi = latestByCity.get(b.city.toLowerCase());
      const at = ai ? parseLatestDate(ai.date) : 0;
      const bt = bi ? parseLatestDate(bi.date) : 0;
      if (bt !== at) return bt - at;
      return a.rank - b.rank;
    });
  }, [filtered, latestByCity]);

  const visible = showAll ? sorted : sorted.slice(0, 30);
  const liveCount = latest.filter(isRealLatest).length;
  const apPilotCount = cities.filter((c) => c.state === "Andhra Pradesh").length;
  const lastDate = latest
    .filter(isRealLatest)
    .map((l) => ({ date: l.date, t: parseLatestDate(l.date) }))
    .sort((a, b) => (a.t !== b.t ? a.t - b.t : a.date.localeCompare(b.date)))
    .at(-1)?.date;

  return (
    <article>
      <section aria-labelledby="press-hero">
        <p className="kicker">Pilot · Top 100 police departments</p>
        <h1 id="press-hero" className="mt-2 font-display text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl">
          Police press releases
        </h1>
        <p className="mt-3 max-w-2xl text-ink/80">
          Pilot coverage of the top 100 police departments by city population, each linked to its official
          press-release archive. Summaries are shown only where the latest release was verified; otherwise
          the card says so plainly and links to the archive.
        </p>
        <p className="mt-3 max-w-2xl text-sm text-ink/70">
          Telugu-language releases are shown in English — cards marked{" "}
          <span className="inline-block rounded-sm bg-[#EEF2FC] px-1.5 py-0.5 text-[0.65rem] font-medium text-[#1F4FD1]">
            Telugu • Translated
          </span>{" "}
          are translations. Open the archive for the original Telugu text.
        </p>
        <p className="mt-4">
          <Link
            to="/pressreleases/police/ap"
            className="inline-flex items-center gap-2 rounded-md border border-[#1F4FD1] px-3 py-2 text-sm font-medium text-[#1F4FD1]"
            aria-label={`View Andhra Pradesh press releases (${apPilotCount} in pilot, full state index)`}
          >
            Andhra Pradesh <span aria-hidden="true">→</span>
            <span className="text-xs font-normal text-ink/60">Full state index · {apPilotCount} in this pilot</span>
          </Link>
        </p>
        {lastDate ? (
          <p className="mt-3 text-sm text-ink/65">
            Latest verified entry: <span className="num font-medium text-ink">{lastDate}</span> · Audited
            against official department pages 2026-11-16.
          </p>
        ) : null}
      </section>

      <section aria-label="Coverage" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="carbon-sheet p-4">
          <p className="kicker">Departments</p>
          <p className="num num-hero mt-1">{cities.length}</p>
          <p className="mt-1 text-xs text-ink/65">Police departments in the pilot index</p>
        </div>
        <div className="carbon-sheet p-4">
          <p className="kicker">Verified latest</p>
          <p className="num num-hero mt-1">{liveCount}</p>
          <p className="mt-1 text-xs text-ink/65">Latest release fetched with title, date, summary and direct media</p>
        </div>
        <div className="carbon-sheet p-4">
          <p className="kicker">Coverage</p>
          <p className="num num-hero mt-1">{states.length}</p>
          <p className="mt-1 text-xs text-ink/65">States and UTs across the 100-city pilot — {cities.length - liveCount} pending fetch</p>
        </div>
        <div className="carbon-sheet p-4">
          <p className="kicker">Andhra Pradesh</p>
          <p className="num num-hero mt-1">{apPilotCount}</p>
          <p className="mt-1 text-xs text-ink/65">
            In pilot ·{" "}
            <Link to="/pressreleases/police/ap" className="font-medium text-[#1F4FD1] underline-offset-2 hover:underline">
              full AP index
            </Link>
          </p>
        </div>
      </section>

      <section aria-label="Filter press releases" className="mt-10">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_220px_auto]">
          <div>
            <label htmlFor="press-search" className="mb-1 block text-sm font-medium text-ink">
              Search city, state or department
            </label>
            <input
              id="press-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Mumbai, Karnataka, Commissionerate"
              className="field"
            />
          </div>
          <div>
            <label htmlFor="press-state" className="mb-1 block text-sm font-medium text-ink">
              State / UT
            </label>
            <select
              id="press-state"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="field"
            >
              <option value="all">All states / UTs</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="press-format" className="mb-1 block text-sm font-medium text-ink">
              Format
            </label>
            <select
              id="press-format"
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="field"
            >
              <option value="all">All formats</option>
              {formats.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end pb-1">
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
              Verified only
            </label>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-ink/60" role="status" aria-live="polite">
            Showing {visible.length} of {filtered.length} departments
            {query ? ` for “${query.trim()}”` : ""}.
          </p>
          {filtered.length > visible.length ? (
            <button type="button" onClick={() => setShowAll(true)} className="btn-sm">
              Show all {filtered.length} departments
            </button>
          ) : filtered.length > 30 ? (
            <button type="button" onClick={() => setShowAll(false)} className="btn-sm">
              Collapse to {30}
            </button>
          ) : null}
        </div>
      </section>

      <section aria-label="Departments" className="mt-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((c) => {
            const rawItem = latestByCity.get(c.city.toLowerCase());
            const item = rawItem && isRealLatest(rawItem) ? rawItem : undefined;
            const isVerified = !!c.verified && !!item;
            return (
              <article key={`${c.rank}-${c.city}`} className="carbon-sheet flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-display text-base font-semibold leading-snug">
                      {c.city} <span className="font-normal text-ink/60">· {c.state}</span>
                    </h2>
                    <p className="mt-0.5 text-sm text-ink/75">{c.policeDept}</p>
                  </div>
                  <span className="num shrink-0 rounded-sm bg-[var(--paper-deep)] px-1.5 py-0.5 text-xs text-ink/60" title="Pilot rank">
                    #{c.rank}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink/50">
                    Format: {c.format || "unknown"}
                  </p>
                  <span className={`inline-block rounded-sm px-1.5 py-0.5 text-[0.65rem] font-medium ${isVerified ? "bg-[var(--rust-soft)] text-[var(--rust)]" : "bg-[var(--paper-deep)] text-ink/55"}`}>
                    {isVerified ? "Verified" : "Unverified archive"}
                  </span>
                  {c.state === "Andhra Pradesh" && apLatestLanguage(c.city) === "telugu-translated" ? (
                    <span className="inline-block rounded-sm bg-[#EEF2FC] px-1.5 py-0.5 text-[0.65rem] font-medium text-[#1F4FD1]">
                      Telugu • Translated
                    </span>
                  ) : null}
                </div>

                {c.note ? (
                  <p className="mt-2 text-xs text-ink/60">{c.note}</p>
                ) : null}
                {!isVerified && c.unverifiedHint ? (
                  <p className="mt-1 text-xs text-ink/55">Not yet verified — {c.unverifiedHint}</p>
                ) : null}

                <div className="mt-3 flex-1 text-sm">
                  {item ? (
                    <>
                      <h3 className="font-medium leading-snug text-ink">{item.title}</h3>
                      <p className="num mt-1 text-xs text-ink/60">{item.date}</p>
                      <p className="mt-2 text-ink/80">{item.summary}</p>
                    </>
                  ) : (
                    <p className="text-ink/60">Latest summary pending — open archive.</p>
                  )}
                </div>

                {item ? <MediaPreview item={item} /> : null}

                <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--rule)] pt-3">
                  <a
                    href={c.pressReleaseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="file-cta min-h-[36px] text-sm"
                    aria-label={`Open ${c.policeDept} press release archive (opens in new tab)`}
                  >
                    Open archive <span className="sr-only">(opens in new tab)</span>
                  </a>
                  {item ? (
                    <a
                      href={item.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-cta min-h-[36px] text-sm"
                      aria-label={`Open latest media for ${c.city} (opens in new tab)`}
                    >
                      {item.mediaType.toLowerCase() === "pdf" ? "View PDF" : "Open latest"} <span className="sr-only">(opens in new tab)</span>
                    </a>
                  ) : null}
                  <a
                    href={c.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="file-cta min-h-[36px] text-sm"
                    aria-label={`Open ${c.policeDept} website (opens in new tab)`}
                  >
                    Website <span className="sr-only">(opens in new tab)</span>
                  </a>
                </div>
              </article>
            );
          })}
        </div>
        {filtered.length === 0 ? (
          <p className="carbon-sheet mt-4 p-4 text-sm text-ink/70">
            No departments match the current filters. Clear the search or choose “All”.
          </p>
        ) : null}
      </section>

      <section className="mt-10 text-sm" aria-label="Method note">
        <p className="kicker">Method</p>
        <p className="mt-2 max-w-2xl text-ink/75">
          Each card links to the official department press-release page. Media previews reflect the source
          format: PDF badge for PDF notes, an image for image notes, and an HTML marker where releases
          are published as HTML. Where the latest release has not been fetched, the card shows no summary
          rather than an invented one.
        </p>
      </section>
    </article>
  );
}
