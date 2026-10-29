const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

test('build works from another working directory and keeps GitHub Pages output location', t => {
  const before = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
  const isolated = fs.mkdtempSync(path.join(os.tmpdir(), 'ehrenhub-build-test-'));
  t.after(() => fs.rmSync(isolated, { recursive: true, force: true }));
  for (const entry of ['scripts', 'src', 'data', 'public', 'package.json']) fs.cpSync(path.join(root, entry), path.join(isolated, entry), { recursive: true });
  execFileSync(process.execPath, [path.join(isolated, 'scripts/build.mjs')], { cwd: os.tmpdir() });
  assert.equal(fs.readFileSync(path.join(isolated, 'dist/index.html'), 'utf8'), before);
  assert.equal(fs.readFileSync(path.join(isolated, 'Ehrenhub.html'), 'utf8'), before);
});

test('built HTML contains one complete standalone script and syntax-valid JS', () => {
  const html = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
  assert.equal((html.match(/<script>/g) || []).length, 1);
  assert.equal((html.match(/<\/script>/g) || []).length, 1);
  const js = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  assert.doesNotThrow(() => new vm.Script(js));
  assert.ok(js.startsWith('globalThis.EH = { Data: {'));
  assert.ok(!js.includes("require('../data/wiki.json')"));
  assert.ok(!js.includes('fetch('));
});
