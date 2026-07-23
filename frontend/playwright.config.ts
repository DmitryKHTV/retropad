import {defineConfig, devices} from '@playwright/test';

// E2E tests hit the real stack: Next dev server (3001) + NestJS API (3000) + its
// Postgres. Playwright auto-starts / reuses the frontend; the backend must be
// running (`cd backend && npm run start:dev` with Docker Postgres up) — it can't
// be booted here because it needs the database. Only chromium is installed
// (`npx playwright install chromium`); the mobile project is chromium with a
// phone viewport, not WebKit, so no extra browser download is required.
export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        baseURL: 'http://localhost:3001',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'desktop',
            use: {...devices['Desktop Chrome'], viewport: {width: 1280, height: 800}},
        },
        {
            name: 'mobile',
            // Hand-rolled phone profile on chromium (iPhone devices default to
            // WebKit, which we don't install). isMobile is chromium-only.
            use: {
                browserName: 'chromium',
                viewport: {width: 390, height: 844},
                deviceScaleFactor: 2,
                isMobile: true,
                hasTouch: true,
            },
        },
    ],
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3001',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
