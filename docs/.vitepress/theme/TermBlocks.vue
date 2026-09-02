<script setup>
// 本文のターミナル表示。md に <TermBlocks :lines="[{ cmd }, { out }]" /> と書く。
// design.md 準拠: 偽ブラウザ/信号機ドットの装飾クロームは使わない。
//
// コピーの単位は「コマンド 1 行」と「直後のログの塊」。ログはどの行に
// ホバーしても塊ごと反転し、1 つのボタンで全文をコピーする。
// 全体コピー (バー右のアイコン) は持たない。
//
// 静的コードブロック側は TermFrame.vue が包む (config.mts の fence 差し替え)。
// あちらは行単位のコピー + 全体コピーで、単位が異なる。
import { computed, onUnmounted, ref } from 'vue'

const props = defineProps({
  lines: { type: Array, required: true },
  title: { type: String, default: 'zsh' },
  prompt: { type: String, default: '$' },
})

// 行を「コマンド 1 行」と「連続するログ」の塊に畳む。
// 空行はログの一部として保つ (pnpm の出力は空行で段落を作るため)。
const groups = computed(() => {
  const out = []
  for (const line of props.lines) {
    if (line.cmd !== undefined) {
      out.push({ kind: 'cmd', lines: [line.cmd] })
    } else if (line.out !== undefined) {
      const last = out.at(-1)
      if (last?.kind === 'out') last.lines.push(line.out)
      else out.push({ kind: 'out', lines: [line.out] })
    }
  }
  // 末尾の空行は塊に含めない (コピーに余計な改行が入るため)
  for (const g of out) {
    while (g.kind === 'out' && g.lines.at(-1) === '') g.lines.pop()
  }
  return out.filter((g) => g.lines.length > 0)
})

const copied = ref(-1)
let timer = null

async function copyGroup(group, index) {
  try {
    await navigator.clipboard.writeText(group.lines.join('\n'))
    copied.value = index
    clearTimeout(timer)
    timer = setTimeout(() => (copied.value = -1), 1600)
  } catch {
    /* クリップボードが使えない環境では黙って何もしない */
  }
}

function labelFor(group) {
  return group.kind === 'cmd' ? `このコマンドをコピー: ${group.lines[0]}` : 'このログをコピー'
}

onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <figure class="tb">
    <figcaption class="tb__bar">
      <span class="tb__title">{{ title }}</span>
    </figcaption>
    <div class="tb__screen">
      <!-- 塊がホバーの単位。ログはどの行に乗っても塊ごと反転する -->
      <div
        v-for="(group, gi) in groups"
        :key="gi"
        class="tb__group"
        :class="`tb__group--${group.kind}`"
      >
        <div class="tb__lines">
          <p v-for="(text, li) in group.lines" :key="li" class="tb__line">
            <span v-if="group.kind === 'cmd'" class="tb__prompt" aria-hidden="true">{{
              prompt
            }}</span>
            <span class="tb__text">{{ text }}</span>
          </p>
        </div>
        <button
          class="tb__copy"
          type="button"
          :data-copied="copied === gi ? 'true' : 'false'"
          :aria-label="copied === gi ? 'コピーしました' : labelFor(group)"
          @click="copyGroup(group, gi)"
        >
          <!-- CopyMarkdown.vue と同じ 2 枚重ねの矩形。成功でチェックに差し替える -->
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.3"
            aria-hidden="true"
          >
            <template v-if="copied === gi">
              <path d="M3 8.5 6.5 12 13 4.5" stroke-linecap="round" stroke-linejoin="round" />
            </template>
            <template v-else>
              <rect x="5.5" y="5.5" width="8" height="8" rx="1" />
              <path d="M10.5 3.5v-1h-8v8h1" stroke-linecap="round" />
            </template>
          </svg>
        </button>
      </div>
    </div>
  </figure>
</template>

<style scoped>
.tb {
  margin: 24px 0;
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-card);
  overflow: hidden;
  background: #14181f;
}

.tb__bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  border-bottom: 1px solid #262b34;
  background: #191e26;
}

.tb__title {
  font-family: var(--font-mono-tokens);
  font-size: 11px;
  letter-spacing: 0.12em;
  color: #8b93a2;
}

/* 折り返さず横スクロールさせる。モバイルで長いコマンドやログが
   折り返されると、ターミナルの見た目としても読み筋としても壊れるため。 */
.tb__screen {
  /* 行の寸法。コピーボタンを 1 行ぶんの高さに揃えるのに使う */
  --tb-font-size: 13px;
  --tb-line-height: 1.85;
  /* ホバーの地と文字の間の余白 (塊の上下に置く) */
  --tb-group-pad: 5px;

  padding: 11px 0 13px;
  font-family: var(--font-mono-tokens);
  font-size: var(--tb-font-size);
  line-height: var(--tb-line-height);
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

/* ホバーの単位。ログは複数行でも 1 つの塊として反転する。
   上下の padding は、ホバーの地が文字にぴったり張り付いて窮屈に
   見えないようにするためのもの。塊が単位なので、行間ではなく
   「塊の外側」に余白を置く。 */
.tb__group {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: var(--tb-group-pad) 16px;
  /* 塊がスクロール幅いっぱいに伸びるようにする (地を全幅に出すため) */
  min-width: max-content;
}

.tb__group:hover {
  background: #191e26;
}

.tb__lines {
  min-width: 0;
}

/* VitePress の .vp-doc p は独自の line-height を持っており、
   .tb__screen から継承させると上書きされて行の高さがずれる
   (コピーボタンを 1 行ぶんに揃えられなくなる)。行側で明示する。 */
.tb__line {
  margin: 0;
  line-height: var(--tb-line-height);
  white-space: pre;
}

/* 空行も 1 行ぶんの高さを保つ (pnpm の出力は空行で段落を作る) */
.tb__line:empty::after,
.tb__text:empty::after {
  content: '\200b';
}

.tb__group--cmd .tb__text {
  color: #e6e9ef;
  font-weight: 500;
}

.tb__group--out .tb__text {
  color: #9aa5b5;
}

.tb__prompt {
  color: #5b8cff;
  margin-right: 9px;
  user-select: none;
}

/* 塊ホバーで出るコピーボタン。横スクロールしても右端に留まるよう sticky。
   ログの塊でも位置を揃えたいので、常に「先頭行」の中央に置く。
   高さを 1 行ぶんにして中身を中央寄せすると、塊が何行あっても
   先頭行に対して自動で中央になる (padding で位置を作るとずれる)。

   font-size は button では継承されない (ブラウザ既定の 13.3333px になる) ので、
   em ではなく .tb__screen の変数から組み立てる。 */
.tb__copy {
  position: sticky;
  right: 0;
  top: 0;
  margin-left: auto;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  font-size: var(--tb-font-size);
  height: calc(var(--tb-font-size) * var(--tb-line-height));
  width: calc(var(--tb-font-size) * var(--tb-line-height));
  color: #8b93a2;
  background: #191e26;
  border: 1px solid #262b34;
  border-radius: var(--radius-card);
  padding: 0;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.12s ease;
}

.tb__copy svg {
  display: block;
}

.tb__group:hover .tb__copy,
.tb__copy:focus-visible,
.tb__copy[data-copied='true'] {
  opacity: 1;
}

.tb__copy:hover {
  color: #e6e9ef;
  border-color: #3a4150;
}

.tb__copy[data-copied='true'] {
  color: #5b8cff;
}

/* タッチ環境にはホバーがないので常時出す */
@media (hover: none) {
  .tb__copy {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tb__copy {
    transition: none;
  }
}
</style>
