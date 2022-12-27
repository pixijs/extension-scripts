#!/usr/bin/env node

const chalk = require('chalk');
const path = require('path');
const child_process = require('child_process');
const { promises } = require('fs');
const projectPath = path.join(process.cwd());
const extensionConfig = require('./lib/extensionConfig');
const { version, name, description, repository, keywords = [] } = require('./package.json');
const prefix = chalk.gray.dim('[extension-scripts]');

/** Utility to do spawn but as a Promise */
const spawn = (command, args, options) => {
    return new Promise((resolve, reject) => {
        if (!extensionConfig.silent) {
            console.log(chalk.gray(`\n${prefix} > ${command} ${args.join(' ')}`));
        }
        const child = child_process.spawn(command, args, {
            cwd: projectPath,
            stdio: 'inherit',
            ...options,
        });
        child.on('close', code => {
            if (code === 0) {
                resolve();
            }
        });
        child.on('error', reject);
    });
};

/** Utility to check if a path exists */
const pathExists = async (path) => {
    try {
        await promises.access(path);
        return true;
    } catch (e) {
        return false;
    }
};

/** Convert a string with a map */
const template = (str, map) => str.replace(/\${([^}]+)}/g, (_, key) => map[key]);

/** Build the project using Rollup */
const build = (...args) => {
    const rollupConfig = path.join(__dirname, 'lib/rollup.config.js');
    return spawn('rollup', [
        '-c', rollupConfig,
        ...args,
        ...extensionConfig.silent ? ['--silent'] : [],
    ]);
};

const tsc = async (...args) => {
    const tsconfig = path.join(process.cwd(), extensionConfig.tsconfig);
    if (await pathExists(tsconfig)) {
        return spawn('tsc', ['-p', tsconfig, ...args]);
    }
    return spawn('tsc', [
        extensionConfig.source,
        '--target', 'ES2020',
        '--moduleResolution', 'node',
        '--esModuleInterop',
        '--noImplicitAny',
        '--strict',
        ...args,
    ]);
};

/** Export the types */
const buildTypes = () => tsc(
    '--outDir', path.join(process.cwd(), 'lib'),
    '--declaration',
    '--emitDeclarationOnly'
);

/** Run the eslint */
const lint = async (...args) => {
    const eslintConfig = path.join(__dirname, 'lib/eslint.config.json');
    return spawn('eslint', [
        '-c', eslintConfig,
        'src', 
        ...extensionConfig.lint,
        '--ext', '.ts',
        '--ext', '.js',
        ...args,
    ]);
};

/** Deploy everything to gh-pages */
const deploy = () => spawn('gh-pages', [
    '-d', '.',
    '-s', extensionConfig.deploy,
    '-f',
]);

/** Open the exmaples folder */
const serve = async () => {
    if (!await pathExists(path.join(process.cwd(), extensionConfig.serve))) {
        console.error(chalk.red(`${prefix} Error: No "${extensionConfig.serve}" folder found, stopping.\n`));
        process.exit(1);
    }
    return spawn('http-server', [
        '.',
        '-a', 'localhost',
        '-o', extensionConfig.serve,
    ]);
};

/** Create the documentation */
const docs = async () => {
    const templateConfig = path.join(__dirname, 'lib/webdoc.config.json');
    const webdocConfig = path.join(process.cwd(), '.webdoc.json');
    const contents = await promises.readFile(templateConfig, 'utf8');
    const { 
        docsIndex,
        docsDestination,
        docsRepository,
        docsName,
        docsCopyright,
        docsTitle,
        docsDescription,
        docsKeywords } = extensionConfig;
    await promises.writeFile(webdocConfig, template(contents, {
        docsDestination,
        docsRepository,
        docsName,
        docsCopyright,
        docsTitle,
        docsDescription,
        docsKeywords,
    }), 'utf8');
    await spawn('webdoc', [
        '-c', webdocConfig,
        '-r', docsIndex,
    ]);
    await promises.unlink(webdocConfig);
};

/** Supported commands */
const Command = {
    Watch: 'watch',
    Clean: 'clean',
    Lint: 'lint',
    Types: 'types',
    Build: 'build',
    Deploy: 'deploy',
    Serve: 'serve',
    Release: 'release',
    Version: 'version',
    Docs: 'docs',
};

/** Run one of the commands above */
const runCommand = async (command) => {
    switch(command) {
        case Command.Version: {
            console.log(`v${version}`);
            break;
        }
        case Command.Watch: {
            await build('-w');
            break;
        }
        case Command.Clean: {
            await spawn('rimraf', [
                'dist/*',
                'lib/*',
                ...extensionConfig.clean
            ]);
            break;
        }
        case Command.Lint: {
            await lint('--fix');
            break;
        }
        case Command.Types: {
            await tsc('-noEmit');
            break;
        }
        case Command.Build: {
            await runCommand(Command.Clean);
            await runCommand(Command.Types);
            await lint();
            await build();
            await buildTypes();
            break;
        }
        case Command.Deploy: {
            await runCommand(Command.Build);
            await runCommand(Command.Docs);
            await deploy();
            break;
        }
        case Command.Serve: {
            serve().then(() => build('-w'));
            break;
        }
        case Command.Docs: {
            await spawn('rimraf', ['docs/*']);
            await docs();
            break;
        }
        case Command.Release: {
            // TODO: Implement release
            console.warn(chalk.yellow(`${prefix} Warning: Command "${command}" is not yet implemented.\n`));
            break;
        }
        default: {
            console.error(chalk.red(`${prefix} Error: Unknown command "${command}". `
            + `Only the following comands are supported: "${Object.values(Command).join('", "')}"\n`));
            process.exit(1);
        }
    }
};

runCommand(process.argv[2]);