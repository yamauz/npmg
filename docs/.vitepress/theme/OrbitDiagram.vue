<script setup>
// ヒーローの軌道ダイアグラム(WebGPU / vgpu)。
// すべての点はシェーダー内で 中心 + 半径 × (cosθ(t), sinθ(t)) により解析的に配置され、
// 軌道からのズレは構造的に発生しない。ラベルは DOM、非対応環境は静的 SVG にフォールバック。
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ORBIT_WGSL } from './hero-shader.js'

const canvasRef = ref(null)
const active = ref(false)

// ラベル位置(コンテナに対する %。シェーダーの引き出し線終端と一致させる)
const labels = [
  { text: 'node_modules', y: 33.46, accent: false },
  { text: 'npm', y: 41.92, accent: false },
  { text: 'yarn', y: 50.38, accent: false },
  { text: 'pnpm', y: 58.85, accent: true },
]

let gpu = null
const pointer = { x: 0, y: 0 }
const targetPointer = { x: 0, y: 0 }

function onPointerMove(e) {
  targetPointer.x = e.clientX / window.innerWidth - 0.5
  targetPointer.y = e.clientY / window.innerHeight - 0.5
}

onMounted(async () => {
  const canvas = canvasRef.value
  if (!canvas || typeof navigator === 'undefined' || !navigator.gpu) return
  try {
    const { clock, effect, frameLoop, init, surface } = await import('vgpu')
    gpu = await init()
    const target = surface(gpu, canvas, { dpr: [1, 2] })
    const aspect = () => canvas.clientWidth / Math.max(canvas.clientHeight, 1)
    const fx = effect(gpu, ORBIT_WGSL, {
      set: { params: { time: 8, aspect: aspect(), pointer: [0, 0] } },
    })
    target.onResize(() => fx.set({ params: { aspect: aspect() } }))

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      fx.draw(target)
      active.value = true
      return
    }

    window.addEventListener('mousemove', onPointerMove, { passive: true })
    const time = clock(gpu)
    frameLoop(gpu, (frame) => {
      pointer.x += (targetPointer.x - pointer.x) * 0.04
      pointer.y += (targetPointer.y - pointer.y) * 0.04
      fx.set({ params: { time: time.time + 8, pointer: [pointer.x, pointer.y] } })
      frame.pass(target, fx)
    })
    active.value = true
  } catch {
    gpu?.dispose?.()
    gpu = null
    active.value = false
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onPointerMove)
  gpu?.dispose?.()
  gpu = null
})
</script>

<template>
  <div class="orbit" role="img"
    aria-label="node_modules を中心に npm / yarn / pnpm が同心円上に配置された依存構造のダイアグラム">
    <!-- WebGPU 非対応環境向けの静的フォールバック(点はすべて軌道半径上に配置) -->
    <svg v-if="!active" class="orbit__fallback" viewBox="0 0 560 520" fill="none"
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="250" cy="260" r="228" class="fl" stroke-dasharray="5 7" />
      <circle cx="250" cy="260" r="172" class="fl" stroke-dasharray="1.5 7" stroke-linecap="round" />
      <circle cx="250" cy="260" r="116" class="fl" />
      <!-- 軌道上の点(半径ぴったり) -->
      <circle cx="342" cy="51.3" r="3" class="fd" />
      <circle cx="70.4" cy="391.6" r="2.6" class="fh" />
      <circle cx="411.5" cy="366.8" r="3" class="fd" />
      <circle cx="250" cy="88" r="2.6" class="fh" />
      <circle cx="127.5" cy="380.6" r="3" class="fd" />
      <circle cx="365.4" cy="219.4" r="2.6" class="fh" />
      <circle cx="152" cy="192" r="3" class="fd" />
      <!-- 中心の依存ツリー -->
      <g class="fl">
        <path d="M250 252v34" />
        <path d="M250 286l-34 22M250 286v30M250 286l34 22" />
        <path d="M216 310l-10 24M216 310l6 26M250 318l-6 26M250 318l8 24M284 310l-6 26M284 310l10 24" />
      </g>
      <circle cx="250" cy="248" r="5" class="fd" />
      <circle cx="216" cy="309" r="3.5" class="fd" />
      <circle cx="250" cy="317" r="3.5" class="fd" />
      <circle cx="284" cy="309" r="3.5" class="fd" />
      <g>
        <circle cx="206" cy="335" r="2.5" class="fh" />
        <circle cx="222" cy="337" r="2.5" class="fh" />
        <circle cx="244" cy="345" r="2.5" class="fh" />
        <circle cx="258" cy="343" r="2.5" class="fh" />
        <circle cx="278" cy="337" r="2.5" class="fh" />
        <circle cx="294" cy="335" r="2.5" class="fh" />
      </g>
      <!-- 引き出し線とアンカー -->
      <g class="fl fl--rule">
        <path d="M330 174h96M366 218h60M310 262h116M352 306h74" />
      </g>
      <circle cx="330" cy="174" r="3" class="fh" />
      <circle cx="366" cy="218" r="3" class="fd" />
      <circle cx="310" cy="262" r="3" class="fd" />
      <circle cx="352" cy="306" r="4" class="fa" />
    </svg>
    <canvas ref="canvasRef" class="orbit__canvas" :class="{ 'is-active': active }"></canvas>
    <div class="orbit__labels" aria-hidden="true">
      <span v-for="l in labels" :key="l.text" class="orbit__label" :class="{ 'is-accent': l.accent }"
        :style="{ top: `${l.y}%` }">{{ l.text }}</span>
    </div>
  </div>
</template>

<style scoped>
.orbit {
  position: relative;
  width: 100%;
  max-width: 560px;
  aspect-ratio: 560 / 520;
}

.orbit__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 500ms var(--ease-out);
}

.orbit__canvas.is-active {
  opacity: 1;
}

.orbit__fallback {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.fl {
  stroke: var(--v2-ink-3, #9aa1ac);
  stroke-width: 1;
  fill: none;
}

.fl--rule {
  stroke: var(--v2-rule, #d9dce2);
}

.fd {
  fill: var(--v2-ink, #1c1e21);
}

.fh {
  fill: var(--v2-bg, #fafafa);
  stroke: var(--v2-ink-3, #9aa1ac);
  stroke-width: 1;
}

.fa {
  fill: var(--v2-accent, #2563eb);
}

.orbit__labels {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.orbit__label {
  position: absolute;
  left: 77.5%;
  transform: translateY(-50%);
  font-family: var(--font-mono-tokens);
  font-size: 12.5px;
  letter-spacing: 0.04em;
  color: var(--v2-ink-2, #4b5563);
  white-space: nowrap;
}

.orbit__label.is-accent {
  color: var(--v2-accent, #2563eb);
  font-weight: 600;
}
</style>
