import path from 'node:path';
import childProcess from 'node:child_process';
import { extensionConfig } from '../extensionConfig.mjs';
import chalk from 'chalk';
import { prefix } from './prefix.mjs';

const projectPath = path.join(process.cwd());

/** Utility to do spawn but as a Promise */
export const spawn = (command, args, { onClose, ...options } = {}) =>
    new Promise((resolve, reject) =>
    {
        if (!extensionConfig.silent)
        {
            // eslint-disable-next-line no-console
            console.log(chalk.gray(`${prefix} > ${command} ${args.join(' ')}`));
        }
        const child = childProcess.spawn(command, args, {
            cwd: projectPath,
            stdio: 'inherit',
            // See https://nodejs.org/api/child_process.html#spawning-bat-and-cmd-files-on-windows
            shell: process.platform.startsWith('win'),
            ...options,
        });

        child.on('close', async (code) =>
        {
            await onClose?.();

            if (code === 0)
            {
                resolve();
            }
        });
        child.on('error', reject);
    });

