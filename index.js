#!/usr/bin/env node

const inquirer = require('inquirer');
const chalk = require('chalk');
const path = require('path');
const { promises } = require('fs');
const extensionConfig = require('./lib/extensionConfig');
const { version } = require('./package.json');
const pkg = require(path.join(process.cwd(), 'package.json'));
const { spawn } = require('./lib/utils/spawn');
const { pathExists } = require('./lib/utils/pathExists');
const { template } = require('./lib/utils/template');
const { prefix } = require('./lib/utils/prefix');

/** Build the project using Rollup */
const build = (...args) =>
{
    const rollupConfig = path.join(__dirname, 'lib/rollup.config.js');

    return spawn('rollup', [
        '-c', rollupConfig,
        ...args,
        ...extensionConfig.silent ? ['--silent'] : [],
    ]);
};

const tsc = async (...args) =>
{
    const tsconfig = path.join(process.cwd(), extensionConfig.tsconfig);

    if (await pathExists(tsconfig))
    {
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
const lint = async (...args) =>
{
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
const serve = async () =>
{
    if (!await pathExists(path.join(process.cwd(), extensionConfig.serve)))
    {
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
const docs = async () =>
{
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
const runCommand = async (command) =>
{
    switch (command)
    {
        case Command.Version: {
            // eslint-disable-next-line no-console
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
            const { bump, custom } = await inquirer.prompt([{
                name: 'bump',
                type: 'list',
                message: `Release version (currently v${pkg.version}):`,
                choices: ['major', 'minor', 'patch', 'custom'],
            }, {
                name: 'custom',
                type: 'input',
                message: 'What version?',
                when: (answers) => answers.bump === 'custom',
            }]);

            await spawn('npm', ['version', bump === 'custom' ? custom : bump]);
            await runCommand(Command.Deploy);
            await spawn('npm', ['publish']);
            await spawn('git', ['push']);
            await spawn('git', ['push', '--tags']);
            break;
        }
        default: {
            // eslint-disable-next-line no-console
            console.error(chalk.red(`${prefix} Error: Unknown command "${command}". `
            + `Only the following comands are supported: "${Object.values(Command).join('", "')}"\n`));
            process.exit(1);
        }
    }
};

runCommand(process.argv[2]);
