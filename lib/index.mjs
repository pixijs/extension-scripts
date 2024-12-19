#!/usr/bin/env node

import chalk from 'chalk';
import { glob } from 'glob';
import { promises } from 'node:fs';
import path from 'node:path';
import url from 'url';
import { extensionConfig, packageInfo } from './extensionConfig.mjs';
import { bump } from './utils/bump.mjs';
import { pathExists } from './utils/pathExists.mjs';
import { prefix } from './utils/prefix.mjs';
import { spawn } from './utils/spawn.mjs';
import { template } from './utils/template.mjs';

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

/** Ensure that the project has a tsconfig */
const ensureTsconfig = async (tsconfigFile) =>
{
    const tsconfig = tsconfigFile ?? path.join(process.cwd(), extensionConfig.tsconfig);

    if (!(await pathExists(tsconfig)))
    {
        // eslint-disable-next-line no-console
        console.log(chalk.red(`${prefix} Error: TypeScript configuration file "${path.basename(tsconfig)}"`
            + ` not found but is required for linting and building.`));

        process.exit(1);
    }

    return tsconfig;
};

/**
 * Wrapper for using typescript's CLI
 * @param {string} tsconfigFile Optional absolute path to the tsconfig file
 *
 */
const tsc = async (tsconfigFile, ...args) =>
    spawn('tsc', ['-p', await ensureTsconfig(tsconfigFile), ...args]);

/** Wrapper for Jest */
const test = async (additionalArgs) =>
{
    const testFiles = await glob(path.join(process.cwd(), '**/*.test.ts'));

    if (testFiles.length === 0)
    {
        // eslint-disable-next-line no-console
        console.log(chalk.yellow(`${prefix} Warning: No *.test.ts files found, skipping tests.`));

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
        '--passWithNoTests',
        ...additionalArgs,
    ]);
};

/** Generate the types into the lib folder */
const bundleTypes = async () =>
{
    let tsconfigTypesFile = extensionConfig.tsconfigTypes
        ? path.join(process.cwd(), extensionConfig.tsconfigTypes) : null;

    // If no tsconfig types file is defined, we will create one
    // based on the current tsconfig.json file
    if (!tsconfigTypesFile)
    {
        const tsconfigFile = await ensureTsconfig();

        tsconfigTypesFile = tsconfigFile.replace(/\.json$/, '.types.json');
        const config = JSON.parse(await promises.readFile(tsconfigFile, 'utf8'));

        await promises.writeFile(tsconfigTypesFile, JSON.stringify({
            ...config,
            compilerOptions: {
                ...config.compilerOptions,
                // Just emit the declaration files only
                declaration: true,
                emitDeclarationOnly: true,
                outDir: './lib',
                // make sure we exclude anything, such as scripts,
                // outside of the src folder to avoid lib/src/index.d.ts
                rootDir: './src',
            },
            // Make sure to exclude any Jest test files
            exclude: ['**/*.test.ts']
        }, null, 2), 'utf8');
    }

    try
    {
        await tsc(tsconfigTypesFile);
    }
    finally
    {
        // Clean up if the tsconfig file was generated
        if (!extensionConfig.tsconfigTypes)
        {
            await promises.unlink(tsconfigTypesFile);
        }
    }
};

/** Run ESlint with built-in config */
const lint = async (additionalArgs = []) =>
{
    // Ensure that the project has a tsconfig
    await ensureTsconfig();

    const eslintMJS = path.join(process.cwd(), 'eslint.config.mjs');
    const eslintJS = path.join(process.cwd(), 'eslint.config.js');
    const isDefined = 'eslintConfig' in packageInfo
        || await pathExists(eslintMJS)
        || await pathExists(eslintJS);

    if (!isDefined)
    {
        // We copy this file to the project if one doesn't exist
        // because using ESLint's -c parameter turns off eslintrc
        // which means that, tests, etc. won't be linted with a local .eslintrc
        await promises.copyFile(path.join(__dirname, 'configs/eslint.config.mjs'), eslintMJS);
    }

    const cleanup = async () =>
    {
        if (!isDefined)
        {
            await promises.unlink(eslintMJS);
        }
    };

    await spawn('eslint', [
        '--no-error-on-unmatched-pattern',
        ...extensionConfig.lint,
        ...additionalArgs,
    ], cleanup);
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
    await spawn('rimraf', [extensionConfig.docsDestination]);

    const templateConfig = path.join(__dirname, 'configs/webdoc.json');
    const webdocConfig = path.join(process.cwd(), '.webdoc.json');
    const contents = await promises.readFile(templateConfig, 'utf8');
    const cleanup = async () => await promises.unlink(webdocConfig);

    await promises.writeFile(webdocConfig, template(contents, extensionConfig), 'utf8');
    await spawn('webdoc', ['-c', webdocConfig], cleanup);
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
            break;
        }
        case Command.Clean: {
            await spawn('rimraf', [
                'dist',
                'lib',
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
            await spawn('npm', ['publish', '--tag', process.env.XS_PUBLISH_TAG ?? 'latest']);
            await cleanPackage('restore');
            break;
        }
        case Command.Serve: serve().then(() => runCommand(Command.Watch)); break;
        case Command.Test: await test(additionalArgs); break;
        case Command.Types: await tsc(null, '-noEmit'); break;
        case Command.Upload: {
            await spawn('gh-pages', [
                '-d', extensionConfig.deployRoot,
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
            console.error(chalk.red(`${prefix} Error: Unknown command "${command}". `
            + `Only the following comands are supported: "${Object.values(Command).join('", "')}"\n`));
            process.exit(1);
        }
    }
};

runCommand(process.argv[2], process.argv.slice(3) ?? []);
