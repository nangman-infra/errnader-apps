import fs from 'node:fs/promises';
import path from 'node:path';
import postcss from 'postcss';

const DIST_ASSETS_DIR = '/Users/junoshon/Developments/errander/apps/web/dist/assets';

async function findBuiltCssFiles() {
  const entries = await fs.readdir(DIST_ASSETS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.css'))
    .map((entry) => path.join(DIST_ASSETS_DIR, entry.name));
}

function flattenLayerRules(cssSource) {
  const root = postcss.parse(cssSource);
  const nextNodes = [];

  for (const node of root.nodes) {
    if (node.type === 'atrule' && node.name === 'layer') {
      if (node.nodes?.length) {
        nextNodes.push(...node.nodes.map((childNode) => childNode.clone()));
      }
      continue;
    }

    nextNodes.push(node);
  }

  root.removeAll();
  root.append(nextNodes);

  return root.toString();
}

async function main() {
  const cssFiles = await findBuiltCssFiles();

  await Promise.all(
    cssFiles.map(async (cssFilePath) => {
      const originalCss = await fs.readFile(cssFilePath, 'utf8');
      const flattenedCss = flattenLayerRules(originalCss);
      await fs.writeFile(cssFilePath, flattenedCss, 'utf8');
      console.log(`flattened layers: ${cssFilePath}`);
    }),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
