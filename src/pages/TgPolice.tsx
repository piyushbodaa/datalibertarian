import { Link } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";
import { Money } from "../components/Money";
import { pickAmount } from "../data/maharashtra-police";
import { tgArms220, tgCity4055, tgObject010 } from "../data/telangana/police";

export function TgPolicePage() {
  const hero = pickAmount(tgObject010, "2026-27", "be");
  const prior = pickAmount(tgObject010, "2025-26", "be");
  const arms = pickAmount(tgArms220, "2026-27", "be");
  const city = pickAmount(tgCity4055, "2026-27", "be");
  if (!hero || !prior || !arms || !city) throw new Error("Missing TG gold figures");

  return (
    <article>
      <p className="kicker">GOLD · Law + Home · Police slice</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Telangana Police</h1>
      <p className="mt-3 max-w-2xl text-ink">
        Statewide <strong>object 010</strong> as a <strong>desk-sum</strong> from the Law and Home
        volume. This is not Demand X Home (₹11,906.83 cr), and Hyderabad city police is not added
        in.
      </p>
      <div className="mt-8 border-y border-ink/20 py-8">
        <p className="kicker text-ink/50">Object 010 · desk-sum · FY 2026-27 budget</p>
        <div className="mt-3">
          <Money money={hero} size="hero" showSeries />
        </div>
        <p className="mt-4 text-sm text-ink/70">
          Same object, FY 2025-26 budget: <Money money={prior} size="row" />
        </p>
      </div>
      <dl className="mt-8 max-w-xl divide-y divide-ink/15 border-y border-ink/20 text-sm">
        <div className="flex justify-between gap-4 py-2.5">
          <dt>Arms · object 220</dt>
          <dd>
            <Money money={arms} size="row" />
          </dd>
        </div>
        <div className="flex justify-between gap-4 py-2.5">
          <dt>City Police capital (4055) — city, not state total</dt>
          <dd className="shrink-0">
            <Money money={city} size="row" />
          </dd>
        </div>
      </dl>
      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <p className="kicker text-ochre">Blocked as Police</p>
        <h2 className="mt-2 font-display text-xl font-semibold">Demand X Home is not Police</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/70">
          Home Department printed totals (₹10,188.01 cr in 2025-26 and ₹11,906.83 cr in 2026-27)
          include more than Police. They are not shown as the Police hero. Hyderabad CP combined
          figures are not added into this statewide object.
        </p>
      </section>
      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          <CitationFootnote citationId={hero.citationId} />
        </ol>
        <p className="mt-6">
          INDEX (PRS Police functional): <Link to="/states">States</Link>.{" "}
          <Link to="/sources">Sources</Link>.
        </p>
      </section>
    </article>
  );
}
