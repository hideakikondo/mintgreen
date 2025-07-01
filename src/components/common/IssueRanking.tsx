import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import type { Tables } from "../../types/supabase";

interface IssueWithVotes {
    issue: Tables<"github_issues">;
    goodVotes: number;
    badVotes: number;
    score: number;
}

interface IssueRankingProps {
    maxItems?: number;
}

export default function IssueRanking({ maxItems = 5 }: IssueRankingProps) {
    const [rankedIssues, setRankedIssues] = useState<IssueWithVotes[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchRankedIssues();
    }, []);

    const fetchRankedIssues = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data: issuesData, error: issuesError } = await supabase
                .from("github_issues")
                .select("*")
                .order("created_at", { ascending: false });

            if (issuesError) throw issuesError;

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

            const issuesWithVotes: IssueWithVotes[] = [];
            for (const issue of issuesData || []) {
                const voteCounts = voteCountsMap[issue.issue_id] || {
                    good: 0,
                    bad: 0,
                };
                const score = voteCounts.good - voteCounts.bad;

                issuesWithVotes.push({
                    issue,
                    goodVotes: voteCounts.good,
                    badVotes: voteCounts.bad,
                    score,
                });
            }

            const ranked = issuesWithVotes
                .sort((a, b) => b.score - a.score)
                .slice(0, maxItems);

            setRankedIssues(ranked);
        } catch (err) {
            console.error("Error fetching ranked issues:", err);
            setError("ランキングの取得に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    const getRankingIcon = (index: number) => {
        switch (index) {
            case 0:
                return "👑";
            case 1:
                return "🥈";
            case 2:
                return "🥉";
            default:
                return `${index + 1}`;
        }
    };

    const rankingStyle: React.CSSProperties = {
        backgroundColor: "var(--bg-card)",
        border: "2px solid var(--border-strong)",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "2rem",
        boxShadow: "var(--card-shadow)",
        color: "var(--text-primary)",
        maxWidth: "600px",
        width: "100%",
        transition: "all 0.3s ease",
    };

    const rankingItemStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.75rem 0",
        borderBottom: "1px solid var(--border-color)",
    };

    const rankingIconStyle: React.CSSProperties = {
        fontSize: "1.2rem",
        marginRight: "0.75rem",
        minWidth: "2rem",
        textAlign: "center",
    };

    const issueInfoStyle: React.CSSProperties = {
        flex: 1,
        marginRight: "1rem",
    };

    const issueTitleStyle: React.CSSProperties = {
        fontSize: "0.9rem",
        fontWeight: "500",
        marginBottom: "0.25rem",
        lineHeight: "1.3",
        overflow: "hidden",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical" as const,
    };

    const issueMetaStyle: React.CSSProperties = {
        fontSize: "0.75rem",
        color: "var(--text-secondary)",
    };

    const scoreStyle: React.CSSProperties = {
        backgroundColor: "var(--hover-bg)",
        padding: "0.25rem 0.5rem",
        borderRadius: "4px",
        fontSize: "0.8rem",
        fontWeight: "500",
        color: "var(--text-primary)",
        minWidth: "3rem",
        textAlign: "center",
    };

    if (loading) {
        return (
            <div style={rankingStyle}>
                <p style={{ textAlign: "center", margin: 0 }}>読み込み中...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={rankingStyle}>
                <p style={{ textAlign: "center", margin: 0, color: "#c62828" }}>
                    {error}
                </p>
            </div>
        );
    }

    if (rankedIssues.length === 0) {
        return null;
    }

    return (
        <div style={rankingStyle}>
            {rankedIssues.map((item, index) => (
                <a
                    key={item.issue.issue_id}
                    href={`https://github.com/${item.issue.repository_owner}/${item.issue.repository_name}/issues/${item.issue.github_issue_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        ...rankingItemStyle,
                        borderBottom:
                            index === rankedIssues.length - 1
                                ? "none"
                                : "1px solid var(--border-color)",
                        textDecoration: "none",
                        color: "inherit",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                            "var(--hover-bg)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                >
                    <div style={rankingIconStyle}>{getRankingIcon(index)}</div>
                    <div style={issueInfoStyle}>
                        <div style={issueTitleStyle}>{item.issue.title}</div>
                        <div style={issueMetaStyle}>
                            #{item.issue.github_issue_number}
                        </div>
                    </div>
                    <div
                        style={scoreStyle}
                        title={`👍 ${item.goodVotes} | 👎 ${item.badVotes}`}
                    >
                        {item.score > 0 ? `+${item.score}` : item.score}
                    </div>
                </a>
            ))}
        </div>
    );
}
