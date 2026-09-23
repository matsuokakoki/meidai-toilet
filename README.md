# 名大トイレ | Meidai Toilet

名古屋大学のキャンパスで、近くのトイレを地図から探せるWebアプリです。設備、口コミ、距離などを見比べて行き先を選べるほか、時間帯・立地・設備・天気を使った混雑度の推定も確認できます。

> **大学サークルで後輩メンバーと開発したプロジェクトのportfolio mirrorです。** [Original repository: jack-app/meidai_toilet](https://github.com/jack-app/meidai_toilet) のGit履歴を引き継いでいます。

## 30秒でわかるプロジェクト

- **目的:** 名大構内で、近くて自分の条件に合うトイレを素早く見つける。
- **地図検索:** トイレの場所、建物名、距離、設備、評価、推定混雑度を地図上で確認。
- **絞り込み:** 性別、営業中、多目的、ジェンダーニュートラル、洋式、ウォシュレットなどで検索。
- **詳細と口コミ:** 営業時間や設備、口コミを確認し、お気に入りに保存。
- **混雑予測:** 時刻や天気を切り替えて、混雑度の推定値を比較。端末の位置情報を許可すると、近い順にも並べられます。
- **チーム開発:** 大学サークルで後輩メンバーと開発。主なコード実装は後輩メンバーが担当しました。

## チームでの役割

### チームの成果

トイレの地図・一覧・詳細画面、設備や口コミの表示、混雑予測、お気に入りなどのアプリ機能は、チームで開発した成果です。主なコード実装は後輩メンバーが担当しました。

### 私の担当

私はメンターに近い立場で、次の設計・レビュー面を担当しました。

- アイデア出し
- 使用技術の選定
- UXの実装方針の決定
- 実装内容のレビュー
- 必要に応じた改善提案

このmirror上に私自身のcommitはありません。上記の機能を私個人のコード実装として示すものではありません。技術選定、UX方針、レビュー、改善提案を通じてチームの開発を支援した役割として記載しています。

## UX方針が表れている実装例

以下は現在のコードから確認できるチーム成果の例です。画面実装を私個人が担当したという意味ではありません。

- **地図で候補を見比べる:** 各トイレの位置に加えて、建物、距離、推定混雑度、最寄り候補を地図上で確認できるようにしています。
- **条件に合わせて探す:** 営業中、性別、評価、洋式、多目的、ジェンダーニュートラル、ウォシュレットなど複数の条件で絞り込めます。
- **地図以外の導線も用意:** 下部ナビゲーションから「マップ」「建物」「混雑予測」「マイページ」に移動できます。建物一覧では名前検索や設備条件、詳細画面では営業時間・設備・口コミ・お気に入りを確認できます。
- **予測条件を利用者が調整:** 混雑予測ページでは時刻や天気を切り替え、空いている順・近い順などに並べ替えられます。

## 技術スタック

| 領域 | 技術 | 実装上の役割 |
|---|---|---|
| Webフレームワーク | Next.js App Router 16、React 19 | 地図、建物一覧・詳細、混雑予測、マイページのルーティングと画面 |
| 言語 | TypeScript 5 | UI、データ処理、Supabaseの型付きアクセス |
| スタイル | Tailwind CSS 4、CSS | レイアウトと画面スタイル |
| 地図 | MapLibre GL JS、OpenStreetMap Japanのタイルスタイル | 名大を中心としたインタラクティブな地図とトイレのマーカー |
| データベース | Supabase（PostgreSQL）、`@supabase/supabase-js` | トイレ情報、口コミ、お気に入りの読み書き |
| 天気 | Open-Meteo API | 混雑度推定に使う名大周辺の現在の天気 |
| 開発・品質ツール | pnpm、Volta、ESLint、Prettier、Husky / lint-staged | 依存関係、Node.jsバージョン、lint・整形 |

## アーキテクチャ

トップページはSupabaseからトイレと口コミを取得し、評価情報を加えてクライアント側のMapLibre地図に渡します。建物・混雑予測・マイページはNext.jsの各ルートで画面を構成し、Supabaseクライアントを通してデータを読み書きします。

```text
Next.js App Router
 ├─ /             トイレ地図
 ├─ /buildings    建物・トイレ一覧、詳細
 ├─ /congestion   混雑度の推定と条件変更
 └─ /mypage       お気に入り、口コミ
       │
       ├─ MapLibre GL JS ─ OpenStreetMap Japan tiles
       ├─ Supabase JS ──── Supabase / PostgreSQL
       └─ Open-Meteo ───── 現在の天気
```

Supabaseの主なデータは `toilets`、`reviews`、`favorites` テーブルです。ブラウザー利用者の識別には、`crypto.randomUUID()` で生成したIDを `localStorage` に保存する実装が使われています。Supabase URLと公開用anon keyは `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY` の環境変数から読み込みます。

## 技術選定について

ここでは、技術選定を担当した私の役割と、現在の実装から確認できる構成の適合性を分けています。各技術を選んだ当時の議事録がrepoにあるわけではないため、後半はコードに基づく説明です。

### 私が担当したこと

使用技術の選定を担当しました。採用された構成は、地図を中心とするWebアプリ、トイレ・口コミ・お気に入りのデータ管理、画面上での絞り込みや予測条件の変更を組み合わせています。

### 実装から確認できる構成の適合性

- **Next.js App Router:** マップと、一覧・詳細・予測・マイページをURLごとに分ける構成に適しています。実装ではトップページのデータ取得と、操作の多い各クライアント画面を組み合わせています。
- **MapLibre GL JS:** 地図マーカーや地図操作をWeb画面内で扱えます。地図タイルにはOpenStreetMap Japanのスタイルを指定しています。
- **Supabase / PostgreSQL:** トイレ情報を基に口コミとお気に入りを関連付け、一覧取得や投稿・保存などを行う構成です。別途APIサーバーを実装せず、Supabase JSからデータベースを利用しています。
- **Open-Meteo:** APIキー不要の天気APIから天気を取得し、混雑度推定の入力に使っています。
- **TypeScriptとSupabase型定義:** DBのテーブル行を型として扱い、画面・データアクセス間の型を共有しています。

## 混雑度表示について

混雑度は**実測の人数やリアルタイムの待ち時間ではなく、コード内のルールによる推定値**です。実装では、選択した時刻、営業時間、トイレ設備、キャンパス内の地点と時間帯別ホットスポット、天気などを使ってスコアを計算し、「空き」「やや混雑」「混雑中」に分類します。READMEやUIを読む際にも、実測データと混同しないようにしています。

## ディレクトリ構成

- `app/`: Next.js App Routerの画面と共通スタイル
- `components/MapV4App.tsx`: トップページで使用するMapLibre地図UI
- `components/SharedBottomNav.tsx`: 共通の下部ナビゲーション
- `components/ToiletMapApp.tsx`: 地図データ型や旧UI実装
- `utils/supabase.ts`: トイレ・口コミ・お気に入りのデータアクセス
- `utils/algorithm.ts`: 混雑度・距離の計算
- `utils/weather.ts`: Open-Meteoからの天気取得
- `types/supabase.ts`: SupabaseのTypeScript型
- `supabase/config.toml`: Supabase CLIのローカルプロジェクト設定

## 開発環境

Node.jsはVoltaで管理し、repoではNode.js **24.15.0** を指定しています。環境変数やSupabaseの接続先は各自で用意してください。

```bash
volta install node@24.15.0
volta install pnpm
pnpm install
pnpm dev
```

`pnpm dev` の後、ブラウザーで [http://localhost:3000](http://localhost:3000) を開きます。必要な環境変数は `.env.local` に設定してください。

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

このmirrorには `.env.example`、Supabaseのmigration/seedファイルは含まれていません。動作には、接続可能なSupabaseプロジェクトと対応するテーブル・データが別途必要です。

## Portfolio mirrorについて

このrepoは [jack-app/meidai_toilet](https://github.com/jack-app/meidai_toilet) のGit履歴を維持して、個人ポートフォリオ用に公開しているmirrorです。元repoには変更を加えていません。個人の役割は「チームでの役割」に記載した設計・メンタリング面の貢献であり、アプリの主なコード実装は後輩メンバーによるチーム成果です。
