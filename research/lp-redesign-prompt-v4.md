# LP リデザイン画像生成プロンプト v4(ChatGPT 用・単発完結)

- v2/v3 の失敗分析: 同一チャット内の過去画像(黒×蛍光)への文脈汚染+「no neon / no black」等の否定語プライミング
- v4 の方針: **新規チャットで使う**。否定語ゼロ、色は hex 固定、フォーカルポイントを 1 点指名、コピーも確定済み

## 使い方(重要)

1. **必ず新しいチャットを開いて**貼る(過去の黒×蛍光画像がある会話では何度やっても回帰する)
2. それでも寄るときは、落ち着いたドキュメントサイトのスクショを添付し
   「Use this image only as a temperature/mood reference. Do not copy its layout.」を追記
3. 見出しコピー「その下に、構造がある。」は仮。差し替えるときは TEXT 節の文字列を丸ごと置換

---

```text
Generate a high-fidelity desktop mockup image of a documentation-website landing page.
Portrait (2:3), full page top to bottom. Flat screen design only — no browser window,
no device frame, no background scene.

MOOD: The calm, credible front page of a well-crafted technical reference —
the register of Stripe Docs or Linear's documentation. Airy, restrained,
typography-led. It should feel like the first page of a good book.

PALETTE (use exactly these, nothing else):
- Background: #FAFAFA
- Ink (all text and lines): #1C1E21
- Accent (used in at most 3 small places — one button, one underline, one diagram stroke): #2E6E5E

TYPE: Clean modern sans-serif throughout. Japanese headline set with generous
letter-spacing. Tiny monospace only for code-like labels.

LAYOUT, top to bottom, with generous whitespace and 1px hairline rules as the only ornament:
1. Slim nav: small wordmark "node_modules" left, three tiny text links right.
2. Hero, left-aligned on a 12-column grid: Japanese headline "その下に、構造がある。"
   in large refined sans, one short lead line as a thin gray greeked bar, then two small
   rectangular buttons — one filled with the accent color reading "読みはじめる",
   one hairline-outlined reading "目次を見る".
3. To the right of the hero: one precise, delicate line diagram of nested boxes
   (a box containing smaller boxes, containing smaller boxes), drawn in thin ink strokes,
   one inner box stroked in the accent color. This diagram is the single focal point.
4. Below: a quiet chapter index — two columns of hairline-ruled rows, each row a small
   number and a greeked text bar. Labels "npm" "yarn" "pnpm" appear once as tiny
   monospace tags in one row.
5. Footer: one centered greeked line and one small accent-filled button.

TEXT: Render verbatim, exactly once each, and no other readable text anywhere:
"node_modules" "その下に、構造がある。" "読みはじめる" "目次を見る" "npm" "yarn" "pnpm".
All remaining text is abstract thin gray greeked bars.
```
