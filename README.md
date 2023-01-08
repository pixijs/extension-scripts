# PixiJS Extension Scripts

Contains all the tools common for building extensions for PixiJS. While this tool is rather generic and can be used for variety of purposes, it has convenient defaults that are specifically designed for PixiJS v7+.

## Getting Started

Simply add these things to your **package.json**. All scripts (a.k.a., commands) are optional. This structure (`main`, `types`, `module`, `exports`) provides the best backward-compatibility with Node's new module [exports](https://nodejs.org/api/packages.html#exports).

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
    "clean": "xs clean",
    "deploy": "xs deploy",
    "docs": "xs docs",
    "lint": "xs lint",
    "release": "xs release",
    "serve": "xs serve",
    "test": "xs test",
    "types": "xs types",
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
| `build` | Build `dist` and `lib` targets in release mode as well as the types. |
| `clean` | Removes the `dist` and `lib` folders |
| `deploy` | Does `build` and `docs` and then copies the folders (`dist`, `examples`, `docs`) to `gh-pages` branch |
| `docs` | Build the `src` folder into `docs` folder using webdoc |
| `lint` | Using ESLint to lint the `src` folder. This supports additional CLI arguments to pass to ESLint, for instance `xs lint -- --fix` |
| `release` | Publish a release, will ask for what type of version bump, do a `deploy` and push to npm and git tags. |
| `serve` | Runs `watch` command plus also opens the `examples` folder |
| `test` | Run the unit tests in the `test` folder. This supports additional CLI arguments to pass to Jest, for instance `xs test -- --ci` |
| `types` | Type-check the `src` folder using TypeScript |
| `watch` | Watch the code in development mode, updates on changes |

### Project Structure

Generally, the project structure is baked-in to the defaults, however, most of this can be customized (see the Configuration section below).

* `./dist` - Generated folder for the ES2017 browser bundles
* `./docs` - Generated folder for the API documentation
* `./examples` - Contains any examples or demos use to test the project
* `./lib` - Generated folder for ES2020 modules and types
* `./src` - Contains all the source code (TypeScript files)
* `./test` - The Jest unit-tests

## Configuration

Configuration can be provided using the `extensionConfig` field in **package.json**:

* **`bundle`** _string_ - The relative path to the output browser file (`.js`).
* **`bundleModule`** _string_ - The relative path to the output browser module (`.mjs`) file.
* **`clean`** _string[]_ - List of files to clean before each build.
* **`deployFiles`** _string[]_ - Glob pattern for files to deploy (default: `{dist,examples,docs}/**`).
* **`deployBranch`** _string[]_ - Branch where to do the deployment (default: `gh-pages`).
* **`docsCopyright`** _string_ - Copyright in the docs (defaults: package.json's `author`)
* **`docsDescription`** _string_ - HTML meta description in docs (defaults: package.json's `description`)
* **`docsDestination`** _string_ - Relative path to the output documentation folder (default: `docs`)
* **`docsGoogleAnalytics`** _string_ - Optional `UA-*` identifier for reporting to Google Analytics.
* **`docsIndex`** _string_ - Relative path to markdown file to use as the index page for documentation (default: `README.md`)
* **`docsKeywords`** _string_ - HTML meta keywords in docs (defaults: package.json's `keywords`)
* **`docsName`** _string_ - Application name in docs  (defaults: package.json's `name`)
* **`docsRepository`** _string_ - URL for repository (defaults: package.json's `repository.url`)
* **`docsTitle`** _string_ - HTML base title in docs (defaults: package.json's `name`)
* **`globals`** _object_ - [Output globals](https://rollupjs.org/guide/en/#outputglobals) as defined by Rollup. This is used for creating the browser bundle. All defaults are provide for the core package of PixiJS (e.g., `@pixi/core`, `@pixi/sprite`, etc).
* **`jestConfig`** _string_ - Optional path to the Jest config file (default: `null`)
* **`lint`** _string[]_ - List of additional folders or files to lint. (default: `['src', 'test']`)
* **`namespace`** _string_ - User-defined global namespace for the bundle.
* **`serve`** _string_ - Relative path to the serve folder (default: `examples`).
* **`silent`** _boolean_ - Whether to silence the output (default: `false`)
* **`source`** _string_ - The entry-point for building the extension (default: `src/index.ts`)
* **`tsconfig`** _string_ - Relative path to the tsconfig file for doing type check (default: `tsconfig.json`)

### Example

```json
{
  "extensionConfig": {
    "namespace": "PIXI.myextension",
    "bundle": "dist/pixi-my-extension.js",
    "globals": {
        "lodash": "_"
    }
  }
}
```

## GitHub Actions

If you're going to run `xs test` on GitHub Actions, please keep in mind that it requires `xvfb` since the tests are run within Electron. You can add the following to your workflow scripts to run it:

**Before**

```yml
- name: Test
  run: npm test
```

**After**

```yml
- name: Test
  uses: GabrielBB/xvfb-action@v1
  with:
    run: npm test
```
