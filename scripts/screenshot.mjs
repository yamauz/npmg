// 開発サーバーのページを headless Chrome で撮影する確認用スクリプト
// 使い方: node scripts/screenshot.mjs <URL> <出力パス> [フルページ:full]
import { chromium } from 'playwright-core'

const [url = 'http://localhost:5173', out = '/tmp/shot.png', mode] = process.argv.slice(2)

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})
page.on('pageerror', (err) => errors.push(String(err)))
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(1800)
await page.screenshot({ path: out, fullPage: mode === 'full' })
console.log(`saved: ${out}`)
if (errors.length) {
  console.log('--- console errors ---')
  for (const e of errors) console.log(e)
} else {
  console.log('console errors: なし')
}
await browser.close()
