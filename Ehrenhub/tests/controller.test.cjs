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
    scrollTo() {}, print() {},
  };
  const ctx = {
    document, location, window, Element, URLSearchParams, URL, Blob,
    history: { replaceState(_state, _unused, hash) { location.hash = hash; } },
    setTimeout: () => 1, clearTimeout() {}, requestAnimationFrame: () => 1,
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
  return { ctx, nodes, values, send, click, navigate, Element };
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
