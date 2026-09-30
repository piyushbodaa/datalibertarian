import React from "react";
import type { ReactNode } from "react";
import { citations } from "../../../src/data/sources";

export const inr = (n: number) => new Intl.NumberFormat("en-IN").format(n);
export const one = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const pct = (part: number, whole: number) => Math.round((part / whole) * 1000) / 10;
export const change = (now: number, before: number) => Math.round(((now - before) / before) * 1000) / 10;
export const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${one(Math.abs(n))}%`;
/** Indian short form for hero figures: 6.9 lakh, 27,721. */
export const lakh = (n: number) => (n >= 100000 ? `${one(n / 100000)} lakh` : inr(n));

/** Numbered source notes. One instance per page; numbers follow first use. */
export class Refs {
  ids: string[] = [];
  cite = (...ids: string[]) => {
    const nums = ids.map((id) => {
      if (!citations[id]) throw new Error(`unknown citation ${id}`);
      if (!this.ids.includes(id)) this.ids.push(id);
      return this.ids.indexOf(id) + 1;
    });
    // Collapse runs of three or more consecutive notes into one range: 3–11.
    const sorted = [...new Set(nums)].sort((x, y) => x - y);
    const groups: number[][] = [];
    for (const n of sorted) {
      const last = groups[groups.length - 1];
      if (last && n === last[last.length - 1]! + 1) last.push(n);
      else groups.push([n]);
    }
    const parts = groups.flatMap((g) => (g.length >= 3 ? [[g[0]!, g[g.length - 1]!]] : g.map((n) => [n])));
    return (
      <sup className="cite">
        {parts.map((p, i) => (
          <a key={p[0]} href={`#src-${p[0]}`} aria-label={p.length > 1 ? `Sources ${p[0]} to ${p[1]}` : `Source ${p[0]}`}>
            {i ? "," : ""}
            {p.length > 1 ? `${p[0]}–${p[1]}` : p[0]}
          </a>
        ))}
      </sup>
    );
  };
}

