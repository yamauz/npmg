<script setup>
// ヒーロー背面の「依存グラフ星座」(WebGPU / vgpu)。
// セクション全面に敷く背景レイヤー。テキストはこの上に重なる。
// WebGPU 非対応環境では何も描かない(静かな白背景のまま)。
import { useData } from 'vitepress'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { NETWORK_WGSL } from './hero-shader.js'

const { isDark } = useData()
const canvasRef = ref(null)
const active = ref(false)

let gpu = null
const pointer = { x: 0, y: 0 }
const targetPointer = { x: 0, y: 0 }
// キャンバス座標系(右端 x=0・高さ基準)のカーソル位置。初期値は「遠く」
const pscene = { x: 99, y: 99 }
const targetPscene = { x: 99, y: 99 }

function onPointerMove(e) {
  targetPointer.x = e.clientX / window.innerWidth - 0.5
  targetPointer.y = e.clientY / window.innerHeight - 0.5
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  if (rect.height === 0) return
  targetPscene.x = (e.clientX - rect.left) / rect.height - rect.width / rect.height
  targetPscene.y = (e.clientY - rect.top) / rect.height
}

onMounted(async () => {
  const canvas = canvasRef.value
  if (!canvas || typeof navigator === 'undefined' || !navigator.gpu) return
  try {
    const { clock, effect, frameLoop, init, surface } = await import('vgpu')
    gpu = await init()
    const target = surface(gpu, canvas, { dpr: [1, 2] })
    const aspect = () => canvas.clientWidth / Math.max(canvas.clientHeight, 1)
    const fx = effect(gpu, NETWORK_WGSL, {
      set: {
        params: {
          time: 5,
          aspect: aspect(),
          pointer: [0, 0],
          pscene: [99, 99],
          dark: isDark.value ? 1 : 0,
        },
      },
    })
    target.onResize(() => fx.set({ params: { aspect: aspect() } }))

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    watch(isDark, (v) => {
      fx.set({ params: { dark: v ? 1 : 0 } })
      if (reduced) fx.draw(target)
    })

    if (reduced) {
      // ドローイン完了後の静止フレーム
      fx.set({ params: { time: 40 } })
      fx.draw(target)
      active.value = true
      return
    }

    window.addEventListener('mousemove', onPointerMove, { passive: true })
    const time = clock(gpu)
    frameLoop(gpu, (frame) => {
      pointer.x += (targetPointer.x - pointer.x) * 0.04
      pointer.y += (targetPointer.y - pointer.y) * 0.04
      pscene.x += (targetPscene.x - pscene.x) * 0.12
      pscene.y += (targetPscene.y - pscene.y) * 0.12
      fx.set({
        params: {
          time: time.time + 5,
          pointer: [pointer.x, pointer.y],
          pscene: [pscene.x, pscene.y],
        },
      })
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
  <div class="net" aria-hidden="true">
    <canvas ref="canvasRef" class="net__canvas" :class="{ 'is-active': active }"></canvas>
  </div>
</template>

<style scoped>
.net {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.net__canvas {
  width: 100%;
  height: 100%;
  display: block;
  opacity: 0;
  transition: opacity 700ms var(--ease-out);
}

.net__canvas.is-active {
  opacity: 1;
}
</style>
