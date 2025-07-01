import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import type { Tables } from "../../types/supabase";

interface CustomTooltipProps {
    content: string;
    children: React.ReactNode;
    delay?: number;
}

function CustomTooltip({ content, children, delay = 300 }: CustomTooltipProps) {
    const [showTooltip, setShowTooltip] = useState(false);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        const id = setTimeout(() => {
            setShowTooltip(true);
        }, delay);
        setTimeoutId(id);
    };

    const handleMouseLeave = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            setTimeoutId(null);
        }
        setShowTooltip(false);
    };

    return (
        <div
            style={{ position: "relative", display: "inline-block" }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            {showTooltip && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: "#333",
                        color: "white",
                        padding: "0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        whiteSpace: "nowrap",
                        zIndex: 1000,
                        marginBottom: "0.25rem",
                    }}
                >
                    {content}
                    <div
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: 0,
                            height: 0,
                            borderLeft: "5px solid transparent",
                            borderRight: "5px solid transparent",
                            borderTop: "5px solid #333",
                        }}
                    />
                </div>
            )}
        </div>
    );
}

interface IssueWithVotes {
    issue: Tables<"github_issues">;
    goodVotes: number;
    badVotes: number;
    totalGoodCount: number;
    totalBadCount: number;
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

        const interval = setInterval(() => {
            fetchRankedIssues();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const fetchRankedIssues = async () => {
        try {
            setLoading(true);
            setError(null);

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
            for (const issue of allIssuesData || []) {
                const voteCounts = voteCountsMap[issue.issue_id] || {
                    good: 0,
                    bad: 0,
                };

                const totalGoodCount =
                    voteCounts.good + (issue.plus_one_count || 0);
                const totalBadCount =
                    voteCounts.bad + (issue.minus_one_count || 0);
                const score = totalGoodCount - totalBadCount;

                issuesWithVotes.push({
                    issue,
                    goodVotes: voteCounts.good,
                    badVotes: voteCounts.bad,
                    totalGoodCount,
                    totalBadCount,
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
        backgroundColor: "white",
        border: "2px solid #e0e0e0",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "2rem",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        color: "#333",
        maxWidth: "600px",
        width: "100%",
    };

    const rankingItemStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.75rem 0",
        borderBottom: "1px solid #f0f0f0",
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
        color: "#666",
    };

    const scoreStyle: React.CSSProperties = {
        backgroundColor: "#f8f9fa",
        padding: "0.25rem 0.5rem",
        borderRadius: "4px",
        fontSize: "0.8rem",
        fontWeight: "500",
        color: "#333",
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
            <h3
                style={{
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    color: "#333",
                    marginBottom: "1rem",
                    textAlign: "center",
                    marginTop: 0,
                }}
            >
                上位のマニファスト提案
            </h3>
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
                                : "1px solid #f0f0f0",
                        textDecoration: "none",
                        color: "inherit",
                        cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f8f9fa";
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
                    <CustomTooltip
                        content={`👍 ${item.totalGoodCount} 👎 ${item.totalBadCount}`}
                    >
                        <div style={scoreStyle}>
                            {item.score > 0 ? `+${item.score}` : item.score}
                        </div>
                    </CustomTooltip>
                </a>
            ))}
        </div>
    );
}
