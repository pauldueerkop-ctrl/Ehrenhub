/* Compatibility boundary: routes keep their URLs, feature owns its UI. */
(function(root){
  'use strict';
  const V=root.EH.TrainingView,M=root.EH.TrainingModel;
  root.EH.Pages=root.EH.Pages||{};
  root.EH.Pages.Training={
    training:(route,state)=>state.training?state.training.render(route):V.render(M.project(),route,state),
    courseResults:V.courseResults,courseDetail:V.courseDetail,legacy:V.legacy
  };
})(globalThis);
