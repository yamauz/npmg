# 執筆ガイド(本書共通の「型」)

『node_modulesの深層』全章に適用する執筆ルール。参考サイト『RustではじめるCPUとGPU』の型を模倣する。

## 読者と文体

- 対象読者: `npm install` を使ったことがある初中級のフロントエンド/Node.js 開発者。yarn / pnpm は未経験でもよい。
- 文体: です・ます調。見出しと箇条書きは体言止め。「〜してみます」「〜を確認してください」と読者を実践に誘導する。
- 比喩: 日常の物に置き換える具体的な比喩を 1 章に 1〜2 個入れる(例: 「ロックファイルは買い物リストの控え」)。
- 相互参照: 「3章で見たように」と章番号で頻繁に前章を参照する。リンクは相対パスで張る(例: `[3章](/basics/03-node-modules)`)。
- 分量: 1 章 3,500〜8,000 字。概念章は短め、実践章は長め。各セクション 900〜1,000 字程度。
- 用語: 初出時に英語表記を併記(例: 「幻の依存(phantom dependency)」)。「パッケージマネージャー」表記で統一。

## 章テンプレート

```md
# N. 章タイトル

(導入 2〜3 文。前章の内容を受けて、この章の問いを立てる)

::: tip この章でわかること
- (学習ゴールを 3〜4 項目、動詞で終える)
:::

## セクション見出し(## のみ使用、### は控えめに)

(本文)

## 実験: 〜を確認する

(コマンド + 実際の出力例。出力例は現実的な値で捏造感のないものにする)

## まとめ

- (要点 4〜5 項目の箇条書き)

次章では〜を説明します。
```

- 補足コラムは `::: info なぜ〜なのか` 形式の「疑問に答える見出し」ボックスで、1 章 0〜3 個。
- 警告は `::: warning` を必要な箇所のみ。
- コードブロックはサンドイッチ型: 前に目的を述べ、後ろで要点を解説する。シェルは ```sh、出力例もコードブロックで示す。プロンプトは `$` 付き。

## 図版プレースホルダー(最重要・厳守)

画像は多め(1 章 2〜4 点)。番号は `図 N-M`(N=章番号)。ファイル名は `fig-NN-M.png`(章番号 2 桁)。以下の形式を**一字一句この構造で**使う:

```md
<!-- 🖼️ 画像プレースホルダー: 生成した画像を docs/public/images/fig-03-1.png に保存し、下の行のコメントを外してください -->
<!-- ![図 3-1: キャプション](/images/fig-03-1.png) -->

> **🖼️ 図 3-1|キャプション**(画像プレースホルダー)
> 生成後は `docs/public/images/fig-03-1.png` に配置してください。

::: details 図 3-1 の ChatGPT 生成プロンプト(クリックで展開)

​```text
(スタイルプリセット + DIAGRAM CONTENT)
​```

:::
```

(上の ```text の前の不可視文字は無視すること。実際にはふつうのコードフェンスを書く)

### プロンプトの書き方

プロンプトは英語。**毎回、下のスタイルプリセットを一字一句そのまま冒頭に貼り**、続けて `DIAGRAM CONTENT:` 以下に LAYOUT / ELEMENTS / ARROWS をセクション分けで書く。

ルール:
- 図中に表示する文字列はすべて二重引用符で明示し、それ以外のテキストを禁止する(プリセットが宣言済み)
- ラベルは英語 1〜3 語、8〜10 個以内。超えるなら図を分割する
- 矢印にもラベルを付ける場合は `a labeled arrow reading "resolve" pointing from "A" to "B"` の形式
- 数値やベンチマーク結果を図中に入れない(数値は本文で示す)

スタイルプリセット(全プロンプト共通・改変禁止):

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

## 目次と章の対応(リンクパス)

- はじめに: `/introduction`
- 1. パッケージマネージャーとは何か: `/basics/01-what-is-a-package-manager`
- 2. package.json とバージョン範囲: `/basics/02-package-json-and-semver`
- 3. node_modules の構造: `/basics/03-node-modules`
- 4. ロックファイルの役割: `/basics/04-lockfiles`
- 5. npm の誕生と進化: `/history/05-npm`
- 6. yarn の登場と分岐: `/history/06-yarn`
- 7. pnpm と新世代ツール: `/history/07-pnpm-and-next-gen`
- 8. pnpm はじめの一歩: `/pnpm/08-getting-started`
- 9. pnpm の仕組み — ストアとリンク: `/pnpm/09-how-pnpm-works`
- 10. pnpm のアドバンテージ総覧: `/pnpm/10-advantages`
- 11. ワークスペースとモノレポ: `/pnpm/11-workspaces`
- 12. 実務で効く機能たち: `/pnpm/12-practical-features`
- 付録A. コマンド対照表: `/appendix/a-command-cheatsheet`
- 付録B. 用語集: `/appendix/b-glossary`
- 付録C. 図版を ChatGPT で生成する: `/appendix/c-image-generation`

ファイルの実体は `docs/` 配下(例: `docs/basics/01-what-is-a-package-manager.md`)。

## 事実の正確性

- pnpm 関連の章(8〜12 章、および 7 章の一部)は `research/pnpm-facts.md` の事実集に**必ず**依拠する。バージョン番号・設定名・コマンド名を憶測で書かない。
- 執筆時点は 2026 年 8 月として書く。
