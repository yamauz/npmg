# 12. 実務で効く機能たち

[11章](/pnpm/11-workspaces)でワークスペースという「土台」が整いました。この章では、日々の開発とトラブル対応で真価を発揮する pnpm の実務機能を一気に見ていきます。依存の調査、推移的依存の強制、パッケージへのパッチ当て、そしてサプライチェーン攻撃への防御。どれも「知っているかどうか」で対応時間が桁で変わる機能です。

::: tip この章でわかること
- `pnpm why` / `pnpm outdated` / `pnpm licenses list` で依存を調査できる
- overrides と `pnpm patch` で「他人のパッケージの問題」に対処できる
- v10/v11 のビルドスクリプト制御と `minimumReleaseAge` の意図を説明できる
- `pnpm dlx` / `pnpm create` を適切な場面で使い分けられる
:::

## 日々の調査系コマンド

「このパッケージ、誰が入れたんだっけ?」— node_modules を眺めて途方に暮れた経験は誰にでもあるはずです。`pnpm why` は、あるパッケージが**なぜインストールされているのか**を依存グラフを遡って表示します。

```sh
$ pnpm why picomatch
dependencies:
vite 7.1.3
└─┬ tinyglobby 0.2.14
  └── picomatch 4.0.3
```

「picomatch は vite が使う tinyglobby の依存」と一目でわかります。脆弱性報告への対応で「うちのプロジェクトはこのパッケージを使っているか? どの経路で?」を調べる最初の一手です。

`pnpm outdated` は、宣言した範囲より新しいバージョンが出ていないかを一覧します。

```sh
$ pnpm outdated
┌────────────┬─────────┬────────┐
│ Package    │ Current │ Latest │
├────────────┼─────────┼────────┤
│ react      │ 19.1.0  │ 19.1.4 │
├────────────┼─────────┼────────┤
│ typescript │ 5.8.3   │ 5.9.2  │
└────────────┴─────────┴────────┘
```

`pnpm licenses list` は依存のライセンスを集計します。`--prod`(本番依存のみ)や `--json` と組み合わせれば、会社のライセンス監査への提出物が 1 コマンドで作れます。

## overrides — 依存グラフへの「上書き命令」

推移的依存(依存の依存)に脆弱なバージョンが混ざっているが、直接の依存はまだ修正版に追従していない — 実務で頻出する状況です。overrides は、依存グラフ全体に対して「このパッケージはこのバージョンを使え」と強制します。書く場所は前章で見たとおり `pnpm-workspace.yaml` です。

```yaml
overrides:
  lodash: 4.17.21
  "vite>esbuild": ^0.25.0
```

1 行目は「グラフ中のすべての lodash を 4.17.21 に」、2 行目は「vite の下の esbuild だけ」という限定指定です。建築にたとえるなら、各業者(直接依存)がどんな資材(推移的依存)を持ち込もうと、施主が「断熱材はこの型番に統一」と仕様書で上書きするようなものです。

yarn を使ってきた読者なら「`resolutions` と同じでは?」と気づいたはずです。そのとおりで、**overrides は yarn v1 の `resolutions` に相当します**。yarn から乗り換える場合も、`resolutions` の内容をこの overrides に書き写せばほぼそのまま機能します。

<!-- 🖼️ 画像プレースホルダー: 生成した画像を docs/public/images/fig-12-3.png に保存し、下の行のコメントを外してください -->
<!-- ![図 12-3: overrides が依存グラフを書き換える図](/images/fig-12-3.png) -->

> **🖼️ 図 12-3|overrides が依存グラフを書き換える図**(画像プレースホルダー)
> 生成後は `docs/public/images/fig-12-3.png` に配置してください。

