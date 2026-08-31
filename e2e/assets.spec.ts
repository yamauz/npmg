import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { DOCS } from './pages'

// OGP 画像と raw md は「ビルドでは生成されない」静的成果物。
// 生成し忘れてもビルドは通り、エラーも出ないまま 404 になる(CLAUDE.md の既知の罠)。
// ここが CI で E2E を回す一番の理由。

for (const doc of DOCS) {
  test(`OGP 画像が存在する: ${doc.slug}`, async ({ page }) => {
    await page.goto(doc.path)

    const content = await page.locator('meta[property="og:image"]').getAttribute('content')
    expect(content, `${doc.path} に og:image がない`).toBeTruthy()

    // 絶対 URL で入っているのでパスだけ取り出して、配信中のサイトに当てる
    const url = new URL(content!)
    expect(url.pathname, 'og:image のパスがスラッグ規則と違う').toBe(`/og/${doc.slug}.png`)

    const res = await page.request.get(url.pathname)
    expect(res.status(), `${url.pathname} が 404。og-image.mjs --chapters を流す`).toBe(200)
    expect(res.headers()['content-type']).toContain('image/png')
  })

  test(`raw md が存在する: ${doc.slug}`, async ({ page }) => {
    const res = await page.request.get(`/raw/${doc.slug}.md`)
    expect(res.status(), `/raw/${doc.slug}.md が 404。pnpm llms を流す`).toBe(200)

    const body = await res.text()
    expect(body.length, 'raw md が空').toBeGreaterThan(0)

    // 変換漏れの検出。この 3 つが残っていると貼り付け先で壊れる
    expect(body, 'TermDemo タグが変換されず残っている').not.toContain('<TermDemo')
    expect(body, 'figure タグが畳まれず残っている').not.toContain('<figure')
    expect(body, '図版の生成プロンプトが削除されていない').not.toMatch(/^<!--[\s\S]*?prompt/im)
  })
}

test('llms.txt が配信されている', async ({ page }) => {
  const res = await page.request.get('/llms.txt')
  expect(res.status()).toBe(200)

  const body = await res.text()
  // 索引なので全ページが載っているはず
  for (const doc of DOCS) {
    expect(body, `llms.txt に ${doc.slug} がない`).toContain(`${doc.slug}.md`)
  }
})

test('raw md が本文の変更に追従している', async () => {
  // pnpm llms の流し忘れ検出。H1 だけを比べる(本文全体だと変換で差が出るため)
  for (const doc of DOCS) {
    const source = readFileSync(`docs${doc.path}.md`, 'utf8')
    const generated = readFileSync(`docs/public/raw/${doc.slug}.md`, 'utf8')

    const h1 = source.match(/^#\s+(.+)$/m)?.[1].trim()
    expect(h1, `docs${doc.path}.md に H1 がない`).toBeTruthy()
    expect(generated, `raw/${doc.slug}.md の H1 が古い。pnpm llms を流す`).toContain(h1!)
  }
})
