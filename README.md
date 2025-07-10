# Chat Assistant

OpenAI Assistants APIを使用したElectronデスクトップアプリケーション

## 機能

- **下書き作成**: 大まかな内容を入力
- **AI整理**: テキストを丁寧で適切な返事に整理
- **事実確認**: 内容の正確性をチェック
- **調査機能**: トピックについてインターネットで情報収集
- **会話履歴**: チャットのやりとりを保存・表示

## 必要な環境

- Node.js 18以上
- npm
- OpenAI API キー

## インストール

```bash
# 依存関係をインストール
npm install
```

## 開発

```bash
# 開発モードで起動
npm run dev
```

## ビルド

```bash
# プロダクションビルド
npm run build
```

## パッケージング

```bash
# Windowsインストーラー作成
npm run package:win

# macOSアプリ作成
npm run package:mac

# Linuxアプリ作成
npm run package:linux
```

## 使用方法

1. アプリケーションを起動
2. OpenAI API キーを入力してセットアップ
3. 下書きエリアに大まかな内容を入力
4. 使用したい機能のボタンをクリック
5. AI提案エリアに整理された内容が表示されます

## 設定

- OpenAI API キーは初回起動時に設定
- 設定を変更する場合は「設定変更」ボタンをクリック

## 技術スタック

- **Electron**: デスクトップアプリフレームワーク
- **React**: UIライブラリ
- **TypeScript**: プログラミング言語
- **OpenAI Assistants API**: AI機能
- **Vite**: ビルドツール