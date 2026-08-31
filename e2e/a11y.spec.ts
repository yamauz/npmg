import { test, expect } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { ALL_PATHS } from './pages'

// WCAG 2.1 AA を axe で継続的に検証する。導入時 (2026-08-31) に
// color-contrast が 920 件出たので、custom.css 側で潰してゼロにした。
// 淡い補助色やシンタックスハイライトは「読めるが AA には届かない」に
// なりやすく、目視では気づけないためテストで固定する。
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

for (const path of ALL_PATHS) {
  test(`a11y (ライト): ${path}`, async ({ page }) => {
    await page.goto(path)
    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
    expect(describe(violations)).toEqual([])
  })

  test(`a11y (ダーク): ${path}`, async ({ page }) => {
    await page.goto(path)
    await page.evaluate(() => {
      document.documentElement.classList.add('dark')
      localStorage.setItem('vitepress-theme-appearance', 'dark')
    })
    // クラス切り替え後、変数が解決されるまで待つ
    await page.waitForTimeout(300)
    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
    expect(describe(violations)).toEqual([])
  })
}

/** 失敗時に「どのルールがどの要素で落ちたか」まで出す */
function describe(violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']) {
  return violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.length,
    example: v.nodes[0]?.html?.slice(0, 120),
    detail: v.nodes[0]?.any?.[0]?.message,
  }))
}
