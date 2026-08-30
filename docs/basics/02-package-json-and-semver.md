# 2. package.json とバージョン範囲

[1章](/basics/01-what-is-a-package-manager)の実験で、`npm install left-pad` が package.json に `"left-pad": "^1.3.0"` と書き込むのを見ました。なぜ `1.3.0` ちょうどではなく `^` 付きなのでしょうか。この章では package.json というファイルの全体像と、`^` や `~` が表す「バージョン範囲」の読み方を身につけます。

::: tip この章でわかること
- package.json の主要フィールドの役割を説明できる
- セマンティックバージョニングの 3 つの数字の意味を説明できる
- `^1.2.3` と `~1.2.3` がそれぞれ許すバージョンの範囲を読み取れる
- dependencies / devDependencies / peerDependencies / optionalDependencies を使い分けられる
- lifecycle スクリプト(pre / post / postinstall)の仕組みを説明できる
:::

## package.json はプロジェクトのマニフェスト

package.json は、プロジェクトの**マニフェスト(積荷目録)**です。船の積荷目録に「何をどれだけ積んでいるか」が書かれているように、package.json には「このプロジェクトは何者で、何に依存し、どんなコマンドを持つか」が書かれています。1 章で見た「解決」の工程は、必ずこのファイルを読むところから始まります。

