/* Pure domain logic. No browser or framework dependency. */
(function (root, factory) {
  const config = typeof module === 'object' && module.exports ? require('../data/finder.json') : root.EH.Data.finder;
  const core = factory(config);
  if (typeof module === 'object' && module.exports) module.exports = core;
  else (root.EH = root.EH || {}).Core = core;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (config) {
  'use strict';
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = value => String(value ?? '').toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const tokens = value => normalize(value).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const includes = (text, query) => tokens(query).every(word => normalize(text).includes(word));
  const {courseTopics,regions,projectTypes,stages}=config;

  function parseRoute(hash) {
    const raw = String(hash || '#/').replace(/^#/, '');
    const [path, query=''] = raw.split('?');
    let parts;
    try { parts = path.split('/').filter(Boolean).map(decodeURIComponent); }
    catch { return {page:'404',id:null,query:new URLSearchParams()}; }
    const allowed = ['', 'wiki', 'antraege', 'fortbildungen', 'sos', 'merkliste', 'suche', 'schichtplan'];
    if (parts.length > 2 || !allowed.includes(parts[0] || '')) return {page:'404',id:null,query:new URLSearchParams()};
    return {page:parts[0] || 'home', id:parts[1] || null, query:new URLSearchParams(query)};
  }
  function filterArticles(articles, filters={}) {
    return articles.filter(a => (!filters.category || filters.category === 'alle' || a.category === filters.category) && includes([a.title,a.summary,...a.tags].join(' '), filters.q || ''));
  }
  function filterCourses(courses, filters={}) {
    const matches = courses.filter(c =>
      (!filters.topic || filters.topic === 'alle' || c.topic === filters.topic) &&
      (!filters.duration || filters.duration === 'alle' || c.duration === filters.duration) &&
      (!filters.format || filters.format === 'alle' || c.format === filters.format) &&
      includes([c.title,c.provider,c.summary,c.location,courseTopics[c.topic],...(c.tags||[])].join(' '), filters.q || '')
    );
    return [...matches].sort(filters.sort === 'titel' ? (a,b) => a.title.localeCompare(b.title,'de') : (a,b) => a.date.localeCompare(b.date));
  }
  function validGrantAnswers(answers) {
    return !!answers && Object.hasOwn(regions,answers.region) && Object.hasOwn(projectTypes,answers.project) && Object.hasOwn(stages,answers.stage);
  }
  function matchGrants(grants, answers) {
    if (!validGrantAnswers(answers)) return [];
    return grants.filter(g => g.region === answers.region && g.projects.includes(answers.project));
  }
  function makeSearchIndex(data) {
    return [
      ...data.articles.map(a => ({key:'wiki:'+a.id,kind:'wiki',label:'Wiki & How-tos',icon:a.icon,title:a.title,summary:a.summary,href:'#/wiki/'+a.id,text:[...a.tags, ...a.sections.map(s=>s.title+' '+(s.text||''))].join(' ')})),
      ...data.courses.map(c => ({key:'kurs:'+c.id,kind:'kurs',label:'Fortbildung · Beispiel',icon:'graduation',title:c.title,summary:c.provider+' · '+c.length,href:'#/fortbildungen/'+c.id,text:[c.summary,courseTopics[c.topic],...c.tags].join(' ')})),
      ...data.grants.map(g => ({key:'antrag:'+g.id,kind:'antrag',label:'Antragsweg · Beispiel',icon:'coins',title:g.title,summary:g.owner,href:'#/antraege/'+g.id,text:[g.summary,'Zuschüsse Förderung KJR Geld Antrag Finanzantrag Bezuschussung',regions[g.region]].join(' ')})),
      {key:'sos',kind:'sos',label:'PSG & SOS',icon:'shield',title:'Du musst das nicht allein klären.',summary:'Orientierung und Anlaufstellen bei sexualisierter Gewalt.',href:'#/sos',text:'Hilfe Notfall Schutz Prävention PSG Verdacht Beratungsstelle Sorge Gewalt Kinderschutz'},
      {key:'werkzeug:schichtplan',kind:'werkzeug',label:'Werkzeug · Schichtplaner',icon:'calendar',title:'Schichtplaner: euer Team fair einteilen',summary:'Bereiche, Verfügbarkeiten und Schichten lokal planen. Ohne Anmeldung.',href:'#/schichtplan',text:'Dienstplan Einsatzplan Helfer Team Veranstaltung Schichten Arbeit Plan Generator'}
    ];
  }
  function search(index, query, kind='alle') {
    const words = tokens(query);
    return index.filter(item => (kind==='alle' || item.kind===kind) && words.every(word=>normalize(item.title+' '+item.summary+' '+item.text).includes(word)))
      .map(item=>({...item,score:words.reduce((sum,word)=>sum+(normalize(item.title).includes(word)?5:1),0)}))
      .sort((a,b)=>b.score-a.score || a.title.localeCompare(b.title,'de'));
  }
  function readBookmarks(raw, index) {
    try {
      const value = JSON.parse(raw || '[]');
      if (!Array.isArray(value)) return [];
      const valid = new Set(index.filter(x=>x.kind!=='sos').map(x=>x.key));
      return [...new Set(value.filter(key=>typeof key==='string' && valid.has(key)))];
    } catch { return []; }
  }
  function toggleBookmark(bookmarks,key) { return bookmarks.includes(key) ? bookmarks.filter(x=>x!==key) : [...bookmarks,key]; }
  function dateParts(date) {
    const d = new Date(date+'T12:00:00');
    return {day:d.toLocaleDateString('de-DE',{day:'2-digit'}),month:d.toLocaleDateString('de-DE',{month:'short'}).replace('.',''),full:d.toLocaleDateString('de-DE',{day:'numeric',month:'long',year:'numeric'})};
  }
  return {escapeHTML,normalize,includes,courseTopics,regions,projectTypes,stages,parseRoute,filterArticles,filterCourses,validGrantAnswers,matchGrants,makeSearchIndex,search,readBookmarks,toggleBookmark,dateParts};
});
