const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createStore, PREFIX } = require('../src/services/storage.js');

function setup(initial = {}) {
  const values = new Map(Object.entries(initial));
  const adapter = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
  return { values, store: createStore(() => adapter) };
}

test('existing storage keys and bookmarks survive the structural refactor', () => {
  assert.equal(PREFIX, 'ehrenhub.v1.');
  const { store, values } = setup({ 'ehrenhub.v1.bookmarks': '["wiki:juleica"]' });
  assert.equal(store.read('bookmarks', '[]'), '["wiki:juleica"]');
  assert.equal(store.write('hubiHidden', true), true);
  assert.equal(values.get('ehrenhub.v1.hubiHidden'), 'true');
});

test('stale and malformed checklist and feedback entries are discarded', () => {
  const { store } = setup({ 'ehrenhub.v1.checks': '{"valid":true,"stale":true,"wrong":"yes"}' });
  assert.deepEqual(store.readObject('checks', new Set(['valid', 'wrong']), value => value === true), { valid: true });
  for (const raw of ['{broken', '[]', 'null', 'false']) {
    const { store: s } = setup({ 'ehrenhub.v1.checks': raw });
    assert.deepEqual(s.readObject('checks', new Set(['valid']), () => true), {});
  }
});

test('blocked storage stays optional; read, write and reset fail safely', () => {
  const store = createStore(() => { throw new Error('Storage blocked'); });
  assert.equal(store.read('bookmarks', '[]'), '[]');
  assert.equal(store.write('bookmarks', []), false);
  assert.equal(store.clear(), false);
  assert.equal(store.available, false);
});

test('reset clears only Ehrenhub keys, not unrelated origin storage', () => {
  const { store, values } = setup({ unrelated: 'keep', 'ehrenhub.v1.bookmarks': '[]', 'ehrenhub.v1.checks': '{}', 'ehrenhub.v1.feedback': '{}', 'ehrenhub.v1.hubiHidden': 'true' });
  assert.equal(store.clear(), true);
  assert.deepEqual([...values], [['unrelated', 'keep']]);
});
