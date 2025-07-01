import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import type { Tables } from "../../types/supabase";

type SortOption =
    | "created_at_desc"
    | "id_asc"
    | "good_count"
    | "bad_count"
    | "user_evaluation";

interface IssueWithVotes {
    issue: Tables<"github_issues">;
    goodVotes: number;
    badVotes: number;
    totalGoodCount: number;
    totalBadCount: number;
    userVote?: Tables<"issue_votes"> | null;
}

export default function IssuesPageComponent() {
    const [issues, setIssues] = useState<IssueWithVotes[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeSearchTerm, setActiveSearchTerm] = useState("");
    const [filteredIssues, setFilteredIssues] = useState<IssueWithVotes[]>([]);
    const [searchError, setSearchError] = useState<string | null>(null);

    const ITEMS_PER_PAGE = 50;
    const [sortOption, setSortOption] = useState<SortOption>("created_at_desc");

    useEffect(() => {
        fetchIssues();
    }, []);

    const fetchIssues = async () => {
        try {
            setLoading(true);
            setError(null);

            const { count, error: countError } = await supabase
                .from("github_issues")
                .select("*", { count: "exact", head: true });

            if (countError) throw countError;
            setTotalCount(count || 0);

            let allIssuesData: Tables<"github_issues">[] = [];
            let from = 0;
            const batchSize = 1000;

            while (true) {
                const { data: batchData, error: batchError } = await supabase
                    .from("github_issues")
                    .select("*")
                    .order("created_at", { ascending: false })
                    .range(from, from + batchSize - 1);

                if (batchError) throw batchError;
                if (!batchData || batchData.length === 0) break;

                allIssuesData.push(...batchData);
                if (batchData.length < batchSize) break;
                from += batchSize;
            }

            const issuesWithVotes: IssueWithVotes[] = [];

            const { data: allVotes, error: votesError } = await supabase
                .from("issue_votes")
                .select("issue_id, vote_type");

            if (votesError) throw votesError;

            const voteCountsMap: Record<string, { good: number; bad: number }> =
                {};

            allVotes?.forEach(
                (vote: { issue_id: string | number; vote_type: string }) => {
                    if (!voteCountsMap[vote.issue_id]) {
                        voteCountsMap[vote.issue_id] = { good: 0, bad: 0 };
                    }
                    if (vote.vote_type === "good") {
                        voteCountsMap[vote.issue_id].good++;
                    } else if (vote.vote_type === "bad") {
                        voteCountsMap[vote.issue_id].bad++;
                    }
                },
            );

            for (const issue of allIssuesData || []) {
                const voteCounts = voteCountsMap[issue.issue_id] || {
                    good: 0,
                    bad: 0,
                };
                let userVote: Tables<"issue_votes"> | null = null;

                const totalGoodCount =
                    voteCounts.good + (issue.plus_one_count || 0);
                const totalBadCount =
                    voteCounts.bad + (issue.minus_one_count || 0);

                issuesWithVotes.push({
                    issue,
                    goodVotes: voteCounts.good,
                    badVotes: voteCounts.bad,
                    totalGoodCount,
                    totalBadCount,
                    userVote,
                });
            }

            setIssues(issuesWithVotes);
            setFilteredIssues(issuesWithVotes);
            setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
        } catch (err) {
            console.error("Error fetching issues:", err);
            setError("Issue情報の取得に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    // 検索フィルタリング
    useEffect(() => {
        if (!activeSearchTerm.trim()) {
            setFilteredIssues(issues);
            setTotalPages(Math.ceil(issues.length / ITEMS_PER_PAGE));
        } else {
            // スペース（半角・全角）で分割して検索キーワードを取得
            const searchKeywords = activeSearchTerm
                .split(/[\s　]+/) // 半角スペースと全角スペースで分割
                .filter((keyword) => keyword.trim().length > 0) // 空文字を除外
                .map((keyword) => keyword.toLowerCase());

            const filtered = issues.filter((issueWithVotes) => {
                const issue = issueWithVotes.issue;
                // 検索対象テキストを準備
                const searchableText = [
                    issue.title,
                    issue.body || "",
                    issue.github_issue_number.toString(),
                    issue.branch_name || "",
                ]
                    .join(" ")
                    .toLowerCase();

                // 全てのキーワードが含まれているかチェック（AND検索）
                return searchKeywords.every((keyword) =>
                    searchableText.includes(keyword),
                );
            });

            setFilteredIssues(filtered);
            setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE));
            setCurrentPage(1); // 検索時はページを1に戻す
        }
    }, [activeSearchTerm, issues]);

    // 検索バリデーション
    const validateSearch = (term: string): string | null => {
        const trimmedTerm = term.trim();

        // 文字数チェック
        if (trimmedTerm.length > 100) {
            return "検索キーワードは100文字以内で入力してください";
        }

        if (trimmedTerm.length > 0 && trimmedTerm.length < 2) {
            return "2文字以上で検索してください";
        }

        // 禁止文字チェック
        const invalidChars = /[<>&]/;
        if (invalidChars.test(term)) {
            return "使用できない文字が含まれています（< > & は使用できません）";
        }

        // キーワード数チェック
        if (trimmedTerm.length > 0) {
            const keywords = trimmedTerm
                .split(/[\s　]+/)
                .filter((k) => k.trim().length > 0);
            if (keywords.length > 10) {
                return "検索キーワードは10個以内にしてください";
            }

            // 各キーワードの長さチェック
            for (const keyword of keywords) {
                if (keyword.length > 50) {
                    return "各キーワードは50文字以内にしてください";
                }
            }
        }

        return null;
    };

    // 検索実行
    const handleSearch = () => {
        const validationError = validateSearch(searchTerm);
        setSearchError(validationError);

        if (!validationError) {
            setActiveSearchTerm(searchTerm);
        }
    };

    // 検索クリア
    const handleClearSearch = () => {
        setSearchTerm("");
        setActiveSearchTerm("");
        setSearchError(null);
    };

    // Enterキーでの検索
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    // 入力時のリアルタイムバリデーション（文字数のみ）
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        // 文字数制限のリアルタイムチェック
        if (value.length > 100) {
            setSearchError("検索キーワードは100文字以内で入力してください");
        } else {
            setSearchError(null);
        }
    };

    const sortIssues = (
        issues: IssueWithVotes[],
        sortBy: SortOption,
    ): IssueWithVotes[] => {
        const sorted = [...issues];
        switch (sortBy) {
            case "id_asc":
                return sorted.sort(
                    (a, b) =>
                        new Date(a.issue.created_at).getTime() -
                        new Date(b.issue.created_at).getTime(),
                );
            case "good_count":
                return sorted.sort(
                    (a, b) => b.totalGoodCount - a.totalGoodCount,
                );
            case "bad_count":
                return sorted.sort((a, b) => b.totalBadCount - a.totalBadCount);
            case "user_evaluation":
                return sorted.sort(
                    (a, b) =>
                        b.totalGoodCount -
                        b.totalBadCount -
                        (a.totalGoodCount - a.totalBadCount),
                );
            case "created_at_desc":
            default:
                return sorted.sort(
                    (a, b) =>
                        new Date(b.issue.created_at).getTime() -
                        new Date(a.issue.created_at).getTime(),
                );
        }
    };

    const containerStyle: React.CSSProperties = {
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        padding: "2rem 1rem",
    };

    const mobileContainerStyle: React.CSSProperties = {
        ...containerStyle,
        padding: "1rem 0.5rem",
    };

    const contentStyle: React.CSSProperties = {
        maxWidth: "1200px",
        margin: "0 auto",
    };

    const headerStyle: React.CSSProperties = {
        textAlign: "center",
        marginBottom: "2rem",
        color: "#333",
        fontSize: "2rem",
    };

    const mobileHeaderStyle: React.CSSProperties = {
        ...headerStyle,
        fontSize: "1.5rem",
        marginBottom: "1.5rem",
    };

    const cardStyle: React.CSSProperties = {
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "2rem",
        marginBottom: "2rem",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    };

    const mobileCardStyle: React.CSSProperties = {
        ...cardStyle,
        padding: "1rem",
        marginBottom: "1rem",
    };

    const issueCardStyle: React.CSSProperties = {
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "1.5rem",
        marginBottom: "1rem",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        border: "1px solid #e0e0e0",
    };

    const mobileIssueCardStyle: React.CSSProperties = {
        ...issueCardStyle,
        padding: "1rem",
    };

    const buttonStyle: React.CSSProperties = {
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        padding: "0.75rem 1.5rem",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "1rem",
        fontWeight: "bold",
    };

    const voteButtonStyle: React.CSSProperties = {
        backgroundColor: "#f8f9fa",
        color: "#333",
        border: "1px solid #dee2e6",
        padding: "0.5rem 1rem",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "0.9rem",
        margin: "0 0.25rem",
    };

    const paginationStyle: React.CSSProperties = {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "0.5rem",
        marginTop: "2rem",
    };

    const pageButtonStyle: React.CSSProperties = {
        backgroundColor: "#f8f9fa",
        color: "#333",
        border: "1px solid #dee2e6",
        padding: "0.5rem 0.75rem",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "0.9rem",
    };

    const activePageButtonStyle: React.CSSProperties = {
        ...pageButtonStyle,
        backgroundColor: "#007bff",
        color: "white",
        borderColor: "#007bff",
    };

    const isMobile = window.innerWidth <= 768;

    return (
        <div style={isMobile ? mobileContainerStyle : containerStyle}>
            <div style={contentStyle}>
                <h1 style={isMobile ? mobileHeaderStyle : headerStyle}>
                    みんなの評価まとめ
                </h1>

                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <button
                        onClick={() => (window.location.href = "/")}
                        style={buttonStyle}
                    >
                        トップに戻る
                    </button>
                </div>

                {/* 検索窓 */}
                <div style={isMobile ? mobileCardStyle : cardStyle}>
                    <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
                        検索
                    </h3>
                    <div
                        style={{
                            display: "flex",
                            gap: "0.5rem",
                            alignItems: "flex-start",
                        }}
                    >
                        <input
                            type="text"
                            placeholder="検索キーワード（スペース区切りでAND検索）..."
                            value={searchTerm}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            style={{
                                flex: 1,
                                padding: "0.75rem",
                                borderRadius: "8px",
                                border: "2px solid var(--border-strong)",
                                fontSize: "1rem",
                                backgroundColor: "var(--bg-secondary)",
                                color: "var(--text-primary)",
                                transition: "all 0.2s ease",
                                outline: "none",
                                boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.1)",
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = "#646cff";
                                e.target.style.boxShadow =
                                    "inset 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 0 3px rgba(100, 108, 255, 0.1)";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor =
                                    "var(--border-strong)";
                                e.target.style.boxShadow =
                                    "inset 0 1px 3px rgba(0, 0, 0, 0.1)";
                            }}
                        />
                        <button
                            onClick={handleSearch}
                            disabled={
                                !!searchError || searchTerm.trim().length === 0
                            }
                            style={{
                                padding: "0.75rem 1.5rem",
                                borderRadius: "8px",
                                border: "none",
                                backgroundColor:
                                    !!searchError ||
                                    searchTerm.trim().length === 0
                                        ? "#ccc"
                                        : "#646cff",
                                color: "white",
                                fontSize: "1rem",
                                fontWeight: "500",
                                cursor:
                                    !!searchError ||
                                    searchTerm.trim().length === 0
                                        ? "not-allowed"
                                        : "pointer",
                                transition: "all 0.2s ease",
                                boxShadow: "var(--card-shadow)",
                                whiteSpace: "nowrap",
                                opacity:
                                    !!searchError ||
                                    searchTerm.trim().length === 0
                                        ? 0.6
                                        : 1,
                            }}
                            onMouseEnter={(e) => {
                                if (
                                    !searchError &&
                                    searchTerm.trim().length > 0
                                ) {
                                    e.currentTarget.style.backgroundColor =
                                        "#535bf2";
                                    e.currentTarget.style.transform =
                                        "translateY(-1px)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (
                                    !searchError &&
                                    searchTerm.trim().length > 0
                                ) {
                                    e.currentTarget.style.backgroundColor =
                                        "#646cff";
                                    e.currentTarget.style.transform =
                                        "translateY(0)";
                                }
                            }}
                        >
                            🔍 検索
                        </button>
                        {activeSearchTerm && (
                            <button
                                onClick={handleClearSearch}
                                style={{
                                    padding: "0.75rem 1rem",
                                    borderRadius: "8px",
                                    border: "2px solid var(--border-strong)",
                                    backgroundColor: "var(--bg-secondary)",
                                    color: "var(--text-primary)",
                                    fontSize: "1rem",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    whiteSpace: "nowrap",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        "var(--hover-bg)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        "var(--bg-secondary)";
                                }}
                            >
                                ✕ クリア
                            </button>
                        )}
                    </div>

                    {/* エラーメッセージ */}
                    {searchError && (
                        <div
                            style={{
                                marginTop: "0.75rem",
                                padding: "0.75rem",
                                borderRadius: "6px",
                                backgroundColor: "var(--error-bg, #ffebee)",
                                color: "var(--error-text, #c62828)",
                                fontSize: "0.9rem",
                                border: "1px solid var(--error-text, #c62828)",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                            }}
                        >
                            <span style={{ fontSize: "1.1rem" }}>⚠️</span>
                            {searchError}
                        </div>
                    )}

                    {/* 検索結果表示 */}
                    {activeSearchTerm && !searchError && (
                        <div
                            style={{
                                marginTop: "1rem",
                                padding: "0.75rem",
                                borderRadius: "6px",
                                backgroundColor: "var(--info-bg, #f0f8ff)",
                                color: "var(--info-text, #1976d2)",
                                fontSize: "0.9rem",
                                border: "1px solid var(--border-color)",
                            }}
                        >
                            検索キーワード: 「{activeSearchTerm}」
                            {activeSearchTerm.includes(" ") ||
                            activeSearchTerm.includes("　")
                                ? " (AND検索)"
                                : ""}{" "}
                            - {filteredIssues.length} 件の結果
                        </div>
                    )}
                </div>

                {loading && (
                    <div style={{ textAlign: "center", padding: "2rem" }}>
                        <p>読み込み中...</p>
                    </div>
                )}

                {error && (
                    <div
                        style={{
                            color: "red",
                            textAlign: "center",
                            marginBottom: "1rem",
                            padding: "1rem",
                            backgroundColor: "#ffe6e6",
                            borderRadius: "4px",
                        }}
                    >
                        {error}
                    </div>
                )}

                {!loading && filteredIssues.length === 0 && (
                    <div style={isMobile ? mobileCardStyle : cardStyle}>
                        <p style={{ textAlign: "center", color: "#666" }}>
                            {activeSearchTerm
                                ? "検索結果がありませんでした"
                                : "GitHub Issueが見つかりませんでした"}
                        </p>
                    </div>
                )}

                {!loading && filteredIssues.length > 0 && (
                    <>
                        <div
                            style={{
                                marginBottom: "1rem",
                                textAlign: "center",
                                color: "#666",
                            }}
                        >
                            ページ {currentPage} / {totalPages}
                            {activeSearchTerm
                                ? `(検索結果: ${filteredIssues.length}件)`
                                : `(全 ${totalCount}件)`}
                        </div>

                        <div
                            style={{
                                marginBottom: "1.5rem",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: "0.5rem",
                            }}
                        >
                            <label
                                style={{ fontSize: "0.9rem", color: "#666" }}
                            >
                                ソート順:
                            </label>
                            <select
                                value={sortOption}
                                onChange={(e) =>
                                    setSortOption(e.target.value as SortOption)
                                }
                                style={{
                                    padding: "0.5rem",
                                    borderRadius: "4px",
                                    border: "1px solid #dee2e6",
                                    backgroundColor: "white",
                                    fontSize: "0.9rem",
                                }}
                            >
                                <option value="created_at_desc">
                                    作成日時（新しい順）
                                </option>
                                <option value="id_asc">
                                    作成日時（古い順）
                                </option>
                                <option value="good_count">Good数順</option>
                                <option value="bad_count">Bad数順</option>
                                <option value="user_evaluation">
                                    ユーザー評価順（Good-Bad）
                                </option>
                            </select>
                        </div>

                        {sortIssues(filteredIssues, sortOption)
                            .slice(
                                (currentPage - 1) * ITEMS_PER_PAGE,
                                currentPage * ITEMS_PER_PAGE,
                            )
                            .map(({ issue, totalGoodCount, totalBadCount }) => (
                                <div
                                    key={issue.issue_id}
                                    style={
                                        isMobile
                                            ? mobileIssueCardStyle
                                            : issueCardStyle
                                    }
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: isMobile
                                                ? "column"
                                                : "row",
                                            justifyContent: "space-between",
                                            alignItems: isMobile
                                                ? "flex-start"
                                                : "flex-start",
                                            gap: "1rem",
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: isMobile
                                                        ? "column"
                                                        : "row",
                                                    alignItems: isMobile
                                                        ? "flex-start"
                                                        : "center",
                                                    gap: "0.5rem",
                                                    marginBottom: "0.5rem",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        backgroundColor:
                                                            "#f0f0f0",
                                                        padding:
                                                            "0.2rem 0.5rem",
                                                        borderRadius: "4px",
                                                        fontSize: "0.8rem",
                                                        color: "#666",
                                                    }}
                                                >
                                                    #{issue.github_issue_number}
                                                </span>
                                                <span
                                                    style={{
                                                        backgroundColor:
                                                            "#e3f2fd",
                                                        padding:
                                                            "0.2rem 0.5rem",
                                                        borderRadius: "4px",
                                                        fontSize: "0.8rem",
                                                        color: "#1976d2",
                                                    }}
                                                >
                                                    {issue.repository_owner}/
                                                    {issue.repository_name}
                                                </span>
                                            </div>
                                            <a
                                                href={`https://github.com/${issue.repository_owner}/${issue.repository_name}/issues/${issue.github_issue_number}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    textDecoration: "none",
                                                    color: "inherit",
                                                    cursor: "pointer",
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.textDecoration =
                                                        "underline";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.textDecoration =
                                                        "none";
                                                }}
                                            >
                                                <h3
                                                    style={{
                                                        marginBottom: "0.5rem",
                                                        fontSize: isMobile
                                                            ? "1rem"
                                                            : "1.2rem",
                                                        lineHeight: "1.4",
                                                        margin: 0,
                                                    }}
                                                >
                                                    {issue.title}
                                                </h3>
                                            </a>
                                            {issue.body && (
                                                <p
                                                    style={{
                                                        color: "#666",
                                                        fontSize: "0.9rem",
                                                        lineHeight: "1.5",
                                                        marginBottom: "1rem",
                                                        overflow: "hidden",
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 3,
                                                        WebkitBoxOrient:
                                                            "vertical" as const,
                                                    }}
                                                >
                                                    {issue.body}
                                                </p>
                                            )}
                                            <div
                                                style={{
                                                    fontSize: "0.8rem",
                                                    color: "#888",
                                                    marginBottom: "1rem",
                                                }}
                                            >
                                                作成日:{" "}
                                                {new Date(
                                                    issue.created_at,
                                                ).toLocaleDateString()}
                                                {issue.branch_name && (
                                                    <span
                                                        style={{
                                                            marginLeft: "1rem",
                                                        }}
                                                    >
                                                        ブランチ:{" "}
                                                        {issue.branch_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: isMobile
                                                    ? "row"
                                                    : "column",
                                                alignItems: "center",
                                                gap: "0.5rem",
                                                minWidth: isMobile
                                                    ? "auto"
                                                    : "120px",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    ...voteButtonStyle,
                                                    cursor: "default",
                                                    backgroundColor: "#f8f9fa",
                                                }}
                                            >
                                                👍 {totalGoodCount}
                                            </div>
                                            <div
                                                style={{
                                                    ...voteButtonStyle,
                                                    cursor: "default",
                                                    backgroundColor: "#f8f9fa",
                                                }}
                                            >
                                                👎 {totalBadCount}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                        {totalPages > 1 && (
                            <div style={paginationStyle}>
                                <button
                                    onClick={() =>
                                        setCurrentPage(
                                            Math.max(1, currentPage - 1),
                                        )
                                    }
                                    disabled={currentPage === 1}
                                    style={pageButtonStyle}
                                >
                                    前へ
                                </button>

                                {Array.from(
                                    { length: Math.min(5, totalPages) },
                                    (_, i) => {
                                        const startPage = Math.max(
                                            1,
                                            currentPage - 2,
                                        );
                                        const pageNum = startPage + i;
                                        if (pageNum > totalPages) return null;

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() =>
                                                    setCurrentPage(pageNum)
                                                }
                                                style={
                                                    pageNum === currentPage
                                                        ? activePageButtonStyle
                                                        : pageButtonStyle
                                                }
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    },
                                )}

                                <button
                                    onClick={() =>
                                        setCurrentPage(
                                            Math.min(
                                                totalPages,
                                                currentPage + 1,
                                            ),
                                        )
                                    }
                                    disabled={currentPage === totalPages}
                                    style={pageButtonStyle}
                                >
                                    次へ
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
