/* Read editorial files at build time. Browser output remains completely standalone. */
const fs = require('node:fs');
const path = require('node:path');

function loadWiki(directory, order = []) {
  const entries = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a,b)=>a.name.localeCompare(b.name,'de'))) {
      if (entry.name.startsWith('.') || entry.name === 'ARTIKEL-VORLAGE.json') continue;
      const filename = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`${filename}: Verknüpfungen sind im Wikiordner nicht erlaubt.`);
      if (entry.isDirectory()) { walk(filename); continue; }
      if (!entry.name.endsWith('.json')) continue;
      const relative = 'data/wiki/' + path.relative(directory,filename).split(path.sep).join('/');
      let article;
      try { article = JSON.parse(fs.readFileSync(filename,'utf8')); }
      catch (error) { throw new Error(`${relative}: JSON konnte nicht gelesen werden. Prüfe Kommas und Anführungszeichen. ${error.message}`); }
      if (!article || typeof article !== 'object' || Array.isArray(article)) throw new Error(`${relative}: Eine Datei enthält genau ein Artikel-Objekt { ... }.`);
      if (!['draft','example','published'].includes(article.status || 'example')) throw new Error(`${relative}: status muss draft, example oder published sein.`);
      if (article.status === 'draft') continue;
      if (entry.name !== article.id + '.json') throw new Error(`${relative}: Dateiname muss zur id passen (${article.id}.json).`);
      entries.push({ article, file: relative });
    }
  }
  walk(directory);
  const rank = id => { const i=order.indexOf(id); return i<0 ? order.length : i; };
  entries.sort((a,b)=>rank(a.article.id)-rank(b.article.id)||a.file.localeCompare(b.file,'de'));
  const files = Object.create(null);
  for (const entry of entries) {
    if (files[entry.article.id]) throw new Error(`${entry.file}: doppelte ID "${entry.article.id}" (bereits in ${files[entry.article.id]}).`);
    files[entry.article.id] = entry.file;
  }
  return { articles: entries.map(e=>e.article), files };
}
module.exports={loadWiki};
