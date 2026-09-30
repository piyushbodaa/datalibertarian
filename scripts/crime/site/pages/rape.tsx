import React from "react";
import { ncrb2022 } from "../../../../src/data/crime/ncrb2022";
import { ncrb2023Rape as prev } from "../../../../src/data/crime/ncrb2023Rape";
import { ncrb2024Rape as r23 } from "../../../../src/data/crime/ncrb2024";
import { rapePlaces } from "../../../../src/data/crime/rapePlaces";
import { rapeSeries } from "../../../../src/data/crime/rapeSeries";
import { composition2024 as k24, nfhsSexualViolence as nfhs } from "../../../../src/data/crime/composition";
import { ftsc, karnatakaCheck, keralaCheck, maritalRapeRecord, ncwComplaints } from "../../../../src/data/crime/govRecords";
import { BLUE, CheckTable, Columns, DataTable, Figure, GREY, HBars, PALE, Parts, PartsTable, PLUM, Record, SAFFRON, Tabs, TileMap } from "../charts";
import { Callout, change, Hero, inr, one, Page, pct, Prose, Refs, Section, signed, Sources, Stat, Stats } from "../kit";

const n = r23.national;
const rape22 = prev.national.rape;
const pocso22 = prev.national.childRapePocso;
const both23 = n.rape + n.childRapePocso;
const both22 = rape22 + pocso22;

// Section 376 and POCSO sections 4 and 6 are separate FIRs under the principal-offence rule,
// and Table 3A.2 prints both rates on the same base (per lakh women), so they add.
const states = r23.states.map((row) => {
  const prior = prev.states.find((old) => old.name === row.name)!;
  return {
    ...row,
    kind: ncrb2022.states.find((old) => old.name === row.name)!.kind,
    rape2022: prior.rape,
    both: row.rape + row.childRapePocso,
    bothRate: Math.round((row.ratePerLakhWomen + row.childRapePocsoRate) * 10) / 10,
    knownShare: row.rape ? pct(row.known, row.rape) : null,
  };
});
const cities = r23.cities.map((row) => {
  const parent = ncrb2022.cities.find((old) => old.name === row.name)!.parent;
  return {
    ...row,
    name: parent && row.name !== "Delhi City" ? `${row.name}, ${parent}` : row.name,
    rape2022: prev.cities.find((old) => old.name === row.name)!.rape,
    both: row.rape + row.childRapePocso,
    bothRate: Math.round((row.ratePerLakhWomen + row.childRapePocsoRate) * 10) / 10,
  };
});

const by = <T,>(rows: T[], f: (r: T) => number) => [...rows].sort((a, b) => f(b) - f(a));
const y2017 = rapeSeries.find((r) => r.year === 2017)!;
const k24FirTotal = k24.rape.s376 + k24.rape.pocsoGirls;
const y2024 = rapeSeries.find((r) => r.year === 2024)!;

