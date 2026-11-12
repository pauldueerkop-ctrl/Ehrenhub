/* Optional local progress. No networking, credentials or certificate uploads. */
(function(root){
  'use strict';
  const {TrainingModel:M,TrainingView:V,Data:D}=root.EH;
  function create({storage,toast,speak,state}){
    let p=M.project(),saved=false,message='',errors=[],route={query:new URLSearchParams()};
    const raw=storage.read('learningPath','null');
    if(raw!=='null')try{const restored=M.restore(raw);p=restored.project;saved=true;if(restored.changed)message='Die Orientierung wurde aktualisiert. Bitte deinen Lernweg neu prüfen.';}catch{message='Die gespeicherte Auswahl war nicht lesbar. Andere Ehrenhub-Daten bleiben erhalten.';}
    const flags=()=>({saved,message,errors});
    function persist(){if(saved&&!storage.write('learningPath',p)){message='Speichern im Browser ist blockiert. Deine Auswahl bleibt nur in dieser Sitzung.';toast(message);}}
    function render(r){route=r;const goal=r.query.get('goal');if(M.choices.goal.includes(goal)&&goal&&p.answers.goal!==goal){p.answers.goal=goal;p.step=1;errors=[];persist();}return V.render(p,r,state,flags());}
    function repaint(focus=true){const el=document.getElementById('tf-root');if(!el)return;el.outerHTML=V.render(p,route,state,flags());if(focus){const h=document.getElementById('tf-focus-title')||document.getElementById('tf-root');h?.setAttribute('tabindex','-1');h?.focus({preventScroll:true});h?.scrollIntoView({block:'start',behavior:'smooth'});}}
    function updateQuery(values){const q=new URLSearchParams(route.query);for(const[k,v]of Object.entries(values))if(!v||v==='alle')q.delete(k);else q.set(k,v);q.set('view','angebote');const hash='#/fortbildungen?'+q.toString();try{history.replaceState(null,'',hash);route=root.EH.Core.parseRoute(hash);}catch{location.hash=hash;}const el=document.getElementById('course-results');if(el)el.innerHTML=V.courseResults(Object.fromEntries(q),state);}
    function download(body,type,name){const url=URL.createObjectURL(new Blob([body],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
    function next(){errors=M.validate(p.answers);if(errors.length){repaint(false);document.getElementById('tf-errors')?.scrollIntoView({block:'center',behavior:'smooth'});return;}p.step=2;persist();repaint();speak('Du musst nicht alles auf einmal machen. Nimm dir den nächsten offenen Schritt vor.');}
    function handleClick(event){const el=event.target instanceof Element?event.target:null;if(!el)return false;const goal=el.closest('[data-tf-goal]');if(goal){event.preventDefault();const value=goal.dataset.tfGoal;if(!M.choices.goal.includes(value)||!value)return true;p.answers.goal=value;p.step=1;errors=[];persist();route=root.EH.Core.parseRoute('#/fortbildungen?goal='+value);try{history.replaceState(null,'','#/fortbildungen?goal='+value);}catch{}repaint();return true;}
      const cal=el.closest('[data-tf-calendar]');if(cal){event.preventDefault();const c=D.courses.find(c=>c.id===cal.dataset.tfCalendar);if(c){download(M.calendar(c),'text/calendar;charset=utf-8',c.id+'.ics');toast('Kalendermerker erstellt – das ist keine Kursanmeldung.');}return true;}
      const button=el.closest('[data-tf-action]');if(!button)return false;event.preventDefault();switch(button.dataset.tfAction){
        case'goals':p.step=0;route=root.EH.Core.parseRoute('#/fortbildungen');try{history.replaceState(null,'','#/fortbildungen');}catch{}persist();repaint();break;
        case'resume':p.step=p.answers.goal?2:0;if(M.validate(p.answers).length)p.step=1;persist();repaint();break;
        case'edit':p.step=1;errors=[];persist();repaint();break;
        case'next':next();break;
        case'export':if(p.answers.goal){download(JSON.stringify(p,null,2),'application/json','Ehrenhub-Lernweg.json');toast('Lernweg gesichert. Die Datei enthält deine Auswahl und gegebenenfalls ein Kursdatum.');}break;
        case'print':window.print();break;
        case'reset':if(window.confirm('Nur deinen Lernweg zurücksetzen? Merkliste, Schichtplan und Fördercheck bleiben erhalten.')){reset();storage.write('learningPath',null);route=root.EH.Core.parseRoute('#/fortbildungen');try{history.replaceState(null,'','#/fortbildungen');}catch{}repaint();toast('Lernweg zurückgesetzt.');}break;
        case'clear-filters':route=root.EH.Core.parseRoute('#/fortbildungen?view=angebote');try{history.replaceState(null,'','#/fortbildungen?view=angebote');}catch{}repaint();break;
        case'clear-block':updateQuery({block:''});repaint(false);break;
      }return true;
    }
    function setAnswer(el){const key=el.dataset.tfField;if(!Object.hasOwn(M.defaults,key))return;if(M.choices[key]&&!M.choices[key].includes(el.value))return;p.answers[key]=el.value;if(key==='firstAid'&&el.value!=='yes'){p.answers.firstAidDate='';const date=document.getElementById('tf-aid-date');if(date)date.value='';}if(key==='firstAid'){const box=document.getElementById('tf-first-aid-date');if(box)box.hidden=el.value!=='yes';}errors=[];persist();}
    function handleInput(event){const el=event.target;if(el.hasAttribute?.('data-tf-search')){updateQuery({q:el.value});return true;}if(el.dataset?.tfField){if(el.type!=='radio')setAnswer(el);return true;}return false;}
    async function importFile(el){const file=el.files?.[0];if(!file)return;try{if(file.size>20000)throw Error('Die Datei ist zu groß. Erwartet wird eine kleine Ehrenhub-Lernweg-JSON-Datei.');const next=M.restore(await file.text());if(p.answers.goal&&!window.confirm('Deinen aktuellen Lernweg durch die Datei ersetzen?'))return;p=next.project;errors=[];message=next.changed?'Datei geöffnet. Regeln wurden aktualisiert; bitte Angaben prüfen.':'Lernweg geöffnet. Keine Anmeldung bei einem Anbieter erfolgt.';route=root.EH.Core.parseRoute('#/fortbildungen');try{history.replaceState(null,'','#/fortbildungen');}catch{}persist();repaint();toast(message);}catch(error){toast(error.message);}finally{el.value='';}}
    function handleChange(event){const el=event.target;if(el.hasAttribute?.('data-tf-import')){void importFile(el);return true;}if(el.hasAttribute?.('data-tf-save')){saved=el.checked;if(saved){persist();if(storage.available)message='Dein Lernweg wird nur in diesem Browser gespeichert.';}else{const cleared=storage.write('learningPath',null);message=cleared?'Speichern ausgeschaltet. Die gespeicherte Auswahl wurde entfernt.':'Speicherung konnte nicht entfernt werden. Bitte die Website-Daten in deinem Browser löschen.';}repaint(false);return true;}if(el.dataset?.tfField){setAnswer(el);return true;}if(el.dataset?.tfFilter){updateQuery({[el.dataset.tfFilter]:el.type==='checkbox'?(el.checked?'yes':''):el.value});return true;}return false;}
    function handleSubmit(event){if(!event.target.hasAttribute?.('data-tf-form'))return false;event.preventDefault();next();return true;}
    function reset(){p=M.project();saved=false;message='';errors=[];}
    return {render,handleClick,handleInput,handleChange,handleSubmit,reset,get saved(){return saved;}};
  }
  root.EH.TrainingController={create};
})(globalThis);
