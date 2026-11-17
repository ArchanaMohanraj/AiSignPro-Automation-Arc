
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',

    fullyParallel: false,
    forbidOnly: !!process.env.CI,

    retries: 0,
    workers: 1,

    timeout: 120000,

    reporter: [
        ['list'],
        ['html', {
            outputFolder: 'reports',
            open: 'never'
        }]
    ],

    use: {
        baseURL: 'https://cpastaging.aisignpro.com/',

        browserName: 'chromium',
        headless: false,

        viewport: null,

        launchOptions: {
            args: ['--start-maximized']
        },

        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure'
    },

    outputDir: 'test-results'
});
