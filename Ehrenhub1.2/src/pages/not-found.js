/* Pages.NotFound: presentation only; content comes from data/. */
(function(root){
  'use strict';
  const {Data:D,Core:C,Icons:{icon:I,brandMark,dog}}=root.EH;
  const e=C.escapeHTML;
  const {category,sourceLink,badge,notice,crumb,empty,bookmark}=root.EH.UI;

  function notFound(){return `<div class="not-found page-enter"><span class="page-emblem sage">${I('compass')}</span><p class="eyebrow">Kurz vom Weg abgekommen</p><h1>Hier geht es<br>noch nicht weiter.</h1><p>Diese Seite gibt es im Prototyp noch nicht.</p><a class="button primary" href="#/">Zurück zum Start ${I('arrow')}</a></div>`;}

  root.EH.Pages=root.EH.Pages||{};
  root.EH.Pages.NotFound={notFound};
})(globalThis);
