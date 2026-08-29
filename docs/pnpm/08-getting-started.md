# 8. pnpm はじめの一歩

[7章](/history/07-pnpm-and-next-gen)では、pnpm が「ディスク効率」と「依存の厳格さ」を武器に生まれた経緯を見ました。ここからの Part III では、その pnpm を実際に手を動かしながら深掘りしていきます。まずはインストールと基本操作、つまり「pnpm のある生活」の初日です。

::: tip この章でわかること
- pnpm を 3 つのルートでインストールし、バージョンを管理できる
- `packageManager` フィールドでチームのバージョンを固定できる
- npm の知識を pnpm のコマンド体系に読み替えられる
- 最初のプロジェクトを作成し、開発サーバーを起動できる
:::

## pnpm をインストールする 3 つのルート

pnpm の導入ルートは大きく 3 つあります。まずは公式の standalone スクリプトです。Node.js に依存しない単体バイナリとして入るため、後述の `pnpm self-update` との相性がもっとも良い方法です。

```sh
$ curl -fsSL https://get.pnpm.io/install.sh | sh -
```

2 つ目は、npm ユーザーにとっていちばん抵抗のない方法、npm でのグローバルインストールです。

```sh
$ npm install -g pnpm
```

3 つ目は macOS / Linux で定番の Homebrew です。ただしバージョンアップのタイミングが Homebrew のリポジトリ更新に依存する点は覚えておいてください。

```sh
$ brew install pnpm
```

本書では **standalone スクリプトか `npm install -g pnpm` を推奨**します。理由は次のコラムのとおりです。

<!-- 🖼️ 画像プレースホルダー: 生成した画像を docs/public/images/fig-08-1.png に保存し、下の行のコメントを外してください -->
<!-- ![図 8-1: pnpm の導入ルート 3 種](/images/fig-08-1.png) -->

> **🖼️ 図 8-1|pnpm の導入ルート 3 種**(画像プレースホルダー)
> 生成後は `docs/public/images/fig-08-1.png` に配置してください。

::: details 図 8-1 の ChatGPT 生成プロンプト(クリックで展開)

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

