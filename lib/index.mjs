#!/usr/bin/env node

import chalk from 'chalk';
import path from 'node:path';
import { promises } from 'node:fs';
import { extensionConfig, packageInfo } from './extensionConfig.mjs';
import { spawn } from './utils/spawn.mjs';
import { pathExists } from './utils/pathExists.mjs';
import { template } from './utils/template.mjs';
import { prefix } from './utils/prefix.mjs';
import { bump } from './utils/bump.mjs';
import url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const scriptsPkg = JSON.parse(await promises.readFile(
    path.join(__dirname, '../package.json'),
    { encoding: 'utf8' }
));

/** Build the project using Rollup */
const bundle = (...args) =>
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
        '--module', 'ESNext',
        '--sourceMap',
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
const bundleTypes = () => tsc(
    '--outDir', path.join(process.cwd(), 'lib'),
    '--declaration',
    '--emitDeclarationOnly'
);

/**
 * Fix/hack for importing global mixins for a project
 * because tsc will output the wront triple reference
 */
const fixGlobalTypes = async () =>
{
    const globalTypes = path.join(process.cwd(), 'global.d.ts');

    if (await pathExists(globalTypes))
    {
        const indexFile = path.resolve(process.cwd(), 'lib/index.d.ts');
        const buffer = await promises.readFile(indexFile, 'utf8');

        await promises.writeFile(indexFile, buffer.replace(
            '/// <reference types="global" />',
            '/// <reference path="../global.d.ts" />'
        ));
    }
};

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
        '--no-error-on-unmatched-pattern',
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

/** Open the exmaples folder */
const serve = async () =>
{
    if (!(await pathExists(path.join(process.cwd(), extensionConfig.serve))))
    {
        console.error(chalk.red(`${prefix} Error: No "${extensionConfig.serve}" folder found, stopping.\n`));
        process.exit(1);
    }

    spawn('http-server', [
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

    await promises.writeFile(webdocConfig, template(contents, extensionConfig), 'utf8');
    await spawn('webdoc', ['-c', webdocConfig], {
        onClose: async () => await promises.unlink(webdocConfig),
    });
};

/** Clean up the package contents */
const cleanPackage = async (...args) =>
{
    const config = path.join(__dirname, 'configs/clean-package.json');

    await spawn('clean-package', [
        ...args,
        '--config', config,
    ]);
};

/** Supported commands */
const Command = {
    Build: 'build',
    Bump: 'bump',
    Bundle: 'bundle',
    Clean: 'clean',
    Deploy: 'deploy',
    Docs: 'docs',
    GitPush: 'git-push',
    Lint: 'lint',
    Pack: 'pack',
    Publish: 'publish',
    Release: 'release',
    Serve: 'serve',
    Test: 'test',
    Types: 'types',
    Upload: 'upload',
    Version: 'version',
    Watch: 'watch',
};

/** Workflow tasks */
const Aliases = {
    [Command.Build]: 'clean,lint,types,bundle',
    [Command.Deploy]: 'build,docs,upload',
    [Command.Release]: 'bump,test,deploy,publish,git-push',
};

/** Run one of the commands above */
const runCommand = async (command, additionalArgs) =>
{
    // Check for aliases
    if (Aliases[command])
    {
        await runCommand(Aliases[command], additionalArgs);

        return;
    }

    // Support for chaining commands, for example: "build,docs,test"
    if (command.includes(','))
    {
        const commands = command.split(',');

        for (const command of commands)
        {
            await runCommand(command, additionalArgs);
        }

        return;
    }

    switch (command)
    {
        case Command.Bump: {
            try
            {
                const nextVersion = await bump(packageInfo.version);

                await spawn('npm', ['version', nextVersion]);
            }
            catch (e)
            {
                console.error(chalk.red(`${prefix} Error: ${e.message}\n`));
                process.exit(1);
            }
            break;
        }
        case Command.Bundle: {
            await bundle();
            await bundleTypes();
            await fixGlobalTypes();

            break;
        }
        case Command.Clean: {
            await spawn('rimraf', [
                '{dist,lib}/*',
                ...extensionConfig.clean,
            ]);
            break;
        }
        case Command.Docs: await docs(); break;
        case Command.GitPush: {
            await spawn('git', ['push']);
            await spawn('git', ['push', '--tags']);

            break;
        }
        case Command.Lint: await lint(additionalArgs); break;
        case Command.Pack: {
            await cleanPackage();
            await spawn('npm', ['pack']);
            await cleanPackage('restore');
            break;
        }
        case Command.Publish: {
            await cleanPackage();
            await spawn('npm', ['publish']);
            await cleanPackage('restore');
            break;
        }
        case Command.Serve: serve().then(() => runCommand(Command.Watch)); break;
        case Command.Test: await test(additionalArgs); break;
        case Command.Types: await tsc('-noEmit'); break;
        case Command.Upload: {
            await spawn('gh-pages', [
                '-d', '.',
                '-b', extensionConfig.deployBranch,
                '-s', extensionConfig.deployFiles,
                '-f',
            ]);
            break;
        }
        case Command.Version: {
            // eslint-disable-next-line no-console
            console.log(`v${scriptsPkg.version}`);
            break;
        }
        case Command.Watch: bundle('-w'); break;
        default: {
            // eslint-disable-next-line no-console
            console.error(chalk.red(`${prefix} Error: Unknown command "${command}". `
            + `Only the following comands are supported: "${Object.values(Command).join('", "')}"\n`));
            process.exit(1);
        }
    }
};

runCommand(process.argv[2], process.argv.slice(3) ?? []);