::: details 図 12-3 の ChatGPT 生成プロンプト(クリックで展開)

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
LAYOUT: A simple dependency chain runs from left to right across the middle: two white boxes, then a fork to two boxes on the right (one upper, one lower). A blue command box floats at the top center.
ELEMENTS: A white box labeled "app", a white box labeled "lib", an upper-right box labeled "vulnerable" drawn with an orange dashed outline and a small orange cross mark, and a lower-right blue box labeled "safe version". At the top center, a blue rounded box labeled "overrides".
ARROWS: An unlabeled arrow from "app" to "lib". A labeled arrow reading "requires" pointing from "lib" toward "vulnerable", drawn as a crossed-out dashed line. A labeled arrow reading "rewired" pointing from "lib" to "safe version". A labeled arrow reading "forces" pointing from "overrides" down to "safe version".
```

:::

## pnpm patch — fork せずにその場で繕う

依存パッケージにバグを見つけたとき、従来の選択肢は重いものでした。upstream に PR を出して待つか、リポジトリを fork して自前で npm publish するか。後者は「服のほつれを直すために仕立て屋を開業する」ようなものです。`pnpm patch` なら、その場で針と糸を出して繕えます。

フローは 4 ステップです。

1. `pnpm patch <pkg>@<version>` — パッケージの編集用コピーが一時ディレクトリに展開される
2. そのコピーを直接編集する
3. `pnpm patch-commit <path>` — 差分が `patches/` に `.patch` ファイルとして保存され、`patchedDependencies` 設定に自動登録される
4. 以後の `pnpm install` で全員に自動適用される

このフローを図にすると次のようになります。

```mermaid
flowchart LR
  A["pnpm patch"] --> B["一時ディレクトリで編集"]
  B --> C["pnpm patch-commit"]
  C --> D["patchedDependencies に登録"]
```

`.patch` ファイルはリポジトリにコミットするので、チームメイトも CI も同じ修正を受け取ります。不要になったら `pnpm patch-remove` で外せます。パッチの適用先は `lodash@4.17.21` のような完全一致指定が最優先で、バージョン範囲指定、名前のみ指定の順に優先度が下がります。章末の実験で実際に試します。

<!-- 🖼️ 画像プレースホルダー: 生成した画像を docs/public/images/fig-12-1.png に保存し、下の行のコメントを外してください -->
<!-- ![図 12-1: patch のワークフロー(4 ステップ)](/images/fig-12-1.png) -->

> **🖼️ 図 12-1|patch のワークフロー(4 ステップ)**(画像プレースホルダー)
> 生成後は `docs/public/images/fig-12-1.png` に配置してください。

::: details 図 12-1 の ChatGPT 生成プロンプト(クリックで展開)

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
LAYOUT: Four rounded boxes arranged in a single horizontal row, connected by three plain arrows pointing right. Each box has a small blue circled number badge at its top-left.
ELEMENTS: First box labeled "pnpm patch" with badge "1" and a folder icon. Second box labeled "edit copy" with badge "2" and a pencil icon. Third box labeled "pnpm patch-commit" with badge "3" and a file icon carrying an orange tag reading "patches/*.patch". Fourth box labeled "auto apply" with badge "4" and a checkmark icon.
ARROWS: Three unlabeled arrows connecting the four boxes from left to right.
```

:::

## pnpm audit — 脆弱性の検知から封じ込めまで

`pnpm audit` は依存ツリーを既知の脆弱性データベースと突き合わせます。pnpm 11 からは識別子が CVE ではなく **GHSA(GitHub Security Advisory)ベース**になりました。`--audit-level` で報告する深刻度の下限を、`--prod` で本番依存だけを対象にできます。

覚えておきたいのが `pnpm audit --fix` です。修正版が存在する脆弱性について、先ほどの **overrides を自動で追記**してくれます。「検知(audit)→ 封じ込め(overrides)」が 1 コマンドでつながっているわけです。

一方、「この警告は当プロジェクトには影響しない」と判断した脆弱性は、`pnpm-workspace.yaml` の `audit.ignore` に GHSA 形式で列挙して抑制できます。

```yaml
audit:
  ignore:
    - GHSA-9c47-m6qq-7p4h
```

黙って無視するのではなく、無視する判断そのものをコードレビューの対象に載せられるのがポイントです。

## ビルドスクリプト制御 — postinstall は「承認制」へ

[7章](/history/07-pnpm-and-next-gen)で触れたサプライチェーン攻撃の主要な侵入経路は、インストール時に自動実行される lifecycle スクリプト(postinstall など)でした。pnpm 10 は、Rspack がこの手口で攻撃された事件を受けて、**依存パッケージの lifecycle スクリプトをデフォルトで実行しない**という破壊的変更に踏み切りました。

