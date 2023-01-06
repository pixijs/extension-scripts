import path from 'node:path';
import fs from 'node:fs';

const projectPath = path.join(process.cwd());
const pkg = JSON.parse(await fs.promises.readFile(
    path.join(projectPath, 'package.json'),
    { encoding: 'utf8' }
));

// Convert package name into suitable browser bundle path
const defaultBundleBase = `dist/${pkg.name.replace(/\//g, '-').replace(/[^\w\d-_]/g, '')}`;

// Remove the scope from the package name
const basename = path.basename(pkg.name);

// Convert into a suitable JS namespace (e.g., "@pixi/plugin-special" -> "PIXI.pluginSpecial")
const defaultNamespace = `PIXI.${
    basename
        .replace(/[^a-z0-9]/gi, '_')
        .split('_')
        .map((word, i) => (i === 0
            ? word : word.charAt(0).toUpperCase() + word.slice(1)))
        .join('')
}`;

/** Get the target project package.json */
export const packageInfo = pkg;

/** Default config properties */
export const extensionConfig = {
    clean: [],
    lint: ['src', 'test'],
    globals: {},
    output: {},
    silent: false,
    bundle: `${defaultBundleBase}.js`,
    bundleModule: `${defaultBundleBase}.mjs`,
    namespace: defaultNamespace,
    source: 'src/index.ts',
    deployFiles: '{dist,examples,docs}/**',
    deployBranch: 'gh-pages',
    serve: 'examples',
    tsconfig: 'tsconfig.json',
    docsDestination: 'docs',
    docsRepository: pkg.repository?.url ?? '',
    docsName: pkg.name,
    docsCopyright: `&copy; Copyright ${new Date().getFullYear()} ${pkg.author}`,
    docsTitle: pkg.name,
    docsDescription: pkg.description ?? '',
    docsKeywords: (pkg.keywords ?? []).join(', '),
    docsIndex: 'README.md',
    jestConfig: null,
    ...pkg.extensionConfig,
};
