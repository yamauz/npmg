// OGP 画像(1200×630)を生成する。
// 背景はヒーローと同じ「依存グラフ星座」シェーダーを vgpu/node でヘッドレス描画し、
// その上にロゴと文字を headless Chrome で重ねる。
// (headless Chrome 側は WebGPU が使えないため、背景描画は Node 側で行う)
//
// 使い方:
//   node scripts/og-image.mjs             # TOP 用 → docs/public/og.png / og-light.png
//   node scripts/og-image.mjs --chapters  # 全章分 → docs/public/og/<slug>.png
//   node scripts/og-image.mjs --all       # 両方
//
// レイアウトは 2 種:
//   top     … 中央にアイコン + npmg、下にサブタイトル
//   chapter … 中央に章タイトル(上に番号のアイブロウ)、左上にアイコン + npmg
import { mkdirSync, readFileSync, readdirSync } from 'node:fs'
import { chromium } from 'playwright-core'
import { PNG } from 'pngjs'
import { effect, init, target } from 'vgpu/node'
import { NETWORK_WGSL } from '../docs/.vitepress/theme/hero-shader.js'

const WIDTH = 1200
const HEIGHT = 630
const SCALE = 2 // 2 倍解像度で描いて縮小し、線と文字を締める
// 星座は右端アンカー(q = uv.x*aspect - aspect)で左が空くため、広めに描いて左端を切り落とす
const OVERSCAN = 1.34
// ドローイン完了後・シグナルが画面内にいる時刻
const TIME = 26

// design.md のトークンに一致させたパレット
const PALETTES = {
  dark: { bg: '#101319', ink: '#E6E9EF', accent: '#5B8CFF', sub: '#9AA1AC', rule: '#262B34' },
  light: { bg: '#FAFAFA', ink: '#1C1E21', accent: '#2563EB', sub: '#6B7280', rule: '#E4E6EA' },
}

const FONTS = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+JP:wght@400;500;700&display=swap">`

const esc = (t) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// 六角形 + 青ドットのロゴ(docs/public/logo.svg と同じ図形)
const logoSvg = (p, size) => `
  <svg viewBox="0 0 28 28" fill="none" style="width:${size}px;height:${size}px;display:block">
    <path d="M14 2.5 24 8.25v11.5L14 25.5 4 19.75V8.25L14 2.5Z"
          stroke="${p.ink}" stroke-width="1.7" stroke-linejoin="round"/>
    <circle cx="14" cy="14" r="2.4" fill="${p.accent}"/>
  </svg>`

// --- 背景シェーダーを Node 側で描画して data URL 化 ---
async function renderBackground(dark) {
  const gpu = await init()
  const w = Math.round(WIDTH * SCALE * OVERSCAN)
  const h = HEIGHT * SCALE
  const colorTarget = target(gpu, { size: [w, h] })
  const fx = effect(gpu, NETWORK_WGSL, {
    set: { params: { time: TIME, aspect: w / h, pointer: [0, 0], pscene: [99, 99], dark } },
  })
  fx.draw(colorTarget)
  const pixels = await colorTarget.read()
  const png = new PNG({ width: w, height: h })
  png.data.set(pixels)
  gpu.dispose()
  return `data:image/png;base64,${PNG.sync.write(png).toString('base64')}`
}

const baseCss = (p) => `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body { background: ${p.bg}; position: relative; }
  /* 星座は右端アンカーなので右寄せで置き、左端を切り落とす */
  .bg { position: absolute; top: 0; right: 0; height: 100%; width: auto; display: block; }
  .stage { position: absolute; inset: 0; }`

