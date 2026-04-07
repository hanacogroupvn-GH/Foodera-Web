import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const constantsPath = path.join(projectRoot, 'constants.ts');
const outputPath = path.join(projectRoot, 'generated', 'local-seed-content.json');
const requireFromProject = createRequire(import.meta.url);

const stripTypeOnlyImports = (source) =>
  source.replace(/^\s*import\s+\{\s*Product\s*,\s*NewsItem\s*\}\s+from\s+['"]\.\/types['"];\s*$/m, '');

const loadSeedSnapshotFromConstants = async () => {
  const source = await fs.readFile(constantsPath, 'utf8');
  const sanitizedSource = stripTypeOnlyImports(source);
  const transpiled = ts.transpileModule(sanitizedSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020
    },
    fileName: constantsPath
  });

  const module = { exports: {} };
  const context = vm.createContext({
    module,
    exports: module.exports,
    require: requireFromProject,
    console
  });

  vm.runInContext(transpiled.outputText, context, {
    filename: constantsPath
  });

  const { PRODUCTS = [], NEWS = [] } = module.exports;
  return {
    products: PRODUCTS,
    news: NEWS
  };
};

const main = async () => {
  const snapshot = await loadSeedSnapshotFromConstants();
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(`Generated ${path.relative(projectRoot, outputPath)}`);
};

await main();
