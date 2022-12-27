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

Configuration can be provided using the `extensionConfig` field:

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

* `extensionConfig.namespace` _string_, _required_ - User-defined global namespace for the bundle.
* `extensionConfig.globals` _object_ - [Output globals](https://rollupjs.org/guide/en/#outputglobals) as defined by Rollup. This is used for creating the browser bundle. All defaults are provide for the core package of PixiJS (e.g., `@pixi/core`, `@pixi/sprite`, etc).
* `extensionConfig.bundle` _string_ - The relative path to the output browser file.
* `extensionConfig.clean` _string[]_ - List of files to clean.
* `extensionConfig.source` _string_ - The entry-point for building the extension (default: `src/index.ts`)
* `extensionConfig.lint` _string[]_ - List of additional folders or files to lint.
* `extensionConfig.deploy` _string[]_ - Glob pattern for files to deploy (default: `{dist,examples,docs}/**`).
* `extensionConfig.examples` _string_ - Relative path to the examples (default: `examples`).
* `extensionConfig.tsconfig` _string_ - Relative path to the tsconfig file for doing type check (default: `tsconfig.json`)
* `extensionConfig.silent` _boolean_ - Whether to silence the output (default: `false`)