とはいえ esbuild のように、正当な理由で postinstall を必要とするパッケージもあります。そこで pnpm は対話的な承認コマンド `pnpm approve-builds` を用意しました。実行すると「ビルドスクリプトを持つ依存」が一覧され、選んだものだけが許可リストに載ります。v10 では許可リストは `onlyBuiltDependencies` という設定でしたが、**v11 で `allowBuilds` に統合**され、`onlyBuiltDependencies` / `neverBuiltDependencies` / `ignoredBuiltDependencies` の 3 設定を置き換えました。あわせて v11 では `strictDepBuilds: true` がデフォルトになり、未承認のビルドスクリプトは警告ではなく**インストール失敗**として扱われます。

```yaml
allowBuilds:
  - esbuild
  - sharp
```

::: warning dangerouslyAllowAllBuilds は使わない
全パッケージのビルドを無条件に許可する `dangerouslyAllowAllBuilds` という逃げ道もありますが、名前のとおり非推奨です。これを有効にすると pnpm 10/11 が積み上げた防御が丸ごと無効になります。面倒でも `pnpm approve-builds` で個別に承認してください。承認リストの差分はプルリクエストに現れるので、「新しく postinstall を実行するようになった依存」にレビューで気づけます。
:::

## minimumReleaseAge — 公開直後のパッケージを掴まない

近年のサプライチェーン攻撃には共通パターンがあります。メンテナーのアカウントを乗っ取り、マルウェア入りバージョンを publish し、被害が広がるのは**公開直後の数時間**、というものです。逆に言えば、公開から時間が経ったバージョンは、コミュニティの検証をくぐり抜けてきた分だけ安全度が上がります。

pnpm 11 の `minimumReleaseAge` はこの性質を利用します。**公開から指定分数が経過していないバージョンを解決しない**設定で、デフォルトは 1440 分(= 1 日)です。`0` で無効化、`10080` にすれば 1 週間の「検疫期間」になります。社内パッケージなど即時反映したいものは `minimumReleaseAgeExclude` で除外できます。

```yaml
minimumReleaseAge: 10080
minimumReleaseAgeExclude:
  - "@mycompany/*"
```

重要なのは、この防御が後述の `pnpm dlx` にも効くことです。「X(旧 Twitter)で話題の CLI を `dlx` で即実行したら公開 2 時間のマルウェアだった」という最悪のシナリオを、設定 1 行で塞げます。

<!-- 🖼️ 画像プレースホルダー: 生成した画像を docs/public/images/fig-12-2.png に保存し、下の行のコメントを外してください -->
<!-- ![図 12-2: サプライチェーン攻撃の侵入経路と pnpm の防御ポイント](/images/fig-12-2.png) -->

> **🖼️ 図 12-2|サプライチェーン攻撃の侵入経路と pnpm の防御ポイント**(画像プレースホルダー)
> 生成後は `docs/public/images/fig-12-2.png` に配置してください。

::: details 図 12-2 の ChatGPT 生成プロンプト(クリックで展開)

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
LAYOUT: A horizontal flow from left to right. On the far left a dark figure icon, then a container box, then two vertical gate-shaped barriers standing on the path, and on the far right a house-shaped box.
ELEMENTS: A dark navy hooded-figure icon labeled "attacker". A light gray container with a cloud icon labeled "registry". A first blue gate labeled "minimumReleaseAge". A second blue gate labeled "build approval". A white house-shaped box labeled "your project". An orange cross mark labeled "blocked" placed on the path between the two gates.
ARROWS: A labeled arrow reading "malicious update" pointing from "attacker" to "registry". An unlabeled arrow from "registry" toward "your project" passing through both gates, drawn as a dashed line after the first gate.
```

:::

## pnpm dlx と pnpm create — 一時実行の作法

プロジェクトの雛形生成やワンショットの CLI 実行に、パッケージを依存へ追加する必要はありません。`pnpm dlx`(エイリアス `pnpx`)は、パッケージを**依存に追加せず一時取得して実行**します。npm の `npx` に相当するコマンドです。

```sh
$ pnpm dlx cowsay "hello pnpm"
```

雛形生成には専用の `pnpm create` があります。

```sh
$ pnpm create vite my-app
```

これは `create-vite` を一時取得して実行する糖衣構文です。前述のとおり、v11 からは dlx / create にも `minimumReleaseAge` が適用されるため、「実行するだけのコマンド」にも検疫期間が効きます。

## 高度な機能 — 存在だけ知っておく

最後に、深入りはしないものの「存在を知っておくと、いつか助かる」機能を 2 つ紹介します。

- **injected dependencies**: package.json の `dependenciesMeta.<pkg>.injected` を `true` にすると、ワークスペースパッケージをシンボリックリンクではなく**ハードリンクのコピー**として注入します。通常のリンクでは ui パッケージの実体は 1 つなので peer dependency も 1 通りにしか解決できませんが、injected にすると「react@18 のアプリと react@19 のアプリが同じ ui を使う」といった消費側ごとの peer 解決が可能になります。
- **configDependencies**: 通常の依存より**先に**インストールされる特殊な依存です。`.pnpmfile.mjs` フックやパッチ、カタログといった「設定そのもの」をパッケージ化し、複数リポジトリで共有できます。大規模組織で pnpm の運用ルールを配布する用途に向いています。

どちらも必要になったときに公式ドキュメントを読めば十分です。「pnpm にはその道がある」と覚えておくことが、この節の目的です。

## 実験: pnpm patch でパッチ運用を確認する

実際にパッチを当ててみます。題材として lodash に「バージョン文字列を書き換える」だけの無害な変更を加えます。

```sh
$ mkdir patch-lab && cd patch-lab
$ pnpm init
$ pnpm add lodash@4.17.21
$ pnpm patch lodash@4.17.21
Patch: You can now edit the package at:

  /private/var/folders/qy/3fk2m91d5xg/T/e6bb5413-lodash@4.17.21/user

