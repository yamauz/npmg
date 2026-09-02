import { test, expect } from '@playwright/test'
import { DOCS } from './pages'

// sitemap.xml と robots.txt は OGP / raw md と違いビルドで必ず生成されるので、
// 「流し忘れ」は起きない。ここで守っているのは URL の形と件数:
//
//  - Cloudflare の静的アセット配信は拡張子付き URL を拡張子なしへ 307 で飛ばす。
//    cleanUrls が外れると sitemap の loc も og:url も全件リダイレクト先になる
//  - srcExclude が外れると docs/public/raw/*.md がページとして拾われ、
//    実在しない /public/raw/* が 15 件並ぶ(実際に踏んだ)

test('sitemap.xml が配信されている', async ({ page }) => {
  const res = await page.request.get('/sitemap.xml')
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('xml')
})

test('sitemap に全ページがちょうど 1 回ずつ載っている', async ({ page }) => {
  const body = await (await page.request.get('/sitemap.xml')).text()
  const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])

  // 本文 15 ページ + TOP。増減したらここを直す前に意図した変更か確かめる
  expect(locs, `loc の件数が想定外:\n${locs.join('\n')}`).toHaveLength(DOCS.length + 1)
  expect(new Set(locs).size, 'loc が重複している').toBe(locs.length)

  for (const doc of DOCS) {
    expect(locs, `sitemap に ${doc.path} がない`).toContain(
      `https://npmg.yamauz.workers.dev${doc.path}`,
    )
  }
  expect(locs, 'sitemap に TOP がない').toContain('https://npmg.yamauz.workers.dev/')
})

test('sitemap の loc がリダイレクトされない形になっている', async ({ page }) => {
  const body = await (await page.request.get('/sitemap.xml')).text()
  const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])

  for (const loc of locs) {
    expect(loc, `${loc} が .html 付き。cleanUrls が外れている`).not.toMatch(/\.html$/)
    expect(loc, `${loc} に public/ が混入。srcExclude が外れている`).not.toContain('/public/')
  }
})

test('og:url と sitemap の URL 形状が一致する', async ({ page }) => {
  // 同じページを指す URL が 3 通り(og:url / sitemap / llms.txt)あるので、
  // 少なくとも og:url と sitemap は同じ形であることを担保する
  const body = await (await page.request.get('/sitemap.xml')).text()
  const locs = new Set([...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))

  for (const doc of DOCS) {
    await page.goto(doc.path)
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content')
    expect(ogUrl, `${doc.path} に og:url がない`).toBeTruthy()
    expect(locs.has(ogUrl!), `og:url (${ogUrl}) が sitemap の loc と一致しない`).toBe(true)
  }
})

test('robots.txt が sitemap を指している', async ({ page }) => {
  const res = await page.request.get('/robots.txt')
  expect(res.status(), '/robots.txt が 404').toBe(200)

  const body = await res.text()
  expect(body).toContain('Sitemap: https://npmg.yamauz.workers.dev/sitemap.xml')
  expect(body).toMatch(/^User-agent:\s*\*/m)
})