// TOP: 中央にアイコン + ワードマーク、下にサブタイトル
function topHtml(p, bg) {
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8">${FONTS}<style>
  ${baseCss(p)}
  .stage { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 30px; }
  .mark { display: flex; align-items: center; gap: 30px; }
  .word {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-weight: 500; font-size: 116px; line-height: 1;
    letter-spacing: 0.06em; color: ${p.ink};
    margin-right: -0.06em; /* 右側トラッキング分を視覚中央に戻す */
  }
  .tagline {
    font-family: 'Noto Sans JP', sans-serif; font-weight: 500;
    font-size: 29px; letter-spacing: 0.13em; color: ${p.sub};
  }
</style></head><body>
  <img class="bg" src="${bg}" alt="">
  <div class="stage">
    <div class="mark">${logoSvg(p, 108)}<span class="word">npmg</span></div>
    <div class="tagline">Node.js Package Manager Guide</div>
  </div>
</body></html>`
}

// 章: 左上にアイコン + npmg、中央に章タイトル(上に番号のアイブロウ)
// フォントサイズは shoot() 側で実測して自動調整する(和欧混植では文字数から予測できない)
function chapterHtml(p, bg, { eyebrow, title }) {
  const size = 68 // 上限。収まらなければ縮める
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8">${FONTS}<style>
  ${baseCss(p)}
  .corner {
    position: absolute; top: 52px; left: 60px;
    display: flex; align-items: center; gap: 13px;
  }
  .corner .word {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-weight: 500; font-size: 27px; line-height: 1;
    letter-spacing: 0.06em; color: ${p.ink};
  }
  .center {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 0 120px; text-align: center;
  }
  .eyebrow {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-weight: 500; font-size: 23px; line-height: 1;
    letter-spacing: 0.24em; color: ${p.accent};
    margin-bottom: 30px; margin-right: -0.24em;
  }
  .title {
    /* latin(node_modules 等)だけモノスペースになり和文は Noto Sans のまま — ヒーロー見出しと同じ組み */
    font-family: 'JetBrains Mono', 'Noto Sans JP', sans-serif;
    font-weight: 700; font-size: ${size}px; line-height: 1.45;
    letter-spacing: 0.01em; color: ${p.ink};
  }
  /* 中央の文字を背景の線から守る細いヘアライン */
  .rule { width: 64px; height: 1px; background: ${p.rule}; margin-top: 38px; }
</style></head><body>
  <img class="bg" src="${bg}" alt="">
  <div class="stage">
    <div class="corner">${logoSvg(p, 30)}<span class="word">npmg</span></div>
    <div class="center">
      ${eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : ''}
      <div class="title">${esc(title)}</div>
      <div class="rule"></div>
    </div>
  </div>
</body></html>`
}

// docs 配下の md から H1 を読み、章番号(アイブロウ)と表題に分解する
function collectChapters() {
  const dirs = ['basics', 'history', 'pnpm', 'appendix']
  const items = [{ file: 'docs/introduction.md', slug: 'introduction' }]
  for (const d of dirs) {
    for (const f of readdirSync(`docs/${d}`).filter((f) => f.endsWith('.md')).sort()) {
      items.push({ file: `docs/${d}/${f}`, slug: `${d}-${f.replace(/\.md$/, '')}` })
    }
  }
  return items.map(({ file, slug }) => {
    const h1 = readFileSync(file, 'utf8').match(/^#\s+(.+)$/m)?.[1].trim() ?? ''
    // 「1. パッケージ…」「付録A. コマンド…」を番号と表題に割る
    const m = h1.match(/^(付録[A-Z]|\d+)\.\s*(.+)$/)
    const eyebrow = m ? (m[1].startsWith('付録') ? `APPENDIX ${m[1].slice(2)}` : `CHAPTER ${m[1]}`) : ''
    return { slug, eyebrow, title: m ? m[2] : h1 }
  })
}

// --- 実行 ---
const mode = process.argv[2] ?? '--top'
const doTop = mode === '--top' || mode === '--all'
const doChapters = mode === '--chapters' || mode === '--all'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: SCALE,
})
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

async function shoot(html, out) {
  await page.setContent(html, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  // 章タイトルは実際の描画幅を測って 2 行・規定高さに収まるまで縮める。
  // 和文と latin では 1 文字あたりの幅が大きく違うため、文字数では決められない。
  await page.evaluate(() => {
    const el = document.querySelector('.title')
    if (!el) return
    // 1 行に収まる最大サイズを探す。34px まで縮めても 1 行にならない長題は
    // 2 行を許容し、その中で最大のサイズを採る。
    const lineCount = () => {
      const lh = parseFloat(getComputedStyle(el).lineHeight)
      return Math.round(el.scrollHeight / lh)
    }
    let fitted = false
    for (let size = 68; size >= 34; size -= 2) {
      el.style.fontSize = `${size}px`
      if (lineCount() <= 1) { fitted = true; break }
    }
    if (!fitted) {
      for (let size = 60; size >= 30; size -= 2) {
        el.style.fontSize = `${size}px`
        if (lineCount() <= 2) break
      }
    }
  })
  await page.screenshot({ path: out })
  console.log(`saved: ${out}`)
}

const bgDark = await renderBackground(1)

if (doTop) {
  const bgLight = await renderBackground(0)
  await shoot(topHtml(PALETTES.dark, bgDark), 'docs/public/og.png')
  await shoot(topHtml(PALETTES.light, bgLight), 'docs/public/og-light.png')
}

if (doChapters) {
  mkdirSync('docs/public/og', { recursive: true })
  for (const ch of collectChapters()) {
    await shoot(chapterHtml(PALETTES.dark, bgDark, ch), `docs/public/og/${ch.slug}.png`)
  }
}

if (errors.length) {
  console.log('--- errors ---')
  for (const e of errors) console.log(e)
}
await browser.close()
