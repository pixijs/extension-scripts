const path = require('path');
const projectPath = path.join(process.cwd());
const { extensionConfig: userExtensionConfig, name } = require(path.join(projectPath, 'package.json'));

// Convert package name into suitable browser bundle path
const defaultBundle = `dist/${name.replace(/\//g, '-').replace(/[^\w\d-_]/g, '')}.js`;

// Remove the scope from the package name
const basename = path.basename(name);

// Convert into a suitable JS namespace (e.g., "@pixi/plugin-special" -> "PIXI.pluginSpecial")
const defaultNamespace = `PIXI.${
    basename
        .replace(/[^a-z0-9]/gi, '_')
        .split('_')
        .map((word, i) => i === 0
            ? word : word.charAt(0).toUpperCase() + word.slice(1))
        .join('')
}`;

/** Default config properties */
module.exports = {
    clean: [],
    lint: [],
    globals: {},
    silent: false,
    bundle: defaultBundle,
    namespace: defaultNamespace,
    source: 'src/index.ts',
    deploy: '{dist,examples,docs}/**',
    examples: 'examples',
    tsconfig: 'tsconfig.json',
    ...userExtensionConfig,
};
