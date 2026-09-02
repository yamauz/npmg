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

// TermBlocks は静的表示(再生機能なし)。最初から全行が出ていることを見る。
// pages.ts の termBlocks フラグが実態とずれると「あるはずのテストが動かない」
// 静かな失敗になるので、有無そのものも突き合わせる。
for (const doc of DOCS) {
  test(`TermBlocks の有無が pages.ts と一致する: ${doc.path}`, async ({ page }) => {
    await page.goto(doc.path)

    const terms = page.locator('.tb')
    const count = await terms.count()
    expect(
      count > 0,
      `pages.ts の termBlocks=${doc.termBlocks} と実際(${count} 個)が食い違っている`,
    ).toBe(doc.termBlocks)

    if (!doc.termBlocks) return

    const term = terms.first()
    await term.scrollIntoViewIfNeeded()
    await expect(term).toBeVisible()

    // アニメーションを待たずに中身が揃っていること
    await expect(term.locator('.tb__text').first()).not.toBeEmpty()
    expect(await term.locator('.tb__group').count()).toBeGreaterThan(0)
  })
}

// TermBlocks のコピーは「コマンド 1 行」と「直後のログの塊」が単位。
// クリップボードは目視で気づけないので、実際に読み戻して中身を確かめる。
test('TermBlocks: コマンドの塊は $ を除いた 1 行をコピーする', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/basics/02-package-json-and-semver')

  const group = page.locator('.tb__group--cmd').first()
  await group.scrollIntoViewIfNeeded()

  const expected = await group.locator('.tb__text').first().innerText()
  await group.locator('.tb__copy').click()

  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).toBe(expected)
  expect(copied, 'プロンプトが混ざっている').not.toContain('$')
})

test('TermBlocks: ログの塊は全文をまとめてコピーする', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/basics/02-package-json-and-semver')

  const group = page.locator('.tb__group--out').first()
  await group.scrollIntoViewIfNeeded()

  // 画面に見えている行がすべて入ること(空行も保つ)
  const shown = await group.locator('.tb__line').allInnerTexts()
  await group.locator('.tb__copy').click()

  const copied = await page.evaluate(() => navigator.clipboard.readText())
  const lines = copied.split('\n')
  expect(lines.length, 'ログの行数が合わない').toBe(shown.length)
  for (const line of shown) {
    if (line.trim()) expect(copied).toContain(line)
  }
})

test('TermBlocks: ログのどの行にホバーしても塊ごと反転する', async ({ page }) => {
  await page.goto('/basics/02-package-json-and-semver')

  const group = page.locator('.tb__group--out').first()
  await group.scrollIntoViewIfNeeded()

  const plain = await group.evaluate((el) => getComputedStyle(el).backgroundColor)

  // 先頭ではなく途中の行に乗せる(塊が単位であることの確認)
  await group.locator('.tb__line').nth(2).hover()
  const hovered = await group.evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(hovered, 'ホバーで地が変わっていない').not.toBe(plain)

  // ボタンは塊に 1 つだけ
  expect(await group.locator('.tb__copy').count()).toBe(1)
})

test('TermBlocks: コピーボタンが先頭行の中央に載る', async ({ page }) => {
  await page.goto('/basics/02-package-json-and-semver')

  const drift = await page.evaluate(() =>
    [...document.querySelectorAll('.tb__group')].map((g) => {
      const btn = g.querySelector('.tb__copy').getBoundingClientRect()
      const line = g.querySelector('.tb__line').getBoundingClientRect()
      return Math.abs(btn.top + btn.height / 2 - (line.top + line.height / 2))
    }),
  )
  // 1px 以内なら中央とみなす(小数の丸め差を許容)
  for (const d of drift) expect(d, 'ボタンが先頭行の中央からずれている').toBeLessThanOrEqual(1)
})

// 本文のコードブロックはすべてターミナル枠に入る(config.mts の fence 差し替え)。
// シェルのブロックだけがコマンド行の 1 行コピーを持つ。
for (const doc of DOCS) {
  test(`コードブロックがターミナル枠に入る: ${doc.path}`, async ({ page }) => {
    await page.goto(doc.path)

    const blocks = page.locator('.vp-doc div[class*="language-"]')
    const total = await blocks.count()
    if (total === 0) return

    // 枠の外に裸のコードブロックが残っていないこと
    const framed = await page.locator('.term-frame div[class*="language-"]').count()
    expect(framed, `${doc.path} に枠に入っていないコードブロックがある`).toBe(total)

    // すべての行が塊に入り、塊は必ずコピーボタンを持つ。
    // 「塊に入っていない行」はホバーもコピーもできないまま残るが、
    // 見た目は変わらないので目視では気づけない(実際に踏んだ)。
    const stray = await page.evaluate(
      () =>
        [...document.querySelectorAll('.term-frame .line')].filter(
          (l) => !l.closest('.term-frame__group'),
        ).length,
    )
    expect(stray, `${doc.path} に塊へ入っていない行がある`).toBe(0)

    const groups = await page.locator('.term-frame__group').count()
    expect(await page.locator('.term-frame__copy-btn').count()).toBe(groups)
  })
}

