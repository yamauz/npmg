<script setup>
// トップページ v2: 白ベース × 墨 × ブルーアクセントの「静かな玄関」。
// ユーザー承認済みのモックアップ(research/lp-redesign-prompt-v4.md の成果物)を実装。
// 現段階ではトップページのみ。章ページへの展開はこの方向の確定後。
import { withBase } from 'vitepress'
import HeroNetwork from './HeroNetwork.vue'

// 固定ナビの高さぶんオフセットして目次へスクロールする
// (素のアンカーだとヒーローの下端が覗いてしまう)
function scrollToToc(e) {
  e.preventDefault()
  const el = document.getElementById('toc')
  if (!el) return
  const nav = document.querySelector('.VPNav')
  const offset = nav ? nav.offsetHeight : 64
  const top = el.getBoundingClientRect().top + window.scrollY - offset
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' })
}

const chapters = [
  {
    num: '01',
    title: 'パッケージマネージャーとは何か',
    link: '/basics/01-what-is-a-package-manager',
  },
  { num: '02', title: 'package.json とバージョン範囲', link: '/basics/02-package-json-and-semver' },
  { num: '03', title: 'node_modules の構造', link: '/basics/03-node-modules' },
  { num: '04', title: 'ロックファイルの役割', link: '/basics/04-lockfiles' },
  { num: '05', title: 'npm の誕生と進化', link: '/history/05-npm' },
  { num: '06', title: 'yarn の登場と分岐', link: '/history/06-yarn' },
  { num: '07', title: 'pnpm と新世代ツール', link: '/history/07-pnpm-and-next-gen' },
  { num: '08', title: 'pnpm はじめの一歩', link: '/pnpm/08-getting-started' },
  { num: '09', title: 'pnpm の仕組み — ストアとリンク', link: '/pnpm/09-how-pnpm-works' },
  { num: '10', title: 'pnpm のアドバンテージ総覧', link: '/pnpm/10-advantages' },
  { num: '11', title: 'ワークスペースとモノレポ', link: '/pnpm/11-workspaces' },
  { num: '12', title: '実務で効く機能たち', link: '/pnpm/12-practical-features' },
]

const appendices = [
  { num: 'A', title: 'コマンド対照表', link: '/appendix/a-command-cheatsheet' },
  { num: 'B', title: '用語集', link: '/appendix/b-glossary' },
]
</script>

<template>
  <div class="home">
    <!-- ヒーロー(背面に依存グラフ星座) -->
    <section class="hero">
      <HeroNetwork />
      <div class="hero__inner">
        <div class="hero__copy">
          <h1 class="hero__title">node_modulesの深層を、<br />正確にたどる。</h1>
          <p class="hero__lead">Node.js パッケージマネージャーの仕組みを、根本から理解する。</p>
          <div class="hero__actions">
            <a class="btn btn--primary" :href="withBase('/introduction')">読む</a>
            <button type="button" class="btn btn--ghost" @click="scrollToToc">目次を見る</button>
          </div>
        </div>
      </div>
    </section>

    <!-- 本書の構成 -->
    <section id="toc" class="toc">
      <div class="toc__inner">
        <h2 class="toc__heading">本書の構成</h2>
        <ol class="toc__grid">
          <li v-for="ch in chapters" :key="ch.num" class="toc__row">
            <a class="toc__link" :href="withBase(ch.link)">
              <span class="toc__num">{{ ch.num }}</span>
              <span class="toc__title">{{ ch.title }}</span>
            </a>
          </li>
        </ol>
        <ul class="toc__appendix">
          <li v-for="ap in appendices" :key="ap.num">
            <a class="toc__link" :href="withBase(ap.link)">
              <span class="toc__num">付{{ ap.num }}</span>
              <span class="toc__title">{{ ap.title }}</span>
            </a>
          </li>
        </ul>
      </div>
    </section>

    <footer class="foot">
      <div class="foot__inner">
        <span class="foot__mark">npmg — Node.js Package Manager Guide</span>
        <nav class="foot__links">
          <a href="https://github.com/yamauz/npmg" target="_blank" rel="noopener">GitHub ↗</a>
        </nav>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.home {
  /* v2 ローカルトークン(この方向で確定したら design.md / tokens.css に昇格する) */
  /* グローバルトークン(tokens.css)への参照。ダークは自動追従する */
  --v2-bg: var(--color-paper);
  --v2-ink: var(--color-ink);
  --v2-ink-2: var(--color-ink-2);
  --v2-ink-3: var(--color-ink-3);
  --v2-rule: var(--color-rule);
  --v2-hover: var(--color-paper-2);
  --v2-accent: var(--color-accent);
  --v2-accent-strong: var(--color-accent-strong);
  --v2-accent-ink: var(--color-accent-ink);
  --container: 1080px;

  font-family: var(--font-body);
  color: var(--v2-ink);
  background: var(--v2-bg);
  overflow-x: clip;
}

