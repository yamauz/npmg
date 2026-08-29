<script setup>
import { useData } from 'vitepress'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { layerBob, layerCenterY, PALETTES, STACK_WGSL } from './hero-shader.js'

const { isDark } = useData()
const rootRef = ref(null)
const canvasRef = ref(null)
const active = ref(false)

// 表示順(上の層から)。shader のレイヤー番号は i = 4 - idx
const labels = ['node_modules', 'store / cache', 'symlink / hardlink', 'package manager', 'file system']
const labelRefs = ref([])

let gpu = null
let fx = null
let surfaceTarget = null
let reduced = false
const pointer = { x: 0, y: 0 }
const targetPointer = { x: 0, y: 0 }

const palette = () => PALETTES[isDark.value ? 'dark' : 'light']

function applyPalette() {
  const pal = palette()
  fx?.set({
    params: {
      paper: pal.paper,
      plane: pal.plane,
      shadow: pal.shadow,
      edge: pal.edge,
      glint: pal.glint,
    },
  })
}

function onPointerMove(e) {
  targetPointer.x = e.clientX / window.innerWidth - 0.5
  targetPointer.y = e.clientY / window.innerHeight - 0.5
}

function syncLabels(t) {
  const canvas = canvasRef.value
  if (!canvas) return
  const H = canvas.clientHeight
  labelRefs.value.forEach((el, idx) => {
    if (!el) return
    const i = 4 - idx
    const depth = i - 2
    const dx = pointer.x * depth * 0.016 * H
    const dy = (layerBob(t, i) + pointer.y * depth * 0.011) * H
    el.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)`
  })
}

onMounted(async () => {
  const canvas = canvasRef.value
  if (!canvas || typeof navigator === 'undefined' || !navigator.gpu) return
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  try {
    const { clock, effect, frameLoop, init, surface } = await import('vgpu')
    gpu = await init()
    surfaceTarget = surface(gpu, canvas, { dpr: [1, 2] })
    const aspect = () => canvas.clientWidth / Math.max(canvas.clientHeight, 1)
    const pal = palette()
    fx = effect(gpu, STACK_WGSL, {
      set: {
        params: {
          time: 1.2,
          aspect: aspect(),
          pointer: [0, 0],
          paper: pal.paper,
          plane: pal.plane,
          shadow: pal.shadow,
          edge: pal.edge,
          glint: pal.glint,
        },
      },
    })
    surfaceTarget.onResize(() => {
      fx.set({ params: { aspect: aspect() } })
    })

    if (reduced) {
      // モーション低減時は静止フレームのみ
      fx.draw(surfaceTarget)
      active.value = true
      return
    }

    window.addEventListener('mousemove', onPointerMove, { passive: true })
    const time = clock(gpu)
    frameLoop(gpu, (frame) => {
      pointer.x += (targetPointer.x - pointer.x) * 0.05
      pointer.y += (targetPointer.y - pointer.y) * 0.05
      const t = time.time + 1.2
      fx.set({ params: { time: t, pointer: [pointer.x, pointer.y] } })
      frame.pass(surfaceTarget, fx)
      syncLabels(t)
    })
    active.value = true
  } catch {
    gpu?.dispose?.()
    gpu = null
    active.value = false
  }
})

watch(isDark, () => {
  applyPalette()
  if (reduced && fx && surfaceTarget) fx.draw(surfaceTarget)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onPointerMove)
  gpu?.dispose?.()
  gpu = null
})
</script>

<template>
  <div ref="rootRef" class="stack" role="img"
    aria-label="node_modules、store / cache、symlink / hardlink、package manager、file system が積み重なった等角投影のレイヤー図">
    <!-- WebGPU 非対応環境向けの静的フォールバック -->
    <div v-if="!active" class="stack__fallback" aria-hidden="true">
      <div v-for="i in 5" :key="i" class="stack__plane" :style="{ top: `${layerCenterY(5 - i) * 100}%` }"></div>
    </div>
    <canvas ref="canvasRef" class="stack__canvas" :class="{ 'is-active': active }"></canvas>
    <div class="stack__labels" aria-hidden="true">
      <span v-for="(label, idx) in labels" :key="label" :ref="(el) => (labelRefs[idx] = el)" class="stack__label"
        :style="{ top: `${layerCenterY(4 - idx) * 100}%` }">
        <span class="stack__label-text">{{ label }}</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.stack {
  position: relative;
  width: 100%;
  aspect-ratio: 76 / 70;
  max-width: 560px;
}

.stack__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 600ms var(--ease-out);
}

.stack__canvas.is-active {
  opacity: 1;
}

/* フォールバック: CSS だけの静的ダイヤモンド */
.stack__fallback {
  position: absolute;
  inset: 0;
}

.stack__plane {
  position: absolute;
  left: 50%;
  width: 72%;
  aspect-ratio: 2 / 1;
  transform: translate(-50%, -50%);
  clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
  background: color-mix(in oklab, var(--color-paper) 30%, white);
  border: 1px solid var(--color-rule);
}

:global(.dark) .stack__plane {
  background: var(--color-paper-3);
}

.stack__labels {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.stack__label {
  position: absolute;
  left: 50%;
  will-change: transform;
}

.stack__label-text {
  display: inline-block;
  transform: translate(-50%, -50%) rotate(-26.57deg) skewX(26.57deg);
  font-family: var(--font-mono-tokens);
  font-size: 13px;
  letter-spacing: 0.08em;
  color: var(--color-ink-2);
  white-space: nowrap;
}
</style>
