# プロジェクト構造

## ルートディレクトリ
```
├── src/                    # ソースコード
├── public/                 # 静的アセット
├── scripts/                # ユーティリティスクリプト
├── dist/                   # ビルド出力（生成）
├── .kiro/                  # Kiro設定
├── .github/                # GitHub Actionsワークフロー
└── node_modules/           # 依存関係（生成）
```

## ソースコード構成（`src/`）

### コアアプリケーション
- `main.tsx` - Reactルートを持つアプリケーションエントリーポイント
- `App.tsx` - ルーティング設定を持つメインアプリコンポーネント
- `index.css` - グローバルスタイル
- `vite-env.d.ts` - Vite型定義

### 機能ベース構造
```
src/
├── app/                    # ページコンポーネント（Next.jsスタイル）
│   ├── issues/            # GitHub Issues一覧ページ
│   ├── issue-vote/        # 個別Issue投票ページ
│   ├── view.tsx           # メインダッシュボード/ホームページ
│   └── setup.ts           # アプリ初期化ロジック
├── components/            # 再利用可能なUIコンポーネント
│   ├── admin/            # 管理者専用コンポーネント
│   ├── common/           # 機能間で共有されるコンポーネント
│   └── DisplayNameInput.tsx # スタンドアロンコンポーネント
├── contexts/              # React Contextプロバイダー
├── hooks/                 # カスタムReactフック
├── lib/                   # ユーティリティライブラリと設定
├── types/                 # TypeScript型定義
└── assets/                # 静的アセット（画像、アイコン）
```

## 主要なアーキテクチャパターン

### ページコンポーネント
- Next.js規約に従って`src/app/`に配置
- 各ページはデフォルトコンポーネントをエクスポート
- ページコンポーネントはルーティングロジックとデータ取得を処理

### コンポーネント構成
- `common/` - 複数機能で使用されるコンポーネント
- `admin/` - 管理インターフェースコンポーネント
- ドメイン別にグループ化された機能固有コンポーネント

### 状態管理
- グローバル状態用のReact Context（AuthContext）
- UI操作用のローカルコンポーネント状態
- 永続データとリアルタイム更新用のSupabase

### データベース統合
- `src/lib/database.ts` - データベースユーティリティとクエリ
- `src/lib/supabaseClient.ts` - Supabaseクライアント設定
- `src/types/supabase.ts` - 生成されたデータベース型

## 外部スクリプト
- `scripts/sync-github-prs.js` - GitHub PR同期ユーティリティ
- GitHub Actionsまたは手動実行で独立して動作

## 設定ファイル
- `biome.json` - コードフォーマットとリンティングルール
- `vite.config.ts` - ビルドツール設定
- `tsconfig.*.json` - TypeScriptコンパイラ設定
- `.env` - 環境変数（コミットされない）