export function Sources({ refs }: { refs: Refs }) {
  return (
    <section className="section crime-sources" id="sources">
      <div className="wrap">
        <div className="sec-head">
          <div className="kicker">Sources</div>
          <h2>Every figure, to its table</h2>
          <p>Government publications only. Each note links the document; the table number is where the figure is printed.</p>
        </div>
        <ol className="src-list">
          {refs.ids.map((id, i) => {
            const c = citations[id]!;
            return (
              <li key={id} id={`src-${i + 1}`}>
                <a href={c.url} rel="noopener">{c.title}</a>
                <span>
                  {c.publisher}
                  {c.pages ? ` · pp. ${c.pages}` : ""} · accessed {c.accessedOn}
                </span>
                {c.notes ? <span className="muted">{c.notes}</span> : null}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export const NAV = [
  { href: "/crime", label: "Overview", id: "home" },
  { href: "/crime/rape", label: "Rape", id: "rape" },
  { href: "/crime/murder", label: "Murder", id: "murder" },
  { href: "/crime/stealing", label: "Theft & robbery", id: "stealing" },
  { href: "/crime/method", label: "Method", id: "method" },
] as const;
export type PageId = (typeof NAV)[number]["id"];

export function Page({
  id,
  title,
  description,
  path,
  children,
  scripts = [],
  styles = [],
}: {
  id: PageId;
  title: string;
  description: string;
  path: string;
  children: ReactNode;
  scripts?: string[];
  styles?: string[];
}) {
  const url = `https://datalibertarian.in${path}`;
  const links = NAV.map((item) => (
    <a key={item.id} href={item.href} className={item.id === id ? "on" : undefined} aria-current={item.id === id ? "page" : undefined}>
      {item.label}
    </a>
  ));
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={url} />
        <meta property="og:site_name" content="Crime in India — Data Libertarian" />
        <meta property="og:locale" content="en_IN" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:image" content="https://datalibertarian.in/social-preview.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/babuwatch/assets/brand/favicon.ico" sizes="48x48" />
        <link rel="icon" type="image/svg+xml" href="/babuwatch/assets/brand/logo-glyph-saffron.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/babuwatch/styles.css" />
        <link rel="stylesheet" href="/crime/crime.css" />
        {styles.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
      </head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <header className="masthead">
          <div className="wrap">
            {/* The whole brand (logo, section name, tagline) leads to the main site. */}
            <div className="brand">
              <a className="seal" href="/" aria-label="Data Libertarian home">
                <img src="/babuwatch/assets/brand/logo-mark-saffron.svg" width={40} height={40} alt="" />
              </a>
              <span className="brand-text">
                <a className="name" href="/">Crime in India</a>
                <a className="tagline" href="/">A Data Libertarian Project</a>
              </span>
            </div>
            <nav className="links" aria-label="Primary">{links}</nav>
            <button className="navtoggle" type="button" aria-label="Open menu" aria-controls="mobile-navigation" aria-expanded="false">
              ☰
            </button>
          </div>
          <nav className="mobilenav" id="mobile-navigation" aria-label="Primary mobile">{links}</nav>
        </header>
        <main id="main">{children}</main>
        <footer>
          <div className="wrap">
            <div className="foot-top">
              <div className="foot-brand">
                <div className="name">Crime in India</div>
                <div className="tagline">Count · Attribute · Correct</div>
                <p>What the police registered, from the National Crime Records Bureau’s own tables. Every figure links to the table it came from.</p>
              </div>
              <div className="foot-cols">
                <div className="foot-col">
                  <h5>Crimes</h5>
                  <a href="/crime/rape">Rape</a>
                  <a href="/crime/murder">Murder</a>
                  <a href="/crime/stealing">Theft &amp; robbery</a>
                </div>
                <div className="foot-col">
                  <h5>Registers</h5>
                  <a href="/babuwatch">Babuwatch</a>
                  <a href="/civilliberties">Civil Liberties</a>
                  <a href="/victimlesscrimes">Victimless Crimes</a>
                  <a href="/economicfreedom">Economic Freedom</a>
                  <a href="/">All registers</a>
                </div>
                <div className="foot-col">
                  <h5>About</h5>
                  <a href="/crime/method">Method</a>
                  <a href="/corrections">Report a correction</a>
                  <a href="/babuwatch/about">About us</a>
                </div>
              </div>
            </div>
            <div className="foot-base">
              Every figure is a case the police registered and the National Crime Records Bureau published. A registered case is a complaint written down, not a finding of guilt, and not a count of every crime committed. Nothing here is estimated unless it says so.
              <div className="foot-legal">© 2026 Data Libertarian · Figures belong to the publications cited on each page.</div>
            </div>
          </div>
        </footer>
        <div className="viz-tip" role="tooltip" hidden />
        <script src="/babuwatch/public-nav.js" defer />
        <script src="/crime/crime.js" defer />
        {scripts.map((src) => (
          <script key={src} src={src} defer />
        ))}
      </body>
    </html>
  );
}

export function Hero({
  eyebrow,
  title,
  accent,
  children,
  actions,
  caveat,
}: {
  eyebrow: string;
  title: ReactNode;
  accent: ReactNode;
  children: ReactNode;
  actions?: { href: string; label: string }[];
  caveat?: ReactNode;
}) {
  return (
    <section className="hero prototype-hero crime-hero">
      <div className="wrap">
        <div className="eyebrow">{eyebrow}</div>
        <h1>
          {title} <span className="against">{accent}</span>
        </h1>
        <p className="sub">{children}</p>
        {actions ? (
          <div className="prototype-actions">
            {actions.map((a, i) => (
              <a key={a.href} href={a.href} className={`btn ${i ? "btn-ghost" : "btn-primary"}`}>
                {a.label}
              </a>
            ))}
          </div>
        ) : null}
        {caveat ? <p className="prototype-caveat">{caveat}</p> : null}
      </div>
    </section>
  );
}

export function Section({
  id,
  kicker,
  title,
  lede,
  tone,
  children,
}: {
  id?: string;
  kicker: string;
  title: ReactNode;
  lede?: ReactNode;
  tone?: "edge";
  children: ReactNode;
}) {
  return (
    <section className={`section crime-sec${tone === "edge" ? " edge" : ""}`} id={id}>
      <div className="wrap">
        <div className="sec-head">
          <div className="kicker">{kicker}</div>
          <h2>{title}</h2>
          {lede ? <p>{lede}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

export function Stats({ children }: { children: ReactNode }) {
  return (
    <div className="stats" role="list">
      {children}
    </div>
  );
}

export function Stat({ value, label, sub, delta }: { value: string; label: string; sub: ReactNode; delta?: { text: string; dir: "up" | "down" | "flat" } }) {
  return (
    <div className="stat" role="listitem">
      <div className="num">{value}</div>
      <div className="lab">{label}</div>
      <div className="sub">
        {delta ? <span className={`delta ${delta.dir}`}>{delta.text}</span> : null}
        {sub}
      </div>
    </div>
  );
}

export function Callout({ label, children, tone }: { label: string; children: ReactNode; tone?: "urgent" }) {
  return (
    <div className={`callout${tone ? ` ${tone}` : ""}`}>
      <div className="lab">{label}</div>
      <p>{children}</p>
    </div>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="crime-prose">{children}</div>;
}
