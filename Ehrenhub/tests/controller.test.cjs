/** Controller smoke tests with a minimal DOM stand-in, NOT real browser/layout tests. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function boot({ hash = '#/', blocked = false, initial = {} } = {}) {
  const html = fs.readFileSync(path.join(__dirname, '../dist/index.html'), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const documentEvents = {};
  const windowEvents = {};
  const timers = [];
  const values = new Map(Object.entries(initial));
  class Element {
    constructor(selectors = []) {
      this.selectors = new Set(selectors);
      this.innerHTML = ''; this.dataset = {}; this.attributes = {};
      this.value = ''; this.hidden = false; this.open = false;
      this.classes = new Set();
      this.classList = {
        add: name => this.classes.add(name),
        remove: name => this.classes.delete(name),
        contains: name => this.classes.has(name),
        toggle: (name, on) => on ? this.classes.add(name) : this.classes.delete(name),
      };
    }
    closest(selector) { return this.selectors.has(selector) ? this : null; }
    matches(selector) { return this.selectors.has(selector); }
    setAttribute(name, value) { this.attributes[name] = value; }
    addEventListener() {}
    querySelectorAll() { return []; }
    focus() {}
    showModal() { this.open = true; }
    close() { this.open = false; }
    scrollIntoView() {}
  }
  const nodes = new Map(['main', 'header-root', 'footer-root', 'hubi', 'hubi-bubble', 'search-dialog', 'quick-search', 'quick-search-results', 'info-dialog', 'info-content', 'toast', 'wiki-results', 'course-results', 'page-search-results'].map(id => [id, new Element()]));
  const document = {
    getElementById: id => nodes.get(id) ?? null,
    querySelectorAll: () => [], querySelector: () => null,
    addEventListener: (name, handler) => { documentEvents[name] = handler; },
    body: new Element(), title: '',
  };
  const location = { hash, replace(value) { this.hash = value; } };
  const window = {
    addEventListener: (name, handler) => { windowEvents[name] = handler; },
    scrollTo() {}, print() {}, confirm() { return true; },
  };
  const ctx = {
    document, location, window, Element, URLSearchParams, URL, Blob,
    history: { replaceState(_state, _unused, hash) { location.hash = hash; } },
    setTimeout: fn => { timers.push(fn); return timers.length; }, clearTimeout() {}, requestAnimationFrame: () => 1,
    FormData: class { constructor(form) { this.data = form.fields || {}; } entries() { return Object.entries(this.data); } },
  };
  Object.defineProperty(ctx, 'localStorage', { get() {
    if (blocked) throw new Error('Storage blocked');
    return {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: key => values.delete(key),
    };
  } });
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(script, ctx, { filename: 'actual-built-page.js' });
  const send = (name, target, other = {}) => documentEvents[name]({ target, preventDefault() {}, ...other });
  const click = (selector, dataset) => { const target = new Element([selector]); target.dataset = dataset; send('click', target); };
  const navigate = hash => { location.hash = hash; windowEvents.hashchange(); };
  const flushTimers = () => { const pending = timers.splice(0); pending.forEach(fn => fn()); };
  return { ctx, nodes, values, send, click, navigate, Element, flushTimers };
}

test('actual HTML bundle boots with data and all presentation modules in order', () => {
  const { ctx, nodes } = boot();
  assert.ok(nodes.get('main').innerHTML.includes('Weniger suchen.'));
  assert.ok(nodes.get('header-root').innerHTML.includes('Hauptnavigation'));
  assert.ok(nodes.get('footer-root').innerHTML.includes('Weniger Hürden.'));
  assert.ok(nodes.get('hubi').innerHTML.includes('hubi-dog'));
  assert.equal(ctx.document.title, 'Weniger suchen. Mehr bewegen. · Ehrenhub');
});

test('delegated bookmark actions persist and show up after navigation and reload', () => {
  const app = boot();
  app.click('[data-bookmark]', { bookmark: 'wiki:juleica' });
  assert.equal(app.values.get('ehrenhub.v1.bookmarks'), '["wiki:juleica"]');
  app.navigate('#/merkliste');
  assert.ok(app.nodes.get('main').innerHTML.includes('Juleica: dein Weg'));
  const reloaded = boot({ hash: '#/merkliste', initial: Object.fromEntries(app.values) });
  assert.ok(reloaded.nodes.get('main').innerHTML.includes('Juleica: dein Weg'));
  reloaded.click('[data-bookmark]', { bookmark: 'wiki:juleica' });
  assert.ok(reloaded.nodes.get('main').innerHTML.includes('Hier ist Platz für gute Fundstücke'));
});

test('search input events update the route and rendered results', () => {
  const app = boot({ hash: '#/wiki' });
  const input = new app.Element();
  input.dataset.search = 'wiki'; input.value = 'Kostenplan';
  app.send('input', input);
  assert.ok(app.ctx.location.hash.includes('q=Kostenplan'));
  assert.ok(app.nodes.get('wiki-results').innerHTML.includes('Ein einfacher Kostenplan'));
  app.click('[data-action]', { action: 'search' });
  assert.equal(app.nodes.get('search-dialog').open, true);
  app.click('[data-action]', { action: 'search-close' });
  assert.equal(app.nodes.get('search-dialog').open, false);
});

test('Hubi remains hidden on SOS; quick exit navigates home', () => {
  const app = boot({ hash: '#/sos' });
  assert.equal(app.nodes.get('hubi').hidden, true);
  app.click('[data-action]', { action: 'quick-exit' });
  assert.equal(app.ctx.location.hash, '#/');
  app.navigate('#/');
  assert.equal(app.nodes.get('hubi').hidden, false);
  app.click('[data-action]', { action: 'pet' });
  assert.ok(app.nodes.get('hubi').classes.has('is-petted'));
  assert.ok(app.nodes.get('hubi-bubble').textContent.includes('Ehrenamt'));
});

test('actual bundle still works when the browser refuses all local storage', () => {
  const app = boot({ blocked: true });
  app.click('[data-bookmark]', { bookmark: 'wiki:juleica' });
  app.navigate('#/merkliste');
  assert.ok(app.nodes.get('main').innerHTML.includes('Juleica: dein Weg'));
  assert.equal(app.values.size, 0);
});

test('planner persists a demo without touching existing bookmarks and restores it', () => {
  const app = boot({ hash: '#/schichtplan', initial: { 'ehrenhub.v1.bookmarks': '["wiki:juleica"]' } });
  assert.match(app.nodes.get('main').innerHTML, /Was habt ihr vor/);
  app.click('[data-sp-action]', { spAction: 'demo' });
  const p = JSON.parse(app.values.get('ehrenhub.v1.shiftPlan'));
  assert.equal(p.people.length, 16); assert.equal(p.areas.length, 3);
  assert.equal(app.values.get('ehrenhub.v1.bookmarks'), '["wiki:juleica"]');
  const again = boot({ hash: '#/schichtplan', initial: Object.fromEntries(app.values) });
  assert.match(again.nodes.get('main').innerHTML, /Gleicher Einsatz/);
  assert.match(again.nodes.get('main').innerHTML, /Sommerfest der Pfarrjugend/);
  again.click('[data-sp-action]', { spAction: 'reset' });
  assert.equal(JSON.parse(again.values.get('ehrenhub.v1.shiftPlan')).people.length, 0);
  assert.equal(again.values.get('ehrenhub.v1.bookmarks'), '["wiki:juleica"]');
});

test('delegated planner forms and changes follow the complete setup path', () => {
  const app = boot({ hash: '#/schichtplan' });
  const submit = (type, fields) => { const form = new app.Element(); form.dataset.spForm = type; form.fields = fields; app.send('submit', form); };
  const change = (dataset, value, checked) => { const input = new app.Element(); input.dataset = dataset; input.value = value; input.checked = checked; app.send('change', input); };
  const read = () => JSON.parse(app.values.get('ehrenhub.v1.shiftPlan'));
  submit('event', { name: 'Unser Fest', location: 'Garten', start: '2026-10-23T17:00', end: '2026-10-23T21:00', minutes: '60' });
  assert.equal(read().step, 1);
  submit('area', { name: 'Bar', start: '2026-10-23T17:00', end: '2026-10-23T21:00', minutes: '60', required: '1' });
  assert.equal(read().shifts.length, 4);
  app.click('[data-sp-action]', { spAction: 'next' }); assert.equal(read().step, 2);
  submit('people', { names: 'Alex, Kim, Toni' }); assert.equal(read().people.length, 3);
  const person = read().people[0], area = read().areas[0];
  change({ spEligibility: person.id, area: area.id }, '', false); assert.equal(read().people[0].areaIds.length, 0);
  change({ spEligibility: person.id, area: area.id }, '', true); assert.equal(read().people[0].areaIds.length, 1);
  change({ spAvailability: person.id, start: '2026-10-23T17:00', end: '2026-10-23T19:00' }, '', false);
  change({ spAvailability: person.id, start: '2026-10-23T18:00', end: '2026-10-23T19:00' }, '', true);
  assert.deepEqual(read().people[0].unavailable, [{ start: '2026-10-23T17:00', end: '2026-10-23T18:00' }]);
  change({ spPersonMode: person.id }, 'exact'); change({ spPersonLimit: person.id }, '1');
  assert.equal(read().people[0].loadValue, 1);
  app.click('[data-sp-action]', { spAction: 'next' }); assert.equal(read().step, 3);
  change({ spRule: 'fairness' }, 'count'); assert.equal(read().rules.fairness, 'count');
});

test('manual edits reject collisions, retain locks, and allow free vacancies', () => {
  const shell = boot(); const M = shell.ctx.EH.ShiftModel, p = M.demo();
  p.assignments = shell.ctx.EH.ShiftSolver.solve(p).assignments; p.step = 4;
  const app = boot({ hash: '#/schichtplan', initial: { 'ehrenhub.v1.shiftPlan': JSON.stringify(p) } });
  const change = (dataset, value, checked) => { const input = new app.Element(); input.dataset = dataset; input.value = value; input.checked = checked; app.send('change', input); };
  const first = p.shifts[0], personId = p.assignments[first.id][0];
  change({ spLock: first.id, person: personId }, '', true);
  change({ spAssign: first.id, index: '0' }, '');
  assert.equal(JSON.parse(app.values.get('ehrenhub.v1.shiftPlan')).assignments[first.id][0], personId);
  change({ spLock: first.id, person: personId }, '', false);
  change({ spAssign: first.id, index: '0' }, '');
  assert.equal(JSON.parse(app.values.get('ehrenhub.v1.shiftPlan')).assignments[first.id][0], '');
  const other = p.shifts.find(s => s.start === first.start && s.areaId !== first.areaId);
  const occupied = p.assignments[other.id][0];
  change({ spAssign: first.id, index: '0' }, occupied);
  assert.equal(JSON.parse(app.values.get('ehrenhub.v1.shiftPlan')).assignments[first.id][0], '');
});

test('global data reset clears the planner; blocked storage never prevents planning', () => {
  const app = boot({ hash: '#/schichtplan' });
  app.click('[data-sp-action]', { spAction: 'demo' });
  app.click('[data-action]', { action: 'confirm-reset' });
  assert.equal(app.values.has('ehrenhub.v1.shiftPlan'), false);
  assert.match(app.nodes.get('main').innerHTML, /Was habt ihr vor/);
  const blocked = boot({ hash: '#/schichtplan', blocked: true });
  assert.doesNotThrow(() => blocked.click('[data-sp-action]', { spAction: 'demo' }));
  blocked.navigate('#/schichtplan');
  assert.match(blocked.nodes.get('main').innerHTML, /Sommerfest der Pfarrjugend/);
  assert.match(blocked.nodes.get('main').innerHTML, /Speichern im Browser ist nicht möglich/);
});

test('Generate action actually computes and persists a checked result through the shell', () => {
  const app = boot({ hash: '#/schichtplan' });
  app.click('[data-sp-action]', { spAction: 'demo' });
  app.click('[data-sp-action]', { spAction: 'generate' });
  app.flushTimers();
  const p = JSON.parse(app.values.get('ehrenhub.v1.shiftPlan'));
  assert.equal(p.step, 4); assert.equal(app.ctx.EH.ShiftModel.assignmentIssues(p).length, 0);
  app.navigate('#/schichtplan'); assert.match(app.nodes.get('main').innerHTML, /Euer Einsatz steht/);
});

test('file import replaces only after valid parsing and confirmation', async () => {
  const app = boot({ hash: '#/schichtplan' });
  app.click('[data-sp-action]', { spAction: 'demo' });
  const p = app.ctx.EH.ShiftModel.demo(); p.event.name = 'Importiertes Fest';
  const field = new app.Element(); field.dataset = { spImport: '' };
  field.files = [{ size: 1000, text: async () => JSON.stringify(p) }];
  app.send('change', field); await new Promise(resolve => setImmediate(resolve));
  assert.equal(JSON.parse(app.values.get('ehrenhub.v1.shiftPlan')).event.name, 'Importiertes Fest');
  field.files = [{ size: 50, text: async () => 'broken json' }];
  app.send('change', field); await new Promise(resolve => setImmediate(resolve));
  assert.equal(JSON.parse(app.values.get('ehrenhub.v1.shiftPlan')).event.name, 'Importiertes Fest');
  p.event.name = 'Should not replace'; app.ctx.window.confirm = () => false;
  field.files = [{ size: 1000, text: async () => JSON.stringify(p) }];
  app.send('change', field); await new Promise(resolve => setImmediate(resolve));
  assert.equal(JSON.parse(app.values.get('ehrenhub.v1.shiftPlan')).event.name, 'Importiertes Fest');
});
