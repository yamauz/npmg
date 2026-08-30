# 付録A. コマンド対照表

npm / yarn v1 / pnpm の対応コマンドを用途別にまとめます。「npm ではこう打っていたけど pnpm では?」というときの逆引きにお使いください。`<pkg>` はパッケージ名、`<script>` は package.json の scripts 名に読み替えてください。

## プロジェクト初期化

| 用途 | npm | yarn v1 | pnpm |
| --- | --- | --- | --- |
| package.json の生成 | `npm init` | `yarn init` | `pnpm init` |
| 質問をスキップして生成 | `npm init -y` | `yarn init -y` | `pnpm init`(常に非対話) |

## 依存の追加・削除

| 用途 | npm | yarn v1 | pnpm |
| --- | --- | --- | --- |
| 依存を追加 | `npm install <pkg>` | `yarn add <pkg>` | `pnpm add <pkg>` |
| dev 依存を追加 | `npm install -D <pkg>` | `yarn add -D <pkg>` | `pnpm add -D <pkg>` |
| グローバルに追加 | `npm install -g <pkg>` | `yarn global add <pkg>` | `pnpm add -g <pkg>` |
| 依存を削除 | `npm uninstall <pkg>` | `yarn remove <pkg>` | `pnpm remove <pkg>` |

## インストール

| 用途 | npm | yarn v1 | pnpm |
| --- | --- | --- | --- |
| 全依存のインストール | `npm install` | `yarn install`(または `yarn`) | `pnpm install` |
| CI 用クリーンインストール | `npm ci` | `yarn install --frozen-lockfile` | `pnpm install --frozen-lockfile` |

::: info
pnpm は CI 上で実行すると自動的に frozen-lockfile モードになります。そのため CI では `pnpm install --frozen-lockfile` が一般的です。加えて pnpm 11 以降には `npm ci` に相当する `pnpm ci` もあります(`pnpm clean` で node_modules を消してから `--frozen-lockfile` でインストールする、クリーンインストール系のコマンド)。
:::

## スクリプト実行・一時実行

| 用途 | npm | yarn v1 | pnpm |
| --- | --- | --- | --- |
| スクリプト実行 | `npm run <script>` | `yarn <script>` | `pnpm <script>`(`pnpm run <script>`) |
| インストールせず一時実行 | `npx <pkg>` | 相当なし(`npx` を併用) | `pnpm dlx <pkg>`(エイリアス `pnpx`) |

## 更新・調査

| 用途 | npm | yarn v1 | pnpm |
| --- | --- | --- | --- |
| 依存の更新 | `npm update` | `yarn upgrade` | `pnpm update`(`pnpm up`) |
| 古い依存の一覧 | `npm outdated` | `yarn outdated` | `pnpm outdated` |
| 依存の理由調査(なぜ入っているか) | `npm explain <pkg>` | `yarn why <pkg>` | `pnpm why <pkg>` |
| 脆弱性監査 | `npm audit` | `yarn audit` | `pnpm audit` |
| 脆弱性の自動修正 | `npm audit fix` | 相当なし | `pnpm audit --fix`(overrides を追記) |

## キャッシュ・ストア操作

| 用途 | npm | yarn v1 | pnpm |
| --- | --- | --- | --- |
| キャッシュ/ストアの場所 | `npm config get cache` | `yarn cache dir` | `pnpm store path` |
| キャッシュ/ストアの掃除 | `npm cache clean --force` | `yarn cache clean` | `pnpm store prune`(未参照分のみ削除) |
| 整合性の検証 | `npm cache verify` | 相当なし | `pnpm store status` |

## workspace 操作

| 用途 | npm | yarn v1 | pnpm |
| --- | --- | --- | --- |
| 特定パッケージでスクリプト実行 | `npm run <script> --workspace=<pkg>` | `yarn workspace <pkg> <script>` | `pnpm --filter <pkg> <script>` |
| 特定パッケージに依存を追加 | `npm install <dep> --workspace=<pkg>` | `yarn workspace <pkg> add <dep>` | `pnpm --filter <pkg> add <dep>` |
| 全パッケージでスクリプト実行 | `npm run <script> --workspaces` | `yarn workspaces run <script>` | `pnpm -r <script>` |

pnpm の `--filter` は名前指定だけでなく、`--filter "./packages/*"`(パス)、`--filter "<pkg>..."`(依存先を含む)など強力な絞り込みができます。詳細は[11章](/pnpm/11-workspaces)を参照してください。

## 設定ファイル対照表

| 項目 | npm | yarn v1 | pnpm |
| --- | --- | --- | --- |
| lockfile 名 | `package-lock.json` | `yarn.lock` | `pnpm-lock.yaml` |
| 挙動の設定ファイル | `.npmrc` | `.yarnrc`(`.npmrc` も読む) | `pnpm-workspace.yaml`(v11 以降。`.npmrc` は認証・レジストリ専用) |
| workspace の宣言 | package.json の `workspaces` | package.json の `workspaces` | `pnpm-workspace.yaml` の `packages` |
| バージョン強制上書き | package.json の `overrides` | package.json の `resolutions` | `pnpm-workspace.yaml` の `overrides` |
| PM バージョンの宣言 | package.json の `packageManager` | 同左 | 同左(+ `pnpm self-update` で自己更新) |

::: warning
yarn v1 の `--frozen-lockfile` など、本表のコマンドはあくまで v1(classic)のものです。yarn v2 以降(Berry)ではコマンド体系が大きく異なるため、Berry の資料と混同しないよう注意してください。
:::
