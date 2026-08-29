# LP リデザイン画像生成プロンプト(ChatGPT 用)

以下を丸ごと ChatGPT に貼り付ける。ブラウジング可能なモデル(GPT-5 系)を推奨。

---

あなたはエディトリアルデザイン出身のアートディレクターです。「AI が作ったように見えない、配色を絞った超モダンな LP」を設計するのが仕事です。3 つのステップで進めてください。

## Step 1 — 現状サイトの解析

https://node-modules-shinso.yamauz.workers.dev/ を開いて、トップページを分析してください。

- ページ構成(セクションの並びと役割)
- 配色・書体・余白のトーン
- コピー(見出し・リード・CTA)の質
- 「まだ AI 生成っぽく見える点」を厳しめに 3 つ指摘

URL が閲覧できない場合は、次の現状サマリーを前提にしてください:
生成り(#F4F2EC)の紙に深い森緑(#2E4A3C)の 2 色。見出しは明朝体。構成は「左に明朝の大見出し『そのディレクトリ、見えているのは表層だけ。』+右に node_modules / store / symlink などのラベルが乗った等角投影の積層レイヤー(WebGPU で発光が走る)」→「01/02/03 の罫線区切り 3 項目」→「深緑ベタのセクションで npm / yarn v1 / pnpm のディレクトリツリー比較」→「罫線区切りの目次(全 12 章+付録)」→「静かな CTA」。Node.js のパッケージマネージャーを仕組みから解説する日本語の技術書サイト。

## Step 2 — コピーの磨き込み

分析を踏まえ、次を日本語で 2 案ずつ提案してください。短いほど良い。

- メイン見出し(1 行 12 字以内 × 最大 2 行。現行の「そのディレクトリ、見えているのは表層だけ。」を超えるなら差し替え、超えないなら現行を採用)
- リード文(40 字以内 1 文)
- 主 CTA / 副 CTA のボタン文言(各 10 字以内)
- 比較セクションの見出し(12 字以内)

提案したら、私が選ぶのを待たずに、あなたのベスト案を 1 セット選んで Step 3 に使ってください。

## Step 3 — リデザイン案のモックアップ画像を生成

Step 1 の診断と Step 2 の採用コピーを反映した、**改善版 LP のハイファイ・デスクトップモックアップ**を画像生成してください。以下の仕様を厳守:

```text
Generate a high-fidelity desktop landing-page mockup image. Portrait (2:3), full scroll
of the page shown top to bottom as one tall screen design (not a browser screenshot,
no browser chrome, no device frame).

ART DIRECTION:
Ultra-modern Japanese editorial design. Quiet, expensive, printed-matter feeling.
STRICT two-color discipline: one warm paper neutral (off-white/cream family) and one
deep ink color (dark forest green family) — plus nothing else. No third color.
Display type: elegant Japanese mincho (serif) with generous letter-spacing.
Body/labels: small clean sans-serif and tiny monospace English labels with wide tracking.
All dividers are 1px hairlines. Huge whitespace. Asymmetric grid with one dramatic
oversized typographic moment. The only illustration: an isometric stack of thin
translucent layers (like sheets of paper) with small English monospace labels, subtly
glowing along one edge.

LAYOUT (top to bottom):
1. Minimal nav: small hexagon outline mark + wordmark left, 3 tiny links right.
2. Hero: left = the Japanese headline in large mincho, short lead line, one solid
   rectangular ink-color button and one hairline-outlined button. Right = the isometric
   layer stack.
3. A single hairline row of three numbered items ("01" "02" "03"), no boxes, no icons.
4. Full-bleed inverted section (ink color background, paper-color text): a serif heading
   and three slim monospace directory-tree columns labeled "npm" "yarn v1" "pnpm".
5. A quiet table-of-contents list with roman numerals and hairline rules.
6. One centered closing line and a single button.

TEXT RULES (critical):
Use ONLY the exact strings I list below, rendered verbatim, each exactly once.
No other readable text anywhere — where real text would exist (body copy, tree contents),
draw abstract greeked lines instead. Japanese strings must be short and typeset cleanly;
if Japanese glyphs cannot be rendered accurately, keep the headline and render all other
labels in English.
STRINGS: [ここに Step 2 で採用した見出し・リード・CTA・セクション見出しを引用符付きで列挙]
plus these fixed labels: "node_modules" "npm" "yarn v1" "pnpm" "01" "02" "03"

HARD BANS (anti-AI-slop):
No purple/blue gradients, no glassmorphism, no rounded feature cards, no emoji,
no 3D clay illustrations, no stock photos, no drop shadows on UI, no invented
metrics or star ratings, no browser mockup chrome, no italic headlines.
```

画像は 1 枚生成し、そのあと「同じレイアウトのまま、紙をわずかに暗くしてインクを墨黒に置き換えた別バリエーション」を提案として言葉で説明してください(画像はまだ生成しない)。

---

## 使い方メモ

- 日本語見出しが文字化けしたら、同じプロンプトで再生成(部分修正より速い)
- 気に入った 1 枚が出たら、その画像を添付して「Use the same style as the input image. Change only …」で差分注文する
- でき上がったモックは実装可能。採用したい画像をこのプロジェクトに貼れば、design.md を改訂して実装まで落とし込める
