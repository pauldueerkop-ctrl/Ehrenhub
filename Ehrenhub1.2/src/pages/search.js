/* Pages.Search: presentation only; content comes from data/. */
(function(root){
  'use strict';
  const {Data:D,Core:C,Icons:{icon:I,brandMark,dog}}=root.EH;
  const e=C.escapeHTML;
  const {category,sourceLink,badge,notice,crumb,empty,bookmark}=root.EH.UI;

  function searchResults(query,index,kind='alle',small=false){const result=C.search(index,query,kind);const shown=small?result.slice(0,7):result;return `${!small?`<div class="results-heading"><p><strong>${result.length}</strong> ${result.length===1?'Treffer':'Treffer'}${query?' zu „'+e(query)+'“':''}</p></div>`:''}${shown.length?`<div class="search-result-list">${shown.map((item,i)=>`<a class="search-result" href="${item.href}" ${small?'data-search-result="'+i+'"':''}><span class="result-icon ${item.kind==='sos'?'rose':item.kind==='kurs'?'lavender':item.kind==='antrag'?'sand':'sage'}">${I(item.icon)}</span><span class="search-result-text"><span class="result-type">${e(item.label)}</span><strong>${e(item.title)}</strong><span class="result-desc">${e(item.summary)}</span></span>${I('arrow')}</a>`).join('')}</div>${small&&result.length>7?`<a class="all-results-link" href="#/suche?q=${encodeURIComponent(query)}">Alle ${result.length} Treffer ansehen ${I('arrow')}</a>`:''}`:empty('Hier haben wir noch keine Antwort.','Versuch es mit „Juleica“, „Zuschuss“ oder „Gruppenstunde“.')}`;}

  function searchPage(route,state,index){const query=route.query.get('q')||'';const kind=route.query.get('kind')||'alle';return `<div class="page-enter search-page">${crumb([['Suche']])}<div class="page-heading"><div><p class="eyebrow">Deine Suche</p><h1>Was möchtest<br>du <span class="serif-word">wissen?</span></h1></div><span class="page-emblem sage">${I('search')}</span></div><div class="input-search big-search">${I('search')}<label class="sr-only" for="page-search">Alle Bereiche durchsuchen</label><input type="search" id="page-search" data-search="global" value="${e(query)}" placeholder="Alle Bereiche durchsuchen …" autocomplete="off"></div><div class="topic-chips search-kind-chips" role="group" aria-label="Suchbereich">${[['alle','Alles'],['wiki','Wiki'],['antrag','Antragswege'],['kurs','Fortbildungen'],['sos','PSG & SOS']].map(([id,t])=>`<button class="chip ${kind===id?'selected':''}" data-search-kind="${id}" aria-pressed="${kind===id}">${t}</button>`).join('')}</div><div id="page-search-results" aria-live="polite">${searchResults(query,index,kind)}</div></div>`;}

  root.EH.Pages=root.EH.Pages||{};
  root.EH.Pages.Search={searchResults,searchPage};
})(globalThis);
