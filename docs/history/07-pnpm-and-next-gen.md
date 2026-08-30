# 7. pnpm と新世代ツール

npm が土台を築き、yarn が競争を持ち込んだ——ここまでが前章までの物語でした。この章では第三の主役 pnpm の登場と、ランタイムごと作り直す Bun・Deno という新世代、そして 2026 年現在の勢力図までを一気に見渡します。Part II の総仕上げとして、「結局どれを選べばいいのか」にも本書なりの答えを出します。

::: tip この章でわかること

- pnpm が生まれた動機と、その基本コンセプトを説明できる
- Bun・Deno がパッケージマネージャーの地図のどこに位置するかを言える
- 2026 年時点の npm / yarn / pnpm / Bun の勢力図を把握できる
- Corepack の顛末と、いまパッケージマネージャーのバージョンをどう管理すべきかがわかる

:::

## ディスクの無駄と緩さ — pnpm の動機

pnpm は 2016 年、Zoltan Kochan 氏が開発を開始しました(v1 のリリースは 2017 年)。奇しくも yarn と同じ年に生まれていますが、狙いはまったく違います。yarn が「npm を速く、確実にする」ことを目指したのに対し、pnpm は当時の npm(そして yarn)が共有していた **2 つの構造的な問題**に切り込みました。

1 つめは**ディスクの無駄**です。3 章で見たとおり、npm も yarn v1 もプロジェクトごとに node_modules へパッケージの実ファイルをコピーします。10 個のプロジェクトで React を使えば、同じファイル一式がディスクに 10 回書き込まれる。プロジェクトが増えるほど、`node_modules` は「宇宙でもっとも重い物体」と揶揄される存在になっていきました。

2 つめは **hoisting の緩さ**です。npm v3 以降のフラット化は、宣言していないパッケージまで import できてしまう幻の依存(phantom dependency)を常態化させました。動いているコードが、実は誰も宣言していない依存の上に立っている——この緩さは、依存を増やすほど静かにリスクを蓄積します。

速さのために正確さを犠牲にするのでも、その逆でもなく、**両方を同時に解決する**。pnpm の名は performant npm(高性能な npm)に由来しますが、その本質は性能と厳格さの両立にあります。

## pnpm のコンセプト — 詳細は 9 章で

pnpm の答えは、コピーをやめてリンクにすることです。仕組みの核心は 3 つの部品でできています。

- **グローバルストア(content-addressable store)**: すべてのパッケージのファイルを、マシン全体で 1 か所に、内容ベースで一度だけ保存する
- **ハードリンク(hard link)**: 各プロジェクトの node_modules には実ファイルをコピーせず、ストア内の実体を指すハードリンクを張る。10 プロジェクトで React を使っても、ディスク上の実体は 1 つ
- **シンボリックリンク(symbolic link)**: node_modules の中はフラット化せず、依存関係をシンボリックリンクの網で正確に表現する。ルートの node_modules には**自分が宣言した依存だけ**が見えるので、phantom dependency は原理的に発生しない

図書館にたとえるなら、npm/yarn v1 が「利用者全員に本の複製を 1 冊ずつ配る」方式だとすれば、pnpm は「本は書庫に 1 冊だけ置き、全員に貸出カードを渡す」方式です。ディスクという書架は節約され、しかも貸出カード(リンク)は台帳(package.json)に載っている本にしか発行されない——だから無断借用(phantom dependency)もできません。

この仕組みの詳細——ストアの構造、`.pnpm` ディレクトリ(virtual store)のレイアウト、リンクをたどる様子——は [9章](/pnpm/09-how-pnpm-works)でディレクトリを実際に掘りながら確認します。ここでは「コピーではなくリンク」「フラット化しない」という 2 つのキーワードだけ覚えて先へ進みましょう。

## ランタイムごと再発明する — Bun と Deno

2020 年代に入ると、「パッケージマネージャー単体」ではなく「JavaScript ランタイムごと」作り直す動きが現れます。

