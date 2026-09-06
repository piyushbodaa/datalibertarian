import { Link } from "react-router-dom";
import { CitationChip, CitationFootnote } from "../components/CitationChip";
import { HeadSplit } from "../components/HeadSplit";
import { Money } from "../components/Money";
import { pickAmount } from "../data/maharashtra-police";
import { up2055Voted, up4055, upFunctional, upSalariesDesk, upUniforms } from "../data/uttar-pradesh/police";

export function UpPolicePage() {
  const hero = pickAmount(upFunctional, "2026-27", "be");
  const run = pickAmount(up2055Voted, "2026-27", "be");
  const cap = pickAmount(up4055, "2026-27", "be");
  const sal = pickAmount(upSalariesDesk, "2026-27", "be");
  const uni = pickAmount(upUniforms, "2026-27", "be");
  if (!hero || !run || !cap || !sal || !uni) throw new Error("Missing UP gold figures");

  return (
    <article>
      <p className="kicker">GOLD · Grant 26 · official book</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        Uttar Pradesh Police
      </h1>
      <p className="mt-3 max-w-2xl text-ink">
        Grant 26 Home (Police). Headline is <strong>2055 voted printed</strong> plus{" "}
        <strong>4055 printed योग</strong> for FY 2026-27 budget. Not the PRS AFS envelope.
      </p>
      <div className="mt-8 border-y border-ink/20 py-8">
        <p className="kicker text-ink/50">Budget · FY 2026-27</p>
        <div className="mt-3">
          <Money money={hero} size="hero" showSeries />
        </div>
      </div>
      <HeadSplit
        run={run}
        cap={cap}
        title="2055 voted and 4055 printed"
        note="Same Grant 26, same year. 2055 here is the voted printed total, not a desk-sum."
        runLabel="2055 voted printed"
        capLabel="4055 printed योग"
      />
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Depth (not the hero)</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink/70">
          Object 01 salaries is a <strong>desk-sum</strong> of printed object lines — smaller than
          2055 voted printed. Object 22 in this grant is hospitality, not arms.
        </p>
        <dl className="mt-4 max-w-xl divide-y divide-ink/15 border-y border-ink/20 text-sm">
          <div className="flex justify-between gap-4 py-2.5">
            <dt>2055-01 वेतन (desk-sum)</dt>
            <dd>
              <Money money={sal} size="row" />
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt>Uniforms · object 51 वर्दी</dt>
            <dd>
              <Money money={uni} size="row" />
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-ink/65">
          Arms named object: <strong>not found</strong>.
          <CitationChip citationId={hero.citationId} />
        </p>
      </section>
      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          <CitationFootnote citationId={hero.citationId} />
        </ol>
        <p className="mt-6">
          INDEX envelope (PRS): <Link to="/states">States</Link>. Method: <Link to="/sources">Sources</Link>.
        </p>
      </section>
    </article>
  );
}
