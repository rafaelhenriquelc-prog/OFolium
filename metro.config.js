const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// jsPDF's "node" export is dist/jspdf.node.min.js, which Metro cannot parse
// (require(["html2canvas"], ...)). The public browser/default export is the
// ESM build. fflate's "node" export imports Node's module loader; without that
// condition its public "import" export is the browser build used by jsPDF.
const browserPackages = new Set(['jspdf', 'fflate']);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (browserPackages.has(moduleName)) {
    const conditionsByPlatform = Object.fromEntries(
      Object.entries(context.unstable_conditionsByPlatform ?? {}).map(([key, names]) => [
        key,
        names.filter((name) => name !== 'node'),
      ]),
    );

    return context.resolveRequest(
      {
        ...context,
        unstable_conditionNames: (context.unstable_conditionNames ?? []).filter(
          (name) => name !== 'node',
        ),
        unstable_conditionsByPlatform: conditionsByPlatform,
      },
      moduleName,
      platform,
    );
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