**Bun** は 2023 年に v1.0 が出た、Zig 言語で書かれたオールインワンツールです。Node.js 互換のランタイム、パッケージマネージャー(`bun install`)、バンドラー、テストランナーを 1 つのバイナリに同梱し、とにかく速度を武器にします。node_modules の構造自体は従来型に近いため、「ランタイムは Node のまま、インストールだけ Bun で」という使い方をするチームもあります。

**Deno** は、Node.js の原作者 Ryan Dahl 氏が Node の設計上の後悔を踏まえて作り直したランタイムです。パーミッションによるセキュリティモデルや標準ライブラリの充実など思想面の影響力は大きいものの、npm エコシステムとの互換性という点では独自路線であり、本書の主戦場(既存 Node.js プロジェクトのパッケージ管理)とはやや別の地図にいます。

<!-- 🖼️ 画像プレースホルダー: 生成した画像を docs/public/images/fig-07-1.png に保存し、下の行のコメントを外してください -->
<!-- ![図 7-1: npm/yarn/pnpm/Bun の系譜図(2010〜2026)](/images/fig-07-1.png) -->

> **🖼️ 図 7-1|npm/yarn/pnpm/Bun の系譜図(2010〜2026)**(画像プレースホルダー)
> 生成後は `docs/public/images/fig-07-1.png` に配置してください。

::: details 図 7-1 の ChatGPT 生成プロンプト(クリックで展開)

```text
STYLE PRESET (apply exactly; keep consistent with all previous diagrams in this series):
Flat 2D vector infographic in a minimal technical-illustration style. Landscape orientation (3:2).
Pure white background (#FFFFFF). Limited palette: dark navy #1E293B for text and outlines,
blue #2563EB as the single primary accent, light gray #E2E8F0 for container boxes,
orange #F59E0B for highlights only. Uniform medium-weight rounded strokes, simple geometric
icons, generous white space, clear visual hierarchy.
No gradients, no shadows, no 3D, no textures, no photorealism, no decorative background elements.
All labels in English, short (1-3 words), bold sans-serif, high contrast, perfectly legible.
Render every quoted label verbatim, exactly once, with no extra, invented, or duplicated text.
No text other than the labels listed below.

DIAGRAM CONTENT:
LAYOUT: Four horizontal lanes stacked vertically, each lane a timeline line flowing
left to right. Lines start at different horizontal positions according to their birth year.
The rightmost edge is labeled "2026".
ELEMENTS:
- Lane 1 (gray line, topmost, longest) starting with a dot labeled "npm 2010"
- Lane 2 (gray line) starting with a dot labeled "yarn 2016",
  with a fork dot in the middle labeled "Berry 2020"
- Lane 3 (blue line, thicker) starting with a dot labeled "pnpm 2017",
  ending with an orange dot labeled "v12 Rust"
- Lane 4 (orange line, shortest) starting with a dot labeled "Bun 2023"
ARROWS: one labeled arrow reading "lockfile" pointing from "yarn 2016" up to the npm lane.
```

:::

## 2026 年の勢力図

歴史の話を、現在の数字で締めくくりましょう。2026 年時点の各ツールの立ち位置は次のとおりです。

- **npm**: Node.js 同梱という配布力で、依然として**最大シェア**。「何も追加せずに使える標準」の座は揺らいでいません
- **yarn**: 現行の v4(Berry 系)は PnP を武器に大規模組織を中心に使われています。一方、前章で見たとおり多くの現場は v1 のまま
- **pnpm**: ダウンロード数は 2024 年比で 3 倍に伸び、2026 年 4 月時点で**週間約 7,270 万ダウンロード**。開発者調査 State of JS の継続利用意向(retention)では **2 年連続で Yarn を上回り**ました。2026 年 8 月 26 日には Rust で書き直された **pnpm 12** がリリースされています(コマンド・設定・lockfile は v11 互換。npm の `latest` タグは当面 v11 のままで、v12 は `pnpm self-update next-12` で導入する段階)
- **Bun**: ランタイムを含むオールインワンとして、速度面の対抗馬という位置づけ

