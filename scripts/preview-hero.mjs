// ヒーローシェーダーをヘッドレスレンダリングして PNG に書き出す確認用スクリプト
// 使い方: node scripts/preview-hero.mjs [time] [light|dark]
import { writeFileSync } from 'node:fs'
import { PNG } from 'pngjs'
import { init, effect, target } from 'vgpu/node'
import { STACK_WGSL, PALETTES } from '../docs/.vitepress/theme/hero-shader.js'

const width = 760
const height = 700
const time = Number(process.argv[2] ?? 3)
const mode = process.argv[3] === 'dark' ? 'dark' : 'light'
const pal = PALETTES[mode]

const gpu = await init()
const colorTarget = target(gpu, { size: [width, height] })
const fx = effect(gpu, STACK_WGSL, {
  set: {
    params: {
      time,
      aspect: width / height,
      pointer: [0, 0],
      paper: pal.paper,
      plane: pal.plane,
      shadow: pal.shadow,
      edge: pal.edge,
      glint: pal.glint,
    },
  },
})
fx.draw(colorTarget)
const pixels = await colorTarget.read()
const png = new PNG({ width, height })
png.data.set(pixels)
writeFileSync('hero-preview.png', PNG.sync.write(png))
gpu.dispose()
console.log(`hero-preview.png (time=${time}, ${mode}) を書き出しました`)
