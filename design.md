# Design — node_modulesの深層

Locked design system. Future Hallmark runs read this file first; pages defer
to it. Amend intentionally — the file is the rule.

## System
- Genre · editorial
- Macrostructure · studied-DNA: 非対称ヒーロー(左テキスト・右積層ビジュアル)→ 番号付きヘアライン 3 項目(ボックス禁止)→ フルブリード反転(深緑)セクション → 静かな CTA
- Theme · studied-DNA (vibe: "生成りの紙、深い森緑、明朝、積層")
- Axes · light / classical-serif (mincho) / chromatic-green

## Tokens (canonical · `docs/.vitepress/theme/tokens.css` is the source of truth)
```css
:root {
  --color-paper:      oklch(96% 0.012 95);   /* 生成り */
  --color-paper-2:    oklch(93% 0.014 95);   /* 一段沈む面 */
  --color-ink:        oklch(30% 0.045 165);  /* 深緑がかった墨 */
  --color-ink-2:      oklch(46% 0.035 165);  /* 補助テキスト */
  --color-rule:       oklch(86% 0.018 130);  /* ヘアライン */
  --color-accent:     oklch(38% 0.065 160);  /* 森緑(唯一のアクセント) */
  --color-accent-ink: oklch(96% 0.012 95);   /* アクセント上の文字 = 紙色 */
  --color-focus:      oklch(55% 0.12 160);

  --font-display: 'Shippori Mincho B1', 'Hiragino Mincho ProN', serif;
  --font-body:    'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif;
  --font-mono:    'JetBrains Mono', ui-monospace, monospace;

  /* 4-pt spacing scale: --space-3xs(4) xs(8) sm(12) md(16) lg(24) xl(32) 2xl(48) 3xl(64) 4xl(96) */
  /* Type scale 1.25: --text-sm(14) base(16) md(18) lg(22) xl(28) 2xl(36) display(clamp 40→64) */

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast: 180ms;  --dur-base: 240ms;  --dur-slow: 320ms;

  --radius-card: 2px;  --radius-input: 4px;  --radius-pill: 999px;
}
```

## CTA voice
- Primary · 森緑ベタ塗り(--color-accent)+ 紙色文字 · radius 2px · padding 14px 28px · 明朝ではなく本文書体
- Secondary · 1px の墨アウトライン、塗りなし · 同 radius

## Typography rules
- 見出し(h1/h2/ヒーロー)は明朝(--font-display)・weight 600・roman のみ(イタリック禁止)
- 本文はサンセリフ。コード・ツリー・小ラベルはモノスペース
- 英字の小ラベルは letter-spacing 0.14em の大文字トラッキング(例: COMPARE)

## Layout rules
- カードボックス・絵文字アイコン・グラデーション・グロー禁止。区切りはすべて 1px ヘアライン(--color-rule)
- 番号マーカー(01/02/03)は本当に順序があるリストのみ。番号+短い見出し+一行説明を罫線で区切る
- 影は「積層ビジュアル内の soft shadow」のみ許可。UI 要素に drop-shadow をつけない

## Motion stance
- quiet: ヒーローの積層レイヤー(呼吸・数秒おきのグリント・マウス視差)にモーションを集中。他はホバーの色/下線のみ
- Reduced-motion fallback · ≤150ms opacity crossfade、シェーダーは静止フレーム

## Variants
- dark: paper → oklch(24% 0.03 168) の深緑紙、ink → 生成り。アクセントは明るい緑 oklch(78% 0.08 155)。構造・書体は不変

## Provenance
- source: image(ユーザー提供の参考スクリーンショット、2026-08-29)
- attestation: ユーザー自身が本プロジェクトの参考として提示したモック
- confidence: 色は画像からのバンド推定(OKLCH は近似)。書体はロール抽出(明朝ディスプレイ+ゴシック本文)で、具体フォントは Hallmark が選定

## Notes(持ち込まない反パターン)
- VitePress デフォルトの hero/features グリッド(絵文字アイコン+角丸カード)は廃止済み。復活させない
- 偽メトリクス・でっち上げの実績数値を書かない
- 紫〜青グラデーション、glassmorphism、bento グリッドに回帰しない
