/* Cards: presentation only; content comes from data/. */
(function(root){
  'use strict';
  const {Data:D,Core:C,Icons:{icon:I,brandMark,dog}}=root.EH;
  const e=C.escapeHTML;
  const {category,sourceLink,badge,notice,crumb,empty,bookmark}=root.EH.UI;

  function articleCard(a,state,compact=false){return `<article class="article-card ${compact?'compact':''}">${bookmark('wiki:'+a.id,state)}<a class="article-card-link" href="#/wiki/${a.id}"><div class="card-kicker"><span class="small-icon ${a.color}">${I(a.icon)}</span><span>${e(category(a.category).label)}</span></div><h3>${e(a.title)}</h3><p>${e(a.summary)}</p><div class="card-bottom"><span>${I('clock')} ${a.minutes} Min. Lesezeit</span><span class="arrow-circle">${I('arrow')}</span></div></a></article>`;}

  function courseCard(c,state){const date=C.dateParts(c.date);return `<article class="course-card">${bookmark('kurs:'+c.id,state)}<a class="course-link" href="#/fortbildungen/${c.id}"><div class="course-card-top ${c.color}"><div class="date-tile"><strong>${date.day}</strong><span>${date.month.toUpperCase()}</span></div><div class="course-top-label">${I(c.icon)}<span>${e(C.courseTopics[c.topic])}</span></div><span class="demo-label">Beispieltermin</span></div><div class="course-body"><p class="provider">${e(c.provider)}</p><h3>${e(c.title)}</h3><p class="course-summary">${e(c.summary)}</p><div class="course-meta"><span>${I('clock')}${e(c.length)}</span><span>${I(c.format==='online'?'laptop':'pin')}${e(c.location)}</span></div><div class="card-bottom"><span>${e(c.level)}</span><span class="arrow-circle">${I('arrow')}</span></div></div></a></article>`;}

  root.EH.Cards={articleCard,courseCard};
})(globalThis);
