import { test } from "node:test";
import assert from "node:assert/strict";
import { currentItem, injectSiteNav, renderSiteFooter, renderSiteNav, SITE_NAV, SITE_NAV_MARK } from "./siteNav";

test("marks the most specific section for a path", () => {
  assert.equal(currentItem("/crime/rape")?.name, "Rape");
  assert.equal(currentItem("/crime/rape/delhi")?.name, "Rape");
  assert.equal(currentItem("/crime")?.name, "Crime in India");
  assert.equal(currentItem("/babuwatch/incident/x")?.name, "Babuwatch");
  assert.equal(currentItem("/gov")?.name, "Gov.in Directory");
  assert.equal(currentItem("/gov/ministries")?.name, "Gov.in Directory");
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

test("one menu serves desktop and phones, and works without JavaScript", () => {
  const bar = renderSiteNav("/crime/rape");
  assert.equal(bar.split("<details").length, 2);
  assert.ok(bar.includes('class="dl-nav-sum-narrow">Menu<'));
  assert.ok(bar.includes('id="dl-nav-q"') && bar.includes('id="dl-nav-q2"'));
  assert.ok(bar.includes('<a class="dl-nav-link" href="/crime" aria-current="page">Crime</a>'));
  assert.ok(bar.includes('href="/search"'));
});

test("every dataset is reachable from the menu and the footer", () => {
  const bar = renderSiteNav("/");
  const foot = renderSiteFooter();
  for (const item of SITE_NAV.flatMap((g) => g.items)) {
    assert.ok(bar.includes(`href="${item.href}"`), item.href);
    assert.ok(foot.includes(`href="${item.href}"`), item.href);
  }
  assert.ok(foot.includes("not zero"));
});
