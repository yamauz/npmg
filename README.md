# npmg — Node.js Package Manager Guide

Node.js のパッケージマネージャー(npm / yarn / pnpm)を仕組みから理解する教科書サイト(VitePress 製)です。キャッチコピーは「node_modulesの深層を、正確にたどる。」。

公開 URL: https://npmg.yamauz.workers.dev

パッケージマネージャーの基礎(package.json、node_modules、ロックファイル)から、npm → yarn → pnpm の変遷、そして pnpm の内部構造と実務機能までを、全 12 章 + 付録で解説します。

## 開発

パッケージマネージャーは **pnpm** を使います(本書の題材でもあるため)。未導入なら `curl -fsSL https://get.pnpm.io/install.sh | sh -` で入ります。

```sh
pnpm install
pnpm dev      # 開発サーバー (http://localhost:5173)
pnpm build    # 本番ビルド (docs/.vitepress/dist)
pnpm preview  # ビルド結果のプレビュー
pnpm deploy   # ビルドして Cloudflare Workers へデプロイ(要 wrangler login)
```

依存のビルドスクリプト(esbuild / workerd / webgpu など)は pnpm の既定でブロックされるため、`pnpm-workspace.yaml` の `allowBuilds` で明示的に許可しています。新しくビルドが必要な依存を足したときは `pnpm approve-builds` で承認してください。

## デザインシステム

- ルールはプロジェクトルートの **`design.md`**(Hallmark 形式でロック済み)。白 #FAFAFA × 墨 #1C1E21 × ブルー #2563EB の 1 点アクセント、全書体サンセリフ(Noto Sans JP + JetBrains Mono)、ボックス/絵文字/グラデーション禁止、区切りはヘアライン。
- トークンの実装は `docs/.vitepress/theme/tokens.css`(design.md が仕様、tokens.css が実体)。
- トップページは `docs/.vitepress/theme/HomeShinso.vue`。ビジュアルは [vgpu](https://github.com/vercel-labs/vgpu)(vercel-labs 製 WebGPU ライブラリ)による「依存グラフ星座」のシェーダー(`hero-shader.js` + `HeroNetwork.vue`。ドローイン+リゾルブ・シグナル+カーソル・プローブ+視差)。WebGPU 非対応環境では CSS フォールバック、`prefers-reduced-motion` では静止フレームになります。
- シェーダーの見た目確認はヘッドレスで可能: `node scripts/preview-hero.mjs 5` → `hero-preview.png`(第 2 引数に `1` を渡すとダーク)。
- ページのスクリーンショット確認: `node scripts/screenshot.mjs <URL> <出力先>`(要 Google Chrome)。
- 脱 AI スロップの設計指針として [Hallmark](https://github.com/nutlope/hallmark) を `.claude/skills/hallmark` に導入済み(ビルド履歴は `.hallmark/log.json`)。

## ディレクトリ構成

```
docs/
  index.md              # トップページ
  introduction.md       # この本について
  basics/               # Part I: 基礎(1〜4章)
  history/              # Part II: 変遷(5〜7章)
  pnpm/                 # Part III: pnpm(8〜12章)
  appendix/             # 付録 A〜C
  public/images/        # 図版の置き場
  .vitepress/config.mts # サイト設定(サイドバー・ナビ)
research/
  writing-guide.md      # 執筆ガイド(文体・章テンプレート・図版形式)
  pnpm-facts.md         # pnpm 調査事実集(2026-08 時点)
```

## 図版について

本文中の図は「画像プレースホルダー + ChatGPT 用生成プロンプト」の形で埋め込まれています。プロンプトは **HTML コメント**として md に埋めてあり、ページには出ません。これを ChatGPT に貼り付けて画像を生成し、`docs/public/images/fig-XX-Y.png` に保存してプレースホルダーを `<figure>` に置き換えると差し替わります。**画像を採用したらコメント内のプロンプトも採用版で上書きします**(これを飛ばすと画像とプロンプトが乖離する)。

手順とプロンプト設計の意図は `research/writing-guide.md`、構図の判断と過去に踏んだ罠は `research/figure-log.md` にあります。
