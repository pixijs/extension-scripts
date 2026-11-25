import { string } from 'rollup-plugin-string';
import { configDefaults } from 'vitest/config';
import { extensionConfig } from '../extensionConfig.mjs';
import { playwright } from '@vitest/browser-playwright';

export default {
    plugins: [
        // Support for loading shaders for PixiJS
        string({
            include: [
                '**/*.frag',
                '**/*.vert',
                '**/*.glsl',
                '**/*.wgsl',
            ],
        }),
    ],
    test: {
        globals: true,
        // Tests can be in the output if they're matched by moduleSource
        exclude: [...configDefaults.exclude, 'dist/**', 'lib/**'],
        browser: {
            enabled: true,
            headless: true,
            screenshotFailures: false,
            provider: playwright(),
            instances: extensionConfig.testBrowsers.map((browser) => ({ browser })),
        },
    },
};
