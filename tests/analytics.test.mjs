import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const original = readFileSync(new URL('../public/analytics.js', import.meta.url), 'utf8');
const source = original.replace(/const MEASUREMENT_ID = '[^']*';/, "const MEASUREMENT_ID = 'G-TEST123456';");
const HOST = 'datalibertarian.in';
const HOME = 'https://' + HOST;
function fixture({url=HOME+'/', consent=null, gpc=false, dnt=null, storageFails=false}={}) {
  const listeners = {};
  const nodes = [];
  let focused;
  function element(tagName) {
    const el={tagName,children:[],hidden:false,style:{},listeners:{},appendChild(child){this.children.push(child);return child;},setAttribute(k,v){this[k]=v;},addEventListener(k,v){this.listeners[k]=v;},focus(){focused=this;},querySelector(){return this.children.find(n=>n.tagName==='button');}};
    nodes.push(el); return el;
  }
  const state = new Map(consent ? [['analytics-consent-v1',consent]] : []);
  const document = {readyState:'complete',title:'PRIVATE PERSON CASE NUMBER',referrer:'https://source.test/private-person?q=secret#identity',cookie:'_ga=old; _ga_TEST123456=old; application=keep',head:element('head'),body:element('body'),createElement:element,addEventListener(k,v){listeners[k]=v;}};
  const location = new URL(url);
  const context = {document,location,navigator:{globalPrivacyControl:gpc,doNotTrack:dnt},localStorage:{getItem(k){if(storageFails) throw Error('blocked');return state.get(k)||null;},setItem(k,v){if(storageFails) throw Error('blocked');state.set(k,v);}},addEventListener(k,v){listeners[k]=v;},history:{},URL};
  context.window=context;
  for(const method of ['pushState','replaceState']) context.history[method]=(_s,_t,path)=>{location.href=new URL(path,location).href;};
  vm.createContext(context);
  vm.runInContext(source,context);
  const click = label => {const el=nodes.find(n=>n.textContent===label);assert.ok(el, label);el.listeners.click();};
  const events = () => (context.dataLayer||[]).map(a=>Array.from(a)).filter(a=>a[0]==='event');
  const tags = () => document.head.children.filter(n=>n.tagName==='script');
  return {context,document,location,listeners,nodes,state,click,events,tags,get focused(){return focused;},rerun(){vm.runInContext(source,context);}};
}
test('no tag, storage, or events before explicit opt-in; rejection stays off',()=>{
  const f=fixture();assert.equal(f.tags().length,0);assert.equal(f.context.dataLayer,undefined);assert.equal(f.state.size,0);
  f.click('No thanks');assert.equal(f.tags().length,0);assert.equal(f.state.get('analytics-consent-v1'),'denied');
});
test('opt-in sends one sanitized pageview with safe defaults and no ads',()=>{
  const f=fixture({url:HOME+'/babuwatch/incident/case-number?q=private-person&utm_campaign=secret#complainant'});f.click('Allow analytics');
  assert.equal(f.tags().length,1);assert.equal(f.tags()[0].referrerPolicy,'no-referrer');assert.equal(f.events().length,1);
  const event=JSON.parse(JSON.stringify(f.events()[0][2]));
  assert.equal(event.page_location,HOME+'/babuwatch');assert.equal(event.page_referrer,'');
  assert.ok(!/PRIVATE|private-person|complainant|secret|case-number/.test(JSON.stringify(f.context.dataLayer)));
  const config=Array.from(f.context.dataLayer).map(a=>Array.from(a)).find(a=>a[0]==='config')[2];
  assert.equal(config.send_page_view,false);assert.equal(config.allow_google_signals,false);assert.equal(config.allow_ad_personalization_signals,false);
  f.click('Allow analytics');f.rerun();assert.equal(f.tags().length,1);assert.equal(f.events().length,1);
});
test('saved consent works and saved denial does not initialize Google',()=>{
  assert.equal(fixture({consent:'granted'}).events().length,1);assert.equal(fixture({consent:'denied'}).tags().length,0);
});
test('GPC, DNT, development, preview, lookalike hosts, and insecure transport never initialize',()=>{
  for(const options of [{gpc:true},{dnt:'1'},{url:'http://'+HOST+'/'},{url:'https://preview.vercel.app/'},{url:'http://localhost:4173/'},{url:HOME+'.attacker.test/'}]){
    const f=fixture({...options,consent:'granted'});assert.equal(f.tags().length,0);assert.equal(f.context.dataLayer,undefined);assert.equal(f.document.body.children.length,0);
  }
});
test('blocked storage defaults off but permits explicit per-document consent',()=>{
  const f=fixture({storageFails:true});assert.equal(f.tags().length,0);f.click('Allow analytics');assert.equal(f.events().length,1);
});
test('query/hash changes do not create pageviews; SPA navigation and back do',()=>{
  const f=fixture({consent:'granted'});f.context.history.replaceState(null,'','/?q=secret#secret');assert.equal(f.events().length,1);
  f.context.history.pushState(null,'','/babuwatch/incident/case-number?q=person');assert.equal(f.events().length,2);
  assert.equal(f.events()[1][2].page_location,HOME+'/babuwatch');
  f.context.history.pushState(null,'','/babuwatch/incident/case-number-other');assert.equal(f.events().length,3);
  f.location.pathname='/';f.listeners.popstate();assert.equal(f.events().length,4);
});
test('private routes are excluded before opt-in and after SPA navigation',()=>{
  const f=fixture({url:HOME+'/admin/private-person',consent:'granted'});assert.equal(f.tags().length,0);
  f.context.history.pushState(null,'','/');assert.equal(f.events().length,1);
  f.context.history.pushState(null,'','/account/private-person');assert.equal(f.events().length,1);
  assert.equal(f.context['ga-disable-G-TEST123456'],true);
  assert.ok(!JSON.stringify(f.context.dataLayer).includes('private-person'));
});
test('withdrawal blocks later pageviews, clears only GA cookies, and keeps choices reachable',()=>{
  const f=fixture({consent:'granted'});f.click('Analytics choices');f.click('No thanks');
  assert.equal(f.context['ga-disable-G-TEST123456'],true);f.context.history.pushState(null,'','/babuwatch/incident/case-number');assert.equal(f.events().length,1);
  assert.equal(f.state.get('analytics-consent-v1'),'denied');assert.equal(f.focused.textContent,'Analytics choices');
  assert.match(f.document.cookie,/_ga_TEST123456=; Max-Age=0/);
});
test('cross-tab withdrawal immediately blocks this document',()=>{
  const f=fixture({consent:'granted'});f.listeners.storage({key:'analytics-consent-v1',newValue:'denied'});
  f.context.history.pushState(null,'','/babuwatch/incident/case-number');assert.equal(f.events().length,1);assert.equal(f.context['ga-disable-G-TEST123456'],true);
});
test('unknown routes use static safe Other group, never a raw path/title',()=>{
  const f=fixture({url:HOME+'/unknown/private-person',consent:'granted'});assert.equal(f.events()[0][2].page_location,HOME+'/other');assert.ok(!JSON.stringify(f.context.dataLayer).includes('private-person'));
});

