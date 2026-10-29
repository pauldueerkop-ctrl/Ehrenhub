'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const M=require('../src/features/foerderung/model.js');
const D=require('../src/content.js');
const {loadViews}=require('./helpers.cjs');
const NOW='2026-01-01';
const valid=(changes={})=>({...M.defaults,organization:'bdkj',region:'stadt',program:'freizeit',start:'2026-06-12',end:'2026-06-14',city:'30',staff:'6',juleica:'yes',clearance:'yes',...changes});
const calc=(changes={},now=NOW)=>M.calculate(valid(changes),now);
const find=(r,id)=>r.checks.find(c=>c.id===id);
const education=(changes={})=>calc({program:'bildung',primary:'yes',local:'yes',eligibleProgram:'yes',units:'2',costs:'5000',income:'1000',...changes});
const intl=(changes={})=>calc({program:'international',primary:'yes',eligibleProgram:'yes',costs:'5000',income:'1000',...changes});

test('funding: two-night city weekend gives a conditional 720 EUR ceiling',()=>{
  const r=calc();assert.equal(r.status,'possible');assert.equal(r.amount,720);assert.equal(r.deadline.due,'2026-07-12');
  assert.equal(r.lines.reduce((n,l)=>n+l.total,0),720);
  assert.deepEqual(r.staff,{min:2,max:6,eligible:6,actual:6,excess:0});
});
test('funding: minimum group and two nights are actual gates, 21 nights a cap',()=>{
  assert.equal(calc({end:'2026-06-13'}).amount,null);
  assert.equal(find(calc({city:'4',staff:'1'}),'people').status,'fail');
  assert.equal(calc({end:'2026-07-12'}).amount,36*21*10);
  assert.equal(calc({city:'5',staff:'2'}).amount,140);
});
test('funding: staff minimum, excess staff, and conservative ratio rounding',()=>{
  assert.equal(find(calc({staff:'1'}),'staff').status,'fail');
  const high=calc({staff:'10'});assert.equal(high.amount,720);assert.equal(high.staff.excess,4);
  const fractional=calc({city:'13',staff:'3'});assert.equal(fractional.amount,300);assert.equal(find(fractional,'rounding').status,'review');
});
test('funding: no or unknown credentials cannot masquerade as complete',()=>{
  for(const key of ['juleica','clearance']){
    const no=calc({[key]:'no'});assert.equal(no.status,'blocked');assert.equal(no.amount,null);
    assert.equal(calc({[key]:'unknown'}).status,'review');
  }
});
test('funding: staff is proportionate to eligible participants, not own residence',()=>{
  const r=calc({city:'10',land:'5',other:'5',staff:'4'});
  assert.equal(r.amount,360);assert.equal(r.lines.find(l=>l.label==='Betreuungsanteil Stadt').count,2);
  assert.equal(find(r,'landRoute').status,'review');
  assert.equal(calc({city:'0',land:'30'}).status,'review');
});
test('funding: enhanced international trip rate respects seven-night boundary',()=>{
  assert.equal(calc({end:'2026-06-19',abroad:'yes',enhanced:'yes'}).amount,5040);
  assert.equal(calc({end:'2026-06-18',abroad:'yes',enhanced:'yes'}).amount,2160);
  const mixed=calc({city:'20',land:'10',end:'2026-06-19',abroad:'yes',enhanced:'yes'});
  assert.equal(mixed.amount,4200);
  assert.equal(calc({end:'2026-06-19',abroad:'yes',enhanced:'unknown'}).status,'review');
});
test('funding: disability support is not silently guessed or requires health data',()=>{
  const r=calc({assistants:'2'});assert.equal(r.amount,720);assert.equal(find(r,'assistants').status,'review');
  assert.ok(!Object.keys(M.defaults).some(k=>/diagnos|health|address/i.test(k)));
});
test('funding: dates are timezone independent and reject non-existent dates',()=>{
  assert.equal(M.addDays('2028-02-01',28),'2028-02-29');
  assert.equal(M.addDays('2026-03-15',28),'2026-04-12');
  assert.equal(M.addDays('2026-12-20',28),'2027-01-17');
  assert.ok(Number.isNaN(M.dateNumber('2026-02-29')));
  assert.equal(M.addDays('bad',28),'');
  assert.equal(calc({end:'2026-06-01'}).status,'invalid');
});
test('funding: exact deadline, urgency, expiry, timely and late submission',()=>{
  assert.equal(calc({},'2026-07-05').deadline.status,'soon');
  assert.equal(calc({},'2026-07-12').deadline.status,'today');
  const late=calc({},'2026-07-13');assert.equal(late.status,'blocked');assert.equal(late.deadline.status,'overdue');
  const submitted=calc({submitted:'yes',submittedAt:'2026-07-12'},'2026-10-20');assert.equal(submitted.deadline.status,'submitted');assert.equal(submitted.status,'possible');
  assert.equal(calc({submitted:'yes',submittedAt:'2026-07-13'},'2026-10-20').deadline.status,'late');
});
test('funding: unrelated organization or region never gets a BDKJ numerical result',()=>{
  for(const p of [{organization:'other'},{organization:'unknown'},{region:'land'},{region:'other'}]){const r=calc(p);assert.equal(r.status,'outside');assert.equal(r.amount,null);assert.equal(r.lines.length,0);}
});
test('funding: invalid numbers, impossible choices and blank mandatory data rejected',()=>{
  for(const p of [{city:'-1'},{city:'2.5'},{city:'Infinity'},{city:'100001'},{staff:''},{start:''},{end:'2026-02-30'},{juleica:'yess'},{city:'0'}])assert.equal(calc(p).status,'invalid',JSON.stringify(p));
  for(const value of ['-1','NaN','1.234','1e7',''])assert.equal(education({costs:value}).status,'invalid');
  assert.equal(education({income:'10000'}).amount,0);
});
test('funding: international encounter uses 15/25, eligible guests and deficit cap',()=>{
  assert.equal(intl().amount,1080);assert.equal(intl({abroad:'yes'}).amount,1800);
  assert.equal(intl({guests:'30'}).amount,1980);
  assert.equal(intl({guests:'30',abroad:'yes'}).amount,1800);
  assert.equal(intl({costs:'1100',income:'1000'}).amount,100);
  assert.equal(intl({primary:'no'}).amount,null);
  assert.equal(intl({primary:'planned'}).status,'review');
  assert.equal(intl().deadline,null);
});
test('funding: JBM/AEJ use explicit verified units and different eligible groups',()=>{
  assert.equal(education().amount,1080);
  assert.equal(education({unit:'session'}).amount,360);
  assert.equal(education({educationKind:'aej'}).amount,900);
  assert.equal(education({costs:'1050',income:'1000'}).amount,50);
  assert.equal(education({eligibleProgram:'no'}).amount,null);
  assert.equal(education({local:'unknown'}).status,'review');
  assert.equal(education().deadline,null);
  // A submitted trip date must not leak into another program's validation.
  assert.notEqual(education({submitted:'yes',submittedAt:''}).status,'invalid');
});
test('funding: room budget respects previous funding and uncovered cost',()=>{
  const r=calc({program:'raum',roomUse:'yes',roomPeriod:'yes',costs:'5000',income:'0',priorFunding:'800'});
  assert.equal(r.amount,2200);assert.equal(r.status,'review');
  assert.equal(calc({program:'raum',roomUse:'yes',roomPeriod:'yes',costs:'1000',income:'900',priorFunding:'0'}).amount,100);
  assert.equal(calc({program:'raum',roomUse:'no',roomPeriod:'yes',costs:'1000',income:'0'}).amount,null);
});
test('funding: special project prior approval eight weeks before start',()=>{
  const p={program:'projekt',specialCriteria:'yes',costs:'9000',income:'0'};
  const r=calc(p);assert.equal(r.beforeDue,'2026-04-17');assert.equal(r.amount,4000);assert.equal(r.status,'review');
  assert.equal(calc(p,'2026-04-18').status,'blocked');
  assert.equal(calc({...p,approvedBefore:'yes'},'2026-04-18').status,'review');
  assert.equal(calc({...p,specialCriteria:'no'}).amount,null);
});
test('funding: import/export preserves a project but whitelists fields and checklist IDs',()=>{
  const p=M.makeProject();p.answers=valid({name:'Unser Wochenende'});p.step=2;p.checks={forms:true,constructor:true,unknown:true};p.answers.childName='MUST NOT IMPORT';
  const restored=M.restore(JSON.stringify(p)).project;
  assert.equal(restored.step,2);assert.equal(restored.answers.name,'Unser Wochenende');assert.equal(restored.answers.childName,undefined);
  assert.deepEqual(Object.keys(restored.checks),['forms']);
  assert.deepEqual(M.restore(JSON.stringify(restored)).project,restored);
});
test('funding: incompatible, malicious and incomplete imports fail safely',()=>{
  for(const raw of ['',null,'not-json','{}','{"schema":"ehrenhub-foerdercheck","schemaVersion":1,"answers":[]}'])assert.throws(()=>M.restore(raw));
  const p=M.demo();p.answers.organization='__proto__';assert.throws(()=>M.restore(p));
  p.answers.organization='bdkj';p.answers.name='x'.repeat(121);assert.throws(()=>M.restore(p));
  p.answers.name='Okay';p.step=2;p.answers.start='';assert.equal(M.restore(p).project.step,1);
  p.ruleVersion='2020-01-01';p.checks.forms=true;const r=M.restore(p);assert.equal(r.changed,true);assert.equal(r.project.step,0);assert.deepEqual(r.project.checks,{});
});
test('funding: checklists include practical paper/tablet tips and correct training route',()=>{
  const groups=M.checklist(valid()),all=groups.flatMap(g=>g.items);
  assert.deepEqual(groups.map(x=>x.id),['before','during','after']);
  assert.equal(new Set(all.map(x=>x.id)).size,all.length);
  assert.ok(all.find(x=>x.id==='forms').text.includes('Tablet'));
  assert.equal(all.find(x=>x.id==='team').link.href,'#/fortbildungen?topic=leitung');
  assert.ok(all.find(x=>x.id==='clearance').detail.includes('Pfarrbüro'));
});
test('funding: all views escape event names and editorial text, render valid states',()=>{
  const d=structuredClone(D),payload='<img src=x onerror="alert(1)">';d.funding.owner=payload;
  const V=loadViews(d).FundingView;
  for(const program of M.rules.programs.map(x=>x.id))for(const step of [0,1,2]){
    const p=M.makeProject();p.step=step;p.answers=valid({program,name:payload,units:'2',costs:'900',income:'0'});
    const html=V.render(p);assert.ok(!html.includes(payload));assert.ok(!html.includes('undefined'));assert.ok(!html.includes('NaN'));
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length);
  }
});
test('funding: original blank PDFs embed byte-exact and are copied to dist',()=>{
  for(const f of D.fundingForms){
    const original=fs.readFileSync(path.join(__dirname,'../public/formulare',f.file));
    assert.deepEqual(Buffer.from(f.base64,'base64'),original);
    assert.deepEqual(fs.readFileSync(path.join(__dirname,'../dist/formulare',f.file)),original);
  }
});
test('funding: malformed editable rates, source URLs, program IDs and PDFs stop builds',async()=>{
  const {validateContent}=await import('../scripts/validate-content.mjs');
  const d=structuredClone(D);d.funding.trip.rate=-1;d.funding.sources.portal='javascript:alert(1)';d.funding.programs[0].id='missing';d.fundingForms[0].base64='broken';
  const errors=validateContent(d);
  for(const key of ['trip.rate','sources.portal','programs','base64'])assert.ok(errors.some(e=>e.includes(key)),key);
  const empty=structuredClone(D);empty.funding={};assert.ok(validateContent(empty).length>10);
});

