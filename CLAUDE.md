# CLAUDE.md — npmg(Node.js Package Manager Guide)

VitePress 製の日本語オンライン教科書。npm / yarn / pnpm を「仕組み」から解説する全 12 章+付録 A〜C。
公開 URL: https://npmg.yamauz.workers.dev(Cloudflare Workers、Worker 名 `npmg`)

## 名前のルール

- 正式名は **npmg(Node.js Package Manager Guide)**。ナビのワードマークは `npmg`(モノスペース小文字)
- 「node_modulesの深層を、正確にたどる。」は**書名ではなくキャッチコピー**(ヒーロー見出し)。書名として使わない
- 位置づけは**中立の教科書**。pnpm は「ゴール」ではなく「最新世代の題材」として深掘りする。「本命」「提案の材料」のような推し表現は避け、意見を書くときは 7 章「本書の立場」のように意見だと明示する

## コマンド

```sh
pnpm dev         # 開発サーバー (http://localhost:5173)
pnpm build       # 本番ビルド。リンク切れで失敗するので検証を兼ねる
pnpm deploy      # 手動デプロイ。ビルド + wrangler deploy(要 wrangler login)
node scripts/preview-hero.mjs 5        # ヒーローシェーダーをヘッドレス描画 → hero-preview.png
node scripts/screenshot.mjs <URL> <出力先> [full]  # headless Chrome でページ撮影(要 Google Chrome)
node scripts/og-image.mjs [dark:0|1] [time] [出力先]  # OGP 画像を生成 → docs/public/og.png(ダーク) / og-light.png
```

変更は必ず `pnpm build` とスクリーンショット(ライト/ダーク両方)で確認してからデプロイする。

## デプロイ

**通常は main への push で自動デプロイされる**(Cloudflare Workers Builds が GitHub リポジトリ `yamauz/npmg` と GUI 連携済み。ダッシュボード側でビルド・デプロイまで実行される)。GitHub Actions のワークフローは置いていない。

⚠️ **パッケージマネージャーは pnpm**。Cloudflare のビルド設定はダッシュボード側にあるため、リポジトリからは変更できない。ビルドコマンド/インストールコマンドが `npm` のままだと失敗するので、Cloudflare ダッシュボードの Build settings も pnpm に合わせること(`pnpm install` / `pnpm build`)。

`pnpm deploy` は手元からの手動デプロイ用に残してある。Cloudflare 側のビルドが落ちたときの逃げ道。

## 執筆の絶対原則

**詳細は `research/writing-guide.md` を必ず読む**(章テンプレート・文体・図版形式)。特に「わかりやすさの水準」節:

1. 基準は「**これで分からなければ読者ではなく本の責任**」。誰にでもわかる超丁寧な説明を心がける
2. **二重支持の原則**: 抽象概念は文章だけで説明を終えず、【Mermaid 図/TermDemo/具体的な比喩/図版】のうち 2 つ以上で支える。文章以外のコンテンツを多用して理解に貢献させる
3. **実測主義**: コマンド出力・数値は捏造禁止。一次データは `research/structure-lab.md`(express の npm/pnpm 実測)、事実集は `research/pnpm-facts.md`
4. 各セクションは「読者が抱くはずの疑問」を 1 文立ててから答える。`::: warning つまずきポイント` で誤解を先回り
5. 正確性の例: macOS/APFS では pnpm はハードリンクではなく **CoW クローン**。「ハードリンク(または CoW クローン)」と表記

## 文章以外のコンテンツ(3 種の使い分け)

