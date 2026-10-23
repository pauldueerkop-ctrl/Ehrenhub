/**
 * Single content adapter, used by the build and Node tests.
 * Edit the JSON files in data/, not this file or the generated HTML.
 * The build embeds this object in the page: no fetch, server or login needed.
 */
const site = require('../data/site.json');
const { loadWiki } = require('../scripts/load-wiki.cjs');
const path = require('node:path');
const wiki = loadWiki(path.join(__dirname,'../data/wiki'), require('../data/wiki.json').order);

module.exports = {
  articles: wiki.articles,
  hubi: require('../data/hubi.json'),
  courses: require('../data/fortbildungen.json'),
  grants: require('../data/antraege.json'),
  sources: require('../data/quellen.json'),
  categories: require('../data/kategorien.json'),
  finder: require('../data/finder.json'),
  sos: require('../data/sos.json'),
  site,
  reviewed: site.reviewed,
  version: site.version,
};
Object.defineProperty(module.exports,'articleFiles',{value:wiki.files,enumerable:false});
