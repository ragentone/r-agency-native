/**
 * Babel-Plugin: leitet die Browser-Globals des Mesh-Clients auf iOS/Android auf ein eigenes
 * Objekt um (`globalThis.__R_AGENCY_MESH_WINDOW__`, siehe src/core/mesh/platform/mesh.window.ts).
 *
 * Der Client (`r-agency-mesh-client-v1/release`) ist für den Browser gebaut und greift direkt
 * auf `window.localStorage`, `window.location`, `window.document`, `navigator` und einen
 * Web Worker zu. Statt diese Globals app-weit zu faken (das würde andere Libraries in den
 * "Browser-Modus" schicken), werden sie nur in dieser einen Datei umgeschrieben.
 *
 * Auf Web bleibt der Client unverändert.
 */
const MESH_CLIENT_FILE = /r-agency-mesh-client-v1[\\/]release[\\/]index\.js$/;
const GLOBALS = new Set(['window', 'navigator', 'Worker', 'Blob', 'URL']);
const TARGET = '__R_AGENCY_MESH_WINDOW__';

module.exports = function meshClientGlobals({ types: t }) {
  const replaceGlobals = {
    Identifier(path) {
      const name = path.node.name;
      if (!GLOBALS.has(name) || !path.isReferencedIdentifier()) return;
      if (path.scope.hasBinding(name, true)) return;
      // `window` → das Shim-Objekt selbst, alles andere → dessen gleichnamige Eigenschaft.
      const meshWindow = t.memberExpression(t.identifier('globalThis'), t.identifier(TARGET));
      path.replaceWith(
        name === 'window' ? meshWindow : t.memberExpression(meshWindow, t.identifier(name))
      );
      path.skip();
    },
  };

  return {
    name: 'mesh-client-globals',
    visitor: {
      Program(path, state) {
        const { filename, caller } = state.file.opts;
        if (!filename || !MESH_CLIENT_FILE.test(filename)) return;
        if (caller && caller.platform === 'web') return;
        path.traverse(replaceGlobals);
      },
    },
  };
};
