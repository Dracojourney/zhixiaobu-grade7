(function (G) {
  G.legacyContent = G.legacyContent || Object.assign({}, G.content);
  Object.keys(G.editionContent || {}).forEach(function (id) {
    G.content[id] = G.editionContent[id];
  });
  if (G.manifest && Object.keys(G.editionContent || {}).length) G.manifest.contentStatus = 'edition-aligned-editorial';
})(window.Grade7 = window.Grade7 || {});
