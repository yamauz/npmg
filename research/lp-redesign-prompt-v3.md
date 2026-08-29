# LP リデザイン画像生成プロンプト v3(ChatGPT 用)

- v1 の失敗: 現行デザインを解析させて引きずられた
- v2 の失敗: 「最も大胆に」と命じたため、黒×蛍光のポスター(anti-slop 系の新クリシェ)に振り切れた
- v3 の方針: **用途(ドキュメントサイトの玄関)と温度(静か・白ベース)を先に固定**し、その範囲内で品質を競わせる

---

あなたはドキュメントサイトやデジタルプロダクトのデザインに長けたデザイナーです。派手なキャンペーン LP ではなく、**毎日読まれる技術ドキュメントの「静かな玄関」**を設計してください。

## 題材

日本語のオンライン技術書『node_modulesの深層』。Node.js のパッケージマネージャー(npm / yarn / pnpm)を「使い方」ではなく「仕組み」から解剖する教科書。テーマは深さ・階層・隠れた構造。全 12 章+付録。読者は初中級のフロントエンドエンジニア。このページの仕事はただ一つ、「読み始めてもらうこと」。

## 温度の固定(最重要)

- **白ベース**(#FFFFFF〜#FAFAFA)。黒ベース・蛍光色・クリーム色の紙はすべて禁止
- 気分は「上質な技術書の扉」「Stripe や Linear のドキュメントの落ち着き」。ポスターではない
- 大胆さの予算は **1 箇所だけ**。ヒーローのタイポグラフィか、1 つの精密なダイアグラム、どちらかに使う。残りは徹底して静かに
- インクは黒に近いニュートラル 1 色+**アクセント 1 色のみ**(彩度控えめ。紫グラデ禁止)。アクセントの使用箇所は 3 箇所以内
- 装飾より余白と整列。罫線は使ってよいが 1px のヘアラインのみ

## Step 1 — 静かな方向性を 3 案

すべて「白ベース・落ち着き」の範囲内で、性格の違う 3 案を出してください(各 3 行):

- 名前/アクセント 1 色(hex)/書体の気分(明朝は禁止)/「深さ・階層」をどう *控えめに* 視覚化するか

例えるなら: 精密な線画ダイアグラム派、タイポグラフィと余白だけ派、細密グリッド+小さな図版群派…など。**互いに似ないこと。**

## Step 2 — 最も「静かで上質」な 1 案でコピーを書く

最も静かで、それでいて安っぽくない案を自分で選び、日本語コピーを書く:

- メイン見出し(12 字以内 × 最大 2 行。命令形や煽りは禁止。知的で静かに)
- リード 1 文(40 字以内)
- CTA 2 つ(各 10 字以内)

## Step 3 — モックアップ画像を生成

```text
Generate a high-fidelity desktop mockup image of a documentation-site landing page.
Portrait (2:3), full page top to bottom. No browser chrome, no device frame.

MOOD: The quiet entrance of a well-crafted technical book. Calm, white-based,
utilitarian elegance — closer to excellent developer-documentation portals than to
marketing sites. A reader should feel invited to start reading, not shouted at.

ART DIRECTION: [Step 1 で選んだ案を反映。白背景 + near-black ink + アクセント 1 色(hex 固定)]
Typography-led. Generous whitespace, tight grid, 1px hairline rules only.
Exactly ONE bold moment on the whole page (a large refined headline OR one precise
technical diagram of nested structure) — everything else stays small and quiet.

STRUCTURE: A calm vertical rhythm suited to a documentation entrance:
slim nav / hero with headline + one-line lead + two small buttons / a modest section
hinting at the book's structure (chapter list or a small precise diagram) /
a quiet closing CTA. Do NOT use three feature cards with icons.

TEXT RULES (critical): Use ONLY these exact strings, verbatim, each exactly once:
[Step 2 のコピーを引用符付きで列挙] plus "node_modules" "npm" "yarn" "pnpm".
All other text areas: abstract greeked lines (thin gray bars), no readable text.
If Japanese glyphs cannot render accurately, keep only the headline in Japanese.

HARD BANS: dark/black backgrounds, neon or acid colors, oversized poster typography
bleeding off-canvas, cream paper + forest green, mincho-serif mood, isometric stacked
layers, purple/blue gradients, glassmorphism, rounded feature cards with icons, emoji,
3D clay, stock photos, drop shadows, invented metrics, browser chrome, italic headlines.
```

生成後、残り 2 案の一言自己評価を添えてください。「◯◯案も見せて」と言われたら同仕様で画像化。

---

## 使い方メモ

- 「もう少しだけ表情がほしい」ときは、採用画像を添付して「Use the same style. Make only the diagram slightly more prominent.」のように 1 点ずつ
- 決まったらこのプロジェクトに貼れば、design.md を改訂して実装まで落とし込む
