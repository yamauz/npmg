<script setup>
// vitepress-plugin-mermaid の Mermaid コンポーネントを上書きする自前実装。
// 理由: プラグインはダークモードで theme: 'dark' を強制し、design.md のパレットを潰す。
// 本書の Mermaid 図は「生成りのカード上の図版」なので、ライト/ダーク共通で同じ描画にする。
import { onMounted, ref } from 'vue'

const props = defineProps({
  id: { type: String, required: true },
  graph: { type: String, required: true },
})

const svg = ref('')

// design.md v2(白×墨×ブルー)に対応する固定パレット(モード共通・白カード上に描画)
const THEME_VARIABLES = {
  // Web フォントは幅計測とズレて文字が切れるため system 書体を使う
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

onMounted(async () => {
  const mermaid = (await import('mermaid')).default
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'base',
    // HTML ラベルは Web フォント読込前の幅計測でラベルが切れるため SVG テキストを使う
    flowchart: { htmlLabels: false },
    themeVariables: THEME_VARIABLES,
  })
  try {
    const { svg: code } = await mermaid.render(props.id, decodeURIComponent(props.graph))
    svg.value = code
  } catch {
    // 構文エラー時はソースをそのまま見せる(執筆時に気づけるように)
    svg.value = `<pre>${decodeURIComponent(props.graph)}</pre>`
  }
})
</script>

<template>
  <div class="mermaid-figure" v-html="svg"></div>
</template>
