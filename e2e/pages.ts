// 本文ページの一覧。path は URL、slug は OGP 画像 / raw md のファイル名に使う規則
// (docs/ からの相対パスの `/` を `-` に置換)。scripts/og-image.mjs・scripts/llms-txt.mjs・
// theme/CopyMarkdown.vue が同じ規則を持つので、ここを直すときは 3 つとも合わせる。
export type Doc = {
  path: string
  slug: string
  /** ```mermaid フェンスを含むか */
  mermaid: boolean
  /** <TermBlocks> を含むか */
  termBlocks: boolean
}

export const DOCS: Doc[] = [
  { path: '/introduction', slug: 'introduction', mermaid: false, termBlocks: false },
  {
    path: '/basics/01-what-is-a-package-manager',
    slug: 'basics-01-what-is-a-package-manager',
    mermaid: true,
    termBlocks: true,
  },
  {
    path: '/basics/02-package-json-and-semver',
    slug: 'basics-02-package-json-and-semver',
    mermaid: true,
    termBlocks: true,
  },
  {
    path: '/basics/03-node-modules',
    slug: 'basics-03-node-modules',
    mermaid: true,
    termBlocks: true,
  },
  { path: '/basics/04-lockfiles', slug: 'basics-04-lockfiles', mermaid: true, termBlocks: true },
  { path: '/history/05-npm', slug: 'history-05-npm', mermaid: true, termBlocks: false },
  { path: '/history/06-yarn', slug: 'history-06-yarn', mermaid: true, termBlocks: false },
  {
    path: '/history/07-pnpm-and-next-gen',
    slug: 'history-07-pnpm-and-next-gen',
    mermaid: true,
    termBlocks: false,
  },
  {
    path: '/pnpm/08-getting-started',
    slug: 'pnpm-08-getting-started',
    mermaid: true,
    termBlocks: true,
  },
  {
    path: '/pnpm/09-how-pnpm-works',
    slug: 'pnpm-09-how-pnpm-works',
    mermaid: true,
    termBlocks: true,
  },
  { path: '/pnpm/10-advantages', slug: 'pnpm-10-advantages', mermaid: true, termBlocks: false },
  { path: '/pnpm/11-workspaces', slug: 'pnpm-11-workspaces', mermaid: true, termBlocks: false },
  {
    path: '/pnpm/12-practical-features',
    slug: 'pnpm-12-practical-features',
    mermaid: true,
    termBlocks: true,
  },
  {
    path: '/appendix/a-command-cheatsheet',
    slug: 'appendix-a-command-cheatsheet',
    mermaid: false,
    termBlocks: false,
  },
  { path: '/appendix/b-glossary', slug: 'appendix-b-glossary', mermaid: false, termBlocks: false },
]

/** LP を含む全ルート */
export const ALL_PATHS = ['/', ...DOCS.map((d) => d.path)]
