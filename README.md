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
    "examples": "extension-scripts examples",
    "deploy": "extension-scripts deploy",
    "release": "extension-scripts release"
  },
  "dependencies": {
    "@pixi/extension-scripts": "latest"
  }
}
```

## Configuration

Configuration can be provided using the `extensionConfig` field:

```json
{
  "extensionConfig": {
    "namespace": "PIXI.myextensions",
    "bundle": "dist/pixi-my-extension.js",
    "globals": {
        "lodash": "_"
    }
  }
}
```

#### `extensionConfig.namespace` (required)

User-defined global namespace for the bundle.

#### `extensionConfig.globals`

[Output globals](https://rollupjs.org/guide/en/#outputglobals) as defined by Rollup. This is used for creating the browser bundle. All defaults are provide for the core package of PixiJS (e.g., `@pixi/core`, `@pixi/sprite`, etc).

#### `extensionConfig.bundle` (default: `dist/[name].js`)

The relative path to the output browser file.