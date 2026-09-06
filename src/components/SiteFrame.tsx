import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { EXTRACT_DATE } from "../data/sources";

export function SiteFrame({ children }: { children: ReactNode }) {
  const link = ({ isActive }: { isActive: boolean }) =>
    `no-underline uppercase tracking-[0.14em] text-[0.7rem] ${
      isActive ? "text-tyrian" : "text-ink/70 hover:text-ink"
    }`;

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink/15">
        <div className="masthead-rule" />
        <div className="mx-auto flex max-w-6xl flex-wrap items-baseline justify-between gap-3 px-4 py-4 sm:px-6">
          <NavLink to="/" className="no-underline text-ink hover:text-tyrian">
            <span className="font-display text-xl font-semibold tracking-tight">Data Libertarian</span>
            <span className="mt-1 block text-[0.65rem] uppercase tracking-[0.16em] text-slate sm:mt-0 sm:ml-3 sm:inline">
              Maharashtra · extracted 6 Sept 2026
            </span>
          </NavLink>
          <nav className="flex gap-5">
            <NavLink to="/" className={link} end>
              Home
            </NavLink>
            <NavLink to="/maharashtra/police" className={link}>
              Maharashtra Police
            </NavLink>
            <NavLink to="/sources" className={link}>
              Method
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
      <footer className="mx-auto max-w-6xl border-t border-ink/15 px-4 py-6 text-xs text-ink/55 sm:px-6">
        <p>
          Figures extracted {EXTRACT_DATE} from official Maharashtra budget documents. Every number
          on this site has a citation. This is not an NGO tracker.
        </p>
        <p className="mt-1">
          <NavLink to="/sources">How the numbers were taken from the books</NavLink>
        </p>
      </footer>
    </div>
  );
}
