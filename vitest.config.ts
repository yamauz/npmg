import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // e2e/ は Playwright が走らせる。vitest が拾うと
    // 「test() をここで呼ぶな」で落ちるので明示的に外す。
    include: ['scripts/**/*.test.mjs'],
  },
})
