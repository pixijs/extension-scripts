#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'node:path';
import { promises } from 'node:fs';
import { extensionConfig, packageInfo } from './extensionConfig.mjs';
import { spawn } from './utils/spawn.mjs';
import { pathExists } from './utils/pathExists.mjs';
import { template } from './utils/template.mjs';
import { prefix } from './utils/prefix.mjs';
import url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const scriptsPkg = JSON.parse(await promises.readFile(
    path.join(__dirname, '../package.json'),
    { encoding: 'utf8' }
));

/** Build the project using Rollup */
const build = (...args) =>
{
    const rollupConfig = path.join(__dirname, 'configs/rollup.mjs');

    return spawn('rollup', [
        '-c', rollupConfig,
        ...args,
        ...extensionConfig.silent ? ['--silent'] : [],
    ]);
};

/** Wrapper for using typescript's CLI */
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

/** Wrapper for Jest */
const test = async (additionalArgs) =>
{
    const testPath = path.join(process.cwd(), 'test');

    if (!(await pathExists(testPath)))
    {
        // eslint-disable-next-line no-console
        console.log(chalk.yellow(`${prefix} Warning: No "test" folder found, skipping tests.`));

        return;
    }

    let configPath;

    // User wants to override the jest configration
    // then we will ignore the default one
    if (extensionConfig.jestConfig)
    {
        const jestConfig = path.join(process.cwd(), extensionConfig.jestConfig);

        if (!(await pathExists(jestConfig)))
        {
            // eslint-disable-next-line no-console
            console.log(chalk.red(`${prefix} Error: Jest config file "${extensionConfig.jestConfig}"`
                + ` not found, skipping tests.`));

            return;
        }

        configPath = jestConfig;
    }

    await spawn('jest', [
        '--config', configPath ?? path.join(__dirname, 'configs/jest.mjs'),
        '--rootDir', process.cwd(),
        ...additionalArgs,
    ]);
};

/** Export the types */
const buildTypes = () => tsc(
    '--outDir', path.join(process.cwd(), 'lib'),
    '--declaration',
    '--emitDeclarationOnly'
);

/** Run ESlint with built-in config */
const lint = async (additionalArgs = []) =>
{
    const eslintrcJson = path.join(process.cwd(), '.eslintrc.json');
    const eslintrcJs = path.join(process.cwd(), '.eslintrc.js');
    const eslintrc = path.join(process.cwd(), '.eslintrc');
    const isDefined = 'eslintConfig' in packageInfo
        || await pathExists(eslintrcJson)
        || await pathExists(eslintrcJs)
        || await pathExists(eslintrc);

    if (!isDefined)
    {
        // We copy this file to the project if one doesn't exist
        // because using ESLint's -c parameter turns off eslintrc
        // which means that, tests, etc. won't be linted with a local .eslintrc
        await promises.copyFile(path.join(__dirname, 'configs/eslint.json'), eslintrcJson);
    }

    await spawn('eslint', [
        '--ext', '.ts',
        '--ext', '.js',
        '--ext', '.mjs',
        ...extensionConfig.lint,
        ...additionalArgs,
    ], {
        onClose: async () =>
        {
            if (!isDefined)
            {
                await promises.unlink(eslintrcJson);
            }
        }
    });
};

/** Deploy everything to gh-pages */
const deploy = () => spawn('gh-pages', [
    '-d', '.',
    '-b', extensionConfig.deployBranch,
    '-s', extensionConfig.deployFiles,
    '-f',
]);

/** Open the exmaples folder */
const serve = async () =>
{
    if (!(await pathExists(path.join(process.cwd(), extensionConfig.serve))))
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
    // Clear the current docs
    await spawn('rimraf', [`${extensionConfig.docsDestination}/*`]);

    const templateConfig = path.join(__dirname, 'configs/webdoc.json');
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
    ], {
        onClose: async () => await promises.unlink(webdocConfig),
    });
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
    Test: 'test',
    Docs: 'docs',
};

/** Run one of the commands above */
const runCommand = async (command, additionalArgs) =>
{
    switch (command)
    {
        case Command.Version: {
            // eslint-disable-next-line no-console
            console.log(`v${scriptsPkg.version}`);
            break;
        }
        case Command.Watch: {
            await build('-w');
            break;
        }
        case Command.Clean: {
            await spawn('rimraf', [
                '{dist,lib}/*',
                ...extensionConfig.clean,
            ]);
            break;
        }
        case Command.Lint: {
            await lint(additionalArgs);
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
            await docs();
            break;
        }
        case Command.Test: {
            await test(additionalArgs);
            break;
        }
        case Command.Release: {
            const { bump, custom } = await inquirer.prompt([{
                name: 'bump',
                type: 'list',
                message: `Release version (currently v${packageInfo.version}):`,
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

runCommand(process.argv[2], process.argv.slice(3) ?? []);
