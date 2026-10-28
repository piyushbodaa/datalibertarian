/* Basic, opt-in GA4 pageviews only. Never pass the actual URL or page title. */
(function () {
  'use strict';
  const MEASUREMENT_ID = 'G-220Z1XVVXL';
  const HOSTS = ["datalibertarian.in", "www.datalibertarian.in"];
  const ORIGIN = "https://datalibertarian.in";
  const SITE = "Data Libertarian";
  const KEY = 'analytics-consent-v1';
  if (!HOSTS.includes(location.hostname) || location.protocol !== 'https:' ||
      !/^G-[A-Z0-9]{10}$/.test(MEASUREMENT_ID) || window.__privatePageviews) return;
  window.__privatePageviews = true;
  const privacySignal = () => navigator.globalPrivacyControl === true ||
    navigator.doNotTrack === '1' || window.doNotTrack === '1';
  if (privacySignal()) return;
  let choice = null;
  try { choice = localStorage.getItem(KEY); } catch (_) { /* Default: no consent. */ }
  let loaded = false;
  let lastPath = null;
  let panel;
  let choicesButton;
  function safePage() {
    let path = location.pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/+$/, '') || '/';
    if (/^\/(admin|api|account|login|corrections)(\/|$)/.test(path)) return null;
    const groups = {babuwatch: 'Accountability', copwatchindia: 'Accountability', crime: 'Crime statistics', education: 'Education', inflation: 'Inflation', police: 'Police spending', states: 'States', state: 'States', union: 'Union spending', municipal: 'Municipal spending', gram: 'Village spending', health: 'Health spending', compare: 'Comparison', search: 'Search', sources: 'Sources', latest: 'Latest', changes: 'Changes', victimlesscrimes: 'Victimless crimes', civilliberties: 'Civil liberties', economicfreedom: 'Economic freedom', psu: 'Public enterprises'};
    if (path === '/') return ['/', 'Home'];
    const section = path.split('/')[1];
    return Object.prototype.hasOwnProperty.call(groups, section) ? ['/' + section, groups[section]] : ['/other', 'Other public page'];
  }
  function fields(page) {
    return {page_location: ORIGIN + page[0], page_title: SITE + ' — ' + page[1], page_referrer: ''};
  }
  function gtag() { window.dataLayer.push(arguments); }
  function clearCookies() {
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.split('=')[0].trim();
      if (name !== '_ga' && name !== '_ga_' + MEASUREMENT_ID.slice(2)) continue;
      for (const domain of ['', ...HOSTS, ...HOSTS.map(host => '.' + host)]) {
        document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax; Secure' + (domain ? '; domain=' + domain : '');
      }
    }
  }
  function trackPage() {
    if (privacySignal()) {
      window['ga-disable-' + MEASUREMENT_ID] = true;
      if (loaded) gtag('consent', 'update', {analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
      lastPath = null;
      clearCookies();
      return;
    }
    if (choice !== 'granted') return;
    const page = safePage();
    window['ga-disable-' + MEASUREMENT_ID] = !page;
    if (!page) {
      if (loaded) gtag('set', fields(['/untracked', 'Untracked page']));
      lastPath = null;
      return;
    }
    const safe = fields(page);
    if (!loaded) {
      loaded = true;
      window.dataLayer = window.dataLayer || [];
      window.gtag = gtag;
      gtag('consent', 'default', {analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
      gtag('set', {allow_google_signals: false, allow_ad_personalization_signals: false, ads_data_redaction: true, url_passthrough: false, ...safe});
      gtag('consent', 'update', {analytics_storage: 'granted'});
      gtag('js', new Date());
      gtag('config', MEASUREMENT_ID, {send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, cookie_domain: location.hostname, cookie_flags: 'SameSite=Lax;Secure', ...safe});
      const script = document.createElement('script');
      script.async = true;
      script.referrerPolicy = 'no-referrer';
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
      document.head.appendChild(script);
    }
    // Update defaults even when query-only navigation is not counted.
    gtag('set', safe);
    if (lastPath === location.pathname) return;
    lastPath = location.pathname; // Kept locally for deduplication; never transmitted.
    gtag('event', 'page_view', {send_to: MEASUREMENT_ID, ...safe});
  }
  function select(value, interactive = true) {
    choice = value;
    if (interactive) {
      try { localStorage.setItem(KEY, value); } catch (_) { /* Current document only. */ }
    }
    panel.hidden = true;
    choicesButton.hidden = false;
    if (interactive) choicesButton.focus();
    if (value === 'granted' && !privacySignal()) {
      if (loaded) gtag('consent', 'update', {analytics_storage: 'granted'});
      trackPage();
    }
    else {
      window['ga-disable-' + MEASUREMENT_ID] = true;
      if (loaded) gtag('consent', 'update', {analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
      lastPath = null;
      clearCookies();
    }
  }
  function button(label, action) {
    const el = document.createElement('button');
    el.type = 'button';
    el.textContent = label;
    el.addEventListener('click', action);
    return el;
  }
  function mount() {
    const controls = document.createElement('aside');
    controls.id = 'analytics-choices';
    controls.setAttribute('aria-label', 'Optional analytics');
    panel = document.createElement('div');
    panel.className = 'analytics-panel';
    panel.hidden = choice === 'granted' || choice === 'denied';
    const text = document.createElement('p');
    text.textContent = 'Allow optional Google Analytics cookies to measure visits to broad page sections? Only broad page sections are measured, not case identifiers, search text or form entries. Google receives a cookie-based browser identifier and basic browser/device information. No advertising features. You can change this choice at any time.';
    panel.appendChild(text);
    const privacy = document.createElement('a');
    privacy.href = 'https://policies.google.com/privacy';
    privacy.textContent = 'Google privacy policy';
    privacy.rel = 'noopener noreferrer';
    panel.appendChild(privacy);
    panel.appendChild(button('Allow analytics', () => select('granted')));
    panel.appendChild(button('No thanks', () => select('denied')));
    choicesButton = button('Analytics choices', () => {
      panel.hidden = false;
      choicesButton.hidden = true;
      panel.querySelector('button').focus();
    });
    choicesButton.hidden = !panel.hidden;
    controls.appendChild(panel);
    controls.appendChild(choicesButton);
    document.body.appendChild(controls);
    trackPage();
  }
  for (const method of ['pushState', 'replaceState']) {
    const original = history[method];
    history[method] = function () {
      const result = original.apply(this, arguments);
      trackPage();
      return result;
    };
  }
  window.addEventListener('popstate', trackPage);
  window.addEventListener('storage', event => {
    if (event.key === KEY || event.key === null) select(event.newValue === 'granted' ? 'granted' : 'denied', false);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once: true});
  else mount();
}());
