import { useEffect } from "react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  useEffect(() => {
    document.title = "Page not found — Data Libertarian";
    let meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "robots"; document.head.append(meta); }
    meta.content = "noindex";
    return () => { meta?.remove(); };
  }, []);
  return <article data-not-found>
    <p className="kicker">404</p>
    <h1 className="mt-3 font-display text-3xl">This page could not be found</h1>
    <p className="my-4">The address may have changed. Explore the available books or search for a figure.</p>
    <p className="flex gap-6"><Link to="/states">Explore states</Link><Link to="/search">Search figures</Link><Link to="/">Home</Link></p>
  </article>;
}
