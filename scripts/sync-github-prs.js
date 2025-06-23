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

const REPOSITORIES = ["team-mirai/policy"];

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
 * GitHub APIから全てのPull Requestsを取得（ページネーション対応）
 * @param {string} owner リポジトリオーナー
 * @param {string} repo リポジトリ名
 * @returns {Promise<Array>} Pull Requestsの配列
 */
async function fetchAllPRs(owner, repo) {
    const allPRs = [];
    let page = 1;
    const perPage = 100;

    while (true) {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&page=${page}&per_page=${perPage}`,
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

        const prs = await response.json();
        if (prs.length === 0) break;

        allPRs.push(...prs);

        if (prs.length < perPage) break;

        page++;
    }

    return allPRs;
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
 * クローズされたPRをデータベースから削除
 * @param {string} owner リポジトリオーナー
 * @param {string} repo リポジトリ名
 * @param {Array} allPRs 全てのPRsの配列
 * @returns {Promise<number>} 削除された件数
 */
async function deleteClosedPRs(owner, repo, allPRs) {
    try {
        const { data: existingIssues, error: selectError } = await supabase
            .from("github_issues")
            .select("issue_id, github_issue_number")
            .eq("repository_owner", owner)
            .eq("repository_name", repo);

        if (selectError) {
            throw selectError;
        }

        if (!existingIssues || existingIssues.length === 0) {
            console.log(`${owner}/${repo}: データベースに既存のPRはありません`);
            return 0;
        }

        const currentPRNumbers = new Set(allPRs.map((pr) => pr.number));

        const prsToDelete = existingIssues.filter(
            (issue) => !currentPRNumbers.has(issue.github_issue_number),
        );

        if (prsToDelete.length === 0) {
            console.log(`${owner}/${repo}: 削除対象のPRはありません`);
            return 0;
        }

        console.log(
            `${owner}/${repo}: ${prsToDelete.length} 件のPRを削除します`,
        );

        let deletedCount = 0;
        for (const prToDelete of prsToDelete) {
            const { error: deleteError } = await supabase
                .from("github_issues")
                .delete()
                .eq("issue_id", prToDelete.issue_id);

            if (deleteError) {
                console.error(
                    `PR #${prToDelete.github_issue_number} の削除に失敗:`,
                    deleteError.message,
                );
            } else {
                console.log(
                    `PR #${prToDelete.github_issue_number} (${owner}/${repo}) を削除しました`,
                );
                deletedCount++;
            }
        }

        return deletedCount;
    } catch (error) {
        console.error(`${owner}/${repo} のPR削除処理でエラー:`, error.message);
        return 0;
    }
}

/**
 * メイン処理
 */
async function main() {
    console.log("GitHub PRs同期を開始します...");
    console.log(`監視対象リポジトリ: ${REPOSITORIES.join(", ")}`);

    let totalSynced = 0;
    let totalDeleted = 0;
    let totalErrors = 0;

    for (const repository of REPOSITORIES) {
        const [owner, repo] = repository.split("/");
        console.log(`\n${repository} の処理を開始...`);

        try {
            console.log("全てのPRsを取得中...");
            const allPRs = await fetchAllPRs(owner, repo);
            console.log(`${allPRs.length} 件のPRsが見つかりました`);

            const deletedCount = await deleteClosedPRs(owner, repo, allPRs);
            totalDeleted += deletedCount;

            const openPRs = allPRs.filter((pr) => pr.state === "open");
            console.log(`${openPRs.length} 件のオープンPRsを同期します`);

            for (const pr of openPRs) {
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
            console.error(`${repository} の処理でエラー:`, error.message);
            totalErrors++;
        }
    }

    console.log(
        `\n同期完了: ${totalSynced} 件同期, ${totalDeleted} 件削除, ${totalErrors} 件エラー`,
    );

    if (totalErrors > 0) {
        console.log("エラーが発生しましたが、処理は継続されました");
        process.exit(1);
    }
}

main().catch((error) => {
    console.error("スクリプト実行エラー:", error.message);
    process.exit(1);
});
