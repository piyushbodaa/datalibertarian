import { Link, useParams } from "react-router-dom";
import { NotFoundPage } from "./NotFound";
import { CitationFootnote } from "../components/CitationChip";
import { HeadSplit } from "../components/HeadSplit";
import { Money } from "../components/Money";
import { TraceRail } from "../components/TraceRail";
import { formatCrore, SERIES_LABEL } from "../lib/money";
import { getMunicipalBody, municipalHero } from "../data/municipal/ghmc";

export function MunicipalBodyPage() {
  const { slug } = useParams();
  const body = slug ? getMunicipalBody(slug) : undefined;
  if (!body) return <NotFoundPage />;

  if (body.tier !== "gold" || !body.total || !body.revenue || !body.capital || !body.citationId) {
    return (
      <article>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">{body.name}</h1>
        <p className="mt-3 max-w-2xl text-ink">
          {body.body}, {body.state}.
        </p>
        <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
          <h2 className="mt-2 font-display text-xl font-semibold">We have not read this book yet</h2>
          <p className="mt-3 max-w-2xl text-sm text-ink/75">
            No official {body.body} figure is on this site. We do not guess.
          </p>
          {body.nextSearch ? (
            <p className="mt-4 text-sm text-ink/60">Next search: {body.nextSearch}</p>
          ) : null}
        </section>
        <p className="mt-8 text-sm">
          <Link to="/municipal">All cities</Link>
          {" · "}
          <Link to={`/${body.stateSlug}/police`}>{body.state} Police</Link>
          {" · "}
          <Link to="/sources">Method</Link>
        </p>
      </article>
    );
  }

  const revenue = body.revenue;
  const capital = body.capital;
  const hero = municipalHero(body);
  const run = revenue.amounts.find((a) => a.fiscalYear === hero.fiscalYear && a.series === hero.series);
  const cap = capital.amounts.find((a) => a.fiscalYear === hero.fiscalYear && a.series === hero.series);
  if (!run || !cap) throw new Error(`Missing ${body.slug} split`);

  return (
    <article>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">{body.name}</h1>
      <p className="mt-3 max-w-2xl text-ink">
        {body.body}. What the corporation planned to spend on running the city and on building
        it, as printed in its own budget book. Not the state book, not city police.
      </p>

      <div className="mt-8 border-y border-ink/20 py-8">
        <p className="text-sm text-ink/55">
          {SERIES_LABEL[hero.series]} {hero.fiscalYear}
        </p>
        <div className="mt-3">
          <Money money={hero} size="hero" showSeries />
        </div>
      </div>

      <HeadSplit
        run={run}
        cap={cap}
        runLabel="Running the city"
        capLabel="Building the city"
        title="Running the city vs building it"
        note="Same year’s plan. Debt servicing sits inside both halves in this book."
      />

      <h2 className="mt-10 font-display text-xl font-semibold">Every printed column</h2>
      <ol className="mt-4 max-w-xl space-y-3">
        {body.total.amounts.map((m) => {
          const r = revenue.amounts.find((a) => a.fiscalYear === m.fiscalYear && a.series === m.series);
          const c = capital.amounts.find((a) => a.fiscalYear === m.fiscalYear && a.series === m.series);
          return (
            <li key={`${m.fiscalYear}-${m.series}`} className="text-sm">
              <div className="flex justify-between gap-4">
                <span>
                  {SERIES_LABEL[m.series]} {m.fiscalYear}
                </span>
                <Money money={m} size="row" />
              </div>
              {r && c ? (
                <p className="mt-1 text-xs text-ink/55">
                  Running ₹{formatCrore(r.crore)} crore · Building ₹{formatCrore(c.crore)} crore
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {body.missingYears.map((gap) => (
        <section key={gap.fiscalYear} className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
          <h2 className="mt-2 font-display text-xl font-semibold">{gap.fiscalYear} is not in a book yet</h2>
          <p className="mt-3 max-w-2xl text-sm text-ink/75">{gap.reason}</p>
          <p className="mt-4 text-sm text-ink/60">No figure yet.</p>
        </section>
      ))}

      <TraceRail
        title="Where this book stops"
        stops={[
          { id: "book", label: "Book", detail: `${body.body} budget ${hero.fiscalYear}` },
          { id: "total", label: "City budget", money: hero },
          { id: "run", label: "Running the city", money: run },
          { id: "cap", label: "Building the city", money: cap },
          {
            id: "ward",
            label: "Named ward",
            empty: "The highlights table stops at the corporation. We do not divide it by the number of wards.",
          },
        ]}
      />

      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          <CitationFootnote citationId={body.citationId} />
        </ol>
        <p className="mt-6">
          <Link to="/municipal">All cities</Link>
          {" · "}
          <Link to={`/${body.stateSlug}/police`}>{body.state} Police</Link>
          {" · "}
          <Link to={`/compare?left=${body.slug}`}>Compare this book</Link>
          {" · "}
          <Link to="/sources">Method</Link>
        </p>
      </section>
    </article>
  );
}
