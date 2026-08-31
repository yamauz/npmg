// theme ではなく theme-without-fonts。既定テーマは Inter を同梱し
// <link rel=preload> で最優先ダウンロードするが、この本の書体は
// Noto Sans JP + JetBrains Mono なので 66KB が丸ごと無駄になり、
// しかも preload が LCP と帯域を奪い合う。fonts.css 以外は同一。
import DefaultTheme from 'vitepress/theme-without-fonts'
import CopyMarkdown from './CopyMarkdown.vue'
import HomeShinso from './HomeShinso.vue'
import { defineAsyncComponent } from 'vue'
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
    // (プラグインはダークモードで theme: 'dark' を強制するため。詳細は MermaidView.vue)
    // 非同期にするのは mermaid のチャンク (174KB) を切り離すため。静的 import だと
    // 図のない TOP でも modulepreload に載り、LCP の前に帯域を持っていかれる。
    app.component(
      'Mermaid',
      defineAsyncComponent(() => import('./MermaidView.vue')),
    )
  },
}
