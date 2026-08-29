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

// design.md のトークンに対応する固定パレット(モード共通)
const THEME_VARIABLES = {
  // Web フォントは幅計測とズレて文字が切れるため system 書体を使う
  fontFamily: 'sans-serif',
  fontSize: '14px',
  primaryColor: '#ECEAE0',
  primaryTextColor: '#22392E',
  primaryBorderColor: '#3E5C4B',
  secondaryColor: '#F7F5EF',
  secondaryTextColor: '#22392E',
  secondaryBorderColor: '#8FA598',
  tertiaryColor: '#FFFFFF',
  tertiaryTextColor: '#22392E',
  tertiaryBorderColor: '#8FA598',
  lineColor: '#3E5C4B',
  textColor: '#22392E',
  noteBkgColor: '#F7F5EF',
  noteTextColor: '#22392E',
  noteBorderColor: '#8FA598',
  actorBkg: '#ECEAE0',
  actorTextColor: '#22392E',
  actorBorder: '#3E5C4B',
  signalColor: '#3E5C4B',
  signalTextColor: '#22392E',
  labelBoxBkgColor: '#ECEAE0',
  labelTextColor: '#22392E',
  activationBkgColor: '#DCE5DD',
  sequenceNumberColor: '#F4F2EC',
  edgeLabelBackground: '#F7F5EF',
  clusterBkg: '#F7F5EF',
  clusterBorder: '#8FA598',
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