test('funding: download handlers emit correct PDF and JSON bytes without network access',async()=>{
  const vm=require('node:vm'),blobs=[],links=[],timers=[];
  class Element{constructor(dataset){this.dataset=dataset;}closest(selector){return selector==='[data-fg-action]'?this:null;}}
  const ctx={EH:{FundingModel:M,FundingView:{render:()=>''},Data:D},Element,Blob,Uint8Array,atob,
    URL:{createObjectURL(blob){blobs.push(blob);return 'blob:local-test';},revokeObjectURL(){}},
    setTimeout(fn){timers.push(fn);},window:{confirm:()=>true},document:{
      getElementById:()=>null,querySelectorAll:()=>[],body:{append(){}},
      createElement(){const a={click(){links.push({name:this.download,href:this.href});},remove(){}};return a;}
    }};
  ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/features/foerderung/controller.js'),'utf8'),ctx);
  const controller=ctx.EH.FundingController.create({storage:{read:()=>null,write:()=>true}});
  const click=dataset=>controller.handleClick({target:new Element(dataset),preventDefault(){}});
  for(const f of D.fundingForms){click({fgAction:'download',formId:f.id});assert.equal(links.at(-1).name,f.file);assert.deepEqual(Buffer.from(await blobs.at(-1).arrayBuffer()),Buffer.from(f.base64,'base64'));}
  click({fgAction:'demo'});click({fgAction:'export'});
  assert.equal(links.at(-1).name,'Ehrenhub-Foerdercheck.json');const json=JSON.parse(await blobs.at(-1).text());assert.equal(json.schema,'ehrenhub-foerdercheck');assert.equal(json.answers.city,'30');
  timers.forEach(fn=>fn());
});