test('TermFrame: コマンドの塊は $ を除いた 1 行をコピーする', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/basics/01-what-is-a-package-manager')

  // 連続するコマンドは 1 行ずつ独立した塊になる
  const frame = page.locator('.term-frame').filter({ hasText: 'mkdir -p ~/pm-sandbox' }).first()
  await frame.scrollIntoViewIfNeeded()
  expect(await frame.locator('.term-frame__group--cmd').count()).toBe(3)

  // ボタンはオーバーレイ層にあるので、塊と同じ並び順で枠から引く
  await frame.locator('.term-frame__copy-btn').first().click()

  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).toBe('mkdir -p ~/pm-sandbox/hello-pm')
  expect(copied, 'プロンプトが混ざっている').not.toContain('$')
})

test('TermFrame: ログの塊は全文をまとめてコピーする', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/basics/01-what-is-a-package-manager')

  // コマンドと出力が 1 台のターミナルに連結されている箇所
  const frame = page.locator('.term-frame').filter({ hasText: 'npm warn deprecated' }).first()
  await frame.scrollIntoViewIfNeeded()

  // コマンドの塊とログの塊に分かれること
  expect(await frame.locator('.term-frame__group').count()).toBe(2)

  // 塊は [コマンド, ログ] の順。ボタンも同じ順でオーバーレイに並ぶ
  await frame.locator('.term-frame__copy-btn').nth(1).click()

  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).toContain('npm warn deprecated')
  expect(copied, 'ログの末尾まで入っていない').toContain('found 0 vulnerabilities')
  expect(copied, 'コマンドが混ざっている').not.toContain('npm install left-pad')
})

test('TermFrame: 言語つきの出力もコマンドと同じ枠に入る', async ({ page }) => {
  await page.goto('/basics/01-what-is-a-package-manager')

  // `cat package.json` の出力は ```json で書かれている。言語なしのフェンス
  // だけを出力とみなしていると、同じ 1 回の実行が 2 台の枠に割れる。
  const frame = page.locator('.term-frame').filter({ hasText: 'cat package.json' }).first()
  await frame.scrollIntoViewIfNeeded()
  expect(await frame.getByText('"name": "hello-pm"').count(), 'json が別の枠に出ている').toBe(1)
  expect(await frame.locator('.term-frame__group').count()).toBe(2)
})

test('TermFrame: 散文をはさんだブロックは連結しない', async ({ page }) => {
  await page.goto('/pnpm/11-workspaces')

  // 説明文をはさんで置かれた json は、直前のコマンドの出力ではない。
  // token.map の隣接判定を外すと、これらが 1 枠に吸い込まれる。
  const shapes = await page.evaluate(() =>
    [...document.querySelectorAll('.term-frame')]
      .filter((f) => f.textContent.includes('"@lab/'))
      .map((f) => f.querySelectorAll('div[class*="language-"]').length),
  )
  // ui と app の 2 つが、それぞれ独立した枠として出ること
  expect(shapes.length, '枠の数が変わっている').toBe(2)
  for (const n of shapes) expect(n, '無関係な json が連結されている').toBe(1)
})

test('TermFrame: 非シェルのブロックは全体で 1 つの塊になる', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/pnpm/11-workspaces')

  const frame = page.locator('.term-frame').filter({ hasText: '@lab/ui' }).first()
  await frame.scrollIntoViewIfNeeded()
  expect(await frame.locator('.term-frame__group').count()).toBe(1)

  await frame.locator('.term-frame__copy-btn').first().click()
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).toContain('"name": "@lab/ui"')
  // 複数行が 1 行に潰れていないこと
  expect(copied.split('\n').length).toBeGreaterThan(1)
})

test('TermFrame: 塊の幅とコピーボタンの位置が枠内で揃う', async ({ page }) => {
  await page.goto('/basics/01-what-is-a-package-manager')

  // 連結された枠は code が 2 つになりがちで、そのままだと兄弟同士が
  // 別々に幅を決めて長いコマンドの側だけ伸びる。すると塊の右端と
  // コピーボタンの位置が食い違い、カーソルを移すとボタンが飛ぶ。
  const bad = await page.evaluate(
    () =>
      [...document.querySelectorAll('.term-frame')].filter((f) => {
        const gs = [...f.querySelectorAll('.term-frame__group')]
        if (gs.length < 2) return false
        const widths = new Set(gs.map((g) => Math.round(g.getBoundingClientRect().width)))
        // ボタンはオーバーレイ層にあるので枠から引く
        const rights = new Set(
          [...f.querySelectorAll('.term-frame__copy-btn')].map((b) =>
            Math.round(b.getBoundingClientRect().right),
          ),
        )
        return widths.size > 1 || rights.size > 1
      }).length,
  )
  expect(bad, '塊の幅かボタン位置が枠内で不揃い').toBe(0)
})

