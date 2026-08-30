<script setup>
// vitepress-plugin-mermaid の Mermaid コンポーネントを上書きする自前実装。
// 理由: プラグインはダークモードで theme: 'dark' を強制し、design.md のパレットを潰す。
// ライト/ダークそれぞれ design.md v2 のトークンに揃えた自前パレットで描画し、
// モード切替時は isDark を watch して再レンダリングする。
import { useData } from 'vitepress'
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  id: { type: String, required: true },
  graph: { type: String, required: true },
})

const { isDark } = useData()
const svg = ref('')
let renderCount = 0

// design.md v2(白×墨×ブルー)対応パレット
// Web フォントは幅計測とズレて文字が切れるため system 書体を使う
const LIGHT_VARIABLES = {
  fontFamily: 'sans-serif',
  fontSize: '14px',
  primaryColor: '#EDF0F4',
  primaryTextColor: '#1C1E21',
  primaryBorderColor: '#4B5563',
  secondaryColor: '#F7F8FA',
  secondaryTextColor: '#1C1E21',
  secondaryBorderColor: '#9AA1AC',
  tertiaryColor: '#FFFFFF',
  tertiaryTextColor: '#1C1E21',
  tertiaryBorderColor: '#9AA1AC',
  lineColor: '#4B5563',
  textColor: '#1C1E21',
  noteBkgColor: '#F7F8FA',
  noteTextColor: '#1C1E21',
  noteBorderColor: '#9AA1AC',
  actorBkg: '#EDF0F4',
  actorTextColor: '#1C1E21',
  actorBorder: '#4B5563',
  signalColor: '#4B5563',
  signalTextColor: '#1C1E21',
  labelBoxBkgColor: '#EDF0F4',
  labelTextColor: '#1C1E21',
  activationBkgColor: '#DCE7FB',
  sequenceNumberColor: '#FFFFFF',
  edgeLabelBackground: '#F7F8FA',
  clusterBkg: '#F7F8FA',
  clusterBorder: '#9AA1AC',
}

const DARK_VARIABLES = {
  fontFamily: 'sans-serif',
  fontSize: '14px',
  primaryColor: '#1C232E',
  primaryTextColor: '#E6E9EF',
  primaryBorderColor: '#8B96A8',
  secondaryColor: '#151A22',
  secondaryTextColor: '#E6E9EF',
  secondaryBorderColor: '#5B6472',
  tertiaryColor: '#101319',
  tertiaryTextColor: '#E6E9EF',
  tertiaryBorderColor: '#5B6472',
  lineColor: '#A3ACBB',
  textColor: '#E6E9EF',
  noteBkgColor: '#151A22',
  noteTextColor: '#E6E9EF',
  noteBorderColor: '#5B6472',
  actorBkg: '#1C232E',
  actorTextColor: '#E6E9EF',
  actorBorder: '#8B96A8',
  signalColor: '#A3ACBB',
  signalTextColor: '#E6E9EF',
  labelBoxBkgColor: '#1C232E',
  labelTextColor: '#E6E9EF',
  activationBkgColor: '#243250',
  sequenceNumberColor: '#101319',
  edgeLabelBackground: '#151A22',
  clusterBkg: '#151A22',
  clusterBorder: '#5B6472',
}

async function draw() {
  const mermaid = (await import('mermaid')).default
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'base',
    // HTML ラベルは Web フォント読込前の幅計測でラベルが切れるため SVG テキストを使う。
    // v11 で flowchart.htmlLabels は非推奨になりトップレベルの htmlLabels が優先される
    htmlLabels: false,
    flowchart: { htmlLabels: false, wrappingWidth: 320 },
    themeVariables: isDark.value ? DARK_VARIABLES : LIGHT_VARIABLES,
  })
  try {
    // 再レンダリングごとに一意な id を使う(同一 id の再利用は mermaid が失敗する)
    renderCount += 1
    const { svg: code } = await mermaid.render(`${props.id}-r${renderCount}`, decodeURIComponent(props.graph))
    svg.value = code
  } catch {
    // 構文エラー時はソースをそのまま見せる(執筆時に気づけるように)
    svg.value = `<pre>${decodeURIComponent(props.graph)}</pre>`
  }
}

onMounted(draw)
watch(isDark, draw)
</script>

<template>
  <div class="mermaid-figure" v-html="svg"></div>
</template>
