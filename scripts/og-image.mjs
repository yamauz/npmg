// トップページ用 OGP 画像(1200×630)を生成する。
// 背景はヒーローと同じ「依存グラフ星座」シェーダーを vgpu/node でヘッドレス描画し、
// その上にロゴ(六角形+青ドット)と npmg ワードマークを headless Chrome で重ねる。
// (headless Chrome 側は WebGPU が使えないため、背景描画は Node 側で行う)
// 使い方: node scripts/og-image.mjs [dark:0|1] [time] [出力先]
import { chromium } from 'playwright-core'
import { PNG } from 'pngjs'
import { init, effect, target } from 'vgpu/node'
import { NETWORK_WGSL } from '../docs/.vitepress/theme/hero-shader.js'

const WIDTH = 1200
const HEIGHT = 630
const SCALE = 2 // 2 倍解像度で描いて縮小し、線と文字を締める
// 星座は右端アンカーで左が空くため、広めに描いて左端を切り落とす
const OVERSCAN = 1.34
const dark = Number(process.argv[2] ?? 1)
const time = Number(process.argv[3] ?? 26)
const out = process.argv[4] ?? `docs/public/og${dark ? '' : '-light'}.png`

// design.md のトークンに一致させたパレット
const palette = dark
  ? { bg: '#101319', ink: '#E6E9EF', accent: '#5B8CFF', sub: '#9AA1AC' }
  : { bg: '#FAFAFA', ink: '#1C1E21', accent: '#2563EB', sub: '#6B7280' }

// --- 1. 背景シェーダーを Node 側で描画して data URL 化 ---
const gpu = await init()
const BG_W = Math.round(WIDTH * SCALE * OVERSCAN)
const BG_H = HEIGHT * SCALE
const colorTarget = target(gpu, { size: [BG_W, BG_H] })
const fx = effect(gpu, NETWORK_WGSL, {
  set: { params: { time, aspect: BG_W / BG_H, pointer: [0, 0], pscene: [99, 99], dark } },
})
fx.draw(colorTarget)
const pixels = await colorTarget.read()
const png = new PNG({ width: BG_W, height: BG_H })
png.data.set(pixels)
const bgDataUrl = `data:image/png;base64,${PNG.sync.write(png).toString('base64')}`
gpu.dispose()

// --- 2. ロゴとワードマークを重ねて撮影 ---
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: SCALE,
})

const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

const html = `<!doctype html>
<html lang="ja"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+JP:wght@400;500;700&display=swap">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body { background: ${palette.bg}; position: relative; }
  .bg {
    position: absolute; top: 0; right: 0;
    height: 100%; width: auto;
    display: block;
  }
  .stage {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 30px;
  }
  .mark { display: flex; align-items: center; gap: 30px; }
  .mark svg { width: 108px; height: 108px; display: block; }
  .word {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-weight: 500;
    font-size: 116px;
    line-height: 1;
    letter-spacing: 0.06em;
    color: ${palette.ink};
    /* モノスペースの右側トラッキング分を視覚中央に戻す */
    margin-right: -0.06em;
  }
  .tagline {
    font-family: 'Noto Sans JP', sans-serif;
    font-weight: 500;
    font-size: 29px;
    letter-spacing: 0.13em;
    color: ${palette.sub};
  }
</style></head>
<body>
  <img class="bg" src="${bgDataUrl}" alt="">
  <div class="stage">
    <div class="mark">
      <svg viewBox="0 0 28 28" fill="none">
        <path d="M14 2.5 24 8.25v11.5L14 25.5 4 19.75V8.25L14 2.5Z"
              stroke="${palette.ink}" stroke-width="1.7" stroke-linejoin="round"/>
        <circle cx="14" cy="14" r="2.4" fill="${palette.accent}"/>
      </svg>
      <span class="word">npmg</span>
    </div>
    <div class="tagline">Node.js Package Manager Guide</div>
  </div>
</body></html>`

await page.setContent(html, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(400)
await page.screenshot({ path: out })
console.log(`saved: ${out} (dark=${dark}, time=${time})`)
if (errors.length) {
  console.log('--- errors ---')
  for (const e of errors) console.log(e)
}
await browser.close()
