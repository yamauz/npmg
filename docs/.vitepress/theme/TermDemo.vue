<script setup>
// ターミナル風デモ。コマンドを 1 文字ずつタイプし、出力を行単位で表示する。
// design.md 準拠: 偽ブラウザ/信号機ドットの装飾チュロームは使わない。
// 画面に入ったら自動再生。prefers-reduced-motion では即時全表示。
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  // [{ cmd: 'pnpm add lodash' }, { out: 'Packages: +1' }, { pause: 600 }]
  lines: { type: Array, required: true },
  title: { type: String, default: 'zsh' },
  prompt: { type: String, default: '$' },
  // タイプ速度(ms/文字)
  speed: { type: Number, default: 28 },
})

const rootRef = ref(null)
const rendered = ref([]) // { kind: 'cmd' | 'out', text, done }
const playing = ref(false)
const finished = ref(false)
let timers = []
let observer = null
let reduced = false

const cursorVisible = computed(() => playing.value && !finished.value)

function clearTimers() {
  timers.forEach(clearTimeout)
  timers = []
}

function wait(ms) {
  return new Promise((resolve) => {
    const id = setTimeout(resolve, ms)
    timers.push(id)
  })
}

async function typeCommand(text) {
  const row = { kind: 'cmd', text: '', done: false }
  rendered.value.push(row)
  const idx = rendered.value.length - 1
  for (let i = 0; i < text.length; i++) {
    rendered.value[idx] = { ...row, text: text.slice(0, i + 1) }
    await wait(props.speed + Math.random() * 24)
  }
  rendered.value[idx] = { ...row, text, done: true }
  await wait(260)
}

async function play() {
  if (playing.value) return
  clearTimers()
  rendered.value = []
  finished.value = false
  playing.value = true

  if (reduced) {
    rendered.value = props.lines
      .filter((l) => l.cmd !== undefined || l.out !== undefined)
      .map((l) => ({ kind: l.cmd !== undefined ? 'cmd' : 'out', text: l.cmd ?? l.out, done: true }))
    playing.value = false
    finished.value = true
    return
  }

  for (const line of props.lines) {
    if (line.pause) {
      await wait(line.pause)
      continue
    }
    if (line.cmd !== undefined) {
      await typeCommand(line.cmd)
    } else if (line.out !== undefined) {
      rendered.value.push({ kind: 'out', text: line.out, done: true })
      await wait(110)
    }
  }
  playing.value = false
  finished.value = true
}

function replay() {
  playing.value = false
  play()
}

onMounted(() => {
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting) && !finished.value && !playing.value) {
        play()
        observer?.disconnect()
      }
    },
    { threshold: 0.35 },
  )
  if (rootRef.value) observer.observe(rootRef.value)
})

onBeforeUnmount(() => {
  clearTimers()
  observer?.disconnect()
})
</script>

<template>
  <figure ref="rootRef" class="term">
    <figcaption class="term__bar">
      <span class="term__title">{{ title }}</span>
      <button v-if="finished" class="term__replay" type="button" @click="replay">↻ もう一度</button>
    </figcaption>
    <div class="term__screen" aria-live="polite">
      <p v-for="(row, i) in rendered" :key="i" class="term__row" :class="`term__row--${row.kind}`">
        <span v-if="row.kind === 'cmd'" class="term__prompt">{{ prompt }}</span>
        <span class="term__text">{{ row.text }}</span>
        <span v-if="row.kind === 'cmd' && !row.done" class="term__cursor" aria-hidden="true"></span>
      </p>
      <p v-if="rendered.length === 0" class="term__row term__row--cmd">
        <span class="term__prompt">{{ prompt }}</span>
        <span v-if="cursorVisible || !finished" class="term__cursor" aria-hidden="true"></span>
      </p>
    </div>
  </figure>
</template>

<style scoped>
.term {
  margin: 24px 0;
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-card);
  overflow: hidden;
  background: #14181f;
}

.term__bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  border-bottom: 1px solid #262b34;
  background: #191e26;
}

.term__title {
  font-family: var(--font-mono-tokens);
  font-size: 11px;
  letter-spacing: 0.12em;
  color: #8b93a2;
}

.term__replay {
  font-family: var(--font-mono-tokens);
  font-size: 11px;
  color: #5b8cff;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
}

.term__replay:hover {
  color: #7aa2ff;
}

.term__screen {
  padding: 16px 16px 18px;
  min-height: 96px;
  font-family: var(--font-mono-tokens);
  font-size: 13px;
  line-height: 1.85;
}

.term__row {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.term__row--cmd .term__text {
  color: #e6e9ef;
  font-weight: 500;
}

.term__row--out .term__text {
  color: #9aa5b5;
}

.term__prompt {
  color: #5b8cff;
  margin-right: 9px;
  user-select: none;
}

.term__cursor {
  display: inline-block;
  width: 8px;
  height: 15px;
  margin-left: 2px;
  vertical-align: -2px;
  background: #5b8cff;
  animation: term-blink 1.05s steps(1) infinite;
}

@keyframes term-blink {
  50% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .term__cursor {
    animation: none;
  }
}
</style>
