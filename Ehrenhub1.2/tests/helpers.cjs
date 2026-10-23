const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const modules = require('../scripts/modules.json');
const data = require('../src/content.js');

function loadViews(content = data) {
  const ctx = { EH: { Data: content }, URLSearchParams };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const file of modules.filter(file => file !== 'app.js')) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), ctx, { filename: file });
  }
  return ctx.EH;
}

function makeState() {
  return {
    bookmarks: [], checks: {}, feedback: {}, wizardStep: 0,
    grantAnswers: { region: '', project: '', stage: '' }, sosTab: 'sorge',
  };
}

module.exports = { loadViews, makeState };
