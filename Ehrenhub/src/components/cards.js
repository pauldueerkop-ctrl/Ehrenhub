/* Cards: presentation only; content comes from data/. */
(function(root){
  'use strict';
  const {Data:D,Core:C,Icons:{icon:I,brandMark,dog}}=root.EH;
  const e=C.escapeHTML;
  const {category,sourceLink,badge,notice,crumb,empty,bookmark}=root.EH.UI;

  function articleCard(a,state,compact=false){return `<article class="article-card ${compact?'compact':''}">${bookmark('wiki:'+a.id,state)}<a class="article-card-link" href="#/wiki/${a.id}"><div class="card-kicker"><span class="small-icon ${a.color}">${I(a.icon)}</span><span>${e(category(a.category).label)}</span></div><h3>${e(a.title)}</h3><p>${e(a.summary)}</p><div class="card-bottom"><span>${I('clock')} ${a.minutes} Min. Lesezeit</span><span class="arrow-circle">${I('arrow')}</span></div></a></article>`;}

  function courseCard(c,state){return root.EH.TrainingView.courseCard(c,state);}

  root.EH.Cards={articleCard,courseCard};
})(globalThis);
