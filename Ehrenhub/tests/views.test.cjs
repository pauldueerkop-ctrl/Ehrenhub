const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const C=require('../src/core.js');const D=require('../src/content.js');
const {loadViews,makeState}=require('./helpers.cjs');
const V=loadViews().Views;const index=C.makeSearchIndex(D);
const render=(hash,state=makeState())=>V.main(C.parseRoute(hash),state,index);
const routes=['#/','#/wiki','#/antraege','#/fortbildungen','#/sos','#/merkliste','#/suche?q=Juleica',
  ...D.articles.map(a=>'#/wiki/'+a.id),...D.courses.map(c=>'#/fortbildungen/'+c.id),...D.grants.map(g=>'#/antraege/'+g.id),
  '#/antraege?region=stadt&project=freizeit&stage=planung','#/antraege?region=land&project=bildung&stage=abgeschlossen'];
test('every route renders exactly one main heading without undefined data',()=>{
  for(const route of routes){const html=render(route);assert.equal((html.match(/<h1\b/g)||[]).length,1,route);assert.ok(!html.includes('undefined'),route);assert.ok(!html.includes('[object Object]'),route);}
});
test('all internal content links target a rendered route',()=>{
  const collected=new Set();
  for(const route of routes){const html=render(route)+V.header(C.parseRoute(route),makeState())+V.footer();for(const m of html.matchAll(/href="(#\/[^"<>]*)"/g))collected.add(m[1].replace(/&amp;/g,'&'));}
  for(const href of collected)assert.ok(!render(href).includes('class="not-found'),href);
  assert.ok(collected.size>35);
});
test('user-provided search input never becomes executable markup',()=>{
  const query='<svg onload="alert(1)">';
  for(const base of ['suche','wiki','fortbildungen']){const html=render('#/'+base+'?q='+encodeURIComponent(query));assert.ok(!html.includes('<svg onload='));assert.ok(html.includes('&lt;svg'))}
});
test('wizard has three functional states with selection retained on back',()=>{
  const s=makeState();assert.match(V.grantWizard(s),/id="wizard-next"[^>]*disabled/);
  s.grantAnswers.region='land';assert.ok(!V.grantWizard(s).match(/id="wizard-next"[^>]*disabled/));
  s.wizardStep=1;assert.equal((V.grantWizard(s).match(/type="radio"/g)||[]).length,4);
  s.grantAnswers.project='freizeit';s.wizardStep=2;assert.equal((V.grantWizard(s).match(/type="radio"/g)||[]).length,3);
  s.wizardStep=0;assert.match(V.grantWizard(s),/value="land"[^>]*checked/);
});
test('grant stage changes the next-step message without inventing an entitlement',()=>{
  assert.match(render('#/antraege?region=stadt&project=freizeit&stage=planung'),/vor dem Start/);
  assert.match(render('#/antraege?region=land&project=aktion&stage=gestartet'),/läuft schon/);
  assert.match(render('#/antraege?region=stadt&project=bildung&stage=abgeschlossen'),/nachträgliche/);
  assert.match(render('#/antraege?region=invalid&project=freizeit&stage=planung'),/Schritt 1 von 3/);
});
test('bookmarks, checklists and local feedback render their stored state',()=>{
  const s=makeState();s.bookmarks=['wiki:erste-gruppenstunde','kurs:erste-hilfe'];s.checks['erste-gruppenstunde:2:0']=true;s.feedback['erste-gruppenstunde']='yes';
  const article=render('#/wiki/erste-gruppenstunde',s);
  assert.match(article,/data-check="erste-gruppenstunde:2:0" checked/);
  assert.match(article,/data-feedback="yes" data-article="erste-gruppenstunde" aria-pressed="true"/);
  assert.match(article,/class="button secondary bookmark-full is-saved"/);
  const saved=render('#/merkliste',s);assert.match(saved,/2<\/strong> gemerkte Inhalte/);assert.match(saved,/Erste Hilfe für deinen Ehrenamtsalltag/);
  assert.match(render('#/merkliste'),/Hier ist Platz für gute Fundstücke/);
});
test('PSG/SOS offers real links and no personal-data input field',()=>{
  const html=render('#/sos');assert.ok(!/<input|<textarea/.test(html));assert.match(html,/href="tel:110"/);assert.match(html,/href="tel:112"/);assert.ok(html.includes(D.sources.help.url));
  for(const tab of ['sorge','anvertraut','selbst']){const s=makeState();s.sosTab=tab;const page=render('#/sos',s);assert.ok(page.includes('aria-labelledby="sos-tab-'+tab+'"'));}
});
test('unknown or malformed routes return a friendly empty view',()=>{
  for(const route of ['#/missing','#/wiki/missing','#/fortbildungen/missing','#/wiki/%bad','#/sos/missing'])assert.match(render(route),/Hier geht es/);
});
test('all rendered action buttons have a controller implementation',()=>{
  let html=routes.map(r=>render(r)+V.header(C.parseRoute(r),makeState())).join('')+V.footer()+V.hubi();
  for(const type of ['about','privacy','clear-saved','reset-confirm'])html+=V.modalContent(type,makeState());
  const controller=fs.readFileSync(path.join(__dirname,'../src/app.js'),'utf8');
  for(const match of html.matchAll(/data-action="([a-z-]+)"/g)){
    const name=match[1];assert.ok(controller.includes("'"+name+"':")||controller.includes(name+':')||name==='pet',name);
  }
});
test('built standalone page contains all modules and no external runtime assets',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../Ehrenhub.html'),'utf8');
  assert.ok(!html.includes('/*__APP__*/'));assert.ok(!html.includes('/*__STYLE__*/'));
  assert.ok(!/<script[^>]+src=|<link[^>]+href="https:|@import\s|url\(https:/i.test(html));
  assert.match(html,/lang="de"/);assert.match(html,/prefers-reduced-motion/);
});
