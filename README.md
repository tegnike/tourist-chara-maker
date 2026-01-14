# Tourist Character Maker

観光写真にキャラクターを合成するWebアプリケーションです。

## 機能

- 観光写真のアップロード
- Google Gemini APIを使用したAI画像生成
- アスペクト比の自動検出
- 生成結果のプレビュー・ダウンロード

## 技術スタック

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Google Gemini API

## セットアップ

### 必要条件

- Node.js 18以上
- npm または yarn
- Google Gemini APIキー

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/tegnike/tourist-chara-maker.git
cd tourist-chara-maker

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env.local
```

`.env.local`ファイルを編集して、Gemini APIキーを設定してください：

```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:5173 にアクセスしてください。

### ビルド

```bash
npm run build
```

ビルド成果物は`dist/`ディレクトリに出力されます。

## 使い方

1. 「観光写真をアップロード」から写真を選択
2. 「生成する」ボタンをクリック
3. 生成結果が右側に表示されます
4. 必要に応じてダウンロード

## スクリプト

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | プロダクションビルド |
| `npm run preview` | ビルド結果をプレビュー |
| `npm run lint` | ESLintを実行 |

## ライセンス

MIT
