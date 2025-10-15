# 技術スタック

## フロントエンド
- **React 19** - モダン機能を備えた最新のReact
- **TypeScript** - 型安全なJavaScript開発
- **Vite** - 高速ビルドツールと開発サーバー
- **React Router DOM v7** - クライアントサイドルーティング
- **CSS** - スタイリング用のバニラCSS（フレームワークなし）

## バックエンド・データベース
- **Supabase** - 以下を提供するBackend-as-a-Service:
  - PostgreSQLデータベース
  - 認証
  - リアルタイム購読
  - 行レベルセキュリティ（RLS）

## 追加ライブラリ
- **sql.js** - ローカルデータ処理用のブラウザ内SQLite
- **@supabase/supabase-js** - Supabaseクライアントライブラリ

## 開発ツール
- **Biome** - 高速リンター・フォーマッター（ESLint + Prettierの代替）
- **Vitest** - テストフレームワーク
- **Testing Library** - Reactコンポーネントテストユーティリティ

## よく使うコマンド

```bash
# 開発
npm run dev              # 開発サーバー起動 (http://localhost:5174)
npm run build           # 本番用ビルド
npm run preview         # 本番ビルドのプレビュー

# コード品質
npm run lint            # Biomeリンター実行
npm run format          # Biomeでコードフォーマット

# テスト
npm run test            # Vitestでテスト実行

# GitHub連携
npm run sync-prs        # GitHub PRsを手動でデータベースに同期
```

## コードスタイル規約
- **インデント**: 4スペース（biome.jsonで設定）
- **クォート**: JavaScript/TypeScriptでダブルクォート
- **インポート整理**: Biomeによる自動整理
- **TypeScript**: 厳密モード有効、明示的な`any`型は禁止

## ビルド設定
- **Vite設定**: sql.jsを最適化から除外、親ディレクトリアクセス許可
- **TypeScript**: アプリとnodeで別々の設定を持つプロジェクト参照設定
- **出力**: `dist/`ディレクトリに静的ファイルをビルド