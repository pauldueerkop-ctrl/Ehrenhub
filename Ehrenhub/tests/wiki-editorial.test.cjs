const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {loadWiki}=require('../scripts/load-wiki.cjs');
const M=require('../src/features/wiki/model.js');
const C=require('../src/core.js');
const D=require('../src/content.js');
const {loadViews,makeState}=require('./helpers.cjs');
const copy=x=>JSON.parse(JSON.stringify(x));
const demos=D.articles.filter(a=>a.id.startsWith('demo-'));
const blocks=demos.flatMap(a=>a.sections.flatMap(s=>(s.blocks||[]).map(b=>({a,s,b}))));
const block=type=>copy(blocks.find(x=>x.b.type===type).b);
const validation=import('../scripts/validate-content.mjs');
async function errors(change){const d=copy(D);change(d);return (await validation).validateContent(d).join('\n');}
function fixture(t){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ehrenhub-wiki-test-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  return {dir,write(name,value){const file=path.join(dir,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'?value:JSON.stringify(value));}};
}

test('editorial loader finds nested articles, ignores template/drafts, preserves order',t=>{
  const f=fixture(t);
  f.write('thema/tief/neuer-artikel.json',{id:'neuer-artikel',status:'example'});
  f.write('anderes/bestehend.json',{id:'bestehend',status:'published'});
  f.write('entwurf.json',{status:'draft',title:'Unfertiger Entwurf'});
  f.write('ARTIKEL-VORLAGE.json','This template is deliberately ignored.');
  f.write('START-HIER.txt','Editor instructions');
  f.write('.versteckt/kaputt.json','ignored');
  const result=loadWiki(f.dir,['bestehend']);
  assert.deepEqual(result.articles.map(a=>a.id),['bestehend','neuer-artikel']);
  assert.equal(result.files['neuer-artikel'],'data/wiki/thema/tief/neuer-artikel.json');
});
test('editorial loader identifies malformed JSON with the exact file',t=>{
  const f=fixture(t);f.write('thema/problem.json','{"title": "Unfertig",}');
  assert.throws(()=>loadWiki(f.dir),/data\/wiki\/thema\/problem.json: JSON/);
});
test('editorial loader rejects duplicate IDs, wrong filenames and unknown status',t=>{
  const f=fixture(t);f.write('a/gemeinsam.json',{id:'gemeinsam'});f.write('b/gemeinsam.json',{id:'gemeinsam'});
  assert.throws(()=>loadWiki(f.dir),/doppelte ID "gemeinsam".*a\/gemeinsam.json/);
  fs.unlinkSync(path.join(f.dir,'b/gemeinsam.json'));
  f.write('falsch.json',{id:'richtig'});
  assert.throws(()=>loadWiki(f.dir),/Dateiname muss zur id passen/);
  f.write('falsch.json',{id:'falsch',status:'public'});
  assert.throws(()=>loadWiki(f.dir),/status muss/);
});
test('all six new block types occur in visible demo articles',()=>{
  assert.equal(demos.length,3);
  assert.deepEqual([...new Set(blocks.map(x=>x.b.type))].sort(),[...M.types].sort());
  assert.equal(D.articles.length,require('../data/wiki.json').order.length+3);
  assert.ok(D.articles.every(a=>a.status!=='draft'));
  assert.ok(!D.articles.some(a=>a.id==='mein-neuer-artikel'));
});
test('complete copyable article template is valid when activated',async()=>{
  const d=copy(D),template=copy(require('../data/wiki/ARTIKEL-VORLAGE.json'));
  template.status='example';d.articles.push(template);
  assert.deepEqual((await validation).validateContent(d),[]);
});
test('minimal copyable article in START-HIER is valid without programming edits',async()=>{
  const guide=fs.readFileSync(path.join(__dirname,'../data/wiki/START-HIER.txt'),'utf8');
  const part=guide.split('Als 03-veranstaltungen/material-checkliste.json speichern:')[1].split('ABSCHNITTE UND DIE BISHERIGEN BAUSTEINE')[0];
  const d=copy(D);d.articles.push(JSON.parse(part.trim()));
  assert.deepEqual((await validation).validateContent(d),[]);
});
test('invalid interactive content fails with a useful field path',async()=>{
  const mutations=[
    b=>b.type='unknown',
    b=>b.options.forEach(o=>o.result='reflect'),
    b=>b.options[0].result='correct',
    b=>b.options[0].label='',
    b=>b.typo='unexpected',
    b=>b.hubi={retry:false},
    b=>b.celebrate='false'
  ];
  for(const mutate of mutations){
    const message=await errors(d=>mutate(d.articles.find(a=>a.id==='demo-eventteam').sections[0].blocks[0]));
    assert.match(message,/data\/wiki\/demo-eventteam.json.sections\[0\].blocks\[0\]/);
  }
});
test('decision validation rejects cycles, missing targets and unreachable results',async()=>{
  for(const mutate of [b=>b.nodes[1].options[0].next=b.start,b=>b.nodes[0].options[0].next='missing',b=>b.nodes.push({id:'isoliert',title:'Ende',result:'Nicht erreichbar'})]){
    assert.match(await errors(d=>mutate(d.articles.find(a=>a.id==='demo-entscheidungsweg').sections[0].blocks[0])),/Kreis|Ziel|erreichbar/);
  }
});
test('validation catches incomplete solutions, duplicate checklist IDs and bad defaults',async()=>{
  assert.match(await errors(d=>d.articles.find(a=>a.id==='demo-entscheidungsweg').sections[1].blocks[0].solution=['sammeln']),/Zielreihenfolge/);
  assert.match(await errors(d=>{const a=d.articles.find(a=>a.id==='demo-perspektiven');const s=a.sections.find(s=>s.checklist);s.checklist.push(copy(s.checklist[0]));}),/Punkt-ID/);
  assert.match(await errors(d=>d.hubi.pet=[]),/mindestens einen Satz/);
  assert.match(await errors(d=>d.hubi.pages.sos='Nicht erlaubt'),/nicht vorgesehen/);
});
test('scenario explains each choice, supports retry/reset and never mutates content',()=>{
  const b=block('scenario'),original=copy(b);
  let s=M.initial(b);assert.equal(M.transition(b,s,'choose',b.options[0].id).started,false);
  s=M.transition(b,s,'start');assert.equal(s.event,'start');
  const reflect=b.options.find(o=>o.result==='reflect'),success=b.options.find(o=>o.result==='success');
  const previous=copy(s);s=M.transition(b,s,'choose',reflect.id);
  assert.equal(s.done,false);assert.equal(s.event,'retry');assert.equal(s.feedback,reflect.feedback);
  assert.deepEqual(previous,M.transition(b,null,'start'));
  s=M.transition(b,s,'choose',success.id);assert.equal(s.done,true);assert.equal(s.event,'success');
  assert.deepEqual(M.transition(b,s,'reset'),M.initial(b));assert.deepEqual(b,original);
});
test('detective counts each actual issue only once, with contextual explanations',()=>{
  const b=block('detective');let s=M.transition(b,null,'start');
  s=M.transition(b,s,'inspect',b.items.find(x=>!x.issue).id);
  assert.equal(s.event,'retry');assert.equal(s.selected.length,0);
  const issues=b.items.filter(x=>x.issue);
  s=M.transition(b,s,'inspect',issues[0].id);s=M.transition(b,s,'inspect',issues[0].id);
  assert.equal(s.selected.length,1);
  for(const x of issues.slice(1))s=M.transition(b,s,'inspect',x.id);
  assert.equal(s.event,'complete');assert.equal(s.done,true);assert.equal(s.selected.length,issues.length);
});
test('comparison and perspectives switch safely without grading readers',()=>{
  for(const type of ['comparison','perspectives']){
    const b=block(type);let s=M.transition(b,null,'switch','1');
    assert.equal(s.choice,1);assert.equal(s.event,'change');assert.equal(s.done,false);
    assert.equal(M.transition(b,s,'switch','-1').choice,1);
    assert.equal(M.transition(b,s,'switch','999').choice,1);
    assert.equal(M.transition(b,s,'switch','garbage').choice,1);
    assert.equal(M.transition(b,s,'switch','0').choice,0);
  }
});
test('every decision path reaches a result and back/reset preserve its history',()=>{
  const b=block('decision');
  function explore(s){
    const n=b.nodes.find(x=>x.id===s.node);
    if(n.result){assert.equal(s.done,true);assert.equal(s.event,'complete');return;}
    for(const o of n.options){
      const next=M.transition(b,s,'answer',o.id);assert.equal(next.node,o.next);
      const back=M.transition(b,next,'back');assert.equal(back.node,s.node);assert.equal(back.done,false);
      explore(next);
    }
  }
  explore(M.transition(b,null,'start'));
  assert.deepEqual(M.transition(b,M.transition(b,null,'start'),'reset'),M.initial(b));
});
test('challenge is operable with arrows, bounds-safe, checkable and repeatable',()=>{
  const b=block('challenge');let s=M.transition(b,null,'start');
  assert.equal(M.transition(b,s,'check').event,'retry');
  const first=s.order[0];assert.deepEqual(M.transition(b,s,'up',first).order,s.order);
  assert.deepEqual(M.transition(b,s,'down',s.order.at(-1)).order,s.order);
  for(let i=0;i<b.solution.length;i++)while(s.order.indexOf(b.solution[i])>i)s=M.transition(b,s,'up',b.solution[i]);
  s=M.transition(b,s,'check');assert.equal(s.done,true);assert.equal(s.feedback,b.success);
  assert.equal(s.event,'complete');
  s=M.transition(b,s,'down',s.order[0]);assert.equal(s.done,false);assert.equal(s.feedback,'');
});
test('Hubi messages prefer block context, then article, then general fallback',()=>{
  const a={hubi:{success:'Artikel'}},b={hubi:{success:'Baustein'}},defaults={success:'Allgemein'};
  assert.equal(M.message(a,b,'success',defaults),'Baustein');
  assert.equal(M.message(a,{},'success',defaults),'Artikel');
  assert.equal(M.message({},null,'success',defaults),'Allgemein');
  assert.equal(M.message({},null,'unknown',defaults),'');
});
test('checklist IDs remain stable across reordering; legacy numeric keys stay intact',()=>{
  const a={id:'test'},s={id:'abschnitt'},item={id:'raum',text:'Raum'};
  assert.equal(C.checklistKey(a,s,0,item,0),'test:abschnitt:raum');
  assert.equal(C.checklistKey(a,s,7,item,5),'test:abschnitt:raum');
  assert.equal(C.checklistKey(a,{},0,'Alter Punkt',1),'test:0:1');
});
test('new block text and decision results are searchable, but Hubi/internal IDs are not',()=>{
  const d=copy(D),a=d.articles.find(a=>a.id==='demo-entscheidungsweg');
  a.sections[0].blocks[0].nodes.find(n=>n.result).result+=' SUCHBARESERGEBNIS';
  a.hubi.intro='VERBORGENERSUCHTEXT';
  assert.ok(C.filterArticles(d.articles,{q:'SUCHBARESERGEBNIS'}).some(x=>x.id===a.id));
  assert.ok(C.search(C.makeSearchIndex(d),'SUCHBARESERGEBNIS').some(x=>x.key==='wiki:'+a.id));
  assert.equal(C.filterArticles(d.articles,{q:'VERBORGENERSUCHTEXT'}).length,0);
  assert.ok(!C.articleText(a).includes('planungspfad'));
});
test('all block states render without executable user text or missing values',()=>{
  const {WikiBlockView:V}=loadViews();
  for(const {a,s,b} of blocks){
    const injected=copy(b);injected.title='<img src=x onerror=alert(1)>';injected.prompt='<script>alert(1)</script>';
    for(const state of [M.initial(b),M.transition(b,null,'start')]){
      const html=V.render(a,s.id,injected,state);
      assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img'));assert.ok(!html.includes('<script>'));
      assert.ok(!html.includes('undefined'));assert.ok(html.includes('aria-live="polite"'));
    }
  }
});
test('published article credits and stable checklist controls render in existing article layout',()=>{
  const d=copy(D),a=d.articles.find(a=>a.id==='demo-perspektiven');
  a.status='published';a.author='Redaktion Ehrenhub';a.reviewed='22.10.2026';
  const {Views}=loadViews(d);const html=Views.main(C.parseRoute('#/wiki/'+a.id),makeState(),C.makeSearchIndex(d));
  assert.match(html,/Redaktion Ehrenhub/);assert.match(html,/22.10.2026/);
  assert.ok(!html.includes('Beispielartikel'));assert.ok(html.includes('data-progress-section="nachrichtencheck"'));
  assert.ok(html.includes('demo-perspektiven:nachrichtencheck:zeit'));
});
test('controller state resets without touching storage or the shift planner',()=>{
  const {WikiBlockController}=loadViews();const controller=WikiBlockController.create({react(){}});
  controller.states.test={started:true};controller.reset();
  assert.equal(Object.keys(controller.states).length,0);
  const code=fs.readFileSync(path.join(__dirname,'../src/features/wiki/controller.js'),'utf8');
  assert.ok(!/localStorage|fetch\(|XMLHttpRequest/.test(code));
});
