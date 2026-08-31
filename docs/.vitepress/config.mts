import { defineConfig } from 'vitepress'

const SITE_URL = 'https://npmg.yamauz.workers.dev'
const SITE_TITLE = 'Node.js Package Manager Guide'

export default defineConfig({
  lang: 'ja-JP',
  title: 'Node.js Package Manager Guide',
  // Cloudflare の静的アセット配信が拡張子付き URL を拡張子なしへ 307 で飛ばすため、
  // 生成する URL 側も拡張子なしに揃える (og:url / sitemap の loc / llms.txt が
  // リダイレクト先ではなく実体を指すようにする)。
  cleanUrls: true,
  // sitemap の lastmod を git のコミット日時から引くために必要。
  lastUpdated: true,
  // scripts/llms-txt.mjs が生成する貼り付け用 md。public/ 配下だが srcDir の
  // 一部なので、除外しないと VitePress がページとして拾い sitemap に
  // 実在しない URL (/public/raw/*) が 15 件並ぶ。
  srcExclude: ['public/raw/*.md'],
  sitemap: {
    hostname: SITE_URL + '/',
  },
  description:
    'npm / yarn / pnpm、その下にある構造。Node.js パッケージマネージャーの仕組みを、構造・歴史・最新世代の実装から図解で学ぶ教科書。',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'npmg' }],
    ['meta', { property: 'og:title', content: 'npmg — Node.js Package Manager Guide' }],
    [
      'meta',
      {
        property: 'og:description',
        content:
          'npm / yarn / pnpm、その下にある構造。Node.js パッケージマネージャーの仕組みを、構造・歴史・最新世代の実装から図解で学ぶ教科書。',
      },
    ],
    ['meta', { property: 'og:url', content: 'https://npmg.yamauz.workers.dev/' }],
    ['meta', { property: 'og:image', content: 'https://npmg.yamauz.workers.dev/og.png' }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { property: 'og:image:alt', content: 'npmg — Node.js Package Manager Guide' }],
    ['meta', { property: 'og:locale', content: 'ja_JP' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'npmg — Node.js Package Manager Guide' }],
    [
      'meta',
      {
        name: 'twitter:description',
        content:
          'npm / yarn / pnpm、その下にある構造。Node.js パッケージマネージャーの仕組みを、構造・歴史・最新世代の実装から図解で学ぶ教科書。',
      },
    ],
    ['meta', { name: 'twitter:image', content: 'https://npmg.yamauz.workers.dev/og.png' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+JP:wght@400;500;700&display=swap',
      },
    ],
  ],
  themeConfig: {
    logo: { light: '/logo.svg', dark: '/logo-dark.svg' },
    siteTitle: 'npmg',
    nav: [
      { text: 'はじめに', link: '/introduction' },
      { text: '基礎', link: '/basics/01-what-is-a-package-manager' },
      { text: 'pnpm', link: '/pnpm/08-getting-started' },
      { text: '付録', link: '/appendix/a-command-cheatsheet' },
    ],
    sidebar: [
      {
        text: 'はじめに',
        items: [{ text: 'この本について', link: '/introduction' }],
      },
      {
        text: 'Part I: パッケージ管理の基礎を知る',
        items: [
          {
            text: '1. パッケージマネージャーとは何か',
            link: '/basics/01-what-is-a-package-manager',
          },
          {
            text: '2. package.json — 依存の宣言とバージョン範囲',
            link: '/basics/02-package-json-and-semver',
          },
          { text: '3. node_modules の構造', link: '/basics/03-node-modules' },
          { text: '4. ロックファイルの役割', link: '/basics/04-lockfiles' },
        ],
      },
      {
        text: 'Part II: 変遷を知る',
        items: [
          { text: '5. npm の誕生と進化', link: '/history/05-npm' },
          { text: '6. yarn の登場と分岐', link: '/history/06-yarn' },
          { text: '7. pnpm と新世代ツール', link: '/history/07-pnpm-and-next-gen' },
        ],
      },
      {
        text: 'Part III: pnpm を知る',
        items: [
          { text: '8. pnpm はじめの一歩', link: '/pnpm/08-getting-started' },
          { text: '9. pnpm の仕組み — ストアとリンク', link: '/pnpm/09-how-pnpm-works' },
          { text: '10. pnpm のアドバンテージ総覧', link: '/pnpm/10-advantages' },
          { text: '11. ワークスペースとモノレポ', link: '/pnpm/11-workspaces' },
          { text: '12. 実務で効く機能たち', link: '/pnpm/12-practical-features' },
        ],
      },
      {
        text: '付録',
        items: [
          { text: 'A. コマンド対照表', link: '/appendix/a-command-cheatsheet' },
          { text: 'B. 用語集', link: '/appendix/b-glossary' },
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/yamauz/npmg' }],
    outline: { label: 'このページの内容', level: [2, 3] },
    docFooter: { prev: '前の章', next: '次の章' },
    // 既定は英語の "Last updated:" が出るので、他のラベルに合わせて日本語にする。
    // 日付は forceLocale を立てないと閲覧者のブラウザロケールで整形され、
    // 日本語サイトでも "Aug 31, 2026" になる (lang: 'ja-JP' は効かない)。
    lastUpdated: {
      text: '最終更新',
      formatOptions: { dateStyle: 'long', forceLocale: true },
    },
    returnToTopLabel: 'トップへ戻る',
    sidebarMenuLabel: '目次',
    darkModeSwitchLabel: 'ダークモード',
    lightModeSwitchTitle: 'ライトモードに切り替え',
    darkModeSwitchTitle: 'ダークモードに切り替え',
    search: {
      provider: 'local',
      options: {
        translations: {
          // ボタンには「検索」とショートカットキーが見えている。aria-label が
          // それを含まないと可視ラベルと読み上げ名が食い違う
          // (label-content-name-mismatch)。axe は可視テキストを「検索K」と
          // 連結して見るので、空白を挟まずここに合わせる。省略すると
          // VitePress が英語の 'Search' を入れてしまうため外せない。
          button: { buttonText: '検索', buttonAriaLabel: '検索K' },
          modal: {
            displayDetails: '詳細を表示',
            resetButtonTitle: 'リセット',
            backButtonTitle: '戻る',
            noResultsText: '見つかりませんでした',
            footer: {
              selectText: '選択',
              navigateText: '移動',
              closeText: '閉じる',
            },
          },
        },
      },
    },
  },
  // 章ページの OGP をページ単位で差し替える。
  // 画像は scripts/og-image.mjs --chapters が docs/public/og/<slug>.png に生成したもの。
  transformPageData(pageData) {
    if (pageData.relativePath === 'index.md') return

    const slug = pageData.relativePath.replace(/\.md$/, '').replace(/\//g, '-')
    const title = pageData.title || pageData.frontmatter.title || SITE_TITLE
    const image = `${SITE_URL}/og/${slug}.png`
    const url = `${SITE_URL}/${pageData.relativePath.replace(/\.md$/, '')}`

    pageData.frontmatter.head ??= []
    pageData.frontmatter.head.push(
      ['meta', { property: 'og:title', content: `${title} | ${SITE_TITLE}` }],
      ['meta', { property: 'og:image', content: image }],
      ['meta', { property: 'og:image:alt', content: title }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { name: 'twitter:title', content: `${title} | ${SITE_TITLE}` }],
      ['meta', { name: 'twitter:image', content: image }],
    )
  },
  markdown: {
    config(md) {
      // ```mermaid フェンスを <Mermaid> に差し替える。
      // vitepress-plugin-mermaid が同じことをするが、あのプラグインは
      // VitePress のアプリ本体に Mermaid.vue を静的 import で注入するため、
      // 図のないページ (TOP を含む) にも mermaid の 174KB が modulepreload
      // される。描画は自前の MermaidView.vue で完結しているので、変換だけ
      // ここで持って非同期コンポーネントに繋ぐ。
      const defaultFence =
        md.renderer.rules.fence ??
        ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

      md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx]
        const lang = token.info.trim()
        if (lang !== 'mermaid' && lang !== 'mmd') {
          return defaultFence(tokens, idx, options, env, self)
        }
        const graph = encodeURIComponent(token.content)
        // Suspense で包むのは MermaidView が非同期コンポーネントのため
        return `<Suspense><template #default><Mermaid id="mermaid-${idx}" class="mermaid-figure" graph="${graph}"></Mermaid></template><template #fallback></template></Suspense>`
      }

      // H1 の直後に「Markdown をコピー」ボタンを差し込む。
      // doc-before スロットは .vp-doc の外側(H1 より上)にしか置けないため、
      // 見出しの下に出すにはレンダリング時に注入するしかない。
      const defaultRender =
        md.renderer.rules.heading_close ??
        ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

      md.renderer.rules.heading_close = (tokens, idx, options, env, self) => {
        const html = defaultRender(tokens, idx, options, env, self)
        return tokens[idx].tag === 'h1' ? `${html}\n<CopyMarkdown />` : html
      }

      // ::: info コラム|見出し を「コラム」枠にする。
      // markdown-it-container を直に足すと依存が増えるので、VitePress 標準の
      // info ブロックが吐くタイトル要素に、描画時にクラスを付けるだけにする。
      // 見た目の実体は custom.css の .custom-block-title.is-column 側。
      const COLUMN_MARK = 'コラム|'
      const defaultOpen =
        md.renderer.rules.container_info_open ??
        ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

      md.renderer.rules.container_info_open = (tokens, idx, options, env, self) => {
        const info = tokens[idx].info ?? ''
        const at = info.indexOf(COLUMN_MARK)
        if (at === -1) return defaultOpen(tokens, idx, options, env, self)
        const title = info.slice(at + COLUMN_MARK.length).trim()
        return `<div class="info custom-block"><p class="custom-block-title is-column">${md.utils.escapeHtml(
          title,
        )}</p>\n`
      }
    },
  },
  vite: {
    optimizeDeps: {
      // mermaid 11 の CJS 依存(fastdom)を dev で事前バンドルさせる
      include: [
        'mermaid',
        'fastdom',
        '@braintree/sanitize-url',
        'dayjs',
        'debug',
        'cytoscape',
        'cytoscape-cose-bilkent',
      ],
    },
    resolve: {
      // mermaid の依存を ESM 版に寄せる (プラグインがやっていた分)。
      // CJS のまま読むと dev で解決に失敗する
      alias: {
        'dayjs/plugin/advancedFormat.js': 'dayjs/esm/plugin/advancedFormat',
        'dayjs/plugin/customParseFormat.js': 'dayjs/esm/plugin/customParseFormat',
        'dayjs/plugin/isoWeek.js': 'dayjs/esm/plugin/isoWeek',
        'cytoscape/dist/cytoscape.umd.js': 'cytoscape/dist/cytoscape.esm.js',
      },
    },
  },
})