import {mkdtemp, mkdir, writeFile, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {injectAnalytics} from '../scripts/inject-analytics.mjs';
test('last-step injector covers every final HTML, preserves content, and is idempotent',async()=>{
  const root=await mkdtemp(join(tmpdir(),'analytics-inject-'));
  try {
    await mkdir(join(root,'nested'),{recursive:true});
    for(const name of ['index.html','404.html','nested/case.html']) await writeFile(join(root,name),'<html><HEAD><title>Keep title</title></HEAD><body>Keep data</body></html>');
    await writeFile(join(root,'data.json'),'{"untouched":true}');
    assert.equal(await injectAnalytics(root),3);assert.equal(await injectAnalytics(root),0);
    for(const name of ['index.html','404.html','nested/case.html']){
      const html=await readFile(join(root,name),'utf8');assert.equal((html.match(/src="\/analytics.js"/g)||[]).length,1);assert.ok(html.includes('<title>Keep title</title>'));assert.ok(html.includes('Keep data'));
    }
    assert.equal(await readFile(join(root,'data.json'),'utf8'),'{"untouched":true}');
  } finally {await rm(root,{recursive:true,force:true});}
});
test('package build injects analytics only after final navigation pass',()=>{
  const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));assert.ok(pkg.scripts.build.endsWith('npm run build:sitenav && npm run build:analytics'));
});

test('re-grant after withdrawal restores analytics consent before the next pageview',()=>{
  for (const crossTab of [false,true]) {
    const f=fixture({consent:'granted'});f.click('No thanks');
    if(crossTab) f.listeners.storage({key:'analytics-consent-v1',newValue:'granted'});
    else f.click('Allow analytics');
    const queue=Array.from(f.context.dataLayer).map(a=>Array.from(a));
    const updates=queue.filter(a=>a[0]==='consent' && a[1]==='update');
    assert.equal(updates.at(-1)[2].analytics_storage,'granted');
    assert.equal(f.context['ga-disable-G-TEST123456'],false);
    assert.equal(f.events().length,2);assert.equal(f.tags().length,1);
    assert.ok(queue.lastIndexOf(updates.at(-1))<queue.findLastIndex(a=>a[0]==='event'));
  }
});

test('privacy signal activated after load disables the existing tag on detection',()=>{
  const f=fixture({consent:'granted'});f.context.navigator.globalPrivacyControl=true;
  f.context.history.pushState(null,'','/');
  assert.equal(f.context['ga-disable-G-TEST123456'],true);assert.equal(f.events().length,1);
  const updates=Array.from(f.context.dataLayer).map(a=>Array.from(a)).filter(a=>a[0]==='consent' && a[1]==='update');
  assert.equal(updates.at(-1)[2].analytics_storage,'denied');
});

test('production loader uses the verified DataLib stream, not a placeholder',()=>{
  assert.ok(original.includes("const MEASUREMENT_ID = 'G-220Z1XVVXL';"));
});
