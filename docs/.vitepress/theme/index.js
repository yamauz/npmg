import DefaultTheme from 'vitepress/theme'
import HomeShinso from './HomeShinso.vue'
import MermaidView from './MermaidView.vue'
import TermDemo from './TermDemo.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('HomeShinso', HomeShinso)
    app.component('TermDemo', TermDemo)
    // vitepress-plugin-mermaid が注入する Mermaid を上書きする
    // (プラグンはダークモードで theme: 'dark' を強制するため。詳細は MermaidView.vue)
    app.component('Mermaid', MermaidView)
  },
}
