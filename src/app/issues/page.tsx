import React, { useEffect, useState, useRef } from "react";
import AuthRepairOverlay from "../../components/common/AuthRepairOverlay";
import NetworkTimeoutOverlay from "../../components/common/NetworkTimeoutOverlay";
import ScrollToTopButton from "../../components/common/ScrollToTopButton";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigationSafely } from "../../hooks/useNavigationSafely";
import { supabase } from "../../lib/supabaseClient";
import type { Tables } from "../../types/supabase";

// スマートフォン判定のカスタムフック
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth <= 480);
        };

        checkIfMobile();
        window.addEventListener("resize", checkIfMobile);

        return () => window.removeEventListener("resize", checkIfMobile);
    }, []);

    return isMobile;
};

// 極小スマートフォン判定のカスタムフック
const useIsExtraSmallMobile = () => {
    const [isExtraSmallMobile, setIsExtraSmallMobile] = useState(false);

    useEffect(() => {
        const checkIfExtraSmallMobile = () => {
            setIsExtraSmallMobile(window.innerWidth <= 380);
        };

        checkIfExtraSmallMobile();
        window.addEventListener("resize", checkIfExtraSmallMobile);

        return () =>
            window.removeEventListener("resize", checkIfExtraSmallMobile);
    }, []);

    return isExtraSmallMobile;
};

