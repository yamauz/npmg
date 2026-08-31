# 5. npm の誕生と進化

Part I では、パッケージマネージャーが「何を」「どういう手順で」しているかを、package.json・node_modules・ロックファイルという 3 つの部品から見てきました。Part II では視点を変えて、「なぜ npm・yarn・pnpm という複数のツールが存在するのか」を歴史から解き明かします。すべての出発点は npm です。

::: tip この章でわかること

- npm が Node.js の「事実上の標準」になった経緯を説明できる
- npm v3 のフラット化と npm v5 のロックファイル導入が、それぞれ何を解決したかを言える
- left-pad 事件(2016)から「依存グラフの脆さ」という教訓を読み取れる
- GitHub 買収後の npm の現在地を把握できる

:::

## Node.js とともに歩みはじめた npm

npm は 2010 年 1 月、Isaac Schlueter 氏によって公開されました。当時の Node.js はまだ生まれたばかりで、ライブラリを使いたければ GitHub からコードをコピーしてくるような時代です。npm は「レジストリにパッケージを登録し、コマンド一発で取得する」という仕組みを Node.js コミュニティに持ち込みました。1 章で見た「パッケージマネージャーの基本形」は、この時点でほぼ完成していたことになります。

では、npm はなぜ「事実上の標準」と呼べるほどの地位を得たのでしょうか。品質や機能が優れていたから——だけではありません。**Node.js 本体に同梱された**ことが大きいのです。Node.js をインストールすれば `npm` コマンドも一緒に入る——この配布形態によって、npm は「選ぶもの」ではなく「最初からそこにあるもの」になりました。水道の蛇口をひねれば水が出るように、`npm install` と打てばパッケージが降ってくる。npm レジストリは JavaScript エコシステムの水道網のような公共インフラへと成長していきます。

この「同梱による標準化」は、本章以降のすべての話の前提になります。yarn も pnpm も、パッケージの取得先は基本的に同じ npm レジストリです。競争が起きたのはあくまで「クライアント側のツール」であって、レジストリという水道網そのものは、今日まで npm が一手に担い続けています。

<figure>
  <img src="/images/fig-05-1.webp" alt="npm の年表(2010〜現在の主要イベント)">
  <figcaption><span class="fig-num">図 5-1</span> npm の年表(2010〜現在の主要イベント)</figcaption>
</figure>

<!-- 図 5-1 の生成プロンプト(採用版・ページには出しない)

