# この本について

本書は **npmg**(**N**ode.js **P**ackage **M**anager **G**uide)。Node.js のパッケージマネージャーを仕組みから理解するためのオンライン教科書です。

`npm install` と打てばライブラリが入る。`yarn dev` と打てば開発サーバーが立ち上がる。私たちは毎日パッケージマネージャーを使っています。それなのに、こう聞かれると意外と答えられません。

- `node_modules` の中身は、どういうルールで並んでいるのか
- `package-lock.json` や `yarn.lock` は、何のためにあるのか
- なぜ yarn が生まれ、なぜいま pnpm を選ぶチームが多いのか

この本は、そうした「毎日使っているのに説明できない仕組み」を、図解を交えて一段ずつ理解していくための教科書です。前半でパッケージ管理の基礎と歴史を押さえ、後半では pnpm を題材に、モダンなパッケージマネージャーの内部構造と実務機能を深く掘り下げます。

## 対象読者

次のような方を想定しています。

- `npm install` や `yarn add` を使ったことがあるフロントエンド/Node.js 開発者
- パッケージマネージャーを「おまじない」として使っていて、仕組みを一度きちんと理解したい方
- npm / yarn / pnpm のどれを選ぶべきか、根拠を持って判断したい方

Node.js そのものの入門(JavaScript の文法、モジュールの書き方)は扱いません。逆に、パッケージマネージャーの経験は npm だけで十分です。yarn や pnpm を触ったことがなくても読み進められます。

## この本で何がわかるか

読み終えると、次のことができるようになります。

- パッケージマネージャーが「何を」「どういう手順で」しているかを説明できる
- `node_modules` の構造(フラット化、hoisting、phantom dependency)を図で描ける
- ロックファイルの役割と、コミットすべき理由を人に説明できる
- npm → yarn → pnpm という変遷を、それぞれが解決した課題とともに語れる
- 最新世代の題材として pnpm のストア構造とリンク戦略を理解し、各ツールの設計思想の違いを説明できる
- phantom dependency やビルドスクリプト起因の典型的なトラブルに、正体を理解した上で対処できる

## 構成

全 12 章 + 付録の 4 部構成です。前から順に読むことを想定していますが、章間の参照を細かく張ってあるので、気になるところから拾い読みしても迷わないはずです。たとえば「昨日まで動いていた CI が突然壊れた」の正体を知りたければ 3〜4 章、ツールの選び方の判断軸がほしければ 7 章、モダンなパッケージマネージャーの内部に潜りたければ Part III が入口になります。

<figure>
  <img src="/images/fig-intro-structure.png" alt="この本の構成">
  <figcaption><span class="fig-num">図 0-1</span> この本の構成</figcaption>
</figure>

::: details 図 0-1 の ChatGPT 生成プロンプト(クリックで展開)

```text
STYLE PRESET (apply exactly; keep consistent with all previous diagrams in this series):
Flat 2D vector infographic in a minimal technical-illustration style. Landscape orientation (3:2).
Pure white background (#FFFFFF). Limited palette: near-black ink #1C1E21 for text and outlines,
blue #2563EB as the single primary accent, light gray #E2E8F0 for container boxes,
orange #F59E0B for highlights only. Uniform medium-weight rounded strokes, simple geometric
icons, generous white space, clear visual hierarchy.
No gradients, no shadows, no 3D, no textures, no photorealism, no decorative background elements.
All labels in English, short (1-3 words), bold sans-serif, high contrast, perfectly legible.
Render every quoted label verbatim, exactly once, with no extra, invented, or duplicated text.
No text other than the labels listed below.

DIAGRAM CONTENT:
LAYOUT: Two separate rows with clear vertical white space between them and no connecting line
between the rows. The top row is 3 equally sized light gray rounded rectangles, evenly spaced,
connected left to right by blue arrows. The bottom row is one wide light gray rounded rectangle
spanning the full width of the top row, completely detached from the boxes above it.
ELEMENTS:
- Box 1 (light gray, book icon) with two lines of text: "Part I" then "Basics"
- Box 2 (light gray, clock icon) with two lines of text: "Part II" then "History"
- Box 3 (light gray, layered disks icon) with two lines of text: "Part III" then "pnpm"
- Wide bottom box (light gray, bookmark icon) labeled "Appendix"
ARROWS: exactly two arrows, both blue and horizontal: one from Box 1 to Box 2, one from Box 2
to Box 3. No other lines or connectors anywhere in the diagram.
```

:::

| Part | 章 | 内容 |
| --- | --- | --- |
| Part I: 基礎を知る | 1〜4 章 | パッケージマネージャーの役割、package.json、node_modules、ロックファイル |
| Part II: 変遷を知る | 5〜7 章 | npm・yarn・pnpm がそれぞれ何を解決するために生まれたか |
| Part III: pnpm を知る | 8〜12 章 | pnpm の使い方、内部構造、アドバンテージ、ワークスペース、実務機能 |
| 付録 | A〜C | コマンド対照表、用語集、図版の生成ガイド |

## 手を動かしながら読めます

多くの章に「実験」セクションがあります。ターミナルでコマンドを実行し、実際の出力を見ながら仕組みを確認する構成です。Node.js 20 以降がインストールされていれば、追加の準備はほとんど必要ありません。実験用の使い捨てディレクトリ(例: `~/pm-sandbox`)を 1 つ用意しておくと便利です。

## 表記について

- コマンドは `$` プロンプト付きで示します。`$` は入力しません。
- 出力例は執筆時点(2026 年 8 月)のバージョンでの実行結果です。バージョン番号などは手元と異なることがあります。
- 「パッケージマネージャー」は文脈上明らかな場合「PM」と略すことがあります。

それでは、第 1 章「パッケージマネージャーとは何か」からはじめましょう。
