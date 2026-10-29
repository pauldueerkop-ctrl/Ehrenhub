/* Route adapter. Existing saved grant links keep working. */
(function(root){
  'use strict';
  const {FundingView:V,Core:C,UI}=root.EH;
  function grants(route,state){return state.funding?state.funding.render(route):V.render();}
  function grantDetail(g,state){
    const type={freizeit:'freizeit',bildung:'bildung',aktion:'projekt',material:'raum'}[g.type];
    const external=root.EH.Data.sources[g.source].url;
    return `<div class="page-enter">${UI.crumb([['Antragsfinder','#/antraege'],[g.title]])}<div class="page-heading"><div><p class="eyebrow">${g.region==='stadt'?'Förderassistent · BDKJ München':'Weiterer Förderweg'}</p><h1>${C.escapeHTML(g.title)}</h1><p>${C.escapeHTML(g.summary)}</p></div></div><section class="fg-panel"><h2>Vom Förderweg zur Vorbereitung.</h2><p>${g.region==='stadt'?'Für Gruppen, die über den BDKJ in der Region München abrechnen, gibt es jetzt einen interaktiven Fördercheck. Zuständigkeit, Voraussetzungen und Fristen werden zuerst geklärt.':'Für den Landkreis gelten eigene Richtlinien. Diese Version berechnet noch keinen eigenständigen Landkreis-Zuschuss.'}</p><div class="fg-inline-links"><a class="button primary" href="#/antraege?type=${type}">Förderassistent öffnen</a><a class="text-link" href="${C.escapeHTML(external)}" target="_blank" rel="noopener noreferrer">Offizielle Informationen</a>${UI.bookmark('antrag:'+g.id,state,true)}</div><p class="fg-help">Keine Förderzusage. Antrag und persönliche Nachweise bleiben im offiziellen Verfahren.</p></section></div>`;
  }
  root.EH.Pages=root.EH.Pages||{};root.EH.Pages.Grants={grants,grantDetail};
})(globalThis);