DIAGRAM CONTENT:
LAYOUT: Three rounded rectangles stacked vertically on the left, one large rounded
rectangle on the right, connected by arrows from left to right.
ELEMENTS:
- Box 1 (light gray, terminal icon) labeled "curl script"
- Box 2 (light gray, cube icon) labeled "npm -g"
- Box 3 (light gray, mug icon) labeled "Homebrew"
- Right box (blue, gem icon) labeled "pnpm CLI"
ARROWS: a labeled arrow reading "install" pointing from "curl script" to "pnpm CLI",
a plain arrow from "npm -g" to "pnpm CLI", a plain arrow from "Homebrew" to "pnpm CLI".
```

:::

::: info なぜ Corepack を使わないのか
Node.js 14.19.0〜24.x(24 LTS を含む)には、パッケージマネージャーのバージョン管理ツール **Corepack** が同梱されており、`corepack enable pnpm` で pnpm を使い始めることもできます。しかし 2025-03-19、Node.js の TSC(技術運営委員会)は **Node 25 以降で Corepack を同梱しない**ことを可決しました。Node 25 以降で使うには `npm install -g corepack` と別途インストールが必要で、「Node に付いてくるから楽」という利点は失われています。pnpm 自身も `pnpm self-update`・`packageManager` フィールド・v11/v12 のランタイム管理(`pnpm runtime set`)で自己完結する方向に進んでいるため、本書では Corepack に依存しない導入を採用します。
:::

## バージョンの確認と self-update

インストールできたら、バージョンを確認してみます。

```sh
$ pnpm --version
11.6.0
```

執筆時点(2026 年 8 月)では、npm の `latest` タグが指すのは **v11 系**です。一方、2026-08-26 にリリースされた **v12 は Rust による書き直し版**で、当面は `next` 扱いです。試したい場合は `pnpm self-update next-12` で導入できます。本書の解説は v11 系を前提にしますが、v12 はコマンド・フラグ・設定・lockfile が v11 互換なので、そのまま読み替えられます([10章](/pnpm/10-advantages)で詳しく触れます)。

pnpm 本体の更新は、v10 で追加された `self-update` コマンド 1 つで済みます。

```sh
$ pnpm self-update
```

npm のように「npm で npm を更新する」のではなく、pnpm が自分自身を入れ替える点が standalone インストールと噛み合う設計です。

## チームでバージョンを固定する — `packageManager` フィールド

個人開発ならバージョンは自由ですが、チームでは「私の pnpm は v10、あなたは v11」という状態がトラブルの温床になります。そこで package.json の `packageManager` フィールドに、プロジェクトで使うパッケージマネージャーと正確なバージョンを宣言します。

```json
{
  "name": "my-app",
  "packageManager": "pnpm@11.6.0"
}
```

工具箱に「このネジは 2 番のドライバーで締める」とラベルを貼っておくようなものです。CI・同僚・未来の自分が、どのバージョンで lockfile が生成されたかを迷わずに済みます。[4章](/basics/04-lockfiles)で見たとおり lockfile は「買い物リストの控え」ですが、その控えを書いたペン(パッケージマネージャーのバージョン)まで揃えるのがこのフィールドの役割です。pnpm 自身もこのフィールドを認識し、宣言と異なるバージョンでの実行を検知できます。

## 基本コマンド体系

pnpm のコマンドは、npm ユーザーなら半日で手に馴染みます。主要なものを一気に見てみましょう。

```sh
$ pnpm install          # package.json の依存をすべてインストール
$ pnpm add lodash       # 依存を追加(dependencies)
$ pnpm add -D vitest    # 開発依存として追加(devDependencies)
$ pnpm add -g pnpm      # グローバルに追加
$ pnpm remove lodash    # 依存を削除
$ pnpm run dev          # scripts の dev を実行
$ pnpm dev              # run は省略可(スクリプト名を直接実行できる)
$ pnpm dlx cowsay hello # 依存に追加せず一時取得して実行(npx 相当)
$ pnpm create vite      # プロジェクトの雛形を生成
```

ポイントは 3 つです。第一に、追加は `install` ではなく **`add`** です。pnpm では `install` は「package.json に書かれたものを揃える」専用で、役割が明確に分かれています。第二に、`pnpm dev` のように **`run` を省略してスクリプト名を直接実行**できます(pnpm の組み込みコマンド名と衝突しない限り)。第三に、`pnpm dlx`(エイリアス `pnpx`)は npx と同じく使い捨て実行ですが、v11 以降はセキュリティ機構(公開直後のパッケージの実行拒否)にも従います。これは[10章](/pnpm/10-advantages)で説明します。

<!-- 🖼️ 画像プレースホルダー: 生成した画像を docs/public/images/fig-08-2.png に保存し、下の行のコメントを外してください -->
<!-- ![図 8-2: pnpm コマンド体系マップ](/images/fig-08-2.png) -->

> **🖼️ 図 8-2|pnpm コマンド体系マップ**(画像プレースホルダー)
> 生成後は `docs/public/images/fig-08-2.png` に配置してください。

::: details 図 8-2 の ChatGPT 生成プロンプト(クリックで展開)

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

DIAGRAM CONTENT:
LAYOUT: One circle in the center, two large rounded containers on the left and right,
each container holding three small rounded boxes.
ELEMENTS:
- Center circle (blue, gem icon) labeled "pnpm"
- Left container (light gray, box icon) labeled "Dependencies" containing three small
  boxes labeled "install", "add", "remove"
- Right container (light gray, play icon) labeled "Execute" containing three small
  boxes labeled "run", "dlx", "create"
ARROWS: a plain arrow from "pnpm" to "Dependencies", a plain arrow from "pnpm" to "Execute".
```

:::

## npm ユーザーのための読み替え表

日常操作の読み替えは次の表だけで足ります。完全版のコマンド対照表(yarn を含む)は[付録A](/appendix/a-command-cheatsheet)にまとめてあるので、移行時はそちらを手元に置いてください。

| npm | pnpm |
| --- | --- |
| `npm install` | `pnpm install` |
| `npm install lodash` | `pnpm add lodash` |
| `npm install -D vitest` | `pnpm add -D vitest` |
| `npm uninstall lodash` | `pnpm remove lodash` |
| `npm run dev` | `pnpm dev`(`pnpm run dev` も可) |
| `npx create-vite` | `pnpm dlx create-vite` |

