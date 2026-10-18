const { test } = require('node:test');
const assert = require('node:assert/strict');
const D = require('../src/content.js');
const C = require('../src/core.js');
const { loadViews, makeState } = require('./helpers.cjs');
const validate = async data => (await import('../scripts/validate-content.mjs')).validateContent(data);
const clone = () => structuredClone(D);

test('editable JSON content passes validation', async () => {
  assert.deepEqual(await validate(D), []);
});

test('duplicate IDs, missing fields and invalid references identify the editable file', async () => {
  const d = clone();
  d.articles.push(structuredClone(d.articles[0]));
  delete d.courses[0].title;
  d.articles[0].related.push('missing-article');
  d.courses[0].source = 'missing-source';
  const errors = await validate(d);
  assert.ok(errors.some(e => e.includes('wiki.json') && e.includes('doppelte ID')));
  assert.ok(errors.some(e => e.includes('fortbildungen.json') && e.includes('.title')));
  assert.ok(errors.some(e => e.includes('missing-article')));
  assert.ok(errors.some(e => e.includes('missing-source')));
});

test('unsafe source URLs, unknown themes and impossible dates fail before publishing', async () => {
  const d = clone();
  d.sources.kjg.url = 'javascript:alert(1)';
  d.courses[0].date = '2027-02-30';
  d.courses[0].topic = 'typo';
  d.articles[0].color = '" onclick="alert(1)';
  d.articles[0].sections[0].action = { label: 'Unsafe', href: 'javascript:alert(1)' };
  const errors = await validate(d);
  for (const part of ['HTTPS', '.date', '.topic', 'Designfarbe', 'internen Link']) assert.ok(errors.some(e => e.includes(part)), part);
});

test('empty or broken collection shapes produce useful errors, not a validator crash', async () => {
  assert.ok((await validate(null)).length);
  const d = clone();
  d.articles = [null, 42];
  d.sos = {};
  d.site = {};
  d.finder = {};
  assert.ok((await validate(d)).length > 5);
});

test('SOS source references and finder choices are validated', async () => {
  const d = clone();
  d.sos.support[0].source = 'missing-help';
  d.sos.tabs[0][0] = 'unknown-tab';
  d.finder.grantQuestions[0].options[0][0] = 'unknown-region';
  delete d.finder.stageHints.planung;
  const errors = await validate(d);
  for (const part of ['missing-help', 'unknown-tab', 'unknown-region', 'stageHints']) assert.ok(errors.some(e => e.includes(part)), part);
});

test('new content is picked up by counts, search and detail pages without editing views', async () => {
  const d = clone();
  const article = { ...structuredClone(d.articles[0]), id: 'neuer-artikel', title: 'Zusätzlicher Testartikel' };
  const course = { ...structuredClone(d.courses[0]), id: 'neuer-kurs', title: 'Zusätzlicher Testkurs' };
  d.articles.push(article);
  d.courses.push(course);
  assert.deepEqual(await validate(d), []);
  const { Views: V } = loadViews(d);
  const index = C.makeSearchIndex(d);
  const render = hash => V.main(C.parseRoute(hash), makeState(), index);
  assert.ok(render('#/').includes(`${d.articles.length} Beispielartikel`));
  assert.ok(render('#/').includes(`${d.courses.length} Beispielangebote`));
  assert.ok(render('#/wiki').includes(`${d.articles.length} How-tos`));
  assert.ok(render('#/wiki/neuer-artikel').includes(article.title));
  assert.ok(render('#/fortbildungen/neuer-kurs').includes(course.title));
  assert.ok(C.search(index, 'Zusätzlicher').some(x => x.key === 'wiki:neuer-artikel'));
  assert.ok(C.search(index, 'Zusätzlicher').some(x => x.key === 'kurs:neuer-kurs'));
});

test('featured cards stay stable when the content arrays are reordered', () => {
  const renderHome = d => loadViews(d).Views.main(C.parseRoute('#/'), makeState(), C.makeSearchIndex(d));
  const d = clone();
  d.articles.reverse(); d.courses.reverse();
  assert.equal(renderHome(d), renderHome(D));
});

test('JSON editorial text is escaped and not treated as markup', () => {
  const d = clone();
  const payload = '<img src=x onerror="alert(1)">';
  d.articles[0].title = payload;
  d.courses[0].summary = payload;
  d.sos.situations.sorge.title = payload;
  d.sos.support[0].text = payload;
  d.sos.faq[0].question = payload;
  d.finder.grantQuestions[0].title = payload;
  const V = loadViews(d).Views;
  for (const hash of ['#/wiki', '#/fortbildungen', '#/sos', '#/antraege']) {
    const html = V.main(C.parseRoute(hash), makeState(), C.makeSearchIndex(d));
    assert.ok(!html.includes(payload), hash);
    assert.ok(html.includes('&lt;img'), hash);
  }
});

test('prototype properties in URL parameters cannot become valid grant choices', () => {
  for (const key of ['__proto__', 'constructor', 'toString']) {
    assert.equal(C.validGrantAnswers({ region: 'stadt', project: 'freizeit', stage: key }), false);
    assert.equal(C.validGrantAnswers({ region: key, project: 'freizeit', stage: 'planung' }), false);
  }
  assert.equal(C.validGrantAnswers(null), false);
});
