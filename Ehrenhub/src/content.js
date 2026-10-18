/**
 * Single content adapter, used by the build and Node tests.
 * Edit the JSON files in data/, not this file or the generated HTML.
 * The build embeds this object in the page: no fetch, server or login needed.
 */
const site = require('../data/site.json');

module.exports = {
  articles: require('../data/wiki.json'),
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