## 実験: 最初のプロジェクトを作って動かす

それでは実際に、Vite のプロジェクトを 1 つ作ってみます。まず、これから行う作成〜インストールの流れを通しで見てみましょう。

<TermDemo
  title="zsh — pnpm create vite"
  :lines="[
    { cmd: 'pnpm create vite my-app' },
    { out: 'Scaffolding project in /Users/you/sandbox/pm-play/my-app...' },
    { out: 'Done.' },
    { pause: 400 },
    { cmd: 'cd my-app' },
    { cmd: 'pnpm install' },
    { out: 'Packages: +11' },
    { out: 'Progress: resolved 11, reused 0, downloaded 11, added 11, done' },
    { out: 'Done in 3.4s using pnpm v11.6.0' },
    { pause: 400 },
    { cmd: 'pnpm dev' },
    { out: 'VITE v7.1.3  ready in 320 ms' },
    { out: 'Local:   http://localhost:5173/' },
  ]"
/>

同じことを手元で再現していきます。実験用ディレクトリ(例: `~/sandbox/pm-play`)で次を実行してください。

```sh
$ pnpm create vite my-app
```

```
✔ Select a framework: › Vanilla
✔ Select a variant: › TypeScript

Scaffolding project in /Users/you/sandbox/pm-play/my-app...

Done. Now run:

  cd my-app
  pnpm install
  pnpm run dev
```

案内どおりに依存をインストールし、開発サーバーを起動します。

```sh
$ cd my-app
$ pnpm install
```

```
Packages: +11
+++++++++++
Progress: resolved 11, reused 0, downloaded 11, added 11, done

devDependencies:
+ typescript 5.9.2
+ vite 7.1.3

Done in 3.4s using pnpm v11.6.0
```

```sh
$ pnpm dev
```

```
> my-app@0.0.0 dev /Users/you/sandbox/pm-play/my-app
> vite

  VITE v7.1.3  ready in 320 ms

  Local:   http://localhost:5173/
```

ブラウザで `http://localhost:5173/` を開けば、Vite の初期画面が表示されます。ここまでは npm とほぼ同じ体験のはずです。では最後に、node_modules の中を軽く覗いてみましょう。

```sh
$ ls -la node_modules | head
```

```
total 16
drwxr-xr-x   7 you  staff  224  8 29 10:12 .
drwxr-xr-x  10 you  staff  320  8 29 10:12 ..
drwxr-xr-x   4 you  staff  128  8 29 10:12 .bin
-rw-r--r--   1 you  staff  607  8 29 10:12 .modules.yaml
drwxr-xr-x  14 you  staff  448  8 29 10:12 .pnpm
lrwxr-xr-x   1 you  staff   47  8 29 10:12 typescript -> .pnpm/typescript@5.9.2/node_modules/typescript
lrwxr-xr-x   1 you  staff   35  8 29 10:12 vite -> .pnpm/vite@7.1.3/node_modules/vite
```

[3章](/basics/03-node-modules)で見た npm の node_modules とは、明らかに様子が違います。数百のパッケージがフラットに並ぶ代わりに、`.pnpm` という見慣れないディレクトリと、そこへ向かう矢印(`->`)付きのエントリ、つまり**シンボリックリンク**だけが並んでいます。この「矢印の正体」こそが pnpm の心臓部です。

## まとめ

- pnpm の導入は standalone スクリプト・`npm install -g pnpm`・Homebrew の 3 ルート。Corepack は Node 25 以降同梱されないため本書では推奨しない
- 執筆時点の最新は v11 系(npm の `latest`)。Rust 版の v12 が `next` として公開済みで、`pnpm self-update` で本体を更新できる
- チームでは package.json の `packageManager` フィールドでバージョンを固定する
- 追加は `pnpm add`(`-D` / `-g`)、削除は `pnpm remove`、スクリプトは `pnpm dev` と直接実行できる。使い捨て実行は `pnpm dlx`
- node_modules の中身は npm と大きく異なり、`.pnpm` ディレクトリとシンボリックリンクで構成される

次章では、この「様子の違う node_modules」の正体、つまり pnpm のストアとリンクの 3 層構造を解説します。本書の技術的ハイライトです。
