#!/usr/bin/env node

const path = require('path');
const child_process = require('child_process');
const { promises } = require('fs');
const command = process.argv[2];
const projectPath = path.join(process.cwd());

/** Utility to do spawn but as a Promise */
const spawn = (command, args, options) => {
    return new Promise((resolve, reject) => {
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
const clean = () => spawn('rimraf', ['dist/*', 'lib/*']);

/** Build the project using Rollup */
const build = (...args) => {
    const rollupConfig = path.join(__dirname, 'lib/rollup.config.js');
    return spawn('rollup', ['-c', rollupConfig, ...args]);
};

/** Run the types */
const types = async () => {
    const tsconfig = path.join(process.cwd(), 'tsconfig.json');
    if (await pathExists(tsconfig)) {
        return spawn('tsc', ['-p', tsconfig, '-noEmit']);
    }
    return spawn('tsc', [
        'src/index.ts',
        '--target', 'ES2020',
        '--moduleResolution', 'node',
        '--esModuleInterop',
        '--noImplicitAny',
        '--strict',
        '-noEmit'
    ]);
};

/** Run the eslint */
const lint = async (...args) => {
    const eslintConfig = path.join(__dirname, 'lib/eslint.config.json');
    return spawn('eslint', [
        '-c', eslintConfig,
        'src', 
        ...(await pathExists(path.join(process.cwd(), 'test')) ? ['test'] : []),
        ...(await pathExists(path.join(process.cwd(), 'examples')) ? ['examples'] : []),
        '--ext', '.ts',
        '--ext', '.js',
        ...args,
    ]);
};

/** Deploy everything to gh-pages */
const deploy = () => spawn('gh-pages', [
    '-d', '.',
    '-s', '{dist,examples,docs}/**',
    '-f',
]);

/** Crate the documentation */
const docs = () => spawn('webdoc', [
    '-c', 'config/webdoc.json', 
    '-r',  'README.md',
]);

/** Open the exmaples folder */
const examples = async () => {
    if (!await pathExists(path.join(process.cwd(), 'examples'))) {
        console.log('Error: No "examples" folder found, stopping.\n');
        process.exit(1);
    }
    return spawn('http-server', ['.', '-a', 'localhost', '-o', 'examples']);
};

const main = async () => {
    switch(command) {
        case 'watch':
            await build('-w');
            break;
        case 'clean':
            await clean();
            break;
        case 'lint':
            await lint('--fix');
            break;
        case 'types':
            await types();
            break;
        case 'build':
            await clean();
            await types();
            await lint();
            await build();
            break;
        case 'deploy':
            await docs();
            await deploy();
            break;
        case 'examples':
            examples().then(() => build('-w'));
            break;
        default:
            console.log('Unknown command');
            process.exit(1);
    }
};

main();