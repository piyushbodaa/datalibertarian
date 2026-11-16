import { Link } from "react-router-dom";
import snapshot from "../data/inflation/private-snapshot.json";
import { ROOMS } from "../data/inflation/weights";
import { formatDay } from "../data/inflation/yoy";

export function InflationMethodPage() {
  const { metadata, rows, official } = snapshot;
  return (
    <article className="max-w-3xl">
      <p className="kicker">
        Data Libertarian Essentials Index · Methodology v1
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        The basket. The arithmetic. The limits.
      </h1>
      <p className="mt-4 text-lg text-ink/80">
        An experimental measure of the changing cost of {rows.length} groceries,
        calculated by Data Libertarian from published retail prices. Every input
        and weight is open to inspection.
      </p>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <Link to="/inflation">← Explore the index</Link>
        <a href="/data/inflation/private-index.csv" download>
          Download calculations (CSV)
        </a>
        <a href="/data/inflation/private-index.json" download>
          Download snapshot (JSON)
        </a>
      </div>

      <section className="carbon-sheet mt-8 p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold">
          What this index measures
        </h2>
        <p className="mt-3 text-ink/80">
          It measures how much a fixed grocery basket costs at the Department of
          Consumer Affairs’ published all-India average retail prices. The
          calculation is private; the underlying price collection is
          governmental. This is a limited essentials index, not an estimate of
          the complete cost of living of every Indian household.
        </p>
        <p className="mt-3 text-ink/80">
          The current observation is {formatDay(metadata.asOf)}. Its annual
          comparison uses {formatDay(metadata.yearAgo)}, and its one-month
          comparison uses {formatDay(metadata.monthAgo)}. These are three
          point-in-time observations, not monthly averages or a continuous price
          history.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">
          A published, fixed basket
        </h2>
        <p className="mt-3 text-ink/80">
          Version 1 uses the original 22 commodities in the Price Monitoring
          Division’s daily report. Each receives ₹100 of expenditure at the
          year-earlier prices: ₹2,200 in total, with a base expenditure weight
          of 1/22 (about 4.55%) per commodity. The quantity of each commodity is
          the amount that ₹100 would have bought on the base date.
        </p>
        <p className="mt-3 text-ink/80">
          Equal expenditure is a transparent design choice, not a claim about an
          average Indian household. It gives six edible-oil products six
          separate weights and gives salt the same initial weight as rice. Those
          choices affect the result. The household calculator lets readers
          replace these weights with their own base-period grocery spending.
        </p>
        <ul className="mt-4 grid list-disc gap-x-8 gap-y-1 pl-5 text-sm text-ink/80 sm:grid-cols-2">
          {rows.map((row) => (
            <li key={row.id}>
              {row.name} <span className="text-ink/60">(₹/{row.unit})</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-ink/70">
          Units follow the source report. Oils are priced per kilogram, milk per
          litre. We compare the same commodity and unit at each date; we do not
          add unlike unit prices together.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">
          How to reproduce the number
        </h2>
        <p className="mt-3 text-ink/80">
          Let <i>b</i> be the base-date spending on an item, <i>p₀</i> its base
          price, and
          <i> pₜ</i> its current price. Hold the quantity <i>q = b / p₀</i>{" "}
          constant. Calculate each item’s cost at each date, then add the costs
          across the basket.
        </p>
        <div className="index-slip mt-4 space-y-3 text-sm sm:text-base">
          <p>
            <strong>Index</strong> = 100 × current basket cost ÷ base basket
            cost
          </p>
          <p>
            <strong>Annual change (%)</strong> = 100 × (current basket cost ÷
            base basket cost − 1)
          </p>
          <p>
            <strong>One-month change (%)</strong> = 100 × (current basket cost ÷
            previous-month basket cost − 1)
          </p>
          <p>
            <strong>Item contribution (percentage points)</strong> = base
            expenditure share × item annual change (%)
          </p>
        </div>
        <p className="mt-3 text-ink/80">
          This is a fixed-quantity Laspeyres calculation. The index is 100 at
          the base date. The monthly calculation uses the same year-base
          quantities; it does not reset the weights to equal expenditure in the
          previous month. Contributions add to the annual basket change before
          rounding. We retain full numerical precision in the calculation and
          round only for display.
        </p>
        <p className="mt-3 text-ink/80">
          In the personal calculator, enter what you spent on each included item
          in the base period, not what you spend today. A zero spend excludes an
          item from your personal basket. Your result still uses national
          average prices and covers only the selected groceries; it cannot
          measure your full household inflation or the prices at your particular
          shops.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">
          Missing data and revisions
        </h2>
        <ul className="mt-3 list-disc space-y-3 pl-5 text-ink/80">
          <li>
            A missing, zero, negative, or non-finite price is unavailable, never
            a free item. If any positive-weight item lacks a valid current or
            base price, we withhold the aggregate annual result. A missing
            previous-month price withholds the monthly result.
          </li>
          <li>
            We do not silently drop missing items and redistribute their
            weights. An all-zero personal basket has no inflation result.
            Invalid spending inputs must be corrected before a result can be
            shown.
          </li>
          <li>
            Membership, units, and base weights stay fixed within this version.
            Changing the basket or base creates a separately identified version;
            it must not be spliced into this series without an explicit linking
            method.
          </li>
          <li>
            Each published observation must retain its source, retrieval date,
            and input snapshot. Corrections require an explanation and a new
            dated revision while keeping the earlier record available.
          </li>
        </ul>
        <p className="mt-3 text-ink/80">
          The observation date on the dashboard is the date of the prices, not a
          promise of live updates. A newer release requires a newly checked
          snapshot. Report errors through the{" "}
          <Link to="/corrections">corrections page</Link> with the item, date,
          and supporting source.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">
          What a comparison with CPI can tell us
        </h2>
        <p className="mt-3 text-ink/80">
          The official CPI and Consumer Food Price Index are separate reference
          series. They use different baskets, weights, sampling, and reporting
          periods. Our daily November observation and the official October
          monthly release do not cover the same window. A numerical difference
          cannot establish that CPI is inaccurate, manipulated, or understating
          the cost of living.
        </p>
        <p className="mt-3 text-ink/80">
          The official comparator is taken directly from the cited release and
          retains its provisional status and 2024 base. We do not substitute an
          official parent-division inflation rate for an individual commodity’s
          price change in this index.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">
          Coverage and uncertainty
        </h2>
        <ul className="mt-3 list-disc space-y-3 pl-5 text-ink/80">
          <li>
            <strong>Household coverage:</strong> rent, education, healthcare,
            transport, electricity, clothing, services, and many foods are
            outside this basket. Even complete data for all 22 items does not
            mean complete coverage of household spending.
          </li>
          <li>
            <strong>Geography:</strong> all-India commodity averages do not
            identify the inflation faced in a particular state, village, city,
            income group, or shop. Changes in which reporting centres contribute
            can change an average.
          </li>
          <li>
            <strong>Product comparability:</strong> a published commodity
            average is not a panel of identical brands, pack sizes, quality
            grades, and shops. This calculation cannot separately identify
            quality changes, shrinkflation, substitution, or outlet changes.
          </li>
          <li>
            <strong>Timing:</strong> single-day prices can be sensitive to
            seasonality and temporary supply shocks. There is no seasonal
            adjustment and no interpolation between the three observed dates.
          </li>
          <li>
            <strong>Statistical uncertainty:</strong> these aggregate source
            data do not support a sampling confidence interval. Displayed
            decimal places describe arithmetic precision, not a measured margin
            of error.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">
          Towards an independent national index
        </h2>
        <p className="mt-3 text-ink/80">
          A representative private CPI needs independent price collection across
          rural and urban locations, a documented sampling frame, household
          expenditure weights, and coverage of major goods and services. The
          panel must repeatedly price matched products and outlets, record taxes
          and discounts, handle missing products and quality changes, and
          publish coverage and revision policies. That collection programme has
          not yet been established here.
        </p>
        <p className="mt-3 text-ink/80">
          This release supplies the reproducible calculation and evidence trail
          for a narrower basket. A national claim should follow validation of
          the broader panel and weights.
        </p>
      </section>

      <section className="mt-10 border-t border-[var(--rule)] pt-6 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">
          Sources and earlier observations
        </h2>
        <ol className="mt-3 list-decimal space-y-3 pl-5">
          <li>
            <a href={metadata.sourceUrl}>
              Department of Consumer Affairs: daily retail price report
            </a>
            . Retrieved {formatDay(metadata.retrievedAt.slice(0, 10))}.{" "}
            <a href={metadata.sourceArchive} download>
              Download the archived report
            </a>
            . The dated input values and source provenance are included in the
            downloadable snapshot.
          </li>
          <li>
            <a href={official.sourceUrl}>MoSPI: October 2026 CPI release</a>.
            Official comparator, published {formatDay(official.releasedAt)}.{" "}
            <a href={official.sourceArchive} download>
              Download the archived release
            </a>
            .
          </li>
          <li>
            The <Link to="/inflation/food">earlier category pages</Link> and{" "}
            <Link to="/inflation/item/rice">item records</Link> retain the
            September 2026 retail observations and July 2026 CPI comparisons.
            They are historical records and are not the inputs to this release.
          </li>
        </ol>
        <nav
          aria-label="Historical inflation categories"
          className="mt-5 flex flex-wrap gap-x-4 gap-y-2"
        >
          {ROOMS.map((room) => (
            <Link key={room.id} to={`/inflation/${room.id}`}>
              {room.label} archive
            </Link>
          ))}
        </nav>
        <details className="mt-4">
          <summary className="cursor-pointer font-medium text-ink">
            Source checksums (SHA-256)
          </summary>
          <p className="mt-2">
            The checksums identify the exact downloaded source files used for
            this release.
          </p>
          <p className="mt-2 break-all">
            Retail report: <code>{metadata.sourceSha256}</code>
          </p>
          <p className="mt-2 break-all">
            CPI release: <code>{official.sourceSha256}</code>
          </p>
        </details>
        <p className="mt-6">
          <Link to="/inflation">Return to the index →</Link>
        </p>
      </section>
    </article>
  );
}
