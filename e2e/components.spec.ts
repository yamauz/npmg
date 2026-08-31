import { test, expect } from '@playwright/test'
import { DOCS } from './pages'

// Mermaid は過去に fastdom の ESM エラーと id 重複で描画が飛んだ実績がある。
// 「図の枠は出るが SVG が空」も起こるので、SVG の中身まで見る。
for (const doc of DOCS.filter((d) => d.mermaid)) {
  test(`Mermaid が描画される: ${doc.path}`, async ({ page }) => {
    await page.goto(doc.path)

    const figures = page.locator('.mermaid-figure')
    await expect(figures.first()).toBeVisible()

    const count = await figures.count()
    for (let i = 0; i < count; i++) {
      const svg = figures.nth(i).locator('svg')
      await expect(svg, `${doc.path} の ${i + 1} 個目の図が SVG になっていない`).toBeVisible()
      // 描画に失敗すると mermaid は空の svg か error テキストを吐く
      await expect(svg.locator('g, path, rect').first()).toBeAttached()
    }
    await expect(page.locator('text=Syntax error in text')).toHaveCount(0)
  })
}

// TermDemo は画面に入ると自動再生される。再生後に行が出ることを見る。
for (const doc of DOCS.filter((d) => d.termDemo)) {
  test(`TermDemo が動く: ${doc.path}`, async ({ page }) => {
    await page.goto(doc.path)

    const term = page.locator('.term').first()
    await term.scrollIntoViewIfNeeded()
    await expect(term).toBeVisible()

    // タイピングアニメが進むと行が増える。1 行目が空でなくなるまで待つ
    await expect(term.locator('.term__text').first()).not.toBeEmpty({ timeout: 15_000 })
  })
}

for (const doc of DOCS) {
  test(`Markdown コピーボタンがある: ${doc.path}`, async ({ page }) => {
    await page.goto(doc.path)
    // H1 の直後に注入されている(config.mts の markdown-it 差し替え)
    await expect(page.locator('.copy-md__button')).toHaveCount(1)
  })
}

test('Markdown コピーボタンが実際にコピーできる', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto(DOCS[1].path)

  const button = page.locator('.copy-md__button')
  await button.click()

  // fetch が 404 だと data-state が error になる。成功なら copied
  await expect(button, 'コピーに失敗(raw md が 404 の可能性)').toHaveAttribute(
    'data-state',
    'copied',
    { timeout: 10_000 },
  )

  const clipboard = await page.evaluate(() => navigator.clipboard.readText())
  expect(clipboard.length, 'クリップボードが空').toBeGreaterThan(0)
})

test('ダークモードに切り替えられる', async ({ page }) => {
  await page.goto(DOCS[0].path)

  const html = page.locator('html')
  await expect(html).not.toHaveClass(/dark/)
  const lightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)

  await page.locator('.VPSwitchAppearance').first().click()

  await expect(html).toHaveClass(/dark/)
  const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  expect(darkBg, '背景色がダークで変わっていない').not.toBe(lightBg)

  // ダークでも本文が読める状態のままか(白画面事故の検出)
  await expect(page.locator('.vp-doc h1')).toBeVisible()
})
