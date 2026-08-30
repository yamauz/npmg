# Design — node_modulesの深層

Locked design system. Future Hallmark runs read this file first; pages defer
to it. Amend intentionally — the file is the rule.

## System
- Genre · modern-minimal
- Macrostructure · studied-DNA v2: ドキュメントサイトの「静かな玄関」。背面オーバーレイの依存グラフ星座(WebGPU)+左寄せヒーロー → 罫線区切りの章索引(2 列)→ 静かな締め CTA。章ページは VitePress ドキュメントレイアウトに同トークンを適用
- Theme · studied-DNA (vibe: "白、墨、ブルー 1 点、ヘアライン、余白")
- Axes · light / clean-sans / chromatic-blue

## Tokens (canonical · `docs/.vitepress/theme/tokens.css` is the source of truth)
```css
:root {
  --color-paper:         #FAFAFA;
  --color-paper-2:       #F1F2F4;
  --color-ink:           #1C1E21;
  --color-ink-2:         #4B5563;
  --color-ink-3:         #9AA1AC;
  --color-rule:          #E4E6EA;
  --color-accent:        #2563EB; /* 唯一のアクセント */
  --color-accent-strong: #1D4ED8;
  --color-accent-ink:    #FFFFFF;

  --font-display: 'Noto Sans JP', sans-serif; /* 見出しもサンセリフ。ウェイト 700 で立てる */
  --font-body:    'Noto Sans JP', sans-serif;
  --font-mono:    'JetBrains Mono', ui-monospace, monospace;

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast: 180ms;  --dur-base: 240ms;  --dur-slow: 320ms;
  --radius-card: 3px;  --radius-input: 4px;
}
```

## CTA voice
- Primary · ブルーベタ塗り(--color-accent)+ 白文字 · radius 3px · padding 13px 30px · weight 600
- Secondary · 1px の ink-3 アウトライン、塗りなし · 同 radius

## Typography rules
- すべてサンセリフ(明朝・セリフは使わない)。見出しは weight 700 + わずかな letter-spacing、roman のみ(イタリック禁止)
- コード・ツリー・小ラベル・英字 eyebrow はモノスペース(letter-spacing 0.14em の大文字トラッキング)

## Layout rules
- カードボックス・絵文字アイコン・グラデーション・グロー・drop-shadow 禁止。区切りはすべて 1px ヘアライン(--color-rule)
- アクセント(ブルー)の使用は 1 画面 3 箇所程度まで(ボタン、章番号、図中の 1 点など)
- 大胆さの予算は 1 箇所: トップのヒーロー星座(WebGPU)。他は徹底して静かに
- 番号マーカーは本当に順序があるリストのみ

## Hero constellation (WebGPU / vgpu)
- `docs/.vitepress/theme/hero-shader.js`(NETWORK_WGSL)+ `HeroNetwork.vue`
- 鉄則: 線幅は fwidth ベース約 1 物理 px/エッジはノード座標から毎フレーム導出/青は 1 点だけ/ワイド画面は S=clamp(aspect×0.6, 1, 1.9) で一様拡大
- 動きは「依存解決」のメタファー限定: ドローイン(1 回)、リゾルブ・シグナル(7 秒周期)、カーソル・プローブ、漂い、視差

## Motion stance
- quiet: 動きの主役はヒーロー星座のみ。他はホバーの色/下線と TermDemo のタイピングだけ
- Reduced-motion fallback · ≤150ms opacity crossfade、シェーダーは静止フレーム

## Variants
- dark: paper #101319 / paper-2 #151A22 / ink #E6E9EF / rule #262B34 / accent #5B8CFF(accent-ink #0D1117)。構造・書体は不変。シェーダーは dark uniform で同一図形をパレット補間
- Mermaid 図・本文図版は両モード共通で「明るいカード」に載せる(図版は白背景で生成される前提)

## Components
- Mermaid: 自前 MermaidView.vue(プラグインの dark 強制を上書き)。パレットは白カード+墨+ブルー系
- TermDemo: ダーク画面(#14181F)+ブルーのプロンプト/カーソル。信号機ドット等の偽チュローム禁止
- 図版プロンプト(全 39 点): 白背景・navy #1E293B・blue #2563EB・gray #E2E8F0・orange 控えめ(詳細は付録C)

## Provenance
- source: image(ユーザー提供の参考モックアップ 2 点、2026-08-29〜30)。v1(生成り×深緑×明朝)は 2026-08-30 に本 v2 で置換
- confidence: 色はモックからの読み取り値をユーザーが実機確認済み

## Notes(持ち込まない反パターン)
- VitePress デフォルトの hero/features(絵文字カード)に戻さない
- 生成り×深緑×明朝(旧 v1)、黒背景×蛍光色のポスター調(v2 検討時に却下)に戻さない
- 紫〜青グラデーション、glassmorphism、偽メトリクス禁止
- Vue scoped style 内の `:global()` は使わない(コンパイル事故 2 回)
