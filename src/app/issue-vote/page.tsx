import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import type { Tables } from "../../types/supabase";

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
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();
    const { voter, isAuthenticated, loading: authLoading } = useAuth();

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
                    setSubmitSuccess("投票を取り消しました");
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
                    setSubmitSuccess("投票を変更しました");
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
                setSubmitSuccess("投票しました");
            }

            setSelectedVotes((prev) => {
                const updated = { ...prev };
                delete updated[issueId];
                return updated;
            });
        } catch (err) {
            console.error("投票エラー:", err);
            setError("投票の送信に失敗しました");
        } finally {
            setSubmitting(false);
        }
    };

    const buttonStyle = {
        backgroundColor: "#646cff",
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
        borderColor: "#4caf50",
        backgroundColor: "#e8f5e9",
        color: "#2e7d32",
    };

    const badButtonStyle = {
        ...voteButtonStyle,
        borderColor: "#f44336",
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
    };

    const activePageButtonStyle = {
        ...pageButtonStyle,
        backgroundColor: "#646cff",
        color: "white",
        borderColor: "#646cff",
    };

    if (loading) {
        return (
            <div style={{ padding: "2rem", textAlign: "center" }}>
                <h2>読み込み中...</h2>
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundColor: "#f5f7fa",
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
                    変更案評価
                </h1>

                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <button onClick={() => navigate("/")} style={buttonStyle}>
                        トップに戻る
                    </button>
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

                {submitSuccess && (
                    <div
                        style={{
                            backgroundColor: "#e8f5e8",
                            color: "#2e7d32",
                            padding: "1rem",
                            borderRadius: "8px",
                            marginBottom: "2rem",
                        }}
                    >
                        {submitSuccess}
                    </div>
                )}

                <div style={cardStyle}>
                    <h2 style={{ marginBottom: "0.5rem" }}>投票者情報</h2>
                    <p style={{ color: "#666", marginBottom: "0" }}>
                        {voter?.display_name} さん、こんにちは
                    </p>
                </div>

                {issues.length > 0 && (
                    <div
                        style={{
                            marginBottom: "1rem",
                            textAlign: "center",
                            color: "#666",
                            fontSize: "0.9rem",
                        }}
                    >
                        ページ {currentPage} / {totalPages}
                    </div>
                )}

                {issues.length > 0 && (
                    <div
                        style={{
                            marginBottom: "1.5rem",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "0.5rem",
                        }}
                    >
                        <label style={{ fontSize: "0.9rem", color: "#666" }}>
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
                            <option value="id_asc">作成日時（古い順）</option>
                        </select>
                    </div>
                )}

                {issues.length === 0 ? (
                    <div style={cardStyle}>
                        <h2>評価可能な変更案はありません</h2>
                        <p style={{ color: "#666" }}>
                            評価可能な変更案が追加されるまでお待ちください
                        </p>
                    </div>
                ) : (
                    <>
                        {sortIssues(issues, sortOption)
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
                                    <div key={issue.issue_id} style={cardStyle}>
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
                                                }}
                                            >
                                                現在の評価:{" "}
                                                {existingVote === "good"
                                                    ? "👍 Good"
                                                    : "👎 Bad"}
                                            </div>
                                        )}

                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                flexWrap: "wrap",
                                                gap: "1rem",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "0.5rem",
                                                }}
                                            >
                                                <button
                                                    style={
                                                        selectedVote ===
                                                            "good" ||
                                                        existingVote === "good"
                                                            ? selectedGoodButtonStyle
                                                            : goodButtonStyle
                                                    }
                                                    onClick={() =>
                                                        handleVoteSelect(
                                                            issue.issue_id,
                                                            "good",
                                                        )
                                                    }
                                                >
                                                    👍 Good
                                                </button>
                                                <button
                                                    style={
                                                        selectedVote ===
                                                            "bad" ||
                                                        existingVote === "bad"
                                                            ? selectedBadButtonStyle
                                                            : badButtonStyle
                                                    }
                                                    onClick={() =>
                                                        handleVoteSelect(
                                                            issue.issue_id,
                                                            "bad",
                                                        )
                                                    }
                                                >
                                                    👎 Bad
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
                                                                : "#646cff",
                                                        cursor: submitting
                                                            ? "not-allowed"
                                                            : "pointer",
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
                                                }}
                                            >
                                                🔗 GitHubで開く
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}

                        {totalPages > 1 && (
                            <div style={paginationStyle}>
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
