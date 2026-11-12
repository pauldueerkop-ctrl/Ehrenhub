(function(root,factory){
  const config=typeof module==='object'&&module.exports?require('../../../data/fortbildungen/wegweiser.json'):root.EH.Data.training;
  const M=factory(config);if(typeof module==='object'&&module.exports)module.exports=M;else root.EH.TrainingModel=M;
})(globalThis,function(R){
  'use strict';
  const defaults={goal:'',organization:'unknown',basic:'unknown',firstAid:'unknown',firstAidDate:'',renewal:'unknown',prevention:'unknown',preventionLevel:'basic',providerRequirements:'unknown',age:'unknown'};
  const choices={goal:['',...R.goals.map(g=>g.id)],organization:['unknown','catholic','other'],basic:['unknown','yes','no'],firstAid:['unknown','yes','no'],renewal:['unknown','yes','no'],prevention:['unknown','yes','no'],preventionLevel:['basic','advanced','any'],providerRequirements:['unknown','yes','no'],age:['unknown','under16','over16']};
  const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  function day(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))return NaN;const n=Date.parse(s+'T12:00:00Z');return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===s?n/86400000:NaN;}
  function project(){return {schema:'ehrenhub-lernweg',schemaVersion:1,ruleVersion:R.version,step:0,answers:{...defaults}};}
  function restore(raw){let o;try{o=typeof raw==='string'?JSON.parse(raw):raw;}catch{throw Error('Keine lesbare Lernweg-Datei.');}
    if(!o||o.schema!=='ehrenhub-lernweg'||o.schemaVersion!==1||!o.answers||typeof o.answers!=='object'||Array.isArray(o.answers))throw Error('Keine Ehrenhub-Lernweg-Datei (Version 1).');
    const p=project();for(const k of Object.keys(defaults)){const v=o.answers[k];if(v===undefined)continue;if(typeof v!=='string'||v.length>40||(choices[k]&&!choices[k].includes(v))||(k==='firstAidDate'&&v&&!Number.isFinite(day(v))))throw Error('Ungültiges Feld: '+k);p.answers[k]=v;}
    p.step=[0,1,2].includes(o.step)?o.step:0;const changed=o.ruleVersion!==R.version;if(changed)p.step=0;
    if(!p.answers.goal)p.step=0;if(validate(p.answers).length&&p.step===2)p.step=1;return {project:p,changed};
  }
  function validate(p,now=today()){const errors=[];for(const [k,values]of Object.entries(choices))if(!values.includes(p[k]))errors.push({key:k,text:'Bitte eine gültige Auswahl treffen.'});
    if(!p.goal)errors.push({key:'goal',text:'Wähle zunächst dein Ziel.'});
    if(['start','aid'].includes(p.goal)&&p.firstAid==='yes'&&p.firstAidDate&&(!Number.isFinite(day(p.firstAidDate))||p.firstAidDate>now))errors.push({key:'firstAidDate',text:'Das Datum eines abgeschlossenen Kurses darf nicht ungültig sein oder in der Zukunft liegen.'});return errors;}
  function validity(c,now=today()){
    const first=[c.date,...(c.sessions||[]).map(s=>s.date)].sort()[0],end=[c.endDate||c.date,...(c.sessions||[]).map(s=>s.endDate||s.date)].sort().at(-1);
    const stale=day(now)-day(c.checkedAt)>R.staleAfterDays;
    let state='upcoming',label='Plätze beim Anbieter prüfen';
    if(c.booking==='cancelled'){state='cancelled';label='Abgesagt';}
    else if(end<now){state='past';label='Bereits vergangen';}
    else if(first<now){state='started';label='Bereits begonnen';}
    else if(c.booking==='closed'||c.deadline&&c.deadline<now){state='closed';label='Anmeldung geschlossen';}
    else if(c.booking==='waitlist'){state='waitlist';label='Warteliste laut Quelle';}
    else if(c.booking==='open')label='Anmeldung laut Quelle möglich';
    return {state,label,stale,first,end,selectable:['upcoming','waitlist'].includes(state)};
  }
  const normalize=s=>String(s??'').toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss');
  function filter(courses,f={},now=today()){
    const words=normalize(f.q).split(/\s+/).filter(Boolean);
    return courses.filter(c=>{
      const s=validity(c,now);if(f.includeClosed!=='yes'&&!s.selectable)return false;
      if(f.topic&&f.topic!=='alle'&&c.topic!==f.topic)return false;
      for(const k of ['duration','format','region','providerId'])if(f[k]&&f[k]!=='alle'&&c[k]!==f[k])return false;
      if(f.level&&f.level!=='any'&&c.levelCode!==f.level)return false;
      if(f.from&&Number.isFinite(day(f.from))&&c.date<f.from)return false;
      if(f.to&&Number.isFinite(day(f.to))&&c.date>f.to)return false;
      if(f.block==='renewal'&&c.recognition?.renewal!=='provider')return false;
      if(f.block==='basic'&&(c.levelCode!=='basic'||c.recognition?.basic==='no'))return false;
      if(f.block==='firstAid'&&c.recognition?.firstAid==='no')return false;
      if(f.block==='prevention'&&c.recognition?.prevention==='no')return false;
      const hay=normalize([c.title,c.provider,c.summary,c.location,...(c.tags||[])].join(' '));return words.every(w=>hay.includes(w));
    }).sort(f.sort==='titel'?(a,b)=>a.title.localeCompare(b.title,'de'):(a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
  }
  function path(p,now=today()){
    const mark=v=>v==='yes'?'done':v==='no'?'open':'review';
    const blocks=[];const add=(id,title,status,description,filter={},href='')=>blocks.push({id,title,status,description,filter,href});
    if(p.goal==='start'){
      add('basic','Grundausbildung',mark(p.basic),`Bayern: mindestens ${R.rules.basicHours} Zeitstunden, davon ${R.rules.inPersonHours} in Präsenz. Dein Träger bestätigt den Ausbildungsweg.`,{topic:'leitung',block:'basic'});
      let status=mark(p.firstAid),note=`Erstantrag: ${R.rules.firstAidUnits} Unterrichtseinheiten à ${R.rules.firstAidUnitMinutes} Minuten, höchstens ${R.rules.firstAidMaxYears} Jahre alt bei Antragstellung.`;
      if(p.firstAid==='yes'){
        if(!p.firstAidDate){status='review';note+=' Das Datum fehlt noch; Alter des Nachweises prüfen.';}
        else {const year=Number(p.firstAidDate.slice(0,4))+R.rules.firstAidMaxYears;let anniversary=year+p.firstAidDate.slice(4);if(!Number.isFinite(day(anniversary)))anniversary=year+'-02-28';if(now>anniversary){status='open';note+=' Dein angegebenes Kursdatum liegt mehr als drei Jahre zurück.';}else note+=' Nach deinem Datum derzeit im Zeitfenster; zum Antrag erneut prüfen.';}
      }
      add('firstAid','Erste-Hilfe-Nachweis',status,note,{topic:'erstehilfe',block:'firstAid'});
      add('providerRequirements','Zusätzliche Anforderungen deines Trägers',mark(p.providerRequirements),p.organization==='catholic'?'Mit Pfarrei / Verband klären, welche Präventionsschulung und Nachweise für deine konkrete Tätigkeit nötig sind. Nicht automatisch ein zusätzlicher universeller Juleica-Kurs.':'Prävention gehört zur Ausbildung. Ob zusätzliche Kurse nötig sind, entscheidet dein Träger.',{topic:'praevention',level:'basic'});
      add('application','Mit dem Träger beantragen','review',p.age==='under16'?'Regulär ab 16. Mit 15 ist eine begründete Trägerausnahme möglich. Kläre Alter, ehrenamtliche Tätigkeit und Nachweise direkt mit deinem Träger.':'Regulär ab 16, langfristiges ehrenamtliches Engagement und Bestätigung durch den Träger. Dein Selbstcheck erteilt keine Juleica.',{},R.sources.juleica);
    }else if(p.goal==='renew'){
      add('renewal','Anerkannte Fortbildung',mark(p.renewal),`Mindestens ${R.rules.renewalHours} Zeitstunden fachliche Fortbildung. Zeitfenster und Pausen sind nicht automatisch anrechenbare Stunden. Erste Hilfe nicht pauschal als Ersatz zählen.`,{block:'renewal'});
      add('providerRequirements','Weitere Trägeranforderungen',mark(p.providerRequirements),'Erste-Hilfe-Auffrischung ist zusätzlich empfohlen; eine Pflicht kann dein Träger vorsehen. Präventionsanforderungen ebenfalls klären.',{topic:'praevention'});
      add('application','Verlängerung abstimmen','review','Ablaufdatum und Nachweise beim Träger prüfen. Eine abgelaufene Karte ist nicht weiter gültig, nur weil eine spätere Verlängerung möglich ist.',{},R.sources.juleica);
    }else if(p.goal==='prevention')add('prevention',p.preventionLevel==='advanced'?'Prävention vertiefen':'Passende Präventionsschulung',mark(p.prevention),'Grundlagen und Vertiefung sind verschiedene Angebote. Art und Anerkennung mit deiner Organisation abstimmen; eine Schulung ersetzt keine Beratung im akuten Fall.',{topic:'praevention',level:p.preventionLevel});
    else if(p.goal==='aid'){const first=path({...p,goal:'start'},now).find(b=>b.id==='firstAid');add('firstAid','Erste Hilfe praktisch lernen',first.status,first.description+' Umfang des konkreten Angebots vor Buchung bestätigen lassen.',first.filter);}
    return blocks;
  }
  function calendar(c,stamp=new Date()){
    const clean=s=>String(s||'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
    const date=s=>s.replace(/-/g,'');
    const next=s=>new Date((day(s)+1)*86400000).toISOString().slice(0,10);
    const sessions=c.sessions?.length?c.sessions:[{date:c.date,endDate:c.endDate||c.date,startTime:c.startTime,endTime:c.endTime}];
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Ehrenhub//Fortbildungen//DE','CALSCALE:GREGORIAN'];
    sessions.forEach((s,i)=>{lines.push('BEGIN:VEVENT','UID:'+c.id+'-'+i+'@ehrenhub.local','DTSTAMP:'+stamp.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z'),'DTSTART;VALUE=DATE:'+date(s.date),'DTEND;VALUE=DATE:'+date(next(s.endDate||s.date)),'SUMMARY:'+clean(c.title),'LOCATION:'+clean(c.location),'DESCRIPTION:'+clean('Merker, keine Buchung. '+(s.startTime&&s.endTime?s.startTime+'–'+s.endTime+' Uhr (Ortszeit). ':'')+'Verbindliche Zeiten, Anmeldung und Änderungen: '+c.url),'URL:'+c.url,'END:VEVENT');});
    lines.push('END:VCALENDAR');
    // RFC5545 UTF-8 folding: never split a multibyte code point, each physical line <=75 octets.
    return lines.flatMap(line=>{const out=[];let row='',size=0;for(const ch of line){const bytes=new TextEncoder().encode(ch).length;if(size+bytes>75){out.push(row);row=' ';size=1;}row+=ch;size+=bytes;}out.push(row);return out;}).join('\r\n')+'\r\n';
  }
  return {config:R,defaults,choices,today,day,project,restore,validate,validity,filter,path,calendar};
});
