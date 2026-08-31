import { test, expect } from '@playwright/test'
import { ALL_PATHS, DOCS } from './pages'

// ページが開けること。VitePress のビルドはリンク切れで落ちるが、
// 「実行時に JS が落ちて中身が出ない」は素通りするのでここで見る。
for (const path of ALL_PATHS) {
  test(`遷移できる: ${path}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    const res = await page.goto(path)
    expect(res?.status(), `${path} が 200 を返さない`).toBe(200)

    // VitePress の 404 はステータス 200 で返るので、本文側でも判定する
    await expect(page.locator('.vp-doc, .home').first()).toBeVisible()
    await expect(page.locator('text=PAGE NOT FOUND')).toHaveCount(0)

    expect(errors, `${path} でコンソールエラー`).toEqual([])
  })
}

// 本文ページには必ず H1 がある(LP は layout: page で H1 を持たないため対象外)
for (const doc of DOCS) {
  test(`H1 がある: ${doc.path}`, async ({ page }) => {
    await page.goto(doc.path)
    await expect(page.locator('.vp-doc h1')).toHaveCount(1)
  })
}

test('サイドバーの全リンクが実在する', async ({ page }) => {
  await page.goto(DOCS[0].path)
  const hrefs = await page
    .locator('.VPSidebar a[href]')
    .evaluateAll((els) =>
      els
        .map((el) => (el as HTMLAnchorElement).getAttribute('href')!)
        .filter((h) => h.startsWith('/')),
    )
  expect(hrefs.length, 'サイドバーのリンクが取れていない').toBeGreaterThan(0)

  for (const href of hrefs) {
    const res = await page.request.get(href)
    expect(res.status(), `サイドバーのリンク ${href} が 404`).toBe(200)
  }
})

test('LP から 1 章へ遷移できる', async ({ page }) => {
  await page.goto('/')
  await page
    .getByRole('link', { name: /読みはじめる|はじめに|introduction/i })
    .first()
    .click()
  await expect(page.locator('.vp-doc h1')).toHaveCount(1)
})
