import { Link } from "react-router-dom";
import { BasketPie } from "../components/BasketPie";
import { CitationChip, CitationFootnote } from "../components/CitationChip";
import { DivisionBars } from "../components/DivisionBars";
import {
  AS_OF,
  CPI_COMBINED_YOY,
  CPI_DEC_2025_INDEX,
  CPI_FOOD,
  CPI_HEADLINE,
  CPI_JUNE_INDEX,
  CPI_RURAL_YOY,
  CPI_URBAN_YOY,
  INFLATION_ITEMS,
} from "../data/inflation/items";
import { CPI_DIVISIONS, ROOMS, WEIGHTS_CITE } from "../data/inflation/weights";
import { formatDay, formatPct, formatPrice, indexChangePct, yearPair } from "../data/inflation/yoy";

export function InflationPage() {
  const priced = INFLATION_ITEMS.map((item) => {
    const pair = yearPair(item);
    if (!pair) return null;
    return { item, pair };
  }).filter((r): r is NonNullable<typeof r> => r !== null);
  const mom = indexChangePct(CPI_HEADLINE.index ?? 0, CPI_JUNE_INDEX);
  const ytd = indexChangePct(CPI_HEADLINE.index ?? 0, CPI_DEC_2025_INDEX);
  const highDiv = [...CPI_DIVISIONS].sort((a, b) => b.yoyPct - a.yoyPct)[0];
  const lowDiv = [...CPI_DIVISIONS].sort((a, b) => a.yoyPct - b.yoyPct)[0];
  const onion = priced.find((r) => r.item.id === "onion");
  const yoyMax = Math.max(...CPI_COMBINED_YOY.map((m) => m.yoyPct));

  return (
    <article>
      <p className="kicker">Consumer prices · India</p>
      <h1 className="mt-2 font-display text-[1.85rem] font-semibold leading-[1.15] tracking-tight sm:text-4xl">
        July 2026
      </h1>
      <p className="mt-3 max-w-2xl text-ink">
        Official CPI Combined, base 2024=100, provisional. Kitchen rupees as on {formatDay(AS_OF)}.
        Core / regulated / seasonal splits are not in the Indian note — those rooms stay empty.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <section className="index-slip px-4 py-5">
          <p className="kicker">One month</p>
          <p className="num num-hero mt-2 m-0">{mom !== undefined ? formatPct(mom) : "—"}</p>
          <p className="mt-2 text-sm text-ink/70">
            Combined index {CPI_JUNE_INDEX} (June) → {CPI_HEADLINE.index} (July).
            <CitationChip citationId={CPI_HEADLINE.citationId} />
          </p>
        </section>
        <section className="index-slip px-4 py-5">
          <p className="kicker">Twelve months</p>
          <p className="num num-hero mt-2 m-0">{formatPct(CPI_HEADLINE.yoyPct)}</p>
          <p className="mt-2 text-sm text-ink/70">
            July 2025 → July 2026. Food (CFPI) {formatPct(CPI_FOOD.yoyPct)}.
          </p>
        </section>
        <section className="index-slip px-4 py-5">
          <p className="kicker">Since Dec 2025</p>
          <p className="num num-hero mt-2 m-0">{ytd !== undefined ? formatPct(ytd) : "—"}</p>
          <p className="mt-2 text-sm text-ink/70">
            Combined index {CPI_DEC_2025_INDEX} (Dec 2025) → {CPI_HEADLINE.index} (July).
          </p>
        </section>
      </div>

      <DivisionBars />

      <section className="carbon-sheet mt-10 px-4 py-6 sm:px-6">
        <h2 className="mt-2 font-display text-xl font-semibold">This month’s note</h2>
        <ul className="mt-4 max-w-2xl list-disc space-y-3 pl-5 text-sm text-ink/80">
          <li>
            All-India Combined rose {formatPct(CPI_HEADLINE.yoyPct)} over twelve months. Rural{" "}
            {formatPct(CPI_RURAL_YOY)}; urban {formatPct(CPI_URBAN_YOY)}.
          </li>
          <li>
            Highest official division: {highDiv.label} {formatPct(highDiv.yoyPct)}. Lowest:{" "}
            {lowDiv.label} {formatPct(lowDiv.yoyPct)}.
          </li>
          {onion?.item.official ? (
            <li>
              Observed onion: {formatPrice(onion.pair.then)} on {formatDay(onion.pair.then.asOf)} →{" "}
              {formatPrice(onion.pair.now)} on {formatDay(onion.pair.now.asOf)}. They printed a CPI
              item rate of {formatPct(onion.item.official.yoyPct)} for July — an index, not that
              rupee.
            </li>
          ) : null}
          <li>Core / regulated / seasonal splits are not in the July note. Empty, not zero.</li>
        </ul>
      </section>

      <BasketPie />

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">Rural and urban</h2>
        <p className="mt-2 text-sm text-ink/70">
          Combined 12-month rates, July 2026. Not a state map — those CPI prints are not typed here.
        </p>
        <ul className="mt-4 space-y-3">
          {[
            { label: "Rural", pct: CPI_RURAL_YOY },
            { label: "Urban", pct: CPI_URBAN_YOY },
            { label: "Combined", pct: CPI_HEADLINE.yoyPct },
          ].map((row) => (
            <li key={row.label}>
              <div className="flex justify-between text-sm">
                <span>{row.label}</span>
                <span className="num">{formatPct(row.pct)}</span>
              </div>
              <div className="mt-1 h-3 w-full bg-ink/[0.05]">
                <div
                  className="hatch-carbon h-3"
                  style={{
                    width: `${(row.pct / Math.max(CPI_RURAL_YOY, CPI_URBAN_YOY, CPI_HEADLINE.yoyPct)) * 100}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold tracking-tight">Twelve-month rate, month by month</h2>
        <p className="mt-2 text-sm text-ink/70">Combined CPI printed in the July 2026 press note.</p>
        <ol className="mt-4 flex items-end gap-2">
          {CPI_COMBINED_YOY.map((m) => (
            <li key={m.period} className="flex-1 text-center">
              <div
                className="mx-auto w-full bg-[var(--zinc)]"
                style={{ height: `${(m.yoyPct / yoyMax) * 7}rem` }}
                role="img"
                aria-label={`${m.period}, ${formatPct(m.yoyPct)}`}
              />
              <p className="num mt-1 text-[0.65rem] text-ink/70">{m.period.slice(5)}</p>
              <p className="num text-[0.7rem]">{formatPct(m.yoyPct)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Smaller baskets</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink/70">
          Each room is one slice of the official basket, or the fuel rupees PPAC printed. Empty
          observed cells are unread, not ₹0.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {ROOMS.map((room) => {
            const div = room.divisionId
              ? CPI_DIVISIONS.find((d) => d.id === room.divisionId)
              : undefined;
            return (
              <li key={room.id}>
                <Link
                  to={`/inflation/${room.id}`}
                  className="docket-door block text-ink no-underline hover:text-rust"
                >
                  <p className="font-display text-lg font-semibold">{room.label}</p>
                  <p className="mt-1 text-sm text-ink/70">{room.blurb}</p>
                  {div ? (
                    <p className="num mt-3 text-sm">
                      Weight {div.weight.toFixed(2)}% · they printed {formatPct(div.yoyPct)} in 12
                      months
                    </p>
                  ) : (
                    <p className="mt-3 text-sm text-ink/70">Observed rupees on the next page.</p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Average prices</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink/70">
          From the rupee printed one year back to the rupee printed on {formatDay(AS_OF)}. The
          government column is a CPI item rate only when MoSPI printed one — never a made-up rice
          rupee.
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink/20 text-left">
                <th className="py-2 pr-3 font-medium">Item</th>
                <th className="py-2 pr-3 font-medium">Observed, a year ago</th>
                <th className="py-2 pr-3 font-medium">Observed, now</th>
                <th className="py-2 pr-3 font-medium">Change</th>
                <th className="py-2 font-medium">They printed</th>
              </tr>
            </thead>
            <tbody>
              {priced.map(({ item, pair }) => {
                const pct = (pair.now.rupees / pair.then.rupees - 1) * 100;
                const delta = pair.now.rupees - pair.then.rupees;
                return (
                  <tr key={item.id} className="border-b border-ink/10">
                    <td className="py-3 pr-3">
                      <Link to={`/inflation/item/${item.id}`}>{item.plainLabel}</Link>
                    </td>
                    <td className="num py-3 pr-3">
                      {formatPrice(pair.then)}
                      <span className="block text-xs text-ink/55">{formatDay(pair.then.asOf)}</span>
                    </td>
                    <td className="num py-3 pr-3">
                      {formatPrice(pair.now)}
                      <span className="block text-xs text-ink/55">{formatDay(pair.now.asOf)}</span>
                    </td>
                    <td className="num py-3 pr-3">
                      {delta > 0 ? "+" : delta < 0 ? "−" : ""}₹
                      {Math.abs(delta).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      {" · "}
                      {formatPct(pct)}
                      <span className="block text-xs text-ink/55">in 12 months</span>
                    </td>
                    <td className="py-3 text-ink/75">
                      {item.official ? (
                        <>
                          CPI item {formatPct(item.official.yoyPct)}
                          <span className="block text-xs text-ink/55">
                            {item.official.period} · index, not a rupee
                          </span>
                        </>
                      ) : (
                        <span className="text-ink/50">No item rupee printed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 text-sm text-ink/70">
        <h2 className="font-display text-lg font-semibold text-ink">Footnotes</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-4 pl-5">
          <CitationFootnote citationId="pmd-retail-2026-09-10" />
          <CitationFootnote citationId="ppac-fuel-2026-09-10" />
          <CitationFootnote citationId={CPI_HEADLINE.citationId} />
          <CitationFootnote citationId={WEIGHTS_CITE} />
        </ol>
        <p className="mt-6">
          <Link to="/inflation/method">How this bulletin is built</Link>
          {" · "}
          <Link to="/">Home</Link>
        </p>
      </section>
    </article>
  );
}
