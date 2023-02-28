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
    bundle: `${defaultBundleBase}.js`,
    bundleExports: 'named',
    bundleModule: `${defaultBundleBase}.mjs`,
    bundleModuleExports: 'named',
    bundleModuleSource: null,
    bundleSource: null,
    clean: [],
    deployFiles: '{dist,examples,docs}/**',
    deployBranch: 'gh-pages',
    docsCopyright: `&copy; Copyright ${new Date().getFullYear()} ${pkg.author}`,
    docsDescription: pkg.description ?? '',
    docsDestination: 'docs',
    docsGoogleAnalytics: '',
    docsIndex: 'README.md',
    docsKeywords: (pkg.keywords ?? []).join(', '),
    docsName: pkg.name,
    docsRepository: pkg.repository?.url ?? '',
    docsTitle: pkg.name,
    environments: ['browser', 'node'],
    globals: {},
    jestConfig: null,
    lint: ['src', 'test', 'examples'],
    namespace: defaultNamespace,
    serve: 'examples',
    silent: false,
    source: 'src/index.ts',
    tsconfig: 'tsconfig.json',
    ...pkg.extensionConfig,
};
