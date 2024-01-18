import * as glob from 'glob';
import path from 'node:path';
import esbuild from 'rollup-plugin-esbuild';
import { string } from 'rollup-plugin-string';
import rename from '@pixi/rollup-plugin-rename-node-modules';
import { extensionConfig, packageInfo as pkg } from '../extensionConfig.mjs';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';

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

const builtInPackages = {
    'pixi.js': 'PIXI',
    pixijs: 'PIXI',
    '@pixi/accessibility': 'PIXI',
    '@pixi/app': 'PIXI',
    '@pixi/assets': 'PIXI',
    '@pixi/basis': 'PIXI',
    '@pixi/canvas-display': 'PIXI',
    '@pixi/canvas-extract': 'PIXI',
    '@pixi/canvas-graphics': 'PIXI',
    '@pixi/canvas-mesh': 'PIXI',
    '@pixi/canvas-particle-container': 'PIXI',
    '@pixi/canvas-renderer': 'PIXI',
    '@pixi/canvas-prepare': 'PIXI',
    '@pixi/canvas-sprite': 'PIXI',
    '@pixi/canvas-sprite-tiling': 'PIXI',
    '@pixi/canvas-text': 'PIXI',
    '@pixi/compressed-textures': 'PIXI',
    '@pixi/core': 'PIXI',
    '@pixi/display': 'PIXI',
    '@pixi/events': 'PIXI',
    '@pixi/extensions': 'PIXI',
    '@pixi/extract': 'PIXI',
    // In PixiJS 7.1.0+ filters namespace was removed, but we'll
    // keep it here for backwards compatibility
    '@pixi/filter-alpha': 'PIXI.filters',
    '@pixi/filter-blur': 'PIXI.filters',
    '@pixi/filter-color-matrix': 'PIXI.filters',
    '@pixi/filter-displacement': 'PIXI.filters',
    '@pixi/filter-fxaa': 'PIXI.filters',
    '@pixi/filter-noise': 'PIXI.filters',
    '@pixi/graphics-extras': 'PIXI',
    '@pixi/graphics': 'PIXI',
    '@pixi/math-extras': 'PIXI',
    '@pixi/math': 'PIXI',
    '@pixi/mesh-extras': 'PIXI',
    '@pixi/mesh': 'PIXI',
    '@pixi/mixin-cache-as-bitmap': 'PIXI',
    '@pixi/mixin-get-child-by-name': 'PIXI',
    '@pixi/mixin-get-global-position': 'PIXI',
    '@pixi/particle-container': 'PIXI',
    '@pixi/prepare': 'PIXI',
    '@pixi/runner': 'PIXI',
    '@pixi/settings': 'PIXI',
    '@pixi/sprite-animated': 'PIXI',
    '@pixi/sprite-tiling': 'PIXI',
    '@pixi/sprite': 'PIXI',
    '@pixi/spritesheet': 'PIXI',
    '@pixi/text-bitmap': 'PIXI',
    '@pixi/text': 'PIXI',
    '@pixi/ticker': 'PIXI',
    '@pixi/unsafe-eval': 'PIXI',
    '@pixi/utils': 'PIXI.utils',
};

// External dependencies, not bundled
const external = Object.keys(builtInPackages) // @pixi/*
    .concat(Object.keys(pkg.peerDependencies || {})) // Peer Dependencies
    .concat(Object.keys(pkg.dependencies || {})); // Dependencies

// These are the PixiJS built-in default globals
// for the browser bundle when referencing other core packages
const globals = {
    ...builtInPackages,
    ...extensionConfig.globals,
};

const basePlugins = [
    commonjs(),
    resolve(),
    string({
        include: [
            '**/*.frag',
            '**/*.vert',
            '**/*.glsl',
            '**/*.wgsl',
        ],
    }),
    replace({
        preventAssignment: true,
        delimiters: ['__', '__'],
        VERSION: pkg.version,
    }),
];

// Plugins for browser-based bundles
const browserPlugins = [
    ...basePlugins,
    esbuild({ target: 'ES2017', minify: true })
];

// Plugins for module-based output
const modulePlugins = [
    ...basePlugins,
    rename(),
    esbuild({ target: 'ES2020' })
];

const { source } = extensionConfig;
const basePath = path.dirname(path.join(process.cwd(), source));
const bundle = path.join(process.cwd(), extensionConfig.bundle);
const bundleModule = path.join(process.cwd(), extensionConfig.bundleModule);
const mainDir = path.dirname(path.join(process.cwd(), pkg.main));
const moduleDir = path.dirname(path.join(process.cwd(), pkg.module));
let { namespace } = extensionConfig;
let footer;

// If we're adding to the main PIXI namespace, we need to
// make sure we don't override the PIXI global, so we'll do this
// to insert the output of the extension into the PIXI global
if (namespace === 'PIXI')
{
    namespace = pkg.name.replace(/[^a-z-]/ig, '_').replace(/-/g, '');
    footer = `Object.assign(PIXI, ${namespace});`;
}

export default [
    // Module browser bundle (esm)
    {
        external,
        plugins: browserPlugins,
        input: extensionConfig.bundleModuleSource || source,
        treeshake: false,
        output: {
            banner,
            file: bundleModule,
            format: 'esm',
            sourcemap: true,
            exports: extensionConfig.bundleModuleExports,
        },
    },
    ...!extensionConfig.environments.includes('node') ? [] : [{
        external,
        input: glob.sync(extensionConfig.moduleSource || source),
        plugins: modulePlugins,
        output: [
            {
                dir: mainDir,
                entryFileNames: '[name].js',
                format: 'cjs',
                preserveModules: true,
                preserveModulesRoot: basePath,
                sourcemap: true,
                exports: 'named',
            },
            {
                dir: moduleDir,
                entryFileNames: '[name].mjs',
                format: 'esm',
                preserveModules: true,
                preserveModulesRoot: basePath,
                sourcemap: true,
                exports: 'named',
            }
        ],
    }],
    // Browser bundle (iife)
    ...!extensionConfig.environments.includes('browser') ? [] : [{
        external,
        plugins: browserPlugins,
        input: extensionConfig.bundleSource || source,
        treeshake: false,
        output: {
            banner,
            file: bundle,
            format: 'iife',
            name: namespace,
            footer,
            sourcemap: true,
            globals,
            exports: extensionConfig.bundleExports,
        },
    }],
];
