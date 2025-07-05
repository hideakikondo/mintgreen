# Mintgreen - いどばた政策政策 みんなの共感表明(α版)

Mintgreenは、React 19、TypeScript、Vite、Supabaseを使用して構築されたモダンなオンライン投票システムです。

## 概要

このアプリケーションは、デジタル選挙や投票を安全かつ効率的に実施するためのプラットフォームです。有権者登録から投票、結果表示まで、選挙プロセス全体をサポートします。

## 主な機能

- **有権者登録**: 身分証明書番号による有権者の登録・管理
- **GitHub Issues評価**: GitHub Pull Requestsの自動同期と投票機能

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
- `github_issues` (GitHub Issues/PRs情報)
- `issue_votes` (Issue投票記録)
- `issue_comments` (Issueコメント)

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

# GitHub PRs同期（手動実行）
npm run sync-prs
```

## GitHub Actions

### Pull Requests自動同期

このプロジェクトでは、GitHub Actionsを使用して毎日自動的に指定されたリポジトリのPull Requestsを管理し、Supabaseの`github_issues`テーブルに同期します。

**主な機能:**
- オープンなPull Requestsの自動同期
- クローズされたPull Requestsの自動削除
- 重複チェックと更新日時による差分同期

#### 設定方法

1. GitHubリポジトリの「Settings」→「Secrets and variables」→「Actions」で以下のSecretsを設定：
   - `GITHUB_TOKEN`: GitHub Personal Access Token (repo権限が必要)
   - `SUPABASE_URL`: SupabaseプロジェクトのURL
   - `SUPABASE_SERVICE_KEY`: Supabaseのサービスキー（anon keyではなく）

2. ワークフローは毎日午前9時（UTC）= 日本時間18時に自動実行されます

## データベース設定

### ランキング用RPC関数の作成

正確なIssueランキングを高速で取得するため、以下のPostgreSQL関数をSupabaseダッシュボードで実行してください：

```sql
CREATE OR REPLACE FUNCTION get_top_ranked_issues(limit_count INT DEFAULT 5)
RETURNS TABLE (
    issue_id TEXT,
    title TEXT,
    body TEXT,
    github_issue_number BIGINT,
    repository_owner TEXT,
    repository_name TEXT,
    created_at TIMESTAMPTZ,
    plus_one_count INT,
    minus_one_count INT,
    branch_name TEXT,
    good_votes BIGINT,
    bad_votes BIGINT,
    total_good_count BIGINT,
    total_bad_count BIGINT,
    score BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH vote_counts AS (
        SELECT 
            iv.issue_id,
            COALESCE(SUM(CASE WHEN iv.vote_type = 'good' THEN 1 ELSE 0 END), 0) as good_votes,
            COALESCE(SUM(CASE WHEN iv.vote_type = 'bad' THEN 1 ELSE 0 END), 0) as bad_votes
        FROM issue_votes iv
        GROUP BY iv.issue_id
    )
    SELECT 
        gi.issue_id,
        gi.title,
        gi.body,
        gi.github_issue_number,
        gi.repository_owner,
        gi.repository_name,
        gi.created_at,
        gi.plus_one_count,
        gi.minus_one_count,
        gi.branch_name,
        COALESCE(vc.good_votes, 0) as good_votes,
        COALESCE(vc.bad_votes, 0) as bad_votes,
        (COALESCE(vc.good_votes, 0) + COALESCE(gi.plus_one_count, 0)) as total_good_count,
        (COALESCE(vc.bad_votes, 0) + COALESCE(gi.minus_one_count, 0)) as total_bad_count,
        (COALESCE(vc.good_votes, 0) + COALESCE(gi.plus_one_count, 0)) - 
        (COALESCE(vc.bad_votes, 0) + COALESCE(gi.minus_one_count, 0)) as score
    FROM github_issues gi
    LEFT JOIN vote_counts vc ON gi.issue_id = vc.issue_id
    ORDER BY score DESC
    LIMIT limit_count;
END;
$$;
```

この関数により、全てのIssueを対象とした正確なランキングを効率的に取得できます。関数が利用できない場合は、自動的にクライアント側での計算にフォールバックします。

3. 手動実行も可能：「Actions」タブから「Sync GitHub Pull Requests」ワークフローを選択し、「Run workflow」をクリック

#### 監視対象リポジトリ

現在の監視対象：
- `team-mirai/policy`

他のリポジトリを追加する場合は、`scripts/sync-github-prs.js`の`REPOSITORIES`配列を編集してください。

## プロジェクト構造

```
src/
├── app/                    # ページコンポーネント
│   ├── issues/            # GitHub Issues機能
│   └── issue-vote/        # Issue投票機能
├── components/            # 再利用可能なコンポーネント
│   ├── admin/            # 管理者用コンポーネント
│   └── common/           # 共通コンポーネント
├── lib/                  # ライブラリとユーティリティ
├── types/                # TypeScript型定義
└── App.tsx               # メインアプリケーション
```

## ライセンス

このプロジェクトはApache License 2.0の下でライセンスされています。詳細は[LICENSE](LICENSE)ファイルをご覧ください。
