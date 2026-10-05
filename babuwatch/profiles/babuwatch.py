"""Babuwatch — the umbrella register of every convicted public servant.

Served at datalibertarian.in/babuwatch. Lists every record from every
dataset: civil servants (whose pages live here) and police officers (whose
pages live in the Copwatch India sub-watch, which the cards link to).
"""

# House sub-category code -> Babuwatch public category. The umbrella spans
# police and civil servants, so its vocabulary is service-neutral; police
# records keep Copwatch India's own five labels inside Copwatch India.
_SUB_TO_CATEGORY = {
    "bribery_pc_act": "Bribery & extortion",
    "extortion": "Bribery & extortion",
    "disproportionate_assets": "Disproportionate assets",
    "misappropriation_breach_of_trust": "Fraud & misappropriation",
    "cheating_forgery": "Fraud & misappropriation",
    "custodial_death": "Violence & unlawful detention",
    "custodial_torture": "Violence & unlawful detention",
    "custodial_rape_sexual_assault": "Violence & unlawful detention",
    "fake_encounter_extrajudicial_killing": "Violence & unlawful detention",
    "disproportionate_force": "Violence & unlawful detention",
    "enforced_disappearance": "Violence & unlawful detention",
    "illegal_detention_false_imprisonment": "Violence & unlawful detention",
}
_HOUSE_CATEGORIES = ("corruption", "brutality", "misconduct")