伸び盛りの挑戦者だった pnpm は、モノレポ管理の定番、そして「npm 互換のまま速く厳格に」の本命として、主要な選択肢に定着したと言えます。

::: info なぜ pnpm まで Rust で書き直したのか
pnpm 12 の Rust 化は「流行だから」ではありません。JavaScript 実装(v11)の時点で npm より数倍速かったものの、CI で毎日何百回も走るインストールの数秒は積もります。重要なのは、v12 が意図的に「マイグレーションにしない」方針を取ったことです。コマンドも設定も lockfile もそのまま——yarn 2 の Berry が互換性を捨てて痛手を負った歴史の、明確な反省が読み取れます。
:::

## Corepack の顛末 — PM のバージョンは誰が管理するのか

ツールが複数ある世界では、「このプロジェクトはどのパッケージマネージャーの、どのバージョンで動かすのか」という管理問題が生まれます。その答えとして Node.js に同梱されたのが **Corepack** でした。package.json の `packageManager` フィールド(例: `"packageManager": "pnpm@11.1.0"`)を読み取り、指定されたツールを指定されたバージョンで自動的に用意してくれる仕組みです。

ところがこの仕組みは、標準になる前に幕を下ろすことになりました。2025 年 3 月 19 日、Node.js の技術運営委員会(TSC)は **Node v25 以降で Corepack を同梱しない**ことを可決したのです。Node 14.19.0〜24.x(LTS の 24 を含む)には引き続き同梱されますが、Node 25 以降で使いたい場合は `npm install -g corepack` で別途インストールする必要があります。

では、いまはどう管理するのが正解でしょうか。実務的な指針は次の 3 点です。

- **`packageManager` フィールドは引き続き書く**: Corepack の同梱終了後も、このフィールド自体は各ツールや CI が参照する事実上の宣言として機能します
- **pnpm は自己完結の道具立てを持つ**: 自分自身の更新は `pnpm self-update`、さらに v11/v12 では Node.js のバージョン管理まで pnpm 側で担う `pnpm runtime set` が使えます。「Node が PM を配る」から「PM が Node ごと面倒を見る」への逆転です
- **Node 24 以前 + Corepack の現行構成は当面動く**: 慌てて剥がす必要はありませんが、新規プロジェクトで Corepack 前提の設計にするのは避けるのが無難です

## どう選ぶか — 本書の立場

4 つのツールを、2 つの軸で整理してみます。横軸は「node_modules の作り方が従来型か、新方式か」、縦軸は「パッケージマネージャー専業か、ランタイム込みか」です。

<!-- 🖼️ 画像プレースホルダー: 生成した画像を docs/public/images/fig-07-2.png に保存し、下の行のコメントを外してください -->
<!-- ![図 7-2: 4 ツールのポジショニングマップ](/images/fig-07-2.png) -->

> **🖼️ 図 7-2|4 ツールのポジショニングマップ**(画像プレースホルダー)
> 生成後は `docs/public/images/fig-07-2.png` に配置してください。

::: details 図 7-2 の ChatGPT 生成プロンプト(クリックで展開)

```text
STYLE PRESET (apply exactly; keep consistent with all previous diagrams in this series):
Flat 2D vector infographic in a minimal technical-illustration style. Landscape orientation (3:2).
Pure white background (#FFFFFF). Limited palette: dark navy #1E293B for text and outlines,
blue #2563EB as the single primary accent, light gray #E2E8F0 for container boxes,
orange #F59E0B for highlights only. Uniform medium-weight rounded strokes, simple geometric
icons, generous white space, clear visual hierarchy.
No gradients, no shadows, no 3D, no textures, no photorealism, no decorative background elements.
All labels in English, short (1-3 words), bold sans-serif, high contrast, perfectly legible.
Render every quoted label verbatim, exactly once, with no extra, invented, or duplicated text.
No text other than the labels listed below.

DIAGRAM CONTENT:
LAYOUT: A two-axis quadrant chart with a horizontal axis and a vertical axis crossing
in the center. Four dots are placed on the chart.
ELEMENTS:
- Horizontal axis: left end labeled "classic layout", right end labeled "new layout"
- Vertical axis: bottom end labeled "manager only", top end labeled "full runtime"
- Gray dot at bottom-left labeled "npm"
- Blue dot (largest) at bottom-center-right labeled "pnpm"
- Gray dot at bottom-right labeled "yarn v4"
- Orange dot at top-left labeled "Bun"
ARROWS: none.
```

