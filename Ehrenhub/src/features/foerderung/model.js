/* Pure funding logic. Rates and provenance live in data/foerderung, never in the view. */
(function(root,factory){
  const rules=typeof module==='object'&&module.exports?require('../../../data/foerderung/bdkj-muenchen-2026.json'):root.EH.Data.funding;
  const model=factory(rules);
  if(typeof module==='object'&&module.exports)module.exports=model;else root.EH.FundingModel=model;
})(globalThis,function(R){
  'use strict';
  const DAY=86400000;
  const numbers=['city','land','other','staff','guests','assistants','costs','income','priorFunding','units'];
  const defaults={organization:'',region:'',program:'',name:'',start:'',end:'',city:'',land:'0',other:'0',staff:'',guests:'0',assistants:'0',juleica:'unknown',clearance:'unknown',abroad:'no',enhanced:'no',onTour:'no',costs:'',income:'',priorFunding:'0',primary:'unknown',educationKind:'jbm',unit:'day',units:'',local:'unknown',eligibleProgram:'unknown',roomUse:'unknown',roomPeriod:'unknown',specialCriteria:'unknown',approvedBefore:'unknown',submitted:'no',submittedAt:''};
  const choices={organization:['','bdkj','other','unknown'],region:['','stadt','mixed','land','other'],program:['',...R.programs.map(p=>p.id)],juleica:['yes','no','unknown'],clearance:['yes','no','unknown'],abroad:['yes','no'],enhanced:['yes','no','unknown'],onTour:['yes','no','unknown'],primary:['yes','planned','no','unknown'],educationKind:['jbm','aej'],unit:['day','session'],local:['yes','no','unknown'],eligibleProgram:['yes','no','unknown'],roomUse:['yes','no','unknown'],roomPeriod:['yes','no','unknown'],specialCriteria:['yes','no','unknown'],approvedBefore:['yes','no','unknown'],submitted:['yes','no']};
  const amount=v=>Math.round((v+Number.EPSILON)*100)/100;
  const n=v=>Number(v);
  function dateNumber(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return NaN;
    const t=Date.parse(value+'T12:00:00Z');
    return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===value?t/DAY:NaN;
  }
  const iso=day=>new Date(day*DAY).toISOString().slice(0,10);
  function today(){const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
  function addDays(value,days){const d=dateNumber(value);return Number.isFinite(d)?iso(d+days):'';}
  function duration(p){return dateNumber(p.end)-dateNumber(p.start);}
  function makeProject(){return {schema:'ehrenhub-foerdercheck',schemaVersion:1,ruleVersion:R.version,step:0,answers:{...defaults},checks:{}};}
  function restore(raw){
    try{
      const obj=typeof raw==='string'?JSON.parse(raw):raw;
      if(!obj||obj.schema!=='ehrenhub-foerdercheck'||obj.schemaVersion!==1||!obj.answers||typeof obj.answers!=='object'||Array.isArray(obj.answers))throw new Error('Keine gültige Ehrenhub-Fördercheck-Datei (Version 1).');
      const p=makeProject();
      for(const key of Object.keys(defaults)){
        const value=obj.answers[key];if(value===undefined)continue;
        if(typeof value!=='string'||value.length>(key==='name'?120:40))throw new Error('Ungültiges Feld: '+key);
        if(choices[key]&&!choices[key].includes(value))throw new Error('Ungültige Auswahl: '+key);
        p.answers[key]=value;
      }
      p.step=Number.isInteger(obj.step)&&obj.step>=0&&obj.step<=2?obj.step:0;
      const allowedChecks=new Set(checklist(p.answers).flatMap(group=>group.items.map(item=>item.id)));
      for(const [key,value] of Object.entries(obj.checks||{}))if(allowedChecks.has(key)&&value===true)p.checks[key]=true;
      const changed=obj.ruleVersion!==R.version;
      if(changed){p.step=0;p.checks={};}
      if(p.step>0&&validate(p.answers,0).length)p.step=0;
      if(p.step===2&&validate(p.answers,1).length)p.step=1;
      return {project:p,changed};
    }catch(err){throw new Error(err.message||'Projektdatei konnte nicht gelesen werden.');}
  }
  function inScope(p){return p.organization==='bdkj'&&['stadt','mixed'].includes(p.region);}
  function validate(p,step){
    const errors=[];const err=(key,text)=>errors.push({key,text});
    if(!R.programs.some(x=>x.id===p.program))err('program','Bitte wählt ein Vorhaben.');
    if(!p.organization||!choices.organization.includes(p.organization))err('organization','Bitte wählt euren Antragsweg.');
    if(!p.region||!choices.region.includes(p.region))err('region','Bitte wählt die Region.');
    if(step===0||!inScope(p))return errors;
    for(const [key,values] of Object.entries(choices))if(!values.includes(p[key]))err(key,'Ungültige Auswahl. Bitte dieses Feld erneut auswählen.');
    if(!Number.isFinite(dateNumber(p.start)))err('start','Bitte ein gültiges Startdatum eintragen.');
    if(!Number.isFinite(dateNumber(p.end)))err('end','Bitte ein gültiges Enddatum eintragen.');
    if(duration(p)<0)err('end','Das Ende darf nicht vor dem Beginn liegen.');
    if(duration(p)>730)err('end','Bitte Zeitraum prüfen: maximal zwei Jahre pro Berechnung.');
    const count=(key,label,min=0,max=100000)=>{if(p[key]===''||!/^\d+$/.test(p[key])||n(p[key])<min||n(p[key])>max)err(key,label+': bitte eine ganze Zahl von '+min+' bis '+max+' eingeben.');};
    const money=(key,label)=>{if(p[key]===''||!/^\d+(\.\d{1,2})?$/.test(p[key])||n(p[key])>10000000)err(key,label+': bitte einen nichtnegativen Betrag mit höchstens zwei Nachkommastellen eingeben.');};
    if(['freizeit','international','bildung'].includes(p.program)){
      count('city',p.program==='bildung'&&p.educationKind==='aej'?'Anrechenbare angehende Jugendleitende':'Teilnehmende aus München-Stadt');
      count('land','Teilnehmende aus München-Land');count('other','Weitere Teilnehmende');count('staff','Betreuende');
      if(n(p.city)+n(p.land)+n(p.other)<1)err('city','Bitte mindestens eine teilnehmende Person eintragen.');
    }
    if(p.program==='freizeit')count('assistants','Zusätzliche notwendige Begleitpersonen');
    if(p.program==='international')count('guests','Austauschgäste');
    if(p.program==='bildung')count('units',p.unit==='session'?'Seminareinheiten':'Förderfähige Bildungstage',1,366);
    if(['international','bildung','raum','projekt'].includes(p.program)){money('costs','Förderfähige Kosten');money('income','Andere Finanzierung');}
    if(p.program==='raum')money('priorFunding','Bisherige Förderung');
    if(['freizeit','raum','projekt'].includes(p.program)&&p.submitted==='yes'){
      if(!Number.isFinite(dateNumber(p.submittedAt)))err('submittedAt','Bitte tatsächliches Einreichungsdatum eintragen.');
      else if(p.submittedAt>today())err('submittedAt','Ein bereits eingereichter Antrag kann nicht in der Zukunft liegen.');
    }
    return errors;
  }
  function deadline(p,now=today()){
    const rule=p.program==='freizeit'?R.trip:p.program==='raum'?R.room:p.program==='projekt'?R.special:null;
    if(!rule)return null;
    const due=addDays(p.end,rule.deadlineDays);if(!due)return null;
    const days=dateNumber(due)-dateNumber(now);
    const submitted=p.submitted==='yes'&&Number.isFinite(dateNumber(p.submittedAt));
    return {due,days,status:submitted?(p.submittedAt<=due?'submitted':'late'):days<0?'overdue':days===0?'today':days<=7?'soon':'open',submitted};
  }
  function calculate(p,now=today()){
    const r={status:'review',amount:null,theoretical:null,lines:[],checks:[],notes:[],errors:validate(p,1),deadline:deadline(p,now),beforeDue:p.program==='projekt'?addDays(p.start,-R.special.beforeDays):'',staff:null};
    const check=(id,label,status,detail)=>r.checks.push({id,label,status,detail});
    const note=(text)=>r.notes.push(text);
    const requirement=(id,label,value,detail)=>check(id,label,value==='yes'?'ok':value==='no'?'fail':'review',detail);
    const line=(label,count,units,rate)=>{const total=amount(count*units*rate);r.lines.push({label,count,units,rate,total});return total;};
    if(r.errors.length){r.status='invalid';return r;}
    if(!inScope(p)){r.status='outside';return r;}
    const t=n(p.city)+n(p.land)+n(p.other),nights=duration(p);
    if(p.program==='freizeit'){
      const f=R.trip,min=Math.max(1,Math.ceil(t/f.minRatio)),max=Math.max(f.minStaffAllowance,Math.floor(t/f.maxRatio)),eligible=Math.min(n(p.staff),max);
      r.staff={min,max,eligible,actual:n(p.staff),excess:Math.max(0,n(p.staff)-max)};
      check('people','Gruppengröße',t>=f.minPeople?'ok':'fail',t+' Teilnehmende (6–26 Jahre); mindestens '+f.minPeople+' erforderlich.');
      check('nights','Übernachtungen',nights>=f.minNights?'ok':'fail',nights+' Nächte; berechnet werden höchstens '+f.maxNights+'.');
      check('staff','Betreuungsschlüssel',n(p.staff)>=min?'ok':'fail',min+' Betreuende mindestens nötig, bis zu '+max+' rechnerisch anrechenbar. Das ist ein Förderschlüssel, keine allgemeine Betreuungsempfehlung.');
      requirement('juleica','Juleica für alle Betreuenden',p.juleica,'Gültige Juleicas der tatsächlich betreuenden Personen kontrollieren und Kopien im Zuschussportal beifügen.');
      requirement('clearance','Gültige Einsichtnahmebestätigungen',p.clearance,'Für alle Betreuenden: anerkannte Bestätigung, zum Veranstaltungszeitpunkt gültig (drei Jahre ab Ausstellung). Pfarrbüro hilft weiter.');
      if(n(p.city)===0)check('city','Förderanteil München-Stadt','review','Keine Teilnehmenden aus München-Stadt angegeben. Zuständigkeit München-Land klären; diese Version ist ein BDKJ-Stadt-Rechner.');
      const units=Math.min(f.maxNights,Math.max(0,nights));
      const enhanced=p.abroad==='yes'&&p.enhanced==='yes'&&nights>=f.enhancedMinNights&&nights<=f.maxNights;
      if(p.abroad==='yes'&&p.enhanced==='yes'&&!enhanced)note('Der erhöhte Satz setzt 7 bis 21 Übernachtungen voraus; hier wird nur der Grundsatz gerechnet.');
      if(p.abroad==='yes'&&p.enhanced==='unknown')check('enhanced','Internationaler Schwerpunkt','review','Vorläufig nur Grundsatz. Ein erhöhter Zuschuss setzt weitere inhaltliche Kriterien und eine Begegnung vor Ort voraus.');
      const cityRate=enhanced?f.enhancedCityRate:f.rate;
      let sum=line('Teilnehmende München-Stadt',n(p.city),units,cityRate)+line('Teilnehmende München-Land',n(p.land),units,f.rate);
      sum+=line('Betreuungsanteil Stadt',eligible*n(p.city)/t,units,cityRate)+line('Betreuungsanteil Landkreis',eligible*n(p.land)/t,units,f.rate);
      if(n(p.assistants)>0){check('assistants','Zusätzlicher Begleitbedarf','review','Die Richtlinie kann notwendige Begleitpersonen zusätzlich berücksichtigen. Zuordnung bitte klären; diese Personen sind in der Rechensumme noch nicht enthalten.');}
      if(t%f.maxRatio!==0){check('rounding','Rundung der Betreuungsobergrenze','review','1:5 ergibt keine ganze Zahl. Ehrenhub rundet die maximale Zahl vorsichtig ab (mindestens zwei). Eine andere Anerkennung bitte bestätigen lassen.');}
      if(n(p.other)>0||n(p.land)>0)note('Betreuende werden nach dem Verhältnis der Teilnehmenden zugeordnet, nicht nach ihrem eigenen Wohnort. Rechnerische Anteile bleiben ungerundet; nur Geldbeträge werden auf Cent gerundet.');
      if(n(p.land)>0)check('landRoute','Gemeinsame Stadt-/Landkreisfahrt','review','Stadt- und Landkreisanteil sind getrennt ausgewiesen. Einreichungsstelle und Weiterleitung im gemeinsamen Verfahren vorab klären; keine doppelte Förderung derselben Personen.');
      if(n(p.staff)>max)note('Zusätzliche Betreuende können mitfahren. Über der Förderobergrenze erhöhen sie die berechnete Summe nicht; Nachweise werden trotzdem für alle abgefragt.');
      note(p.onTour==='yes'?'On-Tour-Fahrt angegeben: vorrangige Finanzierung nach Richtlinie, trotzdem keine Zusage durch Ehrenhub.':'Nicht als On-Tour-Fahrt angegeben: nachrangige Verteilung verfügbarer Mittel kann die Auszahlung reduzieren.');
      note('Die Rechnung setzt voraus, dass alle gezählten Personen im angegebenen Zeitraum durchgehend teilnehmen. Bei unterschiedlicher An-/Abreise getrennte Zeitabschnitte abstimmen; Personen und Betreuung nicht doppelt zählen.');
      r.theoretical=amount(sum);
    }else if(['international','bildung'].includes(p.program)){
      const international=p.program==='international',aej=!international&&p.educationKind==='aej';
      requirement('primary','Übergeordneter Antrag',p.primary==='planned'?'unknown':p.primary,'Sach- und termingerechter Antrag '+(international?'beim BJR/KJP':'über den BDKJ-Diözesanverband')+' und Bescheide nötig. Eine selbst verschuldete Ablehnung gefährdet auch diese Förderung.');
      if(!international){requirement('local','Örtlicher Bezug / Stadtgebiet',p.local,'Träger auf Stadtebene; örtliche Voraussetzungen des gewählten Förderbereichs bestätigen lassen.');requirement('program','Fachliche Anforderungen',p.eligibleProgram,'Inhalt und Umfang müssen den fachlichen Vorgaben für JBM/AEJ entsprechen. Ehrenhub prüft kein Seminarprogramm.');}
      else {requirement('program','Anerkannte Jugendbegegnung',p.eligibleProgram,'Ein echter Jugendaustausch mit inhaltlichem Programm, keine gewöhnliche Auslandsfreizeit.');if(nights<1)check('nights','Übernachtungen','fail','Mindestens eine Übernachtung für diese übernachtungsbezogene Berechnung eintragen.');}
      const units=international?nights:n(p.units),rate=international?(p.abroad==='yes'?R.international.abroadRate:R.international.inlandRate):(p.unit==='session'?R.education.sessionRate:R.education.dayRate);
      const guests=international&&p.abroad==='no'?n(p.guests):0;
      let sum=line(aej?'Für München tätige (angehende) Jugendleitende':'Förderfähige Teilnehmende aus München',n(p.city),units,rate);
      if(guests)sum+=line('Zugeordnete Austauschgäste',guests,units,rate);
      if(!aej&&n(p.staff)>0){sum+=line('Anteilig anrechenbare Betreuung',n(p.staff)*n(p.city)/t,units,rate);note('Betreuungsanteil nach dem Verhältnis der Münchner Teilnehmenden zur entsendenden Gruppe. Abweichende Konstellationen, insbesondere bei Austauschgästen, bitte bestätigen lassen.');}
      if(aej&&n(p.staff)>0)note('Bei AEJ sind zusätzliche Seminarleitende nicht automatisch als Teilnehmende mitgerechnet. Förderfähige Personen nur einmal zählen; Status bei der Förderstelle klären.');
      if(n(p.city)===0)check('city','Förderfähiger Personenkreis','fail','Keine für diesen Förderweg anrechenbaren Teilnehmenden angegeben.');
      const deficit=Math.max(0,amount(n(p.costs)-n(p.income)));
      r.raw=amount(sum);r.deficit=deficit;r.theoretical=Math.min(r.raw,deficit);
      note('Andere Zuschüsse nur einmal bei „Andere Finanzierung“ eintragen. Den hier geschätzten BDKJ-Zuschuss dort nicht nochmals abziehen.');
      note('Einreichungsfristen des übergeordneten Antrags und der örtlichen Ergänzungsförderung separat klären. Hier gilt keine pauschal unterstellte Vier-Wochen-Frist.');
    }else if(p.program==='raum'){
      requirement('roomUse','Überwiegende Jugendverbandsnutzung',p.roomUse,'Der Raum wird überwiegend für Jugendverbandsarbeit genutzt.');
      requirement('roomPeriod','Nutzung für mindestens drei Jahre',p.roomPeriod,'Nutzungsmöglichkeit für diesen Zeitraum sicherstellen.');
      const remaining=Math.max(0,R.room.cap-n(p.priorFunding));r.remaining=remaining;
      r.theoretical=Math.min(remaining,Math.max(0,n(p.costs)-n(p.income)));
      note('Budgetrahmen, keine pauschale Auszahlung: maximal 3.000 € innerhalb von drei Jahren je Raum, abzüglich bereits erhaltener Förderung. Ehrenhub begrenzt vorsichtig auf den noch ungedeckten Kostenanteil.');
      check('roomReview','Einzelfallprüfung','review','Förderfähige Ausgaben, Dreijahreszeitraum und Nutzung mit der Geschäftsstelle abstimmen.');
    }else if(p.program==='projekt'){
      requirement('specialCriteria','Besonderes, selbstgestaltetes Vorhaben',p.specialCriteria,'Nicht laufende Gruppenarbeit, reines Unterhaltungsangebot oder Vereinsfest; junge Menschen entscheiden und gestalten selbst.');
      if(p.approvedBefore==='yes')check('prior','Vorabgenehmigung','ok','Nach eigener Angabe rechtzeitig eingereicht und genehmigt. Bestätigung aufbewahren.');
      else check('prior','Vorabgenehmigung erforderlich',now>r.beforeDue?'fail':'review','Beschreibung spätestens acht Wochen vor Projektbeginn einreichen und genehmigen lassen. Grenzfall oder verstrichene Frist: sofort Rücksprache.');
      r.theoretical=Math.min(R.special.cap,Math.max(0,n(p.costs)-n(p.income)));
      check('budget','Individuelles Projektbudget','review','Bis 4.000 €, jedoch höchstens das beschlossene Budget und anerkannte Kosten. Keine verbindliche Berechnung ohne Prüfung.');
    }
    if(r.deadline){const d=r.deadline;check('deadline','Einreichung innerhalb von vier Wochen',['overdue','late'].includes(d.status)?'fail':'ok',d.status==='submitted'?'Laut Eingabe rechtzeitig eingereicht; Inhalt und Vollständigkeit bleiben zu prüfen.':d.status==='late'?'Laut Eingabe nach der regulären Frist eingereicht. Rücksprache nötig.':'Reguläres Eingangsdatum: '+d.due+'. Keine automatisch angenommene Verlängerung an Wochenenden oder Feiertagen.');}
    r.status=r.checks.some(c=>c.status==='fail')?'blocked':r.checks.some(c=>c.status==='review')?'review':'possible';
    r.amount=r.status==='blocked'?null:amount(r.theoretical||0);
    return r;
  }
  function checklist(p){
    const trip=p.program==='freizeit',lists=['freizeit','international','bildung','projekt'].includes(p.program);
    const item=(id,text,detail='',link=null)=>({id,text,detail,link});
    const before=[item('scope','Zuständigkeit und Richtlinie prüfen','Nur den passenden Förderweg verwenden; mögliche andere Finanzierungen klären.',{label:'Offizielle Informationen',href:R.sources.overview})];
    if(trip){before.push(item('team','Betreuung und gültige Juleicas prüfen','Nachweise für alle Betreuenden vorbereiten. Fehlende Ausbildung? Der Fortbildungsfinder enthält derzeit noch Beispielangebote.',{label:'Juleica & Ausbildung',href:'#/fortbildungen?topic=leitung'}),item('clearance','Einsichtnahmebestätigungen prüfen','Bei fehlendem Nachweis in der Pfarrei / im Pfarrbüro nachfragen. Diözesane Bestätigung (oder laut Richtlinie JIZ), am Veranstaltungszeitpunkt gültig; keine Führungszeugnisse bei Ehrenhub hochladen.'));}
    if(lists)before.push(item('forms','Listen vorbereiten: Papier oder Tablet','Bekannte Angaben, etwa bei jüngeren Kindern, vorab eintragen. Unterschriften erst persönlich ergänzen. Seite 2 für weitere Personen mehrfach verwenden. Digitale Unterschriften nur im von der Förderstelle akzeptierten Verfahren.'));
    if(['international','bildung'].includes(p.program))before.push(item('primary','Übergeordneten Antrag und dessen Fristen klären','Voranträge können nötig sein. Erwarteten Ergänzungszuschuss bei der Finanzierung angeben.',{label:'BDKJ: Formulare & Beratung',href:R.sources.education}));
    if(p.program==='raum')before.push(item('photos','Raumnutzung und Ausgangszustand dokumentieren','Vorher-Fotos, Lageplan, Angebote und bisherige Raumförderung sammeln.'));
    if(p.program==='projekt')before.push(item('approval','Projektbeschreibung rechtzeitig genehmigen lassen','Spätestens acht Wochen vor Projektbeginn; Zustimmung dokumentieren.'));
    const during=[];
    if(lists)during.push(item('signatures','Listen mitnehmen und persönlich unterschreiben lassen','Vollständige Anschriften, Alter bei Beginn und gegebenenfalls Wohnort-Zuordnung kontrollieren. Bei Papier Reserveblätter, am Tablet geladene Datei und Stift bereithalten.'),item('secure','Listen geschützt aufbewahren','Nur zweckgebunden bearbeiten; Zugriff und Gerätesperre beachten. PDFs können je nach verwendeter App auch in deren Cloud landen.'));
    if(!trip)during.push(item('evidence','Programm, Belege und Dokumentation sammeln',p.program==='raum'?'Nachher-Fotos und Belege eindeutig zuordnen.':'Vorgaben des Förderbereichs beachten; bei Bildungsmaßnahmen Programm und Zeitumfang dokumentieren.'));
    const after=[item('complete','Unterlagen auf Vollständigkeit prüfen',trip?'Unterschriebene Listen, Juleica-Kopien und gültige Einsichtnahmebestätigungen beifügen.':'Alle geforderten Nachweise, gegebenenfalls Bescheide und Verwendungsnachweis ergänzen.')];
    if(p.program==='freizeit'&&p.abroad==='yes'&&p.enhanced==='yes')after.push(item('enhanced-docs','Nachweis zum internationalen Schwerpunkt klären','Programmbeschreibung und Begegnung dokumentieren; benötigten Sachbericht vorab mit der Förderstelle abstimmen.'));
    after.push(item('submit',trip||['raum','projekt'].includes(p.program)?'Vollständigen Antrag binnen vier Wochen einreichen':'Antrag innerhalb der bestätigten Frist einreichen','Eingang bei der zuständigen Stelle zählt, nicht das Erstellen in Ehrenhub.',{label:'Zum Zuschussportal (Login)',href:R.sources.portal}),item('backup','Eingangsbestätigung und lokale Sicherung behalten','Antrag und Unterlagen sicher ablegen. Status und Rückfragen im offiziellen Portal verfolgen.'));
    return [{id:'before',title:'Vor dem Event',icon:'calendar',items:before},{id:'during',title:'Währenddessen',icon:'users',items:during},{id:'after',title:'Danach',icon:'checkCircle',items:after}];
  }
  function demo(){const p=makeProject();p.step=1;Object.assign(p.answers,{organization:'bdkj',region:'stadt',program:'freizeit',name:'Beispiel: Hüttenwochenende',start:addDays(today(),30),end:addDays(today(),32),city:'30',staff:'6',juleica:'yes',clearance:'yes'});return p;}
  return {rules:R,defaults,numbers,choices,makeProject,restore,inScope,validate,calculate,checklist,deadline,dateNumber,addDays,duration,today,demo,amount};
});
