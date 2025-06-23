import { useEffect, useState } from "react";
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
            
            const { count } = await supabase
                .from("github_issues")
                .select("*", { count: "exact", head: true });

            const totalCount = count || 0;
            setTotalPages(Math.ceil(totalCount / ITEMS_PER_PAGE));

            const { data: issuesData, error: issuesError } = await supabase
                .from("github_issues")
                .select("*")
                .order("created_at", { ascending: false })
                .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

            if (issuesError) throw issuesError;

            const issuesWithVotes: IssueWithVotes[] = [];

            for (const issue of issuesData || []) {
                const { data: goodVotes } = await supabase
                    .from("issue_votes")
                    .select("vote_id")
                    .eq("issue_id", issue.issue_id)
                    .eq("vote_type", "good");

                const { data: badVotes } = await supabase
                    .from("issue_votes")
                    .select("vote_id")
                    .eq("issue_id", issue.issue_id)
                    .eq("vote_type", "bad");

                let userVote = null;
                if (voter) {
                    const { data: userVoteData } = await supabase
                        .from("issue_votes")
                        .select("*")
                        .eq("issue_id", issue.issue_id)
                        .eq("voter_id", voter.voter_id)
                        .single();
                    userVote = userVoteData;
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
            console.error("Issue取得エラー:", err);
            setError("Issueデータの取得に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    const handleVoterIdSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!voterIdNumber.trim()) return;

        try {
            const { data: voterData, error: voterError } = await supabase
                .from("voters")
                .select("*")
                .eq("identification_number", voterIdNumber.trim())
                .single();

            if (voterError) {
                setError("投票者IDが見つかりません");
                return;
            }

            if (!voterData.is_eligible) {
                setError("この投票者は投票資格がありません");
                return;
            }

            setVoter(voterData);
            setError(null);
        } catch (err) {
            console.error("投票者確認エラー:", err);
            setError("投票者の確認に失敗しました");
        }
    };

    const handleVote = async (issueId: string, voteType: "good" | "bad") => {
        if (!voter) return;

        setSubmitting(issueId);
        setError(null);

        try {
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
            console.error("投票エラー:", err);
            setError("投票の送信に失敗しました");
        } finally {
            setSubmitting(null);
        }
    };

    const containerStyle = {
        minHeight: "100vh",
        backgroundColor: "#f5f7fa",
        padding: "1rem",
    };

    const mobileContainerStyle = {
        ...containerStyle,
        padding: "0.5rem",
    };

    const contentStyle = {
        maxWidth: "1200px",
        margin: "0 auto",
    };

    const headerStyle = {
        fontSize: "2rem",
        fontWeight: "600",
        color: "#333",
        marginBottom: "2rem",
        textAlign: "center" as const,
    };

    const mobileHeaderStyle = {
        ...headerStyle,
        fontSize: "1.5rem",
        marginBottom: "1rem",
    };

    const cardStyle = {
        backgroundColor: "white",
        border: "2px solid #e0e0e0",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        color: "#333",
    };

    const mobileCardStyle = {
        ...cardStyle,
        padding: "1rem",
        marginBottom: "1rem",
    };

    const issueCardStyle = {
        backgroundColor: "white",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        padding: "1.5rem",
        marginBottom: "1rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        color: "#333",
    };

    const mobileIssueCardStyle = {
        ...issueCardStyle,
        padding: "1rem",
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
        marginRight: "0.5rem",
    };

    const voteButtonStyle = {
        border: "1px solid #ddd",
        borderRadius: "6px",
        padding: "0.5rem 1rem",
        cursor: "pointer",
        fontSize: "1.2rem",
        fontWeight: "500",
        marginRight: "0.5rem",
        transition: "all 0.2s ease",
        backgroundColor: "white",
    };

    const activeVoteButtonStyle = {
        ...voteButtonStyle,
        backgroundColor: "#646cff",
        color: "white",
        borderColor: "#646cff",
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
        padding: "0.5rem 1rem",
        border: "1px solid #ddd",
        backgroundColor: "white",
        cursor: "pointer",
        borderRadius: "4px",
    };

    const activePageButtonStyle = {
        ...pageButtonStyle,
        backgroundColor: "#646cff",
        color: "white",
        borderColor: "#646cff",
    };

    const inputStyle = {
        width: "100%",
        padding: "0.6em",
        borderRadius: "8px",
        border: "1px solid #ccc",
        fontSize: "1em",
        marginBottom: "1rem",
    };

    const isMobile = window.innerWidth <= 768;

    if (loading) {
        return (
            <div style={isMobile ? mobileContainerStyle : containerStyle}>
                <div style={contentStyle}>
                    <div style={{ textAlign: "center", padding: "2rem" }}>
                        <h2>読み込み中...</h2>
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
                    <button onClick={() => window.location.href = "/"} style={buttonStyle}>
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

                {!voter ? (
                    <div style={isMobile ? mobileCardStyle : cardStyle}>
                        <h2 style={{ marginBottom: "1rem" }}>投票者確認</h2>
                        <p style={{ marginBottom: "1rem", color: "#666" }}>
                            Issue評価には、投票者IDを入力してください
                        </p>
                        <form onSubmit={handleVoterIdSubmit}>
                            <input
                                type="text"
                                placeholder="投票者ID（身分証明書番号）"
                                value={voterIdNumber}
                                onChange={(e) => setVoterIdNumber(e.target.value)}
                                style={inputStyle}
                                required
                            />
                            <button type="submit" style={buttonStyle}>
                                確認
                            </button>
                        </form>
                    </div>
                ) : (
                    <>
                        <div style={isMobile ? mobileCardStyle : cardStyle}>
                            <h2 style={{ marginBottom: "0.5rem" }}>投票者情報</h2>
                            <p style={{ color: "#666", marginBottom: "0" }}>
                                {voter.name} さん、こんにちは
                            </p>
                        </div>

                        {issues.length === 0 ? (
                            <div style={isMobile ? mobileCardStyle : cardStyle}>
                                <h2>現在評価可能なIssueはありません</h2>
                                <p style={{ color: "#666" }}>
                                    新しいIssueが追加されるまでお待ちください
                                </p>
                            </div>
                        ) : (
                            <>
                                {issues.map(({ issue, goodVotes, badVotes, userVote }) => (
                                    <div
                                        key={issue.issue_id}
                                        style={isMobile ? mobileIssueCardStyle : issueCardStyle}
                                    >
                                        <div style={{ 
                                            display: "flex", 
                                            flexDirection: isMobile ? "column" : "row",
                                            justifyContent: "space-between",
                                            alignItems: isMobile ? "flex-start" : "flex-start",
                                            gap: "1rem"
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ 
                                                    display: "flex", 
                                                    flexDirection: isMobile ? "column" : "row",
                                                    alignItems: isMobile ? "flex-start" : "center",
                                                    gap: "0.5rem",
                                                    marginBottom: "0.5rem"
                                                }}>
                                                    <span style={{
                                                        backgroundColor: "#f0f0f0",
                                                        padding: "0.2rem 0.5rem",
                                                        borderRadius: "4px",
                                                        fontSize: "0.8rem",
                                                        color: "#666"
                                                    }}>
                                                        #{issue.github_issue_number}
                                                    </span>
                                                    <span style={{
                                                        backgroundColor: "#e3f2fd",
                                                        padding: "0.2rem 0.5rem",
                                                        borderRadius: "4px",
                                                        fontSize: "0.8rem",
                                                        color: "#1976d2"
                                                    }}>
                                                        {issue.repository_owner}/{issue.repository_name}
                                                    </span>
                                                </div>
                                                <h3 style={{ 
                                                    marginBottom: "0.5rem",
                                                    fontSize: isMobile ? "1rem" : "1.2rem",
                                                    lineHeight: "1.4"
                                                }}>
                                                    {issue.title}
                                                </h3>
                                                {issue.body && (
                                                    <p style={{
                                                        color: "#666",
                                                        fontSize: "0.9rem",
                                                        lineHeight: "1.5",
                                                        marginBottom: "1rem",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap"
                                                    }}>
                                                        {issue.body}
                                                    </p>
                                                )}
                                                <div style={{
                                                    fontSize: "0.8rem",
                                                    color: "#888",
                                                    marginBottom: "1rem"
                                                }}>
                                                    作成日: {new Date(issue.created_at).toLocaleDateString()}
                                                    {issue.branch_name && (
                                                        <span style={{ marginLeft: "1rem" }}>
                                                            ブランチ: {issue.branch_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div style={{ 
                                                display: "flex", 
                                                flexDirection: isMobile ? "row" : "column",
                                                alignItems: "center",
                                                gap: "0.5rem",
                                                minWidth: isMobile ? "auto" : "120px"
                                            }}>
                                                <button
                                                    onClick={() => handleVote(issue.issue_id, "good")}
                                                    disabled={submitting === issue.issue_id}
                                                    style={
                                                        userVote?.vote_type === "good"
                                                            ? activeVoteButtonStyle
                                                            : voteButtonStyle
                                                    }
                                                >
                                                    👍 {goodVotes}
                                                </button>
                                                <button
                                                    onClick={() => handleVote(issue.issue_id, "bad")}
                                                    disabled={submitting === issue.issue_id}
                                                    style={
                                                        userVote?.vote_type === "bad"
                                                            ? activeVoteButtonStyle
                                                            : voteButtonStyle
                                                    }
                                                >
                                                    👎 {badVotes}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {totalPages > 1 && (
                                    <div style={paginationStyle}>
                                        <button
                                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            style={{
                                                ...pageButtonStyle,
                                                opacity: currentPage === 1 ? 0.5 : 1,
                                                cursor: currentPage === 1 ? "not-allowed" : "pointer"
                                            }}
                                        >
                                            前へ
                                        </button>
                                        
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            const startPage = Math.max(1, currentPage - 2);
                                            const pageNum = startPage + i;
                                            if (pageNum > totalPages) return null;
                                            
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    style={
                                                        currentPage === pageNum
                                                            ? activePageButtonStyle
                                                            : pageButtonStyle
                                                    }
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                        
                                        <button
                                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                            style={{
                                                ...pageButtonStyle,
                                                opacity: currentPage === totalPages ? 0.5 : 1,
                                                cursor: currentPage === totalPages ? "not-allowed" : "pointer"
                                            }}
                                        >
                                            次へ
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
