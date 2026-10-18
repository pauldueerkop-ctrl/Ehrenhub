/** Browser adapter for Schichtplan. The shell only delegates events to this module. */
(function (root) {
  'use strict';
  const M = root.EH.ShiftModel, V = root.EH.ShiftView, S = root.EH.ShiftSolver;
  function create({ storage, toast = () => {} }) {
    const restored = M.restore(storage.read('shiftPlan', null));
    let p = restored.project;
    const ui = { personId: null, openAreas: [], areaFilter: '', busy: false, printOptions: root.EH.ShiftPrint.normalizeOptions(), printPreviewOpen: false, printPage: 0, notice: restored.recovered ? 'Ein gespeicherter Plan konnte nicht gelesen werden. Du kannst eine gesicherte Projektdatei öffnen.' : '', error: restored.recovered };
    function render() { return V.render(p, ui); }
    function persist() {
      if (!storage.write('shiftPlan', p)) {
        ui.notice = 'Speichern im Browser ist nicht möglich. Sichere eine Projektdatei, bevor du diese Seite schließt.'; ui.error = true;
        toast(ui.notice);
        return false;
      }
      return true;
    }
    function notice(message, error = false) { ui.notice = message; ui.error = error; }
    function repaint({ focus = false, preserveAreas = true } = {}) {
      const node = document.getElementById('shift-planner');
      if (!node) return;
      if (preserveAreas) ui.openAreas = [...node.querySelectorAll('[data-sp-area-panel][open]')].map(el => el.dataset.spAreaPanel);
      const active = document.activeElement;
      const keepFocus = active?.id || '';
      const focusSelector = Object.entries(active?.dataset || {}).filter(([key]) => key.startsWith('sp') || ['id', 'index', 'area', 'person', 'field', 'start', 'end'].includes(key)).map(([key, value]) => '[data-' + key.replace(/[A-Z]/g, char => '-' + char.toLowerCase()) + '="' + String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"]').join('');
      node.outerHTML = render();
      if (focus) {
        const heading = document.querySelector('#shift-planner .sp-step-heading h2');
        if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); heading.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
      } else if (keepFocus) document.getElementById(keepFocus)?.focus({ preventScroll: true });
      else if (focusSelector) document.querySelector('#shift-planner ' + focusSelector)?.focus({ preventScroll: true });
    }
    function finish(message, options) { if (message) notice(message); persist(); repaint(options); }
    function fail(error) { notice(error.message || String(error), true); repaint(); }
    function edited() {
      const hadPlan = Object.values(p.assignments).some(ids => ids.some(Boolean));
      M.invalidate(p);
      if (hadPlan) notice('Die Vorgaben wurden geändert. Der bisherige Plan und seine Fixierungen wurden zurückgesetzt. Bitte neu berechnen.');
    }
    function validateThrough(step) {
      const errors = M.setupIssues(p).filter(issue => issue.code === 'event' || (step > 1 && ['areas', 'shift', 'size'].includes(issue.code)) || (step > 2 && ['people', 'person'].includes(issue.code)));
      if (errors.length) throw new Error(errors[0].message);
    }
    function go(step) {
      step = Math.max(0, Math.min(4, Number(step)));
      if (step > p.step) validateThrough(step);
      p.step = step; ui.notice = ''; ui.error = false;
      persist(); repaint({ focus: true });
    }
    function confirmReplace(text) {
      return !(p.event.name || p.areas.length || p.people.length) || window.confirm(text + '\nSichere den aktuellen Stand bei Bedarf zuerst mit „Projekt sichern“.');
    }
    function download(content, extension, type) {
      const slug = p.event.name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'Veranstaltung';
      const url = URL.createObjectURL(new Blob([content], { type }));
      const a = document.createElement('a'); a.href = url; a.download = 'Ehrenhub-Schichtplan-' + slug + '.' + extension;
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    function generate() {
      const errors = M.setupIssues(p);
      if (errors.length) throw new Error(errors[0].message);
      ui.busy = true; notice(''); repaint();
      // Let the browser paint the busy state before the bounded local calculation.
      setTimeout(() => {
        try {
          const result = S.solve(p);
          if (result.assignments) {
            const previousValid = !M.assignmentIssues(p).length;
            if (previousValid && result.status !== 'complete') notice('Die Suche hat keinen neuen vollständigen Plan gefunden. Dein bisheriger gültiger Plan bleibt erhalten.', true);
            else {
              p.assignments = result.assignments;
              notice(result.status === 'complete' ? 'Plan erstellt. Alle festen Vorgaben sind erfüllt. Bitte vor dem Einsatz organisatorisch prüfen.' : (result.status === 'limit' ? 'Das Suchlimit wurde erreicht. ' : '') + 'Noch kein vollständiger gültiger Plan gefunden. ' + (result.issues[0]?.message || 'Bitte Verfügbarkeiten und Besetzung prüfen.'), result.status !== 'complete');
            }
            p.step = 4;
          } else notice(result.issues[0]?.message || 'Bitte die Eingaben prüfen.', true);
          persist();
        } catch (error) { notice('Die Berechnung wurde abgebrochen: ' + error.message, true); }
        finally { ui.busy = false; repaint({ focus: true }); }
      }, 35);
    }
    function availability(person, range, available) {
      let intervals = person.unavailable.map(r => ({ from: M.minute(r.start), to: M.minute(r.end) }));
      const from = M.minute(range.start), to = M.minute(range.end);
      if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) throw new Error('Bitte eine gültige Sperrzeit eingeben.');
      if (!available) intervals.push({ from, to });
      else intervals = intervals.flatMap(r => r.to <= from || r.from >= to ? [r] : [r.from < from ? { from: r.from, to: from } : null, r.to > to ? { from: to, to: r.to } : null].filter(Boolean));
      intervals.sort((a, b) => a.from - b.from);
      const merged = [];
      for (const interval of intervals) {
        const last = merged.at(-1);
        if (last && last.to >= interval.from) last.to = Math.max(last.to, interval.to); else merged.push({ ...interval });
      }
      if (merged.length > M.LIMITS.unavailable) throw new Error('Zu viele einzelne Sperrzeiten. Bitte Zeiträume zusammenfassen.');
      person.unavailable = merged.map(r => ({ start: M.dateTime(r.from), end: M.dateTime(r.to) }));
    }
    function handleClick(event) {
      const target = event.target.closest?.('[data-sp-action]');
      if (!target) return false;
      event.preventDefault(); if (ui.busy) return true;
      const { spAction: action, id, index } = target.dataset;
      try {
        if (action === 'step') go(target.dataset.step);
        if (action === 'back') go(p.step - 1);
        if (action === 'next') go(p.step + 1);
        if (action === 'generate') generate();
        if (action === 'edit-person') { ui.personId = ui.personId === id ? null : id; repaint(); }
        if (action === 'save') { download(M.json(p), 'json', 'application/json'); notice('Projektdatei vorbereitet. Sie enthält die eingetragenen Namen – bitte nur gezielt weitergeben.'); repaint(); }
        if (action === 'csv') { download(M.csv(p), 'csv', 'text/csv;charset=utf-8'); notice('CSV für den gesamten Plan vorbereitet. Offene Plätze sind mit OFFEN markiert.'); repaint(); }
        if (action === 'print-preview') {
          ui.printPreviewOpen = !ui.printPreviewOpen; ui.printPage = 0; repaint();
          if (ui.printPreviewOpen) { const title = document.getElementById('sp-export-title'); title?.focus({ preventScroll: true }); title?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
        }
        if (action === 'print-prev' || action === 'print-next') {
          const doc = root.EH.ShiftPrint.build(p, ui.printOptions);
          ui.printPage = Math.max(0, Math.min(doc.pages.length - 1, ui.printPage + (action === 'print-next' ? 1 : -1))); repaint();
        }
        if (action === 'print') {
          const doc = root.EH.ShiftPrint.build(p, ui.printOptions);
          if (doc.error) throw new Error(doc.error);
          window.print();
        }
        if (action === 'import') document.getElementById('sp-import')?.click();
        if (action === 'demo' && confirmReplace('Beispiel laden und den aktuellen Plan ersetzen?')) { p = M.demo(); ui.personId = null; ui.areaFilter = ''; finish('Beispiel mit erfundenen Namen geladen. Du kannst es beliebig anpassen.', { focus: true }); }
        if (action === 'reset' && confirmReplace('Den aktuellen Schichtplan auf diesem Gerät löschen?')) { p = M.initial(); ui.personId = null; ui.areaFilter = ''; finish('Neuer Plan. Andere Ehrenhub-Daten bleiben erhalten.', { focus: true }); }
        if (action === 'remove-area' && window.confirm('Diesen Bereich und seine Schichten entfernen? Ein vorhandener Plan wird dabei zurückgesetzt.')) {
          p.areas = p.areas.filter(a => a.id !== id); p.shifts = p.shifts.filter(s => s.areaId !== id); p.people.forEach(person => { person.areaIds = person.areaIds.filter(a => a !== id); }); edited(); finish();
        }
        if (action === 'remove-shift' && window.confirm('Diese Schicht entfernen? Ein vorhandener Plan wird dabei zurückgesetzt.')) { p.shifts = p.shifts.filter(s => s.id !== id); edited(); finish(); }
        if (action === 'remove-person' && window.confirm('Diese Person entfernen? Ein vorhandener Plan wird dabei zurückgesetzt.')) { p.people = p.people.filter(person => person.id !== id); ui.personId = null; edited(); finish(); }
        if (action === 'remove-absence') { const person = p.people.find(x => x.id === id); person.unavailable.splice(Number(index), 1); edited(); finish(); }
      } catch (error) { fail(error); }
      return true;
    }
    function handleSubmit(event) {
      const form = event.target, type = form.dataset?.spForm;
      if (!type) return false;
      event.preventDefault(); if (ui.busy) return true;
      const data = Object.fromEntries(new FormData(form).entries());
      try {
        if (type === 'event') {
          const minutes = Number(data.minutes);
          if (!Number.isInteger(minutes) || minutes < 5 || minutes > 1440) throw new Error('Die Schichtlänge muss 5–1.440 Minuten betragen.');
          p.event = { name: String(data.name || '').trim().slice(0, 120), location: String(data.location || '').trim().slice(0, 120), start: data.start, end: data.end, minutes };
          persist(); validateThrough(1); go(1);
        }
        if (type === 'area') {
          const area = M.addArea(p, data.name, data.start, data.end, Number(data.minutes), Number(data.required));
          ui.openAreas = [area.id]; finish('Bereich angelegt. Neue Bereiche sind zunächst für alle Teammitglieder freigegeben.', { preserveAreas: false });
        }
        if (type === 'single-shift') {
          const size = M.minute(data.end) - M.minute(data.start);
          const added = M.makeShifts(form.dataset.id, data.start, data.end, Math.max(5, size), Number(data.required));
          if (M.minute(data.start) < M.minute(p.event.start) || M.minute(data.end) > M.minute(p.event.end)) throw new Error('Die Schicht muss innerhalb der Veranstaltung liegen.');
          if (p.shifts.length + added.length > M.LIMITS.shifts || p.shifts.reduce((n, s) => n + s.required, 0) + Number(data.required) > M.LIMITS.seats) throw new Error('Prototyp-Grenze erreicht: höchstens 400 Schichten und 1.200 Plätze.');
          p.shifts.push(...added); edited(); finish('Schicht hinzugefügt.');
        }
        if (type === 'people') { const result = M.addPeople(p, data.names); finish(`${result.added} Personen hinzugefügt.${result.skipped ? ' ' + result.skipped + ' doppelte Namen übersprungen.' : ''}`); }
        if (type === 'unavailable') { const person = p.people.find(x => x.id === form.dataset.id); availability(person, { start: data.start, end: data.end }, false); edited(); finish('Sperrzeit gespeichert.'); }
      } catch (error) { fail(error); }
      return true;
    }
    function handleInput(event) {
      const el = event.target;
      if (el.dataset?.spEvent === 'name' || el.dataset?.spEvent === 'location') {
        if (!ui.busy) { p.event[el.dataset.spEvent] = el.value.slice(0, 120); persist(); }
        return true;
      }
      return false;
    }
    function handleChange(event) {
      const el = event.target, d = el.dataset || {};
      if (!Object.keys(d).some(key => key.startsWith('sp'))) return false;
      if (ui.busy) return true;
      try {
        if ('spImport' in d) { importFile(el.files?.[0]); return true; }
        notice('');
        if ('spPrintOption' in d) {
          if (['areasPerPage', 'hoursPerPage', 'includePeople'].includes(d.spPrintOption)) {
            ui.printOptions = root.EH.ShiftPrint.normalizeOptions({ ...ui.printOptions, [d.spPrintOption]: d.spPrintOption === 'includePeople' ? el.checked : Number(el.value) });
            ui.printPage = 0; repaint();
          }
          return true;
        }
        if ('spEvent' in d) {
          if (!['name', 'location', 'start', 'end', 'minutes'].includes(d.spEvent)) return true;
          const previous = { ...p.event };
          p.event[d.spEvent] = d.spEvent === 'minutes' ? Number(el.value) : el.value;
          if (!Number.isInteger(p.event.minutes) || p.event.minutes < 5 || p.event.minutes > 1440) { p.event = previous; throw new Error('Die Schichtlänge muss 5–1.440 Minuten betragen.'); }
          if (['start', 'end'].includes(d.spEvent)) edited();
        }
        if ('spAreaName' in d) { const name = el.value.trim().slice(0, 70); if (!name) throw new Error('Der Bereich braucht einen Namen.'); p.areas.find(a => a.id === d.spAreaName).name = name; }
        if ('spShift' in d) {
          const shift = p.shifts.find(s => s.id === d.spShift), old = { ...shift };
          if (!['start', 'end', 'required'].includes(d.field)) return true;
          shift[d.field] = d.field === 'required' ? Number(el.value) : el.value;
          const issue = M.setupIssues(p).find(x => x.shiftId === shift.id || x.code === 'size');
          if (issue) { Object.assign(shift, old); throw new Error(issue.message); }
          edited();
        }
        if ('spPersonName' in d) {
          const name = el.value.trim().slice(0, 70);
          if (!name) throw new Error('Bitte einen Namen eintragen.');
          if (p.people.some(person => person.id !== d.spPersonName && person.name.toLowerCase() === name.toLowerCase())) throw new Error('Dieser Name ist bereits vergeben. Bitte einen unterscheidbaren Namen verwenden.');
          p.people.find(person => person.id === d.spPersonName).name = name;
        }
        if ('spPersonMode' in d) { if (!['auto', 'max', 'exact'].includes(el.value)) return true; p.people.find(person => person.id === d.spPersonMode).loadMode = el.value; edited(); }
        if ('spPersonLimit' in d) { const value = Number(el.value); if (!Number.isInteger(value) || value < 0 || value > 400) throw new Error('Bitte eine ganze Zahl zwischen 0 und 400 eingeben.'); p.people.find(person => person.id === d.spPersonLimit).loadValue = value; edited(); }
        if ('spEligibility' in d) { const person = p.people.find(person => person.id === d.spEligibility); person.areaIds = person.areaIds.filter(id => id !== d.area); if (el.checked) person.areaIds.push(d.area); edited(); }
        if ('spAvailability' in d) { availability(p.people.find(person => person.id === d.spAvailability), { start: d.start, end: d.end }, el.checked); edited(); }
        if ('spRule' in d) { if (d.spRule === 'fairness') p.rules.fairness = el.value === 'count' ? 'count' : 'minutes'; if (d.spRule === 'preferBreaks') p.rules.preferBreaks = el.checked; notice('Einstellung gespeichert. Sie gilt bei der nächsten Berechnung.'); }
        if ('spAreaFilter' in d) ui.areaFilter = el.value;
        if ('spAssign' in d) {
          const shift = p.shifts.find(s => s.id === d.spAssign), at = Number(d.index), old = p.assignments[shift.id] || [];
          if (!Number.isInteger(at) || at < 0 || at >= shift.required || (p.locks[shift.id] || []).includes(old[at])) throw new Error('Diese Zuteilung ist fixiert. Bitte zuerst die Fixierung entfernen.');
          const next = Array.from({ length: shift.required }, (_, i) => old[i] || ''); next[at] = el.value;
          const proposal = { ...p.assignments, [shift.id]: next };
          const issue = M.assignmentIssues(p, proposal, { complete: false })[0];
          if (issue) throw new Error(issue.message);
          p.assignments = proposal; notice('Zuteilung geändert. Zum Beibehalten bei Neuberechnung „Fixieren“ aktivieren.');
        }
        if ('spLock' in d) { p.locks[d.spLock] = (p.locks[d.spLock] || []).filter(id => id !== d.person); if (el.checked && d.person) p.locks[d.spLock].push(d.person); notice(el.checked ? 'Diese Zuteilung bleibt bei einer Neuberechnung erhalten.' : 'Fixierung aufgehoben.'); }
        // Do not replace a focused text/date field on blur: that would swallow
        // the following click on Next / Add / another field in real browsers.
        const plainField = ['spEvent', 'spAreaName', 'spShift', 'spPersonName', 'spPersonLimit'].some(key => key in d);
        if (plainField) {
          persist();
          const status = document.getElementById('sp-status'); if (status) status.innerHTML = V.notice(ui);
          const sidebar = document.querySelector('#shift-planner .sp-sidebar'); if (sidebar) sidebar.outerHTML = V.summary(p);
        } else finish();
      } catch (error) { fail(error); }
      return true;
    }
    async function importFile(file) {
      if (!file) return;
      try {
        if (file.size > 2 * 1024 * 1024) throw new Error('Die Projektdatei darf höchstens 2 MB groß sein.');
        const next = M.decode(await file.text());
        if (!confirmReplace('Projektdatei öffnen und den aktuellen Plan ersetzen?')) return;
        p = next; ui.personId = null; ui.areaFilter = ''; ui.openAreas = [];
        finish('Projekt geladen. Zuteilungen werden beim Öffnen und Ändern erneut geprüft.', { focus: true, preserveAreas: false });
      } catch (error) { fail(error); }
    }
    function reset() { p = M.initial(); ui.notice = ''; ui.error = false; ui.personId = null; ui.areaFilter = ''; ui.printPreviewOpen = false; ui.printPage = 0; }
    return { render, reset, handleClick, handleSubmit, handleInput, handleChange };
  }
  root.EH.ShiftController = { create };
})(globalThis);
