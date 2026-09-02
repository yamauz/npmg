import { describe, it, expect } from 'vitest'
import {
  expandTermBlocks,
  expandContainers,
  collapseFigures,
  collapsePlaceholders,
  absolutizeLinks,
  toPlainMarkdown,
} from './md-transform.mjs'

describe('expandTermBlocks', () => {
  it('cmd に $ を付け、out はそのまま出す', () => {
    const input = `<TermBlocks
  title="zsh"
  :lines="[
    { cmd: 'pnpm install' },
    { out: 'Done in 2.9s' },
  ]"
/>`
    expect(expandTermBlocks(input)).toBe('```sh\n$ pnpm install\nDone in 2.9s\n```')
  })

  it('pause は演出用なので落とす', () => {
    const input = `<TermBlocks :lines="[{ cmd: 'ls' }, { pause: 400 }, { out: 'a b' }]" />`
    expect(expandTermBlocks(input)).toBe('```sh\n$ ls\na b\n```')
  })

  it('title 属性があっても中身だけを開く', () => {
    // 対応を忘れると、未知のタグとして後段で落とされ本文が raw md から消える
    const input = `<TermBlocks
  title="zsh"
  :lines="[
    { cmd: 'pnpm install' },
    { out: 'Packages: +5' },
  ]"
/>`
    expect(expandTermBlocks(input)).toBe('```sh\n$ pnpm install\nPackages: +5\n```')
  })

  it('エスケープされたシングルクォートを元に戻す', () => {
    // 実データ(9章)にある形。\' をそのまま出すと貼り付け先で壊れる
    const input = String.raw`<TermBlocks :lines="[{ out: 'Error: Cannot find module \'body-parser\'' }]" />`
    expect(expandTermBlocks(input)).toBe("```sh\nError: Cannot find module 'body-parser'\n```")
  })

  it('同一ファイル内の複数の TermBlocks をそれぞれ展開する', () => {
    const input = `<TermBlocks :lines="[{ cmd: 'a' }]" />

間の本文。

<TermBlocks :lines="[{ cmd: 'b' }]" />`
    const out = expandTermBlocks(input)
    expect(out).toContain('$ a')
    expect(out).toContain('$ b')
    expect(out).toContain('間の本文。')
    // 2 つのブロックが 1 つに融合していないこと
    expect(out.match(/```sh/g)).toHaveLength(2)
  })

  it('lines が空なら丸ごと消す', () => {
    expect(expandTermBlocks('<TermBlocks :lines="[]" />')).toBe('')
  })
})

describe('expandContainers', () => {
  it('タイトル付きコンテナを太字見出しにする', () => {
    const input = '::: warning つまずきポイント\n本文\n:::'
    expect(expandContainers(input).trim()).toBe('**[注意] つまずきポイント**\n\n本文')
  })

  it('タイトルなしならラベルだけを見出しにする', () => {
    const input = '::: warning\n本文\n:::'
    expect(expandContainers(input).trim()).toBe('**[注意]**\n\n本文')
  })

  it('入れ子(::::)を開く', () => {
    // 実データ(2章)にある形
    const input = ':::: info なぜ既定が `^` なのか\n説明\n::::'
    expect(expandContainers(input).trim()).toBe('**[補足] なぜ既定が `^` なのか**\n\n説明')
  })

  it('コラム|マーカーを [コラム] に開き、マーカーは残さない', () => {
    const input = '::: info コラム|濃度盛汁流・初代大将\n本文\n:::'
    expect(expandContainers(input).trim()).toBe('**[コラム] 濃度盛汁流・初代大将**\n\n本文')
  })

  it('コラムでない info は [補足] のままにする', () => {
    const input = '::: info コラムの書き方\n本文\n:::'
    expect(expandContainers(input).trim()).toBe('**[補足] コラムの書き方**\n\n本文')
  })

  it('4 種のラベルを日本語にする', () => {
    const out = expandContainers(
      '::: tip A\n:::\n::: warning B\n:::\n::: info C\n:::\n::: danger D\n:::',
    )
    expect(out).toContain('**[ヒント] A**')
    expect(out).toContain('**[注意] B**')
    expect(out).toContain('**[補足] C**')
    expect(out).toContain('**[警告] D**')
  })

  it('コンテナ記法を残さない', () => {
    const out = expandContainers(':::: info 外\n::: tip 内\n本文\n:::\n::::')
    expect(out).not.toMatch(/^:::/m)
  })
})

describe('collapseFigures', () => {
  it('figcaption を 1 行に畳み、span タグを落とす', () => {
    const input = `<figure>
  <img src="/images/fig-07-1.png" alt="系譜図">
  <figcaption><span class="fig-num">図 7-1</span> npm/yarn/pnpm の系譜図</figcaption>
</figure>`
    expect(collapseFigures(input)).toBe('[図 7-1 npm/yarn/pnpm の系譜図]')
  })

  it('caption がなければ丸ごと消す', () => {
    expect(collapseFigures('<figure><img src="/a.png"></figure>')).toBe('')
  })

  it('class 付きの figure も畳む', () => {
    const input =
      '<figure class="fig-photo">\n  <img src="/images/ramen-noudo.png" alt="ラーメン">\n  <figcaption>名物　依存地獄らぁめん</figcaption>\n</figure>'
    // 全角スペースも \s なので半角に正規化される(既存の挙動どおり)
    expect(collapseFigures(input)).toBe('[名物 依存地獄らぁめん]')
  })
})

describe('collapsePlaceholders', () => {
  it('未配置図版の引用ブロックを 1 行に畳む', () => {
    const input = `> **🖼️ 図 10-1|store 共有によるディスク節約**(画像プレースホルダー)
> 生成後は \`docs/public/images/fig-10-1.png\` に配置してください。`
    expect(collapsePlaceholders(input)).toBe('[図 10-1 store 共有によるディスク節約(未配置)]')
  })
})

describe('absolutizeLinks', () => {
  it('サイト内リンクを絶対 URL にする', () => {
    expect(absolutizeLinks('[8章](/pnpm/08-getting-started)')).toBe(
      '[8章](https://npmg.yamauz.workers.dev/pnpm/08-getting-started)',
    )
  })

  it('外部リンクはそのまま', () => {
    const url = '[llmstxt](https://llmstxt.org/)'
    expect(absolutizeLinks(url)).toBe(url)
  })

  it('アンカーのみのリンクは書き換えない', () => {
    expect(absolutizeLinks('[まとめ](#matome)')).toBe('[まとめ](#matome)')
  })
})

describe('toPlainMarkdown', () => {
  it('frontmatter を落とす', () => {
    const input = '---\ntitle: テスト\n---\n\n# 見出し\n\n本文'
    expect(toPlainMarkdown(input)).toBe('# 見出し\n\n本文\n')
  })

  it('図版の生成プロンプト(HTML コメント)を落とす', () => {
    // これが残ると本文よりプロンプトの方が長くなる
    const input = `# 章

<!-- 図 7-1 の生成プロンプト(採用版・ページには出しない)

STYLE PRESET (apply exactly):
Flat 2D vector infographic. Pure white background (#FFFFFF).
-->

本文`
    const out = toPlainMarkdown(input)
    expect(out).not.toContain('STYLE PRESET')
    expect(out).not.toContain('<!--')
    expect(out).toContain('本文')
  })

  it('コメント内の figure がコメント削除で先に消える(順序依存の担保)', () => {
    // HTML コメント削除を figure 処理より後ろに動かすと、この期待が壊れる
    const input = '# 章\n\n<!-- <figure><figcaption>幻の図</figcaption></figure> -->\n\n本文'
    const out = toPlainMarkdown(input)
    expect(out).not.toContain('幻の図')
  })

  it('残った Vue コンポーネントタグを落とす', () => {
    const input = '# 章\n\n<Mermaid />\n\n本文'
    expect(toPlainMarkdown(input)).toBe('# 章\n\n本文\n')
  })

  it('通常の Markdown は壊さない', () => {
    const input =
      '# 章\n\n- 箇条書き\n- `コード`\n\n```js\nconst a = 1\n```\n\n| A | B |\n| - | - |\n| 1 | 2 |'
    const out = toPlainMarkdown(input)
    expect(out).toContain('- 箇条書き')
    expect(out).toContain('const a = 1')
    expect(out).toContain('| 1 | 2 |')
  })

  it('小文字始まりの HTML タグは消さない(Vue コンポーネントのみ対象)', () => {
    const input = '# 章\n\n<br>\n\n本文'
    expect(toPlainMarkdown(input)).toContain('<br>')
  })

  it('3 行以上の空行を 2 行に詰める', () => {
    expect(toPlainMarkdown('# 章\n\n\n\n\n本文')).toBe('# 章\n\n本文\n')
  })

  it('末尾は改行 1 つで終わる', () => {
    expect(toPlainMarkdown('# 章\n\n本文\n\n\n')).toMatch(/本文\n$/)
  })

  it('実データに近い複合ケースを通しで変換する', () => {
    const input = `---
title: 9章
---

# 9. pnpm の仕組み

[8章](/pnpm/08-getting-started)の続き。

::: tip この章でわかること
- store の話
:::

<TermBlocks :lines="[{ cmd: 'pnpm i' }, { pause: 300 }, { out: 'Done' }]" />

<figure>
  <img src="/images/fig-09-1.png" alt="図">
  <figcaption><span class="fig-num">図 9-1</span> 3 層構造</figcaption>
</figure>

<!-- 図 9-1 の生成プロンプト
STYLE PRESET: flat vector, white background
-->

まとめ。`
    const out = toPlainMarkdown(input)

    expect(out).not.toContain('---\ntitle')
    expect(out).not.toContain('STYLE PRESET')
    expect(out).not.toContain('TermBlocks')
    expect(out).not.toContain('<figure')
    expect(out).not.toMatch(/^:::/m)

    expect(out).toContain('](https://npmg.yamauz.workers.dev/pnpm/08-getting-started)')
    expect(out).toContain('**[ヒント] この章でわかること**')
    expect(out).toContain('$ pnpm i')
    expect(out).toContain('[図 9-1 3 層構造]')
    expect(out).toContain('まとめ。')
  })
})
