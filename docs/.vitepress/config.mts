import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
  lang: 'ja-JP',
  title: 'node_modulesの深層',
  description:
    'npm / yarn / pnpm、その下にある構造。パッケージマネージャーの仕組みと歴史、pnpm の内部構造までを図解で学ぶ教科書。',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Noto+Sans+JP:wght@400;500;700&family=Shippori+Mincho+B1:wght@600;700&display=swap',
      },
    ],
  ],
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'node_modulesの深層',
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
          { text: '1. パッケージマネージャーとは何か', link: '/basics/01-what-is-a-package-manager' },
          { text: '2. package.json とバージョン範囲', link: '/basics/02-package-json-and-semver' },
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
          { text: 'C. 図版を ChatGPT で生成する', link: '/appendix/c-image-generation' },
        ],
      },
    ],
    outline: { label: 'このページの内容', level: [2, 3] },
    docFooter: { prev: '前の章', next: '次の章' },
    returnToTopLabel: 'トップへ戻る',
    sidebarMenuLabel: '目次',
    darkModeSwitchLabel: 'ダークモード',
    lightModeSwitchTitle: 'ライトモードに切り替え',
    darkModeSwitchTitle: 'ダークモードに切り替え',
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '検索', buttonAriaLabel: '検索' },
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
  vite: {
    optimizeDeps: {
      // mermaid 11 の CJS 依存(fastdom)を dev で事前バンドルさせる
      include: ['mermaid', 'fastdom'],
    },
  },
  // Mermaid の描画設定は theme/MermaidView.vue に一元化している
  // (プラグイン標準コンポーネントはダークモードで theme:'dark' を強制するため上書き)
  mermaidPlugin: {
    class: 'mermaid-figure',
  },
}))
