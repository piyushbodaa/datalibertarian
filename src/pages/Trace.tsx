import { Link, Navigate, useParams } from "react-router-dom";
import { TraceRail, type TraceStop } from "../components/TraceRail";
import { pickAmount, type Money } from "../data/maharashtra-police";
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
  const civicTotal = be(side.bag["civic-total"]);
  const civicRun = be(side.bag["civic-revenue"]);
  const civicCap = be(side.bag["civic-capital"]);
  const gramRun = be(side.bag["2515"]);
  const gramCap = be(side.bag["4515"]);
  const health = be(side.bag["health-functional"]);
  const healthRun = be(side.bag["health-run"]);
  const healthCap = be(side.bag["health-cap"]);

  const stop = (id: string, label: string, money: Money | undefined, empty: string): TraceStop =>
    money ? { id, label, money } : { id, label, empty };

  const bookLayer = side.entity.layer;
  const stops: TraceStop[] =
    bookLayer === "municipal"
      ? [
          { id: "book", label: "Book", detail: side.entity.name },
          stop("civic-total", "City budget", civicTotal, "Not printed as a budget size in this book."),
          stop("civic-revenue", "Running the city", civicRun, "Not isolated in this book."),
          stop("civic-capital", "Building the city", civicCap, "Not isolated in this book."),
          { id: "ward", label: "Named ward", empty: "The book stops here. We do not divide a total by the number of wards." },
        ]
      : bookLayer === "gram"
        ? [
            { id: "book", label: "Book", detail: side.entity.name },
            stop("2515", "Village programmes", gramRun, "Not isolated in this book."),
            stop("4515", "Village works", gramCap, "Not isolated in this book."),
            { id: "gp", label: "Named gram panchayat", empty: "The book stops here. We do not divide a total by the number of panchayats." },
          ]
        : [
            { id: "book", label: "Book", detail: side.entity.name },
            stop("functional", "Police", functional, "Not printed as a police total in this book."),
            stop("2055", "Running costs", run, "Not isolated in this book."),
            stop("4055", "Buildings and gear", cap, "Not isolated in this book."),
            stop("109", "District police", district, "Not typed in this book."),
            stop("obj", "Salaries", obj, "A statewide salaries total is not typed here."),
            {
              id: "station",
              label: "Named police station",
              empty: "The book stops here. We do not divide a total by the number of stations.",
            },
            ...(health || healthRun || healthCap
              ? [
                  stop("health", "Health", health, "Not printed as a health total in this book."),
                  stop("health-run", "Running hospitals", healthRun, "Not isolated in this book."),
                  stop("health-cap", "Hospital buildings and gear", healthCap, "Not isolated in this book."),
                ]
              : []),
          ];

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
        <TraceRail title="Where this book stops" stops={stops} />
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
