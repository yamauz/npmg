# pnpm 事実集(2026-08-29 調査、公式ドキュメント準拠)

執筆時はこのファイルの事実に依拠すること。バージョン番号・設定名・コマンド名を憶測で書かない。

## バージョン履歴

- 最新メジャーは **pnpm 12**(2026-08-26 リリース、Rust による書き直し)。ただし npm の `latest` タグは当面 **pnpm 11** を指す。v12 は `pnpm self-update next-12` で導入する段階。
- **pnpm 9**(2024-04): lockfile v9(`lockfileVersion: '9.0'`、可読性・Git コンフリクト耐性向上)。peer 解決精度改善。Node 16 サポート終了。**v9.5.0 で catalogs 導入**(`catalog:` プロトコル)。
- **pnpm 10**(2025-01): **依存パッケージの lifecycle スクリプト(postinstall 等)をデフォルトで実行しない**破壊的変更。Rspack サプライチェーン攻撃(postinstall 経由のマルウェア)への直接対応。許可は `pnpm.onlyBuiltDependencies` に列挙、対話的承認は `pnpm approve-builds`。`.pnpm` 内の長いパスのハッシュを SHA256 に。`pnpm self-update` 追加。v10 途中から設定を pnpm-workspace.yaml に書けるように。
- **pnpm 11**(2026-04-28): Node.js 22 以上必須。本体 pure ESM。セキュリティデフォルト厳格化:
  - `minimumReleaseAge` デフォルト **1440 分(= 公開後 1 日経たないと解決しない)**。`0` で無効化、`10080` で 1 週間。除外は `minimumReleaseAgeExclude`。
  - `blockExoticSubdeps: true`(推移的依存の git/tarball URL をブロック)
  - `strictDepBuilds: true`(未承認ビルドスクリプトをインストール失敗扱い)
  - `verifyDepsBeforeRun` デフォルト `install`
  - **`allowBuilds` が `onlyBuiltDependencies` / `neverBuiltDependencies` / `ignoredBuiltDependencies` を統合・置換**。全許可は `dangerouslyAllowAllBuilds`(非推奨)。
  - 設定の置き場確定: **`.npmrc` は auth/registry 専用**。pnpm 設定は `pnpm-workspace.yaml`(プロジェクト)/ `~/.config/pnpm/config.yaml`(グローバル)。環境変数は `pnpm_config_*`。
  - 新コマンド: `pnpm ci`、`pnpm clean`、`pnpm sbom`、`pnpm peers check`、`pnpm runtime set`、`pnpm with`、`pnpm pack-app`。
  - Store v11: インデックスに SQLite 採用。audit は CVE でなく **GHSA** ベースに。
- **pnpm 12**(2026-08-26): Rust 書き直し。コマンド・フラグ・設定・lockfile は v11 互換(意図的に「マイグレーションにしない」)。破壊的変更: git 依存を正規 HTTPS URL に解決、pnpm-workspace.yaml の未知設定が `ERR_PNPM_UNRECOGNIZED_WORKSPACE_SETTINGS` エラー、peer 循環の正規化で lockfile がバイト単位決定的、Linux の `packageImportMethod: auto` は hardlink 優先。新機能: Node/Deno/Bun のグローバル shim(`globalShims`)、リモート side-effects キャッシュ(PoC)。

## コア技術

- **content-addressable store**: 全パッケージのファイルはグローバルストア(`~/Library/pnpm/store` など。`pnpm store path` で確認)に内容アドレスで一度だけ保存され、各プロジェクトの node_modules へ**ハードリンク**される。バージョン更新時は差分ファイルのみ追加(100 ファイル中 1 ファイル変更なら新規 1 つだけ)。
- **`.pnpm` ディレクトリ(virtual store)のレイアウト**:
  - 実体は `node_modules/.pnpm/<pkg>@<version>/node_modules/<pkg>` に置かれ、各ファイルがストアへのハードリンク。
  - 依存はシンボリックリンクで表現: `.pnpm/foo@1.0.0/node_modules/bar -> ../../bar@1.0.0/node_modules/bar`。ネスト深度は一定(Windows パス長問題も回避)。
  - `<pkg>@<version>/node_modules/<pkg>` と一段深いのは、①自己 require を可能にする ②循環シンボリックリンクを避ける ため。
  - peer がある場合はフォルダ名に解決情報が付く: `foo@1.0.0(react@16.14.0)`。
- **phantom dependencies 防止**: ルート node_modules には**直接宣言した依存のシンボリックリンクだけ**を置く。未宣言の推移的依存を import すると失敗する。デフォルトは「semi-strict」: 全依存を `.pnpm/node_modules` に hoist するため、依存パッケージ同士は未宣言依存に届くが、アプリコードからは届かない。`hoist` 設定で無効化可能。

## 主要機能

