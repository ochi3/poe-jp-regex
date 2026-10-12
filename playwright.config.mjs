import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  timeout: 30000,
  fullyParallel: true,
  workers: 2,
  use: {baseURL: 'http://127.0.0.1:5174', browserName: 'chromium', screenshot: 'only-on-failure', trace: 'retain-on-failure'},
  projects: [
    {name: 'desktop', use: {viewport: {width: 1280, height: 900}}},
    {name: 'narrow', use: {viewport: {width: 480, height: 900}}}
  ],
  webServer: {command: 'node tooling/dev.mjs', url: 'http://127.0.0.1:5174/poe1.html', env: {PORT: '5174'}, timeout: 60000, reuseExistingServer: false}
});