:::

そのうえで、選び方の指針を正直に書きます。

- **npm** は「何も足したくない」プロジェクトの合理的な選択です。同梱されており、学習コストはゼロ。小さなツールや教材にはいまも最適です
- **yarn v4** は PnP の厳格さと速度を組織的に活かせる、専任のツーリング担当がいるような大規模組織に向きます
- **Bun** は、ランタイムごと乗り換える覚悟があるなら最速級の体験を提供します。ただしパッケージ管理の選定がランタイムの選定と一体になる点は理解しておくべきです
- **pnpm** は、node_modules という馴染みの土台と npm 互換の操作感を保ったまま、ディスク効率・速度・依存の厳格さ・モノレポ対応を手に入れられます。**新規プロジェクトでどれか 1 つ選ぶなら、本書は pnpm を推します**

もちろん、これは「pnpm 以外は間違い」という意味ではありません。npm で困っていないチームが移行する必要はありませんし、Berry の思想に共感するなら yarn v4 は優れた選択です。ただ、新しくプロジェクトを始めるとき、あるいはメンテナンスモードの yarn v1 から離れるときには、互換性を保った進化を選び続けてきた pnpm の設計哲学が、もっとも摩擦の少ない着地点になる——これが本書の立場です。

## 実験: pnpm の勢いを数字で確認する

npm レジストリはダウンロード統計の API を公開しています。pnpm 本体(これも 1 つの npm パッケージです)の直近 1 週間のダウンロード数を見てみます。

```sh
$ curl -s https://api.npmjs.org/downloads/point/last-week/pnpm
```

```json
{"downloads":74862310,"start":"2026-08-20","end":"2026-08-26","package":"pnpm"}
```

本文で触れた 2026 年 4 月時点の「週間約 7,270 万」から、さらに伸びていることが確認できます(数値は実行する時期によって変わります)。同じ API のパッケージ名を差し替えれば、任意のパッケージの普及度を手軽に定点観測できるので、技術選定の際の道具として覚えておくと便利です。

## まとめ

- pnpm は 2016 年に Zoltan Kochan 氏が開発を開始(v1 は 2017 年)。ディスクの無駄と hoisting の緩さを、グローバルストア + ハードリンク + シンボリックリンクで同時に解決する設計(詳細は 9 章)
- Bun(2023 年 v1.0、Zig 製)はランタイム込みのオールインワン、Deno は Node.js 原作者による再設計と、ランタイムごと作り直す潮流がある
- 2026 年現在、npm は同梱で最大シェア、yarn v4 は大規模組織中心、pnpm は週間約 7,270 万 DL・State of JS retention 2 年連続 Yarn 超えで主要選択肢に定着。pnpm 12 は Rust 書き直しながら v11 互換を貫く
- Corepack は Node 25 以降同梱されない(2025 年 3 月 TSC 決定)。`packageManager` フィールドの宣言と、pnpm 自身の `self-update` / runtime 管理が現在の実務解
- 新規プロジェクトなら pnpm が有力、というのが本書の立場。ただし文脈次第で npm / yarn v4 / Bun にもそれぞれ正当な適所がある

これで Part II の歴史編は終わりです。Part III では pnpm を実際にインストールし、手を動かしながらその仕組みとアドバンテージを深掘りしていきます。まずは最初の一歩から。→ [8章 pnpm はじめの一歩](/pnpm/08-getting-started)
