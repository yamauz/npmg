// ヒーロー背面ネットワークをヘッドレスレンダリングして PNG 出力する確認用スクリプト
// 使い方: node scripts/preview-hero.mjs [time]
import { writeFileSync } from 'node:fs'
import { PNG } from 'pngjs'
import { init, effect, target } from 'vgpu/node'
import { NETWORK_WGSL } from '../docs/.vitepress/theme/hero-shader.js'

const width = 1440
const height = 640
const time = Number(process.argv[2] ?? 5)

const gpu = await init()
const colorTarget = target(gpu, { size: [width, height] })
const fx = effect(gpu, NETWORK_WGSL, {
  set: {
    params: {
      time,
      aspect: width / height,
      pointer: [0, 0],
      pscene: [99, 99],
      dark: Number(process.argv[3] ?? 0),
    },
  },
})
fx.draw(colorTarget)
const pixels = await colorTarget.read()
const png = new PNG({ width, height })
png.data.set(pixels)
writeFileSync('hero-preview.png', PNG.sync.write(png))
gpu.dispose()
console.log(`hero-preview.png (time=${time}) を書き出しました`)
