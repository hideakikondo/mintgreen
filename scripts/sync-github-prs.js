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
 * GitHub APIからPull Requestのリアクション数を取得
 * @param {string} owner リポジトリオーナー
 * @param {string} repo リポジトリ名
 * @param {number} issueNumber Issue/PR番号
 * @returns {Promise<{plusOne: number, minusOne: number}>} リアクション数
 */
async function fetchPRReactions(owner, repo, issueNumber) {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/reactions`,
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

        const reactions = await response.json();

        let plusOne = 0;
        let minusOne = 0;
        reactions.forEach((reaction) => {
            if (reaction.content === "+1") {
                plusOne++;
            } else if (reaction.content === "-1") {
                minusOne++;
            }
        });

        return { plusOne, minusOne };
    } catch (error) {
        console.error(
            `リアクション取得エラー (${owner}/${repo}#${issueNumber}):`,
            error.message,
        );
        return { plusOne: 0, minusOne: 0 };
    }
}

/**
 * Pull RequestsをSupabaseデータベースにバッチ同期
 * @param {Array} prs Pull Requestsの配列
 * @param {string} owner リポジトリオーナー
 * @param {string} repo リポジトリ名
 * @returns {Promise<{synced: number, errors: number}>} 同期結果
 */
async function batchSyncPRsToDatabase(prs, owner, repo) {
    if (prs.length === 0) return { synced: 0, errors: 0 };

    const issuesData = [];

    for (const pr of prs) {
        const reactions = await fetchPRReactions(owner, repo, pr.number);
        console.log(`処理中: PR #${pr.number} - ${pr.title} (👍${reactions.plusOne} 👎${reactions.minusOne})`);
        issuesData.push({
            github_issue_number: pr.number,
            repository_owner: owner,
            repository_name: repo,
            title: pr.title,
            body: pr.body,
            branch_name: pr.head.ref,
            created_at: pr.created_at,
            updated_at: pr.updated_at,
            plus_one_count: reactions.plusOne,
            minus_one_count: reactions.minusOne,
        });
    }

    try {
        const { data, error } = await supabase
            .from("github_issues")
            .upsert(issuesData, {
                onConflict:
                    "github_issue_number,repository_owner,repository_name",
                ignoreDuplicates: false,
            });

        if (error) {
            throw error;
        }

        console.log(
            `${prs.length} 件のPRsをバッチ同期しました (${owner}/${repo})`,
        );
        return { synced: prs.length, errors: 0 };
    } catch (error) {
        console.error(`バッチ同期エラー (${owner}/${repo}):`, error.message);
        return { synced: 0, errors: prs.length };
    }
}

/**
 * クローズされたPRをデータベースからバッチ削除
 * @param {string} owner リポジトリオーナー
 * @param {string} repo リポジトリ名
 * @param {Array} allPRs 全てのPRsの配列
 * @returns {Promise<number>} 削除された件数
 */
async function batchDeleteClosedPRs(owner, repo, allPRs) {
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
        const issuesToDelete = existingIssues
            .filter((issue) => !currentPRNumbers.has(issue.github_issue_number));
        
        const issueIdsToDelete = issuesToDelete.map((issue) => issue.issue_id);

        if (issueIdsToDelete.length === 0) {
            console.log(`${owner}/${repo}: 削除対象のPRはありません`);
            return 0;
        }

        console.log(
            `${owner}/${repo}: ${issueIdsToDelete.length} 件のPRsをバッチ削除します`,
        );
        
        // 削除対象のPR詳細をログ出力
        issuesToDelete.forEach((issue) => {
            console.log(`削除対象: PR #${issue.github_issue_number} (ID: ${issue.issue_id})`);
        });

        const { error: deleteError } = await supabase
            .from("github_issues")
            .delete()
            .in("issue_id", issueIdsToDelete);

        if (deleteError) {
            throw deleteError;
        }

        console.log(
            `${issueIdsToDelete.length} 件のPRsを削除しました (${owner}/${repo})`,
        );
        return issueIdsToDelete.length;
    } catch (error) {
        console.error(`${owner}/${repo} のPR削除処理でエラー:`, error.message);
        return 0;
    }
}

/**
 * PRsを指定サイズのバッチに分割
 * @param {Array} array 分割する配列
 * @param {number} batchSize バッチサイズ
 * @returns {Array} バッチの配列
 */
function chunkArray(array, batchSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += batchSize) {
        chunks.push(array.slice(i, i + batchSize));
    }
    return chunks;
}

/**
 * メイン処理
 */
async function main() {
    const startTime = Date.now();
    console.log("GitHub PRs同期を開始します...");
    console.log(`監視対象リポジトリ: ${REPOSITORIES.join(", ")}`);

    const BATCH_SIZE = 50;
    const CONCURRENCY_LIMIT = 3;

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

            const deletedCount = await batchDeleteClosedPRs(
                owner,
                repo,
                allPRs,
            );
            totalDeleted += deletedCount;

            const openPRs = allPRs.filter((pr) => pr.state === "open");
            console.log(`${openPRs.length} 件のオープンPRsを同期します`);

            if (openPRs.length > 0) {
                const batches = chunkArray(openPRs, BATCH_SIZE);
                console.log(`${batches.length} バッチに分割して処理します`);

                for (let i = 0; i < batches.length; i += CONCURRENCY_LIMIT) {
                    const concurrentBatches = batches.slice(
                        i,
                        i + CONCURRENCY_LIMIT,
                    );
                    const promises = concurrentBatches.map((batch) =>
                        batchSyncPRsToDatabase(batch, owner, repo),
                    );

                    const results = await Promise.all(promises);

                    for (const result of results) {
                        totalSynced += result.synced;
                        totalErrors += result.errors;
                    }
                }
            }
        } catch (error) {
            console.error(`${repository} の処理でエラー:`, error.message);
            totalErrors++;
        }
    }

    const executionTime = Date.now() - startTime;
    console.log(
        `\n同期完了: ${totalSynced} 件同期, ${totalDeleted} 件削除, ${totalErrors} 件エラー`,
    );
    console.log(
        `実行時間: ${executionTime}ms (${(executionTime / 1000).toFixed(2)}秒)`,
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
