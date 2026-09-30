import React from "react";
import { ncrb2022 } from "../../../../src/data/crime/ncrb2022";
import { ncrb2023 } from "../../../../src/data/crime/ncrb2023";
import { ncrb2024More as m } from "../../../../src/data/crime/ncrb2024";
import { ncrb2023More as m23 } from "../../../../src/data/crime/ncrb2023More";
import { propertySeries } from "../../../../src/data/crime/decadeSeries";
import { composition2024 as k24 } from "../../../../src/data/crime/composition";
import { karnatakaCheck, keralaCheck } from "../../../../src/data/crime/govRecords";
import { BLUE, CheckTable, Columns, DataTable, Figure, GREY, HBars, PALE, Parts, PartsTable, PLUM, SAFFRON, Tabs, TileMap } from "../charts";
import { Callout, change, Hero, inr, lakh, one, Page, pct, Prose, Refs, Section, signed, Sources, Stat, Stats } from "../kit";

const N = m.national;
const kinds = Object.fromEntries(ncrb2022.states.map((s) => [s.name, s.kind]));
const states = m.states.map((s) => ({ ...s, kind: kinds[s.name]! }));
const cities = m.cities.map((x) => {
  const parent = ncrb2022.cities.find((old) => old.name === x.name)?.parent;
  return { ...x, name: parent && x.name !== "Delhi City" ? `${x.name}, ${parent}` : x.name };
});
const by = <T,>(rows: T[], f: (r: T) => number) => [...rows].sort((a, b) => f(b) - f(a));
const p0 = propertySeries[0]!;
const pN = propertySeries[propertySeries.length - 1]!;
const peak = [...propertySeries].sort((a, b) => b.vehicleTheft + b.otherTheft - (a.vehicleTheft + a.otherTheft))[0]!;
const HEADS = [
  { key: "theft", label: "Theft", law: "s.379" },
  { key: "burglary", label: "Burglary", law: "s.454–460" },
  { key: "robbery", label: "Robbery", law: "s.392–397" },
  { key: "dacoity", label: "Dacoity", law: "s.395–397" },
] as const;

