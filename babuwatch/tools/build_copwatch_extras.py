#!/usr/bin/env python3
"""Build Copwatch's non-court datasets from official sources (maintainer tool, run locally).

    python3 babuwatch/tools/build_copwatch_extras.py --work <dir with parsed sources>

Writes, under babuwatch/data/copwatchindia/:
  commissions.json  findings of statutory bodies: NHRC relief recommendations against police
                    (from the relief tables of NHRC annual reports 2012-13 to 2023-24) and Delhi
                    Police Complaints Authority recommendations approved by the Lieutenant Governor
  cctv.json         court orders recording missing, non-functional or unpreserved police-station CCTV
  charged.json      police officers trapped by an anti-corruption agency: charged, NOT convicted

The parsed inputs (nhrc_police_records.json, dpca_rows.json) come from the parsers kept with the
work directory; they read the official PDFs only. No record here carries a personal name: NHRC's
relief tables carry none, Delhi PCA complainants are private persons and are dropped, and trapped
officers are described by rank and unit only.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "data", "copwatchindia")
MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September",
          "October", "November", "December"]


def arg(flag, default=None):
    a = sys.argv[1:]
    return a[a.index(flag) + 1] if flag in a else default


def human_date(iso):
    if not iso:
        return None
    y, m, d = iso.split("-")
    return "%d %s %s" % (int(d), MONTHS[int(m)], y)


def inr(n):
    s = str(n)
    if len(s) <= 3:
        return "Rs " + s
    head, tail = s[:-3], s[-3:]
    head = re.sub(r"(\d)(?=(\d{2})+$)", r"\1,", head)
    return "Rs %s,%s" % (head, tail)


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


# --------------------------------------------------------------------------- NHRC
STATUS_TEXT = {
    "pending": ("Payment not shown to NHRC",
                "NHRC's annual report for {rep} lists this case among those in which the state had not sent "
                "the Commission proof of payment (data as of {asof})."),
    "challenged": ("Challenged in court",
                   "NHRC's annual report for {rep} records that the recommendation was challenged before a "
                   "High Court."),
    "refused": ("Not accepted by the state",
                "NHRC's annual report for {rep} records that the government did not accept the recommendation "
                "or sought its reconsideration."),
    "recommended": ("Recommendation made",
                    "NHRC's annual report for {rep} lists the recommendation; it does not say whether the "
                    "relief was paid."),
}


def nhrc_records(parsed):
    out = []
    for r in parsed:
        last = r["history"][-1]
        rep = last["report"]
        # the latest listing that carries the status
        st_rows = [h for h in r["history"] if h["table"] == r["status"]] or r["history"]
        st = st_rows[-1]
        label, note = STATUS_TEXT[r["status"]]
        nature = r["nature"]
        when = human_date(r["date_recommended"])
        summary = ("The National Human Rights Commission recommended monetary relief of %s in a case it "
                   "classified as %s, in %s (NHRC Case No. %s)%s. %s"
                   % (inr(r["amount"]), nature[0].lower() + nature[1:], r["state"], r["case_no"],
                      (", on %s" % when) if when else "",
                      note.format(rep=st["report"], asof=human_date(st["as_of"]))))
        out.append({
            "id": "nhrc-" + slug(r["case_no"]),
            "body": "nhrc", "body_name": "National Human Rights Commission",
            "case_no": r["case_no"], "state": r["state"], "district": None, "police_station": None,
            "nhrc_code": r["code"], "nature": nature, "category": r["category"], "force": r["force"],
            "relief_inr": r["amount"], "relief_variants": r["amount_variants"] if len(r["amount_variants"]) > 1 else None,
            "date": r["date_recommended"], "date_label": "Relief recommended",
            "status": r["status"], "status_label": label, "status_as_of": st["as_of"],
            "summary": summary,
            "listings": [{"report": h["report"], "table": h["table"], "as_of": h["as_of"], "url": h["source"],
                          "line": h["line"]} for h in r["history"]],
            "sources": sorted({h["source"] for h in r["history"]}),
            "verification": "V2",
        })
    return out


# --------------------------------------------------------------------------- Delhi PCA
DPCA_URL = "https://pca.delhi.gov.in/sites/default/files/pca/generic_multiple_files/"


def dpca_records(rows, approvals):
    out = []
    for r in rows:
        ps = r["ps"]
        ap = r.get("approved_on") or approvals.get((r["year"], ps.replace(" ", "").lower()))
        apd = None
        if ap:
            d, m, y = ap.split(".")
            apd = "%s-%02d-%02d" % (y, int(m), int(d))
        sent = None
        if r.get("sent"):
            d, m, y = r["sent"].split(".")
            sent = "%s-%02d-%02d" % (y, int(m), int(d))
        if r["approved"]:
            what = ("the Lieutenant Governor of Delhi approved the recommendation%s"
                    % ((" on %s" % human_date(apd)) if apd else ""))
            status, label = "approved", "Approved by the Lieutenant Governor"
        else:
            what = "the report lists the recommendation as sent to the Lieutenant Governor"
            status, label = "sent", "Sent to the Lieutenant Governor"
        src = DPCA_URL + ("annual_report_2022-2023.pdf" if "2022-2023" in r["report"] else "annual_report_2021_22.pdf")
        out.append({
            "id": "dpca-%s-%s" % (r["year"].replace("-", ""), slug(ps)),
            "body": "dpca", "body_name": "Police Complaints Authority, Delhi",
            "case_no": None, "state": "Delhi", "district": None, "police_station": "PS " + ps,
            "nature": "Complaint of serious misconduct", "category": "other", "force": "state_police",
            "relief_inr": None, "date": apd or sent, "date_label": "Approved" if apd else "Recommendation sent",
            "year": r["year"], "status": status, "status_label": label, "status_as_of": apd or sent,
            "summary": ("The Police Complaints Authority, Delhi inquired into a complaint against police of PS %s "
                        "and sent its recommendation to the Lieutenant Governor; %s. The Authority's annual "
                        "report lists the case among its %s quorum complaints; it does not describe the "
                        "misconduct found or the action recommended, and the complainant is not named here."
                        % (ps, what, r["year"])),
            "listings": [{"report": "Delhi PCA annual report " + ("2022-23" if "2022-2023" in r["report"] else "2021-22"),
                          "table": status, "as_of": None, "url": src, "line": None}],
            "sources": [src], "verification": "V2",
        })
    return out


# --------------------------------------------------------------------------- CCTV
IK = "https://indiankanoon.org/doc/%s/"
CCTV = [
    # (ik id, state, district, police station(s), court, date, case no, speaker, kind, quote)
    ("109907628", "Odisha", None, None, "Orissa High Court", "2024-12-23", "Suo Motu W.P.(C) No. 23735 of 2024",
     "official report", "not_functional",
     "It's to submit that out of 11,729 CCTV cameras installed in 593 police stations, 2266 of cameras were non-functional in 456 Police Station due to various causes as on 24th September 2024."),
    ("138512446", "Meghalaya", "Ri-Bhoi", "Umiam Police Station; Umsning Police Station; Umsohlait Police Station",
     "Meghalaya High Court", "2026-09-09", "Crl.Petn. No. 97/2026", "official report", "not_functional",
     "As far as Umiam Police Station is concerned, it appears that out of 15 CCTV cameras installed till date, all 15 are non-functional from 23rd August, 2024."),
    ("13242551", "Uttar Pradesh", "Deoria", "P.S. Gauri Bazar", "Allahabad High Court", "2026-09-09",
     "Habeas Corpus Writ Petition No. 506 of 2026", "court", "footage_missing",
     "Under the said circumstances, it would not be unreasonable to presume that the period during which the camera feed was not recorded, may also have been physically deleted in order to wipe out the evidence of the proceedings in the Thana during that relevant period of time."),
    ("173578843", "Uttar Pradesh", "Chitrakoot", "P.S. Sardhuwa", "Allahabad High Court", "2026-09-23",
     "Habeas Corpus Writ Petition No. 1169 of 2026", "court", "footage_missing",
     "the feeds within the police Thana were deliberately either deleted or deliberately not saved in the DVR as there is no argument put forth with regard to malfunction of any CCTV cameras"),
    ("158204709", "Delhi", "North East", "PS Jyoti Nagar", "Delhi High Court", "2024-07-23", None, "court",
     "not_functional",
     "The narrative that all CCTV cameras installed at the police station were malfunctioning at that crucial time; and that therefore no CCTV-footage is available from within the police station to show the condition of any of the persons who were there at that time, also does not inspire confidence."),
    ("48133416", "Maharashtra", "Pune", "Shikrapur Police Station (Pune Rural)", "Bombay High Court", "2025-07-25",
     "WPST No. 945 of 2025", "police affidavit", "footage_missing",
     "On checking the CCTV footage in the Police Station, it has been observed that the CCTV footage of the following date is not available in record."),
    ("39272848", "Jharkhand", "Gumla", "Chainpur Police Station", "Jharkhand High Court", "2025-12-08",
     "W.P.(PIL) No. 7140 of 2025", "court", "not_installed",
     "even CCTV Cameras have not been installed in the police station despite the direction of the Hon'ble Supreme Court way back in the year 2015"),
    ("103477781", "Tamil Nadu", "Perambalur", "Padalur Police Station", "Madras High Court", "2026-01-20",
     "Contempt Petition No. 3621 of 2025", "official report", "footage_missing",
     "it was reported that the storage device of the CCTV there is no footage available in the above dates"),
    ("164593431", "Tamil Nadu", "Kanyakumari", "Kottikode Police Station", "Madras High Court", "2026-02-27",
     "W.P.(MD) No. 22673 of 2022", "court", "footage_missing",
     "Though it is admitted by Karthikeyan that in the station premises of Kotticode CCTV cameras have been installed, the footages were not produced."),
    ("166038093", "Tamil Nadu", "Madurai", "Jaihindpuram Police Station", "Madras High Court", "2024-03-21",
     "W.P.(MD) No. 6165 of 2024", "police affidavit", "footage_missing",
     "The footages are not available for 11.10.2023 in the Jaihindpuram Police Station and CCTV cameras are not available in the old Deputy Commissioner of Police Office, Kavalkoodal Street, Madurai."),
]
CCTV_KIND = {"not_functional": "Cameras not working", "footage_missing": "Footage missing or not preserved",
             "not_installed": "Cameras not installed"}
CCTV_SPEAKER = {"court": "Finding of the court", "official report": "Official report recorded by the court",
                "police affidavit": "Police statement recorded by the court"}


def cctv_records():
    out = []
    for ik, st, di, ps, court, d, cn, spk, kind, q in CCTV:
        out.append({"id": "cctv-%s" % ik, "state": st, "district": di, "police_station": ps, "court": court,
                    "date": d, "case_no": cn, "speaker": spk, "speaker_label": CCTV_SPEAKER[spk],
                    "kind": kind, "kind_label": CCTV_KIND[kind], "quote": q, "url": IK % ik})
    return out


# --------------------------------------------------------------------------- Charged (trapped, not convicted)
DVAC = "https://dvac.tn.gov.in/Press_Release.html"
TRAPS = [
    # (date, rank(s), unit, district, bribe Rs, purpose as stated)
    ("2026-08-11", "Sub-Inspector of Police", "Nallur Police Station", "Namakkal", 30000,
     "not taking action against the complainant in a case registered at the police station"),
    ("2026-07-27", "Special Sub-Inspector of Police", "Alangayam Police Station", "Tirupattur", 5000,
     "releasing the complainant and his vehicle, seized after a road accident, on station bail"),
    ("2026-07-16", "Special Sub-Inspector of Police", "Pollachi Police Station", "Coimbatore", 70000,
     "closing a petition against the complainant"),
    ("2025-05-26", "Head Constable", "Palakodu Police Station", "Dharmapuri", 10000,
     "processing bail for the complainant, an accused in a Palakodu police station case"),
    ("2025-04-09", "Head Constable", "Chettipalayam Police Station", "Coimbatore", 10000,
     "approving police verification for the complainant's passport application"),
    ("2025-02-19", "Sub-Inspector of Police and Head Constable", "Anna Nagar Traffic Investigation, West Zone",
     "Chennai", 5000, "returning the complainant's original driving licence and RC book"),
    ("2024-05-14", "Police Constable (with a Special Tahsildar)", "St. Thomas Mount Crime Police Station",
     "Chennai", 300000, "an advance bribe for evicting an encroachment on the complainant's land"),
    ("2023-09-15", "Deputy Superintendent of Police", "District Crime Branch, Trichy", "Tiruchirappalli", 100000,
     "not taking any action against the complainant in a criminal case"),
    ("2023-09-15", "Sub-Inspector of Police", "G.H. Police Station, Erode", "Erode", 7000,
     "releasing the complainant's two-wheeler"),
    ("2023-07-17", "Sub-Inspector of Police", "Anti-Vice Squad, Trichy City", "Tiruchirappalli", 3000,
     "not acting on a complaint and not registering a Goondas Act case against the complainant, who ran an Ayurvedic spa"),
    ("2023-03-13", "Special Sub-Inspector of Police", "Kullanchavadi Police Station", "Cuddalore", 5000,
     "taking action on the complainant's petition"),
    ("2022-12-30", "Special Sub-Inspector of Police", "Thanjavur Police Station", "Thanjavur", 10000,
     "not registering an FIR against the complainant"),
    ("2022-12-13", "Inspector of Police", "All Women Police Station, Lalgudi", "Tiruchirappalli", 5000,
     "filing the charge sheet in the complainant's case"),
    ("2022-10-29", "Special Sub-Inspector of Police", "Paramathi Police Station", "Namakkal", 5000,
     "safeguarding the complainant in a complaint against him"),
    ("2022-10-19", "Inspector of Police", "All Women Police Station, Villivakkam", "Chennai", 20000,
     "closing a house-trespass case against the complainant"),
    ("2022-07-05", "Grade I Police Constable", "Special Branch, Vanapuram Police Station", "Tiruvannamalai", 15000,
     "letting the complainant run his brick kiln without police hindrance"),
    ("2022-04-26", "Sub-Inspector of Police", "M. Reddiyapatti Police Station", "Virudhunagar", 10000,
     "not sending a report to the court to cancel the complainant's bail"),
    ("2022-04-05", "Deputy Superintendent of Police", "District Crime Branch, Kanniyakumari", "Kanyakumari", 500000,
     "settling a civil dispute"),
    ("2021-03-25", "Sub-Inspector of Police", "Kavarapettai Police Station", "Tiruvallur", 20000,
     "not registering a case over an owner-tenant dispute"),
    ("2021-03-09", "Two Special Sub-Inspectors of Police", "Variety Hall Road Police Station, Coimbatore",
     "Coimbatore", 1700, "releasing a detained two-wheeler without registering a case"),
    ("2020-12-31", "Inspector of Police and Head Constable", "NIB CID, Coimbatore", "Coimbatore", 70000,
     "registering a case with a minimum quantity of ganja and releasing the accused on bail"),
    ("2020-11-26", "Inspector of Police", "Checkanoorani Police Station", "Madurai", 30000,
     "deleting an accused from the charge sheet"),
    ("2019-06-10", "Inspector of Police", "Adambakkam Crime Police Station", "Chennai", 3000, None),
    ("2019-05-22", "Inspector of Police", "Uthangarai Police Station", "Krishnagiri", 70000, None),
    ("2018-11-30", "Inspector of Police (Traffic)", "Valasaravakkam", "Chennai", 8000, None),
    ("2018-02-08", "Deputy Superintendent of Police and Sub-Inspector of Police", "Ambur Range", "Vellore", None, None),
]


def charged_records():
    out = []
    for i, (d, rank, unit, dist, amt, why) in enumerate(TRAPS, 1):
        txt = ("Tamil Nadu's Directorate of Vigilance and Anti-Corruption reported that it trapped and arrested "
               "a %s of %s, %s district, on %s%s%s. This is an allegation: an arrest in a trap is not a "
               "conviction, and the officer is presumed innocent unless a court finds otherwise."
               % (rank, unit, dist, human_date(d),
                  (" while demanding and accepting a bribe of %s" % inr(amt)) if amt else " in a bribery case",
                  (" for %s" % why) if why else ""))
        out.append({"id": "tn-dvac-trap-%s-%02d" % (d.replace("-", ""), i), "agency": "tn-dvac",
                    "agency_name": "Directorate of Vigilance and Anti-Corruption, Tamil Nadu",
                    "state": "Tamil Nadu", "district": dist, "police_station": unit, "rank": rank,
                    "date": d, "bribe_inr": amt, "purpose": why, "status": "charged",
                    "status_label": "Trapped and arrested; not convicted",
                    "outcome": None, "outcome_record": None, "summary": txt, "source": DVAC})
    return out


def main():
    work = arg("--work")
    if not work:
        sys.exit("usage: build_copwatch_extras.py --work <dir>")
    nhrc = json.load(open(os.path.join(work, "ar", "nhrc_police_records.json")))
    dpca = json.load(open(os.path.join(work, "pca", "dpca_rows.json")))
    approvals = {("2019-20", "prashantvihar"): "17.12.2019", ("2019-20", "saritavihar"): "10.12.2019",
                 ("2021-22", "adarshnagar"): "20.09.2022"}   # from the 2021-22 annual report
    comm = nhrc_records(nhrc) + dpca_records(dpca, approvals)
    comm.sort(key=lambda r: (r["date"] or "", r["id"]), reverse=True)
    ids = [r["id"] for r in comm]
    assert len(ids) == len(set(ids)), "duplicate commission ids"
    for name, data in (("commissions.json", comm), ("cctv.json", cctv_records()), ("charged.json", charged_records())):
        with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
            json.dump(data, f, indent=1, ensure_ascii=False)
            f.write("\n")
        print("%s: %d records" % (name, len(data)))


if __name__ == "__main__":
    main()