主要なフィールドを見てみましょう。

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^19.2.8"
  },
  "devDependencies": {
    "vite": "^8.2.2",
    "vitest": "^4.1.11"
  }
}
```

- **name / version**: パッケージとしての名前とバージョン。レジストリに publish する場合は世界で一意な名前が必要ですが、アプリ開発では識別用のラベル程度の意味です。
- **scripts**: `npm run dev` のように呼び出せるコマンドの登録簿。詳しくはこの章の後半で扱います。
- **dependencies 系**: 依存パッケージの一覧。実は 4 種類あり、これもこの章の後半で整理します。

大事なのは、dependencies に書かれているのが**具体的なバージョンではなく「要求の範囲」**だという点です。`^19.2.8` は「19.2.8 ちょうど」ではなく「ある条件を満たすバージョンのどれか」を意味します。その読み方の前提となるのが、次のセマンティックバージョニングです。

## セマンティックバージョニング — 3 つの数字の約束

npm の世界のバージョン番号は、**セマンティックバージョニング(Semantic Versioning、通称 semver)**という規約に従います。`MAJOR.MINOR.PATCH` の 3 つの数字で、それぞれ上げる条件が決まっています。

<figure>
  <img src="/images/fig-02-1.png" alt="semver の 3 つの数字の意味">
  <figcaption><span class="fig-num">図 2-1</span> semver の 3 つの数字の意味</figcaption>
</figure>

::: details 図 2-1 の ChatGPT 生成プロンプト(クリックで展開)

```text
STYLE PRESET (apply exactly; keep consistent with all previous diagrams in this series):
Flat 2D vector infographic in a minimal technical-illustration style. Landscape orientation (3:2).
Pure white background (#FFFFFF). Limited palette: near-black ink #1C1E21 for text and outlines,
blue #2563EB as the single primary accent, light gray #E2E8F0 for container boxes,
orange #F59E0B for highlights only. Uniform medium-weight rounded strokes, simple geometric
icons, generous white space, clear visual hierarchy.
No gradients, no shadows, no 3D, no textures, no photorealism, no decorative background elements.
All labels in English, short (1-3 words), bold sans-serif, high contrast, perfectly legible.
Render every quoted label verbatim, exactly once, with no extra, invented, or duplicated text.
No text other than the labels listed below.

DIAGRAM CONTENT:
LAYOUT: Two horizontal bands. The upper band shows one large version number centered as three
big digits separated by two dots, all on the same baseline. The lower band has three equally
sized rounded rectangles, evenly spaced, each horizontally centered directly below its
corresponding digit. One short vertical line connects each digit straight down to the box below it.
ELEMENTS:
- Upper band: the three digits are "1" in orange, "2" in blue, "3" in near-black, separated by
  two near-black dots, rendered large as one version number
- Lower left box (orange outline, white fill) with two lines of text: "MAJOR" then "breaking change"
- Lower center box (blue outline, white fill) with two lines of text: "MINOR" then "new feature"
- Lower right box (light gray fill) with two lines of text: "PATCH" then "bug fix"
ARROWS: exactly three short plain vertical lines, no arrowheads, each connecting one digit
straight down to the box directly beneath it. No other lines or connectors anywhere.
```

:::

- **MAJOR(1 桁目)**: 互換性を壊す変更(breaking change)をしたら上げる。利用者のコード修正が必要になるかもしれない合図。
- **MINOR(2 桁目)**: 後方互換な機能追加をしたら上げる。既存コードはそのまま動くはず。
- **PATCH(3 桁目)**: 後方互換なバグ修正をしたら上げる。

つまりバージョン番号は単なる連番ではなく、**「この更新を取り込んでも安全か」を機械が判定できるようにした通信規約**です。「MINOR と PATCH なら壊れないはず」という約束があるからこそ、次に見る「範囲指定」が成立します。

なお、この約束はあくまで公開者の自己申告です。MINOR アップデートのつもりが実際にはバグを含んでいた、という事故は現実に起こります。この「約束は破られうる」という点が、[4章](/basics/04-lockfiles)で見るロックファイルの存在理由につながります。

## `^` と `~` — 範囲指定の読み方

では、1 章のインストールで自動追記された `^1.3.0` の `^` は、正確にはどこまでの更新を許すのでしょうか。semver の約束を前提に、package.json では「どこまでの更新を自動で受け入れるか」を記号で指定します。代表は `^`(キャレット)と `~`(チルダ)の 2 つです。

<figure>
  <img src="/images/fig-02-2.png" alt="^1.2.3 と ~1.2.3 が許す範囲の数直線">
  <figcaption><span class="fig-num">図 2-2</span> <code>^1.2.3</code> と <code>~1.2.3</code> が許す範囲の数直線</figcaption>
</figure>

::: details 図 2-2 の ChatGPT 生成プロンプト(クリックで展開)

```text
STYLE PRESET (apply exactly; keep consistent with all previous diagrams in this series):
Flat 2D vector infographic in a minimal technical-illustration style. Landscape orientation (3:2).
Pure white background (#FFFFFF). Limited palette: near-black ink #1C1E21 for text and outlines,
blue #2563EB as the single primary accent, light gray #E2E8F0 for container boxes,
orange #F59E0B for highlights only. Uniform medium-weight rounded strokes, simple geometric
icons, generous white space, clear visual hierarchy.
No gradients, no shadows, no 3D, no textures, no photorealism, no decorative background elements.
All labels in English, short (1-3 words), bold sans-serif, high contrast, perfectly legible.
Render every quoted label verbatim, exactly once, with no extra, invented, or duplicated text.
No text other than the labels listed below.

DIAGRAM CONTENT:
LAYOUT: Two horizontal number lines stacked vertically, one above the other, sharing exactly
the same length, the same left edge, and the same three tick positions so the two rows can be
compared by eye. Each row has its title on the far left, outside the line. A thick blue bar sits
directly on top of each line, spanning only the allowed range.
ELEMENTS:
- Both number lines have three ticks at the same horizontal positions, labeled below the line:
  "1.2.3" at the left tick, "1.3.0" at the middle tick, "2.0.0" at the right tick
- Top row: title "^1.2.3" on the far left. Its blue bar starts at the "1.2.3" tick and ends just
  before the "2.0.0" tick, so the bar covers the middle tick. A small orange X sits on the
  "2.0.0" tick.
- Bottom row: title "~1.2.3" on the far left. Its blue bar starts at the "1.2.3" tick and ends
  just before the "1.3.0" tick, so the bar stops before the middle tick. A small orange X sits
  on the "1.3.0" tick.
ARROWS: none. No other lines or connectors anywhere in the diagram.
```

:::

- **`^1.2.3`(キャレット)**: MAJOR を固定し、MINOR と PATCH の更新を許す。つまり `1.2.3` 以上 `2.0.0` 未満。「互換性が保たれる範囲で最新を使う」という意味で、`npm install` の既定はこれです。
- **`~1.2.3`(チルダ)**: MINOR まで固定し、PATCH の更新だけを許す。つまり `1.2.3` 以上 `1.3.0` 未満。より保守的な指定です。
- **`1.2.3`(記号なし)**: そのバージョンちょうどに固定(ピン留め)。

2 つの違いは、具体的なバージョンを範囲に当てはめてみると一目でわかります。

| 指定 | 意味する範囲 | 1.2.4 は | 1.3.0 は | 1.9.9 は | 2.0.0 は |
| --- | --- | :-: | :-: | :-: | :-: |
| `^1.2.3` | 1.2.3 以上 2.0.0 未満 | 許す | 許す | 許す | 拒む |
| `~1.2.3` | 1.2.3 以上 1.3.0 未満 | 許す | 拒む | 拒む | 拒む |
| `1.2.3` | 1.2.3 のみ | 拒む | 拒む | 拒む | 拒む |

覚え方は「`^` は MAJOR だけ守る、`~` は MINOR まで守る」。このほか `>=1.2.0 <2.0.0` のような不等号や、`1.2.x` のようなワイルドカードも書けますが、実務で目にするのはほぼ `^` です。

この判定は手元で確かめられます。semver の判定ロジックそのものが `semver` というパッケージとして公開されており(npm 自身も内部でこれを使っています)、CLI として実行できます。渡したバージョンのうち、範囲を満たすものだけが表示されます。

<TermDemo
  title="zsh — semver 範囲の判定を確かめる"
  :lines="[
    { cmd: 'npx semver -r \'^1.2.3\' 1.2.4 1.3.0 1.9.9 2.0.0' },
    { out: '1.2.4' },
    { out: '1.3.0' },
    { out: '1.9.9' },
    { pause: 400 },
    { cmd: 'npx semver -r \'~1.2.3\' 1.2.4 1.3.0 1.9.9 2.0.0' },
    { out: '1.2.4' },
    { pause: 400 },
    { cmd: 'npx semver -r \'^0.2.3\' 0.2.4 0.3.0' },
    { out: '0.2.4' },
  ]"
/>

```sh
$ npx semver -r '^1.2.3' 1.2.4 1.3.0 1.9.9 2.0.0
$ npx semver -r '~1.2.3' 1.2.4 1.3.0 1.9.9 2.0.0
$ npx semver -r '^0.2.3' 0.2.4 0.3.0
```

(初回は `npx` がパッケージ取得の確認を求めることがあります。y で進めてください)

最後の `^0.2.3` の結果に注目してください。表の規則(MAJOR だけ守る)なら 0.3.0 も通るはずなのに、**弾かれています**。

::: warning つまずきポイント: 0.x 系では `^` の意味が変わる
MAJOR が 0 のバージョン(`0.x.y`)は「まだ何が壊れるかわからない開発版」という扱いで、互換性の約束の対象外です。そのため `^` の解釈も変わります。正確な規則は「**一番左にあるゼロでない数字を固定する**」です。

- `^1.2.3` → `1.2.3` 以上 `2.0.0` 未満(1 を固定)
- `^0.2.3` → `0.2.3` 以上 `0.3.0` 未満(2 を固定。**0.3.0 は含まない**)
- `^0.0.3` → `0.0.3` のみ(3 を固定)

「`^` を付けているのに更新が全然入らない」「0.x のライブラリが MINOR 更新で壊れた」と感じたら、まずここを疑ってください。
:::

::: info なぜ既定が「固定」ではなく `^` なのか
固定すればズレは起きませんが、バグ修正やセキュリティ修正も自動では入らなくなり、数十〜数百の依存を手で上げ続ける羽目になります。`^` は「semver の約束を信頼して、安全なはずの更新は自動で受け取る」という、利便性側に倒したトレードオフです。そして、その信頼だけでは足りない部分を補うのが 4 章のロックファイルです。
:::

## 依存の 4 つの置き場所

dependencies 系のフィールドは 4 種類あります。どれに書くかで「いつ・誰の環境にインストールされるか」が変わります。

<!-- 🖼️ 画像プレースホルダー: 生成した画像を docs/public/images/fig-02-3.png に保存し、下の行のコメントを外してください -->
<!-- ![図 2-3: dependencies の種類マップ](/images/fig-02-3.png) -->

> **🖼️ 図 2-3|dependencies の種類マップ**(画像プレースホルダー)
> 生成後は `docs/public/images/fig-02-3.png` に配置してください。

::: details 図 2-3 の ChatGPT 生成プロンプト(クリックで展開)

```text
STYLE PRESET (apply exactly; keep consistent with all previous diagrams in this series):
Flat 2D vector infographic in a minimal technical-illustration style. Landscape orientation (3:2).
Pure white background (#FFFFFF). Limited palette: near-black ink #1C1E21 for text and outlines,
blue #2563EB as the single primary accent, light gray #E2E8F0 for container boxes,
orange #F59E0B for highlights only. Uniform medium-weight rounded strokes, simple geometric
icons, generous white space, clear visual hierarchy.
No gradients, no shadows, no 3D, no textures, no photorealism, no decorative background elements.
All labels in English, short (1-3 words), bold sans-serif, high contrast, perfectly legible.
Render every quoted label verbatim, exactly once, with no extra, invented, or duplicated text.
No text other than the labels listed below.

DIAGRAM CONTENT:
LAYOUT: A 2x2 grid of four rounded rectangles of equal size, each containing a title label
and one short descriptor label below it.
ELEMENTS:
- Top left box (blue) titled "dependencies" with descriptor "runtime"
- Top right box (light gray) titled "devDependencies" with descriptor "dev only"
- Bottom left box (light gray) titled "peerDependencies" with descriptor "host provides"
- Bottom right box (light gray, orange outline) titled "optionalDependencies" with
  descriptor "may fail"
ARROWS: none.
```

:::

- **dependencies**: アプリの実行そのものに必要なもの(react、express など)。あなたのパッケージを誰かがインストールしたとき、一緒にインストールされます。
- **devDependencies**: 開発・ビルド・テストにだけ必要なもの(vite、vitest、eslint など)。自分のプロジェクトで `npm install` すれば入りますが、あなたのパッケージの利用者には入りません。`npm install --save-dev`(短縮形 `-D`)でここに追加されます。
- **peerDependencies**: 「私はこれと**一緒に**使われる前提です。ただし実体は利用者側が用意してください」という宣言。典型例は React のプラグインで、プラグイン自身が react を抱え込むと、アプリ本体の react と二重になって壊れるため、「react 19 系を隣に置いてね」とだけ表明します。バージョンが合わない場合の挙動はツールごとに違いがあり、警告の読み方は 10 章のアドバンテージ比較でも触れます。
- **optionalDependencies**: 入れば使うが、インストールに失敗しても全体を止めないもの。OS 依存の高速化モジュールなどに使われます。

アプリ開発での使い分けはシンプルに、「本番コードが `import` するものは dependencies、それ以外は devDependencies」と覚えておけばほぼ困りません。

## 範囲指定が生む「人によって違う」問題

さて、`^` の便利さには代償があります。**範囲指定は「そのとき存在する最新」を選ぶ**ため、インストールする時点が違えば選ばれるバージョンも違うのです。

あなたが 1 月に `"react": "^19.2.0"` と書いてインストールし、19.2.0 が入ったとします。3 月に新メンバーが同じ package.json で `npm install` すると、その時点の最新である 19.2.8 が入るかもしれません。**同じ package.json なのに、手元に入るバージョンが人によって違う**——semver の約束が守られていれば理論上は問題ないはずですが、現実には「私の環境では動くのに」という再現性の問題を引き起こします。

::: warning つまずきポイント: `^` を書いても「勝手に」は更新されない
逆方向の誤解にも注意してください。`^19.2.0` と書いてあっても、新バージョンの公開と同時に手元の node_modules が変わるわけではありません。範囲が評価されるのは**インストールを実行した瞬間だけ**です。つまり問題は「常に最新が入ってしまう」ことではなく、「**インストールした時期によって結果が変わる**」こと。ズレは時間差から生まれます。
:::

この問題は package.json だけでは原理的に解決できません。「範囲」を書いている以上、選択の余地が残るからです。解決策は「実際に選んだ結果」を別のファイルに記録しておくこと——それが [4章](/basics/04-lockfiles)で扱うロックファイルです。この伏線を覚えたまま読み進めてください。

## scripts と lifecycle スクリプト

最後に scripts フィールドです。`"dev": "vite"` と登録しておけば `npm run dev` で実行できる、というコマンドの登録簿ですが、知っておくべき仕組みが 2 つあります。

1 つ目は **pre / post の自動実行**です。`build` に対して `prebuild` / `postbuild` という名前のスクリプトがあると、`npm run build` の前後で自動的に実行されます。名前だけで暗黙に連鎖する点に注意してください。

2 つ目が **lifecycle スクリプト**です。scripts には、コマンドとしてではなく**インストールなどの出来事をフックして**走る特別な名前があります。代表が `postinstall` で、そのパッケージのインストール直後に自動実行されます。ネイティブモジュールのビルドなど正当な用途がある一方、これは「**パッケージを入れただけで、あなたのマシン上で任意のコードが走る**」ということでもあります。1 章で見たとおりレジストリには誰でも publish できるため、postinstall はサプライチェーン攻撃の常套手段になってきました。pnpm がこのスクリプトを既定でブロックするという話を Part III で扱います。ここでは「install は単なるファイルコピーではなく、コード実行を伴いうる」と覚えておいてください。

## 実験: レジストリのバージョン情報を覗く

「解決」の工程がレジストリのメタデータを読む、という 1 章の話を実際に確かめてみます。`npm view` は、インストールせずにメタデータだけを覗くコマンドです。

```sh
$ npm view react version
```

```
19.2.8
```

執筆時点の react の最新は 19.2.8 とわかりました(手元では数字が進んでいるはずです)。次に、公開されている**全バージョン**を見てみます。

```sh
$ npm view react versions --json | wc -l
```

```
    2926
```

なんと約 3,000 行。react は 1 つの「パッケージ」ですが、その下に膨大な数の「バージョン」がぶら下がっていることがわかります。末尾を覗くと──

```sh
$ npm view react versions --json | tail -4
```

```
  "19.3.0-canary-fa50caf5-20251107",
  "19.3.0-canary-fb2177c1-20251114",
  "19.3.0-canary-fd524fe0-20251121",
  "19.3.0-canary-fef12a01-20260413"
]
```

`19.3.0-canary-...` のように、ハイフン以降に**プレリリース識別子**が付いたバージョンが並んでいます。プレリリース版は `^` の範囲には含まれず、明示的に指定した人にだけ入る仕組みです。`npm view react dependencies` や `npm view express dist.tarball` なども試してみると、レジストリのメタデータに何が入っているか実感できます。

## まとめ

- package.json はプロジェクトのマニフェストで、名前・スクリプト・依存の「要求」を記述する
- semver は MAJOR(破壊的変更)/ MINOR(機能追加)/ PATCH(バグ修正)という更新内容の通信規約
- `^1.2.3` は 2.0.0 未満まで、`~1.2.3` は 1.3.0 未満までの更新を許す。npm の既定は `^`
- ただし 0.x 系では `^` の意味が変わる(一番左のゼロでない数字を固定。`^0.2.3` に 0.3.0 は含まれない)
- 依存の置き場所は dependencies / devDependencies / peerDependencies / optionalDependencies の 4 種類
- 範囲指定は「同じ package.json でも人によって違うバージョンが入る」問題を生む(4 章で回収)
- postinstall などの lifecycle スクリプトにより、インストールはコード実行を伴いうる(Part III で回収)

次章では、こうして解決された依存たちが実際に配置される場所——node_modules の構造——に踏み込みます。本書で最も重要な章です。
