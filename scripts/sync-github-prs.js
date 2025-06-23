import { createClient } from "@supabase/supabase-js";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!GITHUB_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("必要な環境変数が設定されていません");
    console.error("GITHUB_TOKEN:", !!GITHUB_TOKEN);
    console.error("SUPABASE_URL:", !!SUPABASE_URL);
    console.error("SUPABASE_SERVICE_KEY:", !!SUPABASE_SERVICE_KEY);
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const REPOSITORIES = ["hideakikondo/mintgreen"];

/**
 * GitHub APIからオープンなPull Requestsを取得
 * @param {string} owner リポジトリオーナー
 * @param {string} repo リポジトリ名
 * @returns {Promise<Array>} Pull Requestsの配列
 */
async function fetchOpenPRs(owner, repo) {
    const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls?state=open`,
        {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                Accept: "application/vnd.github.v3+json",
                "User-Agent": "mintgreen-pr-sync",
            },
        },
    );

    if (!response.ok) {
        throw new Error(
            `GitHub API error: ${response.status} ${response.statusText}`,
        );
    }

    return await response.json();
}

/**
 * Pull RequestをSupabaseデータベースに同期
 * @param {Object} pr Pull Requestオブジェクト
 * @param {string} owner リポジトリオーナー
 * @param {string} repo リポジトリ名
 * @returns {Promise<boolean>} 成功した場合true
 */
async function syncPRToDatabase(pr, owner, repo) {
    const issueData = {
        github_issue_number: pr.number,
        repository_owner: owner,
        repository_name: repo,
        title: pr.title,
        body: pr.body,
        branch_name: pr.head.ref,
        created_at: pr.created_at,
        updated_at: pr.updated_at,
    };

    try {
        const { data: existingIssue, error: selectError } = await supabase
            .from("github_issues")
            .select("issue_id, updated_at")
            .eq("github_issue_number", pr.number)
            .eq("repository_owner", owner)
            .eq("repository_name", repo)
            .single();

        if (selectError && selectError.code !== "PGRST116") {
            throw selectError;
        }

        if (existingIssue) {
            if (new Date(existingIssue.updated_at) < new Date(pr.updated_at)) {
                const { error } = await supabase
                    .from("github_issues")
                    .update(issueData)
                    .eq("issue_id", existingIssue.issue_id);

                if (error) {
                    throw error;
                }
                console.log(
                    `PR #${pr.number} (${owner}/${repo}) を更新しました`,
                );
            } else {
                console.log(
                    `PR #${pr.number} (${owner}/${repo}) は既に最新です`,
                );
            }
        } else {
            const { error } = await supabase
                .from("github_issues")
                .insert(issueData);

            if (error) {
                throw error;
            }
            console.log(
                `PR #${pr.number} (${owner}/${repo}) を新規追加しました`,
            );
        }
        return true;
    } catch (error) {
        console.error(
            `PR #${pr.number} (${owner}/${repo}) の同期に失敗:`,
            error.message,
        );
        return false;
    }
}

/**
 * メイン処理
 */
async function main() {
    console.log("GitHub PRs同期を開始します...");
    console.log(`監視対象リポジトリ: ${REPOSITORIES.join(", ")}`);

    let totalSynced = 0;
    let totalErrors = 0;

    for (const repository of REPOSITORIES) {
        const [owner, repo] = repository.split("/");
        console.log(`\n${repository} のPRsを取得中...`);

        try {
            const prs = await fetchOpenPRs(owner, repo);
            console.log(`${prs.length} 件のオープンPRsが見つかりました`);

            for (const pr of prs) {
                try {
                    const success = await syncPRToDatabase(pr, owner, repo);
                    if (success) {
                        totalSynced++;
                    } else {
                        totalErrors++;
                    }
                } catch (error) {
                    console.error(
                        `PR #${pr.number} の同期でエラー:`,
                        error.message,
                    );
                    totalErrors++;
                }
            }
        } catch (error) {
            console.error(`${repository} のPRs取得でエラー:`, error.message);
            totalErrors++;
        }
    }

    console.log(`\n同期完了: ${totalSynced} 件成功, ${totalErrors} 件エラー`);

    if (totalErrors > 0) {
        console.log("エラーが発生しましたが、処理は継続されました");
        process.exit(1);
    }
}

main().catch((error) => {
    console.error("スクリプト実行エラー:", error.message);
    process.exit(1);
});