/* ボタン(a / button 両対応) */
.btn {
  display: inline-block;
  cursor: pointer;
  font-family: inherit;
  padding: 13px 30px;
  border-radius: 3px;
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
  transition:
    background-color var(--dur-base) var(--ease-out),
    color var(--dur-base) var(--ease-out),
    border-color var(--dur-base) var(--ease-out);
}

.btn--primary {
  background: var(--v2-accent);
  color: var(--v2-accent-ink);
  border: 1px solid var(--v2-accent);
}

.btn--primary:hover {
  background: var(--v2-accent-strong);
  border-color: var(--v2-accent-strong);
}

.btn--ghost {
  border: 1px solid var(--v2-ink-3);
  color: var(--v2-ink);
  background: transparent;
}

.btn--ghost:hover {
  border-color: var(--v2-ink);
}

/* --- ヒーロー --- */
.hero {
  position: relative;
  border-bottom: 1px solid var(--v2-rule);
}

.hero__inner {
  position: relative;
  z-index: 1;
  max-width: var(--container);
  margin: 0 auto;
  padding: clamp(72px, 11vw, 150px) 24px clamp(72px, 10vw, 140px);
}

.hero__copy {
  max-width: 640px;
}

.hero__title {
  /* latin(node_modules)だけ自然にモノスペースになり、和文は Noto Sans のまま */
  font-family: 'JetBrains Mono', var(--font-body);
  font-size: clamp(28px, 3.6vw, 46px);
  font-weight: 700;
  line-height: 1.55;
  letter-spacing: 0.01em;
  margin: 0 0 var(--space-md);
}

.hero__lead {
  font-size: 15.5px;
  line-height: 2;
  color: var(--v2-ink-2);
  letter-spacing: 0.04em;
  margin: 0 0 var(--space-xl);
}

.hero__actions {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

@media (prefers-reduced-motion: no-preference) {
  .hero__copy > * {
    animation: v2-rise 0.7s var(--ease-out) both;
  }

  .hero__lead {
    animation-delay: 0.07s;
  }

  .hero__actions {
    animation-delay: 0.14s;
  }

  @keyframes v2-rise {
    from {
      opacity: 0;
      transform: translateY(10px);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }
}

/* --- 本書の構成 --- */
.toc__inner {
  max-width: var(--container);
  margin: 0 auto;
  padding: clamp(48px, 7vw, 88px) 24px;
}

.toc__heading {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.06em;
  margin: 0 0 var(--space-lg);
}

.toc__grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: clamp(32px, 6vw, 80px);
  grid-auto-flow: column;
  grid-template-rows: repeat(6, auto);
}

.toc__appendix {
  list-style: none;
  margin: var(--space-md) 0 0;
  padding: var(--space-2xs) 0 0;
}

.toc__link {
  display: flex;
  align-items: baseline;
  gap: 18px;
  padding: 15px 4px;
  border-bottom: 1px solid var(--v2-rule);
  text-decoration: none;
  color: inherit;
  transition: background-color var(--dur-base) var(--ease-out);
}

.toc__link:hover {
  background: var(--v2-hover);
}

.toc__link:hover .toc__title {
  color: var(--v2-accent);
}

.toc__num {
  font-family: var(--font-mono-tokens);
  font-size: 12.5px;
  color: var(--v2-accent);
  min-width: 26px;
}

.toc__title {
  font-size: 14.5px;
  transition: color var(--dur-base) var(--ease-out);
}

/* --- フッター --- */
.foot {
  border-top: 1px solid var(--v2-rule);
}

.foot__inner {
  max-width: var(--container);
  margin: 0 auto;
  padding: 28px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.foot__mark {
  font-size: 13px;
  font-weight: 700;
}

.foot__links {
  display: flex;
  gap: 24px;
}

.foot__links a {
  font-size: 12.5px;
  color: var(--v2-ink-2);
  text-decoration: none;
}

.foot__links a:hover {
  color: var(--v2-accent);
}

/* --- レスポンシブ --- */
@media (max-width: 860px) {
  .toc__grid {
    grid-template-columns: 1fr;
    grid-auto-flow: row;
    grid-template-rows: none;
  }
}
</style>
