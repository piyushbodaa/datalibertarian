import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { EXTRACT_DATE } from "../data/sources";

function figuresDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[(m ?? 1) - 1]} ${y}`;
}

export function SiteFrame({ children }: { children: ReactNode }) {
  const link = ({ isActive }: { isActive: boolean }) =>
    `no-underline uppercase tracking-[0.14em] text-[0.7rem] font-medium ${
      isActive ? "text-rust" : "text-ink/70 hover:text-ink"
    }`;

  return (
    <div className="docket-root min-h-screen">
      <div className="docket-spine" aria-hidden="true" />
      <header className="border-b border-ink/15">
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-3 px-4 py-4 sm:px-6">
          <NavLink to="/" className="no-underline text-ink hover:text-rust">
            <span className="font-display text-[1.35rem] font-semibold tracking-tight sm:text-2xl">
              Data Libertarian
            </span>
          </NavLink>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <NavLink to="/" className={link} end>
              Home
            </NavLink>
            <NavLink to="/compare" className={link}>
              Compare
            </NavLink>
            <NavLink to="/states" className={link}>
              States
            </NavLink>
            <NavLink to="/union" className={link}>
              Centre
            </NavLink>
            <NavLink to="/sources" className={link}>
              Method
            </NavLink>
          </nav>
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="file-tab" aria-hidden="true" />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-9 sm:px-6 sm:py-10">{children}</main>
      <footer className="mx-auto max-w-6xl border-t border-ink/15 px-4 py-6 text-xs text-ink/55 sm:px-6">
        <p>
          Figures taken from official budget books. Empty means we have not read that book yet.
          Figures from {figuresDate(EXTRACT_DATE)}.
        </p>
      </footer>
    </div>
  );
}
