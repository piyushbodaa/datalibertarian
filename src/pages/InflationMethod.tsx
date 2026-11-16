import { Link } from "react-router-dom";
import basket from "../data/inflation/cpi-basket.json";
import official from "../data/inflation/cpi-official.json";

const report = "/data/inflation/sources/cpi-2024-expert-report.pdf";
const specialistItems = [
  [
    "Housing",
    "Separate rural/urban and rented/owner-occupied components; rental equivalence, dwelling room categories, Census category shares and HCES expenditure shares.",
    "§4.6.8 · pp.64–67",
  ],
  [
    "PDS",
    "Ration-card category prices and weights by state and sector. Free base-year categories are excluded; specified rules apply when a later price becomes zero.",
    "§4.6.9 · p.67",
  ],
  [
    "Rail",
    "Train, class and distance slabs with passenger/revenue weights. A national rail index; Delhi also has an equally weighted metro priced component.",
    "§4.6.10 · pp.68–71",
  ],
  [
    "Postage and couriers",
    "Four equally weighted priced components: money order, domestic post, international post and other couriers. National tariffs for India Post; local quotations for other couriers.",
    "§4.6.11 · p.71",
  ],
  [
    "Streaming",
    "Specified base subscription plans from six major platforms, linked through geometric mean price relatives.",
    "§4.6.12 · pp.71–72",
  ],
  [
    "Electricity",
    "DISCOM bills at 100, 200, 300 and 400 units, including fixed charges; exclude free slabs. Domestic-consumer distribution weights are required.",
    "§4.6.13 · pp.72–73",
  ],
  [
    "Telecom",
    "Matched operator plans, tariffs normalized per day of validity, and TRAI operator/area and prepaid/postpaid subscriber shares.",
    "§4.6.14 · pp.73–74",
  ],
  [
    "Petrol, diesel and LPG",
    "PPAC reference-month 15th-day PSU outlet prices for unbranded petrol/diesel, and domestic non-subsidised 14.2 kg LPG quotations.",
    "§4.6.15 · p.75",
  ],
];

