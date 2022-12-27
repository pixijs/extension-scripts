#!/usr/bin/env node

const chalk = require('chalk');
const path = require('path');
const child_process = require('child_process');
const { promises } = require('fs');
const projectPath = path.join(process.cwd());
const extensionConfig = require('./lib/extensionConfig');
const { version } = require('./package.json');
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

/** Clean everything */
const clean = () => spawn('rimraf', [
    'dist/*',
    'lib/*',
    ...extensionConfig.clean
]);

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

/** Run the types */
const types = async () => tsc('-noEmit');

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

/** Crate the documentation */
const docs = () => spawn('webdoc', [
    '-c', 'config/webdoc.json', 
    '-r',  'README.md',
]);

/** Open the exmaples folder */
const examples = async () => {
    if (!await pathExists(path.join(process.cwd(), extensionConfig.examples))) {
        console.error(chalk.red(`${prefix} Error: No "${extensionConfig.examples}" folder found, stopping.\n`));
        process.exit(1);
    }
    return spawn('http-server', [
        '.',
        '-a', 'localhost',
        '-o', extensionConfig.examples,
    ]);
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
            await clean();
            break;
        }
        case Command.Lint: {
            await lint('--fix');
            break;
        }
        case Command.Types: {
            await types();
            break;
        }
        case Command.Build: {
            await clean();
            await types();
            await lint();
            await build();
            await buildTypes();
            break;
        }
        case Command.Deploy: {
            await docs();
            await deploy();
            break;
        }
        case Command.Serve: {
            examples().then(() => build('-w'));
            break;
        }
        case Command.Release:
        case Command.Docs: {
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