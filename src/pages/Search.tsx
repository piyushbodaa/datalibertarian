import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Money } from "../components/Money";
import { searchHeads } from "../lib/searchIndex";

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const [draft, setDraft] = useState(q);
  const hits = useMemo(() => searchHeads(q), [q]);

  useEffect(() => {
    setDraft(q);
  }, [q]);

  function run(next: string) {
    const p = new URLSearchParams();
    if (next.trim()) p.set("q", next.trim());
    setParams(p, { replace: true });
  }

  return (
    <article>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Search</h1>
      <p className="mt-3 max-w-2xl text-ink">
        Search the lines we have already typed. If it is not here, we have not read it yet.
      </p>
      <form
        className="mt-6 max-w-xl"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          run(draft);
        }}
      >
        <label className="block text-sm font-medium" htmlFor="ledger-search">
          Query
        </label>
        <input
          id="ledger-search"
          className="field mt-1"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="police, salaries, Maharashtra, Karnataka…"
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
        <p className="mt-6 text-sm text-ink/60">
          {hits.length} {hits.length === 1 ? "line" : "lines"} for “{q}”
        </p>
      ) : null}

      {q && hits.length === 0 ? (
        <section className="carbon-sheet mt-6 px-4 py-6 sm:px-6">
          <h2 className="font-display text-xl font-semibold">Nothing found</h2>
          <p className="mt-2 text-sm text-ink/75">Not in the typed books. We do not invent it.</p>
        </section>
      ) : null}

      <ul className="mt-6 divide-y divide-ink/15 border-y border-ink/20 p-0">
        {hits.map((h) => (
          <li key={`${h.entity}-${h.id}`} className="py-3.5">
            <Link to={h.href} className="font-medium text-ink no-underline hover:text-rust">
              {h.plainLabel}
            </Link>
            <p className="text-sm text-ink/60">{h.entity}</p>
            {h.money ? (
              <p className="mt-1">
                <Money money={h.money} size="row" />
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm">
        <Link to="/compare">Compare two states</Link>
        {" · "}
        <Link to="/sources">Method</Link>
      </p>
    </article>
  );
}
