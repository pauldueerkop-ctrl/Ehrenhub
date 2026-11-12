/* Guard the editorial boundary: failures point to the course file and field. */
'use strict';
const date=v=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const d=new Date(v+'T12:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===v;};
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const https=v=>{try{const u=new URL(v);return typeof v==='string'&&!/[\s]/.test(v)&&u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
function validateTraining(D,fail){
  const R=D.training,p='data/fortbildungen/wegweiser.json';
  if(!object(R)){fail(p,'Objekt erwartet');return;}
  if(!date(R.checkedAt)||!date(R.version))fail(p,'version und checkedAt als gültiges Datum angeben');
  if(!Number.isInteger(R.staleAfterDays)||R.staleAfterDays<1||R.staleAfterDays>365)fail(p+'.staleAfterDays','1 bis 365 Tage angeben');
  if(!object(R.rules))fail(p+'.rules','Regelobjekt fehlt');
  else for(const k of ['basicHours','inPersonHours','firstAidUnits','firstAidUnitMinutes','firstAidMaxYears','renewalHours'])if(!Number.isFinite(R.rules[k])||R.rules[k]<=0)fail(p+'.rules.'+k,'positive Zahl erwartet');
  for(const k of ['standards','juleica'])if(!https(R.sources?.[k]))fail(p+'.sources.'+k,'HTTPS-Quelle erwartet');
  if(!Array.isArray(R.goals)||R.goals.map(g=>g?.id).join(',')!=='start,renew,prevention,aid')fail(p+'.goals','Ziele start, renew, prevention, aid in dieser Reihenfolge erwartet');
  for(const g of Array.isArray(R.goals)?R.goals:[]){if(!object(g)){fail(p+'.goals','Zielobjekt erwartet');continue;}for(const k of ['title','description','icon','color'])if(typeof g[k]!=='string'||!g[k].trim())fail(p+'.goals.'+g.id+'.'+k,'Text erwartet');}
  if(!object(R.providers))fail(p+'.providers','Anbieterobjekt erwartet');
  else for(const [id,v]of Object.entries(R.providers)){
    const where=p+'.providers.'+id;
    if(!/^[a-z][a-z0-9-]*$/.test(id)||!object(v)){fail(where,'gültige Anbieter-ID und Objekt erwartet');continue;}
    for(const key of ['name','note'])if(typeof v[key]!=='string'||!v[key].trim())fail(where+'.'+key,'Text erwartet');
    if(!https(v.url)||v.preventionUrl&&!https(v.preventionUrl))fail(where+'.url','gültigen HTTPS-Link ohne Zugangsdaten angeben');
    if(!Array.isArray(v.topics)||!v.topics.length||v.topics.some(t=>!['leitung','praevention','erstehilfe','organisation'].includes(t)))fail(where+'.topics','bekannte Themen angeben');
  }
  if(!object(R.legacy)||Object.values(R.legacy).some(t=>!['leitung','praevention','erstehilfe','organisation'].includes(t)))fail(p+'.legacy','alte Demo-IDs auf gültige Themen abbilden');
  for(const c of Array.isArray(D.courses)?D.courses:[]){
    if(!object(c))continue;
    const where=D.courseFiles?.[c.id]||'data/fortbildungen/'+c.id+'.json';
    const err=(k,m)=>fail(where+'.'+k,m);
    for(const k of ['title','summary','length','location','level','note'])if(typeof c[k]!=='string'||!c[k].trim()||c[k].length>2500)err(k,'1 bis 2500 Zeichen erwartet');
    if(c.status!=='published')err('status','geladener Kurs muss published sein');
    if(!Object.hasOwn(R.providers||{},c.providerId))err('providerId','Anbieter nicht in wegweiser.json registriert');
    if(!https(c.url))err('url','direkten HTTPS-Link zum Original ohne Zugangsdaten angeben');
    if(!['muenchen','umland','online'].includes(c.region))err('region','muenchen, umland oder online erwartet');
    if(!['basic','advanced','all'].includes(c.levelCode))err('levelCode','basic, advanced oder all erwartet');
    if(!['unknown','open','waitlist','closed','cancelled'].includes(c.booking))err('booking','unknown, open, waitlist, closed oder cancelled erwartet');
    for(const key of ['date','checkedAt'])if(!date(c[key]))err(key,'gültiges Datum JJJJ-MM-TT erwartet');
    for(const key of ['endDate','deadline'])if(c[key]!==null&&!date(c[key]))err(key,'gültiges Datum oder null erwartet');
    if(c.endDate&&c.endDate<c.date)err('endDate','liegt vor dem Beginn');
    const clock=v=>typeof v==='string'&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v);
    function times(o,k){if(o.startTime===null&&o.endTime===null)return;if(!clock(o.startTime)||!clock(o.endTime))err(k,'beide Uhrzeiten HH:MM oder beide null angeben');else if((!o.endDate||o.endDate===o.date)&&o.endTime<=o.startTime)err(k,'Ende muss nach dem Beginn liegen (mehrtägig: endDate setzen)');}
    times(c,'startTime/endTime');
    if(!object(c.price)||!(c.price.amount===null||typeof c.price.amount==='number'&&Number.isFinite(c.price.amount)&&c.price.amount>=0)||c.price.currency!=='EUR'||typeof c.price.note!=='string'||!c.price.note.trim())err('price','amount: Zahl >= 0 oder null, currency: EUR, note: Text erwartet');
    if(!object(c.recognition))err('recognition','Anerkennungsobjekt fehlt');
    else{
      for(const k of ['basic','renewal','firstAid','prevention'])if(!['provider','clarify','no'].includes(c.recognition[k]))err('recognition.'+k,'provider, clarify oder no erwartet');
      for(const k of ['hours','teachingUnits'])if(!(c.recognition[k]===null||typeof c.recognition[k]==='number'&&Number.isFinite(c.recognition[k])&&c.recognition[k]>0))err('recognition.'+k,'bestätigten positiven Umfang oder null angeben');
      if(typeof c.recognition.note!=='string'||!c.recognition.note.trim())err('recognition.note','Anerkennung / offene Fragen erklären');
    }
    if(!Array.isArray(c.sessions))err('sessions','Array erwartet, bei Einzeltermin leer lassen');
    else c.sessions.forEach((s,i)=>{const k='sessions['+i+']';if(!object(s)){err(k,'Objekt erwartet');return;}if(!date(s.date)||s.endDate!==null&&!date(s.endDate))err(k,'gültiges Datum und endDate: Datum oder null erwartet');if(s.endDate&&s.endDate<s.date)err(k+'.endDate','liegt vor Beginn');if(typeof s.label!=='string'||!s.label.trim())err(k+'.label','Name des Kursteils fehlt');times(s,k+'.startTime/endTime');});
    const first=[c.date,...(Array.isArray(c.sessions)?c.sessions:[]).filter(object).map(s=>s.date)].sort()[0];if(c.deadline&&c.deadline>first)err('deadline','Anmeldeschluss liegt nach dem ersten Kursteil');
  }
}
module.exports={validateTraining,date,https};
