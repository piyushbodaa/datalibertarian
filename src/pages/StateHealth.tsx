import { Link, Navigate, useParams } from "react-router-dom";
import { NotFoundPage } from "./NotFound";
import { CitationFootnote } from "../components/CitationChip";
import { HeadSplit } from "../components/HeadSplit";
import { LedgerTable } from "../components/LedgerTable";
import { Money } from "../components/Money";
import { PrintedColumns } from "../components/PrintedColumns";
import { TraceRail } from "../components/TraceRail";
import { pickAmount } from "../data/maharashtra-police";
import { getHead, headTier } from "../data/heads";
import { getHealthBook, HEALTH_HEADLINE_SERIES, HEALTH_HEADLINE_YEAR, healthBooks } from "../data/health/books";
import { getJurisdiction, jurisdictions, tierLabel } from "../data/states";
import { formatCrore } from "../lib/money";

function OtherStates({ current }: { current: string }) {
  const read = new Set([...healthBooks.map((b) => b.slug), "telangana"]);
  return (
    <>
      <h2 className="mt-12 font-display text-xl font-semibold tracking-tight">Health in other states</h2>
      <p className="mt-2 max-w-2xl text-sm text-ink/70">
        {read.size} states read from their own books. The rest say so; none shows a guessed rupee.
      </p>
      <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 md:grid-cols-3" aria-label="Health in other states">
        {jurisdictions
          .filter((j) => j.kind === "state" && j.slug !== current)
          .map(({ slug, name }) => (
            <li key={slug}>
              <Link
                to={`/${slug}/health`}
                className={`inline-flex min-h-11 items-center no-underline hover:text-rust ${read.has(slug) ? "text-ink" : "text-ink/55"}`}
              >
                {name}
                {read.has(slug) ? "" : " · not read"}
              </Link>
            </li>
          ))}
      </ul>
    </>
  );
}

/** One page for every state's Health door: the typed book when we have it, an honest empty otherwise. */
export function StateHealthPage() {
  const { slug } = useParams();
  const j = slug ? getJurisdiction(slug) : undefined;
  const h = getHead("health");
  if (!j || !h) return <NotFoundPage />;
  if (j.slug === "telangana") return <Navigate to="/telangana/health" replace />;
  const book = getHealthBook(j.slug);
  const tier = headTier(j.heads, "health");

  if (!book || tier !== "gold") {
    return (
      <article>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">{j.name} Health</h1>
        <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
          <h2 className="mt-2 font-display text-xl font-semibold">{tierLabel(tier)}</h2>
          <p className="mt-3 max-w-2xl text-sm text-ink/75">
            No official {j.name} health figure is on this site. We do not guess. The account heads
            we would read are {h.majorHeads.join(", ")}.
          </p>
        </section>
        <OtherStates current={j.slug} />
        <p className="mt-8 text-sm">
          <Link to={`/${j.slug}/police`}>{j.name} Police</Link>
          {" · "}
          <Link to="/states">All states</Link>
          {" · "}
          <Link to="/sources">Method</Link>
        </p>
      </article>
    );
  }

  const hero = pickAmount(book.functional, HEALTH_HEADLINE_YEAR, HEALTH_HEADLINE_SERIES);
  const run = pickAmount(book.run, HEALTH_HEADLINE_YEAR, HEALTH_HEADLINE_SERIES);
  const cap = pickAmount(book.cap, HEALTH_HEADLINE_YEAR, HEALTH_HEADLINE_SERIES);
  if (!hero || !run || !cap) throw new Error(`Missing ${j.slug} health figures`);
  const heads = [book.run2210, book.run2211, book.cap4210, ...(book.cap4211 ? [book.cap4211] : [])];

  return (
    <article>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">{j.name} Health</h1>
      <p className="mt-4 max-w-2xl text-ink">
        What the state budget set aside to run hospitals and public health, family welfare, and to
        build or equip them. {h.notIncluded}
      </p>

      <div className="mt-8 border-y border-ink/20 py-8">
        <p className="text-sm text-ink/55">2026-27 plan</p>
        <div className="mt-3">
          <Money money={hero} size="hero" />
        </div>
        <p className="mt-4 max-w-xl text-sm text-ink/70">
          Running hospitals ₹{formatCrore(run.crore)} crore · Hospital buildings and gear ₹
          {formatCrore(cap.crore)} crore.
        </p>
      </div>

      <PrintedColumns
        run={book.run}
        cap={book.cap}
        caption={`Spent, plan, updated plan, and next plan. Printed in ${book.unit}; shown in crore.`}
      />
      <HeadSplit
        run={run}
        cap={cap}
        runLabel="Running hospitals"
        capLabel="Buildings and gear"
        title="Running hospitals vs buildings and gear"
        note="Same year’s plan. Buildings and gear are the thin slice — that is the book."
      />

      <LedgerTable
        items={heads}
        caption={`The account heads behind the total, as printed in the ${book.bookName}. A dash means the book printed nothing there — not zero.`}
      />

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">How this was read</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/75">{book.note}</p>
      </section>

      <TraceRail
        stops={[
          { id: "book", label: "Book", detail: `${j.name} ${book.bookName}` },
          { id: "major", label: "Health", money: hero, detail: "Running plus buildings and gear." },
          { id: "run", label: "Running hospitals", money: run },
          { id: "cap", label: "Buildings and gear", money: cap },
          {
            id: "hospital",
            label: "Named hospital",
            empty: "The statement stops at the account head. We do not divide that total by the number of hospitals.",
          },
        ]}
      />

      <OtherStates current={j.slug} />

      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          <CitationFootnote citationId={book.citationId} />
        </ol>
        <p className="mt-6">
          Account codes in the book: 2210, 2211 (running), 4210, 4211 (buildings).{" "}
          <Link to={`/${j.slug}/police`}>{j.name} Police</Link>
          {" · "}
          <Link to={`/compare?left=${j.slug}&right=telangana&field=health-functional`}>Compare with Telangana</Link>
          {" · "}
          <Link to="/sources">Method</Link>
        </p>
      </section>
    </article>
  );
}
