# 10. pnpm のアドバンテージ総覧

[9章](/pnpm/09-how-pnpm-works)で、pnpm のストアとリンクの仕組みを理解しました。この章では、その仕組みが実務に何をもたらすのかを 7 つのアドバンテージに整理します。「チームに pnpm を提案する」場面で、そのまま材料として使える章です。

::: tip この章でわかること
- pnpm のアドバンテージを 7 つに整理して説明できる
- 公式ベンチマークの数値と読み方を押さえられる
- v10 / v11 で強化されたセキュリティ機構を列挙できる
- pnpm 採用を提案するための判断材料を揃えられる
:::

## ① ディスク効率 — プロジェクトが増えるほど効く

9章で見たとおり、パッケージのファイル実体はマシン全体で 1 つのストアにしか存在せず、各プロジェクトへはハードリンクで配られます。現場ごとに同じ工具を買い直すのではなく、共用の工具庫から持ち出すイメージです。npm ではプロジェクトを 1 つ clone するたびに数百 MB 〜数 GB の node_modules がフルコピーで増えていきますが、pnpm では**追加コストはほぼゼロ**。マイクロサービスやリポジトリを何個も抱える開発マシン・CI 環境ほど、節約はプロジェクト数に比例して効いてきます。バージョン更新時も差分ファイルしかストアに増えないため、「少しずつ違うバージョンが大量にある」現実的な状況にも強い設計です。

<!-- 🖼️ 画像プレースホルダー: 生成した画像を docs/public/images/fig-10-1.png に保存し、下の行のコメントを外してください -->
<!-- ![図 10-1: store 共有によるディスク節約](/images/fig-10-1.png) -->

> **🖼️ 図 10-1|store 共有によるディスク節約**(画像プレースホルダー)
> 生成後は `docs/public/images/fig-10-1.png` に配置してください。

::: details 図 10-1 の ChatGPT 生成プロンプト(クリックで展開)

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
LAYOUT: Two panels side by side. The left panel shows three folders each with its own
solid stack of files. The right panel shows three folders all connected to one cylinder.
ELEMENTS:
- Left panel (light gray) labeled "npm" containing three folder icons, each with a solid
  file-stack icon, and a group caption labeled "full copies"
- Right panel (light gray) labeled "pnpm" containing three folder icons and one blue
  cylinder labeled "one store"
