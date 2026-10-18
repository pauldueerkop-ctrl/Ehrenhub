/** Paged vector timetable. Pure layout + SVG; native browser printing needs no PDF library. */
(function (root) {
  'use strict';
  const M = root.EH.ShiftModel, escape = root.EH.Core.escapeHTML;
  const WIDTH = 842, HEIGHT = 595, MARGIN = 32, BOTTOM = 543, MAX_PAGES = 160;
  const COLORS = [
    { fill: '#e8f0e3', accent: '#345c40' }, { fill: '#f7efdc', accent: '#8b6c25' },
    { fill: '#efedf6', accent: '#6b5886' }, { fill: '#f8eae4', accent: '#986249' },
    { fill: '#e7eff3', accent: '#3f697c' }
  ];
  const DEFAULTS = { areasPerPage: 4, hoursPerPage: 6, includePeople: true };
  const normalizeOptions = options => ({
    areasPerPage: [3, 4, 5].includes(Number(options?.areasPerPage)) ? Number(options.areasPerPage) : 4,
    hoursPerPage: [4, 6, 8].includes(Number(options?.hoursPerPage)) ? Number(options.hoursPerPage) : 6,
    includePeople: options?.includePeople !== false
  });
  const time = minutes => M.dateTime(minutes).slice(11);
  const dayStart = minutes => Math.floor(minutes / 1440) * 1440;
  function clock(minutes, day) { return minutes === day + 1440 ? '24:00' : time(minutes); }
  function fullDate(minutes) {
    return new Date(minutes * 60000).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
  const shortRange = s => M.shortRange(s).replace(/–/g, ' - ');

  // Conservative glyph widths keep long names legible without a canvas or network font.
  function textWidth(value, size = 10, bold = false) {
    let width = 0;
    for (const c of String(value)) {
      if (/\p{M}/u.test(c)) continue;
      if (c === ' ') width += .32;
      else if (/[ilI.,:;!'|]/.test(c)) width += .31;
      else if (/[MW@%#]/.test(c)) width += .98;
      else if (/[A-ZÄÖÜ]/.test(c)) width += .74;
      else if (/[mw]/.test(c)) width += .86;
      else if (c.codePointAt(0) > 0x2ff) width += 1.04;
      else width += .60;
    }
    return width * size * (bold ? 1.04 : 1);
  }
  function wrap(value, maxWidth, size = 10, bold = false) {
    const words = String(value ?? '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    const lines = []; let current = '';
    for (const word of words) {
      const candidate = current ? current + ' ' + word : word;
      if (textWidth(candidate, size, bold) <= maxWidth) { current = candidate; continue; }
      if (current) { lines.push(current); current = ''; }
      if (textWidth(word, size, bold) <= maxWidth) { current = word; continue; }
      for (const char of word) {
        if (current && textWidth(current + char, size, bold) > maxWidth) { lines.push(current); current = ''; }
        current += char;
      }
    }
    if (current || !lines.length) lines.push(current);
    return lines;
  }
  function headerInfo(p) {
    const title = wrap(p.event.name || 'Euer Schichtplan', WIDTH - 2 * MARGIN, 23, true);
    const location = p.event.location ? wrap(p.event.location, WIDTH - 2 * MARGIN, 9.5) : [];
    const titleY = 65, subtitleY = titleY + title.length * 27 + 3;
    return { title, titleY, location, subtitleY, contentY: subtitleY + 23 + location.length * 12 };
  }
  function columnsFor(p) {
    const result = [];
    p.areas.forEach((area, areaIndex) => {
      const shifts = M.orderedShifts(p).filter(s => s.areaId === area.id), lanes = [];
      for (const shift of shifts) {
        let lane = lanes.find(items => M.minute(items.at(-1).end) <= M.minute(shift.start));
        if (!lane) { lane = []; lanes.push(lane); }
        lane.push(shift);
      }
      lanes.forEach((shifts, index) => result.push({ id: area.id + ':' + index, areaId: area.id, name: area.name,
        lane: index + 1, laneCount: lanes.length, color: COLORS[areaIndex % COLORS.length], shifts }));
    });
    return result;
  }
  function labelsFor(p, shift) {
    const ids = (p.assignments[shift.id] || []).filter(Boolean);
    const names = ids.map(id => p.people.find(person => person.id === id)?.name || 'Unbekannte Person');
    const missing = Math.max(0, shift.required - ids.length);
    return { names, missing, all: [...names, ...(missing ? ['OFFEN: ' + missing + (missing === 1 ? ' Platz' : ' Plätze')] : [])] };
  }
  function blockText(p, shift, width, teams) {
    const labels = labelsFor(p, shift), allLines = labels.all.flatMap(name => wrap(name, width - 25, 10));
    if (allLines.length <= 6) return { lines: allLines, missing: labels.missing, reference: null, minHeight: 27 + allLines.length * 12 };
    let team = teams.get(shift.id);
    if (!team) { team = { reference: 'T' + String(teams.size + 1).padStart(2, '0'), shift, names: labels.all }; teams.set(shift.id, team); }
    const lines = [];
    for (const name of labels.names) {
      const next = wrap(name, width - 25, 10);
      if (lines.length + next.length > 3) break;
      lines.push(...next);
    }
    if (labels.missing) lines.push('OFFEN: ' + labels.missing + (labels.missing === 1 ? ' Platz' : ' Plätze'));
    lines.push(...wrap('Alle Namen: Team ' + team.reference + ' im Anhang', width - 25, 10));
    return { lines, missing: labels.missing, reference: team.reference, minHeight: 27 + lines.length * 12 };
  }
  function boundaries(from, to, columns) {
    const points = new Set([from, to]);
    for (let tick = Math.ceil(from / 60) * 60; tick < to; tick += 60) if (tick > from) points.add(tick);
    for (const col of columns) for (const shift of col.shifts) {
      const start = M.minute(shift.start), end = M.minute(shift.end);
      if (start < to && end > from) { points.add(Math.max(from, start)); points.add(Math.min(to, end)); }
    }
    return [...points].sort((a, b) => a - b);
  }
  function fitRows(points, blocks, scale) {
    const rows = points.slice(0, -1).map((from, index) => ({ from, to: points[index + 1], height: Math.max(15, (points[index + 1] - from) * scale) }));
    for (const block of blocks) {
      const involved = rows.filter(row => row.from < block.to && row.to > block.from);
      const height = involved.reduce((sum, row) => sum + row.height, 0);
      if (height < block.text.minHeight) {
        const totalTime = involved.reduce((sum, row) => sum + row.to - row.from, 0);
        for (const row of involved) row.height += (block.text.minHeight - height) * (row.to - row.from) / totalTime;
      }
    }
    return rows;
  }
  function calendarPages(p, options, header, teams) {
    const columns = columnsFor(p), pages = [], days = new Set();
    for (const shift of p.shifts) {
      const start = M.minute(shift.start), end = M.minute(shift.end);
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) throw new Error('Bitte zuerst die Schichtzeiten korrigieren.');
      if (end - start > 31 * 1440) throw new Error('Eine einzelne Schicht darf für den PDF-Export höchstens 31 Tage umfassen. CSV bleibt verfügbar.');
      for (let day = dayStart(start); day < end; day += 1440) days.add(day);
      if (days.size > 62) throw new Error('Der PDF-Export unterstützt höchstens 62 belegte Kalendertage. Bitte die Veranstaltung aufteilen.');
    }
    for (const day of [...days].sort((a, b) => a - b)) {
      const dayColumns = columns.filter(col => col.shifts.some(s => M.minute(s.start) < day + 1440 && M.minute(s.end) > day));
      const dayShifts = dayColumns.flatMap(col => col.shifts).filter(s => M.minute(s.start) < day + 1440 && M.minute(s.end) > day);
      const first = Math.max(day, Math.min(...dayShifts.map(s => M.minute(s.start))));
      const last = Math.min(day + 1440, Math.max(...dayShifts.map(s => M.minute(s.end))));
      for (let windowStart = first; windowStart < last; windowStart += options.hoursPerPage * 60) {
        const windowEnd = Math.min(last, windowStart + options.hoursPerPage * 60);
        for (let offset = 0; offset < dayColumns.length; offset += options.areasPerPage) {
          const group = dayColumns.slice(offset, offset + options.areasPerPage);
          if (!group.some(col => col.shifts.some(s => M.minute(s.start) < windowEnd && M.minute(s.end) > windowStart))) continue;
          const gridX = MARGIN + 52, columnWidth = (WIDTH - MARGIN - gridX) / group.length;
          const titles = group.map(col => wrap(col.name, columnWidth - 24, 11, true));
          const headingHeight = Math.max(...titles.map((lines, i) => 17 + lines.length * 13 + (group[i].laneCount > 1 ? 12 : 0)));
          const gridTop = header.contentY + headingHeight, available = BOTTOM - 17 - gridTop;
          if (available < 145) throw new Error('Die Überschriften sind für diese Druckansicht zu lang. Bitte Veranstaltungs- oder Bereichsnamen kürzen.');
          const scale = available / (windowEnd - windowStart);
          const rawBlocks = group.flatMap((col, column) => col.shifts.filter(s => M.minute(s.start) < windowEnd && M.minute(s.end) > windowStart).map(shift => ({
            column, shiftId: shift.id, from: M.minute(shift.start), to: M.minute(shift.end), text: blockText(p, shift, columnWidth, teams)
          })));
          const points = boundaries(windowStart, windowEnd, group);
          let cursor = 0;
          while (cursor < points.length - 1) {
            let chosen = null;
            for (let end = cursor + 1; end < points.length; end++) {
              const from = points[cursor], to = points[end];
              const blocks = rawBlocks.filter(b => b.from < to && b.to > from);
              const rows = fitRows(points.slice(cursor, end + 1), blocks, scale);
              const height = rows.reduce((sum, row) => sum + row.height, 0);
              if (height > available + .01) break;
              chosen = { from, to, rows, blocks, end, height };
            }
            if (!chosen) throw new Error('Die Schichten sind zu dicht für dieses Seitenformat. Bitte weniger Arbeitsbereiche pro Seite wählen.');
            let y = gridTop;
            chosen.rows.forEach(row => { row.y = y; y += row.height; });
            const yAt = value => value === chosen.to ? y : chosen.rows.find(row => row.from === value)?.y;
            const blocks = chosen.blocks.map(block => {
              const from = Math.max(chosen.from, block.from), to = Math.min(chosen.to, block.to);
              return { ...block, clippedFrom: from, clippedTo: to, y: yAt(from), height: yAt(to) - yAt(from), continuesBefore: block.from < chosen.from, continuesAfter: block.to > chosen.to };
            });
            pages.push({ type: 'calendar', day, from: chosen.from, to: chosen.to, columns: group, columnWidth, titles, gridX, gridTop,
              headingHeight, rows: chosen.rows, blocks, gridHeight: chosen.height, group: Math.floor(offset / options.areasPerPage) + 1, groupCount: Math.ceil(dayColumns.length / options.areasPerPage) });
            if (pages.length > MAX_PAGES) throw new Error('Mehr als 160 Druckseiten wären nötig. Bitte weniger Tage oder kürzere Namen verwenden; CSV bleibt unverändert verfügbar.');
            cursor = chosen.end;
          }
        }
      }
    }
    return pages;
  }
  function cardPages(cards, type, header) {
    if (!cards.length) return [];
    const pages = [], width = (WIDTH - 2 * MARGIN - 20) / 2, top = header.contentY + 3, limit = BOTTOM - 7;
    let page = { type, cards: [] }, column = 0, y = top;
    const nextColumn = () => { if (column === 0) column = 1; else { pages.push(page); page = { type, cards: [] }; column = 0; } y = top; };
    for (const card of cards) {
      const heading = wrap(card.heading, width - 26, 12, true), subtitle = wrap(card.subtitle, width - 26, 8.7);
      const headingHeight = 12 + heading.length * 14 + subtitle.length * 10 + 5;
      const items = card.entries.length ? card.entries : ['Keine Schicht zugeteilt.'];
      const units = items.map(entry => wrap(entry, width - 26, 9.6));
      let at = 0, continued = false;
      while (at < units.length) {
        const extra = continued ? 13 : 0;
        if (y + headingHeight + extra + units[at].length * 12 + 14 > limit) nextColumn();
        const lines = []; let height = headingHeight + extra + 6;
        while (at < units.length && y + height + units[at].length * 12 + 4 <= limit) {
          lines.push(...units[at].map((text, index) => ({ text, newEntry: index === 0 })));
          height += units[at].length * 12 + 4; at++;
        }
        if (!lines.length) throw new Error('Ein Text im Export ist zu lang. Bitte Namen oder Bereichsbezeichnungen kürzen.');
        page.cards.push({ ...card, heading, subtitle, lines, continued, x: MARGIN + column * (width + 20), y, width, height, headingHeight: headingHeight + extra });
        y += height + 10; continued = true;
        if (pages.length > MAX_PAGES) throw new Error('Der Anhang würde mehr als 160 Seiten benötigen. Bitte die Veranstaltung aufteilen.');
      }
    }
    if (page.cards.length) pages.push(page);
    return pages;
  }
  function build(p, options = {}) {
    const settings = normalizeOptions(options), header = headerInfo(p);
    const issues = [...M.setupIssues(p), ...M.assignmentIssues(p)];
    const document = { width: WIDTH, height: HEIGHT, settings, header, event: { ...p.event }, issues: issues.length, pages: [], error: '', teamCount: 0 };
    try {
      if (!p.shifts.length) throw new Error('Lege zuerst Schichten an. Danach ist der Stundenplan-Export verfügbar.');
      const teams = new Map();
      document.pages = calendarPages(p, settings, header, teams);
      const teamCards = [...teams.values()].map(team => ({ heading: 'Team ' + team.reference + ' · ' + (p.areas.find(a => a.id === team.shift.areaId)?.name || 'Arbeitsbereich'),
        subtitle: shortRange(team.shift) + ' · ' + team.shift.required + ' Plätze', entries: team.names, reference: team.reference }));
      document.pages.push(...cardPages(teamCards, 'teams', header)); document.teamCount = teams.size;
      if (settings.includePeople) {
        const totals = M.totals(p);
        const cards = p.people.map(person => ({ heading: person.name, subtitle: totals[person.id].count + (totals[person.id].count === 1 ? ' Schicht · ' : ' Schichten · ') + M.hours(totals[person.id].minutes),
          entries: M.orderedShifts(p).filter(s => p.assignments[s.id]?.includes(person.id)).map(s => shortRange(s) + ' · ' + (p.areas.find(a => a.id === s.areaId)?.name || 'Arbeitsbereich')), personId: person.id }));
        document.pages.push(...cardPages(cards, 'people', header));
      }
      if (document.pages.length > MAX_PAGES) throw new Error('Mehr als 160 Seiten wären nötig. Bitte die Veranstaltung aufteilen oder die persönliche Übersicht abwählen.');
    } catch (error) { document.pages = []; document.error = error.message; }
    return document;
  }

  const n = number => Number(number.toFixed(2));
  function rect(x, y, width, height, fill, stroke = 'none', radius = 0, extra = '') {
    return `<rect x="${n(x)}" y="${n(y)}" width="${n(width)}" height="${n(height)}" rx="${radius}" fill="${fill}" stroke="${stroke}" ${extra}/>`;
  }
  function text(x, y, value, size = 10, fill = '#203b30', bold = false, extra = '') {
    return `<text x="${n(x)}" y="${n(y)}" font-size="${size}" fill="${fill}" font-weight="${bold ? 700 : 400}" ${extra}>${escape(value)}</text>`;
  }
  const line = (x1, y1, x2, y2, color = '#dce3da', width = .6) => `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${color}" stroke-width="${width}"/>`;
  function headerSvg(doc, page, index) {
    const h = doc.header;
    let svg = rect(0, 0, WIDTH, HEIGHT, '#ffffff');
    svg += rect(MARGIN, 28, 15, 15, '#173f32', 'none', 4) + text(MARGIN + 4.5, 39, 'e', 11, '#ffffff', true);
    svg += text(MARGIN + 23, 39, 'ehrenhub.', 13, '#173f32', true) + text(MARGIN + 98, 39, 'GEMEINSAM GUT GEPLANT', 7.7, '#6b786e', false, 'letter-spacing="1.1"');
    if (doc.issues) svg += rect(WIDTH - MARGIN - 184, 27, 184, 19, '#fff0e5', '#d7aa8e', 4) + text(WIDTH - MARGIN - 92, 39.8, 'UNVOLLSTÄNDIGER ENTWURF', 8, '#8a4a31', true, 'text-anchor="middle"');
    else svg += text(WIDTH - MARGIN, 39, 'E U E R   E I N S A T Z P L A N', 8, '#6b786e', false, 'text-anchor="end"');
    h.title.forEach((title, at) => { svg += text(MARGIN, h.titleY + at * 27, title, 23, '#173f32', true); });
    const subtitle = page.type === 'calendar' ? fullDate(page.day) + ' · ' + clock(page.from, page.day) + ' - ' + clock(page.to, page.day) : page.type === 'teams' ? 'Schichtdetails · große Teams und lange Namen' : 'Persönliche Übersicht · alle Einsätze auf einen Blick';
    svg += text(MARGIN, h.subtitleY, subtitle, 10.5, '#4b6252', true);
    if (page.type === 'calendar' && page.groupCount > 1) svg += text(WIDTH - MARGIN, h.subtitleY, 'Bereiche ' + page.group + ' / ' + page.groupCount, 8.5, '#6b786e', false, 'text-anchor="end"');
    h.location.forEach((location, at) => { svg += text(MARGIN, h.subtitleY + 14 + at * 12, location, 9.5, '#6b786e'); });
    svg += line(MARGIN, 555, WIDTH - MARGIN, 555);
    let footer = page.type === 'calendar' ? '< / > = Fortsetzung · Zeitraster bei Bedarf für Lesbarkeit gestreckt.' : 'Für euer Team · Zeitangaben in lokaler Veranstaltungszeit.';
    if (doc.issues) footer = 'Offener Entwurf: ' + doc.issues + ' Hinweise in Ehrenhub prüfen. ' + footer;
    svg += text(MARGIN, 570, footer, 7.5, '#6b786e');
    svg += text(WIDTH - MARGIN, 570, 'Seite ' + (index + 1) + ' / ' + doc.pages.length, 8.5, '#173f32', true, 'text-anchor="end"');
    return svg;
  }
  function calendarSvg(page, doc) {
    const { gridX, gridTop, columnWidth, gridHeight, rows } = page;
    let svg = '';
    svg += text(MARGIN, gridTop - 12, 'ZEIT', 7.5, '#6b786e', true, 'letter-spacing=".8"');
    page.columns.forEach((col, index) => {
      const x = gridX + index * columnWidth;
      svg += rect(x + 2, gridTop - page.headingHeight, columnWidth - 4, page.headingHeight - 5, col.color.fill, 'none', 4);
      svg += rect(x + 2, gridTop - page.headingHeight, 3, page.headingHeight - 5, col.color.accent, 'none', 1);
      page.titles[index].forEach((title, at) => { svg += text(x + 12, gridTop - page.headingHeight + 16 + at * 13, title, 11, col.color.accent, true); });
      if (col.laneCount > 1) svg += text(x + 12, gridTop - 13, 'Parallel ' + col.lane + ' / ' + col.laneCount, 8, col.color.accent);
      svg += rect(x, gridTop, columnWidth, gridHeight, index % 2 ? '#fbfcf9' : '#ffffff');
      svg += line(x, gridTop, x, gridTop + gridHeight);
      if (!page.blocks.some(block => block.column === index)) svg += text(x + columnWidth / 2, gridTop + 23, 'Kein Einsatz in diesem Zeitraum', 8, '#879084', false, 'text-anchor="middle"');
    });
    svg += line(WIDTH - MARGIN, gridTop, WIDTH - MARGIN, gridTop + gridHeight);
    for (const row of rows) {
      svg += line(gridX, row.y, WIDTH - MARGIN, row.y, row.from % 60 ? '#e8ece5' : '#cbd5c7');
      svg += text(gridX - 10, row.y + 3, clock(row.from, page.day), 8.2, '#5c6f5f', row.from % 60 === 0, 'text-anchor="end"');
    }
    svg += line(gridX, gridTop + gridHeight, WIDTH - MARGIN, gridTop + gridHeight, '#cbd5c7');
    svg += text(gridX - 10, gridTop + gridHeight + 3, clock(page.to, page.day), 8.2, '#5c6f5f', true, 'text-anchor="end"');
    for (const block of page.blocks) {
      const col = page.columns[block.column], x = gridX + block.column * columnWidth + 3, y = block.y + 3;
      const fill = block.text.missing ? '#fff3e9' : col.color.fill, ink = block.text.missing ? '#884a2e' : col.color.accent;
      svg += rect(x, y, columnWidth - 6, block.height - 6, fill, block.text.missing ? '#cf9979' : '#cbd8c4', 4, 'stroke-width=".6"');
      svg += rect(x, y + 4, 2.6, Math.max(0, block.height - 14), ink, 'none', 1);
      const times = (block.continuesBefore ? '< ' : '') + clock(block.clippedFrom, page.day) + ' - ' + clock(block.clippedTo, page.day) + (block.continuesAfter ? ' >' : '');
      svg += text(x + 10, y + 12, times, 8.2, ink, false);
      block.text.lines.forEach((name, at) => { svg += text(x + 10, y + 27 + at * 12, name, 10, name.startsWith('OFFEN:') ? '#9b4828' : '#203b30', name.startsWith('OFFEN:')); });
    }
    return svg;
  }
  function cardsSvg(page) {
    let svg = '';
    page.cards.forEach(card => {
      svg += rect(card.x, card.y, card.width, card.height, '#fafcf8', '#d9e2d4', 6);
      svg += rect(card.x, card.y + 6, 3, card.height - 12, '#7d9870', 'none', 1);
      let y = card.y + 17;
      card.heading.forEach(value => { svg += text(card.x + 13, y, value, 12, '#173f32', true); y += 14; });
      card.subtitle.forEach(value => { svg += text(card.x + 13, y, value, 8.7, '#6b786e'); y += 10; });
      if (card.continued) { svg += text(card.x + 13, y, 'Fortsetzung', 8.5, '#6b786e', true); y += 13; }
      y += 7;
      for (let i = 0; i < card.lines.length; i++) {
        const item = card.lines[i];
        if (i && item.newEntry) y += 4;
        svg += text(card.x + 13, y, item.text, 9.6, item.text.startsWith('OFFEN:') ? '#9b4828' : '#304c39'); y += 12;
      }
    });
    return svg;
  }
  function svgPage(doc, index) {
    const page = doc.pages[index]; if (!page) return '';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${escape(doc.event.name)}: Exportseite ${index + 1} von ${doc.pages.length}" font-family="Arial, Helvetica, sans-serif"><title>${escape(doc.event.name)} · Seite ${index + 1}</title>${headerSvg(doc, page, index)}${page.type === 'calendar' ? calendarSvg(page, doc) : cardsSvg(page)}</svg>`;
  }
  function renderDocument(doc) {
    if (doc.error) return '<section class="sp-print-only"><p>' + escape(doc.error) + '</p></section>';
    return '<section class="sp-print-only">' + doc.pages.map((_, index) => '<div class="sp-print-sheet">' + svgPage(doc, index) + '</div>').join('') + '</section>';
  }
  root.EH.ShiftPrint = { build, svgPage, renderDocument, normalizeOptions, wrap, textWidth, DEFAULTS, WIDTH, HEIGHT };
})(globalThis);
