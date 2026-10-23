/** Routes connect domain data to page renderers. No catalogue content lives here. */
(function (root) {
  'use strict';
  const { Data: D, Pages: P, Layout, Cards, UI } = root.EH;

  function main(route, state, index) {
    if (route.page === 'home' && !route.id) return P.Home.home(state);
    if (route.page === 'wiki') {
      if (!route.id) return P.Wiki.wiki(route, state);
      const item = D.articles.find(item => item.id === route.id);
      return item ? P.Wiki.article(item, state) : P.NotFound.notFound();
    }
    if (route.page === 'fortbildungen') {
      if (!route.id) return P.Training.training(route, state);
      const item = D.courses.find(item => item.id === route.id);
      return item ? P.Training.courseDetail(item, state) : P.NotFound.notFound();
    }
    if (route.page === 'antraege') {
      if (!route.id) return P.Grants.grants(route, state);
      const item = D.grants.find(item => item.id === route.id);
      return item ? P.Grants.grantDetail(item, state) : P.NotFound.notFound();
    }
    if (route.id) return P.NotFound.notFound();
    if (route.page === 'schichtplan') return state.planner ? state.planner.render() : root.EH.ShiftView.render();
    if (route.page === 'sos') return P.Sos.sos(state);
    if (route.page === 'merkliste') return P.Saved.saved(state, index);
    if (route.page === 'suche') return P.Search.searchPage(route, state, index);
    return P.NotFound.notFound();
  }

  // Keep the controller API stable while implementation moves into small modules.
  root.EH.Views = {
    ...Layout,
    ...Cards,
    main,
    wikiResults: P.Wiki.wikiResults,
    courseResults: P.Training.courseResults,
    grantWizard: P.Grants.grantWizard,
    grantResults: P.Grants.grantResults,
    grantQuestions: D.finder.grantQuestions,
    sosSituation: P.Sos.sosSituation,
    searchResults: P.Search.searchResults,
    bookmark: UI.bookmark,
    sourceLink: UI.sourceLink,
  };
})(globalThis);