PROFILE = {
    "site_name": "Babuwatch",
    "short_name": "Babuwatch",
    "tagline": "A Data Libertarian Project",
    "base": "/babuwatch",
    "parent": None,
    # The seal, name and tagline lead to the Data Libertarian home page.
    "brand_home": "/",
    "switcher_blurb": "All public servants",
    # Owner decision 2026-09-23: Babuwatch keeps reusing Copwatch India's
    # address until it has one of its own.
    "contact_email": "contact@copwatchindia.org",
    "templates": "babuwatch",
    # Every register's records. The first dataset also supplies cases.csv.
    "datasets": [
        {"dir": "data/copwatchindia", "home": "babuwatch",
         "service": "police"},
        {"dir": "data/civil", "home": "babuwatch", "service": "civil"},
    ],
    "parent_org": None,
    "static_pages": ["about"],
    "context_charts": False,
    # Owner decision 2026-09-23: no Trial Courts *section* (index +
    # per-state listings). The trial-court RECORDS stay published.
    "trial_section_index": False,
    "site_categories": ["Bribery & extortion", "Disproportionate assets",
                        "Fraud & misappropriation",
                        "Violence & unlawful detention", "Other misconduct"],
    "category_map": dict(
        ("%s.%s" % (cat, sub), label)
        for cat in _HOUSE_CATEGORIES
        for sub, label in list(_SUB_TO_CATEGORY.items())
        + [("other", "Other misconduct"),
           ("dereliction_evidence_tampering", "Other misconduct"),
           ("false_implication_fabrication", "Other misconduct")]),
    "nav": [("/tracker", "Incident Tracker"), ("/places", "Places"),
            ("/commissions", "Commissions"), ("/follow-up", "Was it paid?"),
            ("/compliance", "CCTV & arrests"), ("/patterns", "Patterns"),
            ("/methodology", "Methodology")],
    "home_sections": ["hero", "ref:intent-prototype", "ref:does", "tracker",
                      "ref:ledger", "patterns", "ref:disclaimer"],
    "text": {
        "headline": (
            "{{total}} court-adjudicated records against public servants "
            "— {{n_civil}} civil servants and {{n_police}} police "
            "records, from {{n1}} Supreme Court / High Court judgments and "
            "{{n2}} trial-court convictions"),
        "overturned_note": (
            "A further {{n}} trial-court convictions later set aside on "
            "appeal are kept out of the counts."),
        # ---- page shell
        "org_description": (
            "A public register of court findings against public servants "
            "of every government in India."),
        "website_description": (
            "Court convictions and adverse court findings against India's "
            "public servants — civil servants and police — each "
            "attributed to the court that decided it."),
        "og_alt": "Babuwatch — No public servant is above the law",
        "static_rights_title": "Know Your Rights",
        "static_rights_desc": (
            "Grounds of arrest, the arrest memo, informing family, "
            "medical examination, production before a magistrate&mdash;and "
            "what to do if someone is picked up."),
        "static_remedy_title": "Seek a Remedy",
        "static_remedy_desc": (
            "Lawful escalation through senior officers, magistrates, "
            "Human Rights Commissions, Legal Services Authorities, and "
            "courts. Free legal aid is a right."),
        "footer_tagline": "Record &middot; Attribute &middot; Correct",
        "footer_about": (
            "A public register of what India's courts decided about the "
            "people who exercise state power on the public's behalf."),
        "footer_cols": (
            '        <div class="foot-col"><h5>The record</h5><a href="/tracker">Incident tracker</a><a href="/patterns">Patterns dashboard</a><a href="/data">Open data</a></div>\n'
            '        <div class="foot-col"><h5>Browse</h5><a href="/tracker?service=civil">Civil servants</a><a href="/tracker?service=police">Police officers</a><a href="/tracker?level=trial">Trial-court records</a></div>\n'
            '        <div class="foot-col"><h5>About</h5><a href="/methodology">Methodology</a><a href="/about">About us</a><a href="{{mailto}}">Contact</a></div>'),
        "footer_disclaimer": (
            "Babuwatch records court findings against public servants in "
            "the public interest. Each finding is attributed to the court "
            "that made it; inclusion establishes nothing beyond that "
            "finding, and trial convictions may be under appeal. Names are "
            "withheld unless the naming gate clears them, and records are "
            "corrected or withdrawn as facts develop. "
            "<a href=\"/methodology\">Methodology &amp; full disclaimer</a>"),
        # ---- home page blocks
        "home_hero": (
            '\n'
            '<section class="hero prototype-hero">\n'
            '  <div class="wrap">\n'
            '    <h1>No public servant is <span class="against">above</span> the law.</h1>\n'
            '    <p class="sub">Babuwatch documents {{headline}} across India &mdash; each one attributed to the court that decided it.</p>\n'
            '    <div class="prototype-actions">\n'
            '      <a href="#start-here" class="btn btn-primary">What happened? Start here</a>\n'
            '      <a href="/tracker" class="btn btn-ghost">Browse every record</a>\n'
            '    </div>\n'
            '    <p class="prototype-caveat">A public record, not a complaints service. Findings are the courts’; names are withheld unless the naming gate clears them.</p>\n'
            '  </div>\n'
            '</section>\n'),
        "home_tracker": (
            '\n'
            '<section class="tracker">\n'
            '  <div class="wrap">\n'
            '    <div class="sec-head">\n'
            '      <div class="kicker">Tracker</div>\n'
            '      <h2>Court-adjudicated cases, with verification and findings kept distinct</h2>\n'
            '      <p>{{total}} published records ({{n1}} High Court / Supreme Court &middot; {{n2}} trial court) from {{states}} states and union territories. Each record attributes its findings to the court it cites; Babuwatch adds no findings of its own. {{overturned}}</p>\n'
            '    </div>\n'
            '\n'
            '    <div class="tracker-notice">\n'
            '      Records document court-adjudicated cases. Findings are attributed to the deciding court; verification describes how the source was reviewed. <a href="/methodology">Read our methodology &rarr;</a>\n'
            '    </div>\n'
            '\n'
            '    {{cards}}\n'
            '    <p class="tracker-note">Records are updated as new information, appeals, or court findings emerge. Recent convictions may still be under appeal.</p>\n'
            '    <div style="margin-top:28px"><a href="/tracker" class="btn btn-primary">View all records</a></div>\n'
            '  </div>\n'
            '</section>\n'),
        "home_patterns": (
            '\n'
            '<section class="patterns">\n'
            '  <div class="wrap">\n'
            '    <div class="sec-head">\n'
            '      <div class="kicker">Patterns dashboard</div>\n'
            '      <h2>The record shows shape, not just single cases</h2>\n'
            '      <p>Live counts drawn from {{total}} published records show where adjudicated cases occur, how facts were verified, and what the courts decided.</p>\n'
            '    </div>\n'
            '    <div class="callout"><div class="lab">Live dataset</div><p>The dashboard uses only published court-adjudicated records. It describes the cases documented here; it does not estimate how common misconduct is across India.</p></div>\n'
            '    <div style="margin-top:28px"><a href="/patterns" class="btn btn-primary">Explore the patterns</a></div>\n'
            '  </div>\n'
            '</section>\n'),
        "watches_kicker": "The registers",
        "watches_h2": "One method, one register per service",
        "watches_lede": (
            "Every record below belongs to one register, which hosts its "
            "page. Babuwatch lists them all together."),
        "watch_card_civil": (
            "Clerks, revenue officials, engineers, registrars and other "
            "officers of government departments and local bodies."),
        "watch_card_copwatchindia": (
            "Police officers: High Court and Supreme Court findings and "
            "trial-court convictions, with rights and remedy guides."),
        # ---- titles and meta descriptions
        "home_title": (
            "Babuwatch — court findings against India’s public "
            "servants"),
        "home_desc": (
            "Babuwatch documents {{headline}} across India, each attributed "
            "to the court that decided it."),
        "static_about_title": "About",
        "static_about_desc": (
            "What Babuwatch is and the standards it holds itself to. "
            "Publishes {{headline}}."),
        "state_desc": (
            "{{n}} High Court / Supreme Court records against public "
            "servants from {{state}}."),
        "state_desc_empty": (
            "No High Court / Supreme Court records against public servants "
            "located yet for {{state}}."),
        "trial_desc": (
            "{{n2}} trial-court convictions of public servants across India, "
            "part of {{headline}}; each with verification status and appeal "
            "status as known from the cited sources."),
        "trial_state_desc": (
            "{{n}} trial-court convictions of public servants from "
            "{{state}}, with verification and appeal status."),
        "trial_index_sub": (
            "{{n}} convictions of public servants entered by trial courts "
            "&mdash; Special Courts under the Prevention of Corruption Act, "
            "CBI courts, Lokayukta courts, Sessions courts and Magistrates' "
            "courts &mdash; drawn from judgments, official conviction lists "
            "and press releases."),
        "trial_index_callout": (
            "Trial-court records publish at V1 and above: V2 records were "
            "matched fact by fact to the official source, and some rest on "
            "a single press release (V1). Officials are shown by post and "
            "department unless the naming gate cleared the name."),
        "trial_state_sub": (
            "Trial-court convictions of public servants from {{state}}."),
        "methodology_size": (
            "<p><strong>Dataset size.</strong> Babuwatch publishes "
            "{{headline}}. {{overturned}}</p>"),
        "dataset_name": (
            "Babuwatch — court-adjudicated records against public "
            "servants in India"),
        "md_strap": (
            "Court-adjudicated records against public servants across "
            "India: civil servants and police."),
        "md_trial_intro": (
            "{{n2}} trial-court convictions of public servants (Special PC "
            "Act / CBI / Lokayukta / Sessions courts), each with its "
            "verification level and appeal status. Officials appear by "
            "gated display forms only."),
        "md_home_title": (
            "Babuwatch — court findings against India’s public "
            "servants"),
        "slogan": "No public servant is above the law.",
        "md_home_lede": (
            "Babuwatch documents {{headline}} across India — each "
            "attributed to the court that decided it. {{overturned}}"),
        "md_trial_index": (
            "{{n}} convictions of public servants entered by trial courts "
            "(Special PC Act courts, CBI courts, Lokayukta courts, Sessions "
            "courts, Magistrates' courts)."),
        "dataset_part_hcsc": (
            "{{n}} Supreme Court / High Court judgments recording adverse "
            "findings against public servants."),
        "dataset_part_trial": (
            "{{n}} trial-court convictions of public servants, each with "
            "appeal status."),
        "service_label_civil": "Civil servants",
        "service_label_police": "Police",
    },
    # Copy for engine/sections.py: places, commissions, follow-up, compliance, charged.
    "sections": {
        "kind_court": "High Court / Supreme Court",
        "kind_trial": "Trial-court conviction",
        "kind_charged": "Charged, not convicted",
        "read_order": "Read the order",
        "group_court": "High Court and Supreme Court findings",
        "group_trial": "Trial-court convictions",
        "group_commission": "Findings of commissions and complaints authorities",
        "group_cctv": "Court orders on police-station CCTV",
        "group_charged": "Charged, not convicted",
        "charged_inline_notice": (
            "The entries above are allegations. An officer trapped by an anti-corruption agency is presumed "
            "innocent unless a court convicts; none of them is counted as a finding anywhere on this site."),
        "places_eyebrow": "Places",
        "places_title": "Police records by state, district and police station",
        "places_desc": ("Every court finding, conviction, commission finding and CCTV order against police, "
                        "grouped by state, district and police station."),
        "places_intro": (
            "Every record on this site that names a place, grouped so you can look up your own district or "
            "police station. Districts and stations appear only where the source names them."),
        "places_cols": ["State", "HC / SC findings", "Trial convictions", "Commission findings",
                        "CCTV orders and charged"],
        "state_intro": "Records from this state, by district. Records whose source names no district are listed below the table.",
        "district_cols": ["District", "HC / SC findings", "Trial convictions", "Commission findings",
                          "CCTV orders and charged"],
        "state_no_district": "Records with no district stated",
        "district_intro": "Every record from this district, newest first, with the police stations they name.",
        "district_title_tail": "police records",
        "district_desc": "Court findings, convictions and commission findings against police in {{place}}.",
        "stations_heading": "Police stations named in these records",
        "station_word": "Police Station",
        "station_intro": "Every record that names this police station. A station's name appears only when the court or authority named it.",
        "comm_eyebrow": "Beyond the courts",
        "comm_title": "Findings of human rights commissions and police complaints authorities",
        "comm_desc": ("Relief recommended by the National Human Rights Commission against police, and Delhi "
                      "Police Complaints Authority findings, with whether the state has shown payment."),
        "comm_intro": (
            "Statutory bodies decide far more police complaints than the courts do. This section lists every "
            "police case in which the National Human Rights Commission recommended monetary relief, as printed "
            "in the relief tables of its annual reports from 2012-13 to 2023-24, and the Delhi Police "
            "Complaints Authority recommendations that the Lieutenant Governor approved."),
        "comm_stat_n": "findings listed",
        "comm_stat_amt": "relief recommended by NHRC",
        "comm_stat_unpaid": "where the state had not shown payment",
        "comm_notice": (
            "A commission recommendation is not a court judgment. NHRC recommends relief after finding that a "
            "public servant violated human rights; the government may comply, challenge the recommendation in "
            "court, or refuse it. Each record shows the latest status NHRC itself published. The tables name no "
            "officer and no victim, and neither does this site."),
        "comm_by_state": "By state",
        "comm_cols": ["State", "Findings", "Relief recommended", "Payment not shown"],
        "comm_by_nature": "What the findings were about",
        "comm_nature_cols": ["Nature of complaint (NHRC classification)", "Findings"],
        "comm_state_intro": "Every finding listed for this state, newest first.",
        "charged_link": "See also: police officers trapped by anti-corruption agencies (charged, not convicted)",
        "comm_listings": "Where this is published",
        "comm_record_notice": (
            "This record reproduces what the cited report says, and nothing more. The case file is NHRC's; "
            "anyone with a stake in the case can seek its status from the Commission (hrcnet.nic.in)."),
        "f_body": "Authority", "f_case": "Case number", "f_state": "State", "f_station": "Police station",
        "f_nature": "Nature of complaint", "f_relief": "Relief recommended", "f_date": "Date",
        "f_status": "Latest published status", "not_stated": "Not stated in the source",
        "table_pending": "listed as pending compliance (no proof of payment)",
        "table_challenged": "listed as challenged in court",
        "table_refused": "listed as not accepted / reconsideration sought",
        "table_recommended": "listed as a recommendation",
        "table_complied": "listed as complied with",
        "table_approved": "listed as approved by the Lieutenant Governor",
        "table_sent": "listed as sent to the Lieutenant Governor",
        "open_report": "open the report (PDF)",
        "at_line": "(text line {{n}} of the extracted report)",
        "fu_eyebrow": "Follow-up",
        "fu_title": "Was it paid? What happened after money was ordered",
        "fu_desc": ("Compensation ordered by courts against police and relief recommended by NHRC, with what the "
                    "public record shows about payment, and a ready RTI application to ask."),
        "fu_intro": (
            "A court or commission ordering compensation is not the end of a case. This page brings together "
            "every compensation order on this site and what is publicly known about whether it was paid, and "
            "gives you the RTI application to find out where nothing is known."),
        "fu_stat_court": "court orders for compensation",
        "fu_stat_court_amt": "ordered by courts",
        "fu_stat_nhrc": "NHRC recommendations without proof of payment",
        "fu_stat_nhrc_amt": "recommended, payment not shown",
        "fu_nhrc_h": "NHRC: relief recommended, payment not shown",
        "fu_nhrc_p": (
            "Cases in which NHRC's latest annual report listing the case recorded no proof of payment, or a "
            "challenge or refusal. A case may have been paid after that report; the date of each listing is on "
            "its record."),
        "fu_nhrc_cols": ["State", "Cases", "Relief recommended"],
        "fu_court_h": "Courts: compensation ordered against police",
        "fu_court_p": (
            "Amounts ordered by High Courts and the Supreme Court in the records on this site. Unless a later "
            "order on the record says the money was paid, payment is shown as not verified: it may have been "
            "paid, but nothing public we have found says so."),
        "fu_court_cols": ["Record", "State", "Order", "Ordered", "Payment"],
        "fu_paid_record": "Payment recorded in a later order",
        "fu_unverified": "Not verified",
        "fu_rti_h": "Ask for yourself: an RTI application",
        "fu_rti_p": (
            "<p>Send this to the Public Information Officer of the state Home Department (for court orders) or "
            "the department named in the NHRC case. The fee is Rs 10 in most states; replies are due in 30 days. "
            "If you get an answer, write to us and we will add it to the record with your permission.</p>"),
        "fu_rti_text": (
            "To,\nThe Public Information Officer,\nHome (Police) Department, Government of [State]\n\n"
            "Subject: Information under Section 6(1) of the Right to Information Act, 2005\n\n"
            "In [court / NHRC Case No.] dated [date], the [High Court / Commission] directed the State to pay "
            "Rs [amount] as compensation / monetary relief to [the victim / next of kin], and [where ordered] "
            "to recover it from the officers responsible. Please provide:\n"
            "1. Whether the amount has been paid, the date of payment and the payee (name may be withheld).\n"
            "2. A copy of the sanction order and the proof of payment sent to the court / Commission.\n"
            "3. Whether any amount has been recovered from the officers responsible, and copies of the "
            "recovery orders.\n"
            "4. Whether departmental proceedings were initiated against the officers concerned, and their "
            "present status and outcome.\n\n"
            "I am a citizen of India. The fee of Rs 10 is enclosed by [mode].\n\n[Name, address, date]"),
        "cp_eyebrow": "Compliance",
        "cp_title": "CCTV in police stations and arrest safeguards: what the courts are recording",
        "cp_desc": ("Court orders recording missing, non-functional or deleted police-station CCTV, and the "
                    "arrest safeguards courts enforce in the records on this site."),
        "cp_intro": (
            "In Paramvir Singh Saini (2020) the Supreme Court ordered working CCTV cameras, with recordings "
            "kept, in every police station; it has been monitoring compliance itself since 2025 (In Re: Lack "
            "of Functional CCTVs in Police Stations). This page lists court orders that record what is "
            "actually there."),
        "cp_cctv_h": "Court orders on police-station CCTV",
        "cp_cctv_p": (
            "Each entry quotes the order word for word and says who the statement belongs to: the court itself, "
            "an official report the court recorded, or the police's own affidavit."),
        "cp_sg_h": "Arrest safeguards in the court records on this site",
        "cp_sg_p": (
            "How many High Court and Supreme Court records on this site involve each safeguard, matched on the "
            "record's own summary, quote and provisions. A record can involve more than one."),
        "cp_sg_cols": ["Safeguard", "Records", "Latest records"],
        "ch_eyebrow": "Charged, not convicted",
        "ch_title": "Police officers trapped by anti-corruption agencies",
        "ch_desc": "Police officers trapped and arrested for bribery by anti-corruption agencies: allegations, not convictions.",
        "ch_intro": (
            "Arrests of police officers in bribery traps, as announced by the anti-corruption agency. These are "
            "allegations. They are kept apart from every finding on this site, counted in no total, and kept "
            "out of search engines; when a court decides a case, the outcome is added here."),
        "ch_notice": (
            "An officer arrested in a trap is presumed innocent unless a court convicts. Officers are described "
            "by rank and unit only; no name is published. Source: the agency's own press release."),
    },
}
