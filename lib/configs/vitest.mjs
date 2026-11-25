import { string } from 'rollup-plugin-string';
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
        browser: {
            enabled: true,
            headless: true,
            screenshotFailures: false,
            provider: playwright(),
            instances: extensionConfig.testBrowsers.map((browser) => ({ browser })),
        },
    },
};