type SortOption =
    | "created_at_desc"
    | "id_asc"
    | "good_count"
    | "bad_count"
    | "user_evaluation"
    | "user_evaluation_reverse";

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
    const [searchTerm, setSearchTerm] = useState("");
    const [activeSearchTerm, setActiveSearchTerm] = useState("");
    const [filteredIssues, setFilteredIssues] = useState<IssueWithVotes[]>([]);
    const [searchError, setSearchError] = useState<string | null>(null);

    // メニューの状態管理
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // 全件取得用の状態管理
    const [isLoadingAll, setIsLoadingAll] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [loadedCount, setLoadedCount] = useState(0);
    const [loadingProgress, setLoadingProgress] = useState("");
    const [showTimeoutOverlay, setShowTimeoutOverlay] = useState(false);
    const [showAuthRepairOverlay, setShowAuthRepairOverlay] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const ITEMS_PER_PAGE = 50;
    const [sortOption, setSortOption] = useState<SortOption>("created_at_desc");
    const {
        loading: authLoading,
        authInitialized,
        isAuthenticated,
        logout,
        voter,
    } = useAuth();

    const { navigateToHome } = useNavigationSafely();

    const handleLogout = async () => {
        try {
            await logout();
            // 認証状態をクリアしてホームに遷移
            navigateToHome(false);
        } catch (error) {
            console.error("ログアウト処理でエラーが発生:", error);
            // エラー時は強制的にページリロード
            window.location.href = "/";
        } finally {
            // メニューを閉じる
            setIsMenuOpen(false);
        }
    };

    useEffect(() => {
        // 認証初期化が完了してからデータ取得を実行
        if (!authLoading || authInitialized) {
            fetchIssuesOptimized();
        }
    }, [authLoading, authInitialized]);

    const fetchIssuesOptimized = async () => {
        try {
            setLoading(true);
            setError(null);
            setIsLoadingAll(true);
            setShowTimeoutOverlay(false);

            // タイムアウト検知（15秒後）
            timeoutRef.current = setTimeout(() => {
                if (loading || isLoadingAll) {
                    setShowTimeoutOverlay(true);
                }
            }, 15000);

            // 全体の件数を先に取得
            const { count, error: countError } = await supabase
                .from("github_issues")
                .select("*", { count: "exact", head: true });

            if (countError) throw countError;
            setTotalCount(count || 0);

            // 最初の50件を優先取得
            const { data: initialIssues, error: initialError } = await supabase
                .from("github_issues")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(50);

            if (initialError) throw initialError;

            // 投票データも並行取得
            const { data: allVotes, error: votesError } = await supabase
                .from("issue_votes")
                .select("issue_id, vote_type");

            if (votesError) throw votesError;

            if (initialIssues) {
                // 最初の50件の投票数を計算
                const initialWithVotes = calculateIssuesWithVotes(
                    initialIssues,
                    allVotes || [],
                );
                setIssues(initialWithVotes);
                setFilteredIssues(initialWithVotes);
                setTotalPages(
                    Math.ceil(initialWithVotes.length / ITEMS_PER_PAGE),
                );
                setLoadedCount(initialIssues.length);
                setLoadingProgress(
                    `${initialIssues.length}件 / ${count || 0}件 読み込み完了`,
                );
                setLoading(false); // ユーザーが操作可能になる

                // タイムアウト検知をクリア
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }
            }

            // 残りのissueを段階的に取得
            await fetchRemainingIssuesInBatches(
                initialIssues,
                allVotes || [],
                count || 0,
            );
        } catch (err) {
            console.error("Error fetching issues:", err);
            setError("Issue情報の取得に失敗しました");
            setLoading(false);
            setIsLoadingAll(false);

            // タイムアウト検知をクリア
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        }
    };

    const fetchRemainingIssuesInBatches = async (
        initialIssues: Tables<"github_issues">[],
        allVotes: any[],
        totalCount: number,
    ) => {
        try {
            const BATCH_SIZE = 1000;
            let from = 50; // 最初の50件は既に取得済み
            let allIssuesData = [...initialIssues];

            while (from < totalCount) {
                setLoadingProgress(
                    `${Math.min(from, totalCount)}件 / ${totalCount}件 読み込み中...`,
                );

                const { data: batchData, error: batchError } = await supabase
                    .from("github_issues")
                    .select("*")
                    .order("created_at", { ascending: false })
                    .range(from, from + BATCH_SIZE - 1);

                if (batchError) {
                    console.error("バッチ取得エラー:", batchError);
                    break;
                }

                if (!batchData || batchData.length === 0) break;

                allIssuesData = [...allIssuesData, ...batchData];
                setLoadedCount(allIssuesData.length);

                // 定期的に画面を更新（パフォーマンスを考慮して500件ごと）
                if (from % 500 === 0 || from + BATCH_SIZE >= totalCount) {
                    const allWithVotes = calculateIssuesWithVotes(
                        allIssuesData,
                        allVotes,
                    );
                    setIssues(allWithVotes);
                    if (!activeSearchTerm.trim()) {
                        setFilteredIssues(allWithVotes);
                        setTotalPages(
                            Math.ceil(allWithVotes.length / ITEMS_PER_PAGE),
                        );
                    }
                }

                from += BATCH_SIZE;

                // UIの応答性を保つため、小さな遅延を入れる
                await new Promise((resolve) => setTimeout(resolve, 10));
            }

            // 最終更新
            const allWithVotes = calculateIssuesWithVotes(
                allIssuesData,
                allVotes,
            );
            setIssues(allWithVotes);
            if (!activeSearchTerm.trim()) {
                setFilteredIssues(allWithVotes);
                setTotalPages(Math.ceil(allWithVotes.length / ITEMS_PER_PAGE));
            }

            setLoadingProgress(`全 ${allIssuesData.length}件 読み込み完了`);
            setIsLoadingAll(false);
        } catch (err) {
            console.error("段階的取得エラー:", err);
            setIsLoadingAll(false);
        }
    };

    const calculateIssuesWithVotes = (
        issuesData: Tables<"github_issues">[],
        votesData: any[],
    ) => {
        const voteCountsMap: Record<string, { good: number; bad: number }> = {};

        votesData.forEach(
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

        return issuesData.map((issue) => {
            const voteCounts = voteCountsMap[issue.issue_id] || {
                good: 0,
                bad: 0,
            };
            const totalGoodCount =
                voteCounts.good + (issue.plus_one_count || 0);
            const totalBadCount = voteCounts.bad + (issue.minus_one_count || 0);

            return {
                issue,
                goodVotes: voteCounts.good,
                badVotes: voteCounts.bad,
                totalGoodCount,
                totalBadCount,
                userVote: null,
            };
        });
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

    const handleTimeoutRetry = () => {
        setShowTimeoutOverlay(false);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        fetchIssuesOptimized();
    };

    const handleTimeoutClose = () => {
        setShowTimeoutOverlay(false);
    };

    const handleAuthRepair = () => {
        setShowTimeoutOverlay(false);
        setShowAuthRepairOverlay(true);
    };

    const handleAuthRepairSuccess = () => {
        setShowAuthRepairOverlay(false);
        fetchIssuesOptimized();
    };

    const handleAuthRepairClose = () => {
        setShowAuthRepairOverlay(false);
    };

    // コンポーネントのアンマウント時にタイムアウトをクリア
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // メニュー外クリックで閉じる
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isMenuOpen &&
                !(event.target as Element).closest("[data-menu]")
            ) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isMenuOpen]);

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
            case "user_evaluation_reverse":
                return sorted.sort(
                    (a, b) =>
                        a.totalGoodCount -
                        a.totalBadCount -
                        (b.totalGoodCount - b.totalBadCount),
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
        background:
            "linear-gradient(135deg, #C8F0E5 0%, #E8F8F3 50%, #F0FDF7 100%)",
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
        backgroundColor: "#5FBEAA",
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

    const isMobile = useIsMobile();
    const isExtraSmallMobile = useIsExtraSmallMobile();

    const paginationStyle: React.CSSProperties = {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: isExtraSmallMobile ? "0.25rem" : "0.5rem",
        marginTop: "2rem",
        flexWrap: "wrap",
    };

    const pageButtonStyle: React.CSSProperties = {
        backgroundColor: "#f8f9fa",
        color: "#333",
        border: "1px solid #dee2e6",
        padding: isExtraSmallMobile ? "0.4rem 0.5rem" : "0.5rem 0.75rem",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: isExtraSmallMobile ? "0.8rem" : "0.9rem",
        minWidth: isExtraSmallMobile ? "auto" : "unset",
        whiteSpace: "nowrap",
    };

    const activePageButtonStyle: React.CSSProperties = {
        ...pageButtonStyle,
        backgroundColor: "#5FBEAA",
        color: "white",
        borderColor: "#5FBEAA",
    };

    return (
        <div style={isMobile ? mobileContainerStyle : containerStyle}>
            <div style={contentStyle}>
                <h1 style={isMobile ? mobileHeaderStyle : headerStyle}>
                    マニフェスト提案一覧
                </h1>

                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <button
                        onClick={() => navigateToHome(true)}
                        style={{ ...buttonStyle, backgroundColor: "#5FBEAA" }}
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
                            flexDirection: isExtraSmallMobile
                                ? "column"
                                : "row",
                            gap: "0.5rem",
                            alignItems: isExtraSmallMobile
                                ? "stretch"
                                : "flex-start",
                        }}
                    >
                        <input
                            type="text"
                            placeholder={
                                isExtraSmallMobile
                                    ? "検索キーワード..."
                                    : "検索キーワード（スペース区切りでAND検索）..."
                            }
                            value={searchTerm}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            style={{
                                flex: isExtraSmallMobile ? "none" : 1,
                                width: isExtraSmallMobile ? "100%" : "auto",
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
                                e.target.style.borderColor = "#5FBEAA";
                                e.target.style.boxShadow =
                                    "inset 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 0 3px rgba(95, 190, 170, 0.1)";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor =
                                    "var(--border-strong)";
                                e.target.style.boxShadow =
                                    "inset 0 1px 3px rgba(0, 0, 0, 0.1)";
                            }}
                        />
                        <div
                            style={{
                                display: "flex",
                                gap: "0.5rem",
                                flexDirection: isExtraSmallMobile
                                    ? "column"
                                    : "row",
                                alignItems: "stretch",
                            }}
                        >
                            <button
                                onClick={handleSearch}
                                disabled={
                                    !!searchError ||
                                    searchTerm.trim().length === 0
                                }
                                style={{
                                    padding: isExtraSmallMobile
                                        ? "0.75rem"
                                        : "0.75rem 1.5rem",
                                    borderRadius: "8px",
                                    border: "none",
                                    backgroundColor:
                                        !!searchError ||
                                        searchTerm.trim().length === 0
                                            ? "#ccc"
                                            : "#5FBEAA",
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
                                    width: isExtraSmallMobile ? "100%" : "auto",
                                }}
                                onMouseEnter={(e) => {
                                    if (
                                        !searchError &&
                                        searchTerm.trim().length > 0
                                    ) {
                                        e.currentTarget.style.backgroundColor =
                                            "#4DA894";
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
                                            "#5FBEAA";
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
                                        padding: isExtraSmallMobile
                                            ? "0.75rem"
                                            : "0.75rem 1rem",
                                        borderRadius: "8px",
                                        border: "2px solid var(--border-strong)",
                                        backgroundColor: "var(--bg-secondary)",
                                        color: "var(--text-primary)",
                                        fontSize: "1rem",
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                        whiteSpace: "nowrap",
                                        width: isExtraSmallMobile
                                            ? "100%"
                                            : "auto",
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

                    {/* 上部ページネーション */}
                    {filteredIssues.length > 0 && totalPages > 1 && (
                        <div style={{ ...paginationStyle, marginTop: "1rem" }}>
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                style={pageButtonStyle}
                            >
                                {isExtraSmallMobile ? "≪" : "≪ 最初"}
                            </button>
                            <button
                                onClick={() =>
                                    setCurrentPage(Math.max(1, currentPage - 1))
                                }
                                disabled={currentPage === 1}
                                style={pageButtonStyle}
                            >
                                {isExtraSmallMobile ? "←" : "前へ"}
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
                                        Math.min(totalPages, currentPage + 1),
                                    )
                                }
                                disabled={currentPage === totalPages}
                                style={pageButtonStyle}
                            >
                                {isExtraSmallMobile ? "→" : "次へ"}
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                style={pageButtonStyle}
                            >
                                {isExtraSmallMobile ? "≫" : "最後 ≫"}
                            </button>
                        </div>
                    )}
                </div>

                {loading && (
                    <>
                        <div style={isMobile ? mobileCardStyle : cardStyle}>
                            <div
                                style={{
                                    textAlign: "center",
                                    marginBottom: "1rem",
                                }}
                            >
                                <div className="spinner"></div>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: "1.1rem",
                                        color: "#333",
                                    }}
                                >
                                    Issue一覧を取得中...
                                </p>
                                <div
                                    style={{
                                        margin: "1rem 0 0 0",
                                        color: "#666",
                                        fontSize: "0.9rem",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.5rem",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "0.5rem",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: "8px",
                                                height: "8px",
                                                borderRadius: "50%",
                                                backgroundColor: "#5FBEAA",
                                                animation:
                                                    "bounce 1.4s infinite ease-in-out both",
                                                animationDelay: "0s",
                                            }}
                                        />
                                        <div
                                            style={{
                                                width: "8px",
                                                height: "8px",
                                                borderRadius: "50%",
                                                backgroundColor: "#5FBEAA",
                                                animation:
                                                    "bounce 1.4s infinite ease-in-out both",
                                                animationDelay: "0.16s",
                                            }}
                                        />
                                        <div
                                            style={{
                                                width: "8px",
                                                height: "8px",
                                                borderRadius: "50%",
                                                backgroundColor: "#5FBEAA",
                                                animation:
                                                    "bounce 1.4s infinite ease-in-out both",
                                                animationDelay: "0.32s",
                                            }}
                                        />
                                    </div>
                                    <p
                                        style={{
                                            margin: 0,
                                            textAlign: "center",
                                        }}
                                    >
                                        まもなく表示されます
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* スケルトンローディング */}
                        {Array.from({ length: 3 }, (_, index) => (
                            <div
                                key={index}
                                style={
                                    isMobile
                                        ? mobileIssueCardStyle
                                        : issueCardStyle
                                }
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        gap: "1rem",
                                        animation:
                                            "pulse 1.5s ease-in-out infinite",
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: isMobile
                                                    ? "column"
                                                    : "row",
                                                alignItems: "flex-start",
                                                gap: "0.5rem",
                                                marginBottom: "0.5rem",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: "60px",
                                                    height: "20px",
                                                    backgroundColor: "#f0f0f0",
                                                    borderRadius: "4px",
                                                }}
                                            />
                                            <div
                                                style={{
                                                    width: "120px",
                                                    height: "20px",
                                                    backgroundColor: "#f0f0f0",
                                                    borderRadius: "4px",
                                                }}
                                            />
                                        </div>
                                        <div
                                            style={{
                                                height: "24px",
                                                backgroundColor: "#f0f0f0",
                                                borderRadius: "4px",
                                                marginBottom: "0.5rem",
                                                width: "85%",
                                            }}
                                        />
                                        <div
                                            style={{
                                                height: "60px",
                                                backgroundColor: "#f0f0f0",
                                                borderRadius: "4px",
                                                marginBottom: "1rem",
                                            }}
                                        />
                                        <div
                                            style={{
                                                height: "16px",
                                                backgroundColor: "#f0f0f0",
                                                borderRadius: "4px",
                                                width: "50%",
                                            }}
                                        />
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
                                                width: "60px",
                                                height: "32px",
                                                backgroundColor: "#f0f0f0",
                                                borderRadius: "4px",
                                            }}
                                        />
                                        <div
                                            style={{
                                                width: "60px",
                                                height: "32px",
                                                backgroundColor: "#f0f0f0",
                                                borderRadius: "4px",
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {/* 全件取得の進捗表示 */}
                {isLoadingAll && !loading && (
                    <div style={isMobile ? mobileCardStyle : cardStyle}>
                        <div
                            style={{
                                textAlign: "center",
                                padding: "1rem",
                            }}
                        >
                            <div
                                className="spinner"
                                style={{ marginBottom: "0.5rem" }}
                            ></div>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: "1rem",
                                    color: "#333",
                                }}
                            >
                                全てのIssueを取得中...
                            </p>
                            <p
                                style={{
                                    margin: "0.5rem 0 0 0",
                                    color: "#666",
                                    fontSize: "0.9rem",
                                }}
                            >
                                {loadingProgress}
                            </p>
                            <div
                                style={{
                                    width: "100%",
                                    height: "8px",
                                    backgroundColor: "#f0f0f0",
                                    borderRadius: "4px",
                                    marginTop: "0.5rem",
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        width: `${totalCount > 0 ? (loadedCount / totalCount) * 100 : 0}%`,
                                        height: "100%",
                                        backgroundColor: "#4CAF50",
                                        transition: "width 0.3s ease",
                                    }}
                                />
                            </div>
                        </div>
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
                                : `(全 ${issues.length}件)`}
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
                                onFocus={(e) => {
                                    e.target.style.borderColor = "#5FBEAA";
                                    e.target.style.outline =
                                        "2px solid rgba(95, 190, 170, 0.2)";
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = "#dee2e6";
                                    e.target.style.outline = "none";
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
                                <option value="user_evaluation_reverse">
                                    ユーザー評価逆順（Bad-Good）
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
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    style={pageButtonStyle}
                                >
                                    {isExtraSmallMobile ? "≪" : "≪ 最初"}
                                </button>
                                <button
                                    onClick={() =>
                                        setCurrentPage(
                                            Math.max(1, currentPage - 1),
                                        )
                                    }
                                    disabled={currentPage === 1}
                                    style={pageButtonStyle}
                                >
                                    {isExtraSmallMobile ? "←" : "前へ"}
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
                                    {isExtraSmallMobile ? "→" : "次へ"}
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    style={pageButtonStyle}
                                >
                                    {isExtraSmallMobile ? "≫" : "最後 ≫"}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ログアウトボタン（ハンバーガーメニュー） */}
            {isAuthenticated && voter && (
                <>
                    <button
                        data-menu
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        style={{
                            position: "fixed" as const,
                            top: "20px",
                            right: "20px",
                            width: "50px",
                            height: "50px",
                            backgroundColor: "#5FBEAA",
                            border: "none",
                            borderRadius: "50%",
                            cursor: "pointer",
                            zIndex: 1001,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 4px 12px rgba(95, 190, 170, 0.4)",
                            transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                            (e.target as HTMLElement).style.backgroundColor =
                                "#4DA894";
                        }}
                        onMouseLeave={(e) => {
                            (e.target as HTMLElement).style.backgroundColor =
                                "#5FBEAA";
                        }}
                    >
                        <div
                            style={{
                                position: "relative",
                                width: "20px",
                                height: "20px",
                            }}
                        >
                            {/* サインイン状態インジケーター */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: "-2px",
                                    right: "-2px",
                                    width: "8px",
                                    height: "8px",
                                    backgroundColor: "#4ade80",
                                    borderRadius: "50%",
                                    border: "1px solid white",
                                    zIndex: 1,
                                }}
                            />
                            {/* ハンバーガーアイコン */}
                            <div
                                style={{
                                    position: "relative",
                                    width: "20px",
                                    height: "20px",
                                }}
                            >
                                <div
                                    style={{
                                        width: "16px",
                                        height: "2px",
                                        backgroundColor: "white",
                                        borderRadius: "1px",
                                        transition: "all 0.3s ease",
                                        transformOrigin: "center",
                                        position: "absolute" as const,
                                        top: isMenuOpen ? "9px" : "6px",
                                        left: "2px",
                                        transform: isMenuOpen
                                            ? "rotate(45deg)"
                                            : "rotate(0deg)",
                                    }}
                                />
                                <div
                                    style={{
                                        width: "16px",
                                        height: "2px",
                                        backgroundColor: "white",
                                        borderRadius: "1px",
                                        transition: "all 0.3s ease",
                                        opacity: isMenuOpen ? 0 : 1,
                                        position: "absolute" as const,
                                        top: "9px",
                                        left: "2px",
                                    }}
                                />
                                <div
                                    style={{
                                        width: "16px",
                                        height: "2px",
                                        backgroundColor: "white",
                                        borderRadius: "1px",
                                        transition: "all 0.3s ease",
                                        transformOrigin: "center",
                                        position: "absolute" as const,
                                        top: isMenuOpen ? "9px" : "12px",
                                        left: "2px",
                                        transform: isMenuOpen
                                            ? "rotate(-45deg)"
                                            : "rotate(0deg)",
                                    }}
                                />
                            </div>
                        </div>
                    </button>

                    {/* メニューパネル */}
                    {isMenuOpen && (
                        <div
                            data-menu
                            style={{
                                position: "fixed" as const,
                                top: "80px",
                                right: "20px",
                                backgroundColor: "#5FBEAA",
                                color: "white",
                                border: "none",
                                borderRadius: "12px",
                                padding: "1.2rem",
                                boxShadow: "0 6px 20px rgba(95, 190, 170, 0.3)",
                                zIndex: 1000,
                                minWidth: "200px",
                                animation: "fadeIn 0.3s ease",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    marginBottom: "1rem",
                                    gap: "0.5rem",
                                }}
                            >
                                <div
                                    style={{
                                        width: "8px",
                                        height: "8px",
                                        backgroundColor: "#4ade80",
                                        borderRadius: "50%",
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: "0.8em",
                                        opacity: 0.9,
                                    }}
                                >
                                    サインイン中
                                </span>
                            </div>
                            <p
                                style={{
                                    marginBottom: "1rem",
                                    fontSize: "1em",
                                    fontWeight: "600",
                                    margin: "0 0 1rem 0",
                                }}
                            >
                                {voter.display_name} さん
                            </p>
                            <button
                                onClick={handleLogout}
                                style={{
                                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                                    color: "white",
                                    border: "1px solid rgba(255, 255, 255, 0.3)",
                                    padding: "0.6em 1.2em",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontSize: "0.9em",
                                    width: "100%",
                                    fontWeight: "500",
                                    transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                    (
                                        e.target as HTMLElement
                                    ).style.backgroundColor =
                                        "rgba(255, 255, 255, 0.3)";
                                }}
                                onMouseLeave={(e) => {
                                    (
                                        e.target as HTMLElement
                                    ).style.backgroundColor =
                                        "rgba(255, 255, 255, 0.2)";
                                }}
                            >
                                ログアウト
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* ネットワークタイムアウトオーバーレイ */}
            <NetworkTimeoutOverlay
                isVisible={showTimeoutOverlay}
                onRetry={handleTimeoutRetry}
                onClose={handleTimeoutClose}
                message="Issue一覧の取得に時間がかかっています"
                enableAuthRepair={isAuthenticated}
                onAuthRepair={handleAuthRepair}
            />

            {/* 認証修復オーバーレイ */}
            <AuthRepairOverlay
                isVisible={showAuthRepairOverlay}
                onClose={handleAuthRepairClose}
                onSuccess={handleAuthRepairSuccess}
            />

            {/* スクロールトップボタン */}
            <ScrollToTopButton isMobile={isMobile} threshold={400} />
        </div>
    );
}
