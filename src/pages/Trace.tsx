import { Link, Navigate, useParams } from "react-router-dom";
import { TraceRail } from "../components/TraceRail";
import { pickAmount } from "../data/maharashtra-police";
import { resolveSide } from "../data/compare/resolve";

export function TracePage() {
  const { slug, layer } = useParams();
  const id = slug ?? layer;
  const side = id ? resolveSide(id) : undefined;
  if (!id) return <Navigate to="/compare" replace />;
  if (!side) return <Navigate to="/states" replace />;

  const be = (item: typeof side.bag["police-functional"]) =>
    item ? pickAmount(item, "2026-27", "be") ?? pickAmount(item, "2025-26", "be") ?? item.amounts[0] : undefined;

  const functional = be(side.bag["police-functional"]);
  const run = be(side.bag["2055"]);
  const cap = be(side.bag["4055"]);
  const obj = be(side.bag["obj-01"]);
  const district = be(side.bag["109"]);

  return (
    <article>
      <p className="kicker">Trace · where this book stops</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">{side.entity.name}</h1>
      <p className="mt-3 max-w-2xl text-ink">
        A rail of printed grains. Dashed stops are not printed. We do not draw arrows between two
        states — Compare does that.
      </p>
      {side.tier !== "gold" ? (
        <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
          <p className="kicker text-ochre">{side.tier}</p>
          <p className="mt-2 text-sm text-ink/75">{side.note ?? "No GOLD ledger typed for this book."}</p>
        </section>
      ) : (
        <TraceRail
          title="Where this book stops"
          stops={[
            { id: "book", label: "Book", detail: side.entity.name },
            functional
              ? { id: "functional", label: "Police functional", money: functional }
              : { id: "functional", label: "Police functional", empty: "Not printed as a functional Police total on this machine." },
            run
              ? { id: "2055", label: "2055 running costs", money: run }
              : { id: "2055", label: "2055 running costs", empty: "Not isolated in this book." },
            cap
              ? { id: "4055", label: "4055 capital", money: cap }
              : { id: "4055", label: "4055 capital", empty: "Not isolated in this book." },
            district
              ? { id: "109", label: "109 District Police", money: district }
              : { id: "109", label: "109 District Police", empty: "Minor head not typed." },
            obj
              ? { id: "obj", label: "Object 01 salaries", money: obj, detail: "Desk-sum if so labelled on the ledger." }
              : {
                  id: "obj",
                  label: "Object 01 salaries",
                  empty: "Object heads not typed as a statewide योग.",
                },
            {
              id: "station",
              label: "Named police station / GP",
              empty: "The book stops here. We do not divide a total by N stations or N panchayats.",
            },
          ]}
        />
      )}
      <p className="mt-8">
        <Link to={side.entity.href} className="file-cta">
          <span className="file-cta-notch" aria-hidden="true" />
          Open the ledger
        </Link>
      </p>
      <p className="mt-6 text-sm">
        <Link to={`/compare?left=${side.entity.slug}`}>Compare this book</Link>
        {" · "}
        <Link to="/sources">Method</Link>
      </p>
    </article>
  );
}
