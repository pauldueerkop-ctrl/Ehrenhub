/* Browser events only. Domain calculations remain independently testable. */
(function(root){
  'use strict';
  const M=root.EH.FundingModel,V=root.EH.FundingView;
  function create({storage,toast=()=>{},speak=()=>{}}){
    let project=M.makeProject(),preset=null;const ui={errors:[],message:''};
    const saved=storage.read('fundingPlan',null);
    if(saved){try{const restored=M.restore(saved);project=restored.project;if(restored.changed)ui.message='Die Richtlinie wurde aktualisiert. Bitte Angaben und Voraussetzungen neu prüfen.';}catch{ui.message='Der gespeicherte Fördercheck ist nicht lesbar. Ein neuer Entwurf wurde geöffnet.';}}
    function persist(){if(!storage.write('fundingPlan',project))ui.message='Speichern im Browser ist blockiert. Bitte das Projekt als JSON sichern, bevor du die Seite schließt.';}
    function render(route){
      const key=route?.query?.get('type')||'';
      if(key&&key!==preset&&M.rules.programs.some(x=>x.id===key)){project.answers.program=key;project.step=0;project.checks={};preset=key;}
      return V.render(project,ui);
    }
    function repaint(focus=false){
      const container=document.getElementById('funding-assistant');if(!container)return;
      const active=document.activeElement,activeId=active?.id,radio=active?.type==='radio'?active.value:null;
      container.outerHTML=render();
      if(focus){const target=document.getElementById('fg-title');target?.focus({preventScroll:true});target?.scrollIntoView({block:'start',behavior:'smooth'});}
      else if(activeId)document.getElementById(activeId)?.focus({preventScroll:true});
      else if(radio&&M.choices.program.includes(radio))document.querySelector('#funding-assistant input[name="fg-program"][value="'+radio+'"]')?.focus({preventScroll:true});
    }
    function collect(){document.querySelectorAll('#funding-assistant [data-fg-field]').forEach(el=>{if(el.type==='radio'&&!el.checked)return;set(el.dataset.fgField,el.value);});}
    function set(key,value){if(!Object.hasOwn(M.defaults,key))return;if(project.answers[key]!==value){project.answers[key]=String(value).slice(0,key==='name'?120:40);project.checks={};ui.errors=[];ui.message='';}persist();}
    function saveBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
    function next(){
      collect();ui.errors=M.validate(project.answers,project.step===0?0:1);
      if(ui.errors.length){repaint();document.getElementById('fg-'+ui.errors[0].key)?.focus();return;}
      project.step=project.step===0?(M.inScope(project.answers)?1:2):2;persist();repaint(true);
      if(project.step===2&&M.inScope(project.answers)){
        const r=M.calculate(project.answers);speak(r.status==='blocked'?'Hier sind noch Voraussetzungen offen. Schau dir die markierten Punkte an.':'Ein Rechenwert ist noch keine Zusage. Die Frist und eure Unterlagen sind mindestens genauso wichtig.');
      }
    }
    function reset(){project=M.makeProject();preset=null;ui.errors=[];ui.message='';}
    function handleClick(event){
      const target=event.target instanceof Element?event.target:null;if(!target)return false;
      const error=target.closest('[data-fg-error]');if(error){event.preventDefault();document.getElementById('fg-'+error.dataset.fgError)?.focus();return true;}
      const button=target.closest('[data-fg-action]');if(!button)return false;event.preventDefault();
      const action=button.dataset.fgAction;
      if(action==='next')next();
      if(action==='back'||action==='edit'){collect();project.step=action==='edit'?1:0;ui.errors=[];persist();repaint(true);}
      if(action==='demo'){if((project.answers.name||project.step>0)&&!window.confirm('Aktuellen Fördercheck durch das Beispiel ersetzen? Vorher bei Bedarf als JSON sichern.'))return true;project=M.demo();ui.errors=[];ui.message='Beispieldaten – bitte durch eure echten Projektdaten ersetzen.';persist();repaint(true);}
      if(action==='reset'){if(!window.confirm('Diesen Fördercheck einschließlich Häkchen zurücksetzen? Andere Ehrenhub-Daten bleiben erhalten.'))return true;reset();persist();repaint(true);}
      if(action==='export'){collect();saveBlob(new Blob([JSON.stringify(project,null,2)],{type:'application/json'}),'Ehrenhub-Foerdercheck.json');toast('Projektdatei vorbereitet. Sie enthält eure Angaben und Häkchen, keine Förderzusage.');}
      if(action==='print'&&project.step===2)window.print();
      if(action==='download'){
        const f=(root.EH.Data.fundingForms||[]).find(f=>f.id===button.dataset.formId);
        if(!f?.base64){toast('Formular nicht verfügbar. Bitte die offizielle Quelle verwenden.');return true;}
        try{const bytes=Uint8Array.from(atob(f.base64),c=>c.charCodeAt(0));saveBlob(new Blob([bytes],{type:'application/pdf'}),f.file);}catch{toast('PDF konnte nicht geöffnet werden. Nutze bitte den Link zur offiziellen Quelle.');}
      }
      return true;
    }
    function handleInput(event){const el=event.target;if(!el.dataset?.fgField)return false;if(el.type!=='radio')set(el.dataset.fgField,el.value);return true;}
    function handleChange(event){
      const el=event.target;
      if(el.dataset?.fgField){set(el.dataset.fgField,el.value);if(el.tagName==='SELECT'||el.type==='radio')repaint();return true;}
      if(el.dataset?.fgCheck){const allowed=M.checklist(project.answers).flatMap(g=>g.items).some(c=>c.id===el.dataset.fgCheck);if(allowed){if(el.checked)project.checks[el.dataset.fgCheck]=true;else delete project.checks[el.dataset.fgCheck];persist();el.closest('.fg-todo')?.classList.toggle('done',el.checked);const progress=document.getElementById('fg-progress');if(progress)progress.textContent=V.progress(project.answers,project);}return true;}
      if(el.dataset&&Object.hasOwn(el.dataset,'fgImport')){importFile(el);return true;}
      return false;
    }
    async function importFile(el){
      const file=el.files?.[0];if(!file)return;
      try{
        if(file.size>100000)throw new Error('Projektdatei ist zu groß (maximal 100 KB).');
        const result=M.restore(await file.text());
        if(!window.confirm('Aktuellen Fördercheck durch diese Projektdatei ersetzen?'))return;
        project=result.project;preset=null;ui.errors=[];ui.message=result.changed?'Projekt geladen. Die Richtlinie hat sich geändert – bitte erneut prüfen.':'Projekt geladen. Die Berechnung wird mit dem heutigen Datum neu geprüft.';persist();repaint(true);
      }catch(err){toast(err.message||'Projektdatei ist ungültig.');}finally{el.value='';}
    }
    function handleSubmit(event){if(!event.target.hasAttribute?.('data-fg-form'))return false;event.preventDefault();next();return true;}
    return {render,handleClick,handleInput,handleChange,handleSubmit,reset};
  }
  root.EH.FundingController={create};
})(globalThis);