ARROWS: a labeled arrow reading "hard link" pointing from "one store" to the nearest
folder in the right panel, plain arrows from "one store" to the other two folders.
```

:::

## ② 速度 — 公式ベンチマークで見る

pnpm 公式サイトは、主要シナリオのインストール速度ベンチマークを**週次で自動更新**しています。以下は 2026-08-28 時点の結果です(alotta-files フィクスチャ、50ms RTT / 200Mbit/s のエミュレート回線。現行の公式ベンチマークに Yarn は含まれていません)。

| シナリオ | npm | pnpm v11(JS 版) | pnpm v12(Rust 版) |
| --- | --- | --- | --- |
| クリーンインストール | 45.9s | 8.2s | 5s |
| lockfile あり | 11.5s | 4.7s | 3.2s |
| cache あり | 10.9s | 4s | 964ms |
| cache + lockfile | 7.2s | 2.1s | 635ms |
| cache + node_modules | 1.4s | 598ms | 48ms |
| 3 つ全部 | 1s | 472ms | 15ms |

数値は環境で変わるので絶対値より傾向を見てください。ポイントは 2 つです。第一に、**どのシナリオでも pnpm が npm を大きく上回る**こと。速さの源泉は、依存の解決(resolve)・取得(fetch)・リンク(link)を段階ごとに全パッケージ待ち合わせるのではなく、**パッケージ単位のパイプラインとして並行に流す**設計と、9章のハードリンク(コピー不要)にあります。第二に、Rust 版の v12 では cache が効く日常シナリオがミリ秒単位に入りつつあることです。

## ③ 厳格さ — 「動いていたのに壊れる」を未然に防ぐ

phantom dependency の何が怖いかというと、**壊れるタイミングを自分で選べない**ことです。未宣言のまま import していた推移的依存は、どこか遠くのライブラリが依存を整理した瞬間、こちらの変更ゼロで消えます。「昨日まで動いていたのに今日の `npm install` で壊れた」の典型パターンです。9章で見たとおり、pnpm はこれを構造的に遮断するので、問題は**導入した日に全部露見し、以後は起きません**。痛みを「いつか本番で」から「今日ローカルで」に前倒しできるのが厳格さの価値です。

もう 1 つ、hoisting 由来の **doppelgänger(分身)問題**も解消します。npm/yarn v1 のフラット化では、hoist 位置の競合により**同じバージョンの同じパッケージがツリー内に複数コピー**されることがあり、シングルトンの二重化や `instanceof` の不一致といった不可解なバグを生みました。pnpm では 1 つのバージョンの実体は `.pnpm` 内に 1 か所だけ。分身は原理的に生まれません。

## ④ モノレポ第一級サポート

pnpm はワークスペース機能を後付けではなく中核機能として磨いてきました。ルートの `pnpm-workspace.yaml` にパッケージの場所を宣言し、`workspace:` プロトコルで「必ずローカルのパッケージを使う(レジストリへ勝手にフォールバックしない)」参照を張れます。v9.5.0 で導入された **catalogs** はワークスペース全体の依存バージョンを一元管理する仕組みで、`--filter` による対象指定と合わせて、モノレポ運用の道具が標準装備されています。詳しくは[11章](/pnpm/11-workspaces)で 1 章かけて解説します。

## ⑤ セキュリティ — サプライチェーン攻撃への多層防御

npm エコシステムへの攻撃が現実の脅威になった 2020 年代後半、pnpm はデフォルト設定の厳格化でいち早く応答しました。

- **lifecycle スクリプトのデフォルト無効(v10)**: 依存パッケージの postinstall 等を勝手に実行しません。Rspack がサプライチェーン攻撃を受け、postinstall 経由でマルウェアが配布された事件への直接の対応です。ビルドが必要なパッケージだけを `pnpm approve-builds` で対話的に承認します(v11 では許可リストが **`allowBuilds`** に統合されました。全許可の `dangerouslyAllowAllBuilds` は名前どおり非推奨です)
- **`minimumReleaseAge`(v11)**: デフォルト 1440 分、つまり**公開から 1 日経っていないバージョンを解決しない**設定です。乗っ取られたパッケージの悪意あるバージョンは公開直後に発見・削除されることが多いため、空港の検疫のように「入国前に 1 日待たせる」だけで大半を回避できます。`0` で無効化、`10080` で 1 週間に延長、除外は `minimumReleaseAgeExclude`。`pnpm dlx` にも適用されます
- **`blockExoticSubdeps: true`(v11)**: 推移的依存が git や tarball の URL を直接指すことをブロックします
- **`strictDepBuilds: true`(v11)**: 未承認のビルドスクリプトを検出したらインストール自体を失敗させます
- **`pnpm audit --fix`**: 脆弱なバージョンを回避する overrides を自動追記します(v11 から GHSA ベース)
- **`pnpm sbom`(v11)**: SBOM(ソフトウェア部品表)を生成し、監査・コンプライアンス要求に応えます

<!-- 🖼️ 画像プレースホルダー: 生成した画像を docs/public/images/fig-10-2.png に保存し、下の行のコメントを外してください -->
<!-- ![図 10-2: pnpm のセキュリティ多層防御](/images/fig-10-2.png) -->

> **🖼️ 図 10-2|pnpm のセキュリティ多層防御**(画像プレースホルダー)
> 生成後は `docs/public/images/fig-10-2.png` に配置してください。

::: details 図 10-2 の ChatGPT 生成プロンプト(クリックで展開)

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
LAYOUT: A horizontal pipeline from left to right: a box on the far left, four vertical
shield-shaped gates in a row, and a box on the far right.
ELEMENTS:
- Far left box (light gray, cloud icon) labeled "Registry"
- Shield gate 1 (blue) labeled "Release Age"
- Shield gate 2 (blue) labeled "Exotic Block"
- Shield gate 3 (blue) labeled "Build Approval"
- Shield gate 4 (blue) labeled "Audit"
- Far right box (light gray, folder icon) labeled "Your Project"
ARROWS: a labeled arrow reading "package" pointing from "Registry" through the four
shield gates to "Your Project".
```

