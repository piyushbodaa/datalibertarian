import { Link } from "react-router-dom";
import { jurisdictions } from "../data/states";

export function StatesPage() {
  const states = jurisdictions.filter((j) => j.kind === "state");
  const uts = jurisdictions.filter((j) => j.kind === "ut");
  const live = jurisdictions.filter((j) => j.police === "live").length;

  return (
    <article>
      <p className="kicker">State books</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">State Governments</h1>
      <p className="mt-4 max-w-2xl text-ink">
        Each state and Union Territory keeps its own budget. Police spending here means that
        jurisdiction’s books — not the Union Demand 51 ledger, and not a guessed all-India table.
      </p>
      <p className="mt-3 max-w-2xl text-sm text-ink/70">
        {live} police ledger{live === 1 ? "" : "s"} live. The rest say so. We do not invent rupees.
      </p>

      <Section title="States" rows={states} />
      <Section title="Union Territories" rows={uts} />

      <p className="mt-10 max-w-2xl text-sm text-ink/65">
        Union Territory police often sits in the Centre’s books. See{" "}
        <Link to="/union/police">Union Demand 51</Link> for Delhi Police and Jammu and Kashmir
        Police as printed there. <Link to="/sources">Method</Link>.
      </p>
    </article>
  );
}

function Section({
  title,
  rows,
}: {
  title: string;
  rows: typeof jurisdictions;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
      <ul className="mt-4 divide-y divide-ink/15 border-y border-ink/20">
        {rows.map((j) => (
          <li key={j.slug} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
            <Link to={`/${j.slug}/police`} className="font-medium text-ink no-underline hover:text-rust">
              {j.name}
            </Link>
            {j.police === "live" ? (
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-rust">
                Books live
              </span>
            ) : (
              <span className="text-[0.7rem] uppercase tracking-[0.12em] text-ink/45">
                Books not extracted yet
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
