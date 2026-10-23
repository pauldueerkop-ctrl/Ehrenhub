/* UI: presentation only; content comes from data/. */
(function(root){
  'use strict';
  const {Data:D,Core:C,Icons:{icon:I,brandMark,dog}}=root.EH;
  const e=C.escapeHTML;

  const category=id=>D.categories.find(c=>c.id===id);

  const sourceLink=(key,label,cls='text-link')=>`<a class="${cls}" href="${e(D.sources[key].url)}" target="_blank" rel="noopener noreferrer">${e(label||D.sources[key].label)} ${I('external')}<span class="sr-only"> (öffnet einen neuen Tab)</span></a>`;

  const badge=(text,cls='')=>`<span class="badge ${cls}">${e(text)}</span>`;

  const notice=(text,cls='')=>`<div class="notice ${cls}">${I('info')}<p>${text}</p></div>`;

  const crumb=(items)=>`<nav class="breadcrumbs" aria-label="Brotkrumennavigation"><a href="#/">Start</a>${items.map(([name,href])=>`${I('chevron')}${href?`<a href="${href}">${e(name)}</a>`:`<span aria-current="page">${e(name)}</span>`}`).join('')}</nav>`;

  const empty=(title,desc,action='')=>`<div class="empty-state"><span class="empty-icon">${I('compass')}</span><h3>${title}</h3><p>${desc}</p>${action}</div>`;

  const bookmark=(key,state,full=false)=>`<button type="button" class="${full?'button secondary bookmark-full':'bookmark-button'} ${state.bookmarks.includes(key)?'is-saved':''}" data-bookmark="${e(key)}" aria-pressed="${state.bookmarks.includes(key)}" aria-label="${state.bookmarks.includes(key)?'Aus Merkliste entfernen':'In Merkliste speichern'}">${I('bookmark')}${full?`<span>${state.bookmarks.includes(key)?'Gemerkt':'Merken'}</span>`:''}</button>`;

  root.EH.UI={category,sourceLink,badge,notice,crumb,empty,bookmark};
})(globalThis);
