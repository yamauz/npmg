<script setup>
import { withBase } from 'vitepress'
import LayerStack from './LayerStack.vue'

const parts = [
  {
    num: 'I',
    title: '基礎を知る',
    range: '1〜4章',
    desc: 'パッケージマネージャーの仕事、package.json、node_modules、ロックファイル。',
    link: '/basics/01-what-is-a-package-manager',
  },
  {
    num: 'II',
    title: '変遷を知る',
    range: '5〜7章',
    desc: 'npm の誕生、yarn の登場と分岐、pnpm と新世代。歴史でたどる選び方。',
    link: '/history/05-npm',
  },
  {
    num: 'III',
    title: 'pnpm を知る',
    range: '8〜12章',
    desc: 'ストアとリンクの仕組み、アドバンテージ総覧、ワークスペース、実務機能。',
    link: '/pnpm/08-getting-started',
  },
  {
    num: '付',
    title: '付録',
    range: 'A〜C',
    desc: 'コマンド対照表、用語集、図版を ChatGPT で生成するガイド。',
    link: '/appendix/a-command-cheatsheet',
  },
]
</script>

<template>
  <div class="home">
    <!-- ヒーロー -->
    <section class="hero">
      <div class="hero__inner">
        <div class="hero__copy">
          <h1 class="hero__title">そのディレクトリ、<br />見えているのは表層だけ。</h1>
          <p class="hero__lead">
            npm / yarn / pnpm の違いは「使い心地」だけではありません。<br class="wide-only" />
            node_modules の奥にある本質を、図解でとことんわかりやすく。
          </p>
          <div class="hero__actions">
            <a class="btn btn--primary" :href="withBase('/basics/01-what-is-a-package-manager')">まずは仕組みから理解する</a>
            <a class="btn btn--ghost" href="#compare">3 分でわかる構造比較</a>
          </div>
        </div>
        <div class="hero__visual">
          <LayerStack />
        </div>
      </div>
    </section>

    <!-- 番号付きヘアライン 3 項目 -->
    <section class="strip">
      <ol class="strip__list">
        <li class="strip__item">
          <span class="strip__num">01</span>
          <h2 class="strip__head">図解で本質を理解</h2>
          <p class="strip__desc">hoisting も phantom dependency も、図で描ければ人に説明できる。</p>
        </li>
        <li class="strip__item">
          <span class="strip__num">02</span>
          <h2 class="strip__head">変遷から選び方まで</h2>
          <p class="strip__desc">ツールが生まれた理由を歴史でたどると、選ぶ基準が見えてくる。</p>
        </li>
        <li class="strip__item">
          <span class="strip__num">03</span>
          <h2 class="strip__head">現場で役立つ知識</h2>
          <p class="strip__desc">phantom dependency もビルドスクリプトの罠も、正体がわかれば怖くない。</p>
        </li>
      </ol>
    </section>

    <!-- 構造比較(反転セクション) -->
    <section id="compare" class="compare">
      <div class="compare__inner">
        <header class="compare__header">
          <p class="compare__eyebrow">COMPARE</p>
          <h2 class="compare__title">node_modules は思想を映す</h2>
          <p class="compare__lead">
            同じ package.json でも、ディレクトリを覗けば三者三様。<br class="wide-only" />
            この構造の違いが、速度・厳格さ・ディスク効率の違いになります。
          </p>
        </header>
        <div class="compare__grid">
          <figure class="tree">
            <figcaption class="tree__name">npm</figcaption>
            <pre class="tree__pre">node_modules
├─ .bin
├─ express
├─ body-parser
├─ mime-types
└─ …すべてが平らに並ぶ</pre>
          </figure>
          <figure class="tree">
            <figcaption class="tree__name">yarn v1</figcaption>
            <pre class="tree__pre">node_modules
├─ .bin
├─ express
├─ body-parser
├─ mime-types
└─ …同じくフラット構造</pre>
          </figure>
          <figure class="tree">
            <figcaption class="tree__name">pnpm</figcaption>
            <pre class="tree__pre">node_modules
