/* Pages.Saved: presentation only; content comes from data/. */
(function(root){
  'use strict';
  const {Data:D,Core:C,Icons:{icon:I,brandMark,dog}}=root.EH;
  const e=C.escapeHTML;
  const {category,sourceLink,badge,notice,crumb,empty,bookmark}=root.EH.UI;

  function saved(state,index){const items=state.bookmarks.map(key=>index.find(x=>x.key===key)).filter(Boolean);return `<div class="page-enter saved-page">${crumb([['Merkliste']])}<div class="page-heading"><div><p class="eyebrow">Dein kleiner Wissensvorrat</p><h1>Gut gefunden.<br><span class="serif-word">Gut aufgehoben.</span></h1><p>Deine gemerkten Artikel, Antragswege und Kurse.<br>Nur auf diesem Gerät gespeichert. Ohne Anmeldung.</p></div><span class="page-emblem sand">${I('bookmark')}</span></div>${items.length?`<div class="results-heading"><p><strong>${items.length}</strong> ${items.length===1?'gemerkter Inhalt':'gemerkte Inhalte'}</p><div class="saved-actions"><button class="text-link" data-action="export-saved">Als Text herunterladen ${I('file')}</button><button class="text-link subtle" data-action="clear-saved">Liste leeren ${I('trash')}</button></div></div><div class="saved-list">${items.map(item=>`<div class="saved-item"><a href="${item.href}"><span class="result-icon ${item.kind==='kurs'?'lavender':item.kind==='antrag'?'sand':'sage'}">${I(item.icon)}</span><span><small>${e(item.label)}</small><strong>${e(item.title)}</strong><p>${e(item.summary)}</p></span>${I('arrow')}</a>${bookmark(item.key,state)}</div>`).join('')}</div>`:empty('Hier ist Platz für gute Fundstücke.','Tippe bei einem Artikel, Kurs oder Förderweg auf das Lesezeichen. Deine Auswahl wartet dann hier auf dich.','<a class="button primary" href="#/wiki">Im Wiki stöbern '+I('arrow')+'</a>')}<div class="local-data-note">${I('info')}<p>Die Merkliste wird nicht zwischen Geräten synchronisiert. Im privaten Browsermodus oder nach dem Löschen der Website-Daten kann sie verschwinden.</p></div></div>`;}

  root.EH.Pages=root.EH.Pages||{};
  root.EH.Pages.Saved={saved};
})(globalThis);
