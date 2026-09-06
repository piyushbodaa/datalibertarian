import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <article>
      <p className="kicker">Carbon docket · India</p>
      <h1 className="mt-2 max-w-3xl font-display text-[2.05rem] font-semibold leading-[1.12] tracking-tight sm:text-5xl">
        Government money is your money. The books are public. They are not readable.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink sm:text-lg">
        Data Libertarian opens official government accounts so an ordinary person can see where a
        rupee was put. This is not a tracker of charities or NGOs. Three sets of books: the Union,
        the states, and municipal corporations.
      </p>

      <nav className="mt-10 grid gap-0 border-y border-ink/20" aria-label="Budget doors">
        <Door
          to="/union"
          kicker="Centre"
          title="Union Government"
          body="The Union Budget. First ledger: Demand 51 Police — Central Armed Police Forces, Delhi Police, the Intelligence Bureau. Not the states’ police books."
        />
        <Door
          to="/states"
          kicker="States and Union Territories"
          title="State Governments"
          body="Each state’s own budget. Maharashtra Police is live. Other states are listed; we do not invent a number before the White Book is typed."
        />
        <Door
          to="/municipal"
          kicker="Cities"
          title="Municipal Corporations"
          body="Civic books — water, roads, schools. City police in India is usually state police, not the corporation. No municipal totals until a city’s PDFs are read."
        />
      </nav>

      <p className="mt-10 max-w-2xl text-sm text-ink/65">
        A rupee is voted, revised, or booked — those labels stay on the number. Worked example:{" "}
        <Link to="/maharashtra/police">Maharashtra Police</Link>.{" "}
        <Link to="/sources">How the books are read</Link>.
      </p>
    </article>
  );
}

function Door({
  to,
  kicker,
  title,
  body,
}: {
  to: string;
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      to={to}
      className="group block border-b border-ink/15 py-6 no-underline last:border-b-0 text-ink hover:text-ink"
    >
      <p className="kicker">{kicker}</p>
      <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight group-hover:text-rust">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-ink/75">{body}</p>
      <p className="file-cta mt-4">
        <span className="file-cta-notch" aria-hidden="true" />
        Open this door
      </p>
    </Link>
  );
}
