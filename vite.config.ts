import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execFileSync } from "node:child_process";
import { injectSiteNav } from "./src/lib/siteNav";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "public-evidence-safety",
      apply: "build",
      buildStart() {
        execFileSync("python3", ["inflation/check_public_secrets.py"], { stdio: "inherit" });
      },
    },
    // Dev only: the build adds the site bar to every page in scripts/site-nav.ts.
    { name: "site-nav", apply: "serve", transformIndexHtml: { order: "post", handler: (html, ctx) => injectSiteNav(html, ctx.originalUrl ?? ctx.path) } },
  ],
  build: { target: "es2020", cssCodeSplit: true },
});
