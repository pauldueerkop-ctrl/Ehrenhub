const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../src/core.js');
const D=require('../src/content.js');
const index=C.makeSearchIndex(D);

test('empty and direct deep-link routes are parsed correctly',()=>{
  assert.equal(C.parseRoute('').page,'home');
  const r=C.parseRoute('#/wiki/erste-gruppenstunde?q=gr%C3%BCn');
  assert.equal(r.page,'wiki');assert.equal(r.id,'erste-gruppenstunde');assert.equal(r.query.get('q'),'grün');
  assert.equal(C.parseRoute('#/wiki/%invalid').page,'404');
  assert.equal(C.parseRoute('#/unknown').page,'404');
  assert.equal(C.parseRoute('#/wiki/a/b').page,'404');
});
test('catalogue has unique IDs and resolvable relations and sources',()=>{
  assert.equal(new Set(index.map(x=>x.key)).size,index.length);
  for(const article of D.articles){
    assert.ok(D.categories.some(c=>c.id===article.category));
    for(const id of article.related)assert.ok(D.articles.some(a=>a.id===id));
    if(article.source)assert.ok(D.sources[article.source]);
  }
  for(const c of [...D.courses,...D.grants])assert.ok(D.sources[c.source]);
  for(const source of Object.values(D.sources))assert.equal(new URL(source.url).protocol,'https:');
});
test('search finds terms with umlauts, ASCII alternatives, punctuation and any case',()=>{
  assert.ok(C.search(index,'jUlEiCa').some(x=>x.key==='wiki:juleica'));
  assert.ok(C.search(index,'FÖRDERUNG').some(x=>x.kind==='antrag'));
  assert.deepEqual(C.search(index,'foerderung').map(x=>x.key),C.search(index,'Förderung').map(x=>x.key));
  assert.ok(C.search(index,'Erste-Hilfe-Kurs').some(x=>x.key==='kurs:erste-hilfe'));
  assert.equal(C.search(index,'ZZZ-no-such-content').length,0);
});
test('search combines words, ranks title matches and respects type filters',()=>{
  assert.equal(C.search(index,'erste gruppenstunde')[0].key,'wiki:erste-gruppenstunde');
  assert.ok(C.search(index,'KjG Kurswoche').some(x=>x.kind==='kurs'));
  assert.ok(C.search(index,'','sos').every(x=>x.kind==='sos'));
  assert.ok(C.search(index,'Juleica','wiki').every(x=>x.kind==='wiki'));
  assert.equal(C.search(index,'', 'antrag').length,8);
});
test('wiki topic and full-text search can be combined and reset',()=>{
  assert.equal(C.filterArticles(D.articles,{category:'finanzen'}).length,3);
  assert.equal(C.filterArticles(D.articles,{category:'finanzen',q:'Kostenplan'}).length,1);
  assert.equal(C.filterArticles(D.articles,{category:'schutz',q:'Zuschuss'}).length,0);
  assert.equal(C.filterArticles(D.articles,{category:'alle',q:''}).length,12);
});
test('course filters combine without mutating source data',()=>{
  const before=JSON.stringify(D.courses);
  const onlinePSG=C.filterCourses(D.courses,{topic:'praevention',format:'online',duration:'tag'});
  assert.deepEqual(onlinePSG.map(c=>c.id),['psg-vertiefung']);
  const weeks=C.filterCourses(D.courses,{duration:'woche'});
  assert.deepEqual(weeks.map(c=>c.id),['kjg-kurswoche']);
  assert.equal(C.filterCourses(D.courses,{topic:'erstehilfe',format:'online'}).length,0);
  assert.equal(C.filterCourses(D.courses,{q:'BRK'}).length,1);
  const sorted=C.filterCourses(D.courses,{});
  assert.equal(sorted[0].id,'bdkj-praevention');
  assert.equal(JSON.stringify(D.courses),before);
});
test('every supported grant path returns only the matching region and project',()=>{
  for(const region of Object.keys(C.regions))for(const project of Object.keys(C.projectTypes))for(const stage of Object.keys(C.stages)){
    const results=C.matchGrants(D.grants,{region,project,stage});
    assert.equal(results.length,1,`${region}/${project}/${stage}`);
    assert.equal(results[0].region,region);assert.ok(results[0].projects.includes(project));
  }
  assert.equal(C.matchGrants(D.grants,{region:'stadt',project:'freizeit',stage:''}).length,0);
  assert.equal(C.matchGrants(D.grants,{region:'unknown',project:'freizeit',stage:'planung'}).length,0);
  assert.equal(C.matchGrants(D.grants,{region:'stadt',project:'other',stage:'planung'}).length,0);
});
test('stored bookmarks recover from malformed, stale and malicious data',()=>{
  assert.deepEqual(C.readBookmarks('{broken',index),[]);
  assert.deepEqual(C.readBookmarks('{"key":"wiki:juleica"}',index),[]);
  assert.deepEqual(C.readBookmarks('["wiki:juleica","wiki:juleica","unknown","sos",null,4]',index),['wiki:juleica']);
  const selected=C.toggleBookmark([],'wiki:juleica');
  assert.deepEqual(selected,['wiki:juleica']);assert.deepEqual(C.toggleBookmark(selected,'wiki:juleica'),[]);
  assert.deepEqual(selected,['wiki:juleica']);
});
test('HTML text and attribute escaping prevents query injection',()=>{
  assert.equal(C.escapeHTML('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  assert.equal(C.escapeHTML("'&"),'&#39;&amp;');
});
test('demo dates are valid independent of current date or timezone',()=>{
  for(const c of D.courses){const d=C.dateParts(c.date);assert.ok(!d.full.includes('Invalid'));assert.match(d.day,/^\d{2}$/);}
  assert.equal(C.dateParts('2026-11-28').day,'28');
});
