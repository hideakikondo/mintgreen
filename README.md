# Mintgreen - オンライン投票アプリケーション

Mintgreenは、React 19、TypeScript、Vite、Supabaseを使用して構築されたモダンなオンライン投票システムです。

## 概要

このアプリケーションは、デジタル選挙や投票を安全かつ効率的に実施するためのプラットフォームです。有権者登録から投票、結果表示まで、選挙プロセス全体をサポートします。

## 主な機能

- **有権者登録**: 身分証明書番号による有権者の登録・管理
- **選挙管理**: 管理者による選挙の作成・編集・管理
- **候補者管理**: 選挙候補者の登録と情報管理
- **投票機能**: 有権者による安全な投票の実施
- **結果表示**: リアルタイムでの投票結果の確認
- **管理者機能**: 選挙全体の管理と監視

## 技術スタック

- **フロントエンド**: React 19, TypeScript, Vite
- **バックエンド**: Supabase (PostgreSQL, Authentication, Real-time)
- **ルーティング**: React Router DOM
- **スタイリング**: CSS
- **テスト**: Vitest, Testing Library
- **リンター**: Biome

## 前提条件

- Node.js (推奨: 18.x以上)
- npm または yarn
- Supabaseアカウント

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/hideakikondo/mintgreen.git
cd mintgreen
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.example`ファイルを`.env`にコピーし、Supabaseの認証情報を設定してください：

```bash
cp .env.example .env
```

`.env`ファイルを編集し、以下の値を設定：

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Supabaseの認証情報は、Supabaseダッシュボードの「Project Settings」→「API」で確認できます。

### 4. データベースの設定

Supabaseプロジェクトで以下のテーブルを作成してください：
- `voters` (有権者情報)
- `elections` (選挙情報)
- `candidates` (候補者情報)
- `votes` (投票記録)

## 開発

### 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは http://localhost:5174 で利用できます。

### その他のコマンド

```bash
# ビルド
npm run build

# プレビュー
npm run preview

# リンター実行
npm run lint

# フォーマット
npm run format

# テスト実行
npm run test
```

## プロジェクト構造

```
src/
├── app/                    # ページコンポーネント
│   ├── admin/             # 管理者機能
│   ├── vote/              # 投票機能
│   └── register/          # 有権者登録
├── components/            # 再利用可能なコンポーネント
│   ├── admin/            # 管理者用コンポーネント
│   └── common/           # 共通コンポーネント
├── lib/                  # ライブラリとユーティリティ
├── types/                # TypeScript型定義
└── App.tsx               # メインアプリケーション
```

## ライセンス

このプロジェクトはApache License 2.0の下でライセンスされています。詳細は[LICENSE](LICENSE)ファイルをご覧ください。
