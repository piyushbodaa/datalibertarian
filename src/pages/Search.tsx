import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Money } from "../components/Money";
import { searchHeads } from "../lib/searchIndex";

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const [draft, setDraft] = useState(q);
  const hits = useMemo(() => searchHeads(q), [q]);

  function run(next: string) {
    const p = new URLSearchParams();
    if (next.trim()) p.set("q", next.trim());
    setParams(p, { replace: true });
  }

  return (
    <article>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Search</h1>
      <p className="mt-3 max-w-2xl text-ink">
        Search the lines we have already typed. If it is not here, we have not read it yet.
      </p>
      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault();
          run(draft);
        }}
      >
        <label className="block text-sm">
          Query
          <input
            className="mt-1 w-full max-w-xl border border-ink/20 bg-paper px-3 py-2"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="police, salaries, Maharashtra, Karnataka…"
          />
        </label>
        <button type="submit" className="file-cta mt-4">
          <span className="file-cta-notch" aria-hidden="true" />
          Search
        </button>
      </form>

      {q && hits.length === 0 ? (
        <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
          <h2 className="font-display text-xl font-semibold">Nothing found</h2>
          <p className="mt-2 text-sm text-ink/75">Not in the typed books. We do not invent it.</p>
        </section>
      ) : null}

      <ul className="mt-8 divide-y divide-ink/15 border-y border-ink/20 p-0">
        {hits.map((h) => (
          <li key={`${h.entity}-${h.id}`} className="py-3">
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
