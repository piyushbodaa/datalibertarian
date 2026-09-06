import { Link } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";
import { HeadSplit } from "../components/HeadSplit";
import { Money } from "../components/Money";
import { pickAmount } from "../data/maharashtra-police";
import {
  wb2055Gross,
  wb2055Net,
  wb4055,
  wbArms,
  wbClothing,
  wbFunctional,
  wbSalariesDesk,
} from "../data/west-bengal/police";

export function WbPolicePage() {
  const hero = pickAmount(wbFunctional, "2026-27", "be");
  const run = pickAmount(wb2055Net, "2026-27", "be");
  const cap = pickAmount(wb4055, "2026-27", "be");
  const gross = pickAmount(wb2055Gross, "2026-27", "be");
  const sal = pickAmount(wbSalariesDesk, "2026-27", "be");
  const arms = pickAmount(wbArms, "2026-27", "be");
  const cloth = pickAmount(wbClothing, "2026-27", "be");
  if (!hero || !run || !cap || !gross || !sal || !arms || !cloth) {
    throw new Error("Missing WB gold figures");
  }

  return (
    <article>
      <p className="kicker">GOLD · Demand 68 slices · official book</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
        West Bengal Police
      </h1>
      <p className="mt-3 max-w-2xl text-ink">
        Heads <strong>2055 net</strong> and <strong>4055</strong> from Demand 68 only — not the
        whole Home and Hill Affairs demand. Kolkata/HQ salaries sit inside statewide object 01.
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
        title="2055 net and 4055"
        note="Same Demand 68 slices. 2055 gross is ₹13,806.83 crore; net is used in the hero."
        runLabel="2055 net"
        capLabel="4055"
      />
      <p className="mt-3 text-sm text-ink/70">
        2055 gross: <Money money={gross} size="row" />
      </p>
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Depth (not the hero)</h2>
        <dl className="mt-4 max-w-xl divide-y divide-ink/15 border-y border-ink/20 text-sm">
          <div className="flex justify-between gap-4 py-2.5">
            <dt>2055-01 salaries (desk-sum)</dt>
            <dd>
              <Money money={sal} size="row" />
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt>Arms · object 22</dt>
            <dd>
              <Money money={arms} size="row" />
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt>Clothing · object 25</dt>
            <dd>
              <Money money={cloth} size="row" />
            </dd>
          </div>
        </dl>
      </section>
      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          <CitationFootnote citationId={hero.citationId} />
        </ol>
        <p className="mt-6">
          <Link to="/states">States INDEX</Link> · <Link to="/sources">Sources</Link>
        </p>
      </section>
    </article>
  );
}
