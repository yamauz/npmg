// 本書の md を「LLM に貼り付けられるプレーンな Markdown」に変換する純粋関数群。
// I/O を持たないのでユニットテスト可能(scripts/lib/md-transform.test.mjs)。
//
// 変換の順序には依存関係がある:
//   1. HTML コメント削除(図版の生成プロンプトを先に落とす)
//   2. TermDemo 展開
//   3. figure / プレースホルダーを畳む
//   4. ::: コンテナを開く
//   5. リンクを絶対化
// 順序を入れ替えると、たとえばコメント内のプロンプトが figure 判定に巻き込まれる。

export const SITE_URL = 'https://npmg.yamauz.workers.dev'

/**
 * TermDemo コンポーネントを素の ```sh コードブロックに開く。
 *
 * <TermDemo title="zsh — ..." :lines="[{ cmd: 'a' }, { out: 'b' }, { pause: 400 }]" />
 *   → ```sh
 *      $ a
 *      b
 *      ```
 * pause は演出用なので落とす。cmd には $ を付けて出力と区別する。
 */
export function expandTermDemo(text) {
  return text.replace(/<TermDemo\b[\s\S]*?\/>/g, (block) => {
    const lines = []
    // { cmd: '...' } / { out: '...' } を順に拾う。値はシングルクォート固定(CLAUDE.md の規約)。
    const entryRe = /\{\s*(cmd|out|pause)\s*:\s*(?:'((?:\\.|[^'\\])*)'|(\d+))\s*\}/g
    let m
    while ((m = entryRe.exec(block)) !== null) {
      const [, kind, quoted] = m
      if (kind === 'pause') continue
      const value = (quoted ?? '').replace(/\\'/g, "'").replace(/\\\\/g, '\\')
      lines.push(kind === 'cmd' ? `$ ${value}` : value)
    }
    if (lines.length === 0) return ''
    return '```sh\n' + lines.join('\n') + '\n```'
  })
}

/**
 * ::: warning つまずきポイント … ::: を見出し付きの引用に開く。
 * 入れ子(::::)があるので、長いフェンスから順に処理する。
 */
export function expandContainers(text) {
  const LABELS = { tip: 'ヒント', warning: '注意', info: '補足', danger: '警告' }
  // config.mts の container_info_open と同じマーカー。両方を直すこと
  const COLUMN_MARK = 'コラム|'
  let out = text
  for (const fence of ['::::', ':::']) {
    // 空白は [ \t]* に限定する。\s* だと改行を跨いで次行の本文まで
    // タイトルとして吸い込み、段落まるごとが太字見出しになる(実データで踏んだ)
    const open = new RegExp(`^${fence}[ \\t]*(tip|warning|info|danger)[ \\t]*(.*)$`, 'gm')
    out = out
      .replace(open, (_, kind, title) => {
        let text = title.trim()
        let label = LABELS[kind] ?? kind
        // ::: info コラム|見出し は読み物コラム。マーカーはページ側では
        // CSS のフックにしか使わないので、貼り付け用では [コラム] に開く
        if (text.startsWith(COLUMN_MARK)) {
          label = 'コラム'
          text = text.slice(COLUMN_MARK.length).trim()
        }
        const heading = text ? `[${label}] ${text}` : `[${label}]`
        return `**${heading}**\n`
      })
      // 開きを処理した後に残る閉じフェンスだけを消す
      .replace(new RegExp(`^${fence}[ \\t]*$`, 'gm'), '')
  }
  return out
}

/**
 * <figure><img …><figcaption>図 7-1 …</figcaption></figure>
 *   → 「[図 7-1 npm/yarn/pnpm/Bun の系譜図]」の 1 行に畳む。
 * 画像そのものは貼り付け先で見えないが、図があった事実は残したい。
 */
export function collapseFigures(text) {
  // class 付き(<figure class="fig-photo">)も畳む。属性なしだけを見ていると
  // 写真の figure が生の HTML のまま貼り付け先に流れる
  return text.replace(/<figure(?:\s[^>]*)?>[\s\S]*?<\/figure>/g, (block) => {
    const caption = block.match(/<figcaption>([\s\S]*?)<\/figcaption>/)?.[1] ?? ''
    const plain = caption
      .replace(/<[^>]+>/g, '') // fig-num の span を落とす
      .replace(/\s+/g, ' ')
      .trim()
    return plain ? `[${plain}]` : ''
  })
}

/** 未配置図版のプレースホルダー引用(> **🖼️ 図 10-1|…**)を畳む */
export function collapsePlaceholders(text) {
  return text.replace(
    /^> \*\*🖼️ (図 [\d-]+)\|(.+?)\*\*.*$(?:\n>.*$)*/gm,
    (_, num, title) => `[${num} ${title}(未配置)]`,
  )
}

/** ページ内リンクを絶対 URL にする([8章](/pnpm/08-…) → 完全な URL) */
export function absolutizeLinks(text) {
  return text.replace(/\]\((\/[^)\s]*)\)/g, (_, path) => `](${SITE_URL}${path})`)
}

export function toPlainMarkdown(raw) {
  let text = raw

  // frontmatter は貼り付け先で意味を持たないので落とす
  text = text.replace(/^---\n[\s\S]*?\n---\n/, '')
  // 図版の生成プロンプトなど、ページに出していないコメントを丸ごと落とす
  text = text.replace(/<!--[\s\S]*?-->/g, '')

  text = expandTermDemo(text)
  text = collapseFigures(text)
  text = collapsePlaceholders(text)
  text = expandContainers(text)
  text = absolutizeLinks(text)

  // 残った Vue コンポーネントタグ(単独行のもの)を落とす
  text = text.replace(/^\s*<\/?[A-Z][\w-]*[^>]*>\s*$/gm, '')
  // 変換で空いた 3 行以上の空行を 2 行に詰める
  text = text.replace(/\n{3,}/g, '\n\n')

  return text.trim() + '\n'
}
