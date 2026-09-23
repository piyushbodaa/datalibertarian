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
    "switcher_blurb": "All public servants",
    # Owner decision 2026-09-23: Babuwatch keeps reusing Copwatch India's
    # address until it has one of its own.
    "contact_email": "contact@copwatchindia.org",
    "templates": "babuwatch",
    # Every register's records. The first dataset also supplies cases.csv.
    "datasets": [
        {"dir": "data/copwatchindia", "home": "copwatchindia",
         "service": "police"},
        {"dir": "data/civil", "home": "babuwatch", "service": "civil"},
    ],
    "parent_org": None,
    "static_pages": ["about"],
    "context_charts": False,
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
    "nav": [("/tracker", "Tracker"), ("/trial-court", "Trial Courts"),
            ("/patterns", "Patterns"), ("/methodology", "Methodology"),
            ("/about", "About")],
    "home_sections": ["hero", "watches", "ref:does", "tracker", "ref:ledger",
                      "patterns", "ref:disclaimer"],
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
        "footer_tagline": "Record &middot; Attribute &middot; Correct",
        "footer_about": (
            "A public register of what India's courts decided about the "
            "people who exercise state power on the public's behalf."),
        "footer_cols": (
            '        <div class="foot-col"><h5>The record</h5><a href="/tracker">Tracker</a><a href="/trial-court">Trial-court convictions</a><a href="/patterns">Patterns dashboard</a><a href="/data">Open data</a></div>\n'
            '        <div class="foot-col"><h5>Registers</h5><a href="/tracker?service=civil">Civil servants</a><a href="@ROOT@/babuwatch/copwatchindia">Copwatch India (police)</a></div>\n'
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
            '      <a href="/tracker" class="btn btn-primary">Browse every record</a>\n'
            '      <a href="/methodology" class="btn btn-ghost">How we verify</a>\n'
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
            "Civil-servant records publish at V2: the official source was "
            "read and each fact matched to it. Police records follow "
            "Copwatch India's rule, and some rest on a single press release "
            "(V1). Officials are shown by post and department unless the "
            "naming gate cleared the name."),
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
}
