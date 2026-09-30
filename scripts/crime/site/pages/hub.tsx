import React from "react";
import { ncrb2022 } from "../../../../src/data/crime/ncrb2022";
import { ncrb2024More as m, ncrb2024Rape as r23 } from "../../../../src/data/crime/ncrb2024";
import { ncrb2023Rape as prev } from "../../../../src/data/crime/ncrb2023Rape";
import { DataTable } from "../charts";
import { Callout, change, Hero, inr, lakh, one, Page, Refs, Section, signed, Sources, Stat, Stats } from "../kit";

export function HubPage() {
  const refs = new Refs();
  const c = refs.cite;
  const N = m.national;
  const rapeBoth = r23.national.rape + r23.national.childRapePocso;
  const rapeBoth22 = prev.national.rape + prev.national.childRapePocso;
  const delhiShare = (m.states.find((s) => s.name === "Delhi")!.theft.cases / N.theft.y2024.cases) * 100;
  const dir = (a: number, b: number) => (a > b ? "up" : a < b ? "down" : "flat") as "up" | "down" | "flat";
  const heads = [
    { name: "Murder (s.302)", key: "murder" },
    { name: "Rape (s.376)", key: "rape" },
    { name: "Theft (s.379)", key: "theft" },
    { name: "Burglary", key: "burglary" },
    { name: "Robbery", key: "robbery" },
    { name: "Dacoity", key: "dacoity" },
  ] as const;
  const rows = heads.map((h) => ({ name: h.name, ...N[h.key], change: change(N[h.key].y2024.cases, N[h.key].y2023!.cases) }));

  return (
    <Page
      id="home"
      path="/crime"
      title="Crime in India, counted — Data Libertarian"
      description="Rape, murder, theft and robbery in India from the National Crime Records Bureau's own tables: counts, rates, states, cities and courts, with every figure cited."
    >
      <Hero
        eyebrow="Crime in India"
        title="Heinous crime,"
        accent="by the state’s own count."
        actions={[
          { href: "#crimes", label: "Choose a crime" },
          { href: "/crime/method", label: "How to read these numbers" },
        ]}
        caveat="Every figure is a case the police registered and the National Crime Records Bureau published, with a link to the table it came from. Nothing is estimated unless it says so."
      >
        Crime figures in India are quoted loudly and read carelessly: a count mistaken for a rate, one legal row mistaken
        for the whole crime, a conviction rate divided by the wrong number. These pages go back to the Bureau’s tables
        and show what they do and do not say.{c("ncrb-cii-2024-limits")}
      </Hero>

      <Section id="numbers" kicker="2024" title="What the police registered" lede={<>From Crime in India 2024, the Bureau’s latest volume.{c("ncrb-cii-2024-1-2", "ncrb-cii-2024-3a2")}</>}>
        <Stats>
          <Stat value={inr(rapeBoth)} label="Rape FIRs, women and girls" delta={{ text: signed(change(rapeBoth, rapeBoth22)), dir: dir(rapeBoth, rapeBoth22) }} sub="on 2023. Section 376 plus POCSO child rape." />
          <Stat value={inr(N.murder.y2024.cases)} label="Murders" delta={{ text: signed(change(N.murder.y2024.cases, N.murder.y2023!.cases)), dir: dir(N.murder.y2024.cases, N.murder.y2023!.cases) }} sub="on 2023." />
          <Stat value={inr(N.robbery.y2024.cases)} label="Robberies" delta={{ text: signed(change(N.robbery.y2024.cases, N.robbery.y2023!.cases)), dir: dir(N.robbery.y2024.cases, N.robbery.y2023!.cases) }} sub="on 2023." />
          <Stat value={lakh(N.theft.y2024.cases)} label="Thefts" delta={{ text: signed(change(N.theft.y2024.cases, N.theft.y2023!.cases)), dir: dir(N.theft.y2024.cases, N.theft.y2023!.cases) }} sub="on 2023." />
        </Stats>
      </Section>

      <section className="intent-prototype crime-cards" id="crimes">
        <div className="wrap">
          <div className="intent-intro">
            <h2>Pick a crime</h2>
          </div>
          <div className="intent-grid">
            <a className="intent-card priority" href="/crime/rape">
              <span className="kind">Rape · s.376 and POCSO</span>
              <div className="figure">
                {inr(rapeBoth)}
                <small>FIRs in 2024</small>
              </div>
              <h3>The count most reports quote leaves out children</h3>
              <p>States and cities, who the offender was, what the survey finds that FIRs miss, and what courts did.</p>
              <span className="go">
                Open <span className="arrow">→</span>
              </span>
            </a>
            <a className="intent-card priority" href="/crime/murder">
              <span className="kind">Murder · s.302</span>
              <div className="figure">
                {inr(N.murder.y2024.cases)}
                <small>cases in 2024</small>
              </div>
              <h3>One in three began as a dispute</h3>
              <p>Rates by state and city, the motive the police recorded, who the victims were, and the trial backlog.</p>
              <span className="go">
                Open <span className="arrow">→</span>
              </span>
            </a>
            <a className="intent-card priority" href="/crime/stealing">
              <span className="kind">Theft, burglary, robbery, dacoity</span>
              <div className="figure">
                {lakh(N.theft.y2024.cases + N.burglary.y2024.cases + N.robbery.y2024.cases + N.dacoity.y2024.cases)}
                <small>cases across four heads in 2024</small>
              </div>
              <h3>Delhi registers {one(delhiShare)}% of India’s thefts</h3>
              <p>Four heads kept apart, by state and city, with how much stolen property came back.</p>
              <span className="go">
                Open <span className="arrow">→</span>
              </span>
            </a>
          </div>
        </div>
      </section>

      <Section id="table" kicker="Three years" title="Every head, 2022 to 2024" lede={<>Cases and rate per lakh people, from Table 1.2 of the 2024 volume. The rape row here is section 376 only. From this volume the Bureau prints the rape rate per lakh people in this table; earlier volumes printed it per lakh women, which is why it looks halved.{c("ncrb-cii-2024-1-2")}</>}>
        <DataTable
          rows={rows}
          search="Find a crime head"
          caption="Registered cases. Change is 2023 to 2024, computed here."
          cols={[
            { label: "2024", value: (r) => r.y2024.cases },
            { label: "Rate 2024", value: (r) => r.y2024.rate, fmt: one },
            { label: "2023", value: (r) => r.y2023!.cases },
            { label: "2022", value: (r) => r.y2022!.cases },
            { label: "Change", value: (r) => r.change, fmt: signed },
          ]}
        />
      </Section>

      <Section id="read" tone="edge" kicker="Before you quote a number" title="Four ways crime figures mislead">
        <div className="grid2">
          <Callout label="Registered is not committed">
            Every figure is an FIR. A state whose police write down every complaint looks worse than one that turns people
            away. The Bureau prints this warning under every table.{c("ncrb-cii-2024-limits")}
          </Callout>
          <Callout label="A count is not a rate">
            Uttar Pradesh has the most murders because it has the most people. Its murder rate is below the national one.
            Every page shows both.
          </Callout>
          <Callout label="One legal row is not the whole crime">
            Most child rape is filed under POCSO, not section 376. The usual rape figure leaves it out.
          </Callout>
          <Callout label="A conviction rate is not convictions ÷ FIRs">
            It is convictions divided by trials finished that year, most of them from earlier FIRs.
          </Callout>
        </div>
      </Section>

      <Sources refs={refs} />
    </Page>
  );
}
