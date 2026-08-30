# 実測ラボ: express を npm / pnpm でインストールした一次データ(2026-08-30 採取)

執筆時はこの実測値を使うこと。捏造値は禁止。環境: macOS(APFS)、npm 11 系、pnpm v11.24.0、express 5.2.1。

## npm 側(/tmp/pm-lab/npm-demo)

- `npm install express` → **added 68 packages**、所要 約 1.5 秒(キャッシュあり)
- `ls node_modules | grep -v '^\.' | wc -l` → **65 個**がルートに平らに並ぶ(accepts, body-parser, bytes, call-bind-apply-helpers, call-bound, content-disposition, content-type, cookie, cookie-signature, debug, depd, dunder-proto, …)
- ファイル数 **601**、`du -sh` → **3.8M**
- `npm ls --depth=0` → `└── express@5.2.1` のみ(宣言した依存は 1 個だけなのに 65 個見える)
- express 5.2.1 の直接依存は **28 個**(package.json の dependencies)
- **phantom dependency の実証**: `node -e "require('body-parser')"` → **成功してしまう**(`typeof bp === 'function'`)。package.json に body-parser は書かれていないのに

## pnpm 側(/tmp/pm-lab/pnpm-demo)

- `pnpm add express`(初回)→ `Packages: +66` / `Progress: resolved 66, reused 51, downloaded 15, added 66, done` / **Done in 1.4s**
- インストール時メッセージ(重要): `Packages are cloned from the content-addressable store to the virtual store. Virtual store is at: node_modules/.pnpm`
- `ls -a node_modules` → **`.modules.yaml` `.package-map.json` `.pnpm` `.pnpm-workspace-state-v1.json` `express` だけ**。パッケージの実体はゼロ、express はシンボリックリンク:
  - `express -> .pnpm/express@5.2.1/node_modules/express`
- `.pnpm` 内エントリ数 **68**。先頭: accepts@2.0.0, body-parser@2.3.0, bytes@3.1.2, …
  - **content-type@1.0.5 と content-type@2.1.0 が同居**(バージョン違いの共存の実例)
- express の「部屋」(`/.pnpm/express@5.2.1/node_modules/`)には **29 個**(express 本体+直接依存 28 個のシンボリックリンク):
  - `accepts -> ../../accepts@2.0.0/node_modules/accepts`
  - `body-parser -> ../../body-parser@2.3.0/node_modules/body-parser`
  - `content-disposition -> ../../content-disposition@1.1.0/node_modules/content-disposition`
- **phantom dependency が構造的に不可能な実証**: `node -e "require('body-parser')"` → **`Error: Cannot find module 'body-parser'`**
- ファイル実体数 589、`du -sh node_modules` → 3.7M(※後述の注意)
- store の場所: `/Users/yamauz/Library/pnpm/store/v11`

### content-type 2 バージョンの依存経路(`pnpm why content-type`)

```
content-type@1.0.5
└─┬ express@5.2.1
  └── pnpm-demo@1.0.0 (dependencies)

content-type@2.1.0
├─┬ body-parser@2.3.0
│ └─┬ express@5.2.1 …
├─┬ negotiator@1.1.0
│ └─┬ accepts@2.0.0 …
└─┬ type-is@2.1.0 …
```

express 自身は 1.0.5 を、body-parser など孫たちは 2.1.0 を使う。npm のフラット構造では 1.0.5 がルートへ hoist され 2.1.0 が各所にネストされるが、pnpm では `.pnpm/content-type@1.0.5` と `.pnpm/content-type@2.1.0` が並ぶだけ。

## 2 プロジェクト目(/tmp/pm-lab/pnpm-demo2)

- 同じ `pnpm add express` → `Progress: resolved 66, reused 66, downloaded 0, added 66, done` / **Done in 413ms**
- **ダウンロード 0**。ストアから再利用され、初回の 1.4s → 0.4s に

## 重要な正確性の注意

1. **macOS(APFS)では「ハードリンク」ではなく「クローン(コピーオンライト)」**が使われる(`packageImportMethod: auto` の既定挙動。インストール時メッセージにも "cloned" と出る)。`ls -l` のリンク数は 1。クローンはディスクブロックを共有し、書き換え時のみ実体が分かれる。Linux 等ではハードリンク。**「ハードリンク(または CoW クローン)」と正確に書くこと**
2. その帰結として、`du -sh` は各プロジェクトで 3.7M と表示されるが、**物理ブロックはストアと共有**されている(du は論理サイズを数える)。「du の数字が同じ=節約されていない」ではない
3. npm の「added 68」と `ls` の 65 の差は、1 パッケージが複数パスに入るネスト分(3 章で解説済みの content-type 等)

## 公式ドキュメントの論点(2026-08-30 精読)

### motivation(https://pnpm.io/ja/motivation)
- ストアは**内容アドレス**: 同じファイルはマシン全体で 1 回だけ保存。「100 ファイル中 1 ファイルだけ変わった新バージョンは、その 1 ファイルだけがストアに追加される」
- インストールは **resolving / fetching / linking の 3 ステージが並行**に走る(従来の「全部解決してから全部取得」より速い)
- 非フラット: ルートに置くのは**直接依存のシンボリックリンクだけ**。未宣言の間接依存へのアクセスを構造的に遮断

### flat-node-modules-is-not-the-only-way(ブログ 2020-05-27)
- npm v2 のネストは「パスが長すぎる」問題(Windows)を起こした
- npm v3+ / yarn v1 のフラット化はそれを解決したが、依存の独立性を失った
- pnpm は「`.pnpm` にフラットな仮想ストア+シンボリックリンクでネスト表現」の**二層構造**で両方を解決。「完全に Node.js 互換」でありながら「パッケージは依存とともに適切にグループ化」される
- 循環への言及: 「依存は 1 つ上の階層に置くことで、循環したシンボリックリンクになることを回避」

### symlinked-node-modules-structure(https://pnpm.io/ja/symlinked-node-modules-structure)
- 最小例(foo@1.0.0 が bar@1.0.0 に依存):

```
node_modules
├── foo -> ./.pnpm/foo@1.0.0/node_modules/foo
└── .pnpm
    ├── bar@1.0.0
    │   └── node_modules
    │       └── bar -> <store>
    └── foo@1.0.0
        └── node_modules
            ├── foo -> <store>
            └── bar -> ../../bar@1.0.0/node_modules/bar
```

- `<pkg>@<version>/node_modules/<pkg>` と一段深くする理由: ①パッケージが自分自身を `require('foo/package.json')` できる ②循環シンボリックリンクの回避
- **"Node ignores symlinks"**: Node.js のモジュール解決は require するファイルの「実際の場所(realpath)」を基準に親ディレクトリを遡る。だから symlink を挟んでも解決は普通のネスト構造とまったく同じに動く
- **依存グラフがどれだけ深くても(foo > bar > qar)、ディレクトリの深さは一定**(.pnpm 直下の 2 階層)。循環依存(A→B→A)でもディレクトリは循環しない: シンボリックリンクの参照がグラフを表現するだけで、ファイルシステム上は平らなまま
