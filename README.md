# node_modulesの深層

npm / yarn / pnpm、その下にある構造。フロントエンド開発者のための教科書サイト(VitePress 製)です。

公開 URL: https://npmg.yamauz.workers.dev

パッケージマネージャーの基礎(package.json、node_modules、ロックファイル)から、npm → yarn → pnpm の変遷、そして pnpm の内部構造と実務機能までを、全 12 章 + 付録で解説します。

## 開発

```sh
npm install
npm run dev      # 開発サーバー (http://localhost:5173)
npm run build    # 本番ビルド (docs/.vitepress/dist)
npm run preview  # ビルド結果のプレビュー
npm run deploy   # ビルドして Cloudflare Workers へデプロイ(要 wrangler login)
```

## デザインシステム

- ルールはプロジェクトルートの **`design.md`**(Hallmark 形式でロック済み)。生成りの紙 × 深い森緑 × 明朝ディスプレイ、ボックス/絵文字/グラデーション禁止、区切りはヘアライン。
- トークンの実装は `docs/.vitepress/theme/tokens.css`(design.md が仕様、tokens.css が実体)。
- トップページは `docs/.vitepress/theme/HomeShinso.vue`。ビジュアルは [vgpu](https://github.com/vercel-labs/vgpu)(vercel-labs 製 WebGPU ライブラリ)による等角積層レイヤーのシェーダー(呼吸+グリント+マウス視差)。WebGPU 非対応環境では CSS フォールバック、`prefers-reduced-motion` では静止フレームになります。
- シェーダーの見た目確認はヘッドレスで可能: `node scripts/preview-hero.mjs 3 light` → `hero-preview.png`。
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

本文中の図はすべて「画像プレースホルダー + ChatGPT 用生成プロンプト」の形で埋め込まれています。各図の `::: details` 内のプロンプトを ChatGPT に貼り付けて画像を生成し、`docs/public/images/fig-XX-Y.png` に保存してコメントアウトされた画像タグを有効化すると差し替わります。詳しい手順とプロンプト設計の意図は「付録C. 図版を ChatGPT で生成する」(`docs/appendix/c-image-generation.md`)を参照してください。
