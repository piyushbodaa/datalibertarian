import React from "react";
import { ncrb2022 } from "../../../../src/data/crime/ncrb2022";
import { ncrb2023Rape as r23 } from "../../../../src/data/crime/ncrb2023Rape";
import { ncrb2024Rape as r24 } from "../../../../src/data/crime/ncrb2024";
import { Hero, inr, one, Page, Refs, Section, Sources } from "../kit";

export function MethodPage() {
  const refs = new Refs();
  const c = refs.cite;
  const womenLakh = Math.round((r23.national.rape / r23.national.rapeRatePerLakhWomen) * 10) / 10;
  const boxes: { title: string; body: React.ReactNode }[] = [
    {
      title: "What the Bureau counts",
      body: (
        <>
          <p>
            The National Crime Records Bureau compiles the cases that state police forces register and report to it, and
            publishes them each year as Crime in India. It does not re-investigate any FIR. Only police-recorded cases are
            captured; the reasons behind crime are not.{c("ncrb-cii-2023-limits")}
          </p>
        </>
      ),
    },
    {
      title: "One FIR, one row",
      body: (
        <p>
          The Bureau follows the principal-offence rule: when one FIR names several offences, only the one with the heaviest
          punishment is counted. So a single FIR sits in one row of the tables, never two. That is why the rape page can add
          the section 376 row and the POCSO child-rape row without counting an FIR twice.{c("ncrb-cii-2023-limits")}
        </p>
      ),
    },
    {
      title: "Rape and the POCSO row",
      body: (
        <>
          <p>
            Section 376 is the rape row. The Bureau prints a separate column, “Child Rape (Sec 4 & 6 of POCSO Act / Sec 376
            IPC)”, for girl victims: {inr(ncrb2022.women.pocsoPenetrative)} cases in 2022, {inr(r23.national.childRapePocso)} in
            2023 and {inr(r24.national.childRapePocso)} in 2024. The slash means POCSO read with section 376.{c("ncrb-cii-2022-3a2", "ncrb-cii-2023-3a2", "ncrb-cii-2024-3a2")}
          </p>
          <p>
            The girls who do appear in the section 376 row, {inr(r24.national.girlVictimsUnder18)} victims in 2024, are cases a
            state filed without POCSO. Some large states file none that way, which is why a section 376 ranking alone
            compares filing habits as much as crime.{c("ncrb-cii-2024-3a3")}
          </p>
        </>
      ),
    },
    {
      title: "Rates, and whose population",
      body: (
        <>
          <p>
            State rates use the mid-year population the National Commission on Population projected from the 2011 census.
            Murder, theft, burglary, robbery and dacoity are per lakh people.{c("ncrb-cii-2023-limits")}
          </p>
          <p>
            Crimes against women are per lakh women. {inr(r23.national.rape)} section 376 cases at a printed rate of{" "}
            {one(r23.national.rapeRatePerLakhWomen)} imply about {inr(womenLakh)} lakh women. The POCSO child-rape rate in the
            same table uses the same base, so the two rates add.{c("ncrb-cii-2023-3a2")} From the 2024 volume, the summary Table 1.2
            prints the rape rate per lakh people instead (2.1 for 2024), while Table 3A.2 keeps it per lakh women (4.3); the
            pages use the per-lakh-women figure and say which base each rate uses.{c("ncrb-cii-2024-1-2", "ncrb-cii-2024-3a2")}
          </p>
          <p>
            City rates use the 2011 census, because there is no city projection. A city rate cannot be set beside a state rate,
            and adding the nineteen cities to the states counts the same FIRs twice.{c("ncrb-cii-2023-3b2")}
          </p>
        </>
      ),
    },
    {
      title: "Chargesheet and conviction rates",
      body: (
        <p>
          Chargesheeting rate is chargesheets divided by cases the police disposed of. Conviction rate is convictions divided by
          trials completed. Both describe cases finished that year, many from FIRs of earlier years. Convictions divided by this
          year’s FIRs is a different number, and not the one the Bureau prints.{c("ncrb-cii-2023-snapshot")}
        </p>
      ),
    },
    {
      title: "What “computed here” means",
      body: (
        <p>
          Some figures are arithmetic on printed figures: a sum of two rows, a percentage change, a share. Each is labelled
          where it appears. Nothing on these pages is modelled, projected or estimated. Where a survey and the FIR count
          measure different things, as with the National Family Health Survey, they are shown side by side and never combined
          into a single “true number”.{c("nfhs5-india-ch15")} Every figure on these pages comes from a government body:
          the Bureau, ministries and their answers to Parliament, courts, commissions and state police. The survey report
          is the one government publication not currently online on a government host, and its note says where the copy is.
        </p>
      ),
    },
    {
      title: "How the numbers were taken",
      body: (
        <>
          <p>
            2024 and 2023 figures are read from the Crime in India Volume I PDFs by scripts in this site’s repository. Each table
            block is checked against the Bureau’s printed all-India total before a figure is used, and tests fail the build if a
            state or city column stops adding up. 2022 figures come from the Bureau’s 2022 spreadsheets, checked the same way.
          </p>
          <p>
            Still 2022: the district map, because the Bureau has not posted 2023 or 2024 district tables, and the full police
            and court disposal breakdown for murder and theft, which the 2023 and 2024 volumes print only as headline figures.
            Each is labelled with its year. The ten-year charts read each year from that year’s own volume.
          </p>
        </>
      ),
    },
    {
      title: "Checked against other government sources",
      body: (
        <>
          <p>
            The Home Ministry’s answers to Parliament print the same figures: rape 31,677, 31,516 and 29,670 for 2021 to
            2023, and a total for crimes against women that adds the Penal Code rows and the POCSO rows together, as this
            site does.{c("mha-rs-390-2025")} Its gang-rape table for 2018 to 2021 matches, except 2019, where the Bureau
            later revised its own figures (32,033 rapes to 32,032; 1,931 gang rapes to 1,962). These pages use each year’s
            volume as first printed and say so where a later revision exists.{c("mha-ls-2263-2022")}
          </p>
          <p>
            For murder, the Ministry’s answers print 28,653, 29,017, 28,915, 29,193 and 29,272 for 2017 to 2021, and
            28,522 for 2022, matching these pages except 2019, which is the same West Bengal revision.
            {c("mha-rs-3734-2023", "mha-ls-1954-2025")}
          </p>
          <p>
            Kerala Police’s own published counts of rape, murder, theft, burglary, robbery and dacoity match the Bureau’s
            Kerala rows exactly for 2022 and 2023; for rape, Kerala counts section 376 and POCSO child rape together, as
            these pages do. Karnataka’s State Crime Records Bureau reports the two separately, and all fifteen Karnataka figures
            checked, 2022 to 2024, match the Bureau exactly.{c("kerala-police-stats", "ksp-cik-2024")}
          </p>
          <p>
            Figures quoted elsewhere are often wrong. Among published reports we checked, one gave 2023 rapes as 32,032,
            which is the revised 2019 figure; another named 2018 as the year of 38,947 rapes, which was 2016. When a number
            here disagrees with a report, the table number beside it is the place to settle it.
          </p>
        </>
      ),
    },
    {
      title: "Corrections",
      body: (
        <p>
          If a figure here does not match the Bureau’s table, write to us with the table number: <a href="/corrections">report a correction</a>.
        </p>
      ),
    },
  ];
  return (
    <Page
      id="method"
      path="/crime/method"
      title="How to read Indian crime figures — Crime in India"
      description="How NCRB counts crime: the principal-offence rule, the POCSO row, rates per lakh people and per lakh women, city rates, and conviction rates."
    >
      <Hero eyebrow="Method" title="How a crime figure" accent="is made.">
        What the National Crime Records Bureau counts, what it does not, and every piece of arithmetic these pages add.
      </Hero>
      <Section kicker="Method" title="Read this before you quote a number">
        <div className="method-list">
          {boxes.map((b) => (
            <div className="box" key={b.title}>
              <h3>{b.title}</h3>
              {b.body}
            </div>
          ))}
        </div>
      </Section>
      <Sources refs={refs} />
    </Page>
  );
}
