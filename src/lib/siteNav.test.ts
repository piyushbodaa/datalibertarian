import { test } from "node:test";
import assert from "node:assert/strict";
import { currentItem, injectSiteNav, SITE_NAV_MARK } from "./siteNav";

test("marks the most specific section for a path", () => {
  assert.equal(currentItem("/crime/rape")?.name, "Rape");
  assert.equal(currentItem("/crime/rape/delhi")?.name, "Rape");
  assert.equal(currentItem("/crime")?.name, "Crime in India");
  assert.equal(currentItem("/babuwatch/incident/x")?.name, "Babuwatch");
  assert.equal(currentItem("/crimes"), undefined);
  assert.equal(currentItem("/"), undefined);
});

test("inserts once, after a leading skip link", () => {
  const page = '<html><head></head><body><a class="skip" href="#main">Skip</a><main id="main"></main></body></html>';
  const once = injectSiteNav(page, "/psu");
  assert.ok(once.indexOf("Skip</a>") < once.indexOf(SITE_NAV_MARK));
  assert.ok(once.includes('href="/site-nav.css"'));
  assert.ok(once.includes('<a href="/psu" aria-current="page">'));
  assert.equal(injectSiteNav(once, "/psu"), once);
});

test("leaves fragments without a body alone", () => {
  assert.equal(injectSiteNav("<div>part</div>", "/"), "<div>part</div>");
});

test("adds the directory footer once, before the last </body>", () => {
  const page = '<html><head></head><body><main></main><script>var s="</body>"</script></body></html>';
  const out = injectSiteNav(page, "/");
  assert.equal(out.split('class="dl-foot"').length, 2);
  assert.ok(out.indexOf('class="dl-foot"') > out.indexOf("<script>"));
});
