import DefaultTheme from 'vitepress/theme'
import CopyMarkdown from './CopyMarkdown.vue'
import HomeShinso from './HomeShinso.vue'
import MermaidView from './MermaidView.vue'
import TermDemo from './TermDemo.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomeShinso', HomeShinso)
    app.component('TermDemo', TermDemo)
    // H1 の直後に markdown-it 側から差し込まれる(config.mts の markdown.config)
    app.component('CopyMarkdown', CopyMarkdown)
    // vitepress-plugin-mermaid が注入する Mermaid を上書きする
    // (プラグンはダークモードで theme: 'dark' を強制するため。詳細は MermaidView.vue)
    app.component('Mermaid', MermaidView)
  },
}