- **workspaces**: ルートの `pnpm-workspace.yaml` の `packages:` に glob。`workspace:` プロトコル(`workspace:*` / `workspace:^` / `workspace:~`)はレジストリへのフォールバックを禁止。publish 時に実バージョンへ自動置換(`workspace:^` → `^1.5.0`)。関連設定: `linkWorkspacePackages`(デフォルト false)、`sharedWorkspaceLockfile`(デフォルト true)、`saveWorkspaceProtocol`(デフォルト rolling)。
- **catalogs**(v9.5.0〜): `pnpm-workspace.yaml` の `catalog:`(デフォルト)と `catalogs:`(名前付き)にバージョン範囲を定義し、package.json 側で `"react": "catalog:"` / `"catalog:react18"` と参照。publish 時に実バージョンへ置換。`catalogMode`(manual / strict / prefer)。
- **overrides**: 依存グラフ全体のバージョン強制。現在は pnpm-workspace.yaml に記述。`pnpm audit --fix` が自動で overrides を追記。
- **patch**: `pnpm patch <pkg>@<version>` → 一時ディレクトリで編集 → `pnpm patch-commit <path>` でパッチ生成 + `patchedDependencies` 登録 → `pnpm patch-remove`。適用優先度は完全一致 > 範囲 > 名前のみ。
- **dlx**: `pnpm dlx`(エイリアス `pnpx`)は依存に追加せず一時取得して実行。v11 から dlx も minimumReleaseAge に従う(公開直後のパッケージ実行を拒否)。
- **licenses**: `pnpm licenses list`。`--json` / `--prod` など。
- **audit**: `--audit-level`、`--fix`(overrides 追加)、`--prod`、`--json`、`--ignore <GHSA-ID>`。無視リストは pnpm-workspace.yaml の `audit.ignore`。
- **injected dependencies**: `dependenciesMeta.<pkg>.injected: true` で workspace パッケージをシンボリックリンクでなくハードリンクコピーとして注入。消費側ごとに異なる peer(react@16 と 17 など)を解決可能。
- **configDependencies**: 通常の依存より先にインストールされる特殊依存。`.pnpmfile.mjs` フック、パッチ、カタログ、設定の共有に使える。

## ベンチマーク(公式 https://pnpm.io/benchmarks、2026-08-28 実行・週次更新)

alotta-files フィクスチャ、50ms RTT / 200Mbit/s エミュレート回線。現行の公式ベンチに Yarn は含まれない。

| シナリオ | npm | pnpm (v11 JS) | pnpm 🦀 (v12 Rust) |
|---|---|---|---|
| クリーンインストール | 45.9s | 8.2s | 5s |
| lockfile あり | 11.5s | 4.7s | 3.2s |
| cache あり | 10.9s | 4s | 964ms |
| cache + lockfile | 7.2s | 2.1s | 635ms |
| cache + node_modules | 1.4s | 598ms | 48ms |
| 3 つ全部 | 1s | 472ms | 15ms |

## yarn v1 → pnpm 移行

- **`pnpm import`** が `yarn.lock`(classic)/ `package-lock.json` から `pnpm-lock.yaml` を生成(解決済みバージョンを維持)。**workspace がある場合は事前に pnpm-workspace.yaml の宣言が必要**(yarn の `workspaces` フィールドから転記)。Yarn berry の lockfile 対応は公式に明記なし。
- 手順の骨子: pnpm-workspace.yaml 作成 → `pnpm import` → 旧 node_modules と yarn.lock を削除 → `pnpm install` → `packageManager` フィールド書き換え → scripts / CI / Docker の書き換え。
- **最大の落とし穴は phantom dependencies の顕在化**: yarn v1 の flat hoisting で「たまたま動いていた」未宣言 import が pnpm ではエラーになる。正攻法は不足依存を package.json に明示追加。
- 回避オプション(pnpm-workspace.yaml に記述):
  - `hoistPattern`: 指定パッケージを `.pnpm/node_modules` へ hoist(依存同士からのみ見える。限定的回避策)
  - `publicHoistPattern`: ルート node_modules へ hoist、アプリコードからも見える(ESLint プラグイン等の解決に使われてきた)
  - `shamefullyHoist: true` = `publicHoistPattern: "*"` と同義(完全フラット化)
  - `nodeLinker: hoisted`: シンボリックリンクなしの npm/yarn v1 同等構造(最終手段。React Native など symlink 非対応環境向け)
  - まず strict デフォルトで始め、壊れたパッケージにだけ hoist を足すのが公式推奨。

## 2026 年の状況と Corepack

- pnpm はダウンロード数 2024 年比 3 倍、2026-04 時点で週間約 7,270 万 DL。State of JS の retention で 2 年連続 Yarn 超え。npm は Node 同梱で最大シェア維持。Yarn は v4(Berry, PnP)で大規模組織中心。Bun は Zig 製オールインワンランタイムとして速度面の対抗馬。
- **Corepack の顛末**: 2025-03-19 に Node.js TSC が **Node v25 以降で Corepack を同梱しない**ことを可決。Node 14.19.0〜24.x(24 LTS 含む)には同梱。Node 25+ では `npm install -g corepack` で別途導入。pnpm は `pnpm self-update`、package.json の `packageManager` フィールド、v11/v12 の runtime 管理(`pnpm runtime set`)で自己完結する方向。

## 歴史メモ(7 章向け)

- pnpm は 2016 年に Zoltan Kochan 氏が開発を開始(v1 は 2017 年)。動機はディスク効率と依存の厳格さ。
- yarn v1 は 2016-10 に Facebook(+Google, Exponent, Tilde)が公開。2020-01 の yarn 2(Berry)で PnP を採用し方向転換、v1 はメンテナンスモードに。
- npm: 2010-01 に Isaac Schlueter 氏が公開。npm v3(2015)でフラット化、npm v5(2017)で package-lock.json 導入。2020-03 に GitHub が npm, Inc. を買収。left-pad 事件は 2016-03。

## 出典

- https://pnpm.io/motivation / symlinked-node-modules-structure / settings / workspaces / catalogs / cli/import / cli/patch / cli/dlx / cli/audit / supply-chain-security / benchmarks / blog/releases/11.0 / blog/releases/12.0
- https://socket.dev/blog/pnpm-10-0-0-blocks-lifecycle-scripts-by-default
- https://socket.dev/blog/node-js-tsc-votes-to-stop-distributing-corepack
