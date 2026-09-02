<script setup>
// 静的コードブロック(```sh / ```json / …)をターミナルの枠に入れる。
// config.mts の markdown.config が fence を差し替えてこのコンポーネントで包む。
//
// コピーの単位は TermBlocks.vue と揃える:
//   - シェルのコマンド行 ($ で始まる行) … 1 行が単位。$ は外してコピー
//   - 連続するログ / それ以外の言語     … 塊が単位。どの行にホバーしても
//                                        塊ごと反転し、1 つのボタンで全文をコピー
// バー右の「全体コピー」は持たない(塊のボタンで足りるため)。
//
// Shiki が吐いた .line はハイライトの span 構造を持つので、DOM は作り直さず
// 塊ごとに <div> で包み直す。
import { onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  // 右上に出すラベル。```sh なら 'sh'
  lang: { type: String, default: '' },
  // ターミナルバーの左に出す見出し
  title: { type: String, default: '' },
  // シェル扱いにするか(コマンド行を 1 行ずつの単位にする)
  shell: { type: Boolean, default: false },
})

// ボタンは Shiki が吐いた DOM に後から差すので、テンプレートではなく文字列で持つ。
// 形は CopyMarkdown.vue / TermBlocks.vue と同一に保つこと。
const SVG_OPEN =
  '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true">'
const COPY_ICON = `${SVG_OPEN}<rect x="5.5" y="5.5" width="8" height="8" rx="1" /><path d="M10.5 3.5v-1h-8v8h1" stroke-linecap="round" /></svg>`
const CHECK_ICON = `${SVG_OPEN}<path d="M3 8.5 6.5 12 13 4.5" stroke-linecap="round" stroke-linejoin="round" /></svg>`

const rootRef = ref(null)
const overlayRef = ref(null)
const cleanups = []
// ボタンの縦位置を塊に合わせ直す関数。行の高さが変わると位置がずれるため、
// フォント読み込み後とリサイズ時に呼び直す。
const positioners = []

/** クリップボードに書く。失敗したら false */
async function write(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * 塊のコピーボタンを作り、スクロールしない層 (overlay) に置く。
 *
 * 塊の中に入れると、横スクロールで一緒に流れて見切れる。
 * position: sticky は「スクロールする箱の中」でしか効かず、
 * ここでは塊自身がスクロールの中身なので枠には貼り付かない。
 * そのため枠側に絶対配置の層を作り、塊の縦位置だけを合わせる。
 */
function attachButton(group, text, label) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'term-frame__copy-btn'
  button.innerHTML = COPY_ICON
  button.setAttribute('aria-label', label)

  let timer = null
  const onClick = async () => {
    if (!(await write(text))) return
    button.innerHTML = CHECK_ICON
    button.dataset.copied = 'true'
    button.setAttribute('aria-label', 'コピーしました')
    clearTimeout(timer)
    timer = setTimeout(() => {
      button.innerHTML = COPY_ICON
      button.dataset.copied = 'false'
      button.setAttribute('aria-label', label)
    }, 1600)
  }
  button.addEventListener('click', onClick)
  cleanups.push(() => {
    clearTimeout(timer)
    button.removeEventListener('click', onClick)
  })

  // ホバーは塊に対して判定する(ボタンは塊の外にあるので CSS の
  // :hover では繋がらない)。ボタン自身のホバーでも消えないようにする。
  const show = () => {
    group.classList.add('is-hovered')
    button.classList.add('is-shown')
  }
  const hide = () => {
    group.classList.remove('is-hovered')
    button.classList.remove('is-shown')
  }
  group.addEventListener('pointerenter', show)
  group.addEventListener('pointerleave', hide)
  button.addEventListener('pointerenter', show)
  button.addEventListener('pointerleave', hide)
  cleanups.push(() => {
    group.removeEventListener('pointerenter', show)
    group.removeEventListener('pointerleave', hide)
    button.removeEventListener('pointerenter', show)
    button.removeEventListener('pointerleave', hide)
  })

  overlayRef.value?.appendChild(button)
  // 塊の先頭行の中央に載せる。行数が変わっても先頭行を追う。
  // 塊の上端ではなく先頭行を基準にするのは、塊が上下に padding を
  // 持っているため(上端に合わせると padding のぶん上にずれる)。
  positioners.push(() => {
    const line = group.querySelector('.line')
    if (!line) return
    const base = overlayRef.value?.getBoundingClientRect()
    const lb = line.getBoundingClientRect()
    if (!base) return
    const center = lb.top - base.top + lb.height / 2
    button.style.top = `${center - button.offsetHeight / 2}px`
  })
}

/**
 * 行を「コマンド 1 行」と「連続するログ」の塊に畳み、塊ごとに <div> で包む。
 * 非シェルのブロック (JSON / YAML など) は全体で 1 つの塊になる。
 */
