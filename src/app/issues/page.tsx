import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import type { Tables } from "../../types/supabase";

interface IssueWithVotes {
    issue: Tables<"github_issues">;
    goodVotes: number;
    badVotes: number;
    userVote?: Tables<"issue_votes"> | null;
}

export default function IssuesPageComponent() {
    const [issues, setIssues] = useState<IssueWithVotes[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [voterIdNumber, setVoterIdNumber] = useState("");
    const [voter, setVoter] = useState<Tables<"voters"> | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [submitting, setSubmitting] = useState<string | null>(null);

    const ITEMS_PER_PAGE = 50;

    useEffect(() => {
        fetchIssues();
    }, [currentPage, voter]);

    const fetchIssues = async () => {
        try {
            setLoading(true);
            setError(null);

            const { count } = await supabase
                .from("github_issues")
                .select("*", { count: "exact", head: true });

            setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));

            const { data: issuesData, error: issuesError } = await supabase
                .from("github_issues")
                .select("*")
                .order("created_at", { ascending: false })
                .range(
                    (currentPage - 1) * ITEMS_PER_PAGE,
                    currentPage * ITEMS_PER_PAGE - 1,
                );

            if (issuesError) throw issuesError;

            const issuesWithVotes: IssueWithVotes[] = [];

            for (const issue of issuesData || []) {
                const { data: goodVotes } = await supabase
                    .from("issue_votes")
                    .select("*", { count: "exact", head: true })
                    .eq("issue_id", issue.issue_id)
                    .eq("vote_type", "good");

                const { data: badVotes } = await supabase
                    .from("issue_votes")
                    .select("*", { count: "exact", head: true })
                    .eq("issue_id", issue.issue_id)
                    .eq("vote_type", "bad");

                let userVote: Tables<"issue_votes"> | null = null;
                if (voter) {
                    const { data: userVoteData } = await supabase
                        .from("issue_votes")
                        .select("*")
                        .eq("issue_id", issue.issue_id)
                        .eq("voter_id", voter.voter_id)
                        .single();
                    userVote = userVoteData || null;
                }

                issuesWithVotes.push({
                    issue,
                    goodVotes: goodVotes?.length || 0,
                    badVotes: badVotes?.length || 0,
                    userVote,
                });
            }

            setIssues(issuesWithVotes);
        } catch (err) {
            console.error("Error fetching issues:", err);
            setError("Issue情報の取得に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    const handleVoterIdSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError(null);
            const { data: voterData, error: voterError } = await supabase
                .from("voters")
                .select("*")
                .eq("identification_number", voterIdNumber)
                .single();

            if (voterError || !voterData) {
                setError("投票者IDが見つかりません");
                return;
            }

            setVoter(voterData);
        } catch (err) {
            console.error("Error finding voter:", err);
            setError("投票者IDの確認に失敗しました");
        }
    };

    const handleVote = async (issueId: string, voteType: "good" | "bad") => {
        if (!voter) return;

        try {
            setSubmitting(issueId);
            setError(null);

            const { data: existingVote } = await supabase
                .from("issue_votes")
                .select("*")
                .eq("issue_id", issueId)
                .eq("voter_id", voter.voter_id)
                .single();

            if (existingVote) {
                if (existingVote.vote_type === voteType) {
                    const { error: deleteError } = await supabase
                        .from("issue_votes")
                        .delete()
                        .eq("vote_id", existingVote.vote_id);
                    if (deleteError) throw deleteError;
                } else {
                    const { error: updateError } = await supabase
                        .from("issue_votes")
                        .update({ vote_type: voteType })
                        .eq("vote_id", existingVote.vote_id);
                    if (updateError) throw updateError;
                }
            } else {
                const { error: insertError } = await supabase
                    .from("issue_votes")
                    .insert({
                        issue_id: issueId,
                        voter_id: voter.voter_id,
                        vote_type: voteType,
                    });
                if (insertError) throw insertError;
            }

            await fetchIssues();
        } catch (err) {
            console.error("Error voting:", err);
            setError("投票に失敗しました");
        } finally {
            setSubmitting(null);
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

    const activeVoteButtonStyle: React.CSSProperties = {
        ...voteButtonStyle,
        backgroundColor: "#007bff",
        color: "white",
        borderColor: "#007bff",
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

    const inputStyle: React.CSSProperties = {
        padding: "0.75rem",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "1rem",
        width: "200px",
        marginRight: "1rem",
    };

    const isMobile = window.innerWidth <= 768;

    if (!voter) {
        return (
            <div style={isMobile ? mobileContainerStyle : containerStyle}>
                <div style={contentStyle}>
                    <h1 style={isMobile ? mobileHeaderStyle : headerStyle}>
                        GitHub Issue評価
                    </h1>

                    <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                        <button
                            onClick={() => (window.location.href = "/")}
                            style={buttonStyle}
                        >
                            トップに戻る
                        </button>
                    </div>

                    <div style={isMobile ? mobileCardStyle : cardStyle}>
                        <h2
                            style={{
                                marginBottom: "1rem",
                                textAlign: "center",
                            }}
                        >
                            投票者認証
                        </h2>
                        <p
                            style={{
                                textAlign: "center",
                                marginBottom: "1.5rem",
                                color: "#666",
                            }}
                        >
                            GitHub
                            Issueに投票するには、投票者IDを入力してください
                        </p>

                        <form
                            onSubmit={handleVoterIdSubmit}
                            style={{ textAlign: "center" }}
                        >
                            <div style={{ marginBottom: "1rem" }}>
                                <input
                                    type="text"
                                    value={voterIdNumber}
                                    onChange={(e) =>
                                        setVoterIdNumber(e.target.value)
                                    }
                                    placeholder="投票者ID番号を入力"
                                    style={inputStyle}
                                    required
                                />
                            </div>
                            <button type="submit" style={buttonStyle}>
                                認証
                            </button>
                        </form>

                        {error && (
                            <div
                                style={{
                                    color: "red",
                                    textAlign: "center",
                                    marginTop: "1rem",
                                    padding: "0.5rem",
                                    backgroundColor: "#ffe6e6",
                                    borderRadius: "4px",
                                }}
                            >
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={isMobile ? mobileContainerStyle : containerStyle}>
            <div style={contentStyle}>
                <h1 style={isMobile ? mobileHeaderStyle : headerStyle}>
                    GitHub Issue評価
                </h1>

                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <p style={{ marginBottom: "1rem", color: "#666" }}>
                        ログイン中: {voter.name} (ID:{" "}
                        {voter.identification_number})
                    </p>
                    <button
                        onClick={() => setVoter(null)}
                        style={{
                            ...buttonStyle,
                            backgroundColor: "#6c757d",
                            marginRight: "1rem",
                        }}
                    >
                        ログアウト
                    </button>
                    <button
                        onClick={() => (window.location.href = "/")}
                        style={buttonStyle}
                    >
                        トップに戻る
                    </button>
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

                {!loading && issues.length === 0 && (
                    <div style={isMobile ? mobileCardStyle : cardStyle}>
                        <p style={{ textAlign: "center", color: "#666" }}>
                            GitHub Issueが見つかりませんでした
                        </p>
                    </div>
                )}

                {!loading && issues.length > 0 && (
                    <>
                        <div
                            style={{
                                marginBottom: "1rem",
                                textAlign: "center",
                                color: "#666",
                            }}
                        >
                            ページ {currentPage} / {totalPages} (全{" "}
                            {issues.length} 件)
                        </div>

                        {issues.map(
                            ({ issue, goodVotes, badVotes, userVote }) => (
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
                                            <h3
                                                style={{
                                                    marginBottom: "0.5rem",
                                                    fontSize: isMobile
                                                        ? "1rem"
                                                        : "1.2rem",
                                                    lineHeight: "1.4",
                                                }}
                                            >
                                                {issue.title}
                                            </h3>
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
                                            <button
                                                onClick={() =>
                                                    handleVote(
                                                        issue.issue_id,
                                                        "good",
                                                    )
                                                }
                                                disabled={
                                                    submitting ===
                                                    issue.issue_id
                                                }
                                                style={
                                                    userVote?.vote_type ===
                                                    "good"
                                                        ? activeVoteButtonStyle
                                                        : voteButtonStyle
                                                }
                                            >
                                                👍 {goodVotes}
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleVote(
                                                        issue.issue_id,
                                                        "bad",
                                                    )
                                                }
                                                disabled={
                                                    submitting ===
                                                    issue.issue_id
                                                }
                                                style={
                                                    userVote?.vote_type ===
                                                    "bad"
                                                        ? activeVoteButtonStyle
                                                        : voteButtonStyle
                                                }
                                            >
                                                👎 {badVotes}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ),
                        )}

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
