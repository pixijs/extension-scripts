const path = require('path');
const esbuild = require('rollup-plugin-esbuild').default;
const pkg = require(path.join(process.cwd(), 'package.json'));
const extensionConfig = require('./extensionConfig');
const compiled = (new Date()).toUTCString().replace(/GMT/g, 'UTC');
const banner = [
    `/*!`,
    ` * ${pkg.name} - v${pkg.version}`,
    ` * Compiled ${compiled}`,
    ` *`,
    ` * ${pkg.name} is licensed under the MIT License.`,
    ` * http://www.opensource.org/licenses/mit-license`,
    ` * `,
    ` * Copyright ${(new Date()).getFullYear()}, ${pkg.author}, All Rights Reserved`,
    ` */`,
].join('\n');

// External dependencies, not bundled
const external = []
    .concat(Object.keys(pkg.peerDependencies || {}))
    .concat(Object.keys(pkg.dependencies || {}));

const builtInPackages = [
    'accessibility',
    'app',
    'assets',
    'basis',
    'canvas-display',
    'canvas-extract',
    'canvas-graphics',
    'canvas-mesh',
    'canvas-particle-container',
    'canvas-renderer',
    'canvas-prepare',
    'canvas-sprite',
    'canvas-sprite-tiling',
    'canvas-text',
    'compressed-textures',
    'core',
    'display',
    'events',
    'extensions',
    'extract',
    'graphics-extras',
    'graphics',
    'math-extras',
    'math',
    'mesh-extras',
    'mesh',
    'mixin-cache-as-bitmap',
    'mixin-get-child-by-name',
    'mixin-get-global-position',
    'particle-container',
    'prepare',
    'runner',
    'settings',
    'sprite-animated',
    'sprite-tiling',
    'sprite',
    'spritesheet',
    'text-bitmap',
    'text',
    'ticker',
    'unsafe-eval',
].reduce((acc, name) => ({ ...acc, [`@pixi/${name}`]: 'PIXI' }), {});

// These are the PixiJS built-in default globals
// for the browser bundle when referencing other core packages
const globals = {
    '@pixi/utils': 'PIXI.utils',
    '@pixii/filter-alpha': 'PIXI.filters',
    '@pixii/filter-blur': 'PIXI.filters',
    '@pixii/filter-color-matrix': 'PIXI.filters',
    '@pixii/filter-displacement': 'PIXI.filters',
    '@pixii/filter-fxaa': 'PIXI.filters',
    '@pixii/filter-noise': 'PIXI.filters',
    ...builtInPackages,
    ...extensionConfig.globals,
};

const source = pkg.source ?? 'src/index.ts';
const namespace = extensionConfig.namespace;
const bundle = path.join(process.cwd(), extensionConfig.bundle);
const mainDir = path.dirname(path.join(process.cwd(), pkg.main));
const moduleDir = path.dirname(path.join(process.cwd(), pkg.module));

module.exports = [
    {
        plugins: [esbuild({ target: 'ES2020' })],
        external,
        input: source,
        output: [
            {
                banner,
                dir: mainDir,
                entryFileNames: '[name].js',
                format: 'cjs',
                preserveModules: true,
                sourcemap: true
            },
            {
                banner,
                dir: moduleDir,
                entryFileNames: '[name].mjs',
                format: 'esm',
                preserveModules: true,
                sourcemap: true
            }
        ],
    },
    {
        plugins: [esbuild({
            target: 'ES2017',
            minify: true,
        })],
        external,
        input: source,
        treeshake: false,
        output: [
            {
                banner,
                file: bundle,
                format: 'iife',
                name: namespace,
                sourcemap: true,
                globals,
            }
        ],
    }
];
