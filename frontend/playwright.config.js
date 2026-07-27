import { defineConfig, devices } from '@playwright/test'

const FRONTEND_PORT = 5173
const BACKEND_PORT = 8001

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: `poetry run uvicorn main:app --port ${BACKEND_PORT}`,
      cwd: '../backend',
      port: BACKEND_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'npm run dev',
      cwd: '.',
      port: FRONTEND_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        VITE_API_BASE_URL: `http://localhost:${BACKEND_PORT}`,
      },
    },
  ],
})
