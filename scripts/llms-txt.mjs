#!/usr/bin/env node
// 各章の md を「LLM に貼り付けられるプレーンな Markdown」に変換して
// docs/public/raw/<slug>.md に出力し、あわせて索引 docs/public/llms.txt を作る。
//
// 本書の md には TermDemo / Mermaid / ::: コンテナ / 図版プレースホルダーの
// HTML コメント(1 図あたり 30〜60 行の英語プロンプト)が混ざっている。
// これらをそのまま配ると貼り付け先でノイズになるため、ここで落とす・開く。
//
// OGP(scripts/og-image.mjs)と同じくビルドでは動かない。
// 本文を書き換えたら手で再実行する。

import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { toPlainMarkdown, SITE_URL } from './lib/md-transform.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DOCS = join(ROOT, 'docs')
const OUT_DIR = join(DOCS, 'public', 'raw')
const SITE_TITLE = 'Node.js Package Manager Guide'

/** docs/ 配下の md を再帰的に集める(index.md と .vitepress は除く) */
async function collectMarkdown(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const found = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === '.vitepress' || entry.name === 'public') continue
      found.push(...(await collectMarkdown(full)))
    } else if (entry.name.endsWith('.md')) {
      const rel = relative(DOCS, full)
      if (rel === 'index.md') continue // LP は本文がないので対象外
      found.push(rel)
    }
  }
  return found.sort()
}

const slugFor = (rel) => rel.replace(/\.md$/, '').replace(/\//g, '-')
const urlFor = (rel) => `${SITE_URL}/${rel.replace(/\.md$/, '.html')}`

async function main() {
  const files = await collectMarkdown(DOCS)

  // 前回の生成物を消してから作り直す(章をリネームしても孤児が残らないように)
  await rm(OUT_DIR, { recursive: true, force: true })
  await mkdir(OUT_DIR, { recursive: true })

  const index = []

  for (const rel of files) {
    const raw = await readFile(join(DOCS, rel), 'utf8')
    const title = raw.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? slugFor(rel)
    const body = toPlainMarkdown(raw)

    // 貼り付け先で出典がわかるようにヘッダーを足す
    const header = `> 出典: ${SITE_TITLE}(npmg) — ${urlFor(rel)}\n\n`
    const slug = slugFor(rel)
    await writeFile(join(OUT_DIR, `${slug}.md`), header + body, 'utf8')

    index.push({ slug, title, rel })
    console.log(`  ${slug}.md  (${title})`)
  }

  // llms.txt — AI クローラー向けの索引。https://llmstxt.org/ の形式に沿う
  const llms = [
    `# ${SITE_TITLE}(npmg)`,
    '',
    '> npm / yarn / pnpm を「仕組み」から解説する日本語のオンライン教科書。',
    '> 各ページの本文は下記の Markdown からそのまま取得できます。',
    '',
    '## 本文',
    '',
    ...index.map((e) => `- [${e.title}](${SITE_URL}/raw/${e.slug}.md): ${urlFor(e.rel)}`),
    '',
  ].join('\n')
  await writeFile(join(DOCS, 'public', 'llms.txt'), llms, 'utf8')

  console.log(`\n${index.length} ページ → docs/public/raw/ と docs/public/llms.txt`)
}

main()