:::

## ⑥ 非破壊的な進化の哲学

yarn 2(Berry)が PnP への方向転換でエコシステムを分断したのとは対照的に、pnpm は「**ユーザーの資産を壊さずに進化する**」姿勢を貫いています。コマンド体系は npm 互換の UX([8章](/pnpm/08-getting-started)の読み替え表がほぼ 1 対 1 だったことを思い出してください)。そして 2026 年の v12 では本体を Rust で書き直すという大手術をしながら、**コマンド・フラグ・設定・lockfile を v11 互換のまま**にし、「これはマイグレーションではない」と宣言しました。`pnpm self-update next-12` で試し、問題があれば戻ればよい。採用したツールが「ある日突然、別物になる」リスクの低さは、長期運用するチームにとって速度以上に重要な資質です。

## ⑦ 勢い — 安心して選べるだけの採用実績

技術選定では「良いか」だけでなく「選んでも孤立しないか」が問われます。pnpm のダウンロード数は 2024 年比で 3 倍に伸び、2026 年 4 月時点で**週間約 7,270 万ダウンロード**。State of JS の retention(利用者の継続意向)では **2 年連続で Yarn を上回っています**。npm は Node.js 同梱の地位で最大シェアを維持し、Yarn は v4(Berry)が大規模組織を中心に使われ、Bun が速度面の対抗馬として控える構図ですが、「npm からの乗り換え先」としての事実上の本命が pnpm である、というのが 2026 年時点の勢力図です。

<!-- 🖼️ 画像プレースホルダー: 生成した画像を docs/public/images/fig-10-3.png に保存し、下の行のコメントを外してください -->
<!-- ![図 10-3: 7 つのアドバンテージの俯瞰マップ](/images/fig-10-3.png) -->

> **🖼️ 図 10-3|7 つのアドバンテージの俯瞰マップ**(画像プレースホルダー)
> 生成後は `docs/public/images/fig-10-3.png` に配置してください。

::: details 図 10-3 の ChatGPT 生成プロンプト(クリックで展開)

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
LAYOUT: One circle in the center with seven rounded boxes arranged evenly around it,
connected to the center by plain spokes.
ELEMENTS:
- Center circle (blue, gem icon) labeled "pnpm"
- Box (light gray, disk icon) labeled "Disk"
- Box (light gray, lightning icon) labeled "Speed"
- Box (light gray, lock icon) labeled "Strictness"
- Box (light gray, grid icon) labeled "Monorepo"
- Box (light gray, shield icon) labeled "Security"
- Box (light gray, puzzle icon) labeled "Compatibility"
- Box (orange, rocket icon) labeled "Momentum"
ARROWS: plain lines from "pnpm" to each of the seven boxes.
```

:::

## アドバンテージを実務の力に変える

ここまでで「pnpm を選ぶ理由」は揃いました。ただし、道具の真価は日々の運用で発揮されます。Part III の残り 2 章では、pnpm の実力を現場で引き出す機能を見ていきます。特に次章のワークスペースは、複数パッケージを扱う開発体験を大きく左右する機能です。

## まとめ

- ディスク効率: ストア共有により、節約効果はプロジェクト数に比例して大きくなる
- 速度: 公式ベンチマーク(2026-08-28 時点・週次更新)で全シナリオ npm を大きく上回り、Rust 版 v12 はさらに速い
- 厳格さ: phantom dependency と doppelgänger を構造的に防ぎ、「動いていたのに壊れる」を未然に断つ
- セキュリティ: lifecycle スクリプト無効(v10)、`minimumReleaseAge`・`allowBuilds`・`blockExoticSubdeps`・`pnpm sbom`(v11)の多層防御
- モノレポ第一級サポート・非破壊的な進化の哲学・採用の勢いが、長期運用の安心材料になる

次章では、pnpm のワークスペース機能とモノレポ運用(`pnpm-workspace.yaml`、`workspace:` プロトコル、catalogs、`--filter`)を説明します。
