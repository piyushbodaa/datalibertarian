import { Link, Navigate, useParams } from "react-router-dom";
import { TraceRail } from "../components/TraceRail";
import { pickAmount } from "../data/maharashtra-police";
import { resolveSide } from "../data/compare/resolve";
import { tierLabel } from "../data/states";

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
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">{side.entity.name}</h1>
      <p className="mt-3 max-w-2xl text-ink">
        How far this book goes. A blank stop means the book did not print that line — not that it
        spent zero.
      </p>
      {side.tier !== "gold" ? (
        <section className="carbon-sheet mt-8 px-4 py-6 sm:px-6">
          <h2 className="mt-2 font-display text-xl font-semibold">{tierLabel(side.tier)}</h2>
          <p className="mt-2 text-sm text-ink/75">
            {side.note ?? "We have not read this book yet."}
          </p>
        </section>
      ) : (
        <TraceRail
          title="Where this book stops"
          stops={[
            { id: "book", label: "Book", detail: side.entity.name },
            functional
              ? { id: "functional", label: "Police", money: functional }
              : { id: "functional", label: "Police", empty: "Not printed as a police total in this book." },
            run
              ? { id: "2055", label: "Running costs", money: run }
              : { id: "2055", label: "Running costs", empty: "Not isolated in this book." },
            cap
              ? { id: "4055", label: "Buildings and gear", money: cap }
              : { id: "4055", label: "Buildings and gear", empty: "Not isolated in this book." },
            district
              ? { id: "109", label: "District police", money: district }
              : { id: "109", label: "District police", empty: "Not typed in this book." },
            obj
              ? { id: "obj", label: "Salaries", money: obj }
              : { id: "obj", label: "Salaries", empty: "A statewide salaries total is not typed here." },
            {
              id: "station",
              label: "Named police station",
              empty: "The book stops here. We do not divide a total by the number of stations.",
            },
          ]}
        />
      )}
      <p className="mt-8">
        <Link to={side.entity.href} className="file-cta">
          <span className="file-cta-notch" aria-hidden="true" />
          Open this book
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
