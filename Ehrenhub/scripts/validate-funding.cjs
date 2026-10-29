/* Reject broken rates, mismatched IDs and unsafe links before a public build. */
'use strict';
function validateFunding(D,fail){
  const file='data/foerderung/bdkj-muenchen-2026.json';
  const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  const text=(x,p)=>{if(typeof x!=='string'||!x.trim())fail(p,'nichtleeren Text angeben');};
  const https=(x,p)=>{try{const u=new URL(x);if(u.protocol!=='https:'||u.username||u.password)throw Error();}catch{fail(p,'gültigen HTTPS-Link ohne Zugangsdaten angeben');}};
  const r=D.funding;
  if(!object(r)){fail(file,'Regelobjekt fehlt');return;}
  for(const k of ['id','owner','scope','disclaimer'])text(r[k],file+'.'+k);
  for(const k of ['version','checkedAt']){
    const value=r[k],date=new Date(value+'T12:00:00Z');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)fail(file+'.'+k,'gültiges ISO-Datum erwartet');
  }
  for(const k of ['guideline','overview','portal','land','stadt','education'])https(r.sources?.[k],file+'.sources.'+k);
  const numeric={trip:['minPeople','minNights','maxNights','rate','enhancedCityRate','enhancedMinNights','minRatio','maxRatio','minStaffAllowance','deadlineDays'],international:['inlandRate','abroadRate'],education:['dayRate','sessionRate'],room:['cap','periodYears','deadlineDays'],special:['cap','beforeDays','deadlineDays']};
  for(const [group,keys] of Object.entries(numeric)){
    if(!object(r[group])){fail(file+'.'+group,'Regelgruppe fehlt');continue;}
    text(r[group].section,file+'.'+group+'.section');
    for(const key of keys){const x=r[group][key];if(typeof x!=='number'||!Number.isFinite(x)||x<=0||x>10000000||(!/Rate$|^rate$|^cap$/.test(key)&&!Number.isInteger(x)))fail(file+'.'+group+'.'+key,'positive, endliche Zahl (Zählwerte ganzzahlig) erwartet');}
  }
  if(r.trip?.minNights>r.trip?.maxNights||r.trip?.enhancedMinNights>r.trip?.maxNights||r.trip?.maxRatio>r.trip?.minRatio)fail(file+'.trip','widersprüchliche Grenzen');
  // IDs are an API to the logic; adding a new grant needs its own implemented branch.
  const ids=['freizeit','international','bildung','raum','projekt'];
  if(!Array.isArray(r.programs)||r.programs.length!==ids.length||ids.some(id=>r.programs.filter(x=>x?.id===id).length!==1))fail(file+'.programs','genau die fünf implementierten, eindeutigen Förderbereiche erwartet');
  for(const p of Array.isArray(r.programs)?r.programs:[])for(const k of ['title','description','icon'])text(p?.[k],file+'.programs.'+p?.id+'.'+k);
  for(const [key,expected,size] of [['organizations',['bdkj','other','unknown'],3],['regions',['stadt','mixed','land','other'],2]]){
    const rows=r[key];
    if(!Array.isArray(rows)||rows.length!==expected.length||expected.some(id=>rows.filter(x=>x?.[0]===id).length!==1))fail(file+'.'+key,'implementierte, eindeutige Auswahl-IDs erwartet');
    for(const row of Array.isArray(rows)?rows:[]){if(!Array.isArray(row)||row.length!==size)fail(file+'.'+key,'ungültige Auswahlzeile');else row.forEach(x=>text(x,file+'.'+key));}
  }
  if(!Array.isArray(r.notes)||!r.notes.length)fail(file+'.notes','Hinweise zur fachlichen Einordnung fehlen');
  else r.notes.forEach(x=>text(x,file+'.notes'));
  const forms=D.fundingForms,where='data/foerderung/formulare.json';
  if(!Array.isArray(forms)||forms.length!==2||['teilnehmende','betreuende'].some(id=>forms.filter(x=>x?.id===id).length!==1))fail(where,'beide Originalformulare mit eindeutigen IDs nötig');
  for(const f of Array.isArray(forms)?forms:[]){
    for(const k of ['title','version'])text(f?.[k],where+'.'+k);
    https(f?.url,where+'.url');
    if(!/^[A-Za-z0-9-]+\.pdf$/.test(f?.file))fail(where+'.file','einfachen PDF-Dateinamen ohne Pfad angeben');
    if(typeof f?.base64!=='string'||!/^JVBERi0[A-Za-z0-9+/=\s]+$/.test(f.base64)||!Buffer.from(f.base64,'base64').subarray(0,5).equals(Buffer.from('%PDF-')))fail(where+'.base64','gültige eingebettete Original-PDF fehlt');
  }
}
module.exports={validateFunding};
