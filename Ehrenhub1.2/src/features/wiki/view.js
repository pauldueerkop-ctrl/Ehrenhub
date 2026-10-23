/* Reusable article building blocks, following the existing Ehrenhub design. */
(function(root){
  'use strict';
  const {Core:{escapeHTML:e},Icons:{icon:I},WikiBlocks:M}=root.EH;
  const names={scenario:['message','Was würdest du tun?'],detective:['search','Fehlerdetektiv'],comparison:['layers','Vorher & Nachher'],perspectives:['users','Perspektivenwechsel'],decision:['compass','Dein Entscheidungsweg'],challenge:['flag','Mini-Challenge']};
  const key=(a,s,b)=>a.id+':'+s+':'+b.id;
  function button(action,label,value='',extra='') {return `<button type="button" class="wb-button" data-wb-action="${action}" data-wb-value="${e(value)}" ${extra}>${label}</button>`;}
  function copy(text){return `<p class="wb-copy">${e(text)}</p>`;}
  function feedback(s){return s.feedback?`<div class="wb-feedback ${s.tone==='success'?'is-positive':''}" tabindex="-1" data-wb-focus><span class="wb-feedback-icon">${I(s.tone==='success'?'checkCircle':'message')}</span><div><strong>${s.tone==='success'?'Ein guter Blick fürs Detail':'Ein Gedanke dazu'}</strong>${copy(s.feedback)}</div></div>`:'';}
  function body(b,s){
    if(['scenario','detective','decision','challenge'].includes(b.type)&&!s.started)return `<div class="wb-start">${button('start',`Ausprobieren ${I('arrow')}`)}<span>In deinem Tempo · ohne Anmeldung</span></div>`;
    if(b.type==='scenario')return `<div class="wb-options">${b.options.map((o,i)=>button('choose',`<span class="wb-letter">${String.fromCharCode(65+i)}</span><span>${e(o.label)}</span>`,o.id,`aria-pressed="${s.selected.includes(o.id)}"`)).join('')}</div>${feedback(s)}`;
    if(b.type==='detective')return `<p class="wb-instruction">Tippe die Stellen an, die du genauer prüfen würdest.</p><div class="wb-options">${b.items.map(x=>button('inspect',`${I(s.selected.includes(x.id)?'checkCircle':'search')}<span>${e(x.label)}</span>`,x.id,`aria-pressed="${s.selected.includes(x.id)}"`)).join('')}</div><p class="wb-progress">${s.selected.length} von ${b.items.filter(x=>x.issue).length} Stolperstellen entdeckt</p>${feedback(s)}${s.done?`<div class="wb-complete">${I('spark')}<span>${e(b.success)}</span></div>`:''}`;
    if(b.type==='comparison'||b.type==='perspectives'){
      const options=b.type==='comparison'?b.variants:b.perspectives;
      const active=options[s.choice]||options[0];
      return `<div class="wb-switch" role="group" aria-label="${b.type==='comparison'?'Variante auswählen':'Perspektive auswählen'}">${options.map((x,i)=>button('switch',e(x.label),String(i),`aria-pressed="${s.choice===i}"`)).join('')}</div><div class="wb-panel" tabindex="-1" data-wb-focus><p class="wb-panel-label">${e(active.label)}</p>${copy(active.text)}${active.note?`<div class="wb-note">${I('leaf')}${copy(active.note)}</div>`:''}</div>`;
    }
    if(b.type==='decision'){
      const n=b.nodes.find(x=>x.id===s.node)||b.nodes[0];
      return `<div class="wb-decision" tabindex="-1" data-wb-focus><p class="wb-panel-label">${n.result?'Deine Orientierung':'Frage '+(s.history.length+1)}</p><h4>${e(n.result?n.title:n.question)}</h4>${n.result?copy(n.result):`<div class="wb-options">${n.options.map(o=>button('answer',`<span>${e(o.label)}</span>${I('arrow')}`,o.id)).join('')}</div>`}${n.action?`<a class="button secondary" href="${e(n.action.href)}">${e(n.action.label)} ${I('arrow')}</a>`:''}</div>${s.history.length?button('back',`${I('back')} Einen Schritt zurück`):''}`;
    }
    if(b.type==='challenge')return `<p class="wb-instruction">Bringe die Schritte in die passende Reihenfolge. Mit den Pfeilen kannst du sie verschieben.</p><ol class="wb-sort">${s.order.map((id,i)=>{const x=b.items.find(x=>x.id===id);return `<li><span class="wb-position">${i+1}</span><span class="wb-sort-label">${e(x.label)}</span><span class="wb-sort-controls">${button('up',I('down'),id,`aria-label="${e(x.label)} nach oben" ${i===0?'disabled':''}`)}${button('down',I('down'),id,`aria-label="${e(x.label)} nach unten" ${i===s.order.length-1?'disabled':''}`)}</span></li>`;}).join('')}</ol>${button('check',`${I('check')} Reihenfolge prüfen`)}${feedback(s)}`;
    return '';
  }
  function render(a,sectionId,b,s){
    const [icon,label]=names[b.type]||['spark','Zum Ausprobieren'];
    return `<div class="wiki-block" data-wb-key="${e(key(a,sectionId,b))}" data-wb-type="${e(b.type)}"><div class="wb-top"><span class="wb-kicker">${I(icon)} ${label}</span><span class="wb-paw" aria-hidden="true">${I('paw')}</span></div><h3>${e(b.title)}</h3>${b.prompt?copy(b.prompt):''}<div class="wb-body">${body(b,s||M.initial(b))}</div>${s?.started?`<div class="wb-footer">${button('reset',`${I('refresh')} Neu starten`)}</div>`:''}<div class="wb-announcement sr-only" aria-live="polite" aria-atomic="true"></div><div class="wb-print"><p>Zum Ausprobieren auf der Website öffnen.</p></div></div>`;
  }
  function sections(a,section,si,states={}){const sid=section.id||String(si);return (section.blocks||[]).map(b=>render(a,sid,b,states[key(a,sid,b)])).join('');}
  root.EH.WikiBlockView={render,sections,key};
})(globalThis);