STYLE PRESET (apply exactly; keep consistent with all previous diagrams in this series):
Flat 2D vector infographic in a minimal technical-illustration style. Wide landscape orientation
(2:1 aspect ratio, e.g. 2560 x 1280).
Pure white background (#FFFFFF). Limited palette: near-black ink #1C1E21 for text and outlines,
blue #2563EB as the single primary accent, light gray #E2E8F0 for container boxes,
orange #F59E0B for highlights only. Uniform medium-weight rounded strokes, simple geometric
icons, generous white space, clear visual hierarchy.
No gradients, no shadows, no 3D, no textures, no photorealism, no decorative background elements.
All labels in English, short (1-3 words), bold sans-serif, high contrast, perfectly legible.
Render every quoted label verbatim, exactly once, with no extra, invented, or duplicated text.
No text other than the labels listed below.

DIAGRAM CONTENT:
LAYOUT: One long horizontal timeline arrow running left to right across the vertical center of
the canvas, pointing right. Five dots sit on the line, evenly spaced. Each dot has a two-line
text label: the year on the first line and the event on the second line. Labels alternate above
and below the line: the first label above, the second below, the third above, the fourth below,
the fifth above. Each label is horizontally centered on its own dot.
ELEMENTS:
- The timeline is a dark horizontal arrow. Its right end is labeled "now", placed to the right
  of the arrowhead, on the line.
- Dot 1, blue, label "2010" then "npm born"
- Dot 2, blue, label "2015" then "npm v3"
- Dot 3, orange, label "2016" then "left-pad"
- Dot 4, blue, label "2017" then "npm v5"
- Dot 5, blue, label "2020" then "GitHub"
ARROWS: only the single timeline arrow. No other arrows, lines, or connectors anywhere.
-->

## フラット化とロックファイル — v3 と v5

npm 自身も、大きな構造変更を重ねてきました。本書ですでに学んだ 2 つの仕組みは、実はどちらも npm のメジャーバージョンアップの産物です。では、npm はなぜ node_modules の作り方を途中で丸ごと変えるような大工事に踏み切ったのでしょうか。

1 つめは **npm v3(2015)のフラット化**です。[3章](/basics/03-node-modules)で見たとおり、初期の npm(v2 まで)は依存を入れ子(ネスト)構造で配置していました。ネストは「誰が何に依存しているか」をディレクトリ構造がそのまま表す、素直で正確な方式です。しかし依存の依存がどこまでも深くなり、同じパッケージの重複コピーでディスクが膨らみ、Windows ではパス長の上限に激突する——正確さの代償が実用の限界を超えたため、v3 は依存をできるだけ node_modules 直下へ引き上げる(hoisting)方式へ舵を切りました。

この転換の因果をひとつの図にまとめます。ネストの問題を解決した引き換えに、新しい副作用を 1 つ抱え込んだ点に注目してください。

```mermaid
flowchart LR
  nest["ネスト構造(v2 まで)"] --> deep["深すぎる階層"]
  nest --> dup["同じパッケージの重複コピー"]
  deep --> flat["フラット化(v3)"]
  dup --> flat
  flat --> good["ディスク節約・短いパス"]
  flat --> phantom["幽霊依存という副作用"]
```

図の右下——宣言していないパッケージまで import できてしまう「幽霊依存(phantom dependency)」こそ、v3 が支払った代償です。この副作用は以後の npm でも解決されないまま残り、7 章で pnpm が登場する伏線になります。

::: info コラム|濃度盛汁流・初代大将
[1章](/basics/01-what-is-a-package-manager)のらぁめん濃度盛汁流には、代々の大将がいます。npm はその**初代**。何もなかった通りに店を構え、「頼めば全部こっちで揃える」と言い切って行列を作った人です。

やり方は豪快でした。若い頃は具材を頼まれた順に几帳面に重ねていた(ネスト)。しかし丼が深くなりすぎて底が見えない。そこで思い切って**全部を丼の表面に広げた**のが v3 の全部乗せです。客の受けはよかった。ただし頼んでいない具材まで乗っているせいで、客が勝手にそれをあてにしはじめる——初代はこの癖を最後まで直しませんでした。

もう 1 つの癖が、**その日の仕入れを書き留めなかった**こと。腕はいいので味は近いのですが、日によって微妙に違う。伝票を付けはじめたのは v5、次章の二代目に客を取られてからです。
:::

2 つめは **npm v5(2017)の package-lock.json 導入**です。[4章](/basics/04-lockfiles)で説明したように、ロックファイルがなければ「同じ package.json でも、インストールする日によって入るバージョンが違う」という非決定的な状態になります。npm は v5 でようやく、インストール結果を固定するロックファイルを標準搭載しました。「ようやく」と書いたのは理由があります。次章で見るとおり、これは 2016 年に登場した yarn への対抗策という側面が強いのです。

同じ v5 系のリリース(2017)では、**npx** というコマンドも同梱されるようになりました。パッケージをプロジェクトにインストールせず、一時的に取得してそのまま実行するツールです。`npx create-react-app my-app` のような「一度きりのコマンド実行」が定番の使い方で、のちに pnpm の `dlx` など各ツールが同等機能を備えていきます。

::: warning つまずきポイント
v3 のフラット化と v5 のロックファイルは、どちらも「npm の大改修」ですが、解決した問題は別物です。v3 が答えたのは「解決した依存を**どこに置くか**」という配置の問題。v5 が答えたのは「範囲指定が**どのバージョンに確定するかを再現できない**」という決定性の問題。この 2 つを混同すると、次章の「yarn は何が新しかったのか」(答えは後者)が見えなくなります。
:::

## left-pad 事件 — 11 行が世界を止めた日

2016 年 3 月、npm の歴史でもっとも有名な事件が起きます。**left-pad 事件**です。

left-pad は、文字列の左側を指定文字で埋めるだけの、本体わずか 11 行のパッケージでした。作者はパッケージ名をめぐるトラブルをきっかけに、自身が公開していたパッケージ群をレジストリから一斉に取り下げ(unpublish)ます。その中に left-pad が含まれていました。

すると何が起きたか。Babel をはじめとする著名パッケージが、依存グラフの奥深くで left-pad に(間接的に)依存していたため、世界中の `npm install` が「left-pad が見つからない」というエラーで一斉に失敗しはじめたのです。自分では left-pad の名前すら知らない開発者のビルドが、次々に止まりました。ジェンガのタワーから、最下段の小さなブロックを 1 つ抜いたら全体が崩れた——そんな事件でした。

連鎖の様子を図で確認しましょう。倒されたのは末端の小さなブロック 1 つなのに、崩れたのは頂上までの全部でした。

```mermaid
flowchart TD
  unpub["作者がパッケージ群を unpublish"] --> gone["レジストリから left-pad が消える"]
  gone --> mid["left-pad に依存する中間パッケージが解決不能に"]
  mid --> famous["Babel など著名パッケージも解決不能に"]
  famous --> world["世界中のプロジェクトで npm install が失敗"]
```

注目すべきは、この連鎖の当事者のほぼ全員が left-pad を**直接は使っていない**ことです。本章冒頭の水道網の比喩でいえば、浄水場の小さなバルブが 1 つ閉じただけで、蛇口しか知らない全世帯が断水した——依存グラフの「深さ」が、そのまま被害の「広さ」に変換されたのです。

<figure>
  <img src="/images/fig-05-2.webp" alt="left-pad 事件 — 小さな 1 ブロックを抜くと崩れるタワー">
  <figcaption><span class="fig-num">図 5-2</span> left-pad 事件 — 小さな 1 ブロックを抜くと崩れるタワー</figcaption>
</figure>

<!-- 図 5-2 の生成プロンプト(採用版・ページには出しない)

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
LAYOUT: Two towers of stacked blocks side by side, separated by generous white space, both
sitting on the same horizontal baseline. Each tower is four blocks tall, stacked vertically with
the widest block at the bottom. The left tower stands upright and intact. The right tower is the
same tower after its bottom block has been removed: the three upper blocks are tilted and
falling apart, and an empty dashed outline sits where the bottom block used to be.
ELEMENTS:
- Left tower, from top to bottom: a white box with a thin dark outline labeled "your app", a
  white box with a thin dark outline labeled "Babel", a white box with a thin dark outline
  labeled "many packages", and at the very bottom a white box with a thick orange outline
  labeled "left-pad"
- Right tower: the same three upper boxes, tilted at different angles and separated as if
  falling, keeping their labels "your app", "Babel", "many packages"
- At the bottom of the right tower, an empty dashed orange outline where "left-pad" used to be
- Below the left tower, centered, a text label reading "before"
- Below the right tower, centered, an orange text label reading "after unpublish"
ARROWS: none. No other lines or connectors anywhere in the diagram.
-->

事件が示した教訓は 2 つあります。第一に、**依存グラフは自分が見えている範囲よりはるかに深く、脆い**ということ。直接依存が 10 個でも、間接依存を含めれば数百〜数千になり、そのどれか 1 つが消えるだけで全体が壊れます。第二に、**レジストリはもはや公共インフラであり、「作者の自由」だけでは運営できない**ということ。npm はこの事件を受けて、一度公開して一定条件を満たしたパッケージは原則 unpublish できないようポリシーを改めました。

::: info なぜ 11 行のために依存を増やすのか
「11 行なら自分で書けばいいのに」と思うかもしれません。当時の JavaScript には標準の `padStart` がなく(ES2017 で追加)、「小さな処理も再利用する」文化が npm の強みでもありました。細粒度パッケージ文化は生産性の源泉であると同時に、依存グラフを深く脆くする——left-pad 事件はその二面性を突きつけた出来事でした。
:::

## GitHub 傘下の npm、そして現在

2020 年 3 月、GitHub が npm, Inc. を買収しました。レジストリの運営は個人や小さな企業が支えるには巨大になりすぎており、GitHub(その親会社は Microsoft)という大資本の傘下に入ったことで、少なくとも「レジストリが資金難で止まる」心配は遠のきました。

現在の npm は、Node.js 同梱という配布力を背景に**依然として最大シェア**のパッケージマネージャーです。基本機能は成熟し、ロックファイル・workspaces・`npm audit` など、かつて他ツールの専売特許だった機能もひととおり取り込みました。一方で、left-pad 事件で露呈した「依存グラフの脆さ」は、その後**サプライチェーン攻撃(supply chain attack)**という形でより深刻な脅威に変わっていきます。パッケージが「消える」のではなく、「悪意あるコードにすり替わる」時代への対応は、7 章と Part III で扱う各ツールの重要テーマになります。

## 実験: left-pad をレジストリで見てみる

事件の主役 left-pad は、いまもレジストリに残っています(事件後に復旧されました)。`npm view` で確認してみます。

```sh
$ npm view left-pad
```

```
left-pad@1.3.0 | WTFPL | deps: none | versions: 15
String left pad

DEPRECATED ⚠️  - use String.prototype.padStart()

dist
.tarball: https://registry.npmjs.org/left-pad/-/left-pad-1.3.0.tgz
.integrity: sha512-XI5MPzVNApjAyhQzphX8BkmKsKUxD4LdyK24iZeQGinBN9yTQT3bFlCBy/aVx2HrNcqQGsdot8ghrjyrvMCoEA==

maintainers:
- stevemao <maoshuoyu@gmail.com>
```

注目してほしいのは 2 点です。まず `DEPRECATED` の表示。unpublish(削除)ではなく deprecate(非推奨化)が、いまのレジストリで推奨される「引退」の作法です。もう 1 つは `.integrity` のハッシュ値。4 章で見たとおり、ロックファイルはこの値を使って「取得したファイルが改ざんされていないか」を検証しています。11 行のパッケージにも、エコシステムを守る仕組みがきちんと適用されているわけです。

## まとめ

- npm は 2010 年に Isaac Schlueter 氏が公開し、Node.js への同梱によって事実上の標準になった
- npm v3(2015)のフラット化はネスト構造の問題を解決したが、phantom dependency という副作用を生んだ
- npm v5(2017)で package-lock.json と npx が加わった。ロックファイル導入は yarn への対抗という文脈がある
- left-pad 事件(2016 年 3 月)は、11 行のパッケージの unpublish がエコシステム全体を止め、依存グラフの脆さを世に示した
- 2020 年 3 月に GitHub が npm, Inc. を買収。npm は現在も最大シェアを維持している

次章では、この章で何度か名前の出た yarn を取り上げます。2016 年の npm が抱えていた課題と、yarn v1 がそれをどう解決したか、そしてなぜ「yarn 2」で道が分かれたのかを見ていきます。→ [6章 yarn の登場と分岐](/history/06-yarn)
