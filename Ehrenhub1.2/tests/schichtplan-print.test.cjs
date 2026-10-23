/** Pure page-layout tests. These are not tests of a browser's print dialog. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews } = require('./helpers.cjs');
const EH = loadViews(), M = EH.ShiftModel, P = EH.ShiftPrint;
const plain = value => JSON.parse(JSON.stringify(value));
function base(start = '2026-10-23T17:00', end = '2026-10-23T23:00') {
  const p = M.initial(); p.event = { name: 'Unser Ehrenamtsfest', location: 'München', start, end, minutes: 60 }; return p;
}
function area(p, name = 'Getränke', minutes = 60, required = 1, start = p.event.start, end = p.event.end) {
  M.addArea(p, name, start, end, minutes, required); return p.areas.at(-1);
}
function assign(p) {
  if (!p.people.length) M.addPeople(p, 'Alex, Kim, Toni, Eva, Sam, Jo');
  for (const [i, s] of p.shifts.entries()) p.assignments[s.id] = Array.from({ length: s.required }, (_, j) => p.people[(i + j) % p.people.length].id);
}
function completeDemo() {
  const p = M.demo(); p.assignments = EH.ShiftSolver.solve(p).assignments; p.step = 4; return p;
}
function validGeometry(doc) {
  assert.equal(doc.error, ''); assert.ok(doc.pages.length > 0);
  for (const page of doc.pages) {
    if (page.type === 'calendar') {
      assert.ok(page.columns.length <= doc.settings.areasPerPage);
      assert.ok(page.to > page.from && page.to - page.from <= doc.settings.hoursPerPage * 60);
      assert.ok(page.gridTop + page.gridHeight <= 526.02);
      assert.ok(page.rows.every(row => Number.isFinite(row.y) && row.height >= 14.99));
      for (const block of page.blocks) {
        assert.ok(Number.isFinite(block.y) && Number.isFinite(block.height));
        assert.ok(block.y >= page.gridTop && block.y + block.height <= page.gridTop + page.gridHeight + .01);
        assert.ok(block.height + .01 >= block.text.minHeight);
        for (const other of page.blocks) if (other !== block && block.column === other.column) {
          assert.ok(block.y + block.height <= other.y + .01 || other.y + other.height <= block.y + .01, 'no overlapping printed blocks in one column');
        }
      }
    } else for (const card of page.cards) {
      assert.ok(card.x >= 32 && card.x + card.width <= 810.01);
      assert.ok(card.y >= doc.header.contentY && card.y + card.height <= 536.01);
      for (const other of page.cards) if (other !== card && other.x === card.x) assert.ok(card.y + card.height <= other.y || other.y + other.height <= card.y);
    }
  }
}
function coverage(p, doc) {
  for (const shift of p.shifts) {
    const parts = doc.pages.filter(x => x.type === 'calendar').flatMap(x => x.blocks).filter(x => x.shiftId === shift.id).sort((a, b) => a.clippedFrom - b.clippedFrom);
    assert.ok(parts.length, 'shift printed: ' + shift.id);
    assert.equal(parts[0].clippedFrom, M.minute(shift.start));
    assert.equal(parts.at(-1).clippedTo, M.minute(shift.end));
    assert.equal(parts.reduce((sum, x) => sum + x.clippedTo - x.clippedFrom, 0), M.duration(shift));
    for (let i = 1; i < parts.length; i++) assert.equal(parts[i - 1].clippedTo, parts[i].clippedFrom, 'no gap or duplicate interval');
  }
}

test('print settings have safe defaults and reject unsupported values', () => {
  assert.deepEqual(plain(P.normalizeOptions()), { areasPerPage: 4, hoursPerPage: 6, includePeople: true });
  assert.deepEqual(plain(P.normalizeOptions({ areasPerPage: '5', hoursPerPage: '4', includePeople: false })), { areasPerPage: 5, hoursPerPage: 4, includePeople: false });
  assert.deepEqual(plain(P.normalizeOptions({ areasPerPage: 0, hoursPerPage: Infinity })), plain(P.DEFAULTS));
});
test('demo exports as one graphical timetable plus optional personal pages', () => {
  const p = completeDemo(), doc = P.build(p); validGeometry(doc); coverage(p, doc);
  assert.equal(doc.issues, 0); assert.equal(doc.pages.filter(x => x.type === 'calendar').length, 1);
  const cards = doc.pages.filter(x => x.type === 'people').flatMap(x => x.cards);
  assert.deepEqual([...new Set(cards.map(x => x.personId))].sort(), [...p.people.map(x => x.id)].sort());
  const only = P.build(p, { includePeople: false }); assert.equal(only.pages.length, 1);
  assert.match(P.renderDocument(doc), /<svg /); assert.doesNotMatch(P.renderDocument(doc), /<table/);
});
test('many areas paginate horizontally without dropping a shift', () => {
  const p = base(); for (let i = 0; i < 12; i++) area(p, 'Bereich ' + (i + 1)); assign(p);
  for (const areasPerPage of [3, 4, 5]) {
    const doc = P.build(p, { areasPerPage, includePeople: false }); validGeometry(doc); coverage(p, doc);
    assert.equal(doc.pages.length, Math.ceil(12 / areasPerPage));
    assert.equal(new Set(doc.pages.flatMap(page => page.columns.map(col => col.areaId))).size, 12);
  }
});
test('midnight is split into dated pages with continuation and 24:00 end labels', () => {
  const p = base('2026-10-23T23:30', '2026-10-24T01:30'); area(p, 'Nachtwache', 120); assign(p);
  const doc = P.build(p, { includePeople: false }); validGeometry(doc); coverage(p, doc);
  assert.equal(doc.pages.length, 2); assert.ok(doc.pages[0].blocks[0].continuesAfter); assert.ok(doc.pages[1].blocks[0].continuesBefore);
  assert.match(P.svgPage(doc, 0), /24:00/); assert.match(P.svgPage(doc, 1), /00:00/);
  assert.notEqual(doc.pages[0].day, doc.pages[1].day);
});
test('irregular times preserve exact starts and ends in the graphical grid', () => {
  const p = base(); area(p, 'Getränke', 45, 2, '2026-10-23T17:15', '2026-10-23T20:05');
  area(p, 'Einlass', 60, 1, '2026-10-23T17:07', '2026-10-23T21:22'); assign(p);
  const doc = P.build(p); validGeometry(doc); coverage(p, doc);
  const svg = P.renderDocument(doc); for (const time of ['17:15', '17:07', '20:05', '21:22']) assert.ok(svg.includes(time));
});
test('overlapping shifts in one area use distinct parallel columns', () => {
  const p = base(), a = area(p, 'Technik', 120);
  p.shifts.push({ id: 'extra', areaId: a.id, start: '2026-10-23T18:00', end: '2026-10-23T20:00', required: 1 }); assign(p);
  const doc = P.build(p, { includePeople: false }); validGeometry(doc); coverage(p, doc);
  assert.equal(doc.pages[0].columns.length, 2); assert.match(P.renderDocument(doc), /Parallel 1 \/ 2/);
});
test('dense short shifts receive readable minimum heights and additional pages', () => {
  const p = base('2026-10-23T17:00', '2026-10-23T19:00'); area(p, 'Staffelwechsel', 5, 3); assign(p);
  const doc = P.build(p, { includePeople: false }); validGeometry(doc); coverage(p, doc);
  assert.ok(doc.pages.length >= 3); assert.ok(doc.pages.every(page => page.blocks.length));
});
test('large teams get complete mandatory details even without personal overview', () => {
  const p = base('2026-10-23T17:00', '2026-10-23T18:00');
  for (let i = 0; i < 5; i++) area(p, 'Arbeitsbereich ' + (i + 1), 60, i ? 1 : 30);
  M.addPeople(p, Array.from({ length: 30 }, (_, i) => 'Person-' + (i + 1) + '-Alexandermaria Langname').join('\n')); assign(p);
  const doc = P.build(p, { areasPerPage: 5, includePeople: false }); validGeometry(doc); coverage(p, doc);
  assert.ok(doc.teamCount >= 1); assert.ok(doc.pages.some(x => x.type === 'teams')); assert.ok(!doc.pages.some(x => x.type === 'people'));
  const details = doc.pages.filter(x => x.type === 'teams').flatMap(x => x.cards).filter(x => x.reference === 'T01');
  const names = details.flatMap(card => card.lines.map(x => x.text)).join('').replace(/\s/g, '');
  for (const person of p.people) assert.ok(names.includes(person.name.replace(/\s/g, '')), person.name);
  assert.ok(details.some(x => x.continued));
});
test('very long individual names are wrapped without ellipses or data loss', () => {
  const p = base('2026-10-23T17:00', '2026-10-23T18:00');
  for (let i = 0; i < 5; i++) area(p, 'Station ' + i);
  M.addPeople(p, 'Maximilian-Wilhelm-Alexander-von-Donaudampfschifffahrtsgesellschaft'); assign(p);
  const doc = P.build(p, { areasPerPage: 5 }); validGeometry(doc); coverage(p, doc);
  const names = doc.pages.filter(x => x.type === 'people').flatMap(x => x.cards.flatMap(c => c.heading)).join('');
  assert.ok(names.includes(p.people[0].name)); assert.doesNotMatch(P.renderDocument(doc), /undefined|NaN|\.\.\./);
});
test('long personal schedules continue across cards without missing entries', () => {
  const p = base('2026-10-23T00:00', '2026-10-24T00:00'); area(p, 'Begleitung', 30); M.addPeople(p, 'Alex'); assign(p);
  const doc = P.build(p); validGeometry(doc); coverage(p, doc);
  const cards = doc.pages.filter(x => x.type === 'people').flatMap(x => x.cards);
  assert.ok(cards.some(x => x.continued)); assert.equal(cards.flatMap(c => c.lines).filter(x => x.newEntry).length, 48);
});
test('empty or excessive date ranges fail clearly and never emit broken pages', () => {
  const empty = P.build(M.initial()); assert.match(empty.error, /zuerst Schichten/); assert.equal(empty.pages.length, 0);
  const p = base(), a = area(p); assign(p); p.shifts = [{ ...p.shifts[0], areaId: a.id, start: '2026-01-01T00:00', end: '2027-01-01T00:00' }];
  assert.match(P.build(p).error, /31 Tage/);
  p.shifts[0].end = p.shifts[0].start; assert.match(P.build(p).error, /Schichtzeiten korrigieren/);
});
test('page-count guard gives an actionable error instead of overflowing memory', () => {
  const p = base('2026-10-01T00:00', '2026-10-29T00:00');
  p.areas = Array.from({ length: 24 }, (_, i) => ({ id: 'a' + i, name: 'Station ' + i, color: i % 5 }));
  p.shifts = p.areas.map((a, i) => ({ id: 's' + i, areaId: a.id, start: p.event.start, end: p.event.end, required: 1 }));
  const doc = P.build(p, { includePeople: false }); assert.match(doc.error, /160/); assert.equal(doc.pages.length, 0);
});
test('SVG output escapes all user text and uses only self-contained safe primitives', () => {
  const p = completeDemo(); p.event.name = '<script>alert(1)</script>'; p.people[0].name = '<img src=x onerror=alert(1)>';
  p.areas[0].name = 'Bar & Küche'; p.event.location = '"><iframe>'; const doc = P.build(p);
  const svg = P.renderDocument(doc); assert.doesNotMatch(svg, /<script|<img|<iframe|<foreignObject|<image|NaN/);
  assert.match(svg, /&lt;script&gt;/); assert.match(svg, /Bar &amp; Küche/); assert.match(svg, /&lt;img/);
});
test('export does not change assignments, stored project data or CSV bytes', () => {
  const p = completeDemo(), before = JSON.stringify(p), csv = M.csv(p), json = M.json(p);
  for (const areasPerPage of [3, 4, 5]) for (const hoursPerPage of [4, 6, 8]) P.renderDocument(P.build(p, { areasPerPage, hoursPerPage }));
  assert.equal(JSON.stringify(p), before); assert.equal(M.csv(p), csv);
  assert.deepEqual(JSON.parse(M.json(p)).project, JSON.parse(json).project, 'only the export timestamp may change');
});
test('partial plans display vacancies and a draft marker on every export page', () => {
  const p = M.demo(), doc = P.build(p); validGeometry(doc);
  assert.ok(doc.issues > 0);
  for (let i = 0; i < doc.pages.length; i++) assert.match(P.svgPage(doc, i), /UNVOLLSTÄNDIGER ENTWURF/);
  assert.match(P.renderDocument(doc), /OFFEN:/);
});
test('preview has operable controls and all-area print content ignores screen filter', () => {
  const p = completeDemo(), ui = { printPreviewOpen: true, printPage: 0, printOptions: { includePeople: false }, areaFilter: p.areas[0].id };
  const html = EH.ShiftView.render(p, ui);
  for (const action of ['print-prev', 'print-next', 'print-preview', 'print', 'csv']) assert.ok(html.includes('data-sp-action="' + action + '"'));
  for (const option of ['areasPerPage', 'hoursPerPage', 'includePeople']) assert.ok(html.includes('data-sp-print-option="' + option + '"'));
  const print = html.split('<section class="sp-print-only">')[1]; for (const a of p.areas) assert.ok(print.includes(EH.Core.escapeHTML(a.name)));
  assert.doesNotMatch(print, /Persönliche Übersicht/);
});
test('print CSS is isolated, landscape, and leaves the CSV implementation untouched', () => {
  const css = fs.readFileSync(path.join(__dirname, '../src/features/schichtplan/styles.css'), 'utf8');
  assert.match(css, /@page ehrenhub-shift\{size:A4 landscape;margin:0\}/);
  assert.match(css, /page:ehrenhub-shift/); assert.match(css, /break-after:page/);
  assert.match(css, /sp-print-sheet:last-child\{break-after:auto/);
});
test('varied interval layouts maintain exact coverage and finite page geometry', () => {
  for (let seed = 1; seed <= 16; seed++) {
    const p = base('2026-10-23T08:00', '2026-10-24T03:00'), start = M.minute(p.event.start);
    for (let i = 0; i < 1 + seed % 7; i++) area(p, 'Station ' + i, 15 + (seed + i) % 5 * 15, 1 + i % 3,
      M.dateTime(start + (i * 7) % 50), M.dateTime(start + 180 + seed * 13 + i * 5));
    assign(p); const doc = P.build(p, { areasPerPage: 3 + seed % 3, hoursPerPage: 4 + seed % 3 * 2 });
    validGeometry(doc); coverage(p, doc);
  }
});