export function InflationMethodPage() {
  return (
    <article className="max-w-4xl">
      <p className="kicker">Full CPI comparison · Methodology</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        The same basket. A traceable calculation.
      </h1>
      <p className="mt-4 text-lg text-ink/80">
        We use India’s complete {basket.items.length}-item CPI basket, its
        published expenditure weights and the 2024 calculation method. An
        independent headline requires independently collected, comparable prices
        across the full basket. That price panel is not yet available here.
      </p>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <Link to="/inflation">← Compare the full basket</Link>
        <a href="/data/inflation/cpi-basket.csv" download>
          All 358 items (CSV)
        </a>
        <a href="/data/inflation/cpi-basket.json" download>
          Basket and weights (JSON)
        </a>
        <a href={report}>Official methodology (PDF)</a>
      </div>

      <section className="carbon-sheet mt-8 p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold">
          What is measured today
        </h2>
        <p className="mt-3 text-ink/80">
          The official side displays MoSPI’s item indices and annual changes. We
          can reproduce its headline from all 358 official item indices and the
          exact expenditure weights, within the source’s rounding. That checks
          the aggregation. It does not independently verify the prices collected
          by MoSPI.
        </p>
        <p className="mt-3 text-ink/80">
          The independent side preserves every item and its weight, and shows
          where price evidence is missing. It withholds the national result
          until the required independently compiled panels are available. No
          result is labelled more accurate without evidence about sampling and
          measurement errors.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">
          358 expenditure categories, many price quotations
        </h2>
        <p className="mt-3 text-ink/80">
          CPI 2024 contains 308 goods and 50 services. Its official collection
          frame covers 1,465 rural markets, 1,395 urban markets and 12 online
          markets. “Rice”, for example, describes an expenditure category. It
          does not identify one nationwide brand, quality, pack size, shop or
          rupee price. Some weighted items contain multiple separately priced
          products or services.
        </p>
        <p className="mt-3 text-ink/80">
          Weights come from the Household Consumption Expenditure Survey
          2023–24. The price base is 2024: twelve monthly observations establish
          base prices using a geometric mean. Rural and urban weights each sum
          to 100 within their sector; the combined index uses their official
          expenditure shares. State-level prices must be aggregated with the
          corresponding state and sector weights before they represent an
          all-India item.
        </p>
        <p className="mt-3 text-sm text-ink/65">
          Source: Expert Group Report §2.1, pp.7–8; §4.5, pp.46–49; §4.6.3,
          pp.54–55. Page references on this page use the report’s printed
          numbers.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">
          First, compare matched monthly prices
        </h2>
        <p className="mt-3 text-ink/80">
          At the elementary level, CPI 2024 uses a short Jevons chain. Within a
          priced item’s state and rural/urban panel, compare the same
          specification at the same outlet in consecutive months. Take the
          geometric mean of these price ratios, then multiply the previous
          month’s index by that movement.
        </p>
        <div className="index-slip mt-4 space-y-3 text-sm sm:text-base">
          <p>
            <strong>Quotation ratio</strong> = current-month price ÷
            previous-month price
          </p>
          <p>
            <strong>Monthly movement</strong> = geometric mean of the quotation
            ratios
          </p>
          <p>
            <strong>Current index</strong> = previous index × monthly movement
          </p>
        </div>
        <p className="mt-3 text-ink/80">
          The calculation retains the outlet, specification, quantity, unit,
          month and source for each observation. A different pack size, product
          quality or shop needs an appropriate overlap or replacement treatment.
          Starting with a newly observed price today does not establish an index
          on the 2024 base: the earlier anchored chain is also needed.
        </p>
        <p className="mt-3 text-sm text-ink/65">
          Source: §4.6.1, pp.50–52; §4.6.5, pp.57–59.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">
          Then, apply the expenditure weights
        </h2>
        <p className="mt-3 text-ink/80">
          Higher levels use a weighted arithmetic mean of the child index
          levels. This is the Young, or Modified Laspeyres, index: the
          expenditure reference period and price base differ. The rule applies
          to items, subclasses, classes, groups, divisions, states and the
          rural/urban combination.
        </p>
        <div className="index-slip mt-4 space-y-3 text-sm sm:text-base">
          <p>
            <strong>Aggregate index</strong> = sum of (weight × item index) ÷
            sum of weights
          </p>
          <p>
            <strong>Annual inflation (%)</strong> = 100 × (current aggregate
            index ÷ year-ago aggregate index − 1)
          </p>
        </div>
        <p className="mt-3 text-ink/80">
          Annual inflation comes from the two aggregate levels. Averaging the
          items’ annual inflation rates with the fixed basket weights generally
          gives a different answer. Missing items also cannot simply be dropped
          and the remaining weights rescaled into a full-basket result.
        </p>
        <p className="mt-3 text-sm text-ink/65">Source: §4.6.2, pp.52–54.</p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">
          Missing prices have explicit rules
        </h2>
        <p className="mt-3 text-ink/80">
          Official CPI imputes temporarily missing quotations; it does not
          abandon the national index whenever a shop quotation is unavailable.
          The item’s expenditure weight remains in the basket.
        </p>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-ink/80">
          <li>
            Use observed comparable movement within the same elementary panel
            for a temporarily missing quote.
          </li>
          <li>
            If the whole item is missing, use the prescribed comparable higher
            aggregate’s movement, with a documented donor.
          </li>
          <li>
            For administered prices, carry the last price forward until an
            official revision takes effect; specialist rules refine this
            treatment.
          </li>
          <li>
            Replace permanently unavailable products through matching or
            overlap. Without an overlap pair, impute the transition and wait for
            two consecutive observations of the new specification.
          </li>
        </ol>
        <p className="mt-3 text-ink/80">
          Our calculation exposes observed and imputed counts and requires
          evidence for each treatment. With no independent starting panel, no
          anchored prior index and no independent donor movements, filling every
          blank would not create an independently measured CPI. That is why this
          project currently withholds its national number. A complete future
          panel can include documented imputations under the official method.
        </p>
        <p className="mt-3 text-sm text-ink/65">
          Source: §§4.6.4–4.6.6, pp.55–62.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">
          Rent, tariffs and services need additional inputs
        </h2>
        <p className="mt-3 text-ink/80">
          The general formulas are implemented. These specialist collection and
          subweight pipelines still need to be established before the
          corresponding independent item indices qualify for publication.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">
              Specialist CPI compilation rules and official report references
            </caption>
            <thead>
              <tr className="border-b border-[var(--rule)]">
                <th scope="col" className="py-3 pr-4">
                  Item
                </th>
                <th scope="col" className="py-3 pr-4">
                  Required inputs and treatment
                </th>
                <th scope="col" className="py-3">
                  Report
                </th>
              </tr>
            </thead>
            <tbody>
              {specialistItems.map(([name, treatment, source]) => (
                <tr
                  key={name}
                  className="border-b border-[var(--rule)] align-top"
                >
                  <th scope="row" className="py-3 pr-4 font-semibold">
                    {name}
                  </th>
                  <td className="min-w-56 py-3 pr-4 text-ink/80">
                    {treatment}
                  </td>
                  <td className="min-w-28 py-3 text-ink/65">{source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold">
          What qualifies as independent coverage
        </h2>
        <p className="mt-3 text-ink/80">
          Coverage is the share of official expenditure weight supported by
          eligible, independently compiled item indices. A verified item needs
          the correct month and year-ago comparison, the 2024 base, complete
          required state/sector aggregation, specialist subweights where
          relevant, and an auditable chain of source observations. The headline
          requires coverage of the full positive-weight basket.
        </p>
        <p className="mt-3 text-ink/80">
          A single retailer quote, an official item index, or a daily national
          commodity average does not satisfy that requirement. Such evidence can
          be shown separately with its source, location, specification and date.
          It does not become a completed independent item merely because a price
          is visible in the table.
        </p>
        <p className="mt-3 text-ink/80">
          The public material obtained here contains the official basket,
          weights and item indices. We have not obtained a complete
          outlet-by-specification monthly rupee-price file. An index level of
          110 is dimensionless; it is not a retail price of ₹110 and cannot be
          converted into one uniquely. The official dissemination specification
          describes published indices and inflation rates (§4.7.8, pp.78–79).
        </p>
      </section>

      <section className="mt-10 border-t border-[var(--rule)] pt-6 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">
          Sources, downloads and earlier work
        </h2>
        <ul className="mt-3 list-disc space-y-3 pl-5">
          <li>
            <a href="https://www.mospi.gov.in/uploads/documents/documents/1770882257889-Expert_Group_Report_CPI.pdf">
              MoSPI Expert Group Report
            </a>
            {" · "}
            <a href={report}>Archived PDF</a>
            {" · "}
            <a href="/data/inflation/sources/cpi-2024-expert-report.source.json">
              Source record and checksum
            </a>
          </li>
          <li>
            <a href={basket.metadata.sourceUrl}>
              Official Annex 5.3 expenditure weights
            </a>
            {" · "}
            <a href={basket.metadata.sourceArchive} download>
              Archived workbook
            </a>
            {" · "}
            <a href="/data/inflation/cpi-state-item-weights.json" download>
              State/sector item weights
            </a>
          </li>
          <li>
            <a href={official.metadata.sourceUrl}>MoSPI CPI 2024 data API</a>
            {" · "}
            <a href="/data/inflation/cpi-official.json" download>
              Published comparison data
            </a>
            {" · "}
            <a href={official.metadata.sourceArchive} download>
              Archived source responses
            </a>
          </li>
          <li>
            The earlier{" "}
            <Link to="/inflation/essentials">22-item essentials index</Link>
            {" and its "}
            <Link to="/inflation/essentials-method">original methodology</Link>
            {" remain available as a separate, limited grocery calculation."}
          </li>
        </ul>
        <p className="mt-5">
          Report a data error through the{" "}
          <Link to="/corrections">corrections page</Link>, with the item, month
          and supporting source.
        </p>
        <p className="mt-6">
          <Link to="/inflation">Return to the full comparison →</Link>
        </p>
      </section>
    </article>
  );
}
