/** Schichtplan: serializable data and pure validation. No DOM, network or dependencies. */
(function (root) {
  'use strict';
  const LIMITS = { people: 120, areas: 24, shifts: 400, seats: 1200, unavailable: 100 };
  const COLORS = ['sage', 'sand', 'lavender', 'rose'];
  let sequence = 0;
  const id = prefix => prefix + '-' + Date.now().toString(36) + '-' + (++sequence).toString(36);
  const clone = value => JSON.parse(JSON.stringify(value));
  const pad = n => String(n).padStart(2, '0');
  function minute(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return NaN;
    const date = new Date(value + ':00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 16) === value ? date.getTime() / 60000 : NaN;
  }
  const dateTime = m => new Date(m * 60000).toISOString().slice(0, 16);
  const duration = shift => minute(shift.end) - minute(shift.start);
  const overlap = (a, b) => minute(a.start) < minute(b.end) && minute(b.start) < minute(a.end);
  function initial() {
    const now = new Date();
    const day = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    return { version: 1, step: 0, event: { name: '', location: '', start: day + 'T17:00', end: day + 'T23:00', minutes: 60 },
      areas: [], shifts: [], people: [], rules: { fairness: 'minutes', preferBreaks: true }, assignments: {}, locks: {} };
  }
  const orderedShifts = p => [...p.shifts].sort((a, b) => a.start.localeCompare(b.start) || p.areas.findIndex(x => x.id === a.areaId) - p.areas.findIndex(x => x.id === b.areaId));
  const eligible = (p, person, shift) => person.areaIds.includes(shift.areaId) && !person.unavailable.some(range => overlap(range, shift));
  const cap = person => person.loadMode === 'auto' ? Infinity : person.loadValue;
  function totals(p, assignments = p.assignments) {
    const stats = Object.fromEntries(p.people.map(person => [person.id, { count: 0, minutes: 0 }]));
    for (const shift of p.shifts) for (const personId of assignments[shift.id] || []) {
      if (stats[personId]) { stats[personId].count++; stats[personId].minutes += duration(shift); }
    }
    return stats;
  }
  function makeShifts(areaId, start, end, minutes, required) {
    const from = minute(start), to = minute(end);
    if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from || !Number.isInteger(minutes) || minutes < 5 || !Number.isInteger(required) || required < 1 || required > 30) throw new Error('Bitte gültige Zeiten, mindestens 5 Minuten und 1–30 Personen je Schicht eingeben.');
    if (Math.ceil((to - from) / minutes) > LIMITS.shifts) throw new Error('Zu viele Schichten. Bitte den Zeitraum oder die Schichtlänge anpassen.');
    const shifts = [];
    for (let at = from; at < to; at += minutes) shifts.push({ id: id('s'), areaId, start: dateTime(at), end: dateTime(Math.min(at + minutes, to)), required });
    return shifts;
  }
  function invalidate(p) { p.assignments = {}; p.locks = {}; }
  function addArea(p, name, start, end, minutes, required) {
    if (p.areas.length >= LIMITS.areas) throw new Error('Im Prototyp sind höchstens 24 Arbeitsbereiche vorgesehen.');
    name = String(name).trim().slice(0, 70);
    if (!name) throw new Error('Bitte einen Arbeitsbereich benennen.');
    if (p.areas.some(a => a.name.toLocaleLowerCase('de') === name.toLocaleLowerCase('de'))) throw new Error('Diesen Arbeitsbereich gibt es bereits.');
    if (minute(start) < minute(p.event.start) || minute(end) > minute(p.event.end)) throw new Error('Die Schichten müssen innerhalb des Veranstaltungszeitraums liegen.');
    const area = { id: id('a'), name, color: COLORS[p.areas.length % COLORS.length] };
    const shifts = makeShifts(area.id, start, end, minutes, required);
    if (p.shifts.length + shifts.length > LIMITS.shifts || p.shifts.reduce((n, s) => n + s.required, 0) + shifts.length * required > LIMITS.seats) throw new Error('Dieser Plan ist für den Prototyp zu groß (400 Schichten / 1.200 Plätze).');
    p.areas.push(area); p.shifts.push(...shifts);
    p.people.forEach(person => person.areaIds.push(area.id));
    invalidate(p); return area;
  }
  function addPeople(p, text) {
    const names = String(text).split(/[\n;,]+/).map(name => name.trim()).filter(Boolean);
    if (names.some(name => name.length > 70)) throw new Error('Ein Name darf höchstens 70 Zeichen lang sein.');
    const known = new Set(p.people.map(person => person.name.toLocaleLowerCase('de')));
    const unique = names.filter(name => { const key = name.toLocaleLowerCase('de'); if (known.has(key)) return false; known.add(key); return true; });
    if (unique.length + p.people.length > LIMITS.people) throw new Error('Im Prototyp sind höchstens 120 Personen vorgesehen.');
    p.people.push(...unique.map(name => ({ id: id('p'), name, areaIds: p.areas.map(a => a.id), unavailable: [], loadMode: 'auto', loadValue: 2 })));
    if (unique.length) invalidate(p);
    return { added: unique.length, skipped: names.length - unique.length };
  }
  function setupIssues(p) {
    const errors = [];
    const add = (code, message, extra = {}) => errors.push({ code, message, ...extra });
    if (!p.event.name.trim()) add('event', 'Gib deiner Veranstaltung einen Namen.');
    if (!Number.isFinite(minute(p.event.start)) || !Number.isFinite(minute(p.event.end)) || minute(p.event.end) <= minute(p.event.start)) add('event', 'Das Ende muss nach dem Beginn liegen – bei Nachtschichten am Folgetag.');
    if (!p.areas.length || !p.shifts.length) add('areas', 'Lege mindestens einen Arbeitsbereich mit Schichten an.');
    if (!p.people.length) add('people', 'Trage mindestens eine Person ein.');
    if (p.shifts.length > LIMITS.shifts || p.shifts.reduce((n, s) => n + s.required, 0) > LIMITS.seats) add('size', 'Der Plan überschreitet die Prototyp-Grenze von 400 Schichten / 1.200 Plätzen.');
    for (const shift of p.shifts) {
      const area = p.areas.find(a => a.id === shift.areaId);
      if (!area || !Number.isFinite(duration(shift)) || duration(shift) <= 0 || !Number.isInteger(shift.required) || shift.required < 1 || shift.required > 30) add('shift', 'Eine Schicht hat ungültige Zeiten oder eine ungültige Besetzung.', { shiftId: shift.id });
      else if (minute(shift.start) < minute(p.event.start) || minute(shift.end) > minute(p.event.end)) add('shift', `${area.name}: Eine Schicht liegt außerhalb der Veranstaltung.`, { shiftId: shift.id });
    }
    for (const person of p.people) {
      if (!person.name.trim()) add('person', 'Eine Person hat noch keinen Namen.', { personId: person.id });
      if (person.loadMode !== 'auto' && (!Number.isInteger(person.loadValue) || person.loadValue < 0 || person.loadValue > LIMITS.shifts)) add('person', `${person.name}: Bitte eine gültige Schichtanzahl eingeben.`, { personId: person.id });
      if (person.unavailable.some(range => !Number.isFinite(duration(range)) || duration(range) <= 0)) add('person', `${person.name}: Eine Sperrzeit ist ungültig.`, { personId: person.id });
    }
    return errors;
  }
  function assignmentIssues(p, assignments = p.assignments, { complete = true } = {}) {
    const errors = [], busy = Object.fromEntries(p.people.map(person => [person.id, []]));
    for (const shift of p.shifts) {
      const names = (assignments[shift.id] || []).filter(Boolean);
      const area = p.areas.find(a => a.id === shift.areaId)?.name || 'Bereich';
      if (names.length > shift.required || (complete && names.length < shift.required)) errors.push({ code: 'staffing', shiftId: shift.id, message: `${area}, ${shortRange(shift)}: ${names.length} von ${shift.required} Plätzen besetzt.` });
      if (names.length !== new Set(names).size) errors.push({ code: 'duplicate', shiftId: shift.id, message: `${area}: Eine Person ist in derselben Schicht doppelt eingetragen.` });
      for (const personId of names) {
        const person = p.people.find(x => x.id === personId);
        if (!person) { errors.push({ code: 'unknown', message: 'Eine Zuteilung verweist auf eine gelöschte Person.' }); continue; }
        if (!eligible(p, person, shift)) errors.push({ code: 'eligibility', personId, shiftId: shift.id, message: `${person.name} kann ${area} (${shortRange(shift)}) nicht übernehmen.` });
        if (busy[personId].some(other => overlap(other, shift))) errors.push({ code: 'overlap', personId, shiftId: shift.id, message: `${person.name} ist zeitgleich mehrfach eingeteilt (${shortRange(shift)}).` });
        busy[personId].push(shift);
      }
    }
    const stats = totals(p, assignments);
    for (const person of p.people) {
      if (stats[person.id].count > cap(person)) errors.push({ code: 'limit', personId: person.id, message: `${person.name}: Zu viele Schichten (${stats[person.id].count} statt höchstens ${cap(person)}).` });
      else if (complete && person.loadMode === 'exact' && stats[person.id].count !== person.loadValue) errors.push({ code: 'exact', personId: person.id, message: `${person.name}: ${stats[person.id].count} statt genau ${person.loadValue} Schichten.` });
    }
    return errors;
  }
  function shortDate(value) { return value.slice(8, 10) + '.' + value.slice(5, 7) + '.'; }
  function shortRange(shift) { return shortDate(shift.start) + ' ' + shift.start.slice(11) + '–' + (shift.start.slice(0, 10) !== shift.end.slice(0, 10) ? shortDate(shift.end) + ' ' : '') + shift.end.slice(11); }
  function hours(minutes) { return (minutes / 60).toLocaleString('de-DE', { maximumFractionDigits: 2 }) + ' h'; }

  // Explicit allow-list: imports cannot introduce executable code or object prototypes.
  function decode(raw) {
    let value;
    try { value = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { throw new Error('Die Datei enthält kein gültiges JSON.'); }
    if (value?.format === 'ehrenhub-schichtplan') value = value.project;
    if (!value || value.version !== 1) throw new Error('Das ist keine unterstützte Ehrenhub-Schichtplandatei.');
    const text = (v, max = 70) => { if (typeof v !== 'string' || v.length > max) throw new Error('Ungültiger oder zu langer Text in der Datei.'); return v; };
    const key = v => { if (typeof v !== 'string' || !/^[a-z][a-z0-9_-]{0,79}$/i.test(v) || ['__proto__', 'constructor', 'prototype'].includes(v)) throw new Error('Ungültige Kennung in der Datei.'); return v; };
    const list = (v, max) => { if (!Array.isArray(v) || v.length > max) throw new Error('Die Datei enthält zu viele oder ungültige Einträge.'); return v; };
    const integer = (v, min, max) => { if (!Number.isInteger(v) || v < min || v > max) throw new Error('Ungültiger Zahlenwert in der Datei.'); return v; };
    const range = r => { if (!r || !Number.isFinite(minute(r.start)) || !Number.isFinite(minute(r.end)) || minute(r.end) <= minute(r.start)) throw new Error('Ungültiger Zeitraum in der Datei.'); return { start: r.start, end: r.end }; };
    const p = initial();
    p.step = integer(value.step ?? 0, 0, 4);
    const draftDate = v => { text(v, 16); if (v !== '' && !Number.isFinite(minute(v))) throw new Error('Ungültiges Veranstaltungsdatum.'); return v; };
    p.event = { name: text(value.event?.name ?? '', 120), location: text(value.event?.location ?? '', 120), start: draftDate(value.event?.start), end: draftDate(value.event?.end), minutes: integer(value.event.minutes, 5, 1440) };
    if (!Number.isFinite(minute(p.event.start)) || !Number.isFinite(minute(p.event.end)) || minute(p.event.end) <= minute(p.event.start)) p.step = 0;
    p.areas = list(value.areas, LIMITS.areas).map(a => ({ id: key(a.id), name: text(a.name), color: COLORS.includes(a.color) ? a.color : 'sage' }));
    p.shifts = list(value.shifts, LIMITS.shifts).map(s => ({ id: key(s.id), areaId: key(s.areaId), ...range(s), required: integer(s.required, 1, 30) }));
    p.people = list(value.people, LIMITS.people).map(person => ({ id: key(person.id), name: text(person.name), areaIds: [...new Set(list(person.areaIds, LIMITS.areas).map(key))], unavailable: list(person.unavailable, LIMITS.unavailable).map(range), loadMode: ['auto', 'max', 'exact'].includes(person.loadMode) ? person.loadMode : 'auto', loadValue: integer(person.loadValue ?? 2, 0, LIMITS.shifts) }));
    for (const items of [p.areas, p.shifts, p.people]) if (new Set(items.map(x => x.id)).size !== items.length) throw new Error('Doppelte Kennungen in der Datei.');
    if (p.shifts.some(s => !p.areas.some(a => a.id === s.areaId)) || p.people.some(person => person.areaIds.some(area => !p.areas.some(a => a.id === area)))) throw new Error('Ein Arbeitsbereich in der Datei fehlt.');
    if (p.shifts.reduce((n, s) => n + s.required, 0) > LIMITS.seats) throw new Error('Die Datei überschreitet 1.200 Plätze.');
    p.rules = { fairness: value.rules?.fairness === 'count' ? 'count' : 'minutes', preferBreaks: value.rules?.preferBreaks !== false };
    for (const shift of p.shifts) {
      const persons = list(value.assignments?.[shift.id] ?? [], 30).map(v => v === '' ? '' : key(v));
      if (persons.length > shift.required || persons.some(v => v && !p.people.some(person => person.id === v))) throw new Error('Ungültige Zuteilung in der Datei.');
      p.assignments[shift.id] = persons;
      const locked = list(value.locks?.[shift.id] ?? [], 30).map(key);
      if (locked.some(v => !persons.includes(v))) throw new Error('Eine fixierte Zuteilung fehlt in der Datei.');
      p.locks[shift.id] = [...new Set(locked)];
    }
    return p;
  }
  function restore(raw) { try { return { project: decode(raw), recovered: false }; } catch { return { project: initial(), recovered: !!raw }; } }
  function demo() {
    const p = initial();
    p.event.name = 'Sommerfest der Pfarrjugend'; p.event.location = 'Pfarrgarten';
    addArea(p, 'Getränke', p.event.start, p.event.end, 60, 2);
    addArea(p, 'Grill & Küche', p.event.start, p.event.end, 60, 2);
    addArea(p, 'Einlass', p.event.start, dateTime(minute(p.event.start) + 240), 60, 1);
    addPeople(p, 'Alex, Kim, Toni, Sam, Robin, Jule, Max, Mia, Luca, Chris, Nika, Ben, Lou, Lea, Finn, Jo');
    p.people[0].unavailable.push({ start: p.event.start, end: dateTime(minute(p.event.start) + 60) });
    p.people[1].areaIds = [p.areas[0].id, p.areas[2].id];
    p.step = 3;
    return p;
  }
  function json(p) { return JSON.stringify({ format: 'ehrenhub-schichtplan', exportedAt: new Date().toISOString(), project: p }, null, 2); }
  function csv(p) {
    const cell = v => { let s = String(v ?? ''); if (/^[\s]*[=+@-]/.test(s) || /^[\t\r\n]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    const rows = [['Veranstaltung', 'Arbeitsbereich', 'Beginn', 'Ende', 'Person', 'Fixiert']];
    for (const shift of orderedShifts(p)) for (let at = 0; at < shift.required; at++) {
      const personId = p.assignments[shift.id]?.[at];
      rows.push([p.event.name, p.areas.find(a => a.id === shift.areaId)?.name, shift.start.replace('T', ' '), shift.end.replace('T', ' '), p.people.find(person => person.id === personId)?.name || 'OFFEN', (p.locks[shift.id] || []).includes(personId) ? 'Ja' : 'Nein']);
    }
    return '\uFEFF' + rows.map(row => row.map(cell).join(';')).join('\r\n');
  }
  root.EH.ShiftModel = { LIMITS, COLORS, id, clone, minute, dateTime, duration, overlap, initial, orderedShifts, eligible, cap, totals, makeShifts, addArea, addPeople, invalidate, setupIssues, assignmentIssues, shortDate, shortRange, hours, decode, restore, demo, json, csv };
})(globalThis);