├─ .pnpm
│  └─ express@5.2.1
│     └─ …実体はここに
└─ express ⇒ symlink</pre>
          </figure>
        </div>
        <p class="compare__note">
          フラット構造が生む「幻の依存」は<a :href="withBase('/basics/03-node-modules')">3章</a>、
          pnpm のリンク構造は<a :href="withBase('/pnpm/09-how-pnpm-works')">9章</a>で解剖します。
        </p>
      </div>
    </section>

    <!-- 構成 -->
    <section class="toc">
      <div class="toc__inner">
        <h2 class="toc__title">全 12 章+付録</h2>
        <ol class="toc__list">
          <li v-for="part in parts" :key="part.num" class="toc__row">
            <a class="toc__link" :href="withBase(part.link)">
              <span class="toc__num">{{ part.num }}</span>
              <span class="toc__body">
                <span class="toc__head">{{ part.title }}</span>
                <span class="toc__desc">{{ part.desc }}</span>
              </span>
              <span class="toc__range">{{ part.range }}</span>
              <span class="toc__arrow" aria-hidden="true">→</span>
            </a>
          </li>
        </ol>
      </div>
    </section>

    <!-- 締めの CTA -->
    <section class="outro">
      <p class="outro__line">毎日打っている <code>install</code> の下へ、一段ずつ。</p>
      <a class="btn btn--primary" :href="withBase('/introduction')">「この本について」から読む</a>
    </section>
  </div>
</template>

<style scoped>
.home {
  --container: 1120px;
  font-family: var(--font-body);
  color: var(--color-ink);
  background: var(--color-paper);
  overflow-x: clip;
}

@media (min-width: 861px) {
  .hero__title {
    white-space: nowrap;
  }
}

.wide-only {
  display: none;
}

@media (min-width: 720px) {
  .wide-only {
    display: inline;
  }
}

/* ボタン(design.md の CTA voice) */
.btn {
  display: inline-block;
  padding: 14px 28px;
  border-radius: var(--radius-card);
  font-size: 15px;
  font-weight: 500;
  line-height: 1;
  text-decoration: none;
  transition: background-color var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out),
    border-color var(--dur-base) var(--ease-out);
}

.btn--primary {
  background: var(--color-accent);
  color: var(--color-accent-ink);
  border: 1px solid var(--color-accent);
}

.btn--primary:hover {
  background: var(--color-accent-strong);
  border-color: var(--color-accent-strong);
}

.btn--ghost {
  border: 1px solid var(--color-ink-2);
  color: var(--color-ink);
  background: transparent;
}

.btn--ghost:hover {
  border-color: var(--color-ink);
}

/* --- ヒーロー --- */
.hero {
  border-bottom: 1px solid var(--color-rule);
}

.hero__inner {
  max-width: var(--container);
  margin: 0 auto;
  padding: clamp(48px, 8vw, 96px) 24px clamp(40px, 6vw, 72px);
  display: grid;
  grid-template-columns: minmax(0, 6fr) minmax(0, 5fr);
  gap: clamp(24px, 4vw, 64px);
  align-items: center;
}

.hero__title {
  font-family: var(--font-display);
  font-weight: 600;
  font-style: normal;
  font-size: clamp(30px, 3.4vw, 46px);
  line-height: 1.6;
  letter-spacing: 0.02em;
  color: var(--color-ink);
  margin: 0 0 var(--space-lg);
}

.hero__lead {
  font-size: 16px;
  line-height: 2.1;
  color: var(--color-ink-2);
  margin: 0 0 var(--space-xl);
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.hero__visual {
  display: flex;
  justify-content: center;
}

@media (prefers-reduced-motion: no-preference) {
  .hero__copy > * {
    animation: rise 0.7s var(--ease-out) both;
  }

  .hero__lead {
    animation-delay: 0.08s;
  }

  .hero__actions {
    animation-delay: 0.16s;
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(12px);
    }

    to {
      opacity: 1;
      transform: none;
    }
  }
}

/* --- 番号ストリップ --- */
.strip {
  background: var(--color-paper-2);
  border-bottom: 1px solid var(--color-rule);
}

.strip__list {
  max-width: var(--container);
  margin: 0 auto;
  padding: clamp(32px, 4vw, 48px) 24px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  list-style: none;
}

.strip__item {
  padding: 0 clamp(16px, 3vw, 40px);
}

.strip__item + .strip__item {
  border-left: 1px solid var(--color-rule);
}

.strip__num {
  font-family: var(--font-mono-tokens);
  font-size: 12px;
  letter-spacing: 0.14em;
  color: var(--color-ink-3);
}

.strip__num::after {
  content: ' —';
}

.strip__head {
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 700;
  margin: var(--space-2xs) 0 var(--space-2xs);
  border: none;
  padding: 0;
}

.strip__desc {
  font-size: 13.5px;
  line-height: 1.9;
  color: var(--color-ink-2);
  margin: 0;
}

