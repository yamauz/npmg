// 画像を軽量化する。
//
//   node scripts/optimize-images.mjs          … 変換する
//   node scripts/optimize-images.mjs --dry    … 変換せず結果だけ出す
//
// 方針:
//  - 本文図版(docs/public/images/*.png) は WebP に変換して PNG を消す。
//    フラットなベクター図を PNG で持つと 1 枚 1MB 級になるが、WebP なら
//    50KB 前後まで落ちる(画質の劣化は目視で確認できない水準)。
//  - OGP(docs/public/og*.png, og/*.png) は PNG のまま可逆再圧縮だけ行う。
//    SNS のクローラは WebP の扱いが不安定で、変換するとカードが出なくなる。
//
// 図版を足したら再実行する。変換済みの WebP は入力にしないので、
// 何度走らせても劣化は重ならない。
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..')
const PUBLIC = path.join(ROOT, 'docs/public')
const DRY = process.argv.includes('--dry')

// 図版の表示幅は本文カラムの 688px。Retina 2 倍で 1376px あれば足りる
const MAX_WIDTH = 1440
const WEBP_QUALITY = 85

const kb = (n) => `${Math.round(n / 1024)}KB`

async function toWebp(file) {
  const before = fs.statSync(file).size
  const meta = await sharp(file).metadata()
  let pipe = sharp(file)
  if (meta.width > MAX_WIDTH) pipe = pipe.resize({ width: MAX_WIDTH })
  const buf = await pipe.webp({ quality: WEBP_QUALITY }).toBuffer()
  const out = file.replace(/\.png$/, '.webp')
  if (!DRY) {
    fs.writeFileSync(out, buf)
    fs.unlinkSync(file)
  }
  return { before, after: buf.length, out }
}

// OGP は形式を変えず、可逆(palette 化なし)で詰め直すだけ
async function recompressPng(file) {
  const before = fs.statSync(file).size
  const buf = await sharp(file).png({ compressionLevel: 9, effort: 10 }).toBuffer()
  // 太るなら触らない
  if (buf.length >= before) return { before, after: before, out: file, skipped: true }
  if (!DRY) fs.writeFileSync(file, buf)
  return { before, after: buf.length, out: file }
}

const pngsIn = (dir) =>
  fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((f) => f.endsWith('.png'))
        .map((f) => path.join(dir, f))
    : []

let before = 0
let after = 0

const figures = pngsIn(path.join(PUBLIC, 'images'))
for (const f of figures) {
  const r = await toWebp(f)
  before += r.before
  after += r.after
  console.log(`  ${kb(r.before)} → ${kb(r.after)}  ${path.relative(ROOT, r.out)}`)
}

// TOP の og.png / og-light.png と、章ごとの og/*.png
const ogs = [
  ...pngsIn(PUBLIC).filter((f) => path.basename(f).startsWith('og')),
  ...pngsIn(path.join(PUBLIC, 'og')),
]
for (const f of ogs) {
  const r = await recompressPng(f)
  before += r.before
  after += r.after
  if (!r.skipped) console.log(`  ${kb(r.before)} → ${kb(r.after)}  ${path.relative(ROOT, r.out)}`)
}

console.log(
  `\n図版 ${figures.length} 点(WebP)+ OGP ${ogs.length} 点(PNG 再圧縮): ` +
    `${kb(before)} → ${kb(after)} (${Math.round((1 - after / before) * 100)}% 減)` +
    (DRY ? '  ※ --dry のため書き込んでいない' : ''),
)
