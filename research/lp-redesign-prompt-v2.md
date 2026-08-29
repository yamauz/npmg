# LP リデザイン画像生成プロンプト v2(ChatGPT 用)

v1 の失敗: 現行サイトを解析させ、現行のスタイル(生成り×深緑×明朝×積層)をプロンプトに書き込んだため、引きずられた。
v2 の方針: 現行の見た目は「禁止リスト」に回し、コンテンツの本質だけを渡してゼロベースで発散させる。

---

あなたは受賞歴のあるアートディレクターです。既存のデザインを一切参照せず、ゼロから LP のアートディレクションを立ち上げてください。

## 題材(コンテンツの本質だけ)

日本語のオンライン技術書『node_modulesの深層』。Node.js のパッケージマネージャー(npm / yarn / pnpm)を「使い方」ではなく「仕組み」から解剖する教科書で、テーマは**深さ・階層・隠れた構造**。毎日 `npm install` と打っている開発者に「その下で何が起きているか」を見せる。全 12 章+付録。読者は初中級のフロントエンドエンジニア。

## 重要な前提(これが今回の依頼理由)

この LP の現行版は「生成りの紙 × 深い森緑 × 明朝体 × 等角投影の積層レイヤー」という editorial 調です。**この組み合わせの面影が残ったら失敗です。** 色相・書体の気分・ヒーローのモチーフ、すべて別の星から持ってきてください。

## Step 1 — 方向性を 3 案、互いに遠く

カテゴリの異なるデザイン系統から 3 方向を提案してください。各案 4 行以内で:

- 名前(コードネーム)
- コンセプト 1 文(題材の「深さ・階層」をどう視覚化するか)
- 配色(**最大 2 色+無彩色**。hex 明記。紫系グラデーションは禁止)
- 書体の気分とヒーローのモチーフ

系統の例(あくまで例。これ以外でも良い): ターミナル/蛍光モノクローム、スイス・インターナショナル(強グリッド+単色アクセント)、ブルータリズム(超特大タイポ)、設計図/ブループリント、リソグラフ印刷(特色 2 色+粒子)、写植時代の科学雑誌、キネティックタイポグラフィ。

## Step 2 — 最も大胆な 1 案でコピーを書く

3 案から**最も大胆なもの**を自分で選び、その世界観で日本語コピーを書いてください:

- メイン見出し(12 字以内 × 最大 2 行。「仕組みを知る快感」を煽る。説明文にしない)
- リード 1 文(40 字以内)
- CTA 2 つ(各 10 字以内)

## Step 3 — モックアップ画像を生成

選んだ方向性とコピーで、LP のハイファイ・デスクトップモックアップを 1 枚生成。仕様:

```text
Generate a high-fidelity desktop landing-page mockup image. Portrait (2:3), the full
page shown top to bottom as one tall screen design. No browser chrome, no device frame.

ART DIRECTION: [Step 1 で選んだ案をここに反映。配色は最大 2 色+無彩色、hex を固定]

STRUCTURE: Invent the section rhythm yourself — do NOT default to
"hero → three feature cards → CTA". At least one section must break the grid
(oversized type bleeding off-canvas, vertical text, extreme asymmetry, a full-bleed
diagrammatic moment, etc.). The page must feel art-directed, not templated.

TEXT RULES (critical): Use ONLY these exact strings, verbatim, each exactly once:
[Step 2 のコピーを引用符付きで列挙] plus "node_modules" "npm" "yarn" "pnpm".
Everywhere else, use abstract greeked lines instead of readable text.
If Japanese glyphs cannot render accurately, keep only the headline in Japanese.

HARD BANS: cream/off-white paper + forest green combination, mincho-serif editorial
mood, isometric stacked layers, purple or blue gradients, glassmorphism, rounded
feature cards, emoji, 3D clay, stock photos, drop shadows, invented metrics,
browser mockup chrome, italic headlines.
```

生成後、残り 2 案についても「画像化する価値があるか」を一言ずつ自己評価してください。私が「◯◯案も見せて」と言ったら、同じ仕様(TEXT RULES / HARD BANS は共通)でその案を画像化してください。

---

## 使い方メモ

- 3 方向の発散が良ければ、残り 2 案も画像化させて見比べるのが速い
- 日本語が文字化けしたら同じプロンプトで再生成
- 決まった 1 枚をこのプロジェクトに貼れば、Hallmark study で DNA 抽出 → design.md 改訂 → 実装まで落とし込める(WebGPU モチーフも新方向に合わせて作り直し可能)
