const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews, makeState } = require('./helpers.cjs');
const EH = loadViews(), M = EH.ShiftModel, S = EH.ShiftSolver, V = EH.ShiftView;
const plain = value => JSON.parse(JSON.stringify(value));
function base() {
  const p = M.initial();
  p.event = { name: 'Testfest', location: '', start: '2026-10-23T17:00', end: '2026-10-23T23:00', minutes: 60 };
  return p;
}
function solved(p, options) {
  const result = S.solve(p, options);
  assert.equal(result.status, 'complete', JSON.stringify(result.issues));
  assert.equal(M.assignmentIssues(p, result.assignments).length, 0);
  // Independent oracle: no person may have overlapping intervals or exceed limits.
  for (const person of p.people) {
    const slots = p.shifts.filter(s => result.assignments[s.id].includes(person.id));
    for (const a of slots) {
      assert.ok(person.areaIds.includes(a.areaId));
      assert.ok(!person.unavailable.some(b => a.start < b.end && b.start < a.end));
      for (const b of slots) if (a.id !== b.id) assert.ok(a.end <= b.start || b.end <= a.start, person.name);
    }
    if (person.loadMode === 'max') assert.ok(slots.length <= person.loadValue);
    if (person.loadMode === 'exact') assert.equal(slots.length, person.loadValue);
  }
  for (const shift of p.shifts) {
    assert.equal(result.assignments[shift.id].length, shift.required);
    assert.equal(new Set(result.assignments[shift.id]).size, shift.required);
  }
  return result;
}
test('Schichtplan route, navigation and discovery are connected', () => {
  assert.equal(EH.Core.parseRoute('#/schichtplan').page, 'schichtplan');
  assert.match(EH.Views.main(EH.Core.parseRoute('#/schichtplan'), makeState(), []), /id="shift-planner"/);
  assert.match(EH.Layout.header(EH.Core.parseRoute('#/schichtplan'), makeState()), /href="#\/schichtplan"/);
  assert.match(EH.Pages.Home.home(makeState()), /Zum Schichtplaner/);
  assert.ok(EH.Core.search(EH.Core.makeSearchIndex(EH.Data), 'Schichtplan').some(x => x.href === '#/schichtplan'));
});
test('blank plan returns clear setup errors, not an invented schedule', () => {
  const result = S.solve(M.initial());
  assert.equal(result.status, 'invalid');
  assert.equal(result.assignments, null);
  assert.ok(result.issues.some(x => x.code === 'event'));
  assert.ok(result.issues.some(x => x.code === 'people'));
});
test('wall-clock parsing rejects impossible dates and invalid times', () => {
  for (const date of ['', 'wrong', '2026-02-30T10:00', '2026-10-23T25:00', '2026-10-23T12:99']) assert.ok(Number.isNaN(M.minute(date)), date);
  assert.equal(M.duration({ start: '2026-10-23T23:30', end: '2026-10-24T00:30' }), 60);
  assert.equal(M.duration({ start: '2026-10-25T01:00', end: '2026-10-25T03:00' }), 120, 'clock-time convention, no DST conversion');
});
test('regular slots include a shorter final remainder without exceeding the event', () => {
  const slots = M.makeShifts('bar', '2026-10-23T17:00', '2026-10-23T19:30', 60, 2);
  assert.equal(slots.length, 3); assert.equal(M.duration(slots[2]), 30);
  assert.equal(slots[2].end, '2026-10-23T19:30');
  assert.throws(() => M.makeShifts('x', '2026-10-23T19:00', '2026-10-23T18:00', 60, 1));
  assert.throws(() => M.makeShifts('x', '2026-10-23T17:00', '2026-10-23T18:00', 0, 1));
});
test('names can be pasted with mixed separators; duplicate names are skipped', () => {
  const p = base(); M.addArea(p, 'Bar', p.event.start, p.event.end, 60, 1);
  const result = M.addPeople(p, 'Alex, Kim\nToni;alex; Alex S.');
  assert.equal(result.added, 4); assert.equal(result.skipped, 1);
  assert.equal(p.people[0].unavailable.length, 0); assert.equal(p.people[0].areaIds.length, 1);
  M.addArea(p, 'Küche', p.event.start, p.event.end, 60, 1);
  assert.ok(p.people.every(person => person.areaIds.length === 2));
});
test('demo solves with availability and area restrictions, without mutating inputs', () => {
  const p = M.demo(), before = JSON.stringify(p), result = solved(p);
  assert.equal(result.filled, 28); assert.equal(JSON.stringify(p), before);
  const counts = Object.values(M.totals(p, result.assignments)).map(s => s.count);
  assert.ok(Math.max(...counts) - Math.min(...counts) <= 1);
});
test('30-person realistic plan distributes 90 one-hour assignments evenly', () => {
  const p = base(); p.event.end = '2026-10-24T03:00';
  for (const name of ['Getränke', 'Küche', 'Einlass']) M.addArea(p, name, p.event.start, p.event.end, 60, 3);
  M.addPeople(p, Array.from({ length: 30 }, (_, i) => 'Person ' + i).join('\n'));
  const result = solved(p, { budgetMs: 2000 });
  assert.ok(Object.values(M.totals(p, result.assignments)).every(s => s.count === 3));
});
test('fairness can balance time instead of treating long shifts as one short shift', () => {
  const p = base(); M.addArea(p, 'Bar', p.event.start, '2026-10-23T21:00', 60, 1);
  p.shifts[0].end = p.shifts[1].end; p.shifts.splice(1, 1);
  M.addPeople(p, 'A, B');
  p.rules.fairness = 'minutes';
  const minutes = Object.values(M.totals(p, solved(p).assignments)).map(s => s.minutes);
  assert.deepEqual([...minutes].sort(), [120, 120]);
  p.rules.fairness = 'count';
  const counts = Object.values(M.totals(p, solved(p).assignments)).map(s => s.count);
  assert.deepEqual([...counts].sort(), [1, 2]);
});
test('adjacent shifts do not overlap; an unavailable fraction blocks the whole shift', () => {
  assert.equal(M.overlap({ start: '2026-10-23T17:00', end: '2026-10-23T18:00' }, { start: '2026-10-23T18:00', end: '2026-10-23T19:00' }), false);
  const p = base(); M.addArea(p, 'Bar', p.event.start, '2026-10-23T19:00', 60, 1); M.addPeople(p, 'A, B');
  p.people[0].unavailable.push({ start: '2026-10-23T17:40', end: '2026-10-23T17:50' });
  const r = solved(p); assert.equal(r.assignments[p.shifts[0].id][0], p.people[1].id);
});
test('hard maximums, exact counts and zero assignments are respected', () => {
  const p = base(); M.addArea(p, 'Bar', p.event.start, p.event.end, 60, 1); M.addPeople(p, 'A, B, C, D');
  p.people[0].loadMode = 'exact'; p.people[0].loadValue = 3;
  p.people[1].loadMode = 'max'; p.people[1].loadValue = 1;
  p.people[2].loadMode = 'exact'; p.people[2].loadValue = 0;
  const r = solved(p), stats = M.totals(p, r.assignments);
  assert.equal(stats[p.people[0].id].count, 3); assert.ok(stats[p.people[1].id].count <= 1); assert.equal(stats[p.people[2].id].count, 0);
});
test('scarce area eligibility and nonuniform overlapping shifts are honored', () => {
  const p = base();
  M.addArea(p, 'Küche', '2026-10-23T17:30', '2026-10-23T20:30', 90, 1);
  M.addArea(p, 'Einlass', '2026-10-23T17:00', '2026-10-23T21:00', 60, 1);
  M.addPeople(p, 'A, B, C'); p.people[1].areaIds = [p.areas[1].id]; p.people[2].areaIds = [p.areas[1].id];
  const r = solved(p);
  for (const shift of p.shifts.filter(s => s.areaId === p.areas[0].id)) assert.equal(r.assignments[shift.id][0], p.people[0].id);
});
test('impossible staffing gives explicit gaps and never double-books someone', () => {
  const p = base(); for (const name of ['Bar', 'Küche']) M.addArea(p, name, p.event.start, '2026-10-23T18:00', 60, 1);
  M.addPeople(p, 'A'); const r = S.solve(p);
  assert.notEqual(r.status, 'complete'); assert.equal(r.filled, 1);
  assert.equal(M.assignmentIssues(p, r.assignments, { complete: false }).length, 0);
  assert.ok(r.issues.some(x => x.code === 'staffing'));
});
test('no eligible person produces an actionable capacity explanation', () => {
  const p = base(); M.addArea(p, 'Grill', p.event.start, '2026-10-23T18:00', 60, 2); M.addPeople(p, 'A');
  p.people[0].areaIds = []; const r = S.solve(p);
  assert.equal(r.status, 'partial'); assert.match(r.issues[0].message, /Grill.*2 Personen.*nur 0/);
});
test('impossible exact counts are not silently treated as optional', () => {
  const p = base(); M.addArea(p, 'Bar', p.event.start, '2026-10-23T18:00', 60, 1); M.addPeople(p, 'A, B');
  p.people.forEach(person => { person.loadMode = 'exact'; person.loadValue = 1; });
  const r = S.solve(p); assert.notEqual(r.status, 'complete'); assert.ok(r.issues.some(x => x.code === 'exact-total')); assert.ok(r.issues.some(x => x.code === 'exact'));
});
test('fixed assignments survive regeneration; conflicting locks are rejected', () => {
  const p = M.demo(); p.assignments = solved(p).assignments;
  const shift = p.shifts[0], personId = p.assignments[shift.id][0]; p.locks[shift.id] = [personId];
  assert.ok(solved(p).assignments[shift.id].includes(personId));
  const other = p.shifts.find(s => s.areaId !== shift.areaId && s.start === shift.start);
  p.locks[other.id] = [personId]; const bad = S.solve(p);
  assert.equal(bad.status, 'invalid'); assert.equal(bad.assignments, null); assert.ok(bad.issues.some(x => x.code === 'overlap'));
});
test('bounded search still validates the fallback before calling it complete', () => {
  const p = M.demo(); const r = S.solve(p, { maxNodes: 0, budgetMs: 250 });
  assert.equal(M.assignmentIssues(p, r.assignments, { complete: false }).length, 0);
  assert.equal(r.status === 'complete', M.assignmentIssues(p, r.assignments).length === 0);
});
test('independent constraint verification over varied deterministic team restrictions', () => {
  let seed = 42; const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  for (let run = 0; run < 32; run++) {
    const p = base();
    for (const area of ['A', 'B', 'C']) M.addArea(p, area, p.event.start, '2026-10-23T21:00', 60, 1);
    M.addPeople(p, 'P1,P2,P3,P4,P5,P6,P7,P8');
    p.people.forEach(person => { person.areaIds = person.areaIds.filter(() => random() > .2); if (random() > .5) person.unavailable = [{ start: '2026-10-23T18:00', end: '2026-10-23T19:00' }]; });
    const r = S.solve(p, { budgetMs: 35, maxNodes: 1000 });
    assert.equal(M.assignmentIssues(p, r.assignments, { complete: false }).length, 0, 'run ' + run);
    if (r.status === 'complete') solved(p, { budgetMs: 35, maxNodes: 1000 });
  }
});
test('project export/import retains names, rules, assignments and locks', () => {
  const p = M.demo(); p.assignments = solved(p).assignments; p.step = 4;
  p.locks[p.shifts[0].id] = [p.assignments[p.shifts[0].id][0]];
  const imported = M.decode(M.json(p));
  for (const key of ['event', 'areas', 'shifts', 'people', 'rules', 'assignments']) assert.deepEqual(plain(imported[key]), plain(p[key]), key);
  assert.deepEqual(plain(imported.locks[p.shifts[0].id]), plain(p.locks[p.shifts[0].id]));
  assert.equal(imported.step, 4); assert.equal(M.assignmentIssues(imported).length, 0);
});
test('imports reject corrupt, oversized and prototype-shaped inputs', () => {
  for (const input of ['bad', 'null', '{}', '{"version":2}']) assert.throws(() => M.decode(input));
  const p = M.demo();
  let bad = M.clone(p); bad.people[0].id = '__proto__'; assert.throws(() => M.decode(bad));
  bad = M.clone(p); bad.shifts[0].areaId = 'missing'; assert.throws(() => M.decode(bad));
  bad = M.clone(p); bad.people[1].id = bad.people[0].id; assert.throws(() => M.decode(bad));
  bad = M.clone(p); bad.event.start = '2026-02-30T10:00'; assert.throws(() => M.decode(bad));
  bad = M.clone(p); bad.people = Array.from({ length: 121 }, () => bad.people[0]); assert.throws(() => M.decode(bad));
  assert.equal(M.restore('broken').recovered, true); assert.equal(M.restore(null).recovered, false);
});
test('CSV quotes separators, marks vacancies and neutralizes formula-like names', () => {
  const p = base(); M.addArea(p, 'Bar; links', p.event.start, '2026-10-23T18:00', 60, 2); M.addPeople(p, '=1+1');
  p.assignments[p.shifts[0].id] = [p.people[0].id];
  const csv = M.csv(p); assert.ok(csv.startsWith('\uFEFF')); assert.match(csv, /"Bar; links"/); assert.match(csv, /"'=1\+1"/); assert.match(csv, /"OFFEN"/);
});
test('all five views escape names and contain no undefined text or external assets', () => {
  const p = M.demo(); p.event.name = '<img src=x onerror=alert(1)>'; p.people[0].name = '<svg onload=alert(1)>';
  for (let step = 0; step < 5; step++) {
    p.step = step; const html = V.render(p, { personId: p.people[0].id, openAreas: p.areas.map(a => a.id) });
    assert.ok(!html.includes('<img src=x')); assert.ok(!html.includes('<svg onload=')); assert.ok(!html.includes('undefined')); assert.ok(!html.includes('[object Object]'));
    assert.equal((html.match(/id="shift-planner"/g) || []).length, 1);
    assert.ok(!/<script|<iframe|src="https:/i.test(html));
  }
});
test('result includes complete print layout even when the on-screen area is filtered', () => {
  const p = M.demo(); p.assignments = solved(p).assignments; p.step = 4;
  const html = V.render(p, { areaFilter: p.areas[0].id });
  const printed = html.slice(html.indexOf('<section class="sp-print-only">'));
  for (const area of p.areas) assert.ok(printed.includes(EH.Core.escapeHTML(area.name)));
  assert.ok(printed.includes('Persönliche Übersicht'));
  assert.ok(!printed.includes('UNVOLLSTÄNDIGER ENTWURF'));
  p.assignments = {}; assert.match(V.render(p), /UNVOLLSTÄNDIGER ENTWURF/);
});
test('every planner action has an implementation and feature CSS stays separate', () => {
  const p = M.demo(), source = fs.readFileSync(path.join(__dirname, '../src/features/schichtplan/controller.js'), 'utf8');
  for (let step = 0; step < 5; step++) {
    p.step = step;
    for (const match of V.render(p, { personId: p.people[0].id }).matchAll(/data-sp-action="([a-z-]+)"/g)) assert.ok(source.includes("action === '" + match[1] + "'"), match[1]);
  }
  const styles = JSON.parse(fs.readFileSync(path.join(__dirname, '../scripts/styles.json')));
  assert.ok(styles.includes('features/schichtplan/styles.css'));
});

test('intermediate event drafts survive reload without crashing later steps', () => {
  const p = M.demo(); p.event.end = ''; p.step = 1;
  const restored = M.restore(JSON.stringify(p));
  assert.equal(restored.recovered, false); assert.equal(restored.project.step, 0);
  assert.equal(restored.project.people.length, 16);
  assert.doesNotThrow(() => V.render(restored.project));
  assert.notEqual(S.solve(restored.project).status, 'complete');
});

test('generated forms are not nested, IDs are unique and explicit labels resolve', () => {
  const p = M.demo(); p.assignments = solved(p).assignments;
  for (let step = 0; step < 5; step++) {
    p.step = step;
    const html = V.render(p, { personId: p.people[0].id, openAreas: p.areas.map(a => a.id) });
    let depth = 0;
    for (const match of html.matchAll(/<\/?form\b[^>]*>/g)) { depth += match[0].startsWith('</') ? -1 : 1; assert.ok(depth >= 0 && depth <= 1, 'nested/unbalanced form at step ' + step); }
    assert.equal(depth, 0);
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(ids.length, new Set(ids).size, 'duplicate IDs at step ' + step);
    for (const match of html.matchAll(/<label[^>]*\sfor="([^"]+)"/g)) assert.ok(ids.includes(match[1]), match[1]);
  }
});
