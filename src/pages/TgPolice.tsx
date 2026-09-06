import { Link } from "react-router-dom";
import { CitationFootnote } from "../components/CitationChip";
import { Money } from "../components/Money";
import { pickAmount } from "../data/maharashtra-police";
import { TraceRail } from "../components/TraceRail";
import { tgArms220, tgCity4055, tgObject010 } from "../data/telangana/police";

export function TgPolicePage() {
  const hero = pickAmount(tgObject010, "2026-27", "be");
  const prior = pickAmount(tgObject010, "2025-26", "be");
  const arms = pickAmount(tgArms220, "2026-27", "be");
  const city = pickAmount(tgCity4055, "2026-27", "be");
  if (!hero || !prior || !arms || !city) throw new Error("Missing TG gold figures");

  return (
    <article>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Telangana Police</h1>
      <p className="mt-3 max-w-2xl text-ink">
        What the state budget set aside for police pay and related running lines. Not the whole
        Home department. Hyderabad city police is not added in.
      </p>
      <div className="mt-8 border-y border-ink/20 py-8">
        <p className="text-sm text-ink/55">2026-27 plan</p>
        <div className="mt-3">
          <Money money={hero} size="hero" />
        </div>
        <p className="mt-4 text-sm text-ink/70">
          Same line, 2025-26 plan: <Money money={prior} size="row" />
        </p>
      </div>
      <dl className="mt-8 max-w-xl divide-y divide-ink/15 border-y border-ink/20 text-sm">
        <div className="flex justify-between gap-4 py-2.5">
          <dt>Arms</dt>
          <dd>
            <Money money={arms} size="row" />
          </dd>
        </div>
        <div className="flex justify-between gap-4 py-2.5">
          <dt>City police buildings (city only, not the state total)</dt>
          <dd className="shrink-0">
            <Money money={city} size="row" />
          </dd>
        </div>
      </dl>
      <TraceRail
        stops={[
          { id: "book", label: "Book", detail: "Telangana state budget, Law and Home, 2026-27" },
          { id: "object", label: "Police pay (added from printed lines)", money: hero },
          { id: "unit", label: "City police books", detail: "Separate ledgers. Not added into this statewide line." },
          {
            id: "station",
            label: "Named police station",
            empty: "The book prints city-police office totals. Named stations are not in it. We do not divide an office total by the number of stations.",
          },
        ]}
      />

      <p className="mt-8">
        <Link to="/telangana/commissionerates" className="file-cta">
          <span className="file-cta-notch" aria-hidden="true" />
          City police books
        </Link>
      </p>

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">The Home grant is not only police</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink/70">
          Home Department printed totals (₹10,188.01 crore in 2025-26 and ₹11,906.83 crore in
          2026-27) include more than Police. They are not shown as the Police number. Hyderabad
          city police is not added into this statewide line.
        </p>
      </section>
      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          <CitationFootnote citationId={hero.citationId} />
        </ol>
        <p className="mt-6">
          In this book the police line is pay, added from printed lines.{" "}
          <Link to="/states">All states</Link>
          {" · "}
          <Link to="/sources">Method</Link>
        </p>
      </section>
    </article>
  );
}