export function StealingPage() {
  const refs = new Refs();
  const c = refs.cite;
  const delhi = states.find((s) => s.name === "Delhi")!;
  const delhiCity = cities.find((x) => x.name === "Delhi City")!;
  const manipur = states.find((s) => s.name === "Manipur")!;
  const manipur22 = ncrb2022.states.find((s) => s.name === "Manipur")!;
  const manipur23 = m23.states.find((s) => s.name === "Manipur")!;
  const value = m.propertyValue;
  const value23 = ncrb2023.propertyValue;
  const share = pct(delhi.theft.cases, N.theft.y2024.cases);
  const popShare = pct(delhi.populationLakh, states.reduce((t, s) => t + s.populationLakh, 0));
  const ratio = Math.round(N.theft.y2024.cases / N.dacoity.y2024.cases);
  const police = ncrb2022.police.theft;
  const court = ncrb2022.court.theft;
  const tip = (s: (typeof states)[number]) =>
    `${s.name}: theft ${inr(s.theft.cases)} (${one(s.theft.rate)}/lakh) · burglary ${inr(s.burglary.cases)} · robbery ${inr(s.robbery.cases)} · dacoity ${inr(s.dacoity.cases)}`;
  const tile = (f: (s: (typeof states)[number]) => number) => Object.fromEntries(states.map((s) => [s.name, { value: f(s), tip: tip(s) }]));

  return (
    <Page
      id="stealing"
      path="/crime/stealing"
      title="Theft and robbery in India, counted — Crime in India"
      description="6.2 lakh thefts were registered in India in 2024; Delhi alone registered nearly a third. Theft, burglary, robbery and dacoity by state and city, with recovery and courts, from NCRB tables."
    >
      <Hero
        eyebrow="Theft, burglary, robbery, dacoity · Crime in India 2024"
        title={`${lakh(N.theft.y2024.cases)} thefts registered in 2024.`}
        accent={`Delhi registered ${one(share)}% of them.`}
        actions={[
          { href: "#states", label: "See the states" },
          { href: "#recovery", label: "What was recovered" },
        ]}
        caveat="Four separate heads, kept apart as the Bureau keeps them: theft is taking without force, burglary is breaking in, robbery is taking by force, dacoity is robbery by five or more."
      >
        Theft FIRs fell in 2024, from {inr(N.theft.y2023!.cases)} to {inr(N.theft.y2024.cases)}, after rising every year
        since 2020. Some of the fall may be a change in the law: snatching became its own crime, {inr(N.snatching.y2024.cases)} cases
        in half a year. Robbery fell to {inr(N.robbery.y2024.cases)}. Delhi, with {one(popShare)}% of the Bureau’s projected population, registered{" "}
        {inr(delhi.theft.cases)} thefts.{c("ncrb-cii-2024-1-2", "ncrb-cii-2024-1a4")}
      </Hero>

      <Section
        id="decade"
        kicker="Ten years"
        title="Theft and robbery, 2015 to 2024, by kind"
        lede={
          <>
            Each bar is one year’s FIRs, read from that year’s own Crime in India volume. Stealing without force and
            taking by force are drawn as two charts: theft is so much larger that robbery would vanish on one axis.
            Theft rose from {inr(p0.vehicleTheft + p0.otherTheft)} in 2015 to a peak of {inr(peak.vehicleTheft + peak.otherTheft)} in{" "}
            {peak.year}. Robbery fell from {inr(p0.robbery)} to {inr(pN.robbery)}.
            {c(...propertySeries.map((r) => r.source).filter((v, i, a) => a.indexOf(v) === i))}
          </>
        }
      >
        <div className="stack">
          <Figure
            wide
            title="Taken without force: theft and burglary"
            sub="Cases registered each year. Hover or tab to a bar for its parts."
            legend={[
              { color: BLUE, label: "Vehicle theft" },
              { color: SAFFRON, label: "Other theft" },
              { color: PLUM, label: "Burglary (breaking into a house or building)" },
            ]}
            note="2020 was the lockdown year. 2015 figures are from the 2016 and 2017 volumes; 2015 and 2016 vehicle-theft splits from the 2017 volume. 2019 is the 2019 volume as first printed; later volumes revise it slightly after West Bengal’s late data. 2024 combines IPC and Bharatiya Nyaya Sanhita cases."
          >
            <div className="viz-scroll">
              <Columns
                wide
                height={320}
                label="Theft and burglary by kind, 2015 to 2024"
                fmt={(v) => (v >= 100000 ? `${one(v / 100000)} lakh` : inr(v))}
                rows={propertySeries.map((r) => ({
                  label: String(r.year),
                  cap: `${one((r.vehicleTheft + r.otherTheft + r.burglary) / 100000)} lakh`,
                  segs: [
                    { key: "v", value: r.vehicleTheft, color: BLUE },
                    { key: "o", value: r.otherTheft, color: SAFFRON },
                    { key: "b", value: r.burglary, color: PLUM },
                  ],
                  tip: `${r.year}: ${inr(r.vehicleTheft + r.otherTheft + r.burglary)} · vehicle theft ${inr(r.vehicleTheft)} · other theft ${inr(r.otherTheft)} · burglary ${inr(r.burglary)}${r.note ? ` · ${r.note}` : ""}`,
                }))}
              />
            </div>
          </Figure>
          <Figure
            wide
            title="Taken by force: robbery and dacoity"
            sub="Cases registered each year. Dacoity is robbery by five or more people."
            legend={[
              { color: BLUE, label: "Robbery" },
              { color: SAFFRON, label: "Dacoity" },
            ]}
            note="The 2023 dacoity bump is almost all Manipur: 1 case in 2022, 1,213 in 2023. From July 2024 the Bharatiya Nyaya Sanhita made snatching (12,644 cases in 2024) its own crime; under the IPC it was filed as theft or robbery. Some of the 2024 fall in both charts may be that change in counting."
          >
            <div className="viz-scroll">
              <Columns
                wide
                height={280}
                label="Robbery and dacoity, 2015 to 2024"
                rows={propertySeries.map((r) => ({
                  label: String(r.year),
                  segs: [
                    { key: "r", value: r.robbery, color: BLUE },
                    { key: "d", value: r.dacoity, color: SAFFRON },
                  ],
                  tip: `${r.year}: ${inr(r.robbery + r.dacoity)} · robbery ${inr(r.robbery)} · dacoity ${inr(r.dacoity)}`,
                }))}
              />
            </div>
          </Figure>
        </div>
        <details className="more">
          <summary>The numbers behind each bar</summary>
          <DataTable
            rows={propertySeries.map((r) => ({ ...r, name: String(r.year) }))}
            search="Find a year"
            keepOrder
            caption="Cases registered. Each year from its own Crime in India volume; see the sources below."
            cols={[
              { label: "Vehicle theft", value: (r) => r.vehicleTheft },
              { label: "Other theft", value: (r) => r.otherTheft },
              { label: "Burglary", value: (r) => r.burglary },
              { label: "Robbery", value: (r) => r.robbery },
              { label: "Dacoity", value: (r) => r.dacoity },
            ]}
          />
        </details>
      </Section>

      <Section
        id="parts"
        tone="edge"
        kicker="What the count is made of"
        title="Every part over 10%, and the new head that took some of the count"
        lede={
          <>
            2024 theft is mostly “other theft” and vehicle theft; the new law split out household theft and a few smaller
            kinds. Robbery is almost all robbery by fewer than five people; dacoity is about a tenth of it. From July 2024,
            snatching became its own crime, and in half a year it reached more than half the size of robbery.
            {c("ncrb-cii-2024-v1")}
          </>
        }
      >
        <div className="grid2">
          <Figure title="Theft by kind, 2024" sub={`${inr(k24.theft.total)} cases`}>
            <Parts
              label="Theft by kind, 2024"
              total={k24.theft.total}
              parts={[
                { label: "Other theft", value: k24.theft.other, color: SAFFRON },
                { label: "Vehicle theft", value: k24.theft.vehicle, color: BLUE },
                { label: "Household theft (new BNS head)", value: k24.theft.household, color: PLUM },
                { label: "Theft from vehicles, of government property, by servants, of idols", value: k24.theft.fromVehicles + k24.theft.government + k24.theft.byServant + k24.theft.idol, color: GREY },
              ]}
            />
          </Figure>
          <Figure title="Taken by force, 2024" sub="Robbery and dacoity, beside the new snatching head">
            <HBars
              label="Robbery, dacoity and snatching, 2024"
              rows={[
                { label: "Robbery", value: k24.robbery.robbery, color: BLUE },
                { label: "Snatching (new BNS head, July to December)", value: k24.robbery.snatching, color: SAFFRON },
                { label: "Dacoity (five or more people)", value: k24.robbery.dacoity, color: BLUE },
              ].map((x) => ({ label: x.label, segs: [{ key: "v", value: x.value, color: x.color }], value: inr(x.value), tip: `${x.label}: ${inr(x.value)} cases in 2024` }))}
            />
          </Figure>
        </div>
        <PartsTable
          shareOf="Share"
          caption="Parts of 10% or more are marked. Theft shares are of all theft in 2024; robbery-side shares are of robbery in 2024."
          rows={[
            { part: "Other theft", value: inr(k24.theft.other), share: pct(k24.theft.other, k24.theft.total), where: "inside", note: "of theft" },
            { part: "Vehicle theft", value: inr(k24.theft.vehicle), share: pct(k24.theft.vehicle, k24.theft.total), where: "inside", note: "of theft" },
            { part: "Household theft", value: inr(k24.theft.household), share: pct(k24.theft.household, k24.theft.total), where: "inside", note: "of theft; new head under the BNS" },
            { part: "Dacoity", value: inr(k24.robbery.dacoity), share: pct(k24.robbery.dacoity, k24.robbery.robbery), where: "outside", note: "size relative to robbery; its own head" },
            { part: "Snatching", value: inr(k24.robbery.snatching), share: pct(k24.robbery.snatching, k24.robbery.robbery), where: "outside", note: "size relative to robbery; before July 2024 filed as theft or robbery" },
          ]}
        />
      </Section>

      <Section
        id="count"
        kicker="The count"
        title="Four heads, four very different sizes"
        lede={<>Each chart has its own scale: theft is {inr(ratio)} times dacoity, so one axis would flatten three of the four. Rate is per lakh people.{c("ncrb-cii-2024-1-2", "ncrb-cii-2023-1-2")}</>}
      >
        <Stats>
          {HEADS.map((h) => {
            const s = N[h.key];
            const d = change(s.y2024.cases, s.y2023!.cases);
            return (
              <Stat
                key={h.key}
                value={inr(s.y2024.cases)}
                label={`${h.label}, ${h.law}`}
                delta={{ text: signed(d), dir: d > 0 ? "up" : d < 0 ? "down" : "flat" }}
                sub={`on 2023. ${one(s.y2024.rate)} per lakh people.`}
              />
            );
          })}
        </Stats>
        <div className="grid2">
          {HEADS.map((h) => {
            const t = ncrb2022.trends[h.key];
            const rows = [
              { year: 2020, ...t.y2020 },
              { year: 2021, ...t.y2021 },
              { year: 2022, ...N[h.key].y2022! },
              { year: 2023, ...N[h.key].y2023! },
              { year: 2024, ...N[h.key].y2024 },
            ];
            return (
              <Figure key={h.key} title={h.label} sub="Cases registered, 2020 to 2024">
                <Columns
                  label={`${h.label} cases, 2020 to 2024`}
                  height={200}
                  rows={rows.map((r) => ({ label: String(r.year), segs: [{ key: "v", value: r.cases, color: h.key === "theft" ? SAFFRON : BLUE }], tip: `${r.year}: ${inr(r.cases)} · ${one(r.rate)} per lakh people` }))}
                />
              </Figure>
            );
          })}
        </div>
        <Prose>
          <p>
            Within theft, vehicle theft was {inr(N.autoTheft.y2024.cases)} cases in 2024, {one(pct(N.autoTheft.y2024.cases, N.theft.y2024.cases))}% of the
            total, against {inr(N.autoTheft.y2023!.cases)} in 2023. Dacoity fell to {inr(N.dacoity.y2024.cases)}, back from a 2023
            spike that was almost all one state: Manipur registered {inr(manipur22.dacoity.cases)} dacoity case in 2022,{" "}
            {inr(manipur23.dacoity.cases)} in 2023 and {inr(manipur.dacoity.cases)} in 2024.{c("ncrb-cii-2024-1-2", "ncrb-cii-2024-1a4", "ncrb-cii-2023-1a4", "ncrb-cii-2022-1a4")}
          </p>
        </Prose>
      </Section>

      <Section
        id="states"
        tone="edge"
        kicker="Where"
        title={`One city-state registers ${one(share)}% of India’s thefts`}
        lede={
          <>
            Delhi registered {inr(delhi.theft.cases)} thefts in 2024, {one(delhi.theft.rate)} per lakh people. The national
            rate is {one(N.theft.y2024.rate)}. Either Delhi has a far larger share of India’s theft than its population, or
            Delhi’s police register theft far more readily than other states’. These tables cannot say which, and the
            Bureau warns against comparing states on its figures alone. One difference is on record: Delhi Police let
            people register a motor-vehicle theft FIR online.{c("ncrb-cii-2024-1a4", "delhi-police-mvt")}
          </>
        }
      >
        <Figure title="Property crime per lakh people, 2024" sub="Each square is a state or union territory, placed roughly where it lies." note="Squares are equal in size on purpose. The grid is not a map and draws no borders. Delhi’s theft rate is so high that it sits alone in the darkest band.">
          <Tabs
            id="property-maps"
            tabs={[
              { label: "Theft", body: <TileMap label="Theft rate by state, 2024" unit="Theft per lakh" fmt={one} values={tile((s) => s.theft.rate)} /> },
              { label: "Burglary", body: <TileMap label="Burglary rate by state, 2024" unit="Burglary per lakh" fmt={one} values={tile((s) => s.burglary.rate)} /> },
              { label: "Robbery", body: <TileMap label="Robbery rate by state, 2024" unit="Robbery per lakh" fmt={one} values={tile((s) => s.robbery.rate)} /> },
            ]}
          />
        </Figure>
        <div className="grid2">
          <Figure title="Most thefts" sub="Ten states and UTs by cases, 2024">
            <HBars label="States with the most thefts" rows={by(states, (s) => s.theft.cases).slice(0, 10).map((s) => ({ label: s.name, segs: [{ key: "t", value: s.theft.cases, color: SAFFRON }], value: inr(s.theft.cases), tip: tip(s) }))} />
          </Figure>
          <Figure title="Most robberies" sub="Ten states and UTs by cases, 2024">
            <HBars label="States with the most robberies" rows={by(states, (s) => s.robbery.cases).slice(0, 10).map((s) => ({ label: s.name, segs: [{ key: "r", value: s.robbery.cases, color: BLUE }], value: inr(s.robbery.cases), tip: tip(s) }))} />
          </Figure>
        </div>
        <details className="more">
          <summary>All 36 states and union territories</summary>
          <DataTable
            rows={states}
            search="Find a state or union territory"
            caption="Cases registered in 2024. Rates per lakh people on the Bureau’s 2024 projected population."
            cols={[
              { label: "Theft", value: (s) => s.theft.cases },
              { label: "Theft rate", value: (s) => s.theft.rate, fmt: one },
              { label: "Burglary", value: (s) => s.burglary.cases },
              { label: "Robbery", value: (s) => s.robbery.cases },
              { label: "Robbery rate", value: (s) => s.robbery.rate, fmt: one },
              { label: "Dacoity", value: (s) => s.dacoity.cases },
            ]}
          />
        </details>
      </Section>

      <Section
        id="recovery"
        kicker="What was recovered"
        title="Most of the stolen value never came back"
        lede={<>The Bureau prints the value of property the police recorded as stolen across property crimes, and the value recovered.{c("ncrb-cii-2024-v1", "ncrb-cii-2023-snapshot")}</>}
      >
        <Stats>
          <Stat value={`₹${inr(Math.round(value.stolenCrore))} cr`} label="Stolen, 2024" sub={`₹${inr(Math.round(value23.stolenCrore))} crore in 2023.`} />
          <Stat value={`₹${inr(Math.round(value.recoveredCrore))} cr`} label="Recovered, 2024" sub={`₹${inr(Math.round(value23.recoveredCrore))} crore in 2023.`} />
          <Stat value={`${one(value.recoveryPercent)}%`} label="Recovery rate" delta={{ text: `from ${one(value23.recoveryPercent)}%`, dir: value.recoveryPercent > value23.recoveryPercent ? "up" : "down" }} sub="in 2023. Value recovered ÷ value stolen." />
        </Stats>
        <div className="grid2">
          <Figure title="Theft: police, 2022" sub={`${inr(police.forInvestigation)} cases for investigation`} note={<>The 2023 and 2024 volumes read here do not print theft disposal; 2022 is the latest year with it.{c("ncrb-cii-2022-17a1")}</>}>
            <Parts
              label="Police disposal of theft cases, 2022"
              total={police.forInvestigation}
              parts={[
                { label: "Chargesheet filed", value: police.chargesheeted, color: BLUE },
                { label: "Closed without a chargesheet, transferred or otherwise disposed", value: police.forInvestigation - police.chargesheeted - police.pendingAtYearEnd, color: GREY },
                { label: "Still under investigation at year end", value: police.pendingAtYearEnd, color: PALE },
              ]}
            />
          </Figure>
          <Figure title="Theft: courts, 2022" sub={`${inr(court.forTrial)} cases for trial`} note={<>{one(court.convictionRate)}% conviction rate; {one(court.pendencyPercent)}% of cases still pending.{c("ncrb-cii-2022-18a1")}</>}>
            <Parts
              label="Court disposal of theft cases, 2022"
              total={court.forTrial}
              parts={[
                { label: "Convicted", value: court.convicted, color: BLUE },
                { label: "Acquitted", value: court.acquitted, color: SAFFRON },
                { label: "Discharged, withdrawn or otherwise disposed", value: court.forTrial - court.convicted - court.acquitted - court.pendingAtYearEnd, color: GREY },
                { label: "Still pending at year end", value: court.pendingAtYearEnd, color: PALE },
              ]}
            />
          </Figure>
        </div>
        <Callout label="Read before quoting">
          The theft chargesheeting rate in 2022 was {one(police.chargesheetRate)}%. For murder it was{" "}
          {one(ncrb2022.police.murder.chargesheetRate)}%. Most theft FIRs end with no one charged.{c("ncrb-cii-2022-17a1")}
        </Callout>
      </Section>

      <Section
        id="records"
        tone="edge"
        kicker="Other government records"
        title="Two states’ own counts, beside the Bureau’s"
        lede={
          <>
            Kerala Police and Karnataka’s State Crime Records Bureau publish state-wide counts of theft, burglary, robbery and
            dacoity. Every figure checked matches the Bureau’s row for that state exactly.
            {c(keralaCheck.source, karnatakaCheck.source, "ncrb-cii-2023-1a4", "ncrb-cii-2024-1a4")}
          </>
        }
      >
        <CheckTable
          left="State police"
          right="NCRB"
          caption="State police counts beside NCRB’s rows for the same state."
          rows={[
            ...keralaCheck.rows.filter((r) => ["Theft", "Burglary", "Robbery", "Dacoity"].includes(r.head)).map((r) => ({ label: `Kerala, ${r.head.toLowerCase()}, ${r.year}`, a: r.state, b: r.ncrb })),
            ...karnatakaCheck.rows.filter((r) => ["Theft", "Burglary", "Robbery", "Dacoity"].includes(r.head)).map((r) => ({ label: `Karnataka, ${r.head.toLowerCase()}, ${r.year}`, a: r.state, b: r.ncrb })),
          ]}
        />
      </Section>

      <Section
        id="cities"
        tone="edge"
        kicker="Cities"
        title="Delhi City sits far above every other metro"
        lede={<>Delhi City registered {inr(delhiCity.theft.cases)} thefts, {one(delhiCity.theft.rate)} per lakh people on the 2011 census. City figures are inside the state totals, and city rates cannot be set beside state rates.{c("ncrb-cii-2024-1b4")}</>}
      >
        <Figure title="Theft per lakh people, by city, 2024" sub="Rates on the 2011 census population">
          <HBars label="City theft rates" rows={by(cities, (x) => x.theft.rate).map((x) => ({ label: x.name, segs: [{ key: "t", value: x.theft.rate, color: SAFFRON }], value: one(x.theft.rate), tip: `${x.name}: ${inr(x.theft.cases)} thefts · ${inr(x.robbery.cases)} robberies · ${inr(x.burglary.cases)} burglaries` }))} />
        </Figure>
        <details className="more">
          <summary>City table</summary>
          <DataTable
            rows={cities}
            search="Find a city"
            caption="Cases registered in 2024. Rates per lakh people on the 2011 census."
            cols={[
              { label: "Theft", value: (x) => x.theft.cases },
              { label: "Theft rate", value: (x) => x.theft.rate, fmt: one },
              { label: "Burglary", value: (x) => x.burglary.cases },
              { label: "Robbery", value: (x) => x.robbery.cases },
              { label: "Dacoity", value: (x) => x.dacoity.cases },
            ]}
          />
        </details>
      </Section>

      <Sources refs={refs} />
    </Page>
  );
}
