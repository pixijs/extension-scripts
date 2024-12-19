export default {
    preset: 'ts-jest',
    runner: '@kayahr/jest-electron-runner',
    testEnvironment: '@kayahr/jest-electron-runner/environment',
    setupFilesAfterEnv: ['jest-extended/all'],
    transform: {
        // Support for loading vertex and fragment shaders for PixiJS
        '\\.vert$': 'jest-raw-loader',
        '\\.frag$': 'jest-raw-loader',
        '\\.wgsl$': 'jest-raw-loader',
    },
    testMatch: ['<rootDir>/**/__tests__/*.test.ts']
};
