<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useData } from 'vitepress'

const { page } = useData()

// scripts/llms-txt.mjs と同じスラッグ規則(パス区切りを - に置換)
const rawUrl = computed(() => {
  const slug = page.value.relativePath.replace(/\.md$/, '').replace(/\//g, '-')
  return `${import.meta.env.BASE_URL}raw/${slug}.md`
})

const state = ref('idle') // idle | copied | error
let timer = null

const label = computed(() => {
  if (state.value === 'copied') return 'コピーしました'
  if (state.value === 'error') return 'コピーできませんでした'
  return 'Markdown をコピー'
})

function flash(next) {
  state.value = next
  clearTimeout(timer)
  timer = setTimeout(() => (state.value = 'idle'), 2000)
}

async function copy() {
  try {
    const res = await fetch(rawUrl.value)
    if (!res.ok) throw new Error(String(res.status))
    await navigator.clipboard.writeText(await res.text())
    flash('copied')
  } catch {
    flash('error')
  }
}

onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <div class="copy-md">
    <button
      class="copy-md__button"
      type="button"
      :data-state="state"
      :aria-label="`このページの本文を Markdown としてコピー`"
      @click="copy"
    >
      <!-- 2 枚重ねの矩形。線のみ・塗りなしで、ヘアラインの調子に合わせる -->
      <svg
        class="copy-md__icon"
        width="13"
        height="13"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        stroke-width="1.3"
        aria-hidden="true"
      >
        <template v-if="state === 'copied'">
          <path d="M3 8.5 6.5 12 13 4.5" stroke-linecap="round" stroke-linejoin="round" />
        </template>
        <template v-else>
          <rect x="5.5" y="5.5" width="8" height="8" rx="1" />
          <path d="M10.5 3.5v-1h-8v8h1" stroke-linecap="round" />
        </template>
      </svg>
      <span class="copy-md__label">{{ label }}</span>
    </button>
    <span aria-live="polite" class="copy-md__sr">{{
      state === 'copied' ? 'コピーしました' : ''
    }}</span>
  </div>
</template>

<style scoped>
/* H1 の直後に markdown-it が差し込む(config.mts の markdown.config)。
   H1 の下マージンを詰めて、見出しにぶら下がって見える位置に置く */
.copy-md {
  display: flex;
  justify-content: flex-end;
  margin: calc(-1 * var(--space-2xs)) 0 var(--space-md);
}

.copy-md__button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3xs);
  padding: var(--space-3xs) 0;
  border: 0;
  background: none;
  color: var(--color-ink-2);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  line-height: 1.4;
  cursor: pointer;
  transition: color var(--dur-fast) var(--ease-out);
}

.copy-md__button:hover {
  color: var(--color-accent);
}

.copy-md__button:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 3px;
  border-radius: 2px;
}

.copy-md__button[data-state='copied'] {
  color: var(--color-accent);
}

.copy-md__icon {
  flex: none;
}

/* ラベルの幅が変わってもボタンが動かないよう、下線だけを引く */
.copy-md__label {
  border-bottom: 1px solid var(--color-rule);
  padding-bottom: 1px;
  transition: border-color var(--dur-fast) var(--ease-out);
}

.copy-md__button:hover .copy-md__label,
.copy-md__button[data-state='copied'] .copy-md__label {
  border-bottom-color: currentColor;
}

.copy-md__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
