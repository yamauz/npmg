# 付録C. 図版を ChatGPT で生成する

本書の図版は、すべて「画像プレースホルダー + ChatGPT 用生成プロンプト」の形で埋め込まれています。この付録では、各図に付属するプロンプトをそのまま使って画像を生成し、差し替えるための手順と、プロンプトの背後にある設計意図(=技術図解を正確に生成させるためのプラクティス)をまとめます。

::: tip この付録でわかること
- 本書のプレースホルダーを実画像に差し替える手順を実行できる
- ChatGPT に図中テキストを正確に描かせるコツを説明できる
- 複数の図でスタイルを統一する方法を使える
- 図を修正・再生成するときの正しい進め方を選べる
:::

## 差し替えの手順

各章の図版プレースホルダーは、次の 3 点セットで構成されています。

1. コメントアウトされた画像タグ(差し替え先のパス入り)
2. プレースホルダーである旨の引用ブロック
3. `::: details` に折りたたまれた生成プロンプト

差し替えは次の 4 ステップです。

```text
1. details を開き、プロンプト全文(STYLE PRESET から最後まで)をコピー
2. ChatGPT に貼り付けて画像を生成(必要なら数回リトライ)
3. 生成画像を docs/public/images/fig-XX-Y.png として保存
4. md ファイル内のコメントアウトされた ![...](...) の行のコメントを外し、
   引用ブロック(> 🖼️ ...)を削除(details のプロンプトは記録として残してもよい)
```

::: info なぜプロンプトを details に残しておくのか
図を後から修正したくなったとき、元のプロンプトがあれば「同じスタイルで内容だけ変える」再生成が簡単にできるからです。画像と一緒にプロンプトをバージョン管理しておくのは、図版を Mermaid のソースと同じ感覚で扱うということです。
:::

## 本書のプロンプトの設計意図

各プロンプトは OpenAI 公式の画像生成プロンプトガイド(Cookbook)の推奨に沿って設計しています。仕組みを知っておくと、自分で図を追加するときにも応用できます。

### 1. 表示する文字列は引用符で囲み、verbatim 指定する

画像モデルの最大の弱点は文字です。対策の定石は次の 3 つです。

- 描画したい文字列は **必ず二重引用符で囲む**(`a box labeled "Registry"`)
- **一字一句そのまま描け、余計な文字を足すな**と明示する(本書のプリセットの `Render every quoted label verbatim, exactly once...` がこれ)
- **列挙したラベル以外のテキストを禁止**する(`No text other than the labels listed below.`)

ラベルは英語 1〜3 語に絞ります。小さい文字や高密度なテキストは崩れやすいためです。誤字が出たら部分修正を指示するより、**同じプロンプトで再生成**するほうが早く済みます。

### 2. スタイルプリセットを毎回、全文貼る

複数の図でスタイルを揃える最も確実な方法は、**同じスタイル指定文を全プロンプトの冒頭に毎回貼る**ことです。「さっきと同じスタイルで」という文脈依存の指示は、枚数を重ねるほど少しずつズレていきます(ドリフト)。公式ガイドも「維持したい項目のリストを毎回繰り返せ」と明言しています。

本書の全図が共有するプリセットは次のとおりです。

```text
STYLE PRESET (apply exactly; keep consistent with all previous diagrams in this series):
Flat 2D vector infographic in a minimal technical-illustration style. Landscape orientation (3:2).
Pure white background (#FFFFFF). Limited palette: dark navy #1E293B for text and outlines,
blue #3B82F6 as the single primary accent, light gray #E2E8F0 for container boxes,
orange #F59E0B for highlights only. Uniform medium-weight rounded strokes, simple geometric
icons, generous white space, clear visual hierarchy.
No gradients, no shadows, no 3D, no textures, no photorealism, no decorative background elements.
All labels in English, short (1-3 words), bold sans-serif, high contrast, perfectly legible.
Render every quoted label verbatim, exactly once, with no extra, invented, or duplicated text.
No text other than the labels listed below.
```

