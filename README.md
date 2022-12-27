# PixiJS Extension Scripts

Contains all the tools common for building extensions.

## Getting Started

Simply add these things to your **package.json**. All commands are optional.

```json
{
  "scripts": {
    "clean": "extension-scripts clean",
    "watch": "extension-scripts watch",
    "build": "extension-scripts build",
    "lint": "extension-scripts lint",
    "docs": "extension-scripts docs",
    "types": "extension-scripts types",
    "serve": "extension-scripts serve",
    "deploy": "extension-scripts deploy",
    "release": "extension-scripts release"
  },
  "devDependencies": {
    "@pixi/extension-scripts": "latest"
  }
}
```

## Configuration

Configuration can be provided using the `extensionConfig` field in **package.json**:

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

* **`namespace`** _string_, _required_ - User-defined global namespace for the bundle.
* **`globals`** _object_ - [Output globals](https://rollupjs.org/guide/en/#outputglobals) as defined by Rollup. This is used for creating the browser bundle. All defaults are provide for the core package of PixiJS (e.g., `@pixi/core`, `@pixi/sprite`, etc).
* **`bundle`** _string_ - The relative path to the output browser file.
* **`clean`** _string[]_ - List of files to clean before each build.
* **`source`** _string_ - The entry-point for building the extension (default: `src/index.ts`)
* **`lint`** _string[]_ - List of additional folders or files to lint.
* **`deploy`** _string[]_ - Glob pattern for files to deploy (default: `{dist,examples,docs}/**`).
* **`examples`** _string_ - Relative path to the examples folder (default: `examples`).
* **`tsconfig`** _string_ - Relative path to the tsconfig file for doing type check (default: `tsconfig.json`)
* **`silent`** _boolean_ - Whether to silence the output (default: `false`)