function groupAll() {
  const root = rootRef.value
  if (!root) return

  // 枠の中に <pre> が 2 つ並ぶことがある(config.mts がコマンドのブロックと
  // 出力のブロックを 1 台のターミナルに連結するため)。
  //
  // 兄弟のままだと 2 つが別々に幅を決めてしまい、長いコマンドを含む側だけが
  // 横に伸びる。すると塊の右端が食い違い、ホバーの地とコピーボタンの位置が
  // ずれる。CSS では兄弟同士の幅を揃えられないので、行を 1 つ目の code に
  // 集めて「1 枚のターミナル画面」にする。
  const codes = [...root.querySelectorAll('pre code')]
  const first = codes[0]
  if (!first) return

  for (const code of codes.slice(1)) {
    // querySelectorAll は静的な NodeList なので、移動しながら回してよい
    for (const line of code.querySelectorAll(':scope > .line')) first.appendChild(line)
    // 空になった language- ブロックごと畳む(余白が二重に残るため)
    code.closest('div[class*="language-"]')?.remove()
  }

  groupOne(first)
}

function groupOne(code) {
  const lines = [...code.querySelectorAll(':scope > .line')]
  if (!lines.length) return

  // 末尾の空行は塊に含めない(コピーに余計な改行が入るため)
  while (lines.length && !lines.at(-1).textContent.trim()) lines.pop().remove()

  const groups = []
  for (const line of lines) {
    const text = line.textContent
    const isCmd = props.shell && /^\s*\$\s+\S/.test(text)
    const last = groups.at(-1)
    if (isCmd || !last || last.kind === 'cmd') {
      groups.push({ kind: isCmd ? 'cmd' : 'out', lines: [line] })
    } else {
      last.lines.push(line)
    }
  }

  for (const g of groups) {
    const wrap = document.createElement('div')
    wrap.className = `term-frame__group term-frame__group--${g.kind}`

    // 行はさらに内側の div にまとめる。塊を flex にしてボタンを右へ逃がすので、
    // 行を直接ぶら下げると 1 行ずつが flex item になって横並びになる。
    const inner = document.createElement('div')
    inner.className = 'term-frame__lines'

    const first = g.lines[0]
    first.parentNode.insertBefore(wrap, first)
    for (const line of g.lines) inner.appendChild(line)
    wrap.appendChild(inner)

    if (g.kind === 'cmd') {
      // 行頭の $ をプロンプトとして青くする。Shiki はコマンド本体と同じ
      // トークンに含めてしまうので、先頭の span を $ と残りに割る。
      const command = /^\s*\$\s+([\s\S]*)$/.exec(first.textContent)?.[1] ?? ''
      const head = first.firstChild
      if (head) {
        const m = /^(\s*\$)(\s*)([\s\S]*)$/.exec(head.textContent)
        if (m) {
          const prompt = document.createElement('span')
          prompt.className = 'term-frame__prompt'
          prompt.setAttribute('aria-hidden', 'true')
          prompt.textContent = m[1] + m[2]
          head.textContent = m[3]
          first.insertBefore(prompt, head)
        }
      }
      attachButton(wrap, command, `このコマンドをコピー: ${command}`)
    } else {
      const text = g.lines
        .map((l) => l.textContent)
        .join('\n')
        .replace(/\n+$/, '')
      attachButton(wrap, text, props.shell ? 'このログをコピー' : 'このコードをコピー')
    }
  }
}

function reposition() {
  positioners.forEach((fn) => fn())
}

let observer = null

onMounted(() => {
  groupAll()
  reposition()

  // Web フォントの適用や折り返しの変化で行の高さが変わると位置がずれる
  observer = new ResizeObserver(reposition)
  if (rootRef.value) observer.observe(rootRef.value)
})

onUnmounted(() => {
  observer?.disconnect()
  cleanups.forEach((fn) => fn())
})
</script>

<template>
  <figure ref="rootRef" class="term-frame" :class="{ 'term-frame--shell': shell }">
    <figcaption class="term-frame__bar">
      <span class="term-frame__title">{{ title || lang || 'sh' }}</span>
    </figcaption>
    <div class="term-frame__body">
      <div class="term-frame__screen">
        <slot />
      </div>
      <!-- コピーボタンを載せる層。スクロールしないので常に右端に留まる -->
      <div ref="overlayRef" class="term-frame__overlay" aria-hidden="false"></div>
    </div>
  </figure>
</template>

<style scoped>
.term-frame {
  margin: 24px 0;
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-card);
  overflow: hidden;
  background: #14181f;
}

.term-frame__bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  border-bottom: 1px solid #262b34;
  background: #191e26;
}

.term-frame__title {
  font-family: var(--font-mono-tokens);
  font-size: 11px;
  letter-spacing: 0.12em;
  color: #8b93a2;
}

.term-frame__body {
  position: relative;
}

.term-frame__screen {
  font-size: 13px;
}

/* ボタンを置く層。スクロールの外にあるので、横スクロールしても
   右端に留まる。層自体はクリックを透過し、ボタンだけが受ける。 */
.term-frame__overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  /* スクロールする中身より前に出す。後ろだとコード本文が
     クリックを横取りしてボタンが押せない。 */
  z-index: 1;
}
</style>
