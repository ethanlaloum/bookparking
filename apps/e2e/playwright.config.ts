import { defineConfig } from '@playwright/test';

import { frontPort, readTarget } from './src/stack/target';

const target = readTarget();

export default defineConfig({
  testDir: './tests/real',
  globalSetup: './src/stack/globalSetup.ts',
  globalTeardown: './src/stack/globalTeardown.ts',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: target.name === 'dev' ? 4 : 2,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: [['list']],
  use: {
    baseURL: target.frontUrl,
    locale: 'fr-FR',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { channel: undefined, browserName: 'chromium' } }],
  webServer:
    target.name === 'local' && process.env.E2E_LOCAL_REUSE_STACK !== 'true'
      ? {
          // `--strictPort` pour qu'un port occupe echoue bruyamment plutot que
          // de glisser en silence sur le suivant, ou la suite piloterait une
          // autre application que celle qu'elle croit tester.
          command: `pnpm --filter bookparking-front exec vite --port ${String(frontPort())} --strictPort`,
          url: target.frontUrl,
          cwd: '../..',
          reuseExistingServer: false,
          timeout: 120_000,
          env: { VITE_API_TARGET: target.apiUrl },
        }
      : undefined,
});
