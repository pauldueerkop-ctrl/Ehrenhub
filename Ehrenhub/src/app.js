/* Thin browser controller: routes, DOM events and optional local persistence. */
(function(){
  'use strict';
  const {Data:D,Core:C,Views:V,Icons:{icon:I}}=globalThis.EH;
  const index=C.makeSearchIndex(D);
  const PREFIX='ehrenhub.v1.';
  let storageAvailable=true;
  const read=(key,fallback)=>{try{return localStorage.getItem(PREFIX+key)??fallback;}catch{storageAvailable=false;return fallback;}};
  const readObject=(key,validKeys,validValue)=>{
    try{const data=JSON.parse(read(key,'{}'));if(!data||Array.isArray(data)||typeof data!=='object')return {};
      return Object.fromEntries(Object.entries(data).filter(([k,v])=>validKeys.has(k)&&validValue(v)));
    }catch{return {};}
  };
  const checkKeys=new Set(D.articles.flatMap(a=>a.sections.flatMap((s,si)=>(s.checklist||[]).map((_,ci)=>a.id+':'+si+':'+ci))));
  const state={
    bookmarks:C.readBookmarks(read('bookmarks','[]'),index),
    checks:readObject('checks',checkKeys,v=>v===true),
    feedback:readObject('feedback',new Set(D.articles.map(a=>a.id)),v=>v==='yes'||v==='no'),
    hubiHidden:read('hubiHidden','false')==='true',
    wizardStep:0,grantAnswers:{region:'',project:'',stage:''},sosTab:'sorge',petCount:0
  };
  const main=document.getElementById('main');
  const header=document.getElementById('header-root');
  const footer=document.getElementById('footer-root');
  const hubi=document.getElementById('hubi');
  const searchDialog=document.getElementById('search-dialog');
  const searchInput=document.getElementById('quick-search');
  const searchBody=document.getElementById('quick-search-results');
  const infoDialog=document.getElementById('info-dialog');
  const toastElement=document.getElementById('toast');
  let toastTimer,bubbleTimer,petTimer,scrollFrame;
  let route=C.parseRoute(location.hash);
  let initialRender=true;
  let storageWarningShown=false;

  function toast(text){
    clearTimeout(toastTimer);toastElement.textContent=text;toastElement.classList.add('visible');
    toastTimer=setTimeout(()=>toastElement.classList.remove('visible'),3600);
  }
  function persist(key,value){
    try{localStorage.setItem(PREFIX+key,JSON.stringify(value));return true;}
    catch{storageAvailable=false;if(!storageWarningShown){storageWarningShown=true;toast('Dein Browser blockiert die Speicherung. Die Auswahl bleibt nur bis zum Neuladen.');}return false;}
  }
  function titleFor(r){
    if(r.id){const collection=r.page==='wiki'?D.articles:r.page==='fortbildungen'?D.courses:r.page==='antraege'?D.grants:[];return collection.find(x=>x.id===r.id)?.title||'Seite nicht gefunden';}
    return {home:'Weniger suchen. Mehr bewegen.',wiki:'Wiki & How-tos',antraege:'Antragsfinder',fortbildungen:'Fortbildungsfinder',sos:'PSG & SOS – Unterstützung finden',merkliste:'Deine Merkliste',suche:'Suche'}[r.page]||'Seite nicht gefunden';
  }
  function closeDialog(dialog){if(dialog.open)dialog.close();}
  function render(){
    route=C.parseRoute(location.hash);
    closeDialog(searchDialog);closeDialog(infoDialog);
    main.innerHTML=V.main(route,state,index);
    header.innerHTML=V.header(route,state);
    footer.innerHTML=V.footer();
    if(!hubi.innerHTML)hubi.innerHTML=V.hubi();
    syncHubi();
    document.title=titleFor(route)+' · Ehrenhub';
    document.body.dataset.page=route.page;
    updateChecklistProgress();
    window.scrollTo({top:0,behavior:'instant'});
    if(!initialRender)main.focus({preventScroll:true});
    initialRender=false;
    updateReadingProgress();
  }
  function queryValues(){return Object.fromEntries(route.query.entries());}
  function updateQuery(changes){
    const q=new URLSearchParams(route.query);
    for(const [key,value] of Object.entries(changes)){
      if(!value||value==='alle'||(key==='sort'&&value==='datum'))q.delete(key);else q.set(key,value);
    }
    const hash='#/'+(route.page==='home'?'':route.page)+(route.id?'/'+route.id:'')+(q.size?'?'+q.toString():'');
    try{history.replaceState(null,'',hash);route=C.parseRoute(hash);}catch{location.hash=hash;}
  }
  function updateWiki(){
    const filters={category:route.query.get('category')||'alle',q:route.query.get('q')||''};
    const target=document.getElementById('wiki-results');if(target)target.innerHTML=V.wikiResults(filters,state);
    document.querySelectorAll('[data-wiki-category]').forEach(el=>{const active=el.dataset.wikiCategory===filters.category;el.classList.toggle('selected',active);el.setAttribute('aria-pressed',String(active));});
  }
  function updateCourses(){
    const filters=queryValues();const target=document.getElementById('course-results');if(target)target.innerHTML=V.courseResults(filters,state);
    document.querySelectorAll('[data-course-topic]').forEach(el=>{const active=el.dataset.courseTopic===(filters.topic||'alle');el.classList.toggle('selected',active);el.setAttribute('aria-pressed',String(active));});
  }
  function updateSearchPage(){
    const target=document.getElementById('page-search-results');if(target)target.innerHTML=V.searchResults(route.query.get('q')||'',index,route.query.get('kind')||'alle');
    document.querySelectorAll('[data-search-kind]').forEach(el=>{const active=el.dataset.searchKind===(route.query.get('kind')||'alle');el.classList.toggle('selected',active);el.setAttribute('aria-pressed',String(active));});
  }
  function updateQuickSearch(){
    const q=searchInput.value.trim();
    if(q)searchBody.innerHTML=V.searchResults(q,index,'alle',true);
    else{
      const popular=['wiki:erste-gruppenstunde','wiki:juleica','antrag:freizeit-stadt','sos'];
      searchBody.innerHTML='<p class="eyebrow">Gute Ausgangspunkte</p>'+V.searchResults('',index.filter(item=>popular.includes(item.key)),'alle',true);
    }
  }
  function openSearch(initial=''){
    closeDialog(infoDialog);searchInput.value=initial;updateQuickSearch();
    if(!searchDialog.open)searchDialog.showModal();
    searchInput.focus();
  }
  function openInfo(type='about'){
    closeDialog(searchDialog);
    document.getElementById('info-content').innerHTML=V.modalContent(type,state);
    if(!infoDialog.open)infoDialog.showModal();
  }
  function updateBookmarkButtons(){
    document.querySelectorAll('[data-bookmark]').forEach(button=>{
      const saved=state.bookmarks.includes(button.dataset.bookmark);
      button.classList.toggle('is-saved',saved);button.setAttribute('aria-pressed',String(saved));
      button.setAttribute('aria-label',saved?'Aus Merkliste entfernen':'In Merkliste speichern');
      if(button.classList.contains('bookmark-full'))button.innerHTML=I('bookmark')+'<span>'+(saved?'Gemerkt':'Merken')+'</span>';
    });
    document.querySelectorAll('.bookmark-count').forEach(el=>{el.textContent=state.bookmarks.length;el.classList.toggle('is-empty',state.bookmarks.length===0);});
  }
  function toggleBookmark(key){
    if(!index.some(item=>item.key===key&&item.kind!=='sos'))return;
    state.bookmarks=C.toggleBookmark(state.bookmarks,key);
    const saved=state.bookmarks.includes(key);
    const stored=persist('bookmarks',state.bookmarks);
    if(route.page==='merkliste'){main.innerHTML=V.main(route,state,index);main.focus({preventScroll:true});}
    updateBookmarkButtons();
    if(stored)toast(saved?'Gemerkt. Du findest den Inhalt in deiner Merkliste.':'Aus deiner Merkliste entfernt.');
  }
  function updateChecklistProgress(){
    document.querySelectorAll('[data-progress-for]').forEach(el=>{
      const keys=[...checkKeys].filter(key=>key.startsWith(el.dataset.progressFor+':'));
      el.textContent=keys.filter(key=>state.checks[key]).length+' von '+keys.length+' erledigt';
    });
  }
  function updateReadingProgress(){
    const bar=document.getElementById('reading-progress');if(!bar)return;
    const body=document.querySelector('.article-content');if(!body)return;
    const rect=body.getBoundingClientRect();const available=Math.max(1,rect.height-window.innerHeight+160);
    const progress=Math.min(100,Math.max(0,(100-rect.top)/available*100));bar.style.width=progress+'%';
  }
  function renderWizard(focus=true){
    const target=document.getElementById('wizard-container');if(!target)return;
    target.classList.remove('show-results');target.innerHTML=V.grantWizard(state);
    if(focus){const heading=document.getElementById('wizard-title');heading.focus({preventScroll:true});heading.scrollIntoView({block:'nearest',behavior:'smooth'});}
  }
  function nextWizard(){
    const q=V.grantQuestions[state.wizardStep];if(!q.options.some(option=>option[0]===state.grantAnswers[q.key]))return;
    if(state.wizardStep<2){state.wizardStep++;renderWizard();}
    else if(C.validGrantAnswers(state.grantAnswers)){
      const params=new URLSearchParams(state.grantAnswers);location.hash='/antraege?'+params.toString();
    }
  }
  function setSosTab(id,focus=false){
    if(!['sorge','anvertraut','selbst'].includes(id))return;
    state.sosTab=id;
    document.querySelectorAll('[data-sos-tab]').forEach(el=>{const selected=el.dataset.sosTab===id;el.setAttribute('aria-selected',String(selected));el.tabIndex=selected?0:-1;el.classList.toggle('selected',selected);if(selected&&focus)el.focus();});
    const panel=document.getElementById('sos-panel');panel.innerHTML=V.sosSituation(id);panel.setAttribute('aria-labelledby','sos-tab-'+id);
  }
  function syncHubi(){hubi.hidden=state.hubiHidden||route.page==='sos';}
  function bubble(text,duration=3500){const el=document.getElementById('hubi-bubble');if(!el||hubi.hidden)return;clearTimeout(bubbleTimer);el.textContent=text;el.classList.add('visible');bubbleTimer=setTimeout(()=>el.classList.remove('visible'),duration);}
  function pet(){
    state.petCount++;clearTimeout(petTimer);
    hubi.classList.remove('is-petted');void hubi.offsetWidth;hubi.classList.add('is-petted');
    const phrases=['Das ist genau meine Art von Ehrenamt. ♡','Ein gutes Team braucht auch Streicheleinheiten.','Wuff. Du machst das gut.','Okay, noch einmal. Nur einmal.','Fünf Streicheleinheiten! Du bist jetzt offiziell mein Lieblingsmensch.'];
    bubble(phrases[(state.petCount-1)%phrases.length],4000);
    petTimer=setTimeout(()=>hubi.classList.remove('is-petted'),1900);
  }
  function exportSaved(){
    const items=state.bookmarks.map(key=>index.find(x=>x.key===key)).filter(Boolean);
    const lines=['EHRENHUB – DEINE MERKLISTE','Lokaler Prototyp · Beispielinhalte','',...items.flatMap(item=>[
      item.title,item.label,item.summary,'Lokale Unterseite: '+item.href,''])];
    const blob=new Blob(['\uFEFF'+lines.join('\n')],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='Ehrenhub-Merkliste.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast('Deine Merkliste wurde als Textdatei vorbereitet.');
  }
  function resetData(){
    const keys=['bookmarks','checks','feedback','hubiHidden'];let cleared=true;
    for(const key of keys){try{localStorage.removeItem(PREFIX+key);}catch{cleared=false;}}
    state.bookmarks=[];state.checks={};state.feedback={};state.hubiHidden=false;state.petCount=0;
    closeDialog(infoDialog);render();toast(cleared?'Deine lokalen Ehrenhub-Daten wurden zurückgesetzt.':'Ansicht zurückgesetzt. Dein Browser erlaubt gerade keinen Zugriff auf gespeicherte Daten.');
  }
  const actions={
    search:()=>openSearch(),about:()=>openInfo('about'),privacy:()=>openInfo('privacy'),
    'modal-close':()=>closeDialog(infoDialog),'search-close':()=>closeDialog(searchDialog),
    menu:()=>{const menu=document.getElementById('mobile-nav');const btn=document.querySelector('[data-action="menu"]');menu.hidden=!menu.hidden;btn.setAttribute('aria-expanded',String(!menu.hidden));btn.setAttribute('aria-label',menu.hidden?'Menü öffnen':'Menü schließen');btn.innerHTML=I(menu.hidden?'menu':'close');},
    'wiki-reset':()=>{updateQuery({q:'',category:''});document.getElementById('wiki-search').value='';updateWiki();},
    'course-reset':()=>{updateQuery({q:'',topic:'',duration:'',format:'',sort:''});document.getElementById('course-search').value='';document.querySelectorAll('[data-course-filter]').forEach(el=>el.value=el.dataset.courseFilter==='sort'?'datum':'alle');updateCourses();},
    'wizard-next':nextWizard,
    'wizard-back':()=>{if(state.wizardStep>0){state.wizardStep--;renderWizard();}},
    'wizard-reset':()=>{state.grantAnswers={region:route.query.get('region')||'',project:route.query.get('project')||'',stage:route.query.get('stage')||''};state.wizardStep=0;updateQuery({region:'',project:'',stage:''});renderWizard();},
    print:()=>window.print(),
    'export-saved':exportSaved,'clear-saved':()=>openInfo('clear-saved'),
    'confirm-clear':()=>{state.bookmarks=[];const stored=persist('bookmarks',[]);closeDialog(infoDialog);render();if(stored)toast('Deine Merkliste ist wieder leer.');},
    'reset-data':()=>openInfo('reset-confirm'),'confirm-reset':resetData,
    'hubi-hide':()=>{state.hubiHidden=true;const stored=persist('hubiHidden',true);syncHubi();if(stored)toast('Hubi macht Pause. Unten im Footer kannst du ihn wieder wecken.');},
    'hubi-show':()=>{state.hubiHidden=false;persist('hubiHidden',false);syncHubi();if(route.page==='sos')toast('Hubi wartet auf den anderen Seiten.');else bubble('Wieder da! Und immer für dich im Team.',4000);},
    pet,
    'quick-exit':()=>{state.sosTab='sorge';location.replace('#/');}
  };
  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;if(!target)return;
    if(target.closest('.skip-link')){event.preventDefault();main.focus({preventScroll:true});main.scrollIntoView({block:'start',behavior:'smooth'});return;}
    const bookmarkButton=target.closest('[data-bookmark]');if(bookmarkButton){event.preventDefault();toggleBookmark(bookmarkButton.dataset.bookmark);return;}
    const action=target.closest('[data-action]');if(action){const fn=actions[action.dataset.action];if(fn){event.preventDefault();fn();}return;}
    const wiki=target.closest('[data-wiki-category]');if(wiki){updateQuery({category:wiki.dataset.wikiCategory});updateWiki();return;}
    const topic=target.closest('[data-course-topic]');if(topic){updateQuery({topic:topic.dataset.courseTopic});updateCourses();return;}
    const kind=target.closest('[data-search-kind]');if(kind){updateQuery({kind:kind.dataset.searchKind});updateSearchPage();return;}
    const section=target.closest('[data-scroll-section]');if(section){const el=document.getElementById(section.dataset.scrollSection);if(el){el.scrollIntoView({behavior:'smooth',block:'start'});const heading=el.querySelector('h2');heading.tabIndex=-1;heading.focus({preventScroll:true});}return;}
    const feedback=target.closest('[data-feedback]');if(feedback){const id=feedback.dataset.article;state.feedback[id]=feedback.dataset.feedback;const stored=persist('feedback',state.feedback);document.querySelectorAll('[data-feedback]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.article===id&&el.dataset.feedback===state.feedback[id])));if(stored)toast('Danke! Dein Feedback ist für diese Demo nur auf diesem Gerät gespeichert.');return;}
    const tab=target.closest('[data-sos-tab]');if(tab){setSosTab(tab.dataset.sosTab);return;}
    const link=target.closest('a[href^="#/"]');if(link){closeDialog(searchDialog);closeDialog(infoDialog);const mobile=document.getElementById('mobile-nav');if(mobile)mobile.hidden=true;if(route.page==='sos')state.sosTab='sorge';}
  });
  document.addEventListener('submit',event=>{
    const form=event.target;
    if(form.matches('[data-form="hero-search"]')){event.preventDefault();const q=new FormData(form).get('q').trim();if(q)location.hash='/suche?q='+encodeURIComponent(q);}
    else if(form.id==='quick-search-form'){event.preventDefault();const q=searchInput.value.trim();closeDialog(searchDialog);location.hash='/suche'+(q?'?q='+encodeURIComponent(q):'');}
  });
  document.addEventListener('input',event=>{
    const el=event.target;
    if(el===searchInput){updateQuickSearch();return;}
    if(el.dataset.search==='wiki'){updateQuery({q:el.value});updateWiki();}
    if(el.dataset.search==='course'){updateQuery({q:el.value});updateCourses();}
    if(el.dataset.search==='global'){updateQuery({q:el.value});updateSearchPage();}
  });
  document.addEventListener('change',event=>{
    const el=event.target;
    if(el.dataset.check&&checkKeys.has(el.dataset.check)){if(el.checked)state.checks[el.dataset.check]=true;else delete state.checks[el.dataset.check];persist('checks',state.checks);el.closest('.checklist-item').classList.toggle('done',el.checked);updateChecklistProgress();}
    if(el.dataset.grantAnswer){const question=V.grantQuestions[state.wizardStep];if(el.dataset.grantAnswer===question.key&&question.options.some(o=>o[0]===el.value)){state.grantAnswers[question.key]=el.value;document.querySelectorAll('.wizard-option').forEach(label=>label.classList.toggle('selected',label.querySelector('input').checked));document.getElementById('wizard-next').disabled=false;}}
    if(el.dataset.courseFilter){updateQuery({[el.dataset.courseFilter]:el.value});updateCourses();if(el.dataset.courseFilter==='sort')document.getElementById('course-sort').focus();}
  });
  document.addEventListener('keydown',event=>{
    const target=event.target;const editing=target instanceof Element&&(target.matches('input,textarea,select')||target.isContentEditable);
    if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(searchDialog.open)closeDialog(searchDialog);else openSearch();return;}
    if(event.key==='/'&&!editing&&!infoDialog.open&&!searchDialog.open){event.preventDefault();openSearch();return;}
    if(searchDialog.open){
      const links=[...searchBody.querySelectorAll('[data-search-result]')];
      if(event.key==='ArrowDown'||event.key==='ArrowUp'){
        if(!links.length)return;event.preventDefault();const i=links.indexOf(document.activeElement);
        if(event.key==='ArrowDown')links[(i+1)%links.length].focus();else if(i<=0)searchInput.focus();else links[i-1].focus();
      }
    }
    if(target instanceof Element&&target.matches('[data-sos-tab]')&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)){
      event.preventDefault();const ids=['sorge','anvertraut','selbst'];const at=ids.indexOf(state.sosTab);const next=event.key==='Home'?0:event.key==='End'?2:(at+(['ArrowRight','ArrowDown'].includes(event.key)?1:2))%3;setSosTab(ids[next],true);
    }
    if(event.key==='Escape'){const menu=document.getElementById('mobile-nav');if(menu&&!menu.hidden){menu.hidden=true;const btn=document.querySelector('[data-action="menu"]');btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-label','Menü öffnen');btn.innerHTML=I('menu');btn.focus();}}
  });
  [searchDialog,infoDialog].forEach(dialog=>{
    // Only a pointer released outside the dialog box closes the backdrop.
    dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
  });
  window.addEventListener('hashchange',render);
  window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{updateReadingProgress();scrollFrame=null;});},{passive:true});
  window.addEventListener('storage',event=>{
    if(event.key===PREFIX+'bookmarks'){state.bookmarks=C.readBookmarks(event.newValue,index);if(route.page==='merkliste')main.innerHTML=V.main(route,state,index);updateBookmarkButtons();}
  });
  render();
  setTimeout(()=>{if(!state.hubiHidden&&route.page!=='sos')bubble('Ich bin Hubi. Einmal streicheln?',5000);},1400);
  if(!storageAvailable)setTimeout(()=>toast('Lokale Speicherung ist in diesem Browser nicht verfügbar. Du kannst trotzdem alles ausprobieren.'),800);
})();