- **図版プレースホルダー(ChatGPT 生成用)**: 全 33 点。「コメントアウトされた img タグ+引用ブロック+`::: details` 内の英語プロンプト」の 3 点セット。プロンプト冒頭のスタイルプリセットは**全図で一字一句同一**に保つ(writing-guide にマスターあり。白背景・ink #1C1E21・blue #2563EB・orange は図版限定の第 2 ハイライト)。運用手順は付録 C
- **TermDemo**(自作 Vue、グローバル登録済み): タイピングアニメ付きターミナル。`:lines="[{ cmd }, { out }, { pause }]"` API。**タグ内に空行を入れると壊れる**。文字列はシングルクォート。静的コードブロックをコピペ用に併置する
- **Mermaid**: ```mermaid フェンスで書く。ノード 8 個以内、`/` `@` 入りラベルは `["..."]`、`{}` 禁止、数値を図に入れない。描画は自前 `MermaidView.vue`(ダークネイティブ、isDark で再レンダリング)

MDX は不要(VitePress は md に Vue コンポーネントを直接書ける)。

## デザイン

**ルールはリポジトリ直下の `design.md`(Hallmark 形式でロック済み)。変更前に必ず読む。**

- v2 = 白 #FAFAFA × 墨 #1C1E21 × ブルー #2563EB(ダーク: #101319 / #E6E9EF / #5B8CFF)。トークン実体は `docs/.vitepress/theme/tokens.css`
- 全書体サンセリフ(Noto Sans JP + JetBrains Mono)。カードボックス・絵文字アイコン・グラデ・drop-shadow 禁止。区切りは 1px ヘアライン。アクセントは 1 画面 3 箇所まで
- 脱 AI スロップスキル **Hallmark** を `.claude/skills/hallmark` に導入済み(履歴 `.hallmark/log.json`)。デザイン変更時はこれに従う
- トップのヒーローは vgpu(WebGPU)の「依存グラフ星座」(`hero-shader.js` + `HeroNetwork.vue`)。鉄則: 線幅は fwidth ベース約 1px/エッジはノード座標から毎フレーム導出(点と線を離さない)/動きは「依存解決」のメタファー限定

## 技術的な罠(過去に踏んだもの)

- **Vue scoped style 内の `:global()` は一切使わない**(コンパイルが壊れて白画面/未適用の事故 2 回)。ダーク切替の変数上書きは custom.css(非 scoped)で行う
- mermaid: dev で fastdom ESM エラー → `vite.optimizeDeps.include: ['mermaid', 'fastdom']` が必須。同一 id での `mermaid.render` 再実行は失敗する(再描画ごとに id 採番)。Web フォント指定はラベル切れの原因(`fontFamily: 'sans-serif'` + `htmlLabels: false`)
- md 内の山かっこプレースホルダー(例: `<pkg>`)は必ずバッククォートで囲む(Vue 解釈エラー)
- WebGPU を 0×0 の canvas に初期化しない(コンポジタが固まる)
- VitePress ルーターは**キャプチャ段階**で `a` のクリックを横取りし scrollOffset=134 でスクロールする(preventDefault 無効)。ページ内スクロールを自前制御したい UI は `button` 要素にする
- タブタイトル: LP は「Node.js Package Manager Guide」(index.md で `titleTemplate: false`)、他は「章タイトル | Node.js Package Manager Guide」(config の `title`)

## リポジトリ構成の要点

```
docs/                  # 本文(basics / history / pnpm / appendix)+ .vitepress(テーマ・設定)
design.md              # デザインシステム(ロック済み・最上位ルール)
research/writing-guide.md   # 執筆ガイド(章テンプレ・図版形式・わかりやすさの水準)
research/pnpm-facts.md      # pnpm 事実集(2026-08 調査)
research/structure-lab.md   # 実測一次データ(2026-08-30 採取)
.claude/skills/hallmark     # 脱 AI スロップデザインスキル
wrangler.jsonc              # Cloudflare Workers 設定(静的アセット配信)
pnpm-workspace.yaml         # pnpm 設定。allowBuilds でビルド許可する依存を明示
```

## パッケージマネージャー

本書の題材に合わせて **pnpm**(`packageManager` フィールドで固定)。lockfile は `pnpm-lock.yaml` のみで、`package-lock.json` は置かない。依存のビルドスクリプトは既定でブロックされるため、必要なものは `pnpm-workspace.yaml` の `allowBuilds` に列挙する(現在: `@vgpu/adapter-node` / `esbuild` / `webgpu` / `workerd`)。新規依存で `ERR_PNPM_IGNORED_BUILDS` が出たら `pnpm approve-builds` で承認する。
