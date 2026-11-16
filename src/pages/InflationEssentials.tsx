import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import snapshot from "../data/inflation/private-snapshot.json";
import { calculateBasket } from "../data/inflation/private-index";
import { formatDay } from "../data/inflation/yoy";

const { metadata, rows, official } = snapshot;
const published = calculateBasket(rows);
const number = (n: number | null, digits = 2) =>
  n === null
    ? "Unavailable"
    : n.toLocaleString("en-IN", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
const percent = (n: number | null) =>
  n === null ? "Unavailable" : `${n > 0 ? "+" : ""}${number(n)}%`;
const money = (n: number | null) =>
  n === null ? "Unavailable" : `₹${number(n)}`;
const signClass = (n: number | null) =>
  n !== null && n < 0 ? "price-fall" : "price-rise";
const defaultSpending = () =>
  Object.fromEntries(rows.map((row) => [row.id, "100"]));
const categoryNames: Record<string, string> = {
  grains: "Grains",
  pulses: "Pulses",
  oils: "Edible oils",
  veg: "Vegetables",
  vegetables: "Vegetables",
  dairy: "Dairy",
  sugar: "Sugar & gur",
  other: "Other essentials",
};

export function InflationEssentialsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("basket");
  const [spending, setSpending] =
    useState<Record<string, string>>(defaultSpending);
  const [stale, setStale] = useState(false);
  useEffect(() => {
    setStale(
      Date.now() - Date.parse(`${metadata.asOf}T00:00:00+05:30`) >
        14 * 86400000,
    );
  }, []);
  const personal = useMemo(
    () =>
      calculateBasket(
        rows,
        Object.fromEntries(
          Object.entries(spending).map(([id, value]) => [
            id,
            value.trim() === "" ? NaN : Number(value),
          ]),
        ),
      ),
    [spending],
  );
  const visible = useMemo(() => {
    const filtered = rows.filter(
      (row) =>
        (category === "all" || row.category === category) &&
        row.name.toLowerCase().includes(query.trim().toLowerCase()),
    );
    if (sort !== "basket")
      filtered.sort(
        (a, b) =>
          (a.current / a.yearAgo - b.current / b.yearAgo) *
          (sort === "rises" ? -1 : 1),
      );
    return filtered;
  }, [query, category, sort]);
  const drivers = [...published.contributions]
    .sort(
      (a, b) =>
        Math.abs(b.contributionPp ?? 0) - Math.abs(a.contributionPp ?? 0),
    )
    .slice(0, 6);
  const maxDriver = Math.max(
    0.01,
    ...drivers.map((d) => Math.abs(d.contributionPp ?? 0)),
  );
  const levels = [
    { date: metadata.yearAgo, value: 100, label: "Base" },
    {
      date: metadata.monthAgo,
      value:
        published.monthCost === null || published.baseCost === null
          ? null
          : (published.monthCost / published.baseCost) * 100,
      label: "Previous month",
    },
    {
      date: metadata.asOf,
      value: published.index,
      label: "Latest observation",
    },
  ];
  const maxLevel = Math.max(100, ...levels.map((l) => l.value ?? 0)) * 1.05;

  return (
    <article className="inflation-page">
      <p className="mb-6 border-b border-[var(--rule)] pb-4 text-xs text-ink/70">Archived grocery experiment · <Link to="/inflation">Open the full 358-item CPI comparison →</Link></p>
      <header className="inflation-heading">
        <div className="flex flex-wrap items-center gap-3">
          <p className="kicker">DATA LIBERTARIAN · INDIA</p>
          <span className="index-badge">Archived experiment · v1</span>
        </div>
        <h1>
          What does the same
          <br className="hidden sm:block" /> basket cost now?
        </h1>
        <p className="index-intro">
          The Data Libertarian Essentials Index tracks the cost of a fixed
          basket of 22 everyday groceries. Every price, weight, and calculation
          is open to inspection.
        </p>
        <noscript>
          <p className="index-scope mt-4">
            The calculator and filters need JavaScript. Published figures, the
            full price table, and downloads remain available.
          </p>
        </noscript>
        <nav aria-label="Inflation page sections" className="index-links">
          <a href="#index">The index ↓</a>
          <a href="#basket">All 22 prices ↓</a>
          <a href="#your-basket">Use your spending ↓</a>
          <Link to="/inflation/essentials-method">Methodology ↗</Link>
        </nav>
      </header>

      <section id="index" className="index-hero" aria-labelledby="index-title">
        <div className="index-headline">
          <p className="kicker" id="index-title">
            ESSENTIALS BASKET · YEAR-ON-YEAR
          </p>
          <p className="index-number" data-testid="published-yoy">
            {percent(published.yoyPct)}
          </p>
          <p className="index-period">
            {formatDay(metadata.yearAgo)} → {formatDay(metadata.asOf)}
          </p>
          <p className="index-definition">
            Equal spending on each item at the start, with quantities then held
            fixed. Independently calculated from Department of Consumer Affairs
            retail averages.
          </p>
          <div className="index-substats">
            <div>
              <span>Index level</span>
              <strong>{number(published.index)}</strong>
              <small>{formatDay(metadata.yearAgo)} = 100</small>
            </div>
            <div>
              <span>One-month change</span>
              <strong>{percent(published.momPct)}</strong>
              <small>
                {formatDay(metadata.monthAgo)} → {formatDay(metadata.asOf)}
              </small>
            </div>
          </div>
        </div>
        <div className="index-cost">
          <p className="kicker">BUYING THE SAME QUANTITIES</p>
          <h2>
            {money(published.baseCost)} then.
            <br />
            <span>{money(published.currentCost)} now.</span>
          </h2>
          <p>
            Start with ₹100 of each commodity at the year-ago price. This is a
            reference basket, not a typical family’s monthly budget.
          </p>
          <div className="index-cost-rule" />
          <dl>
            <div>
              <dt>Price pairs available</dt>
              <dd>{published.coverage.matchedCount} / 22</dd>
            </div>
            <div>
              <dt>Weight per commodity</dt>
              <dd>{number(100 / rows.length)}%</dd>
            </div>
            <div>
              <dt>Collection</dt>
              <dd>Government price monitors</dd>
            </div>
            <div>
              <dt>Calculation & publication</dt>
              <dd>Data Libertarian</dd>
            </div>
          </dl>
        </div>
      </section>
      <p className="index-datestamp">
        Dated release: {formatDay(metadata.asOf)} · Daily price snapshots, not
        monthly averages.{" "}
        {stale ? (
          <strong>
            This release is more than 14 days old; it is not a live reading.
          </strong>
        ) : (
          "The page updates when a new source snapshot is reviewed."
        )}
      </p>
      <aside className="index-scope">
        <strong>What this measures.</strong> Price change in these 22 groceries
        across reporting centres. It does not measure rent, healthcare,
        education, transport, or India’s full cost of living. Equal weights are
        a design choice: six oils together receive 27.27% of base spending. A
        different result from CPI is not, by itself, evidence that CPI is wrong.
      </aside>

      <div className="index-chart-grid">
        <section className="index-panel" aria-labelledby="drivers-title">
          <p className="kicker">WHAT MOVED THE BASKET</p>
          <h2 id="drivers-title">The largest contributors</h2>
          <p className="index-caption">
            Six largest contributions by absolute size. Percentage points of the
            published annual change.
          </p>
          <div className="driver-list">
            {drivers.map((driver) => (
              <div className="driver-row" key={driver.id}>
                <div>
                  <span>{rows.find((row) => row.id === driver.id)?.name}</span>
                  <strong className={signClass(driver.contributionPp)}>
                    {driver.contributionPp !== null && driver.contributionPp > 0
                      ? "+"
                      : ""}
                    {number(driver.contributionPp)} pp
                  </strong>
                </div>
                <div className="driver-track" aria-hidden="true">
                  <span
                    style={{
                      left:
                        (driver.contributionPp ?? 0) < 0
                          ? `${50 - (Math.abs(driver.contributionPp ?? 0) / maxDriver) * 50}%`
                          : "50%",
                      width: `${(Math.abs(driver.contributionPp ?? 0) / maxDriver) * 50}%`,
                      background:
                        (driver.contributionPp ?? 0) < 0
                          ? "#2f6b47"
                          : "#a13a2f",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="index-panel" aria-labelledby="levels-title">
          <p className="kicker">ONE BASKET, THREE OBSERVATIONS</p>
          <h2 id="levels-title">The cost in index points</h2>
          <p className="index-caption">
            The same base quantities at each date. These observations do not
            form a continuous time series.
          </p>
          <div className="level-list">
            {levels.map((level) => (
              <div key={level.date}>
                <div className="level-label">
                  <span>
                    {formatDay(level.date)} <small>{level.label}</small>
                  </span>
                  <strong>{number(level.value)}</strong>
                </div>
                <div className="level-track">
                  <span
                    style={{
                      width: `${((level.value ?? 0) / maxLevel) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="index-caption mt-5">
            Scale starts at zero. Base = 100.
          </p>
        </section>
      </div>

      <section id="basket" className="index-section">
        <div className="index-section-heading">
          <div>
            <p className="kicker">THE EVIDENCE</p>
            <h2>Every item. Every price.</h2>
          </div>
          <a
            className="index-download"
            href="/data/inflation/private-index.csv"
            download
          >
            Download the basket CSV ↓
          </a>
        </div>
        <p className="index-caption">
          All-India average retail prices in rupees per stated unit. Oils are
          per kilogram; milk is per litre. Changes use unrounded calculations.
          On a small screen, scroll the table sideways.
        </p>
        <div className="index-filters">
          <label>
            Find an item
            <input
              type="search"
              className="field"
              placeholder="Try rice or onion"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label>
            Category
            <select
              className="field"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All categories</option>
              {[...new Set(rows.map((row) => row.category))].map((cat) => (
                <option key={cat} value={cat}>
                  {categoryNames[cat] ?? cat}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sort by
            <select
              className="field"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="basket">Basket order</option>
              <option value="rises">Largest rises</option>
              <option value="falls">Largest falls</option>
            </select>
          </label>
        </div>
        <div
          className="ledger-scroll"
          tabIndex={0}
          role="region"
          aria-label="Retail prices table, scroll horizontally on small screens"
        >
          <table className="index-table">
            <caption className="sr-only">
              Published essentials basket: {formatDay(metadata.yearAgo)} to{" "}
              {formatDay(metadata.asOf)}. Source: Department of Consumer
              Affairs.
            </caption>
            <thead>
              <tr>
                <th scope="col">Commodity / unit</th>
                <th scope="col">{formatDay(metadata.yearAgo)}</th>
                <th scope="col">{formatDay(metadata.monthAgo)}</th>
                <th scope="col">{formatDay(metadata.asOf)}</th>
                <th scope="col">Annual change</th>
                <th scope="col">Contribution</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const change = (row.current / row.yearAgo - 1) * 100;
                return (
                  <tr key={row.id}>
                    <th scope="row">
                      {row.name}
                      <small>₹ / {row.unit}</small>
                    </th>
                    <td>{number(row.yearAgo)}</td>
                    <td>{number(row.monthAgo)}</td>
                    <td className="font-semibold">{number(row.current)}</td>
                    <td className={signClass(change)}>{percent(change)}</td>
                    <td>{number(change / rows.length)} pp</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 ? (
            <p className="p-6" role="status">
              No commodities match this filter.
            </p>
          ) : null}
        </div>
        <p className="index-caption mt-3">
          {visible.length} of {rows.length} commodities shown · Each has{" "}
          {number(100 / rows.length)}% of base expenditure.{" "}
          <a href={metadata.sourceUrl} target="_blank" rel="noreferrer">
            Read the original price report ↗
          </a>
        </p>
      </section>

      <section id="your-basket" className="index-section personal-section">
        <div className="index-section-heading">
          <div>
            <p className="kicker">YOUR SPENDING, YOUR WEIGHTS</p>
            <h2>A different basket changes the answer.</h2>
          </div>
        </div>
        <p className="index-caption max-w-3xl">
          Enter what you spent on each item in the base period,{" "}
          {formatDay(metadata.yearAgo)}. We price those same quantities today
          using the national averages above. Enter zero for items you do not
          buy. This estimates your grocery basket’s change, not your personal
          total inflation.
        </p>
        <div
          className="personal-result"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {personal.status === "ok" ? (
            <>
              <div>
                <span>Your basket’s annual change</span>
                <strong data-testid="personal-yoy">
                  {percent(personal.yoyPct)}
                </strong>
              </div>
              <div>
                <span>Same quantities, repriced</span>
                <strong>
                  {money(personal.baseCost)} → {money(personal.currentCost)}
                </strong>
              </div>
            </>
          ) : (
            <p>
              {personal.status === "empty"
                ? "Enter a positive base-period spend for at least one item."
                : "Enter a valid non-negative amount for every item. Use 0 to exclude it; blank or missing values cannot be calculated."}
            </p>
          )}
        </div>
        <details className="spending-editor">
          <summary>
            Edit your 22 spending amounts <span>₹ in the base period</span>
          </summary>
          <div className="spending-inputs">
            {rows.map((row) => (
              <label key={row.id} htmlFor={`spend-${row.id}`}>
                {row.name}
                <input
                  id={`spend-${row.id}`}
                  className="field"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="100000000"
                  step="any"
                  value={spending[row.id]}
                  onChange={(e) =>
                    setSpending((old) => ({ ...old, [row.id]: e.target.value }))
                  }
                />
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 pb-5">
            <button
              className="live-tag"
              type="button"
              onClick={() => setSpending(defaultSpending())}
            >
              Reset to ₹100 each
            </button>
            <button
              className="live-tag"
              type="button"
              onClick={() =>
                setSpending(
                  Object.fromEntries(rows.map((row) => [row.id, "0"])),
                )
              }
            >
              Set all to zero
            </button>
          </div>
        </details>
        <p className="index-caption mt-3">
          Amounts stay in this page and reset on reload. Your changes do not
          alter the published index.
        </p>
      </section>

      <section className="index-section official-context">
        <p className="kicker">OFFICIAL SERIES · CONTEXT</p>
        <h2>How does this relate to CPI?</h2>
        <div className="official-grid">
          <div>
            <span>All-items CPI</span>
            <strong>{number(official.headlineYoy)}%</strong>
            <small>October 2026 · year-on-year</small>
          </div>
          <div>
            <span>Consumer Food Price Index</span>
            <strong>{number(official.foodYoy)}%</strong>
            <small>October 2026 · year-on-year</small>
          </div>
          <p>
            MoSPI’s monthly indices use a different basket, weighting system,
            and observation window. Both figures are provisional, on base
            2024=100. Our 16 November grocery snapshot cannot establish how much
            CPI overstates or understates inflation.{" "}
            <a href={official.sourceUrl} target="_blank" rel="noreferrer">
              Read the official release ↗
            </a>
          </p>
        </div>
      </section>

      <section className="index-section index-sources">
        <div>
          <p className="kicker">OPEN METHODS</p>
          <h2>Reproduce the result.</h2>
          <p>
            Download the prices and fixed weights, inspect the archived source,
            or follow the formula. The published release is a dated snapshot
            with an explicit version.
          </p>
          <Link className="file-cta" to="/inflation/essentials-method">
            Read the complete methodology →
          </Link>
        </div>
        <div className="source-links">
          <a href="/data/inflation/private-index.json" download>
            Data, weights & calculation <span>JSON ↓</span>
          </a>
          <a href="/data/inflation/private-index.csv" download>
            Price and contribution ledger <span>CSV ↓</span>
          </a>
          <a href={metadata.sourceArchive} download>
            Archived price report <span>Source ↓</span>
          </a>
          <a href="https://github.com/piyushbodaa/datalibertarian/tree/main/inflation">
            Collection & revision procedure <span>GitHub ↗</span>
          </a>
          <Link to="/inflation/food">
            Earlier price monitor <span>Sep 2026 archive →</span>
          </Link>
        </div>
      </section>
    </article>
  );
}