To commit your changes, run:

  pnpm patch-commit '/private/var/folders/qy/3fk2m91d5xg/T/e6bb5413-lodash@4.17.21/user'
```

表示された一時ディレクトリの `lodash.js` をエディタで開き、`var VERSION = '4.17.21';` の行を `'4.17.21-patched'` に書き換えて保存してください。編集できたら、表示されていたコマンドをそのまま実行します。

```sh
$ pnpm patch-commit '/private/var/folders/qy/3fk2m91d5xg/T/e6bb5413-lodash@4.17.21/user'
```

すると `patches/lodash@4.17.21.patch` が生成され、`pnpm-workspace.yaml` に登録が追記されます。

```yaml
patchedDependencies:
  lodash@4.17.21: patches/lodash@4.17.21.patch
```

パッチファイルの中身は見慣れた diff 形式です。

```diff
--- a/lodash.js
+++ b/lodash.js
@@ -8,7 +8,7 @@
-  var VERSION = '4.17.21';
+  var VERSION = '4.17.21-patched';
```

適用されたか確認しましょう。

```sh
$ node -e "console.log(require('lodash').VERSION)"
4.17.21-patched
```

node_modules を消して `pnpm install` し直しても同じ結果になります。`patches/` ディレクトリと `pnpm-workspace.yaml` をコミットすれば、チーム全員と CI に同じ修正が行き渡ります。試し終えたら `pnpm patch-remove lodash@4.17.21` で外してください。

## まとめ

- `pnpm why` / `pnpm outdated` / `pnpm licenses list` が日々の依存調査の基本 3 点セット
- overrides(`pnpm-workspace.yaml` に記述)は推移的依存のバージョンを強制する。yarn v1 の `resolutions` に相当し、`pnpm audit --fix` が自動追記してくれる
- `pnpm patch` → 編集 → `pnpm patch-commit` で、fork せずに依存パッケージを修正できる
- v10 で postinstall はデフォルト無効になり、v11 では承認リストが `allowBuilds` に統合された。`dangerouslyAllowAllBuilds` には頼らない
- `minimumReleaseAge`(デフォルト 1440 分)は公開直後のパッケージを掴まない検疫期間で、`pnpm dlx` にも効く

これで本書の本編は終わりです。パッケージマネージャーの仕組みから歴史、そして pnpm の内部構造と実務機能まで、`npm install` の下にあるものを一段ずつ潜ってきました。手元のプロジェクトで `ls -la node_modules` を打ったとき、以前とは違う景色が見えているはずです。

このあとは付録が控えています。日々の作業では[付録A. コマンド対照表](/appendix/a-command-cheatsheet)を、用語の確認には[付録B. 用語集](/appendix/b-glossary)を、本書の図版を育てるには[付録C](/appendix/c-image-generation)をどうぞ。
