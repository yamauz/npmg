import { defineConfig, devices } from '@playwright/test'

// ビルド済みの静的サイトを preview で配信して叩く。
// dev サーバーではなく本番ビルドを対象にするのは、この本の壊れ方
// (OGP / raw md が生成されておらず 404、リンク切れ)がビルド成果物にしか現れないため。
const PORT = 4173
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  // 生成物の欠落は「1 ページだけ落ちる」ので、失敗しても全件走らせて全体像を出す
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm vitepress preview docs --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