ポイントは次の 4 点です。

- **色は hex コードで 3〜5 色に限定**する。「いい感じの配色で」は毎回違う結果になります
- **ネガティブ指示**(no gradients, no 3D, ...)がフラットデザインの安定に最も効きます
- フォントは特定フォント名でなく「bold sans-serif」のような**分類指定**が現実的です
- 気に入った 1 枚ができたら、それを**参照画像としてアップロード**し「Use the same style as the input image. Change only the content.」と指示する方法も有効です

### 3. レイアウトはセクション分けで指示する

構図は一段落の長文ではなく、`LAYOUT:` `ELEMENTS:` `ARROWS:` のように**ラベル付きセクション+改行**で書きます。「左に◯◯、右に◯◯、ラベル付き矢印で接続」レベルの空間指示はかなり正確に反映されます。矢印にラベルを付けるときは次の形式が確実です。

```text
A labeled arrow reading "resolve" pointing from "package.json" to "Registry".
```

ただし、ピクセル単位の整列や等間隔グリッドは保証されません。**ラベル付き要素 5〜7 個+矢印数本**が安定圏です。本書の図がどれも要素数を絞ってあるのはこのためで、8〜10 個を超える内容は図を分割しています。

### 4. アスペクト比は 3 種類だけ

ChatGPT の画像生成で指定できる比率は実質 3 つです。

| 指定 | 比率 | サイズ |
| --- | --- | --- |
| square | 1:1 | 1024×1024 |
| landscape | 3:2 | 1536×1024 |
| portrait | 2:3 | 1024×1536 |

16:9 は指定できません。本書のプリセットが `Landscape orientation (3:2)` としているのはこのためです。横長で生成し、必要ならトリミングしてください。

### 5. 日本語ラベルは避ける

非ラテン文字の描画は依然として弱点です。短い単語ならおおむね正確ですが、漢字の多い語や長文は崩れたり、存在しない文字が生まれたりします。本書が**図中ラベルを英語に統一し、日本語の説明は本文とキャプションで補う**方針を取っているのはこのためです。どうしても日本語を入れる場合は、2〜6 文字の短い語を少数に限定し、引用符で明示して、崩れたら再生成してください。

## やってはいけないこと

- ❌ 1 つのプロンプトに情報を全部盛りにする(きれいなベース → 1 点ずつ修正、が正解)
- ❌ 誤字の部分修正に固執する(再生成のほうが早い)
- ❌ ベンチマーク数値や正確なデータを図中の文字で伝えようとする(捏造されます。数値は本文の表で)
- ❌ スタイル指定を「前と同じで」と文脈任せにする(ドリフトします)
- ❌ 無関係な図を同じチャットで作り続ける(前の文脈が混入します。シリーズごとにチャットを分ける)

## 修正したいときの進め方

生成結果が惜しいときは、ゼロから書き直すのではなく次の順で進めます。

1. **1 点だけ**修正を指示する(「"Registry" のボックスを右端に移動。他はすべて維持」)
2. その際も**プリセット(維持したい項目)を再掲**する
3. 2〜3 回直して改善しなければ、プロンプト自体を修正して新規生成に切り替える

::: info トップページについて
トップページのビジュアル(積層レイヤー)は画像ではなく、WebGPU シェーダー(vgpu)によるリアルタイム描画です。差し替え不要です。本文中の図版のみが本付録の対象です。
:::

## 出典

本付録は次の資料に基づいています。

- [OpenAI Cookbook: GPT Image Generation Models Prompting Guide](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide)
- [OpenAI Cookbook: gpt-image-1.5 Prompting Guide](https://developers.openai.com/cookbook/examples/multimodal/image-gen-1.5-prompting_guide)
- [Prompt Engineering Guide: 4o Image Generation](https://www.promptingguide.ai/guides/4o-image-generation)
- [Learn Prompting: GPT-4o Image Generation Guide](https://learnprompting.org/blog/guide-openai-4o-image-generation)
