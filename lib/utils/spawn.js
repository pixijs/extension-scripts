const path = require('path');
const childProcess = require('child_process');
const projectPath = path.join(process.cwd());
const extensionConfig = require('../extensionConfig');
const chalk = require('chalk');
const { prefix } = require('./prefix');

/** Utility to do spawn but as a Promise */
const spawn = (command, args, options) =>
    new Promise((resolve, reject) =>
    {
        if (!extensionConfig.silent)
        {
            // eslint-disable-next-line no-console
            console.log(chalk.gray(`\n${prefix} > ${command} ${args.join(' ')}`));
        }
        const child = childProcess.spawn(command, args, {
            cwd: projectPath,
            stdio: 'inherit',
            ...options,
        });

        child.on('close', (code) =>
        {
            if (code === 0)
            {
                resolve();
            }
        });
        child.on('error', reject);
    });

exports.spawn = spawn;
