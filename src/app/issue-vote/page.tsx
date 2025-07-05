import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
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

type SortOption = "created_at_desc" | "id_asc";

export default function IssueVotePageComponent() {
    const [issues, setIssues] = useState<Tables<"github_issues">[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVotes, setSelectedVotes] = useState<
        Record<string, "good" | "bad">
    >({});
    const [existingVotes, setExistingVotes] = useState<
        Record<string, "good" | "bad">
    >({});
    const [submitting, setSubmitting] = useState(false);
    const [issueMessages, setIssueMessages] = useState<
        Record<string, { message: string; type: "success" | "error" }>
    >({});
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeSearchTerm, setActiveSearchTerm] = useState("");
    const [filteredIssues, setFilteredIssues] = useState<
        Tables<"github_issues">[]
    >([]);
    const [searchError, setSearchError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { voter, isAuthenticated, loading: authLoading } = useAuth();
    const isMobile = useIsMobile();
    const isExtraSmallMobile = useIsExtraSmallMobile();

    const ITEMS_PER_PAGE = 50;
    const [sortOption, setSortOption] = useState<SortOption>("created_at_desc");

    useEffect(() => {
        if (!authLoading) {
            if (!isAuthenticated) {
                navigate("/");
                return;
            }
            fetchIssues();
            fetchExistingVotes();
        }
    }, [navigate, isAuthenticated, authLoading]);

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

            const filtered = issues.filter((issue) => {
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

    const fetchIssues = async () => {
        try {
            setLoading(true);
            setError(null);

            const { count, error: countError } = await supabase
                .from("github_issues")
                .select("*", { count: "exact", head: true });

            if (countError) throw countError;

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

            setIssues(allIssuesData || []);
            setFilteredIssues(allIssuesData || []);
            setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
        } catch (err) {
            console.error("GitHub Issue取得エラー:", err);
            setError("GitHub Issueの取得に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    const fetchExistingVotes = async () => {
        if (!voter) return;

        try {
            const { data: votesData, error: votesError } = await supabase
                .from("issue_votes")
                .select("issue_id, vote_type")
                .eq("voter_id", voter.voter_id);

            if (votesError) throw votesError;

            const votesMap: Record<string, "good" | "bad"> = {};
            votesData?.forEach((vote: any) => {
                votesMap[vote.issue_id] = vote.vote_type as "good" | "bad";
            });

            setExistingVotes(votesMap);
        } catch (err) {
            console.error("既存投票取得エラー:", err);
        }
    };

    const sortIssues = (
        issues: Tables<"github_issues">[],
        sortBy: SortOption,
    ): Tables<"github_issues">[] => {
        const sorted = [...issues];
        switch (sortBy) {
            case "id_asc":
                return sorted.sort(
                    (a, b) =>
                        new Date(a.created_at).getTime() -
                        new Date(b.created_at).getTime(),
                );
            case "created_at_desc":
            default:
                return sorted.sort(
                    (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime(),
                );
        }
    };

    const handleVoteSelect = (issueId: string, voteType: "good" | "bad") => {
        setSelectedVotes((prev) => ({
            ...prev,
            [issueId]: voteType,
        }));
    };

    const handleVoteSubmit = async (issueId: string) => {
        if (!voter || !selectedVotes[issueId]) return;

        setSubmitting(true);
        setError(null);

        try {
            const existingVote = existingVotes[issueId];
            const newVote = selectedVotes[issueId];

            if (existingVote) {
                if (existingVote === newVote) {
                    const { error: deleteError } = await supabase
                        .from("issue_votes")
                        .delete()
                        .eq("issue_id", issueId)
                        .eq("voter_id", voter.voter_id);

                    if (deleteError) throw deleteError;

                    setExistingVotes((prev) => {
                        const updated = { ...prev };
                        delete updated[issueId];
                        return updated;
                    });
                    setIssueMessages((prev) => ({
                        ...prev,
                        [issueId]: {
                            message: "投票を取り消しました",
                            type: "success",
                        },
                    }));
                    setTimeout(() => {
                        setIssueMessages((prev) => {
                            const updated = { ...prev };
                            delete updated[issueId];
                            return updated;
                        });
                    }, 3000);
                } else {
                    const { error: updateError } = await supabase
                        .from("issue_votes")
                        .update({ vote_type: newVote })
                        .eq("issue_id", issueId)
                        .eq("voter_id", voter.voter_id);

                    if (updateError) throw updateError;

                    setExistingVotes((prev) => ({
                        ...prev,
                        [issueId]: newVote,
                    }));
                    setIssueMessages((prev) => ({
                        ...prev,
                        [issueId]: {
                            message: "投票を変更しました",
                            type: "success",
                        },
                    }));
                    setTimeout(() => {
                        setIssueMessages((prev) => {
                            const updated = { ...prev };
                            delete updated[issueId];
                            return updated;
                        });
                    }, 3000);
                }
            } else {
                const { error: insertError } = await supabase
                    .from("issue_votes")
                    .insert({
                        issue_id: issueId,
                        voter_id: voter.voter_id,
                        vote_type: newVote,
                    });

                if (insertError) throw insertError;

                setExistingVotes((prev) => ({
                    ...prev,
                    [issueId]: newVote,
                }));
                setIssueMessages((prev) => ({
                    ...prev,
                    [issueId]: { message: "投票しました", type: "success" },
                }));
                setTimeout(() => {
                    setIssueMessages((prev) => {
                        const updated = { ...prev };
                        delete updated[issueId];
                        return updated;
                    });
                }, 3000);
            }

            setSelectedVotes((prev) => {
                const updated = { ...prev };
                delete updated[issueId];
                return updated;
            });
        } catch (err) {
            console.error("投票エラー:", err);
            setIssueMessages((prev) => ({
                ...prev,
                [issueId]: {
                    message: "投票の送信に失敗しました",
                    type: "error",
                },
            }));
            setTimeout(() => {
                setIssueMessages((prev) => {
                    const updated = { ...prev };
                    delete updated[issueId];
                    return updated;
                });
            }, 3000);
        } finally {
            setSubmitting(false);
        }
    };

    const buttonStyle = {
        backgroundColor: "#5FBEAA",
        color: "white",
        border: "none",
        padding: "0.8em 2em",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "1em",
        fontWeight: "500",
    };

    const cardStyle = {
        backgroundColor: "white",
        border: "2px solid #e0e0e0",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "2rem",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        color: "#333",
    };

    const voteButtonStyle = {
        padding: "0.5em 1em",
        margin: "0 0.5em",
        borderRadius: "6px",
        border: "2px solid",
        cursor: "pointer",
        fontSize: "1.2em",
        fontWeight: "500",
        transition: "all 0.2s ease",
    };

    const goodButtonStyle = {
        ...voteButtonStyle,
        borderColor: "#5FBEAA",
        backgroundColor: "#e8f5e9",
        color: "#2e7d32",
    };

    const badButtonStyle = {
        ...voteButtonStyle,
        borderColor: "#e57373",
        backgroundColor: "#ffebee",
        color: "#c62828",
    };

    const selectedGoodButtonStyle = {
        ...goodButtonStyle,
        backgroundColor: "#4caf50",
        color: "white",
    };

    const selectedBadButtonStyle = {
        ...badButtonStyle,
        backgroundColor: "#f44336",
        color: "white",
    };

    const paginationStyle = {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "0.5rem",
        marginTop: "2rem",
        flexWrap: "wrap" as const,
    };

    const pageButtonStyle = {
        backgroundColor: "#f8f9fa",
        color: "#333",
        border: "1px solid #dee2e6",
        padding: "0.5rem 0.75rem",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "0.9rem",
        fontWeight: "500",
        minWidth: "44px",
        minHeight: "44px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    };

    const activePageButtonStyle = {
        ...pageButtonStyle,
        backgroundColor: "#5FBEAA",
        color: "white",
        borderColor: "#5FBEAA",
    };

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background:
                        "linear-gradient(135deg, #C8F0E5 0%, #E8F8F3 50%, #F0FDF7 100%)",
                    padding: "2rem",
                }}
            >
                <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                    <div style={{ textAlign: "center" }}>
                        <div className="spinner"></div>
                        <h2 style={{ margin: 0 }}>読み込み中...</h2>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                background:
                    "linear-gradient(135deg, #C8F0E5 0%, #E8F8F3 50%, #F0FDF7 100%)",
                padding: "2rem",
            }}
        >
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <h1
                    style={{
                        fontSize: "2rem",
                        fontWeight: "600",
                        color: "#333",
                        marginBottom: "2rem",
                        textAlign: "center",
                    }}
                >
                    共感の声を届ける
                </h1>

                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                    <button
                        onClick={() => navigate("/")}
                        style={{ ...buttonStyle, backgroundColor: "#5FBEAA" }}
                    >
                        トップに戻る
                    </button>
                </div>

                <div style={{ marginBottom: "1rem", textAlign: "center" }}>
                    <p
                        style={{
                            color: "#666",
                            fontSize: "0.95rem",
                            margin: "0",
                        }}
                    >
                        {voter?.display_name} さん、こんにちは
                    </p>
                </div>

                {error && (
                    <div
                        style={{
                            backgroundColor: "#ffebee",
                            color: "#c62828",
                            padding: "1rem",
                            borderRadius: "8px",
                            marginBottom: "2rem",
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* 検索窓 */}
                <div style={cardStyle}>
                    <h3 style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
                        検索
                    </h3>
                    <div
                        style={{
                            display: "flex",
                            gap: isExtraSmallMobile ? "0.25rem" : "0.5rem",
                            alignItems: "flex-start",
                            flexDirection: isExtraSmallMobile
                                ? "column"
                                : "row",
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
                                flex: 1,
                                padding: isExtraSmallMobile
                                    ? "0.6rem"
                                    : "0.75rem",
                                borderRadius: "8px",
                                border: "2px solid var(--border-strong)",
                                fontSize: isExtraSmallMobile
                                    ? "0.9rem"
                                    : "1rem",
                                backgroundColor: "var(--bg-secondary)",
                                color: "var(--text-primary)",
                                transition: "all 0.2s ease",
                                outline: "none",
                                boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.1)",
                                width: isExtraSmallMobile ? "100%" : "auto",
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
                        {isExtraSmallMobile ? (
                            <>
                                <button
                                    onClick={handleSearch}
                                    disabled={
                                        !!searchError ||
                                        searchTerm.trim().length === 0
                                    }
                                    style={{
                                        padding: "0.6rem 1rem",
                                        borderRadius: "8px",
                                        border: "none",
                                        backgroundColor:
                                            !!searchError ||
                                            searchTerm.trim().length === 0
                                                ? "#ccc"
                                                : "#5FBEAA",
                                        color: "white",
                                        fontSize: "0.9rem",
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
                                        width: "100%",
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
                                            padding: "0.6rem 1rem",
                                            borderRadius: "8px",
                                            border: "2px solid var(--border-strong)",
                                            backgroundColor:
                                                "var(--bg-secondary)",
                                            color: "var(--text-primary)",
                                            fontSize: "0.9rem",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                            whiteSpace: "nowrap",
                                            width: "100%",
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
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleSearch}
                                    disabled={
                                        !!searchError ||
                                        searchTerm.trim().length === 0
                                    }
                                    style={{
                                        padding: "0.75rem 1.5rem",
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
                                            padding: "0.75rem 1rem",
                                            borderRadius: "8px",
                                            border: "2px solid var(--border-strong)",
                                            backgroundColor:
                                                "var(--bg-secondary)",
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
                            </>
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

                    {/* 上部ページネーション */}
                    {filteredIssues.length > 0 && totalPages > 1 && (
                        <div style={{ ...paginationStyle, marginTop: "1rem" }}>
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                style={{
                                    ...pageButtonStyle,
                                    opacity: currentPage === 1 ? 0.5 : 1,
                                    cursor:
                                        currentPage === 1
                                            ? "not-allowed"
                                            : "pointer",
                                }}
                            >
                                {isMobile ? "≪" : "≪ 最初"}
                            </button>
                            <button
                                onClick={() =>
                                    setCurrentPage(Math.max(1, currentPage - 1))
                                }
                                disabled={currentPage === 1}
                                style={{
                                    ...pageButtonStyle,
                                    opacity: currentPage === 1 ? 0.5 : 1,
                                    cursor:
                                        currentPage === 1
                                            ? "not-allowed"
                                            : "pointer",
                                }}
                            >
                                {isMobile ? "‹" : "前へ"}
                            </button>

                            {Array.from(
                                {
                                    length: Math.min(
                                        isMobile ? 3 : 5,
                                        totalPages,
                                    ),
                                },
                                (_, i) => {
                                    const startPage = Math.max(
                                        1,
                                        currentPage - (isMobile ? 1 : 2),
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
                                style={{
                                    ...pageButtonStyle,
                                    opacity:
                                        currentPage === totalPages ? 0.5 : 1,
                                    cursor:
                                        currentPage === totalPages
                                            ? "not-allowed"
                                            : "pointer",
                                }}
                            >
                                {isMobile ? "›" : "次へ"}
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                style={{
                                    ...pageButtonStyle,
                                    opacity:
                                        currentPage === totalPages ? 0.5 : 1,
                                    cursor:
                                        currentPage === totalPages
                                            ? "not-allowed"
                                            : "pointer",
                                }}
                            >
                                {isMobile ? "≫" : "最後 ≫"}
                            </button>
                        </div>
                    )}
                </div>

                {filteredIssues.length > 0 && (
                    <div
                        style={{
                            marginBottom: "1rem",
                            textAlign: "center",
                            color: "var(--text-secondary)",
                            fontSize: "0.9rem",
                        }}
                    >
                        ページ {currentPage} / {totalPages}
                        {activeSearchTerm &&
                            ` (検索結果: ${filteredIssues.length}件)`}
                    </div>
                )}

                {filteredIssues.length > 0 && (
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
                            style={{
                                fontSize: "0.9rem",
                                color: "var(--text-secondary)",
                            }}
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
                            <option value="id_asc">作成日時（古い順）</option>
                        </select>
                    </div>
                )}

                {filteredIssues.length === 0 ? (
                    <div style={cardStyle}>
                        <h2>
                            {activeSearchTerm
                                ? "検索結果がありません"
                                : "評価可能な変更案はありません"}
                        </h2>
                        <p style={{ color: "var(--text-secondary)" }}>
                            {activeSearchTerm
                                ? "検索条件を変更してお試しください"
                                : "評価可能な変更案が追加されるまでお待ちください"}
                        </p>
                    </div>
                ) : (
                    <>
                        {sortIssues(filteredIssues, sortOption)
                            .slice(
                                (currentPage - 1) * ITEMS_PER_PAGE,
                                currentPage * ITEMS_PER_PAGE,
                            )
                            .map((issue) => {
                                const existingVote =
                                    existingVotes[issue.issue_id];
                                const selectedVote =
                                    selectedVotes[issue.issue_id];

                                return (
                                    <div
                                        key={issue.issue_id}
                                        style={{
                                            ...cardStyle,
                                            position: "relative",
                                        }}
                                    >
                                        {issueMessages[issue.issue_id] && (
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    top: "0.5rem",
                                                    right: "0.5rem",
                                                    backgroundColor:
                                                        issueMessages[
                                                            issue.issue_id
                                                        ].type === "success"
                                                            ? "#4caf50"
                                                            : "#f44336",
                                                    color: "white",
                                                    padding: "0.5rem 1rem",
                                                    borderRadius: "6px",
                                                    fontSize: "0.85rem",
                                                    fontWeight: "500",
                                                    zIndex: 10,
                                                    boxShadow:
                                                        "0 2px 8px rgba(0,0,0,0.2)",
                                                    animation:
                                                        "fadeIn 0.3s ease-in",
                                                }}
                                            >
                                                {
                                                    issueMessages[
                                                        issue.issue_id
                                                    ].message
                                                }
                                            </div>
                                        )}
                                        <div style={{ marginBottom: "1rem" }}>
                                            <div
                                                style={{
                                                    fontSize: "0.9em",
                                                    color: "#666",
                                                    marginBottom: "0.5rem",
                                                }}
                                            >
                                                {issue.repository_owner}/
                                                {issue.repository_name} #
                                                {issue.github_issue_number}
                                                {issue.branch_name &&
                                                    ` (${issue.branch_name})`}
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
                                                        marginBottom: "1rem",
                                                        fontSize: "1.3em",
                                                        fontWeight: "600",
                                                        margin: 0,
                                                    }}
                                                >
                                                    {issue.title}
                                                </h3>
                                            </a>
                                            {issue.body && (
                                                <div
                                                    style={{
                                                        color: "#666",
                                                        marginBottom: "1rem",
                                                        lineHeight: "1.5",
                                                        maxHeight: "100px",
                                                        overflow: "hidden",
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 3,
                                                        WebkitBoxOrient:
                                                            "vertical" as const,
                                                    }}
                                                >
                                                    {issue.body}
                                                </div>
                                            )}
                                            <div
                                                style={{
                                                    fontSize: "0.8em",
                                                    color: "#888",
                                                    marginBottom: "1.5rem",
                                                }}
                                            >
                                                作成日:{" "}
                                                {new Date(
                                                    issue.created_at,
                                                ).toLocaleString()}
                                            </div>
                                        </div>

                                        {existingVote && (
                                            <div
                                                style={{
                                                    backgroundColor: "#f0f8ff",
                                                    padding: "0.8rem",
                                                    borderRadius: "6px",
                                                    marginBottom: "1rem",
                                                    fontSize: "0.9em",
                                                    color: "#1976d2",
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems: "center",
                                                    gap: "1rem",
                                                }}
                                            >
                                                <span>
                                                    現在の評価:{" "}
                                                    {existingVote === "good"
                                                        ? "👍 Good"
                                                        : "👎 Bad"}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        const issueUrl = `https://github.com/${issue.repository_owner}/${issue.repository_name}/issues/${issue.github_issue_number}`;
                                                        const voteText =
                                                            existingVote ===
                                                            "good"
                                                                ? "Good"
                                                                : "Bad";
                                                        const tweetText = `${voter?.display_name}さんが${issue.title}に ${voteText}評価をしました #チームみらい #対話型マニフェスト\n\n${issueUrl}`;
                                                        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
                                                        window.open(
                                                            twitterUrl,
                                                            "_blank",
                                                        );
                                                    }}
                                                    style={{
                                                        backgroundColor:
                                                            "#1da1f2",
                                                        color: "white",
                                                        border: "none",
                                                        padding:
                                                            "0.4rem 0.8rem",
                                                        borderRadius: "4px",
                                                        cursor: "pointer",
                                                        fontSize: "0.8rem",
                                                        fontWeight: "500",
                                                        whiteSpace: "nowrap",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "0.3rem",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor =
                                                            "#1991db";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor =
                                                            "#1da1f2";
                                                    }}
                                                >
                                                    <svg
                                                        width="14"
                                                        height="14"
                                                        viewBox="0 0 24 24"
                                                        fill="currentColor"
                                                    >
                                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                                    </svg>
                                                    Xに投稿
                                                </button>
                                            </div>
                                        )}

                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                flexWrap: "wrap",
                                                gap: "1rem",
                                                ...(isMobile && {
                                                    flexDirection: "column",
                                                    alignItems: "stretch",
                                                }),
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "0.5rem",
                                                    ...(isMobile && {
                                                        justifyContent:
                                                            "center",
                                                    }),
                                                }}
                                            >
                                                <button
                                                    style={{
                                                        ...(selectedVote ===
                                                            "good" ||
                                                        existingVote === "good"
                                                            ? selectedGoodButtonStyle
                                                            : goodButtonStyle),
                                                        ...(isMobile && {
                                                            fontSize: "1rem",
                                                            padding:
                                                                "0.6rem 1rem",
                                                        }),
                                                    }}
                                                    onClick={() =>
                                                        handleVoteSelect(
                                                            issue.issue_id,
                                                            "good",
                                                        )
                                                    }
                                                >
                                                    {isMobile
                                                        ? "👍"
                                                        : "👍 Good"}
                                                </button>
                                                <button
                                                    style={{
                                                        ...(selectedVote ===
                                                            "bad" ||
                                                        existingVote === "bad"
                                                            ? selectedBadButtonStyle
                                                            : badButtonStyle),
                                                        ...(isMobile && {
                                                            fontSize: "1rem",
                                                            padding:
                                                                "0.6rem 1rem",
                                                        }),
                                                    }}
                                                    onClick={() =>
                                                        handleVoteSelect(
                                                            issue.issue_id,
                                                            "bad",
                                                        )
                                                    }
                                                >
                                                    {isMobile ? "👎" : "👎 Bad"}
                                                </button>
                                            </div>

                                            {selectedVote && (
                                                <button
                                                    onClick={() =>
                                                        handleVoteSubmit(
                                                            issue.issue_id,
                                                        )
                                                    }
                                                    disabled={submitting}
                                                    style={{
                                                        ...buttonStyle,
                                                        backgroundColor:
                                                            submitting
                                                                ? "#ccc"
                                                                : "#5FBEAA",
                                                        cursor: submitting
                                                            ? "not-allowed"
                                                            : "pointer",
                                                        ...(isMobile && {
                                                            fontSize: "0.9rem",
                                                            padding:
                                                                "0.7rem 1.5rem",
                                                        }),
                                                    }}
                                                >
                                                    {submitting
                                                        ? "送信中..."
                                                        : existingVote ===
                                                            selectedVote
                                                          ? "投票取消"
                                                          : existingVote
                                                            ? "投票変更"
                                                            : "投票する"}
                                                </button>
                                            )}

                                            <a
                                                href={`https://github.com/${issue.repository_owner}/${issue.repository_name}/issues/${issue.github_issue_number}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    ...buttonStyle,
                                                    backgroundColor: "#24292e",
                                                    textDecoration: "none",
                                                    display: "inline-block",
                                                    textAlign: "center",
                                                    ...(isMobile && {
                                                        fontSize: "0.9rem",
                                                        padding:
                                                            "0.7rem 1.5rem",
                                                    }),
                                                }}
                                            >
                                                {isMobile
                                                    ? "GitHub"
                                                    : "🔗 GitHubで開く"}
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}

                        {totalPages > 1 && (
                            <div style={paginationStyle}>
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    style={{
                                        ...pageButtonStyle,
                                        opacity: currentPage === 1 ? 0.5 : 1,
                                        cursor:
                                            currentPage === 1
                                                ? "not-allowed"
                                                : "pointer",
                                    }}
                                >
                                    {isMobile ? "≪" : "≪ 最初"}
                                </button>
                                <button
                                    onClick={() =>
                                        setCurrentPage(
                                            Math.max(1, currentPage - 1),
                                        )
                                    }
                                    disabled={currentPage === 1}
                                    style={{
                                        ...pageButtonStyle,
                                        opacity: currentPage === 1 ? 0.5 : 1,
                                        cursor:
                                            currentPage === 1
                                                ? "not-allowed"
                                                : "pointer",
                                    }}
                                >
                                    {isMobile ? "‹" : "前へ"}
                                </button>

                                {Array.from(
                                    {
                                        length: Math.min(
                                            isMobile ? 3 : 5,
                                            totalPages,
                                        ),
                                    },
                                    (_, i) => {
                                        const startPage = Math.max(
                                            1,
                                            currentPage - (isMobile ? 1 : 2),
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
                                    style={{
                                        ...pageButtonStyle,
                                        opacity:
                                            currentPage === totalPages
                                                ? 0.5
                                                : 1,
                                        cursor:
                                            currentPage === totalPages
                                                ? "not-allowed"
                                                : "pointer",
                                    }}
                                >
                                    {isMobile ? "›" : "次へ"}
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    style={{
                                        ...pageButtonStyle,
                                        opacity:
                                            currentPage === totalPages
                                                ? 0.5
                                                : 1,
                                        cursor:
                                            currentPage === totalPages
                                                ? "not-allowed"
                                                : "pointer",
                                    }}
                                >
                                    {isMobile ? "≫" : "最後 ≫"}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
