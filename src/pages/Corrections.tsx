export function CorrectionsPage() {
  return <article className="max-w-2xl">
    <p className="kicker">Source maintenance</p>
    <h1 className="mt-3 font-display text-3xl">Report a correction</h1>
    <p className="mt-4">Help keep the ledger traceable. Include the page address, the figure in question, the fiscal year, and a link to the official document with its page or table number.</p>
    <p className="mt-4">Each source footnote records its extraction date. That is when the document was read, not a claim that the figure was reviewed today. Budget estimates, revised estimates, and actual expenditure are kept separate.</p>
    <p className="mt-6"><a className="file-cta" href="https://github.com/piyushbodaa/datalibertarian/issues/new?title=Data%20correction&amp;body=Page%20URL%3A%0AFigure%20and%20fiscal%20year%3A%0AOfficial%20document%20URL%3A%0APage%20or%20table%3A%0ASuggested%20correction%3A">Open a correction on GitHub</a></p>
    <p className="mt-4 text-sm">You can also <a href="https://x.com/piyushbodaa">contact Piyush on X</a>. Reports on these channels may be public; include only information relevant to the source.</p>
    <h2 className="mt-8 font-display text-xl">How corrections are handled</h2>
    <p className="mt-3">Check the cited government book, record the reason for the change, update the source record and affected figures together, then run the data and browser checks. The repository history preserves the change and its explanation.</p>
  </article>;
}