export function RapePage() {
  const refs = new Refs();
  const c = refs.cite;
  const rel = r23.relation;
  const kid = r23.pocsoRelation;
  const police = r23.police;
  const court = r23.court.rape;
  const kidCourt = r23.court.childRapePocso;
  const age = r23.victimAge;
  const bigStates = states.filter((s) => s.kind === "state");
  const topCount = by(states, (s) => s.both).slice(0, 10);
  const topRate = by(bigStates, (s) => s.bothRate).slice(0, 10);
  const zeroGirls = states.filter((s) => s.kind === "state" && s.girlsUnder18 === 0 && s.rape > 2000).map((s) => s.name);
  const closedOther = police.finalReports - police.finalReportFalse + police.transferred + police.withdrawn + police.quashed + police.notInvestigated;
  const courtOther = court.forTrial - court.convicted - court.acquitted - court.pendingAtYearEnd;
  const series = [
    { year: 2020, cases: ncrb2022.trends.rape.y2020.cases, rate: ncrb2022.trends.rape.y2020.rate },
    ...prev.series.map((s) => ({ year: s.year, cases: s.rape, rate: s.rate })),
    { year: 2024, cases: r23.national.rape, rate: r23.national.rapeRatePerLakhWomen },
  ];
  const tile = (value: (s: (typeof states)[number]) => number, tip: (s: (typeof states)[number]) => string) =>
    Object.fromEntries(states.map((s) => [s.name, { value: value(s), tip: tip(s) }]));
  const stateTip = (s: (typeof states)[number]) =>
    `${s.name}: ${inr(s.both)} FIRs (${inr(s.rape)} under s.376, ${inr(s.childRapePocso)} POCSO child rape) · ${one(s.bothRate)} per lakh women`;

  return (
    <Page
      id="rape"
      path="/crime/rape"
      title="Rape in India, counted — Crime in India"
      description="69,716 FIRs of rape of women and girls were registered in India in 2024. Most reports quote 29,670. State and city rates, who the offenders were, and what courts did, from NCRB tables."
      scripts={["/crime/vendor/leaflet.js", "/crime/districts.js"]}
      styles={["/crime/vendor/leaflet.css"]}
    >
      <Hero
        eyebrow="Rape · Crime in India 2024"
        title={`${inr(both23)} rapes registered in 2024.`}
        accent={`Most reports say ${inr(n.rape)}.`}
        actions={[
          { href: "#states", label: "See the states" },
          { href: "#justice", label: "What happened after the FIR" },
        ]}
        caveat="Registered FIRs, as the National Crime Records Bureau published them. Not a count of every rape committed. Every figure links to its table."
      >
        The {inr(n.rape)} figure is section 376 of the Penal Code. Rape of a girl under eighteen is usually filed under
        sections 4 and 6 of the POCSO Act instead, in a separate row: {inr(n.childRapePocso)} cases in 2024. Each FIR
        is counted in only one of the two rows, so together they are {inr(both23)}.
        {c("ncrb-cii-2024-3a2", "ncrb-cii-2024-limits")}
      </Hero>

      <Section
        id="decade"
        kicker="Ten years"
        title="Rape FIRs, 2015 to 2024, by kind"
        lede={
          <>
            Each bar is one year’s rape FIRs, read from that year’s own Crime in India volume. Section 376 alone has
            stayed between {inr(Math.min(...rapeSeries.map((r) => r.s376)))} and {inr(Math.max(...rapeSeries.map((r) => r.s376)))} a
            year. Child rape under POCSO, counted separately since 2017, grew from {inr(y2017.pocsoGirls!)} to{" "}
            {inr(y2024.pocsoGirls!)}. That is where the rise is.
            {c(...rapeSeries.map((r) => r.source).filter((v, i, a) => a.indexOf(v) === i))}
          </>
        }
      >
        <Figure
          wide
          title="Rape FIRs registered each year, by kind"
          sub="Cases. Hover or tab to a bar for its parts."
          legend={[
            { color: PLUM, label: "Gang rape (s.376D; BNS s.70 in 2024)" },
            { color: BLUE, label: "Other rape under s.376" },
            { color: SAFFRON, label: "Child rape, POCSO 4 & 6 (girls)" },
            { color: GREY, label: "Rape row incl. POCSO child rape, not split (before 2017)" },
          ]}
          note={
            <>
              Before 2017 the Bureau counted child rape filed under POCSO read with section 376 inside the rape row, so the
              fall from 2016 to 2017 is mostly a change in counting, not in crime. 2015’s own volume is not posted in full;
              its total is from the 2016 and 2017 volumes and is not split. Gang rape of girls under 16 or 12 (0 to 84 cases a
              year) is inside “other rape”. 2024 combines IPC and the Bharatiya Nyaya Sanhita, which replaced it on 1 July 2024.
            </>
          }
        >
          <div className="viz-scroll">
            <Columns
              wide
              height={320}
              label="Rape FIRs by kind, 2015 to 2024"
              marker={{ before: rapeSeries.findIndex((r) => !r.pocsoInside), label: "POCSO counted separately from 2017" }}
              rows={rapeSeries.map((r) => {
                const gang = r.gangRape ?? 0;
                const other = r.s376 - gang;
                const total = r.s376 + (r.pocsoGirls ?? 0);
                const segs = [
                  ...(gang ? [{ key: "gang", value: gang, color: PLUM }] : []),
                  { key: "other", value: other, color: r.pocsoInside ? GREY : BLUE },
                  ...(r.pocsoGirls ? [{ key: "pocso", value: r.pocsoGirls, color: SAFFRON }] : []),
                ];
                const parts = [
                  r.gangRape != null ? `gang rape ${inr(gang)}` : null,
                  r.pocsoInside ? `rape row incl. POCSO child rape ${inr(other)}` : `other s.376 ${inr(other)}`,
                  r.pocsoGirls != null ? `POCSO child rape ${inr(r.pocsoGirls)}` : null,
                ].filter(Boolean);
                return {
                  label: String(r.year),
                  segs,
                  tip: `${r.year}: ${inr(total)} FIRs · ${parts.join(" · ")}${r.note ? ` · ${r.note}` : ""}`,
                };
              })}
            />
          </div>
        </Figure>
        <Callout label="What the POCSO row counts">
          Under POCSO, any penetrative sexual act with a person under eighteen is child rape in law, whether or not the
          teenager agreed. In {inr(kid.friendsOrPartners)} of the {inr(kid.total)} POCSO section 4 and 6 cases in 2024,{" "}
          {one(pct(kid.friendsOrPartners, kid.total))}%, the police recorded the offender as a friend, online friend or
          live-in partner. The tables cannot say how many were relationships between adolescents. Read the rise with that
          in mind; it is not all predatory abuse, and it is not none.{c("ncrb-cii-2024-4a10")}
        </Callout>
        <details className="more">
          <summary>The numbers behind each bar</summary>
          <DataTable
            rows={rapeSeries.map((r) => ({ ...r, name: String(r.year) }))}
            search="Find a year"
            keepOrder
            caption="Cases registered. Each year from its own Crime in India volume; see the sources below."
            cols={[
              { label: "Total shown", value: (r) => r.s376 + (r.pocsoGirls ?? 0) },
              { label: "Section 376", value: (r) => r.s376 },
              { label: "Gang rape", value: (r) => r.gangRape },
              { label: "POCSO 4 & 6, girls", value: (r) => r.pocsoGirls },
            ]}
          />
        </details>
      </Section>

      <Section
        id="parts"
        tone="edge"
        kicker="What the count is made of"
        title="Every part over 10%, including the one the law leaves out"
        lede={
          <>
            Inside the FIR count, 2024: child rape under POCSO is the largest part, then other rape under section 376; gang
            rape is about 2%. Outside it is rape by a husband. The law says intercourse by a man with his wife, when she is
            eighteen or older, is not rape, so no police station can register it as rape and no chart of FIRs can show it.
            The Health Ministry’s survey can.{c("ncrb-cii-2024-v1", "bns-2023-s63", "nfhs5-india-ch15")}
          </>
        }
      >
        <div className="grid2">
          <Figure title="Rape FIRs by kind, 2024" sub={`${inr(k24FirTotal)} FIRs, section 376 and POCSO sections 4 and 6`}>
            <Parts
              label="Rape FIRs by kind, 2024"
              total={k24FirTotal}
              parts={[
                { label: "Child rape, POCSO 4 & 6 (girls)", value: k24.rape.pocsoGirls, color: SAFFRON },
                { label: "Other rape under s.376 / BNS", value: k24.rape.s376 - k24.rape.gangRape, color: BLUE },
                { label: "Gang rape (BNS s.70)", value: k24.rape.gangRape, color: PLUM },
              ]}
            />
          </Figure>
          <Figure
            title="Who women say committed sexual violence"
            sub="NFHS-5, 2019–21: women aged 18 to 49 who had ever experienced sexual violence, by the person they named"
            note="A woman could name more than one person, so the bars do not add to 100%. This is a survey of households, not a count of police cases."
          >
            <HBars
              label="Persons committing sexual violence, NFHS-5"
              max={100}
              rows={nfhs.perpetrators.map((x) => ({
                label: x.label,
                segs: [{ key: "p", value: x.pct, color: x.label.includes("husband") ? PLUM : GREY }],
                value: `${one(x.pct)}%`,
                tip: `${x.label}: named by ${one(x.pct)}% of women who experienced sexual violence`,
              }))}
            />
          </Figure>
        </div>
        <Stats>
          <Stat value={`${one(nfhs.spousal.forcedIntercoursePast12Months)}%`} label="Forced intercourse by husband, past year" sub="of ever-married women aged 18 to 49. NFHS-5 Table 15.9." />
          <Stat value={`${one(nfhs.spousal.forcedIntercourseEver)}%`} label="Forced intercourse by husband, ever" sub="of ever-married women aged 18 to 49." />
          <Stat value={`${one(nfhs.perpetrators[0]!.pct)}%`} label="Named their current husband" sub={`of women who faced sexual violence; ${one(nfhs.perpetrators[1]!.pct)}% named a former husband.`} />
          <Stat value={`${one(nfhs.perpetrators.find((x) => x.label === "Stranger")!.pct)}%`} label="Named a stranger" sub={`in the survey. In 2024 FIRs the offender was unknown in ${one(pct(k24.rape.relation.unknown, k24.rape.relation.total))}%.`} />
        </Stats>
        <PartsTable
          shareOf="Share"
          caption="Parts of 10% or more are marked. FIR shares are of the 2024 count named in the note; survey shares are of women who experienced sexual violence."
          rows={[
            { part: "Child rape under POCSO 4 & 6 (girls)", value: inr(k24.rape.pocsoGirls), share: pct(k24.rape.pocsoGirls, k24FirTotal), where: "inside", note: "of all rape FIRs, both rows" },
            { part: "Other rape under s.376 / BNS", value: inr(k24.rape.s376 - k24.rape.gangRape), share: pct(k24.rape.s376 - k24.rape.gangRape, k24FirTotal), where: "inside", note: "of all rape FIRs, both rows" },
            { part: "Gang rape", value: inr(k24.rape.gangRape), share: pct(k24.rape.gangRape, k24FirTotal), where: "inside", note: "of all rape FIRs, both rows" },
            { part: "Offender a friend, partner, or promised marriage", value: inr(k24.rape.relation.friendsOrPartners), share: pct(k24.rape.relation.friendsOrPartners, k24.rape.relation.total), where: "inside", note: "of section 376 / BNS rape FIRs" },
            { part: "Offender a neighbour, employer or other known person", value: inr(k24.rape.relation.otherKnown), share: pct(k24.rape.relation.otherKnown, k24.rape.relation.total), where: "inside", note: "of section 376 / BNS rape FIRs" },
            { part: "POCSO offender a friend, online friend or partner", value: inr(k24.rape.pocsoRelation.friendsOrPartners), share: pct(k24.rape.pocsoRelation.friendsOrPartners, k24.rape.pocsoRelation.total), where: "inside", note: "of POCSO 4 & 6 cases, girls and boys" },
            { part: "Rape by a husband (marital rape)", value: `${one(nfhs.spousal.forcedIntercoursePast12Months)}% a year`, share: nfhs.perpetrators[0]!.pct, where: "survey", note: `of ever-married women face forced intercourse by their husband each year; ${one(nfhs.perpetrators[0]!.pct)}% of women who faced sexual violence named their current husband, ${one(nfhs.perpetrators[1]!.pct)}% a former one` },
          ]}
        />
        <Callout label="Why marital rape is not in the ten-year chart" tone="urgent">
          It is not missing from the data by accident. The law excludes it: sexual intercourse by a man with his own wife,
          not being under eighteen, is not rape. The survey measures a share of women, not a number of cases, so this page
          does not add it to the FIR bars or turn it into a count.{c("bns-2023-s63", "nfhs5-india-ch15")}
        </Callout>
        <Record items={maritalRapeRecord.map((x) => ({ ...x, cite: c(x.source) }))} />
      </Section>

      <Section
        id="count"
        kicker="The count"
        title="The adult count fell. The child count rose."
        lede={
          <>
            A headline built on section 376 reports a fall of {one(Math.abs(change(n.rape, rape22)))}% in 2024. Over the
            same year the POCSO child-rape row grew {one(change(n.childRapePocso, pocso22))}%. Taken together, rape FIRs
            rose {one(change(both23, both22))}%.
          </>
        }
      >
        <Stats>
          <Stat value={inr(n.rape)} label="Section 376 IPC" delta={{ text: signed(change(n.rape, rape22)), dir: "down" }} sub={<>on 2023. {one(n.rapeRatePerLakhWomen)} per lakh women.{c("ncrb-cii-2024-3a2")}</>} />
          <Stat value={inr(n.childRapePocso)} label="Child rape, POCSO 4 & 6" delta={{ text: signed(change(n.childRapePocso, pocso22)), dir: "up" }} sub={<>on 2023. Girl victims.{c("ncrb-cii-2024-3a2", "ncrb-cii-2023-3a2")}</>} />
          <Stat value={inr(both23)} label="Both rows, added here" delta={{ text: signed(change(both23, both22)), dir: "up" }} sub="on 2023. One FIR sits in one row only." />
          <Stat value={`${one(rel.knownShare)}%`} label="Offender known to her" sub={<>of section 376 cases. {inr(rel.unknown)} unknown.{c("ncrb-cii-2024-3a4")}</>} />
        </Stats>
        <div className="grid2">
          <Figure
            title="Rape FIRs, by the row they were filed in"
            sub="Cases registered, 2023 and 2024"
            legend={[
              { color: BLUE, label: "Section 376 IPC" },
              { color: SAFFRON, label: "POCSO sections 4 & 6 (girls)" },
            ]}
            note={<>Both rows from Table 3A.2 of each year’s volume.{c("ncrb-cii-2023-3a2", "ncrb-cii-2024-3a2")}</>}
          >
            <Columns
              label="Rape FIRs by row, 2023 and 2024"
              rows={[
                { label: "2023", a: rape22, b: pocso22 },
                { label: "2024", a: n.rape, b: n.childRapePocso },
              ].map((r) => ({
                label: r.label,
                segs: [
                  { key: "376", value: r.a, color: BLUE },
                  { key: "pocso", value: r.b, color: SAFFRON },
                ],
                tip: `${r.label}: ${inr(r.a + r.b)} FIRs · ${inr(r.a)} under s.376 · ${inr(r.b)} POCSO child rape`,
              }))}
            />
          </Figure>
          <Figure
            title="Section 376 alone, five years"
            sub="Cases registered. The rate is per lakh women."
            note={<>2020 was the lockdown year. Years before 2020 are in older volumes this page has not read yet.{c("ncrb-cii-2024-1-2", "ncrb-cii-2023-1-2")}</>}
          >
            <Columns
              label="Section 376 rape cases, 2020 to 2024"
              rows={series.map((s) => ({
                label: String(s.year),
                segs: [{ key: "376", value: s.cases, color: BLUE }],
                tip: `${s.year}: ${inr(s.cases)} cases · ${one(s.rate)} per lakh women`,
              }))}
            />
          </Figure>
        </div>
      </Section>

      <Section
        id="states"
        tone="edge"
        kicker="Where"
        title="The largest count is not the highest rate"
        lede={
          <>
            Rajasthan, Uttar Pradesh and Maharashtra register the most cases. Per lakh women, the top of the list is
            mostly small states and union territories. The Bureau prints a warning under every table: “States/UTs may not be compared purely on
            the basis of crime figures.” A state that writes down every complaint looks worse than one that turns people
            away.{c("ncrb-cii-2024-3a2")}
          </>
        }
      >
        <Figure
          title="Rape FIRs per lakh women, 2024"
          sub="Each square is a state or union territory, placed roughly where it lies. Hover or tab to a square for its figures."
          note="Squares are equal in size on purpose: a small state reads as clearly as a large one. The grid is not a map and draws no borders."
        >
          <Tabs
            id="state-maps"
            tabs={[
              {
                label: "Both rows, per lakh women",
                body: <TileMap label="Rape FIRs per lakh women, both rows, 2024" unit="Per lakh women" fmt={one} values={tile((s) => s.bothRate, stateTip)} />,
              },
              {
                label: "Section 376 only",
                body: <TileMap label="Section 376 rape per lakh women, 2024" unit="Per lakh women" fmt={one} values={tile((s) => s.ratePerLakhWomen, stateTip)} />,
              },
              {
                label: "Cases, both rows",
                body: <TileMap label="Rape FIRs, both rows, 2024" unit="Cases" digits={0} fmt={inr} values={tile((s) => s.both, stateTip)} />,
              },
            ]}
          />
        </Figure>
        <div className="grid2">
          <Figure title="Most FIRs" sub="Ten states and UTs by cases, both rows, 2024" legend={[{ color: BLUE, label: "Section 376" }, { color: SAFFRON, label: "POCSO 4 & 6" }]}>
            <HBars
              label="States with the most rape FIRs"
              rows={topCount.map((s) => ({
                label: s.name,
                segs: [
                  { key: "a", value: s.rape, color: BLUE },
                  { key: "b", value: s.childRapePocso, color: SAFFRON },
                ],
                value: inr(s.both),
                tip: stateTip(s),
              }))}
            />
          </Figure>
          <Figure title="Highest rate" sub="Ten states by FIRs per lakh women, both rows, 2024. Union territories left out: a few cases swing their rate." legend={[{ color: BLUE, label: "Section 376" }, { color: SAFFRON, label: "POCSO 4 & 6" }]}>
            <HBars
              label="States with the highest rape rate"
              rows={topRate.map((s) => ({
                label: s.name,
                segs: [
                  { key: "a", value: s.ratePerLakhWomen, color: BLUE },
                  { key: "b", value: s.childRapePocsoRate, color: SAFFRON },
                ],
                value: one(s.bothRate),
                tip: stateTip(s),
              }))}
            />
          </Figure>
        </div>
        <Callout label="Why this page adds the two rows">
          States file child rape differently. {zeroGirls.slice(0, -1).join(", ")}{zeroGirls.length > 1 ? " and " : ""}{zeroGirls[zeroGirls.length - 1]} put
          no girl under eighteen in the section 376 row: every such case went to POCSO. Himachal Pradesh, Goa and Chandigarh
          did the opposite and filed most such cases under section 376. A ranking on section 376 alone compares filing habits as much as crime. Adding the two rows puts
          every state on the same footing.{c("ncrb-cii-2024-3a2", "ncrb-cii-2024-3a3")}
        </Callout>
        <details className="more">
          <summary>All 36 states and union territories</summary>
          <DataTable
            rows={states}
            search="Find a state or union territory"
            caption="Rates are per lakh women, as the Bureau prints them. “Both rows” is section 376 plus POCSO sections 4 and 6, added here."
            cols={[
              { label: "Both rows, 2024", value: (s) => s.both },
              { label: "Rate, both rows", value: (s) => s.bothRate, fmt: one },
              { label: "s.376, 2024", value: (s) => s.rape },
              { label: "s.376, 2023", value: (s) => s.rape2022 },
              { label: "s.376 rate", value: (s) => s.ratePerLakhWomen, fmt: one },
              { label: "POCSO 4 & 6", value: (s) => s.childRapePocso },
              { label: "Offender known", value: (s) => s.knownShare, fmt: (v) => `${one(v)}%` },
            ]}
          />
        </details>
      </Section>

      <Section
        id="offenders"
        kicker="Who"
        title="Almost always someone she knew"
        lede={
          <>
            The police record the offender’s relation to the victim. For section 376, a stranger or unidentified person
            was recorded in {inr(rel.unknown)} of {inr(rel.total)} cases, {one(pct(rel.unknown, rel.total))}%. For child
            rape under POCSO it was {inr(kid.unknown)} of {inr(kid.total)}.{c("ncrb-cii-2024-3a4", "ncrb-cii-2024-4a10")}
          </>
        }
      >
        <div className="grid2">
          <Figure title="Section 376: who the offender was" sub={`${inr(rel.total)} cases, 2024`}>
            <Parts
              label="Offender relation, section 376, 2024"
              total={rel.total}
              parts={[
                { label: "Friend, online friend, live-in partner, promise of marriage, separated husband", value: rel.friendsOrPartners, color: BLUE, note: "One row in the Bureau’s table. It is not split further." },
                { label: "Neighbour, employer or other known person", value: rel.otherKnown, color: SAFFRON },
                { label: "Family member", value: rel.family, color: GREY },
                { label: "Unknown or not identified", value: rel.unknown, color: PALE },
              ]}
            />
          </Figure>
          <Figure title="POCSO child rape: who the offender was" sub={`${inr(kid.total)} cases, girls and boys, 2024`}>
            <Parts
              label="Offender relation, POCSO sections 4 and 6, 2024"
              total={kid.total}
              parts={[
                { label: "Friend, online friend or live-in partner, including on promise of marriage", value: kid.friendsOrPartners, color: BLUE },
                { label: "Family friend, neighbour, employer or other known person", value: kid.otherKnown, color: SAFFRON },
                { label: "Family member", value: kid.family, color: GREY },
                { label: "Unknown or not identified", value: kid.unknown, color: PALE },
              ]}
            />
          </Figure>
        </div>
        <div className="grid2">
          <Prose>
            <p>
              The largest group, {inr(rel.friendsOrPartners)} cases, puts friends, online friends, live-in partners, a
              man who promised marriage and a separated husband in one row. How many were promise-of-marriage cases
              cannot be read from these tables, and this page does not guess.{c("ncrb-cii-2024-3a4")}
            </p>
            <p>
              Gang rape (section 376D, now BNS section 70) was {inr(r23.sectionWise.gangRape)} cases,{" "}
              {one(pct(r23.sectionWise.gangRape, n.rape))}% of section 376. Rape in custody was{" "}
              {inr(r23.sectionWise.custodialTotal)} cases, {inr(r23.sectionWise.custodialByPolice)} of them by police
              personnel.{c("ncrb-cii-2024-3a11")}
            </p>
          </Prose>
          <Figure title="Victims of section 376, by age" sub={`${inr(age.victims)} victims, 2024`} note={<>Most girls under eighteen are in the POCSO row, not here.{c("ncrb-cii-2024-3a3")}</>}>
            <Columns
              label="Rape victims by age, 2024"
              height={220}
              rows={[
                ["Under 18", age.child],
                ["18–30", age.age18to30],
                ["30–45", age.age30to45],
                ["45–60", age.age45to60],
                ["60+", age.age60plus],
              ].map(([label, v]) => ({
                label: String(label),
                segs: [{ key: "v", value: Number(v), color: BLUE }],
                tip: `${label}: ${inr(Number(v))} victims (${one(pct(Number(v), age.victims))}%)`,
              }))}
            />
          </Figure>
        </div>
      </Section>

      <Section
        id="unreported"
        tone="edge"
        kicker="What the count misses"
        title="Most sexual violence never becomes an FIR"
        lede={
          <>
            The Health Ministry’s National Family Health Survey asked women directly, in 2019–21. Its answers describe
            what a police register cannot see.{c("nfhs5-india-ch15")}
          </>
        }
      >
        <Stats>
          <Stat value="6%" label="Ever faced sexual violence" sub="of women aged 18 to 49, by anyone, in their lifetime." />
          <Stat value="82%" label="Named their husband" sub="of ever-married women who faced sexual violence. 14% named a former husband." />
          <Stat value="77%" label="Told no one" sub="of women who faced physical or sexual violence. 14% sought any help." />
          <Stat value="~1 in 100" label="Went to the police" sub="of women who faced physical or sexual violence, from any source (not rape alone): 14% sought help × 6.3% of those went to the police. Computed here." />
        </Stats>
        <Callout label="Why a husband’s rape is not in the count">
          The law says sexual intercourse by a man with his own wife, when she is eighteen or older, is not rape. The
          survey counts it. The rape row cannot.{c("bns-2023-s63")}
        </Callout>
        <Callout label="No “true number” here" tone="urgent">
          The survey measures whether a woman was ever abused in her life. The FIR count is complaints registered in one
          year. Any figure that multiplies one by the other is an estimate. This page does not print one.
        </Callout>
      </Section>

      <Section
        id="justice"
        kicker="After the FIR"
        title="Few cases reach a verdict. Fewer end in conviction."
        lede={
          <>
            Police investigated {inr(police.forInvestigation)} rape cases in 2024, including cases carried over from
            earlier years. Courts had {inr(court.forTrial)} before them. These are the Bureau’s disposal tables for the
            same year.{c("ncrb-cii-2024-3a5", "ncrb-cii-2024-3a7")}
          </>
        }
      >
        <div className="grid2">
          <Figure title="Police: what happened to the cases" sub={`${inr(police.forInvestigation)} cases for investigation, 2024`}>
            <Parts
              label="Police disposal of rape cases, 2024"
              total={police.forInvestigation}
              parts={[
                { label: "Chargesheet filed", value: police.chargesheeted, color: BLUE },
                { label: "Closed as false", value: police.finalReportFalse, color: SAFFRON, note: "The police’s own finding at the end of an investigation." },
                { label: "Closed for other reasons, transferred or quashed", value: closedOther, color: GREY, note: `True but no evidence or untraced ${inr(police.trueButInsufficientOrUntraced)}; mistake of fact or law or civil dispute ${inr(police.mistakeOfFactOrLawOrCivil)}.` },
                { label: "Still under investigation at year end", value: police.pendingAtYearEnd, color: PALE },
              ]}
            />
          </Figure>
          <Figure title="Courts: what happened to the cases" sub={`${inr(court.forTrial)} section 376 cases for trial, 2024`}>
            <Parts
              label="Court disposal of rape cases, 2024"
              total={court.forTrial}
              parts={[
                { label: "Convicted", value: court.convicted, color: BLUE },
                { label: "Acquitted", value: court.acquitted, color: SAFFRON },
                { label: "Discharged, withdrawn or otherwise disposed", value: courtOther, color: GREY },
                { label: "Still pending at year end", value: court.pendingAtYearEnd, color: PALE },
              ]}
            />
          </Figure>
        </div>
        <Stats>
          <Stat value={`${one(court.convictionRate)}%`} label="Conviction rate, s.376" delta={{ text: `from ${one(prev.court.rape.convictionRate)}%`, dir: "down" }} sub={<>in 2023. Convictions ÷ trials finished.{c("ncrb-cii-2024-3a7", "ncrb-cii-2023-3a7")}</>} />
          <Stat value={`${one(kidCourt.convictionRate)}%`} label="Conviction rate, POCSO 4 & 6" sub={<>{inr(kidCourt.convicted)} convictions in {inr(kidCourt.trialsCompleted)} trials.{c("ncrb-cii-2024-3a7")}</>} />
          <Stat value={`${one(Math.round((court.pendingAtYearEnd / court.trialsCompleted) * 10) / 10)}×`} label="Backlog" sub={`${inr(court.pendingAtYearEnd)} pending cases, against ${inr(court.trialsCompleted)} trials finished in the year. Computed here.`} />
          <Stat value={`${one(pct(police.finalReportFalse, police.disposedByPolice))}%`} label="Closed as false" sub={`${inr(police.finalReportFalse)} of ${inr(police.disposedByPolice)} cases the police disposed of. Computed here.`} />
        </Stats>
        <Callout label="Read before quoting these">
          A conviction rate is convictions divided by trials finished that year, most of them from FIRs of earlier years.
          It is not convictions divided by FIRs. An acquittal means the charge was not proved; it is not a finding that
          the complaint was false. The police’s “false” closures are {one(pct(police.finalReportFalse, police.disposedByPolice))}%
          of their disposals. Neither number supports the claim that most complaints are invented, and neither shows
          that none are.
        </Callout>
      </Section>

      <Section
        id="records"
        tone="edge"
        kicker="Other government records"
        title="What the courts, the Commission for Women and the states record"
        lede={
          <>
            The Bureau is one part of government. The Law Ministry runs fast-track courts for rape and POCSO cases, the
            National Commission for Women takes complaints directly, and state police publish their own counts. Their
            figures, read from their own releases and sites.
            {c(ftsc.asOn2025_06_30.source, ftsc.year2024.source, ftsc.pendencySource, ncwComplaints.source, keralaCheck.source)}
          </>
        }
      >
        <Stats>
          <Stat value={inr(ftsc.asOn2025_06_30.functionalCourts)} label="Fast-track special courts" sub={<>working on 30 June 2025, {inr(ftsc.asOn2025_06_30.exclusivePocso)} of them for POCSO only, in {ftsc.asOn2025_06_30.statesUts} states and UTs.{c(ftsc.asOn2025_06_30.source)}</>} />
          <Stat value={inr(ftsc.asOn2025_06_30.disposedSinceInception)} label="Cases disposed since 2019" sub={<>by those courts. Disposed includes acquittals; it is not convictions.{c(ftsc.asOn2025_06_30.source)}</>} />
          <Stat value={`${inr(ftsc.year2024.disposed)} / ${inr(ftsc.year2024.instituted)}`} label="Disposed / filed, 2024" sub={<>The Ministry calls this a 96.28% “disposal rate”. More cases arrived than left.{c(ftsc.year2024.source)}</>} />
          <Stat value={`${one(ftsc.disposalPerCourtPerMonth.ftsc)} vs ${one(ftsc.disposalPerCourtPerMonth.regularCourts)}`} label="Disposals per court per month" sub={<>fast-track courts against regular courts, as the Ministry estimates.{c(ftsc.disposalPerCourtPerMonth.source)}</>} />
        </Stats>
        <div className="grid2">
          <Figure title="Cases pending in fast-track courts, by state" sub={`${inr(ftsc.pendencyTotal)} in all (computed). Department of Justice dashboard, read 27 September 2026.`} note={<>Jharkhand shows none because it left the scheme in July 2025. The dashboard gives no as-on date.{c(ftsc.pendencySource, ftsc.asOn2025_06_30.source)}</>}>
            <HBars
              label="Pendency in fast-track special courts by state"
              rows={ftsc.pendencyByState.slice(0, 12).map(([name, v]) => ({ label: name, segs: [{ key: "p", value: v, color: BLUE }], value: inr(v), tip: `${name}: ${inr(v)} cases pending in fast-track special courts (${one(pct(v, ftsc.pendencyTotal))}% of all)` }))}
            />
          </Figure>
          <Figure title="Complaints of rape or attempted rape to the NCW" sub="National Commission for Women, complaints received each year. Not FIRs." note={<>“Police apathy” complaints, where a woman says the police did not act, were {inr(ncwComplaints.years[0]!.policeApathy)} in 2019 and {inr(ncwComplaints.years[ncwComplaints.years.length - 1]!.policeApathy)} in 2025. The Commission changed its categories in 2019, so earlier years are left out.{c(ncwComplaints.source)}</>}>
            <Columns
              label="NCW complaints of rape or attempt to rape, 2019 to 2025"
              height={230}
              rows={ncwComplaints.years.map((y) => ({ label: String(y.year), segs: [{ key: "r", value: y.rapeOrAttempt, color: PLUM }], tip: `${y.year}: ${inr(y.rapeOrAttempt)} rape or attempted-rape complaints · ${inr(y.policeApathy)} police-apathy complaints · ${inr(y.total)} complaints in all` }))}
            />
          </Figure>
        </div>
        <Callout label="A state’s own count agrees with this page’s sum">
          Kerala Police publish rape counts that include child rape under POCSO. For 2022 and 2023 their figure equals the
          Bureau’s section 376 row plus its POCSO row exactly. For 2024 Kerala’s live figure is higher by{" "}
          {inr(keralaCheck.rows.find((r) => r.head === "Rape" && r.year === 2024)!.state - keralaCheck.rows.find((r) => r.head === "Rape" && r.year === 2024)!.ncrb)}; the
          two records do not say why.{c(keralaCheck.source, "ncrb-cii-2022-v1", "ncrb-cii-2023-3a2", "ncrb-cii-2024-v1")}
        </Callout>
        <CheckTable
          left="Kerala Police"
          right="NCRB (s.376 + POCSO 4 & 6)"
          caption="Kerala Police state-wide rape counts beside NCRB’s Kerala rows added together."
          rows={keralaCheck.rows.filter((r) => r.head === "Rape").map((r) => ({ label: `Rape, ${r.year}`, a: r.state, b: r.ncrb }))}
        />
        <Callout label="A second state, counted the other way">
          Karnataka’s State Crime Records Bureau reports section 376 and POCSO child rape as separate lines, as the Bureau does.
          Every figure checked, 2022 to 2024, matches the Bureau’s Karnataka rows exactly.{c(karnatakaCheck.source)}
        </Callout>
        <CheckTable
          left="Karnataka Police"
          right="NCRB"
          caption="Crime in Karnataka reports beside NCRB’s Karnataka rows."
          rows={karnatakaCheck.rows.filter((r) => r.head.startsWith("Rape") || r.head.startsWith("POCSO")).map((r) => ({ label: `${r.head}, ${r.year}`, a: r.state, b: r.ncrb }))}
        />
      </Section>

      <Section
        id="cities"
        tone="edge"
        kicker="Cities"
        title="Nineteen cities, very different police registers"
        lede={
          <>
            Metropolitan city figures are already inside the state totals. City rates use the 2011 census, so they cannot
            be set beside state rates. Jaipur registered {inr(cities.find((x) => x.name.startsWith("Jaipur"))!.rape)}{" "}
            section 376 cases; Kolkata registered {inr(cities.find((x) => x.name.startsWith("Kolkata"))!.rape)}. A gap that
            wide is at least partly a difference in what each police force writes down.{c("ncrb-cii-2024-3b2")}
          </>
        }
      >
        <Figure title="Rape FIRs per lakh women, by city, 2024" sub="Both rows. Rates on the 2011 census population." legend={[{ color: BLUE, label: "Section 376" }, { color: SAFFRON, label: "POCSO 4 & 6" }]}>
          <HBars
            label="City rape rates"
            rows={by(cities, (x) => x.bothRate).map((x) => ({
              label: x.name,
              segs: [
                { key: "a", value: x.ratePerLakhWomen, color: BLUE },
                { key: "b", value: x.childRapePocsoRate, color: SAFFRON },
              ],
              value: one(x.bothRate),
              tip: `${x.name}: ${inr(x.both)} FIRs (${inr(x.rape)} s.376, ${inr(x.childRapePocso)} POCSO) · ${one(x.bothRate)} per lakh women`,
            }))}
          />
        </Figure>
        <details className="more">
          <summary>City table</summary>
          <DataTable
            rows={cities}
            search="Find a city"
            caption="Rates per lakh women on the 2011 census, as the Bureau prints them."
            cols={[
              { label: "Both rows, 2024", value: (x) => x.both },
              { label: "Rate, both rows", value: (x) => x.bothRate, fmt: one },
              { label: "s.376, 2024", value: (x) => x.rape },
              { label: "s.376, 2023", value: (x) => x.rape2022 },
              { label: "POCSO 4 & 6", value: (x) => x.childRapePocso },
            ]}
          />
        </details>
      </Section>

      <Section
        id="districts"
        kicker="Every district"
        title="Section 376 cases by district, 2022"
        lede={
          <>
            The Bureau has published district tables for 2022, not yet for 2023 or 2024. Each spot is a district or city police
            unit; its area is the number of cases, not a rate. {inr(rapePlaces.plottedCases)} of {inr(rapePlaces.totalCases)} cases
            are located on the map; the rest are remainder rows the district file does not place.
          </>
        }
      >
        <div className="district-map" data-district-map data-src="/crime/rape/districts.json">
          <div className="dm-canvas" role="application" aria-label="Map of section 376 cases by district, 2022" />
          <div className="dm-rail">
            <label>
              <span className="sr-only">Find a district</span>
              <input type="search" placeholder="Find a district or city" />
            </label>
            <ol />
            <p className="hint">Largest first. Cases: NCRB, district-wise crimes against women, 2022. Boundaries: Bhuvan, ISRO/NRSC. A spot marks the district or police unit, not where a crime happened.</p>
          </div>
        </div>
      </Section>

      <Sources refs={refs} />
    </Page>
  );
}
