/** Build-time catalogue checks. Errors point to the editable JSON field. */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import data from '../src/content.js';
import wikiValidation from './validate-wiki.cjs';
import fundingValidation from './validate-funding.cjs';

export function validateContent(D) {
  const errors = [];
  const fail = (where, message) => errors.push(`${where}: ${message}`);
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const has = (value, key) => object(value) && Object.hasOwn(value, key);
  const text = (value, where) => {
    if (typeof value !== 'string' || !value.trim()) fail(where, 'nichtleeren Text angeben');
  };
  const list = (value, where) => {
    if (!Array.isArray(value)) { fail(where, 'Array erwartet'); return []; }
    return value;
  };
  const texts = (value, where) => list(value, where).forEach((s, i) => text(s, `${where}[${i}]`));
  const token = (value, where) => {
    if (typeof value !== 'string' || !/^[a-zA-Z][a-zA-Z0-9-]*$/.test(value)) fail(where, 'ungültige ID / Icon-Kennung');
  };
  const visual = (item, where) => {
    token(item.icon, `${where}.icon`);
    if (item.color !== undefined && !['sage', 'sand', 'lavender', 'rose'].includes(item.color)) fail(`${where}.color`, 'unbekannte Designfarbe');
  };
  if (!object(D)) return ['data: Objekt erwartet'];
  fundingValidation.validateFunding(D,fail);
  if (!object(D.hubi)) fail('data/hubi.json', 'Objekt mit Standardnachrichten erwartet');
  else {
    const allowed=['intro','pet','checklistComplete','start','success','retry','complete','change','pages'];
    for(const key of Object.keys(D.hubi))if(!allowed.includes(key))fail('data/hubi.json.'+key,'unbekanntes Nachrichtenfeld');
    for(const key of allowed.filter(k=>!['pet','pages'].includes(k)))text(D.hubi[key],'data/hubi.json.'+key);
    const phrases=list(D.hubi.pet,'data/hubi.json.pet');
    if(!phrases.length)fail('data/hubi.json.pet','mindestens einen Satz angeben');
    texts(phrases,'data/hubi.json.pet');
    if(!object(D.hubi.pages))fail('data/hubi.json.pages','Objekt erwartet');
    else for(const [key,value] of Object.entries(D.hubi.pages)){
      if(!['home','wiki','antraege','fortbildungen','merkliste','schichtplan','suche'].includes(key))fail('data/hubi.json.pages.'+key,'unbekannte Seite oder auf dieser Seite nicht vorgesehen');
      text(value,'data/hubi.json.pages.'+key);
    }
  }
  const collections = {};
  for (const [key, file] of Object.entries({ articles: 'wiki', courses: 'fortbildungen', grants: 'antraege', categories: 'kategorien' })) {
    const items = list(D[key], `data/${file}.json`);
    const ids = new Set();
    items.forEach((item, i) => {
      const where = `data/${file}.json[${i}]`;
      if (!object(item)) { fail(where, 'Objekt erwartet'); return; }
      token(item.id, `${where}.id`);
      if (ids.has(item.id)) fail(`${where}.id`, `doppelte ID "${item.id}"`);
      ids.add(item.id);
      visual(item, where);
    });
    collections[key] = { items: items.filter(object), ids };
  }
  if (!object(D.sources)) fail('data/quellen.json', 'Objekt erwartet');
  for (const [key, source] of Object.entries(object(D.sources) ? D.sources : {})) {
    const where = `data/quellen.json.${key}`;
    if (!object(source)) { fail(where, 'Objekt erwartet'); continue; }
    text(source.label, `${where}.label`);
    try {
      const url = new URL(source.url);
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
    } catch { fail(`${where}.url`, 'gültigen HTTPS-Link ohne Zugangsdaten angeben'); }
  }
  const sourceRef = (key, where) => {
    if (!has(D.sources, key)) fail(where, `unbekannte Quelle "${String(key)}"`);
  };
  const reference = (id, collection, where) => {
    if (!collections[collection].ids.has(id)) fail(where, `unbekannte ID "${String(id)}"`);
  };
  function internalLink(href, where) {
    if (typeof href !== 'string' || !href.startsWith('#/')) { fail(where, 'internen Link mit #/ angeben'); return; }
    const parts = href.slice(2).split('?')[0].split('/').filter(Boolean);
    const pages = { wiki: 'articles', fortbildungen: 'courses', antraege: 'grants' };
    if (parts.length > 2 || (parts[0] && !['wiki', 'fortbildungen', 'antraege', 'sos', 'merkliste', 'suche', 'schichtplan'].includes(parts[0]))) fail(where, 'unbekannte Unterseite');
    else if (parts[1]) {
      if (Object.hasOwn(pages, parts[0])) reference(parts[1], pages[parts[0]], where);
      else fail(where, 'diese Seite hat keine Detailansicht');
    }
  }
  const finder = object(D.finder) ? D.finder : {};
  for (const key of ['courseTopics', 'regions', 'projectTypes', 'stages', 'courseDurations', 'courseFormats']) {
    if (!object(finder[key])) fail(`data/finder.json.${key}`, 'Objekt erwartet');
    else for (const [id, label] of Object.entries(finder[key])) { token(id, `data/finder.json.${key}`); text(label, `data/finder.json.${key}.${id}`); }
  }
  const option = (kind, value, where) => {
    if (!has(finder[kind], value)) fail(where, `unbekannte Auswahl "${String(value)}"`);
  };
  for (const item of collections.categories.items) text(item.label, `data/kategorien.json.${item.id}.label`);
  for (const item of collections.articles.items) {
    const p = D.articleFiles?.[item.id] || `data/wiki/${item.id}.json`;
    wikiValidation.validateWiki(item,p,{fail,internalLink});
    for (const key of ['title', 'summary']) text(item[key], `${p}.${key}`);
    if (item.intro !== undefined) text(item.intro, `${p}.intro`);
    if (!Number.isInteger(item.minutes) || item.minutes < 1) fail(`${p}.minutes`, 'positive ganze Zahl erwartet');
    reference(item.category, 'categories', `${p}.category`);
    texts(item.tags, `${p}.tags`);
    for (const id of list(item.related, `${p}.related`)) reference(id, 'articles', `${p}.related`);
    if (item.source !== undefined) sourceRef(item.source, `${p}.source`);
    list(item.sections, `${p}.sections`).forEach((section, i) => {
      const q = `${p}.sections[${i}]`;
      if (!object(section)) { fail(q, 'Objekt erwartet'); return; }
      text(section.title, `${q}.title`);
      for (const key of ['text', 'tip']) if (section[key] !== undefined) text(section[key], `${q}.${key}`);
      if (section.bullets !== undefined) texts(section.bullets, `${q}.bullets`);
      if (section.timeline !== undefined) for (const row of list(section.timeline, `${q}.timeline`)) {
        if (!Array.isArray(row) || row.length !== 2) fail(`${q}.timeline`, 'Paare aus Zeit und Text erwartet');
        else texts(row, `${q}.timeline`);
      }
      if (section.action !== undefined) {
        if (!object(section.action)) fail(`${q}.action`, 'Objekt erwartet');
        else { text(section.action.label, `${q}.action.label`); internalLink(section.action.href, `${q}.action.href`); }
      }
    });
  }
  for (const item of collections.courses.items) {
    const p = `data/fortbildungen.json.${item.id}`;
    for (const key of ['title', 'summary', 'provider', 'length', 'location', 'level', 'note']) text(item[key], `${p}.${key}`);
    texts(item.tags, `${p}.tags`); texts(item.contents, `${p}.contents`);
    sourceRef(item.source, `${p}.source`);
    option('courseTopics', item.topic, `${p}.topic`);
    option('courseDurations', item.duration, `${p}.duration`);
    option('courseFormats', item.format, `${p}.format`);
    const date = new Date(item.date + 'T12:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== item.date) fail(`${p}.date`, 'gültiges Datum im Format JJJJ-MM-TT erwartet');
  }
  for (const item of collections.grants.items) {
    const p = `data/antraege.json.${item.id}`;
    for (const key of ['title', 'summary', 'owner']) text(item[key], `${p}.${key}`);
    sourceRef(item.source, `${p}.source`); texts(item.documents, `${p}.documents`);
    option('regions', item.region, `${p}.region`); option('projectTypes', item.type, `${p}.type`);
    for (const type of list(item.projects, `${p}.projects`)) option('projectTypes', type, `${p}.projects`);
  }
  const questions = list(finder.grantQuestions, 'data/finder.json.grantQuestions');
  if (questions.length !== 3) fail('data/finder.json.grantQuestions', 'der Finder benötigt die drei Schritte region, project, stage');
  questions.forEach((question, i) => {
    const p = `data/finder.json.grantQuestions[${i}]`;
    if (!object(question)) { fail(p, 'Objekt erwartet'); return; }
    if (question.key !== ['region', 'project', 'stage'][i]) fail(`${p}.key`, 'Schritte müssen region, project, stage sein');
    text(question.title, `${p}.title`); text(question.desc, `${p}.desc`);
    const kind = ['regions', 'projectTypes', 'stages'][i];
    const options = list(question.options, `${p}.options`);
    if (new Set(options.map(row => row?.[0])).size !== options.length) fail(`${p}.options`, 'doppelte Auswahl');
    for (const row of options) {
      if (!Array.isArray(row) || row.length !== 4) { fail(`${p}.options`, 'vier Felder pro Auswahl erwartet'); continue; }
      option(kind, row[0], `${p}.options`); texts(row, `${p}.options`); token(row[3], `${p}.options.icon`);
    }
    for (const id of Object.keys(finder[kind] || {})) if (!options.some(row => row?.[0] === id)) fail(`${p}.options`, `Auswahl "${id}" fehlt`);
  });
  for (const stage of Object.keys(finder.stages || {})) {
    const hint = finder.stageHints?.[stage];
    for (const field of ['before', 'emphasis', 'after']) text(hint?.[field], `data/finder.json.stageHints.${stage}.${field}`);
  }
  const sos = object(D.sos) ? D.sos : {};
  for (const [key, value] of Object.entries(object(sos.situations) ? sos.situations : {})) {
    const p = `data/sos.json.situations.${key}`;
    if (!object(value)) { fail(p, 'Objekt erwartet'); continue; }
    text(value.title, `${p}.title`); text(value.text, `${p}.text`); texts(value.steps, `${p}.steps`);
  }
  if (!has(sos.situations, 'sorge')) fail('data/sos.json.situations.sorge', 'Standardsituation fehlt');
  const tabs = list(sos.tabs, 'data/sos.json.tabs');
  if (!tabs.length || !tabs.some(row => row?.[0] === 'sorge')) fail('data/sos.json.tabs', 'Standard-Tab sorge fehlt');
  if (new Set(tabs.map(row => row?.[0])).size !== tabs.length) fail('data/sos.json.tabs', 'doppelte Tab-ID');
  for (const row of tabs) {
    if (!Array.isArray(row) || row.length !== 3) { fail('data/sos.json.tabs', 'drei Felder pro Tab erwartet'); continue; }
    if (!has(sos.situations, row[0])) fail('data/sos.json.tabs', `Situation "${row[0]}" fehlt`);
    token(row[0], 'data/sos.json.tabs.id'); text(row[1], 'data/sos.json.tabs.label'); token(row[2], 'data/sos.json.tabs.icon');
  }
  for (const item of list(sos.support, 'data/sos.json.support')) {
    if (!object(item)) { fail('data/sos.json.support', 'Objekt erwartet'); continue; }
    for (const key of ['title', 'text', 'label']) text(item[key], `data/sos.json.support.${key}`);
    visual(item, 'data/sos.json.support'); sourceRef(item.source, 'data/sos.json.support.source');
  }
  for (const item of list(sos.faq, 'data/sos.json.faq')) {
    text(item?.question, 'data/sos.json.faq.question'); text(item?.answer, 'data/sos.json.faq.answer');
  }
  const site = object(D.site) ? D.site : {};
  text(site.version, 'data/site.json.version'); text(site.reviewed, 'data/site.json.reviewed');
  for (const id of list(site.featuredArticles, 'data/site.json.featuredArticles')) reference(id, 'articles', 'data/site.json.featuredArticles');
  for (const id of list(site.featuredCourses, 'data/site.json.featuredCourses')) reference(id, 'courses', 'data/site.json.featuredCourses');
  const searchKeys = new Set(['sos', ...['articles', 'courses', 'grants'].flatMap((type, i) => [...collections[type].ids].map(id => ['wiki:', 'kurs:', 'antrag:'][i] + id))]);
  for (const key of list(site.quickSearch, 'data/site.json.quickSearch')) if (!searchKeys.has(key)) fail('data/site.json.quickSearch', `unbekannter Suchschlüssel "${key}"`);
  for (const item of list(site.sections, 'data/site.json.sections')) {
    if (!object(item)) { fail('data/site.json.sections', 'Objekt erwartet'); continue; }
    visual(item, 'data/site.json.sections');
    for (const field of ['title', 'description', 'number']) text(item[field], `data/site.json.sections.${field}`);
    internalLink(item.href, 'data/site.json.sections.href');
    if (item.count !== undefined) {
      if (!['articles', 'courses'].includes(item.count)) fail('data/site.json.sections.count', 'articles oder courses erwartet');
      text(item.label, 'data/site.json.sections.label');
    } else text(item.meta, 'data/site.json.sections.meta');
  }
  return errors;
}

export function assertValidContent(content) {
  const errors = validateContent(content);
  if (errors.length) throw new Error(`Inhaltsprüfung fehlgeschlagen:\n- ${errors.join('\n- ')}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    assertValidContent(data);
    console.log('Inhalte geprüft: IDs, Pflichtfelder, Datumswerte, Quellen und interne Verweise sind konsistent.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
