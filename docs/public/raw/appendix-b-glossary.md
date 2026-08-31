> 出典: Node.js Package Manager Guide(npmg) — https://npmg.yamauz.workers.dev/appendix/b-glossary

# 付録B. 用語集

本書に登場する主要な用語をまとめます。五十音順ではなく、「基礎 → 構造 → pnpm 固有 → 運用」の順に、関連する用語が近くに来るよう並べています。詳しい説明がある章は括弧内のリンクから参照してください。

## 基礎

- **パッケージ(package)** — 配布・再利用の単位となるコードのまとまり。package.json を持つディレクトリ(またはその tarball)がパッケージです。([1章](https://npmg.yamauz.workers.dev/basics/01-what-is-a-package-manager))
- **レジストリ(registry)** — パッケージを収集・配布する中央サーバー。npm レジストリ(registry.npmjs.org)が事実上の標準で、yarn も pnpm も既定ではここから取得します。
- **マニフェスト(manifest)** — パッケージの名前・バージョン・依存などを宣言するファイル。Node.js エコシステムでは package.json のこと。([2章](https://npmg.yamauz.workers.dev/basics/02-package-json-and-semver))
- **semver(Semantic Versioning)** — `major.minor.patch` 形式のバージョン規約。破壊的変更で major、後方互換の機能追加で minor、バグ修正で patch を上げます。`^` や `~` による範囲指定の前提となる約束事です。
- **依存グラフ(dependency graph)** — 直接依存から依存の依存へと辿ってできる、パッケージ間の有向グラフ。インストールとはこのグラフを解決し、ディスク上に再現する作業です。
- **peer dependency** — 「自分と同じ場所に、利用者側がこのパッケージを用意してほしい」という宣言。React プラグインが React 本体を peer に指定するのが典型例です。
- **lockfile(ロックファイル)** — 依存グラフの解決結果(確定バージョン・取得先・ハッシュ)を記録し、インストールの再現性を高めるファイル。package-lock.json / yarn.lock / pnpm-lock.yaml。ただし固定できるのは「解決結果」までで、実際に出来上がる node_modules はパッケージマネージャーのバージョン・OS/CPU・optional/peer 依存・ビルドスクリプトなどにも左右されます。([4章](https://npmg.yamauz.workers.dev/basics/04-lockfiles))
- **integrity** — 取得したパッケージが改ざんされていないか検証するためのハッシュ値。lockfile に `sha512-...` の形式(SRI)で記録されます。

## 構造

- **hoisting(巻き上げ)** — 依存の依存を node_modules の浅い位置(ルート直下)へ引き上げて重複を減らすフラット化の手法。npm v3 以降と yarn v1 が採用。([3章](https://npmg.yamauz.workers.dev/basics/03-node-modules))
- **幽霊依存(phantom dependency)** — package.json に宣言していないのに、hoisting の副作用で import できてしまう依存。宣言なしに動いているため、依存側の構成変更で突然壊れます。pnpm の既定の隔離レイアウトでは、アプリコードからの未宣言 import は解決に失敗します(ただし可視性は `hoist` / `publicHoistPattern` / `shamefullyHoist` などの設定で変わります)。
- **doppelgänger(ドッペルゲンガー)** — フラット化の制約により、同一バージョンのパッケージが node_modules 内の複数箇所に重複して実体コピーされる現象。ディスクと解決の一貫性を損ないます。pnpm の virtual store では実体がコピーされることはありませんが、peer dependency の組み合わせが複数あるパッケージは、組み合わせごとに別エントリを持ちます(ファイル実体はリンクで共有)。
- **ハードリンク(hard link)** — ディスク上の同じ実体(inode)を指す、対等な「別名」。ファイルをコピーせずに複数の場所から参照でき、pnpm がストアから各プロジェクトへファイルを配る手段です。
- **シンボリックリンク(symbolic link)** — 別のパスを指し示す特殊ファイル。pnpm は node_modules 内の依存関係をシンボリックリンクの網で表現します。([9章](https://npmg.yamauz.workers.dev/pnpm/09-how-pnpm-works))

## pnpm 固有

- **content-addressable store** — ファイルを「内容のハッシュ」を鍵として保存するグローバルな保管庫。同じ内容は何プロジェクトで使われてもマシン全体で 1 回しか保存されません。場所は `pnpm store path` で確認できます。
- **virtual store** — `node_modules/.pnpm` ディレクトリのこと。`<pkg>@<version>` ごとにパッケージの実体(ストアへのハードリンク)を置き、依存をシンボリックリンクで結んで依存グラフを再現します。
- **catalog(カタログ)** — pnpm-workspace.yaml にバージョン範囲を一元定義し、各 package.json から `"catalog:"` プロトコルで参照する仕組み(pnpm v9.5.0 以降)。モノレポ内のバージョン不揃いを防ぎます。
- **dlx** — パッケージを依存に追加せず、一時的に取得してそのまま実行するコマンド(`pnpm dlx`、npm の `npx` 相当)。pnpm v11 以降は minimumReleaseAge に従い、公開直後のパッケージの実行を拒否します。

## 運用

- **workspace(ワークスペース)** — 1 つのリポジトリ内の複数パッケージを、単一のインストールでまとめて管理する仕組み。pnpm では pnpm-workspace.yaml の `packages` で宣言します。([11章](https://npmg.yamauz.workers.dev/pnpm/11-workspaces))
- **モノレポ(monorepo)** — 複数のパッケージ(アプリ、共有ライブラリなど)を 1 つのリポジトリで管理する開発スタイル。workspace 機能はその土台です。
- **overrides** — 依存グラフ全体に対して特定パッケージのバージョンを強制的に上書きする設定。脆弱性対応の暫定措置などに使い、pnpm では pnpm-workspace.yaml に記述します。
- **lifecycle スクリプト(lifecycle scripts)** — `postinstall` など、インストールの過程で自動実行されるスクリプト。攻撃の入口にもなるため、pnpm v10 以降は依存パッケージのものをデフォルトで実行しません。
- **Corepack** — package.json の宣言に従ってパッケージマネージャーを自動で用意する、Node.js に同梱されていたツール。Node 25 以降は同梱されず、必要なら `npm install -g corepack` で導入します。([7章](https://npmg.yamauz.workers.dev/history/07-pnpm-and-next-gen))
- **packageManager フィールド** — package.json に「このプロジェクトが使うパッケージマネージャーと厳密なバージョン」を宣言するフィールド(例: `"packageManager": "pnpm@11.1.0"`)。
- **frozen lockfile** — lockfile と package.json に食い違いがあるとき、lockfile を書き換えずエラーで停止させるモード(`pnpm install --frozen-lockfile` など)。CI での再現性を守る要です。
- **サプライチェーン攻撃(supply chain attack)** — 依存パッケージを乗っ取り・すり替えなどで汚染し、それを取り込むプロジェクトへ悪意あるコードを送り込む攻撃。pnpm v10/v11 のセキュリティ既定値強化の背景です。([12章](https://npmg.yamauz.workers.dev/pnpm/12-practical-features))
