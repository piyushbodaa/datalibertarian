import React from "react";
import { ncrb2022 } from "../../../../src/data/crime/ncrb2022";
import { ncrb2023 } from "../../../../src/data/crime/ncrb2023";
import { ncrb2024More as m } from "../../../../src/data/crime/ncrb2024";
import { murderSeries } from "../../../../src/data/crime/decadeSeries";
import { composition2024 as k24 } from "../../../../src/data/crime/composition";
import { karnatakaCheck, keralaCheck, nhrcCustody } from "../../../../src/data/crime/govRecords";
import { BLUE, CheckTable, Columns, DataTable, Figure, GREEN, GREY, HBars, PALE, Parts, PartsTable, PLUM, SAFFRON, Tabs, TileMap } from "../charts";
import { Callout, change, Hero, inr, one, Page, pct, Prose, Refs, Section, signed, Sources, Stat, Stats } from "../kit";

const nat = m.national.murder;
const kinds = Object.fromEntries(ncrb2022.states.map((s) => [s.name, s.kind]));
const states = m.states.map((s) => ({ ...s, kind: kinds[s.name]!, change: s.murder.y2023 ? change(s.murder.y2024, s.murder.y2023) : null }));
const cities = m.cities.map((x) => {
  const parent = ncrb2022.cities.find((old) => old.name === x.name)?.parent;
  return { ...x, name: parent && x.name !== "Delhi City" ? `${x.name}, ${parent}` : x.name };
});
const by = <T,>(rows: T[], f: (r: T) => number) => [...rows].sort((a, b) => f(b) - f(a));
const first = murderSeries[0]!;
const murderRest = k24.murder.cases - k24.murder.motives.disputes - k24.murder.motives.vendetta - k24.murder.motives.loveAffairs - k24.murder.motives.illicit - k24.murder.motives.gain;
const last = murderSeries[murderSeries.length - 1]!;

