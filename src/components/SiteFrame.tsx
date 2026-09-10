import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { EXTRACT_DATE } from "../data/sources";
import { crumbsFor, titleFor } from "../lib/nav";

function figuresDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[(m ?? 1) - 1]} ${y}`;
}

const NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/compare", label: "Compare" },
  { to: "/states", label: "States" },
  { to: "/union", label: "Centre" },
  { to: "/sources", label: "Method" },
  { to: "/search", label: "Search" },
] as const;

export function SiteFrame({ children }: { children: ReactNode }) {
  const location = useLocation();
  const crumbs = crumbsFor(location.pathname);

  useEffect(() => {
    document.title = titleFor(location.pathname, location.search);
  }, [location.pathname, location.search]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-[100dvh]">
      <a href="#main" className="skip-link">
        Skip to figures
      </a>
      <header className="site-header">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <NavLink to="/" className="min-w-0 no-underline text-ink hover:text-rust">
            <span className="font-display text-[1.2rem] font-semibold tracking-tight sm:text-[1.45rem]">
              Data Libertarian
            </span>
            <span className="mt-0.5 hidden text-[0.72rem] text-ink/55 sm:block">
              Official books · cited rupees
            </span>
          </NavLink>
          <HeaderSearch />
        </div>
        <nav className="mx-auto max-w-6xl border-t border-ink/10 px-2 sm:px-4" aria-label="Site">
          <div className="nav-scroll">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={"end" in item ? item.end : false}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
        {crumbs.length > 1 ? (
          <nav aria-label="Breadcrumb">
            <ol className="crumb-nav">
              {crumbs.map((c, i) => (
                <li key={c.to} className="flex items-center gap-2">
                  {i > 0 ? <span aria-hidden="true">/</span> : null}
                  {i === crumbs.length - 1 ? (
                    <span className="text-ink">{c.label}</span>
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
      <footer className="mx-auto max-w-6xl border-t border-ink/15 px-4 py-7 text-sm text-ink/60 sm:px-6">
        <p>
          Figures taken from official budget books. Empty means we have not read that book yet — not
          that it is zero. Figures from {figuresDate(EXTRACT_DATE)}.
        </p>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          <Link to="/sources">Method</Link>
          <Link to="/compare">Compare</Link>
          <Link to="/states">States</Link>
          <Link to="/union">Centre</Link>
        </p>
      </footer>
    </div>
  );
}

function HeaderSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const current = new URLSearchParams(location.search).get("q") ?? "";
  const [q, setQ] = useState(current);

  useEffect(() => {
    if (location.pathname === "/search") setQ(current);
  }, [location.pathname, current]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next = q.trim();
    navigate(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  }

  return (
    <form role="search" onSubmit={onSubmit} className="shrink-0">
      <label htmlFor="site-search" className="sr-only">
        Search typed lines
      </label>
      <input
        id="site-search"
        className="field w-[7.5rem] sm:w-48"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search"
        type="search"
        enterKeyHint="search"
      />
    </form>
  );
}
