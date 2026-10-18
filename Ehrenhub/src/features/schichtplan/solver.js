/** Bounded constraint search. Hard rules are never traded against fairness. */
(function (root) {
  'use strict';
  const M = root.EH.ShiftModel;

  function solve(project, options = {}) {
    const started = Date.now(), budget = options.budgetMs ?? 1000, maxNodes = options.maxNodes ?? 24000;
    const setup = M.setupIssues(project);
    if (setup.length) return { status: 'invalid', issues: setup, assignments: null, nodes: 0 };
    const people = project.people, shifts = M.orderedShifts(project);
    const personIndex = new Map(people.map((p, i) => [p.id, i]));
    const data = shifts.map(s => ({ ...s, from: M.minute(s.start), to: M.minute(s.end), minutes: M.duration(s) }));
    const possible = data.map(s => people.map((person, i) => M.eligible(project, person, s) && M.cap(person) > 0 ? i : -1).filter(i => i >= 0));
    const assigned = data.map(s => [...(project.locks[s.id] || [])]);
    const asObject = () => Object.fromEntries(data.map((s, i) => [s.id, [...assigned[i]]]));
    const lockedIssues = M.assignmentIssues(project, asObject(), { complete: false });
    if (lockedIssues.length) return { status: 'invalid', issues: lockedIssues.map(x => ({ ...x, message: 'Fixierung prüfen: ' + x.message })), assignments: null, nodes: 0 };
    const busy = people.map(() => []), counts = people.map(() => 0), minutes = people.map(() => 0);
    assigned.forEach((ids, s) => ids.forEach(id => { const i = personIndex.get(id); busy[i].push(s); counts[i]++; minutes[i] += data[s].minutes; }));
    const total = data.reduce((n, s) => n + s.required, 0), initialCount = counts.reduce((a, b) => a + b, 0);
    let nodes = 0, timedOut = false, found = false, bestCount = initialCount, best = asObject();
    const preflight = [];
    data.forEach((s, i) => {
      if (possible[i].length < s.required) preflight.push({ code: 'capacity', shiftId: s.id, message: `${project.areas.find(a => a.id === s.areaId).name}, ${M.shortRange(s)}: ${s.required} Personen benötigt, aber nur ${possible[i].length} dürfen und können diese Schicht übernehmen.` });
    });
    const exactTotal = people.reduce((n, p) => n + (p.loadMode === 'exact' ? p.loadValue : 0), 0);
    if (exactTotal > total) preflight.push({ code: 'exact-total', message: `Die festen Vorgaben verlangen ${exactTotal} Schichten, es gibt aber nur ${total} Plätze.` });
    function fits(i, s) {
      return counts[i] < M.cap(people[i]) && !busy[i].some(t => data[t].from < data[s].to && data[s].from < data[t].to);
    }
    function score(i, s) {
      const load = project.rules.fairness === 'count' ? counts[i] * 60 : minutes[i];
      const consecutive = project.rules.preferBreaks && busy[i].some(t => data[t].to === data[s].from || data[s].to === data[t].from) ? 0.4 : 0;
      const exact = people[i].loadMode === 'exact' && counts[i] < people[i].loadValue ? -100000 : 0;
      // Stable tie break keeps identical inputs reproducible.
      return load + consecutive + exact + i * 0.00001;
    }
    function choose(allowBlocked = false) {
      let selected = null;
      for (let s = 0; s < data.length; s++) {
        const remaining = data[s].required - assigned[s].length;
        if (remaining <= 0) continue;
        const candidates = possible[s].filter(i => fits(i, s));
        if (allowBlocked && candidates.length === 0) continue;
        const slack = candidates.length - remaining;
        if (!selected || slack < selected.slack) selected = { s, candidates, slack };
        if (!allowBlocked && slack < 0) break;
      }
      if (selected) selected.candidates.sort((a, b) => score(a, selected.s) - score(b, selected.s));
      return selected;
    }
    function put(i, s) { assigned[s].push(people[i].id); busy[i].push(s); counts[i]++; minutes[i] += data[s].minutes; }
    function take(i, s) { assigned[s].pop(); busy[i].pop(); counts[i]--; minutes[i] -= data[s].minutes; }
    function exactPossible() {
      for (let i = 0; i < people.length; i++) {
        if (people[i].loadMode !== 'exact') continue;
        const missing = people[i].loadValue - counts[i];
        if (missing <= 0) continue;
        let potential = 0;
        for (let s = 0; s < data.length; s++) if (assigned[s].length < data[s].required && possible[s].includes(i) && fits(i, s)) potential++;
        if (potential < missing) return false;
      }
      return true;
    }
    function search(filled) {
      if (++nodes > maxNodes || Date.now() - started >= budget) { timedOut = true; return false; }
      if (filled > bestCount) { bestCount = filled; best = asObject(); }
      if (filled === total) {
        if (people.some((p, i) => p.loadMode === 'exact' && counts[i] !== p.loadValue)) return false;
        best = asObject(); found = true; return true;
      }
      if (!exactPossible()) return false;
      const next = choose();
      if (!next || next.slack < 0) return false;
      for (const i of next.candidates) {
        put(i, next.s);
        if (search(filled + 1)) return true;
        take(i, next.s);
        if (timedOut) return false;
      }
      return false;
    }
    if (!preflight.length) search(initialCount);
    if (!found) {
      // A transparent partial proposal is more useful than silently relaxing rules.
      for (let s = 0; s < assigned.length; s++) assigned[s] = [...(project.locks[data[s].id] || [])];
      busy.forEach(items => { items.length = 0; }); counts.fill(0); minutes.fill(0);
      assigned.forEach((ids, s) => ids.forEach(id => { const i = personIndex.get(id); busy[i].push(s); counts[i]++; minutes[i] += data[s].minutes; }));
      let filled = initialCount, next;
      while (Date.now() - started < budget + 150 && (next = choose(true))) { put(next.candidates[0], next.s); filled++; }
      if (filled > bestCount) { best = asObject(); bestCount = filled; }
    }
    const hardIssues = M.assignmentIssues(project, best, { complete: false });
    if (hardIssues.length) return { status: 'invalid', assignments: null, issues: hardIssues, nodes };
    if (found) best = improveFairness(project, best, started + budget);
    const issues = M.assignmentIssues(project, best);
    return { status: !issues.length ? 'complete' : timedOut ? 'limit' : 'partial', assignments: best,
      issues: [...preflight, ...issues], nodes, milliseconds: Date.now() - started, filled: bestCount, total };
  }

  // Locally improve the first complete solution. No claim of global optimality.
  function improveFairness(p, assignments, deadline) {
    const result = M.clone(assignments);
    for (let pass = 0; pass < 4 && Date.now() < deadline; pass++) {
      let changed = false;
      const stats = M.totals(p, result);
      for (const shift of p.shifts) {
        if (Date.now() >= deadline) break;
        const weight = p.rules.fairness === 'count' ? 1 : M.duration(shift);
        const key = p.rules.fairness === 'count' ? 'count' : 'minutes';
        for (let at = 0; at < (result[shift.id] || []).length; at++) {
          const oldId = result[shift.id][at], old = p.people.find(x => x.id === oldId);
          if (old.loadMode === 'exact' || (p.locks[shift.id] || []).includes(oldId)) continue;
          const candidates = [...p.people].sort((a, b) => stats[a.id][key] - stats[b.id][key]);
          for (const person of candidates) {
            if (person.id === oldId || person.loadMode === 'exact' || stats[oldId][key] - stats[person.id][key] <= weight || !M.eligible(p, person, shift)) continue;
            result[shift.id][at] = person.id;
            if (!M.assignmentIssues(p, result, { complete: false }).length) {
              stats[oldId].count--; stats[oldId].minutes -= M.duration(shift);
              stats[person.id].count++; stats[person.id].minutes += M.duration(shift);
              changed = true; break;
            }
            result[shift.id][at] = oldId;
          }
        }
      }
      if (!changed) break;
    }
    return result;
  }
  root.EH.ShiftSolver = { solve };
})(globalThis);
