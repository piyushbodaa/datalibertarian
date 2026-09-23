"""Copwatch India — police officers, a sub-watch of Babuwatch.

Served at datalibertarian.in/babuwatch/copwatchindia (formerly
/copwatchindia, which now redirects here). Every string below is the
copy the site has always used; change it here, not in engine/build.py.
"""

PROFILE = {
    "site_name": "Copwatch India",
    "short_name": "Copwatch",
    "tagline": "A Centre for Liberty Project",
    "base": "/babuwatch/copwatchindia",
    "parent": "babuwatch",
    "switcher_blurb": "Police officers",
    "contact_email": "contact@copwatchindia.org",
    "templates": "copwatchindia",
    # The records this watch renders. `home` is the watch whose pages
    # render the record; `service` is the kind of public servant.
    "datasets": [
        {"dir": "data/copwatchindia", "home": "copwatchindia",
         "service": "police"},
    ],
    "parent_org": {"@id": "https://centreforliberty.org/#organization",
                   "name": "Centre for Liberty",
                   "url": "https://centreforliberty.org/"},
    # Static pages copied from templates/<templates>/ (slug, file).
    "static_pages": ["rights", "remedy", "about"],
    # NCRB police context charts on /patterns (needs context.json).
    "context_charts": True,
    # Site category vocabulary, verbatim from copwatchindia.org (R85).
    # Public category is ALWAYS one of these; house codes stay internal.
    "site_categories": ["Public beating", "Protest policing",
                        "Custodial death", "Custodial torture", "Other"],
    "category_map": {
        "brutality.custodial_death": "Custodial death",
        "brutality.custodial_rape_sexual_assault": "Custodial torture",
        "brutality.custodial_torture": "Custodial torture",
        "brutality.disproportionate_force": "Other",
        "brutality.enforced_disappearance": "Other",
        "brutality.fake_encounter_extrajudicial_killing": "Other",
        "corruption.bribery_pc_act": "Other",
        "corruption.extortion": "Other",
        "misconduct.dereliction_evidence_tampering": "Other",
        "misconduct.false_implication_fabrication": "Other",
        "misconduct.illegal_detention_false_imprisonment": "Other",
        "misconduct.other": "Other",
    },
    # Trimmed nav (Report + Volunteer dropped per site lead).
    "nav": [("/tracker", "Incident Tracker"), ("/patterns", "Patterns"),
            ("/trial-court", "Trial Courts"),
            ("/rights", "Know Your Rights"), ("/remedy", "Seek Remedy"),
            ("/methodology", "Methodology"), ("/about", "About")],
    "home_sections": ["hero", "ref:intent-prototype", "ref:does",
                      "ref:argument", "ref:ledger", "tracker", "patterns",
                      "ref:rights", "ref:disclaimer"],
    "text": {
        "headline": (
            "{{total}} court-adjudicated records of police misconduct "
            "— {{n1}} Supreme Court / High Court judgments and {{n2}} "
            "trial-court (Sessions / Special ACB / CBI / Lokayukta court) "
            "convictions"),
        "overturned_note": (
            "A further {{n}} trial-court convictions later set aside on "
            "appeal are kept out of the counts."),
        # ---- page shell (JSON-LD, social card, footer)
        "org_description": (
            "A civic accountability and public education project working "
            "towards transparent, lawful, and rights-respecting policing in "
            "India."),
        "website_description": (
            "Documenting reported allegations of police misconduct across "
            "India, and explaining citizens’ rights during arrest, "
            "detention, and custody."),
        "og_alt": "Copwatch India — The police are not above the law",
        "footer_tagline": (
            "Observe &middot; Document &middot; Demand Accountability"),
        "footer_about": (
            "A civic accountability and public education project working "
            "towards more transparent, lawful, and rights-respecting "
            "policing in India."),
        "footer_cols": (
            '        <div class="foot-col"><h5>The record</h5><a href="/tracker">Incident tracker</a><a href="/trial-court">Trial-court convictions</a><a href="/patterns">Patterns dashboard</a><a href="/methodology">Methodology</a></div>\n'
            '        <div class="foot-col"><h5>Learn</h5><a href="/rights">Know your rights</a><a href="/rights#detained">If someone is detained</a><a href="/rights#record">Record safely</a></div>\n'
            '        <div class="foot-col"><h5>Act</h5><a href="/remedy">Seek a remedy</a><a href="/about">About us</a><a href="{{mailto}}">Contact</a></div>'),
        "footer_disclaimer": (
            "Copwatch India documents reported and alleged incidents of "
            "police misconduct in the public interest. Inclusion in these "
            "records does not by itself establish legal guilt or final "
            "responsibility; verification and institutional actions are "
            "reported separately. Records are redacted to protect victims, "
            "witnesses, minors, and vulnerable persons, and are corrected or "
            "withdrawn as facts develop. <a href=\"/methodology\">Methodology "
            "&amp; full disclaimer</a>"),
        # ---- home page blocks ({{placeholders}} filled by build_home)
        'home_hero': (
            '\n'
            '<section class="hero prototype-hero">\n'
            '  <div class="wrap">\n'
            '    <h1>The police are <span class="against">not above</span> the law.</h1>\n'
            '    <p class="sub">Copwatch India documents {{headline}} across India &mdash; explains your rights, and tracks what the courts decided.</p>\n'
            '    <div class="prototype-actions">\n'
            '      <a href="#start-here" class="btn btn-primary">What happened? Start here</a>\n'
            '      <a href="{{mailto}}" class="btn btn-ghost">Contact us</a>\n'
            '    </div>\n'
            '    <p class="prototype-caveat">General public information&mdash;not emergency assistance, a reporting hotline, or individual legal representation.</p>\n'
            '  </div>\n'
            '</section>\n'),
        'home_tracker': (
            '\n'
            '<section class="tracker">\n'
            '  <div class="wrap">\n'
            '    <div class="sec-head">\n'
            '      <div class="kicker">Incident tracker</div>\n'
            '      <h2>Court-adjudicated cases, with verification and findings kept distinct</h2>\n'
            '      <p>{{total}} published records ({{n1}} High Court / Supreme Court &middot; {{n2}} trial court) from {{states}} states and union territories. Each record attributes its findings to the judgment it cites; Copwatch adds no findings of its own. {{overturned}}</p>\n'
            '    </div>\n'
            '\n'
            '    <div class="tracker-notice">\n'
            '      Records document court-adjudicated cases. Findings are attributed to the deciding court; verification describes how the judgment was reviewed. <a href="/methodology">Read our methodology &rarr;</a>\n'
            '    </div>\n'
            '\n'
            '    {{cards}}\n'
            '    <p class="tracker-note">Records are updated as new information, appeals, or court findings emerge. Recent judgments may still be under appeal; compensation figures are amounts ordered, not amounts shown paid.</p>\n'
            '    <div style="margin-top:28px"><a href="/tracker" class="btn btn-primary">View all records</a></div>\n'
            '  </div>\n'
            '</section>\n'),
        'home_patterns': (
            '\n'
            '<section class="patterns">\n'
            '  <div class="wrap">\n'
            '    <div class="sec-head">\n'
            '      <div class="kicker">Patterns dashboard</div>\n'
            '      <h2>The record shows shape, not just single cases</h2>\n'
            '      <p>Live counts drawn from {{total}} published records show where adjudicated cases occur, how facts were verified, and what the courts decided. Authority independence, legal effect, and dispositions remain distinct.</p>\n'
            '    </div>\n'
            '    <div class="callout"><div class="lab">Live dataset</div><p>The dashboard uses only published court-adjudicated records. It describes the cases documented here; it does not claim to estimate the prevalence of misconduct across India.</p></div>\n'
            '    <div style="margin-top:28px"><a href="/patterns" class="btn btn-primary">Explore the patterns</a></div>\n'
            '  </div>\n'
            '</section>\n'),
        # ---- page titles and meta descriptions
        'home_title': ('Copwatch India — police accountability and citizens’ rights'),
        'home_desc': ('Copwatch India documents {{headline}} across India, and explains your rights during arrest, detention, and custody.'),
        'static_rights_title': ('Know Your Rights'),
        'static_rights_desc': ('Grounds of arrest, the arrest memo, informing family, medical examination, production before a magistrate—and what to do if someone is picked up.'),
        'static_remedy_title': ('Seek a Remedy'),
        'static_remedy_desc': ('Lawful escalation through senior police, magistrates, Human Rights Commissions, Legal Services Authorities, and courts. Free legal aid is a right.'),
        'static_about_title': ('About'),
        'static_about_desc': ('A civic accountability and public education project working towards transparent, lawful, and rights-respecting policing in India. Publishes {{headline}}.'),
        'state_desc': ('{{n}} court-adjudicated police-accountability cases from {{state}}.'),
        'state_desc_empty': ('No court-adjudicated police-accountability judgments located yet for {{state}}.'),
        'trial_desc': ('{{n2}} trial-court convictions of police personnel across India, part of {{headline}}; each with verification status and appeal status as known from the cited sources.'),
        'trial_state_desc': ('{{n}} trial-court convictions of police personnel from {{state}}, with verification and appeal status.'),
        # ---- methodology appendix (the rest is templates/copwatchindia/methodology-appendix.html)
        'methodology_size': ('<p><strong>Dataset size.</strong> This site publishes {{headline}}. {{overturned}} High Court / Supreme Court records verify at V2 or V3; trial-court convictions verify to a lower standard (V1 and above) and each shows its appeal status.</p>'),
        # ---- trial-court pages
        'trial_index_sub': ("{{n}} convictions of police personnel entered by trial courts &mdash; Special ACB courts, CBI courts, Sessions courts, Magistrates' courts and Lokayukta courts &mdash; drawn from press releases, official lists and judgment texts."),
        'trial_index_callout': ('Many rest on a single press release (V1) and have not been independently verified by Copwatch India. Officers are shown by rank and unit only, unless the naming gate cleared the name.'),
        'trial_state_sub': ('Trial-court convictions of police personnel from {{state}}.'),
        # ---- dataset metadata
        'dataset_name': ('Copwatch India — court-adjudicated police-accountability cases'),
        # ---- Markdown twins, llms.txt and dataset metadata
        'md_strap': ('Court-adjudicated police-accountability cases across India.'),
        'md_trial_intro': ('{{n2}} trial-court convictions of police personnel (Sessions / Special ACB / CBI / Lokayukta courts), verified to a lower standard than the High Court / Supreme Court judgments above; each record shows its appeal status. Officers appear by gated display forms only.'),
        'md_home_title': ('Copwatch India — police accountability and citizens’ rights'),
        'slogan': ('The police are not above the law.'),
        'md_home_lede': ('Copwatch India documents {{headline}} across India — explains your rights, and tracks what the courts decided. {{overturned}}'),
        'md_trial_index': ("{{n}} convictions of police personnel entered by trial courts (Special ACB courts, CBI courts, Sessions courts, Magistrates' courts, Lokayukta courts)."),
        'dataset_part_hcsc': ('{{n}} Supreme Court / High Court judgments recording adverse findings against police personnel.'),
        'dataset_part_trial': ('{{n}} trial-court (Sessions / Special ACB / CBI / Lokayukta court) convictions of police personnel, each with appeal status.'),
    },
}