test('TermFrame: 横スクロールは枠に 1 つだけ', async ({ page }) => {
  await page.setViewportSize({ width: 700, height: 900 })
  await page.goto('/basics/01-what-is-a-package-manager')

  // 行や pre が個別にスクロールすると、長いコマンドの行だけに
  // スクロールバーが出て行が分断される。
  const inner = await page.evaluate(
    () =>
      [...document.querySelectorAll('.term-frame')].flatMap((f) =>
        [...f.querySelectorAll('*')].filter(
          (e) => e.scrollWidth > e.clientWidth + 1 && !e.classList.contains('term-frame__screen'),
        ),
      ).length,
  )
  expect(inner, '枠の内側に別のスクロール領域がある').toBe(0)
})

test('TermFrame: 複数行の塊で行が横並びに潰れない', async ({ page }) => {
  await page.goto('/basics/01-what-is-a-package-manager')

  // 塊を flex にしたとき、行を直接ぶら下げると 1 行ずつが flex item になり
  // 横に並ぶ(実際に踏んだ)。行は内側の .term-frame__lines にまとめている。
  const collapsed = await page.evaluate(
    () =>
      [...document.querySelectorAll('.term-frame__group')].filter((g) => {
        const ls = [...g.querySelectorAll('.line')]
        return (
          ls.length > 1 && ls[0].getBoundingClientRect().top === ls[1].getBoundingClientRect().top
        )
      }).length,
  )
  expect(collapsed, '行が横並びに潰れている塊がある').toBe(0)
})

test('TermFrame: コピーボタンが先頭行の中央に載る', async ({ page }) => {
  await page.goto('/basics/01-what-is-a-package-manager')

  // ボタンはオーバーレイ層にあるので、枠ごとに塊と index で対応させる
  const drift = await page.evaluate(() =>
    [...document.querySelectorAll('.term-frame')].flatMap((f) => {
      const gs = [...f.querySelectorAll('.term-frame__group')]
      const bs = [...f.querySelectorAll('.term-frame__copy-btn')]
      return gs.map((g, i) => {
        const btn = bs[i].getBoundingClientRect()
        const line = g.querySelector('.line').getBoundingClientRect()
        return Math.abs(btn.top + btn.height / 2 - (line.top + line.height / 2))
      })
    }),
  )
  for (const d of drift) expect(d, 'ボタンが先頭行の中央からずれている').toBeLessThanOrEqual(1)
})

// モバイルで長いコマンドやログが折り返されると読み筋が壊れる。横スクロールさせる。
test('狭い画面でコードブロックが折り返さず横スクロールする', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/pnpm/09-how-pnpm-works')

  // 折り返しの制御は行 (.line) 側が持つ。code は Shiki が挟む生の改行を
  // 畳むために white-space: normal なので、そちらを見ると誤検出する。
  const wraps = await page.evaluate(
    () =>
      [...document.querySelectorAll('.term-frame pre .line')].filter(
        (line) => getComputedStyle(line).whiteSpace !== 'pre',
      ).length,
  )
  expect(wraps, '折り返し設定の行がある').toBe(0)

  // 行間が倍になっていないこと (.line を block にすると Shiki の改行と
  // 二重になり、1 行おきに空行が入る)。行送りは line-height と一致するはず。
  const doubled = await page.evaluate(() => {
    const frame = document.querySelector('.term-frame pre')
    const lines = [...frame.querySelectorAll('.line')]
    if (lines.length < 2) return 0
    const lh = parseFloat(getComputedStyle(lines[0]).lineHeight)
    const gap = lines[1].getBoundingClientRect().top - lines[0].getBoundingClientRect().top
    return gap > lh * 1.5 ? gap : 0
  })
  expect(doubled, '行間が倍になっている').toBe(0)

  // 実際に溢れている枠があり、かつページ自体は横に溢れていないこと。
  // スクロールは枠 (.term-frame__screen) に 1 つだけ持たせている。
  const overflowing = await page.evaluate(
    () =>
      [...document.querySelectorAll('.term-frame__screen')].filter(
        (el) => el.scrollWidth > el.clientWidth,
      ).length,
  )
  expect(overflowing).toBeGreaterThan(0)

  const bodyOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(bodyOverflow, 'ページが横に溢れている').toBeLessThanOrEqual(0)
})

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
