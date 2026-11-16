import { useState } from "react";
import { Link } from "react-router-dom";
import basket from "../data/inflation/cpi-basket.json";
import official from "../data/inflation/cpi-official.json";
import observations from "../data/inflation/independent-quotes.json";
import {
  auditReplicaCoverage,
  type IndexSector,
} from "../data/inflation/cpi-replica";

const pct = (n: number | null, digits = 2) =>
  n === null ? "Unavailable" : `${n > 0 ? "+" : ""}${n.toFixed(digits)}%`;
const weight = (n: number) => `${n.toFixed(3)}%`;
const number = (n: number | null) => (n === null ? "—" : n.toFixed(2));
const rupees = (n: number) =>
  `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const sectors: { id: IndexSector; label: string }[] = [
  { id: "combined", label: "All India" },
  { id: "rural", label: "Rural" },
  { id: "urban", label: "Urban" },
];
const officialByKey = new Map(
  official.rows.map((row) => [`${row.sector}:${row.code}`, row]),
);
type Quote = (typeof observations.quotes)[number];
const quotesByItem = new Map<string, Quote[]>();
for (const quote of observations.quotes)
  quotesByItem.set(quote.itemCode, [
    ...(quotesByItem.get(quote.itemCode) ?? []),
    quote,
  ]);

function QuoteCard({ quote }: { quote: Quote }) {
  const comparison = quote.matchedAnnualComparison;
  return (
    <div className="cpi-quote">
      <div className="cpi-quote-price">
        <strong>{rupees(quote.price)}</strong>
        <span>
          for {quote.quantity} {quote.unit}
        </span>
      </div>
      <p className="cpi-product">{quote.productName}</p>
      <p className="cpi-small">
        {quote.provider} · {quote.location}
      </p>
      <p className="cpi-small">
        Retrieved {quote.observedAt.slice(0, 10)} · {quote.priceReferencePeriod}
      </p>
      <p className="cpi-small">{quote.taxes}</p>
      <p className="cpi-small">{quote.discounts}</p>
      <p className="cpi-small">{quote.deliveryCharges}</p>
      {"sourceFreshness" in quote && (
        <p className="cpi-small">{quote.sourceFreshness}</p>
      )}
      {comparison && (
        <div className="cpi-provider-comparison">
          <p className="cpi-label">PROVIDER-LEVEL PRICE CHANGE</p>
          <strong>
            {rupees(comparison.previousPrice)} →{" "}
            {rupees(comparison.currentPrice)}{" "}
            <span>{pct(comparison.changePct)}</span>
          </strong>
          <p>
            {comparison.previousPeriod} → {comparison.currentPeriod} · per{" "}
            {comparison.unit}
          </p>
          <p>{comparison.interpretation}</p>
          <p>{comparison.limitations.join(". ")}.</p>
        </div>
      )}
      <div className="cpi-quote-links">
        <a href={quote.sourceUrl} target="_blank" rel="noreferrer">
          Price source ↗
        </a>
        <a href={quote.sourceArchive}>
          {quote.evidenceType === "complete-fetched-html"
            ? "Archived page"
            : quote.evidenceType === "complete-fetched-pdf"
              ? "Archived PDF"
              : "Transcribed source facts"}
        </a>
      </div>
    </div>
  );
}

export function InflationPage() {
  const [sector, setSector] = useState<IndexSector>("combined");
  const [query, setQuery] = useState("");
  const [division, setDivision] = useState("");
  const [evidenceFilter, setEvidenceFilter] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [expansionVersion, setExpansionVersion] = useState(0);
  const headline = officialByKey.get(`${sector}:general`)!;
  const audit = auditReplicaCoverage(
    basket.items,
    [],
    official.metadata.period,
    sector,
  );
  const quotedItems = basket.items.filter((item) =>
    quotesByItem.has(item.code),
  );
  const queryText = query.trim().toLowerCase();
  const shownItems = basket.items.filter(
    (item) =>
      (!division || item.division.code === division) &&
      (!queryText ||
        `${item.name} ${item.code} ${item.division.name} ${(quotesByItem.get(item.code) ?? []).map((q) => `${q.productName} ${q.provider}`).join(" ")}`
          .toLowerCase()
          .includes(queryText)) &&
      (!evidenceFilter ||
        (evidenceFilter === "quoted"
          ? quotesByItem.has(item.code)
          : !quotesByItem.has(item.code))),
  );
  const filtering = Boolean(queryText || division || evidenceFilter);
  const toggleAll = () => {
    setExpanded(!expanded);
    setExpansionVersion(expansionVersion + 1);
  };
  return (
    <div className="cpi-page">
      <header className="cpi-intro">
        <div className="cpi-eyebrow">
          <span>THE INFLATION AUDIT</span>
          <span>358 ITEMS · BASE 2024</span>
        </div>
        <h1>
          One basket.
          <br />
          <span>Two price records.</span>
        </h1>
        <p>
          India’s entire consumer price basket, side by side. The government’s
          published CPI on the left. Independent retail and service-provider
          evidence on the right, mapped to the same expenditure categories and
          weights.
        </p>
        <div className="cpi-links">
          <a href="#whole-basket">Explore all 358 items ↓</a>
          <Link to="/inflation/method">How the index is built</Link>
          <a href="/data/inflation/cpi-ledger.csv" download>
            Download the full ledger ↗
          </a>
        </div>
      </header>

      <div className="cpi-context">
        <div>
          <span className="cpi-dot" /> October 2026 vs October 2025{" "}
          <span className="cpi-muted">· Official release provisional</span>
        </div>
        <div className="cpi-sector" role="group" aria-label="CPI sector">
          {sectors.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={sector === s.id}
              onClick={() => setSector(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <section
        className="cpi-comparison"
        aria-label="Official and independent CPI comparison"
      >
        <div className="cpi-half cpi-government">
          <p className="cpi-label">01 / GOVERNMENT CPI</p>
          <h2>Published inflation</h2>
          <div className="cpi-headline-number" data-testid="official-yoy">
            {pct(headline.yoy)}
          </div>
          <p className="cpi-period">
            Year-on-year · {sector === "combined" ? "Rural + urban" : sector}
          </p>
          <div className="cpi-stats">
            <div>
              <span>October 2025</span>
              <strong>{number(headline.previousIndex)}</strong>
            </div>
            <div>
              <span>October 2026</span>
              <strong>{number(headline.currentIndex)}</strong>
            </div>
            <div>
              <span>Basket items</span>
              <strong>358</strong>
            </div>
          </div>
          <p className="cpi-panel-note">
            Index levels, 2024 = 100. All 358 published item indices and the
            complete official weight structure are available below.
          </p>
          <a
            className="cpi-source-link"
            href={official.metadata.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            Source: MoSPI CPI database ↗
          </a>
        </div>
        <div className="cpi-half cpi-private">
          <p className="cpi-label">02 / DATA LIBERTARIAN CPI</p>
          <h2>Independent replication</h2>
          <div className="cpi-pending" data-testid="private-result">
            Not yet
            <br />
            measurable<span className="cpi-pending-dot">.</span>
          </div>
          <p className="cpi-period">Matched price collection in progress</p>
          <div className="cpi-stats">
            <div>
              <span>Items with price evidence</span>
              <strong data-testid="quoted-item-count">
                {quotedItems.length}
                <small> / 358</small>
              </strong>
            </div>
            <div>
              <span>Eligible national weight</span>
              <strong>{audit.annualCoveragePct.toFixed(0)}%</strong>
            </div>
          </div>
          <p className="cpi-panel-note">
            A shop quote is a starting point. A national index needs matched
            monthly prices, a 2024 base, and the required state and sector
            coverage. Missing evidence is never counted as zero inflation.
          </p>
          <a className="cpi-source-link" href="#collection-status">
            See exactly what is collected ↓
          </a>
        </div>
      </section>

      <div className="cpi-reading-note">
        <strong>Read the two sides correctly.</strong> Government figures are
        price <em>indices</em>, not rupee prices. Independent quotations show
        specific products, providers, locations and dates. A different price in
        one shop does not establish an error in national CPI. Provider quotes
        were retrieved on 16 November 2026; these are offers and tariffs, not
        verified purchases. Sector controls change the official series and
        weights; the independent quote inventory is not yet classified into
        rural and urban samples.
      </div>

      <section
        id="whole-basket"
        className="cpi-basket-section"
        aria-labelledby="basket-title"
      >
        <div className="cpi-section-title">
          <div>
            <p className="cpi-label">THE COMPLETE BASKET</p>
            <h2 id="basket-title">Every good. Every service.</h2>
          </div>
          <p>
            12 divisions · 308 goods · 50 services
            <br />
            HCES 2023–24 expenditure weights
          </p>
        </div>
        <div className="cpi-filters">
          <label className="cpi-search">
            Find a basket item
            <input
              type="search"
              placeholder="Rice, rent, tuition, petrol…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label>
            Division
            <select
              aria-label="Division"
              value={division}
              onChange={(e) => setDivision(e.target.value)}
            >
              <option value="">All 12 divisions</option>
              {basket.divisions.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Independent evidence
            <select
              aria-label="Independent evidence"
              value={evidenceFilter}
              onChange={(e) => setEvidenceFilter(e.target.value)}
            >
              <option value="">All items</option>
              <option value="quoted">Price evidence collected</option>
              <option value="missing">Price evidence needed</option>
            </select>
          </label>
        </div>
        <div className="cpi-ledger-tools">
          <p role="status">Showing {shownItems.length} of 358 items</p>
          <button type="button" onClick={toggleAll}>
            {expanded ? "Collapse all divisions" : "Expand all divisions"}
          </button>
        </div>
        <div className="cpi-column-head" aria-hidden="true">
          <span>
            GOVERNMENT CPI <small>October 2025 → October 2026</small>
          </span>
          <span>
            INDEPENDENT PRICE RECORD{" "}
            <small>Source observations · reference dates vary</small>
          </span>
        </div>
        {basket.divisions.map((d) => {
          const items = shownItems.filter(
            (item) => item.division.code === d.code,
          );
          if (!items.length) return null;
          const divisionOfficial = officialByKey.get(`${sector}:${d.code}`)!;
          const divisionQuotedCount = basket.items.filter(
            (item) =>
              item.division.code === d.code && quotesByItem.has(item.code),
          ).length;
          return (
            <details
              className="cpi-division"
              key={`${d.code}:${expansionVersion}:${queryText}:${division}:${evidenceFilter}`}
              open={filtering || expanded}
            >
              <summary>
                <span className="cpi-division-official">
                  <span className="cpi-division-title">
                    <span className="cpi-division-code">{d.code}</span>
                    <span>
                      <strong>{d.name}</strong>
                      <small>
                        {d.itemCount} items · {weight(d.weights[sector])} weight
                      </small>
                    </span>
                  </span>
                  <span className="cpi-division-rate">
                    {pct(divisionOfficial.yoy)}
                    <small>Official annual change</small>
                  </span>
                </span>
                <span className="cpi-division-private">
                  <strong>
                    {divisionQuotedCount} <span>/ {d.itemCount}</span>
                  </strong>
                  <small>
                    Items with price evidence · item indices pending
                  </small>
                </span>
                <span className="cpi-expand" aria-hidden="true">
                  +
                </span>
              </summary>
              <div>
                {items.map((item) => {
                  const record = officialByKey.get(`${sector}:${item.code}`)!;
                  const quotes = quotesByItem.get(item.code) ?? [];
                  return (
                    <article
                      className="cpi-item"
                      key={item.code}
                      data-testid="basket-item"
                      id={`cpi-${item.code}`}
                    >
                      <div className="cpi-item-title">
                        <div>
                          <span className="cpi-item-code">{item.code}</span>
                          <h3>{item.name}</h3>
                        </div>
                        <span className="cpi-item-weight">
                          {weight(item.weights[sector])}{" "}
                          <span>basket weight</span>
                        </span>
                      </div>
                      <div className="cpi-item-halves">
                        <div className="cpi-official-record">
                          <p className="cpi-mobile-label">GOVERNMENT CPI</p>
                          <div className="cpi-index-values">
                            <span>{number(record.previousIndex)}</span>
                            <span className="cpi-arrow">→</span>
                            <strong>{number(record.currentIndex)}</strong>
                            <span
                              className={`cpi-change ${record.yoy !== null && record.yoy < 0 ? "negative" : ""}`}
                            >
                              {pct(record.yoy)}
                            </span>
                          </div>
                          <p className="cpi-small">
                            Oct 2025 → Oct 2026 · 2024 = 100
                          </p>
                          <p className="cpi-small">
                            {item.kind === "services" ? "Service" : "Good"} ·{" "}
                            {item.subclass.name}
                          </p>
                          <details className="cpi-record-detail">
                            <summary>What is behind this number?</summary>
                            <p>
                              The published {sector} item index combines prices
                              across relevant markets. The API does not disclose
                              individual shop or household price quotations. It
                              cannot supply a single “official rupee price” for
                              this item.
                            </p>
                            <p>
                              Reported annual change is retained from the
                              source; recalculation from rounded indices may
                              differ slightly.
                            </p>
                            <a href="/data/inflation/cpi-official.json">
                              Inspect official data
                            </a>
                          </details>
                        </div>
                        <div
                          className={`cpi-independent-record ${quotes.length ? "has-quotes" : ""}`}
                        >
                          <p className="cpi-mobile-label">
                            INDEPENDENT PRICE RECORD
                          </p>
                          {quotes.length ? (
                            <>
                              <div className="cpi-evidence-badge">
                                {quotes.length} sourced{" "}
                                {quotes.length === 1
                                  ? "observation"
                                  : "observations"}{" "}
                                · national item index pending
                              </div>
                              {quotes.map((quote) => (
                                <QuoteCard key={quote.id} quote={quote} />
                              ))}
                            </>
                          ) : (
                            <div className="cpi-missing">
                              <span aria-hidden="true">—</span>
                              <strong>Price evidence needed</strong>
                              <p>
                                No independently verified quotation in this
                                release. Matched product or service prices,
                                dates and market coverage are still required.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </details>
          );
        })}
        {!shownItems.length && (
          <p className="cpi-empty">No basket items match these filters.</p>
        )}
        <p className="cpi-small cpi-weight-note">
          Weights are displayed to three decimal places; calculations retain
          source precision. Rural and urban weights are each normalized to 100%.
          The underlying state-sector contributions and all intermediate basket
          groups are downloadable.
        </p>
      </section>

      <section id="collection-status" className="cpi-collection">
        <div>
          <p className="cpi-label">THE WORK BEHIND THE NUMBER</p>
          <h2>
            Same basket. <br />
            An auditable price panel.
          </h2>
          <p>
            The replica follows the government’s 2024 framework: matched monthly
            price relatives, Jevons elementary indices, then fixed
            expenditure-weighted Young aggregation. It does not substitute an
            equal-weight grocery basket.
          </p>
          <Link to="/inflation/method">
            Read the calculation rules and remaining gaps →
          </Link>
        </div>
        <ol className="cpi-checklist">
          <li>
            <span className="cpi-check">✓</span>
            <div>
              <strong>Complete official basket & weights</strong>
              <p>
                358 items, 36 states and territories, 23,208 state-sector-item
                weight records.
              </p>
            </div>
          </li>
          <li>
            <span className="cpi-check">✓</span>
            <div>
              <strong>Reproduce the published arithmetic</strong>
              <p>
                All 358 item indices reproduce each sector’s headline within
                source rounding. This checks aggregation, not the accuracy of
                collected prices.
              </p>
            </div>
          </li>
          <li>
            <span className="cpi-step">3</span>
            <div>
              <strong>Collect independently sourced prices</strong>
              <p>
                {observations.quotes.length} observations across{" "}
                {quotedItems.length} basket items. Provider-specific price
                evidence, including historical records where available.
              </p>
            </div>
          </li>
          <li>
            <span className="cpi-step">4</span>
            <div>
              <strong>Complete the matched market panel</strong>
              <p>
                Still needed: representative state-sector samples, comparable
                monthly history anchored to 2024, rent collection and specialist
                service weights.
              </p>
            </div>
          </li>
          <li>
            <span className="cpi-step">5</span>
            <div>
              <strong>Publish the independent national result</strong>
              <p>
                Withheld until all positive-weight items have eligible,
                independently compiled indices. A more accurate result must be
                demonstrated, not assumed.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <section className="cpi-downloads">
        <div>
          <p className="cpi-label">OPEN BY DESIGN</p>
          <h2>Take the data apart.</h2>
          <p>Inspect the source files, weights and every collected price.</p>
        </div>
        <div className="cpi-download-grid">
          <a href="/data/inflation/cpi-ledger.csv" download>
            Full comparison ledger <span>CSV ↗</span>
          </a>
          <a href="/data/inflation/cpi-basket.json" download>
            All 358 items & weights <span>JSON ↗</span>
          </a>
          <a href="/data/inflation/cpi-official.json" download>
            Official indices · all sectors <span>JSON ↗</span>
          </a>
          <a href="/data/inflation/independent-quotes.json" download>
            Independent price observations <span>JSON ↗</span>
          </a>
          <a href="/data/inflation/cpi-state-item-weights.json" download>
            State-sector weight ledger <span>JSON ↗</span>
          </a>
          <a href="/data/inflation/cpi-collection-template.csv" download>
            Complete collection template <span>CSV ↗</span>
          </a>
        </div>
      </section>
      <p className="cpi-archive-note">
        Earlier work:{" "}
        <Link to="/inflation/essentials">22-item essentials experiment</Link>.
        That limited grocery measure is archived separately and is not the full
        CPI replica.
      </p>
    </div>
  );
}
