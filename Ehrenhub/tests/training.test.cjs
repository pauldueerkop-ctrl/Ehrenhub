'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const D=require('../src/content.js'),C=require('../src/core.js'),M=require('../src/features/fortbildungen/model.js');
const {loadCourses}=require('../scripts/load-courses.cjs'),{validateTraining}=require('../scripts/validate-training.cjs');
const {loadViews,makeState}=require('./helpers.cjs');
const now='2026-10-29',c=D.courses[0],p=()=>({...M.defaults,goal:'start'});
const errors=d=>{const e=[];validateTraining(d,(p,m)=>e.push(p+': '+m));return e;};
test('training: only verified courses are published, original links and unknown evidence preserved',()=>{
  assert.equal(D.courses.length,5);assert.equal(D.courses.filter(c=>c.providerId==='brk').length,4);
  for(const c of D.courses){assert.equal(c.checkedAt,now);assert.equal(c.booking,'unknown');assert.equal(c.recognition.hours,null);assert.equal(c.recognition.teachingUnits,null);assert.match(c.url,/^https:\/\//);}
  const k=D.courses.find(c=>c.providerId==='kjg');assert.equal(k.date,'2026-11-18');assert.equal(k.deadline,'2026-11-10');assert.equal(k.levelCode,'advanced');assert.equal(k.recognition.renewal,'provider');assert.equal(k.price.amount,5);
  assert.equal(D.courses.filter(c=>c.topic==='leitung').length,0);assert.deepEqual(errors(D),[]);
});
test('training: strict dates and inclusive deadlines, closed, started, past and cancelled states',()=>{
  assert.ok(Number.isNaN(M.day('2026-02-30')));assert.ok(Number.isNaN(M.day('2026-1-1')));
  const x={...c,date:'2026-11-18',endDate:null,deadline:'2026-11-10'};
  assert.equal(M.validity(x,'2026-11-10').state,'upcoming');assert.equal(M.validity(x,'2026-11-11').state,'closed');
  assert.equal(M.validity({...x,deadline:null},'2026-11-18').state,'upcoming');assert.equal(M.validity(x,'2026-11-19').state,'past');
  assert.equal(M.validity({...x,booking:'cancelled'}).state,'cancelled');assert.equal(M.validity({...x,booking:'waitlist'},now).state,'waitlist');
  assert.equal(M.validity({...x,checkedAt:'2026-08-29'},now).stale,true);
  const multi={...x,endDate:'2026-11-22',sessions:[{date:'2026-10-01',endDate:null},{date:'2026-12-01',endDate:null}]};
  assert.equal(M.validity(multi,now).state,'started');assert.equal(M.validity(multi,'2026-11-25').state,'started');assert.equal(M.validity(multi,'2026-12-02').state,'past');
});
test('training: filters combine and never promote advanced prevention as a basic course',()=>{
  const before=JSON.stringify(D.courses);
  assert.equal(M.filter(D.courses,{topic:'praevention',level:'basic'},now).length,0);
  assert.equal(M.filter(D.courses,{block:'renewal'},now).length,1);
  assert.equal(M.filter(D.courses,{topic:'erstehilfe',region:'umland'},now).length,1);
  assert.equal(M.filter(D.courses,{q:'brk muenchen',providerId:'brk',from:'2026-11-07',to:'2026-11-14'},now).length,3);
  assert.equal(M.filter(D.courses,{},'2027-01-01').length,0);assert.equal(M.filter(D.courses,{includeClosed:'yes'},'2027-01-01').length,5);
  assert.equal(M.filter(D.courses,{from:'2027-01-01',to:'2026-01-01'},now).length,0);
  assert.equal(JSON.stringify(D.courses),before);
});
test('training: Juleica self-check keeps requirements and provider approval distinct',()=>{
  const blocks=M.path(p(),now);assert.equal(blocks.length,4);assert.ok(blocks.every(b=>b.status==='review'));
  assert.match(blocks[0].description,/34 Zeitstunden/);assert.match(blocks[0].description,/15 in Präsenz/);assert.equal(blocks.at(-1).id,'application');
  const ready=M.path({...p(),basic:'yes',firstAid:'yes',firstAidDate:'2026-01-01',providerRequirements:'yes',age:'over16'},now);
  assert.equal(ready.filter(b=>b.status==='done').length,3);assert.equal(ready.at(-1).status,'review');
  assert.match(M.path({...p(),organization:'catholic'},now)[2].description,/Nicht automatisch/);
});
test('training: first-aid age uses calendar years, including boundary and leap day',()=>{
  const b=(date,now)=>M.path({...p(),firstAid:'yes',firstAidDate:date},now).find(x=>x.id==='firstAid');
  assert.equal(b('2023-10-29','2026-10-29').status,'done');assert.equal(b('2023-10-28','2026-10-29').status,'open');
  assert.equal(b('2024-02-29','2027-02-28').status,'done');assert.equal(b('2024-02-29','2027-03-01').status,'open');
  assert.equal(b('',now).status,'review');
  assert.equal(M.path({...p(),goal:'aid',firstAid:'yes',firstAidDate:'2020-01-01'},now)[0].status,'open');
});
test('training: renewal has eight hours and does not count first aid or unknown course hours',()=>{
  const blocks=M.path({...p(),goal:'renew',renewal:'no'},now);assert.match(blocks[0].description,/8 Zeitstunden/);assert.match(blocks[0].description,/Erste Hilfe nicht pauschal/);
  assert.equal(blocks[0].status,'open');assert.equal(M.filter(D.courses,blocks[0].filter,now)[0].providerId,'kjg');
  assert.equal(M.path({...p(),goal:'prevention',preventionLevel:'advanced'},now)[0].filter.level,'advanced');
});
test('training: import round-trip whitelists data and rejects incompatible or hostile values',()=>{
  const project=M.project();project.answers={...p(),firstAidDate:'2026-01-01'};project.step=2;
  const a=M.restore(JSON.stringify({...project,secret:'must not import',answers:{...project.answers,name:'Nobody'}}));
  assert.deepEqual(a.project,project);assert.equal(a.changed,false);assert.ok(!JSON.stringify(a.project).includes('Nobody'));
  for(const raw of ['bad','null','[]',JSON.stringify({...project,answers:4}),JSON.stringify({...project,answers:{goal:'__proto__'}}),JSON.stringify({...project,answers:{firstAidDate:'2026-02-30'}})])assert.throws(()=>M.restore(raw));
  const old=M.restore({...project,ruleVersion:'2025-01-01'});assert.equal(old.changed,true);assert.equal(old.project.step,0);
  assert.ok(M.validate({...p(),firstAid:'yes',firstAidDate:'2099-01-01'},now).length);
  assert.deepEqual(M.validate({...p(),goal:'renew',firstAid:'yes',firstAidDate:'2099-01-01'},now),[]);
});
test('training: calendar is a non-booking all-day reminder with exclusive end and safe folding',()=>{
  const out=M.calendar({...c,title:'Ä'.repeat(90)+', Kurs; mit\nZeile'},new Date('2026-10-29T09:00:00Z'));
  assert.match(out,/DTSTART;VALUE=DATE:20261106/);assert.match(out,/DTEND;VALUE=DATE:20261107/);assert.match(out,/DTSTAMP:20261029T090000Z/);
  assert.match(out,/Merker\\, keine Buchung/);assert.match(out,/08:00/);
  for(const line of out.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);
  const unfolded=out.replace(/\r\n /g,'');assert.match(unfolded,/\\, Kurs\\; mit\\nZeile/);assert.ok(unfolded.includes(c.url));
  const multi=M.calendar({...c,sessions:[{date:'2026-11-01',endDate:'2026-11-02'},{date:'2026-11-07',endDate:null}]});
  assert.equal((multi.match(/BEGIN:VEVENT/g)||[]).length,2);assert.match(multi,/DTEND;VALUE=DATE:20261103/);
});
test('training: loader discovers nested files, ignores drafts and names errors precisely',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ehrenhub-courses-'));try{
    fs.mkdirSync(path.join(dir,'thema'));fs.writeFileSync(path.join(dir,'KURS-VORLAGE.json'),'not loaded');
    fs.writeFileSync(path.join(dir,'thema',c.id+'.json'),JSON.stringify(c));
    fs.writeFileSync(path.join(dir,'draft.json'),JSON.stringify({id:'draft',status:'draft'}));
    const a=loadCourses(dir,D.training);assert.equal(a.courses.length,1);assert.match(a.files[c.id],/thema/);assert.equal(a.sources['kurs-'+c.id].url,c.url);
    fs.writeFileSync(path.join(dir,'broken.json'),'{');assert.throws(()=>loadCourses(dir,D.training),/broken.json.*JSON unlesbar/);fs.unlinkSync(path.join(dir,'broken.json'));
    fs.writeFileSync(path.join(dir,c.id+'.json'),JSON.stringify(c));assert.throws(()=>loadCourses(dir,D.training),/doppelte Kurs-ID/);fs.unlinkSync(path.join(dir,c.id+'.json'));
    fs.writeFileSync(path.join(dir,'draft.json'),JSON.stringify({id:'wrong',status:'draft'}));assert.throws(()=>loadCourses(dir,D.training),/Dateiname und id/);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('training: copyable course template validates when completed and activated',()=>{
  const template=require('../data/fortbildungen/KURS-VORLAGE.json');const x={...template,status:'published',provider:D.training.providers[template.providerId].name,source:'kurs-'+template.id};
  assert.deepEqual(errors({...D,courses:[x]}),[]);
});
test('training: editorial invalid dates, unsafe links, missing recognition and types stop the build',()=>{
  const mutate=[x=>x.courses[0].url='javascript:alert(1)',x=>x.courses[0].date='2026-02-30',x=>x.courses[0].endDate='2020-01-01',x=>x.courses[0].recognition.hours='4.5',x=>x.courses[0].price.amount=-1,x=>x.courses[0].providerId='toString',x=>x.courses[0].startTime='99:00',x=>x.courses[0].deadline='2029-01-01',x=>x.training.providers.kjg.url='http://invalid.test'];
  for(const change of mutate){const d=structuredClone(D);change(d);assert.ok(errors(d).length);}
});
test('training: every goal, step, deep link, catalogue and legacy route renders safely',()=>{
  const EH=loadViews(),state=makeState();
  for(const goal of ['start','renew','prevention','aid'])for(const step of [1,2]){
    const p=M.project();p.answers.goal=goal;p.step=step;
    const html=EH.TrainingView.render(p,C.parseRoute('#/fortbildungen?goal='+goal),state);
    assert.equal((html.match(/<h1\b/g)||[]).length,1,goal+step);assert.doesNotMatch(html,/undefined|\[object Object\]/);
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
    assert.equal((html.match(/<form\b/g)||[]).length,step===1?1:0);
  }
  for(const id of Object.keys(D.training.legacy))assert.match(EH.Views.main(C.parseRoute('#/fortbildungen/'+id),state,C.makeSearchIndex(D)),/Früher|Demo-Kurs/);
  for(const c of D.courses){const html=EH.TrainingView.courseDetail(c,state);assert.ok(html.includes(C.escapeHTML(c.url)));assert.match(html,/Originalangebot &amp; Anmeldung/);}
});
test('training: legacy bookmarks survive, but fictional offers leave search results',()=>{
  const index=C.makeSearchIndex(D);assert.deepEqual(C.readBookmarks('["kurs:erste-hilfe"]',index),['kurs:erste-hilfe']);
  assert.ok(C.search(index,'').every(x=>!x.legacy));
});
test('training: invalid collection shapes produce editorial errors, not runtime exceptions',()=>{
  for(const change of [d=>d.training.goals={},d=>d.training.goals=[null],d=>d.courses[0].sessions={},d=>d.courses[0].recognition=null]){const d=structuredClone(D);change(d);assert.ok(errors(d).length);}
});
test('training: explicitly excluded recognition is never recommended for that requirement',()=>{
  const excluded={...c,recognition:{...c.recognition,firstAid:'no'}};
  assert.equal(M.filter([excluded],{topic:'erstehilfe',block:'firstAid'},now).length,0);
  assert.equal(M.filter([excluded],{topic:'erstehilfe'},now).length,1);
});
test('training: untrusted editorial content and filter queries cannot inject HTML',()=>{
  const d=structuredClone(D),bad='<img src=x onerror="alert(1)">';d.courses[0].title=bad;d.courses[0].recognition.note=bad;d.training.providers.kjg.note=bad;
  const EH=loadViews(d),state=makeState();for(const html of [EH.TrainingView.courseDetail(d.courses[0],state),EH.TrainingView.providers(),EH.TrainingView.render(M.project(),C.parseRoute('#/fortbildungen?q='+encodeURIComponent(bad)),state)]){assert.ok(!html.includes(bad));assert.ok(html.includes('&lt;img'));}
});
test('training: download controls emit calendar and project bytes without network requests',async()=>{
  const vm=require('node:vm'),blobs=[],links=[],timers=[];
  class Element{constructor(dataset){this.dataset=dataset;}closest(selector){return selector==='[data-tf-calendar]'&&this.dataset.tfCalendar||selector==='[data-tf-action]'&&this.dataset.tfAction?this:null;}}
  const ctx={EH:{TrainingModel:M,TrainingView:{render:()=>''},Core:C,Data:D},Element,Blob,URLSearchParams,
    URL:{createObjectURL(blob){blobs.push(blob);return 'blob:local-test';},revokeObjectURL(){}},
    setTimeout(fn){timers.push(fn);},window:{confirm:()=>true},document:{getElementById:()=>null,body:{append(){}},createElement(){return{click(){links.push({name:this.download,href:this.href});},remove(){}};}}
  };ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/features/fortbildungen/controller.js'),'utf8'),ctx);
  const project=M.project();project.answers.goal='renew';
  const controller=ctx.EH.TrainingController.create({storage:{read:()=>JSON.stringify(project),write:()=>true},state:makeState(),toast:()=>{},speak:()=>{}});
  const click=dataset=>controller.handleClick({target:new Element(dataset),preventDefault(){}});
  click({tfCalendar:c.id});assert.equal(links.at(-1).name,c.id+'.ics');assert.match(await blobs.at(-1).text(),/BEGIN:VCALENDAR/);
  click({tfAction:'export'});assert.equal(links.at(-1).name,'Ehrenhub-Lernweg.json');assert.equal(JSON.parse(await blobs.at(-1).text()).answers.goal,'renew');timers.forEach(fn=>fn());
});