export function MurderPage() {
  const refs = new Refs();
  const c = refs.cite;
  const disputes = m.murderMotives.find((x) => x.label === "Disputes")!.cases;
  const v = m.murderVictims;
  const court22 = ncrb2022.court.murder;
  const police22 = ncrb2022.police.murder;
  const snap = m.disposal.murder;
  const up = states.find((s) => s.name === "Uttar Pradesh")!;
  const mn24 = states.find((s) => s.name === "Manipur")!.murder.y2024;
  const mn23 = states.find((s) => s.name === "Manipur")!.murder.y2023;
  const topRate = by(states.filter((s) => s.kind === "state"), (s) => s.murder.rate).slice(0, 4).map((s) => s.name);
  const tip = (s: (typeof states)[number]) =>
    `${s.name}: ${inr(s.murder.y2024)} murders in 2024 · ${one(s.murder.rate)} per lakh people · ${inr(s.murder.y2023)} in 2023`;
  const tile = (f: (s: (typeof states)[number]) => number) => Object.fromEntries(states.map((s) => [s.name, { value: f(s), tip: tip(s) }]));
  const courtOther = court22.forTrial - court22.convicted - court22.acquitted - court22.discharged - court22.pendingAtYearEnd;
  const policeOther = police22.forInvestigation - police22.chargesheeted - police22.pendingAtYearEnd;

  return (
    <Page
      id="murder"
      path="/crime/murder"
      title="Murder in India, counted — Crime in India"
      description="27,049 murders were registered in India in 2024, about a third of them over disputes. Rates by state and city, motives, victims and courts, from NCRB tables."
    >
      <Hero
        eyebrow="Murder · Crime in India 2024"
        title={`${inr(nat.y2024.cases)} murders registered in 2024.`}
        accent="One in three began as a dispute."
        actions={[
          { href: "#states", label: "See the states" },
          { href: "#why", label: "Why people were killed" },
        ]}
        caveat="Registered FIRs under section 302, as the National Crime Records Bureau published them. Culpable homicide not amounting to murder is a separate head and is not in this count."
      >
        Murder FIRs fell for the third year running, from {inr(ncrb2022.trends.murder.y2021.cases)} in 2021 to {inr(nat.y2024.cases)}.
        That is {one(nat.y2024.rate)} per lakh people. The police recorded a dispute as the motive in {inr(disputes)}{" "}
        cases: family, land, money, a petty quarrel.{c("ncrb-cii-2024-1-2", "ncrb-cii-2024-2a2")}
      </Hero>

      <Section
        id="decade"
        kicker="Ten years"
        title="Murders, 2015 to 2024, by motive"
        lede={
          <>
            Each bar is one year’s murder FIRs, read from that year’s own Crime in India volume. The count fell from{" "}
            {inr(first.cases)} in 2015 to {inr(last.cases)} in 2024, {one(Math.abs(change(last.cases, first.cases)))}% lower.
            Disputes have been the largest named motive in every year since the Bureau began grouping them in 2017.
            {c(...murderSeries.map((r) => r.source).filter((v, i, a) => a.indexOf(v) === i))}
          </>
        }
      >
        <Figure
          wide
          title="Murders registered each year, by the motive the police recorded"
          sub="Cases. Hover or tab to a bar for its parts."
          legend={[
            { color: SAFFRON, label: "Disputes (family, land, money, petty quarrel, road)" },
            { color: BLUE, label: "Personal vendetta or enmity" },
            { color: PLUM, label: "Love affairs or illicit relationship" },
            { color: GREEN, label: "Gain" },
            { color: GREY, label: "Other causes, no motive known, and smaller motives" },
            { color: PALE, label: "Not split: motives grouped differently before 2017" },
          ]}
          note={
            <>
              Before 2017 the motive table had no “disputes” group and put domestic disputes under “other causes”, so 2015
              and 2016 are shown whole. 2015’s own volume is not posted in full; its total is from the 2016 and 2017
              volumes. 2019 is the 2019 volume as first printed; later volumes and the Home Ministry’s answers to
              Parliament use a revised 28,915. Road rage, a separate row until 2019, is counted with disputes in every year, as the Bureau does from
              2020. 2024 combines IPC and Bharatiya Nyaya Sanhita cases.
            </>
          }
        >
          <div className="viz-scroll">
            <Columns
              wide
              height={320}
              label="Murders by motive, 2015 to 2024"
              marker={{ before: murderSeries.findIndex((r) => r.motives), label: "Motives grouped this way from 2017" }}
              rows={murderSeries.map((r) => {
                if (!r.motives) return { label: String(r.year), segs: [{ key: "all", value: r.cases, color: PALE }], tip: `${r.year}: ${inr(r.cases)} murders · motives not comparable` };
                const x = r.motives;
                const rest = r.cases - x.disputes - x.vendetta - x.loveOrIllicit - x.gain;
                return {
                  label: String(r.year),
                  segs: [
                    { key: "d", value: x.disputes, color: SAFFRON },
                    { key: "v", value: x.vendetta, color: BLUE },
                    { key: "l", value: x.loveOrIllicit, color: PLUM },
                    { key: "g", value: x.gain, color: GREEN },
                    { key: "o", value: rest, color: GREY },
                  ],
                  tip: `${r.year}: ${inr(r.cases)} murders · disputes ${inr(x.disputes)} · vendetta ${inr(x.vendetta)} · love or illicit relationship ${inr(x.loveOrIllicit)} · gain ${inr(x.gain)} · other or unknown ${inr(rest)}${r.note ? ` · ${r.note}` : ""}`,
                };
              })}
            />
          </div>
        </Figure>
        <details className="more">
          <summary>The numbers behind each bar</summary>
          <DataTable
            rows={murderSeries.map((r) => ({ ...r, name: String(r.year) }))}
            search="Find a year"
            keepOrder
            caption="Cases registered. Each year from its own Crime in India volume; see the sources below."
            cols={[
              { label: "Murders", value: (r) => r.cases },
              { label: "Disputes", value: (r) => r.motives?.disputes ?? null },
              { label: "Vendetta", value: (r) => r.motives?.vendetta ?? null },
              { label: "Love or illicit", value: (r) => r.motives?.loveOrIllicit ?? null },
              { label: "Gain", value: (r) => r.motives?.gain ?? null },
            ]}
          />
        </details>
      </Section>

      <Section
        id="parts"
        tone="edge"
        kicker="What the count is made of"
        title="Every part over 10%, and the killings counted elsewhere"
        lede={
          <>
            Inside the 2024 murder count, disputes are the largest motive; the Bureau’s own “other causes” row is next.
            Outside it, dowry deaths and culpable homicide are each more than a tenth the size of the murder count.
            {c("ncrb-cii-2024-v1")}
          </>
        }
      >
        <div className="grid2">
          <Figure title="Murders by motive, 2024" sub={`${inr(k24.murder.cases)} cases`}>
            <Parts
              label="Murder by motive, 2024"
              total={k24.murder.cases}
              parts={[
                { label: "Disputes", value: k24.murder.motives.disputes, color: SAFFRON, note: "family, land, money, petty quarrel, road" },
                { label: "Personal vendetta or enmity", value: k24.murder.motives.vendetta, color: BLUE },
                { label: "Love affairs or illicit relationship", value: k24.murder.motives.loveAffairs + k24.murder.motives.illicit, color: PLUM },
                { label: "Gain", value: k24.murder.motives.gain, color: GREEN },
                { label: "Other causes, no motive known, smaller motives", value: murderRest, color: GREY, note: `“Other causes” ${inr(k24.murder.motives.otherCauses)}; no motive known ${inr(k24.murder.motives.noMotiveKnown)}` },
              ]}
            />
          </Figure>
          <Figure title="Deaths recorded under other heads, 2024" sub="Beside the murder count, which they are not part of">
            <HBars
              label="Murder and killings recorded under other heads, 2024"
              rows={[
                { label: "Murder", value: k24.murder.cases, color: BLUE },
                { label: "Dowry deaths (s.304B / BNS s.80)", value: k24.murder.outside.dowryDeaths, color: SAFFRON },
                { label: "Culpable homicide not amounting to murder", value: k24.murder.outside.culpableHomicide, color: SAFFRON },
              ].map((x) => ({ label: x.label, segs: [{ key: "v", value: x.value, color: x.color }], value: inr(x.value), tip: `${x.label}: ${inr(x.value)} cases in 2024` }))}
            />
          </Figure>
        </div>
        <PartsTable
          shareOf="Share of murder count"
          caption="Parts of 10% or more are marked. Shares are of the 27,049 murders registered in 2024; the last two rows are separate heads, shown as a share only to give their size."
          rows={[
            { part: "Disputes", value: inr(k24.murder.motives.disputes), share: pct(k24.murder.motives.disputes, k24.murder.cases), where: "inside", note: "family, property or land, petty quarrel, money, water, road" },
            { part: "“Other causes” (the Bureau’s own row)", value: inr(k24.murder.motives.otherCauses), share: pct(k24.murder.motives.otherCauses, k24.murder.cases), where: "inside" },
            { part: "Personal vendetta or enmity", value: inr(k24.murder.motives.vendetta), share: pct(k24.murder.motives.vendetta, k24.murder.cases), where: "inside" },
            { part: "Love affairs or illicit relationship", value: inr(k24.murder.motives.loveAffairs + k24.murder.motives.illicit), share: pct(k24.murder.motives.loveAffairs + k24.murder.motives.illicit, k24.murder.cases), where: "inside" },
            { part: "Gain", value: inr(k24.murder.motives.gain), share: pct(k24.murder.motives.gain, k24.murder.cases), where: "inside" },
            { part: "No motive known", value: inr(k24.murder.motives.noMotiveKnown), share: pct(k24.murder.motives.noMotiveKnown, k24.murder.cases), where: "inside" },
            { part: "Dowry deaths", value: inr(k24.murder.outside.dowryDeaths), share: pct(k24.murder.outside.dowryDeaths, k24.murder.cases), where: "outside", note: "deaths of married women after dowry harassment; some are suicides" },
            { part: "Culpable homicide not amounting to murder", value: inr(k24.murder.outside.culpableHomicide), share: pct(k24.murder.outside.culpableHomicide, k24.murder.cases), where: "outside" },
          ]}
        />
      </Section>

      <Section
        id="count"
        kicker="The count"
        title="Down three years running"
        lede={<>The Bureau’s three-year tables, with 2020 from the previous volume. Rate is cases per lakh people, on the population the Bureau projects for that year.{c("ncrb-cii-2024-1-2", "ncrb-cii-2023-1-2")}</>}
      >
        <Stats>
          <Stat value={inr(nat.y2024.cases)} label="Murders, 2024" delta={{ text: signed(change(nat.y2024.cases, nat.y2023.cases)), dir: "down" }} sub={<>on 2023.{c("ncrb-cii-2024-1-2")}</>} />
          <Stat value={one(nat.y2024.rate)} label="Per lakh people" sub={`${one(ncrb2022.trends.murder.y2021.rate)} in 2021.`} />
          <Stat value={inr(v.total)} label="Victims" sub={<>{inr(v.male)} men and boys, {inr(v.female)} women and girls, {inr(v.transgender)} transgender.{c("ncrb-cii-2024-2a3")}</>} />
          <Stat value={`${one(snap.convictionRate)}%`} label="Conviction rate" sub={<>{inr(snap.convicted)} convictions in 2024. Convictions ÷ trials finished.{c("ncrb-cii-2024-v1")}</>} />
        </Stats>
        <Callout label="What the murder count leaves out">
          Murder is one of several ways a killing is recorded. In 2024 the Bureau also counted{" "}
          {inr(k24.murder.outside.culpableHomicide)} cases of culpable homicide not amounting to murder and{" "}
          {inr(k24.murder.outside.dowryDeaths)} dowry deaths, deaths of married women after dowry harassment, some of them
          suicides. Neither is in the murder figure. A murder committed with a rape is counted once, as murder, under the
          principal-offence rule.{c("ncrb-cii-2024-v1", "ncrb-cii-2024-limits")}
        </Callout>
        <div className="stack">
          <Figure title="Murder cases registered, 2020 to 2024" sub="Hover a column for the rate.">
            <Columns
              label="Murder cases, 2020 to 2024"
              height={260}
              wide
              rows={[
                { year: 2020, ...ncrb2022.trends.murder.y2020 },
                { year: 2021, ...ncrb2022.trends.murder.y2021 },
                { year: 2022, ...nat.y2022! },
                { year: 2023, ...nat.y2023! },
                { year: 2024, ...nat.y2024 },
              ].map((r) => ({
                label: String(r.year),
                segs: [{ key: "m", value: r.cases, color: BLUE }],
                tip: `${r.year}: ${inr(r.cases)} murders · ${one(r.rate)} per lakh people`,
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
            Uttar Pradesh registers the most murders, {inr(up.murder.y2024)}, at a rate of {one(up.murder.rate)} per lakh
            people, under the national {one(nat.y2024.rate)}. The highest rates are in {topRate.join(", ")}.
            Manipur, first on rate in 2023 after its count tripled to {inr(mn23)}, registered {inr(mn24)} in 2024. The Bureau: “States/UTs may not be compared purely on the basis of crime figures.”
            {c("ncrb-cii-2024-2a1")}
          </>
        }
      >
        <Figure title="Murders per lakh people, 2024" sub="Each square is a state or union territory, placed roughly where it lies." note="Squares are equal in size on purpose. The grid is not a map and draws no borders.">
          <Tabs
            id="murder-maps"
            tabs={[
              { label: "Per lakh people", body: <TileMap label="Murder rate by state, 2024" unit="Per lakh people" fmt={one} values={tile((s) => s.murder.rate)} /> },
              { label: "Cases", body: <TileMap label="Murder cases by state, 2024" unit="Cases" digits={0} fmt={inr} values={tile((s) => s.murder.y2024)} /> },
            ]}
          />
        </Figure>
        <div className="grid2">
          <Figure title="Most murders" sub="Ten states by cases, 2024">
            <HBars label="States with the most murders" rows={by(states, (s) => s.murder.y2024).slice(0, 10).map((s) => ({ label: s.name, segs: [{ key: "m", value: s.murder.y2024, color: BLUE }], value: inr(s.murder.y2024), tip: tip(s) }))} />
          </Figure>
          <Figure title="Highest rate" sub="Ten states by murders per lakh people, 2024. Union territories left out: a few cases swing their rate.">
            <HBars label="States with the highest murder rate" rows={by(states.filter((s) => s.kind === "state"), (s) => s.murder.rate).slice(0, 10).map((s) => ({ label: s.name, segs: [{ key: "m", value: s.murder.rate, color: SAFFRON }], value: one(s.murder.rate), tip: tip(s) }))} />
          </Figure>
        </div>
        <details className="more">
          <summary>All 36 states and union territories</summary>
          <DataTable
            rows={states}
            search="Find a state or union territory"
            caption="Rate per lakh people on the Bureau’s 2024 projected population. Chargesheeting rate is chargesheets ÷ cases the police disposed of."
            cols={[
              { label: "2024", value: (s) => s.murder.y2024 },
              { label: "2023", value: (s) => s.murder.y2023 },
              { label: "2022", value: (s) => s.murder.y2022 },
              { label: "Per lakh", value: (s) => s.murder.rate, fmt: one },
              { label: "Chargesheet %", value: (s) => s.murder.chargesheetRate, fmt: one },
            ]}
          />
        </details>
      </Section>

      <Section
        id="why"
        kicker="Why"
        title="Disputes, not strangers"
        lede={<>The police record one motive per case. The rows below add up to the {inr(nat.y2024.cases)} cases. “Other causes” is the Bureau’s own residual row, and it is large.{c("ncrb-cii-2024-2a2")}</>}
      >
        <div className="grid2">
          <Figure title="Motive the police recorded, 2024" sub="Twelve largest of twenty rows">
            <HBars
              label="Motives of murder, 2024"
              rows={m.murderMotives.slice(0, 12).map((x) => ({ label: x.label, segs: [{ key: "m", value: x.cases, color: x.label === "Disputes" ? SAFFRON : BLUE }], value: inr(x.cases), tip: `${x.label}: ${inr(x.cases)} (${one(pct(x.cases, nat.y2024.cases))}%)` }))}
            />
          </Figure>
          <Figure title="Inside “disputes”" sub={`${inr(disputes)} cases, 2024`}>
            <HBars
              label="Kinds of dispute"
              rows={m.disputeBreakdown.map((x) => ({ label: x.label, segs: [{ key: "d", value: x.cases, color: SAFFRON }], value: inr(x.cases), tip: `${x.label}: ${inr(x.cases)} (${one(pct(x.cases, disputes))}% of disputes)` }))}
            />
          </Figure>
        </div>
        <Prose>
          <p>
            Love affairs ({inr(m.murderMotives.find((x) => x.label === "Love affairs")!.cases)}) and illicit relationships ({inr(m.murderMotives.find((x) => x.label === "Illicit relationship")!.cases)}) together outnumber murder for gain. Dowry was the recorded motive in {inr(m.murderMotives.find((x) => x.label === "Dowry")!.cases)} cases. In{" "}
            {inr(m.murderMotives.find((x) => x.label === "No clue or motive not known")!.cases)} the police recorded no motive at all.{c("ncrb-cii-2024-2a2")}
          </p>
        </Prose>
      </Section>

      <Section id="victims" tone="edge" kicker="Victims" title="Mostly men, mostly aged 18 to 45" lede={<>{inr(v.total)} people were murdered in {inr(nat.y2024.cases)} cases in 2024. {inr(v.child)} were children.{c("ncrb-cii-2024-2a3")}</>}>
        <div className="grid2">
          <Figure title="Victims by sex" sub="2024">
            <Parts label="Murder victims by sex, 2024" total={v.total} parts={[{ label: "Male", value: v.male, color: BLUE }, { label: "Female", value: v.female, color: SAFFRON }, { label: "Transgender", value: v.transgender, color: GREY }]} />
          </Figure>
          <Figure title="Victims by age" sub="2024">
            <Columns
              label="Murder victims by age, 2024"
              height={220}
              rows={[
                ["Under 18", v.child],
                ["18–30", v.ages.age18to30],
                ["30–45", v.ages.age30to45],
                ["45–60", v.ages.age45to60],
                ["60+", v.ages.age60plus],
              ].map(([label, n]) => ({ label: String(label), segs: [{ key: "v", value: Number(n), color: BLUE }], tip: `${label}: ${inr(Number(n))} victims (${one(pct(Number(n), v.total))}%)` }))}
            />
          </Figure>
        </div>
      </Section>

      <Section
        id="justice"
        kicker="After the FIR"
        title="Nine in ten murder trials are still waiting"
        lede={<>The 2023 and 2024 volumes print only headline disposal figures for murder, so the parts below are 2022, the latest year with the full breakdown. The 2024 headline figures sit underneath.{c("ncrb-cii-2022-17a1", "ncrb-cii-2022-18a1")}</>}
      >
        <div className="grid2">
          <Figure title="Police, 2022" sub={`${inr(police22.forInvestigation)} murder cases for investigation`}>
            <Parts label="Police disposal of murder cases, 2022" total={police22.forInvestigation} parts={[{ label: "Chargesheet filed", value: police22.chargesheeted, color: BLUE }, { label: "Closed, transferred or otherwise disposed", value: policeOther, color: GREY }, { label: "Still under investigation at year end", value: police22.pendingAtYearEnd, color: PALE }]} />
          </Figure>
          <Figure title="Courts, 2022" sub={`${inr(court22.forTrial)} murder cases for trial`}>
            <Parts label="Court disposal of murder cases, 2022" total={court22.forTrial} parts={[{ label: "Convicted", value: court22.convicted, color: BLUE }, { label: "Acquitted", value: court22.acquitted, color: SAFFRON }, { label: "Discharged, withdrawn or otherwise disposed", value: court22.discharged + courtOther, color: GREY }, { label: "Still pending at year end", value: court22.pendingAtYearEnd, color: PALE }]} />
          </Figure>
        </div>
        <Callout label="2024, from the volume’s summary">
          Courts had {inr(snap.forTrial)} murder cases for trial in 2024 and convicted in {inr(snap.convicted)}: a conviction
          rate of {one(snap.convictionRate)}%, against {one(ncrb2023.disposal.murder.convictionRate)}% in 2023 and {one(court22.convictionRate)}% in 2022. Police chargesheeted{" "}
          {inr(snap.chargesheeted)} cases, a chargesheeting rate of {one(snap.chargesheetRate)}%.{c("ncrb-cii-2024-v1", "ncrb-cii-2023-snapshot")}
        </Callout>
      </Section>

      <Section
        id="records"
        tone="edge"
        kicker="Other government records"
        title="Deaths in the state’s own custody"
        lede={
          <>
            Every death in police or judicial custody must be reported to the National Human Rights Commission within 24
            hours. The Home Ministry has given Parliament the Commission’s counts. They are not murder figures: most deaths in
            judicial custody are from illness, and a case is a death reported, not a finding of fault.
            {c("nhrc-custody-guidelines", nhrcCustody.policeCustodyDeaths.source, nhrcCustody.allCustodialDeaths.source)}
          </>
        }
      >
        <div className="grid2">
          <Figure title="Deaths in police custody" sub="NHRC cases, by financial year" note={<>As reported to the Lok Sabha on 1 August 2023.{c(nhrcCustody.policeCustodyDeaths.source)}</>}>
            <Columns
              label="Deaths in police custody, NHRC cases, 2018-19 to 2022-23"
              height={220}
              rows={nhrcCustody.policeCustodyDeaths.years.map((y) => ({ label: y.fy, segs: [{ key: "d", value: y.cases, color: BLUE }], tip: `${y.fy}: ${inr(y.cases)} deaths in police custody (NHRC cases)` }))}
            />
          </Figure>
          <div>
            <Stats>
              {nhrcCustody.allCustodialDeaths.years.map((y) => (
                <Stat key={y.fy} value={inr(y.cases)} label={`All custodial deaths, ${y.fy}`} sub={<>police and judicial custody, NHRC cases.{c(nhrcCustody.allCustodialDeaths.source)}</>} />
              ))}
              {nhrcCustody.policeEncounterDeaths.years.map((y) => (
                <Stat key={"e" + y.fy} value={inr(y.cases)} label={`Deaths in police encounters, ${y.fy}`} sub={<>NHRC cases.{c(nhrcCustody.policeEncounterDeaths.source)}</>} />
              ))}
            </Stats>
          </div>
        </div>
        <Callout label="Two states’ own counts agree">
          Kerala Police and Karnataka’s State Crime Records Bureau publish their own state-wide murder counts. Every year checked
          matches the Bureau’s rows for those states exactly.{c(keralaCheck.source, karnatakaCheck.source, "ncrb-cii-2023-2a1", "ncrb-cii-2024-2a1")}
        </Callout>
        <CheckTable
          left="State police"
          right="NCRB"
          caption="State police murder counts beside NCRB’s rows for the same state."
          rows={[
            ...keralaCheck.rows.filter((r) => r.head === "Murder").map((r) => ({ label: `Kerala, ${r.year}`, a: r.state, b: r.ncrb })),
            ...karnatakaCheck.rows.filter((r) => r.head === "Murder").map((r) => ({ label: `Karnataka, ${r.year}`, a: r.state, b: r.ncrb })),
          ]}
        />
      </Section>

      <Section id="cities" tone="edge" kicker="Cities" title="Nineteen metropolitan cities" lede={<>Already inside the state totals. City rates use the 2011 census and cannot be set beside state rates.{c("ncrb-cii-2024-2b1")}</>}>
        <Figure title="Murders per lakh people, by city, 2024" sub="Rates on the 2011 census population">
          <HBars label="City murder rates" rows={by(cities, (x) => x.murder.rate).map((x) => ({ label: x.name, segs: [{ key: "m", value: x.murder.rate, color: BLUE }], value: one(x.murder.rate), tip: `${x.name}: ${inr(x.murder.y2024)} murders in 2024 · ${one(x.murder.rate)} per lakh (2011 base)` }))} />
        </Figure>
        <details className="more">
          <summary>City table</summary>
          <DataTable rows={cities} search="Find a city" caption="Rate per lakh people on the 2011 census." cols={[{ label: "2024", value: (x) => x.murder.y2024 }, { label: "2023", value: (x) => x.murder.y2023 }, { label: "2021", value: (x) => x.murder.y2022 }, { label: "Per lakh", value: (x) => x.murder.rate, fmt: one }]} />
        </details>
      </Section>

      <Sources refs={refs} />
    </Page>
  );
}