/* --- 構造比較(反転) --- */
.compare {
  background: var(--color-accent);
  color: var(--color-accent-ink);
}

.dark .compare {
  background: oklch(20% 0.03 168);
  color: var(--color-ink);
}

.compare__inner {
  max-width: var(--container);
  margin: 0 auto;
  padding: clamp(56px, 7vw, 96px) 24px;
}

.compare__eyebrow {
  font-family: var(--font-mono-tokens);
  font-size: 12px;
  letter-spacing: 0.2em;
  opacity: 0.66;
  margin: 0 0 var(--space-sm);
}

.compare__title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(26px, 3.2vw, 38px);
  letter-spacing: 0.03em;
  margin: 0 0 var(--space-sm);
}

.compare__lead {
  font-size: 15px;
  line-height: 2.05;
  opacity: 0.85;
  margin: 0 0 var(--space-xl);
}

.compare__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-md);
}

.tree {
  margin: 0;
  border: 1px solid color-mix(in oklab, currentColor 28%, transparent);
}

.tree__name {
  font-family: var(--font-mono-tokens);
  font-size: 13px;
  letter-spacing: 0.08em;
  padding: 10px 14px;
  border-bottom: 1px solid color-mix(in oklab, currentColor 28%, transparent);
}

.tree__pre {
  font-family: var(--font-mono-tokens);
  font-size: 12.5px;
  line-height: 1.9;
  padding: 14px;
  margin: 0;
  overflow-x: auto;
  opacity: 0.92;
}

.compare__note {
  margin: var(--space-xl) 0 0;
  font-size: 13.5px;
  opacity: 0.85;
}

.compare__note a {
  color: inherit;
  text-underline-offset: 3px;
}

/* --- 構成 --- */
.toc {
  border-bottom: 1px solid var(--color-rule);
}

.toc__inner {
  max-width: var(--container);
  margin: 0 auto;
  padding: clamp(56px, 7vw, 88px) 24px;
}

.toc__title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(24px, 3vw, 34px);
  letter-spacing: 0.03em;
  margin: 0 0 var(--space-lg);
}

.toc__list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--color-rule);
}

.toc__row {
  border-bottom: 1px solid var(--color-rule);
}

.toc__link {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto 24px;
  gap: var(--space-sm);
  align-items: baseline;
  padding: 20px 8px;
  text-decoration: none;
  color: inherit;
  transition: background-color var(--dur-base) var(--ease-out);
}

.toc__link:hover {
  background: var(--color-paper-2);
}

.toc__num {
  font-family: var(--font-display);
  font-size: 20px;
  color: var(--color-ink-3);
}

.toc__head {
  display: block;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 18px;
  letter-spacing: 0.02em;
}

.toc__desc {
  display: block;
  font-size: 13px;
  line-height: 1.8;
  color: var(--color-ink-2);
  margin-top: 4px;
}

.toc__range {
  font-family: var(--font-mono-tokens);
  font-size: 12px;
  color: var(--color-ink-3);
}

.toc__arrow {
  color: var(--color-ink-3);
  transition: transform var(--dur-base) var(--ease-out);
}

.toc__link:hover .toc__arrow {
  transform: translateX(4px);
}

/* --- 締め --- */
.outro {
  max-width: var(--container);
  margin: 0 auto;
  padding: clamp(48px, 6vw, 80px) 24px clamp(64px, 8vw, 112px);
  text-align: center;
}

.outro__line {
  font-family: var(--font-display);
  font-size: clamp(18px, 2.2vw, 24px);
  letter-spacing: 0.04em;
  margin: 0 0 var(--space-lg);
}

.outro__line code {
  font-family: var(--font-mono-tokens);
  font-size: 0.9em;
  background: var(--color-paper-2);
  padding: 2px 8px;
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-card);
}

/* --- レスポンシブ --- */
@media (max-width: 860px) {
  .hero__inner {
    grid-template-columns: 1fr;
  }

  .hero__visual {
    order: -1;
  }

  .hero__visual :deep(.stack) {
    max-width: 380px;
  }

  .strip__list {
    grid-template-columns: 1fr;
    row-gap: var(--space-md);
  }

  .strip__item {
    padding: 0;
  }

  .strip__item + .strip__item {
    border-left: none;
    border-top: 1px solid var(--color-rule);
    padding-top: var(--space-md);
  }

  .compare__grid {
    grid-template-columns: 1fr;
  }

  .toc__link {
    grid-template-columns: 40px minmax(0, 1fr) 24px;
  }

  .toc__range {
    display: none;
  }
}
</style>
