# PixiJS Extension Scripts

[![Node.js CI](https://github.com/pixijs/extension-scripts/actions/workflows/build.yml/badge.svg)](https://github.com/pixijs/extension-scripts/actions/workflows/build.yml) ![npm (scoped)](https://img.shields.io/npm/v/@pixi/extension-scripts)

Contains all the tools common for building extensions for PixiJS. While this tool is rather generic and can be used for variety of purposes, it has convenient defaults that are specifically designed for PixiJS v7+.

## Features

* [Consistent linting style](https://github.com/pixijs/eslint-config/) with [ESLint](https://eslint.org/)
* Builds using [Rollup](https://rollupjs.org/guide/en/) and [ESBuild](https://esbuild.github.io/)
* Testing using [Vitest](https://vitest.dev/) in a real browser (with [Playwright](https://playwright.dev/))
* Documentation building with [webdoc](https://github.com/webdoc-labs/webdoc)
* Deployment using [gh-pages](https://github.com/tschaub/gh-pages) on GitHub
* Tidy package.json with [clean-package](https://www.npmjs.com/package/clean-package) while publishing.
* Publishing release workflow

## Getting Started

Node.js 22.12 or newer is required. Simply add these things to your **package.json**. All scripts (a.k.a., commands) are optional. This structure (`main`, `types`, `module`, `exports`) provides the best backward-compatibility with Node's new module [exports](https://nodejs.org/api/packages.html#exports).

```json
{
  "main": "lib/index.js",
  "module": "lib/index.mjs",
  "types": "lib/index.d.ts",
  "exports": {
    ".": {
      "import": "./lib/index.mjs",
      "require": "./lib/index.js",
      "types": "./lib/index.d.ts"
    }
  },
  "scripts": {
    "build": "xs build",
    "docs": "xs docs",
    "release": "xs release",
    "start": "xs serve",
    "test": "xs test",
    "watch": "xs watch"
  },
  "devDependencies": {
    "@pixi/extension-scripts": "latest"
  }
}
```

### Commands

| Command | Description |
|---|---|
| `build` | Alias for `clean,lint,types,bundle` |
| `bump` | Interactive prompt to bump the version number |
| `bundle` | Build `dist` and `lib` targets in release mode as well as the types. |
| `clean` | Removes the `dist` and `lib` folders |
| `deploy` | Alias for `build,docs,upload` |
| `docs` | Build the `src` folder into `docs` folder using webdoc |
| `git-push` | Does `git push` and `git push --tags` |
| `lint` | Using ESLint to lint the `src` folder. This supports additional CLI arguments to pass to ESLint, for instance `xs lint -- --fix` |
| `pack` | Like `npm pack` but will use [clean-package](https://www.npmjs.com/package/clean-package) |
| `publish` | Just like `npm publish` but invokes `clean-package` before and after |
| `release` | Alias for `bump,test,deploy,publish,git-push` |
| `serve` | Runs `watch` command plus also opens the `examples` folder |
| `test` | Run the unit tests (`*.test.*` and `*.spec.*` files), fails if there are none. This supports additional CLI arguments to pass to Vitest, for instance `xs test --bail=1` |
| `types` | Type-check the `src` folder using TypeScript, and the `test` folder if it contains a **tsconfig.json** |
| `upload` | Upload files to gh-pages branch |
| `version` | Output the version of `@pixi/extension-scripts` |
| `watch` | Watch the code in development mode, updates on changes |

### Chaining

Commands can also be chained together easily separated by a comma. For example, the following will serially call `test`, `build`, then finally `docs`. This can be used as a convenient alternative for `pre*` and `post*` **package.json** scripts.

```json
{
  "scripts": {
    "test": "xs test,build,docs"
  }
}
```

### Project Structure

Generally, the project structure is baked-in to the defaults, however, most of this can be customized (see the Configuration section below).

* `./dist` - Generated folder for the ES2017 browser bundles
* `./docs` - Generated folder for the API documentation
* `./examples` - Contains any examples or demos use to test the project
* `./lib` - Generated folder for ES2020 modules and types
* `./src` - Contains all the source code (TypeScript files)
* `./src/__tests__` - The Vitest unit-tests (`./test` also works)

## Configuration

Configuration can be provided using the `extensionConfig` field in **package.json**:

* **`bundle`** _string_ - The relative path to the output browser file (`.js`).
* **`bundleExports`** _string_ - Output [exports](https://rollupjs.org/guide/en/#outputexports) for `bundle` (default: `named`)
* **`bundleSource`** _string_ - Input for the `bundle`, fallback to `source` (default: `null`)
* **`bundleModule`** _string_ - The relative path to the output browser module (`.mjs`) file.
* **`bundleModuleSource`** _string_ - Input for the `bundleModule`, fallback to `source` (default: `null`)
* **`bundleModuleExports`** _string_ - Output [exports](https://rollupjs.org/guide/en/#outputexports) for `bundleModule` (default: `named`)
* **`clean`** _string[]_ - List of files to clean before each build.
* **`deployFiles`** _string[]_ - Glob pattern for files to deploy (default: `{dist,examples,docs}/**`).
* **`deployBranch`** _string[]_ - Branch where to do the deployment (default: `gh-pages`).
* **`deployRoot`** _string_ - Root folder to do deploy, used in combo with `deployFiles` (default: `.`).
* **`docsCopyright`** _string_ - Copyright in the docs (defaults: package.json's `author`)
* **`docsDescription`** _string_ - HTML meta description in docs (defaults: package.json's `description`)
* **`docsDestination`** _string_ - Relative path to the output documentation folder (default: `docs`)
* **`docsGoogleAnalytics`** _string_ - Optional `UA-*` identifier for reporting to Google Analytics.
* **`docsIndex`** _string_ - Relative path to markdown file to use as the index page for documentation (default: `README.md`)
* **`docsKeywords`** _string_ - HTML meta keywords in docs (defaults: package.json's `keywords`)
* **`docsName`** _string_ - Application name in docs  (defaults: package.json's `name`)
* **`docsRepository`** _string_ - URL for repository (defaults: package.json's `repository.url`)
* **`docsTitle`** _string_ - HTML base title in docs (defaults: package.json's `name`)
* **`environments`** _string[]_ - Environments supports for output, only values supprted `node`, `browser` (default: `['node', 'browser']`)
* **`globals`** _object_ - [Output globals](https://rollupjs.org/guide/en/#outputglobals) as defined by Rollup. This is used for creating the browser bundle. All defaults are provide for the core package of PixiJS (e.g., `@pixi/core`, `@pixi/sprite`, etc).
* **`lint`** _string[]_ - List of additional folders or files to lint. (default: `['src', 'examples']`)
* **`moduleSource`** _string_ - Input for the `module` output, fallback to `source`. Supports globs. (default: `null`)
* **`namespace`** _string_ - User-defined global namespace for the bundle.
* **`serve`** _string_ - Relative path to the serve folder (default: `examples`).
* **`silent`** _boolean_ - Whether to silence the output (default: `false`)
* **`source`** _string_ - The entry-point for building the extension (default: `src/index.ts`)
* **`testBrowsers`** _string[]_ - Browsers to run the tests in, only values supported `chromium`, `firefox`, `webkit` (default: `['chromium']`)
* **`tsconfig`** _string_ - Relative path to the tsconfig file for doing type check (default: `tsconfig.json`)
* **`tsconfigTypes`** _string_ - Relative path to the tsconfig file for outputting types, if not defined, will use `tsconfig` option (default: `null`)

### Example

```json
{
  "extensionConfig": {
    "namespace": "PIXI.myextension",
    "bundle": "dist/pixi-my-extension.js",
    "bundleModule": "dist/pixi-my-extension.mjs",
    "globals": {
        "lodash": "_"
    }
  }
}
```

## Environment Variables

* **XS_PUBLISH_TAG** _string_ - The npm [`--tag`](https://docs.npmjs.com/cli/v10/commands/npm-publish#tag) value to use when running the `publish` command (default: `latest`)

## Testing

Tests run in headless Chromium by default, with Vitest's [globals](https://vitest.dev/config/globals) (e.g., `describe`, `it`, `expect`, `vi`) and support for importing shaders. The browser needs to be installed once, and again whenever Playwright is updated:

```bash
npx playwright install chromium
```

Use the `testBrowsers` option to also run the tests in Firefox or WebKit. For anything else, add a [**vitest.config.ts**](https://vitest.dev/config/) file to the project, it's used instead of the defaults from `xs`.

For the types of the globals, add `"types": ["vitest/globals"]` to the `compilerOptions` of the project's **tsconfig.json**. If the tests are in the `test` folder, add a **test/tsconfig.json** instead, which also makes `xs types` type-check them:

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "types": ["vitest/globals"]
  },
  "include": ["../src/**/*", "./**/*"]
}
```

When using a package manager which doesn't hoist dependencies (e.g., pnpm), add `vitest` to the project's `devDependencies`, `@vitest/browser-playwright` if its **vitest.config.ts** uses it, and `vite` if `types` contains `"vite/client"`. If `vitest` can't be found with npm, update the dependency which conflicts with it (e.g., `esbuild`, `vite` or `@types/node`). If the project depends on `vitest`, `vite` or `playwright` itself, the versions need to be compatible with the ones `xs` uses.

### Migrating from Jest

Version 5 replaces Jest and Electron with Vitest:

* Install the browser with `npx playwright install chromium`, and use Node.js 22.12 or newer.
* Replace `jest` with `vi` (e.g., `jest.fn()` with `vi.fn()`) and imports from `@jest/globals` with `vitest`. Matchers from `jest-extended` are no longer included.
* Tests run in a browser, they can't use `require` or Node.js modules such as `fs` and `http`. Import assets instead (e.g., `import url from './image.png?url'`, with `"vite/client"` added to `types`).
* Tests which need Node.js can use `environment: 'node'` in a **vitest.config.ts**.
* All `*.test.*` and `*.spec.*` files are run, not only the ones in `__tests__`.
* `xs test` fails if there are no tests. If the project doesn't have any, remove the `test` script and replace `xs release` with `xs bump,deploy,publish,git-push`.
* Replace the `jestConfig` option with a **vitest.config.ts**.
* Add `@vitest/coverage-v8` to the `devDependencies` to use `xs test --coverage`.
* Remove `xvfb` from GitHub Actions if nothing else needs it, and install the browser (see below).
* Class fields in the output are assigned instead of defined, regardless of the version of esbuild.

## GitHub Actions

If you're going to run `xs test` on GitHub Actions, the browser needs to be installed first:

```yml
- name: Install Browser
  run: npx playwright install --with-deps chromium
- name: Test
  run: npm test
```

### Publishing on GitHub Actions

Publishing on GitHub Actions requires a little customization. Typically, running `xs release` locally will also publish, however, if you want to defer publishing on GitHub Actions, you can modify the default `xs release` in your **package.json** like this:

```json
{
  "scripts": {
    "build": "xs build",
    "release": "xs bump,test,deploy,git-push",
    "publish-ci": "xs publish",
  }
}
```

Here's a snippet of the a GitHub Actions workflow to trigger a publish when a release is published. For more information on creating publishing workflow check out this [documentation](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages).

```yml
name: Publish Package
on:
  release:
    types: [published]
jobs:
  publish:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '24.x'
        registry-url: 'https://registry.npmjs.org'
    - run: npm ci
    - run: npm run build
    - run: npm run publish-ci
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Finally, if you need to publishing to a different [dist-tag](https://docs.npmjs.com/cli/v10/commands/npm-dist-tag) when publishing, you can use the `XS_PUBLISH_TAG` environment variable. In this example, prereleases will be published to a `beta` dist-tag.

```yml
name: Publish Package
on:
  release:
    types: [published]
jobs:
  publish:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '24.x'
        registry-url: 'https://registry.npmjs.org'
    - run: npm ci
    - run: npm run build
    - run: npm run publish-ci
      if: github.event.release.prerelease
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
        XS_PUBLISH_TAG: beta
    - run: npm run publish-ci
      if: github.event.release.prerelease == false
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```