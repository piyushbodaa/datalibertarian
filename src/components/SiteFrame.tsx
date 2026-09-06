import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { EXTRACT_DATE } from "../data/sources";

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
            <span className="mt-1 block text-[0.65rem] font-medium uppercase tracking-[0.16em] text-zinc sm:mt-0 sm:ml-3 sm:inline">
              Union · State · Municipal · Gram
            </span>
          </NavLink>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <NavLink to="/" className={link} end>
              Home
            </NavLink>
            <NavLink to="/union" className={link}>
              Union
            </NavLink>
            <NavLink to="/states" className={link}>
              States
            </NavLink>
            <NavLink to="/municipal" className={link}>
              Municipal
            </NavLink>
            <NavLink to="/gram" className={link}>
              Gram
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
          Figures extracted {EXTRACT_DATE} from official budget documents. Every number on this site
          has a citation. Empty doors have no number. Not NGOs.
        </p>
        <p className="mt-1">
          <NavLink to="/sources">How the numbers were taken from the books</NavLink>
        </p>
      </footer>
    </div>
  );
}
