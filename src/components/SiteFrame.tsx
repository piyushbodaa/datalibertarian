import { applyMetadata } from "../lib/metadata";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { crumbsFor } from "../lib/nav";

const NAV: { to: string; label: string; match: (p: string) => boolean }[] = [
  { to: "/spending", label: "Overview", match: (p) => p === "/spending" },
  {
    to: "/states",
    label: "States",
    match: (p) =>
      p === "/states" ||
      (/^\/[^/]+\/(police|health)$/.test(p) && !p.startsWith("/delhi/")),
  },
  { to: "/compare", label: "Compare", match: (p) => p === "/compare" },
  {
    to: "/union",
    label: "Union",
    match: (p) => p === "/union" || p.startsWith("/union/") || p === "/delhi/police",
  },
  {
    to: "/municipal",
    label: "Municipal",
    match: (p) => p === "/municipal" || p.startsWith("/municipal/"),
  },
  { to: "/gram", label: "Gram", match: (p) => p === "/gram" },
  {
    to: "/inflation",
    label: "Prices & CPI",
    match: (p) => p === "/inflation" || p.startsWith("/inflation/"),
  },
  { to: "/sources", label: "Sources", match: (p) => p === "/sources" },
  { to: "/corrections", label: "Corrections", match: (p) => p === "/corrections" },
];

export function SiteFrame({ children }: { children: ReactNode }) {
  const location = useLocation();
  const crumbs = crumbsFor(location.pathname);

  useEffect(() => {
    const update = () => {
      applyMetadata(location.pathname, location.search);
      const missing = !!document.querySelector("[data-not-found]");
      let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
      if (missing || location.pathname === "/search") {
        if (!robots) {
          robots = document.createElement("meta");
          robots.name = "robots";
          document.head.append(robots);
        }
        robots.content = "noindex";
        if (missing) document.title = "Page not found — Data Libertarian";
      } else {
        robots?.remove();
      }
    };
    update();
    const main = document.getElementById("main");
    if (!main) return;
    const observer = new MutationObserver(update);
    observer.observe(main, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo(0, 0);
      return;
    }
    const scroll = () => {
      const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) {
        target.scrollIntoView();
        return true;
      }
      return false;
    };
    if (scroll()) return;
    const main = document.getElementById("main");
    if (!main) return;
    const observer = new MutationObserver(() => {
      if (scroll()) observer.disconnect();
    });
    observer.observe(main, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [location.pathname, location.hash]);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-rust focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <nav className="dl-subnav" aria-label="Public Money sections">
        <div className="dl-subnav-in">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} aria-current={item.match(location.pathname) ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <main id="main" className="mx-auto max-w-[1168px] px-4 py-8 sm:px-6 sm:py-10">
        {crumbs.length > 1 ? (
          <nav aria-label="Breadcrumb">
            <ol className="crumb-nav">
              {crumbs.map((c, i) => (
                <li key={c.to} className="flex items-center gap-2">
                  {i > 0 ? <span aria-hidden="true">/</span> : null}
                  {i === crumbs.length - 1 ? (
                    <span className="font-medium text-ink">{c.label}</span>
                  ) : (
                    <Link to={c.to}>{c.label}</Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        {children}
      </main>

      <footer className="mx-auto max-w-[1168px] border-t border-[var(--rule)] px-4 py-6 text-xs text-ink/60 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="m-0">
            Source figures link to their publications. Derived measures identify their inputs, dates, and methods.
          </p>
          <div className="flex flex-wrap items-center gap-4 font-medium">
            <Link to="/sources" className="text-ink/75 no-underline hover:text-rust hover:underline">
              Sources &amp; citations
            </Link>
            <Link to="/corrections" className="text-ink/75 no-underline hover:text-rust hover:underline">
              Correction log
            </Link>
            <a href="/search" className="text-ink/75 no-underline hover:text-rust hover:underline">
              Search archive
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
