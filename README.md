【開発環境のセットアップ手順】
ベースとなる初期環境をGitHubにPushしました！
各自のPCで以下の手順に沿って、環境構築をお願いします。
（※チーム全員でバージョンを完全に統一するため、Node.jsは直接インストールせず「Volta」というツールを使います）

🚨【超重要】すでにNode.jsをインストールしている人へ
公式サイトのインストーラー等で、すでにNode.jsを入れている人は、必ず事前にアンインストールをお願いします！

Windowsの人: 設定 ＞ アプリ ＞ インストールされているアプリ から「Node.js」を探してアンインストール。

Macの人: Homebrewで入れた場合は brew uninstall node を実行。

① リポジトリをクローンしてフォルダに移動

Bash
git clone <ここにGitHubのリポジトリURLを貼る>
cd meidai_toilet
② ツール（Volta・Node・pnpm）のインストール

Bash

# 1. Voltaのインストール

# 公式サイト https://docs.volta.sh/guide/getting-started の手順に従ってインストール。

# ⚠️ インストール後、必ず一度ターミナル（VS Code）を再起動（バツボタンで閉じて開き直す）してください！

# 2. Node.js 24 と pnpm のインストール（ターミナルで実行）

volta install node@24
volta install pnpm
③ パッケージの一括インストール

Bash
pnpm install
(※Windowsの人でエラーが出た場合は、Windowsの「設定」>「プライバシーとセキュリティ（またはシステム）」>「開発者向け」から「開発者モード」をONにして、ターミナルを再起動してからもう一度実行してね！)

④ 環境変数の設定

フォルダ内にある .env.example というファイルをコピーします。

コピーしたファイルの名前を .env.local に変更します。
(※ここに後でSupabaseの接続キーを入れます。このファイルはGitには共有されないので安心してください)

⑤ 起動確認

Bash
pnpm dev
ブラウザで http://localhost:3000 を開いて、Next.jsの画面が表示されれば大成功です！🎉

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
