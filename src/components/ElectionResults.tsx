import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Tables } from "../types/supabase";

interface ElectionResult {
    election: Tables<"elections">;
    results: {
        candidate: Tables<"candidates">;
        voteCount: number;
        percentage: number;
    }[];
    totalValidVotes: number;
    totalInvalidVotes: number;
}

export default function ElectionResults() {
    const [completedElections, setCompletedElections] = useState<
        ElectionResult[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCompletedElections();
    }, []);

    const fetchCompletedElections = async () => {
        try {
            const now = new Date().toISOString();

            const { data: elections, error: electionsError } = await supabase
                .from("elections")
                .select("*")
                .lt("end_date", now)
                .order("end_date", { ascending: false });

            if (electionsError) throw electionsError;

            const electionResults: ElectionResult[] = [];

            for (const election of elections || []) {
                const { data: candidates, error: candidatesError } =
                    await supabase
                        .from("candidates")
                        .select("*")
                        .eq("election_id", election.election_id);

                if (candidatesError) throw candidatesError;

                const { data: votes, error: votesError } = await supabase
                    .from("votes")
                    .select("candidate_id, is_valid")
                    .eq("election_id", election.election_id);

                if (votesError) throw votesError;

                const voteCounts: Record<string, number> = {};
                let totalValidVotes = 0;
                let totalInvalidVotes = 0;

                for (const vote of votes || []) {
                    if (vote.is_valid) {
                        voteCounts[vote.candidate_id] =
                            (voteCounts[vote.candidate_id] || 0) + 1;
                        totalValidVotes++;
                    } else {
                        totalInvalidVotes++;
                    }
                }

                const results = (candidates || [])
                    .map((candidate: any) => ({
                        candidate,
                        voteCount: voteCounts[candidate.candidate_id] || 0,
                        percentage:
                            totalValidVotes > 0
                                ? ((voteCounts[candidate.candidate_id] || 0) /
                                      totalValidVotes) *
                                  100
                                : 0,
                    }))
                    .sort((a: any, b: any) => b.voteCount - a.voteCount);

                electionResults.push({
                    election,
                    results,
                    totalValidVotes,
                    totalInvalidVotes,
                });
            }

            setCompletedElections(electionResults);
        } catch (err) {
            console.error("選挙結果取得エラー:", err);
            setError("選挙結果の取得に失敗しました");
        } finally {
            setLoading(false);
        }
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

    const candidateRowStyle = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.75rem",
        marginBottom: "0.5rem",
        backgroundColor: "#f9f9f9",
        borderRadius: "8px",
        border: "1px solid #ddd",
    };

    const winnerRowStyle = {
        ...candidateRowStyle,
        backgroundColor: "#f0f8ff",
        borderColor: "#646cff",
        fontWeight: "600",
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
                    選挙結果
                </h1>

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

                {completedElections.length === 0 ? (
                    <div style={cardStyle}>
                        <h2>終了した選挙はありません</h2>
                        <p style={{ color: "#666" }}>
                            選挙が終了すると、ここに結果が表示されます
                        </p>
                    </div>
                ) : (
                    completedElections.map(
                        ({
                            election,
                            results,
                            totalValidVotes,
                            totalInvalidVotes,
                        }) => (
                            <div key={election.election_id} style={cardStyle}>
                                <h2 style={{ marginBottom: "0.5rem" }}>
                                    {election.title}
                                </h2>
                                {election.description && (
                                    <p
                                        style={{
                                            color: "#666",
                                            marginBottom: "1rem",
                                        }}
                                    >
                                        {election.description}
                                    </p>
                                )}
                                <p
                                    style={{
                                        fontSize: "0.9em",
                                        color: "#888",
                                        marginBottom: "1.5rem",
                                    }}
                                >
                                    投票期間:{" "}
                                    {new Date(
                                        election.start_date,
                                    ).toLocaleString()}{" "}
                                    〜{" "}
                                    {new Date(
                                        election.end_date,
                                    ).toLocaleString()}
                                </p>

                                <div style={{ marginBottom: "1rem" }}>
                                    <h3 style={{ marginBottom: "1rem" }}>
                                        結果
                                    </h3>
                                    {results.map((result, index) => (
                                        <div
                                            key={result.candidate.candidate_id}
                                            style={
                                                index === 0 &&
                                                result.voteCount > 0
                                                    ? winnerRowStyle
                                                    : candidateRowStyle
                                            }
                                        >
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: "1.1em",
                                                    }}
                                                >
                                                    {index === 0 &&
                                                        result.voteCount > 0 &&
                                                        "🏆 "}
                                                    {result.candidate.name}
                                                </div>
                                                {result.candidate
                                                    .political_party && (
                                                    <div
                                                        style={{
                                                            color: "#666",
                                                            fontSize: "0.9em",
                                                        }}
                                                    >
                                                        {
                                                            result.candidate
                                                                .political_party
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <div
                                                    style={{
                                                        fontSize: "1.1em",
                                                        fontWeight: "500",
                                                    }}
                                                >
                                                    {result.voteCount} 票
                                                </div>
                                                <div
                                                    style={{
                                                        color: "#666",
                                                        fontSize: "0.9em",
                                                    }}
                                                >
                                                    {result.percentage.toFixed(
                                                        1,
                                                    )}
                                                    %
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div
                                    style={{
                                        fontSize: "0.9em",
                                        color: "#666",
                                        borderTop: "1px solid #eee",
                                        paddingTop: "1rem",
                                    }}
                                >
                                    <p>
                                        総投票数:{" "}
                                        {totalValidVotes + totalInvalidVotes} 票
                                    </p>
                                    <p>有効投票数: {totalValidVotes} 票</p>
                                    {totalInvalidVotes > 0 && (
                                        <p>
                                            無効投票数: {totalInvalidVotes} 票
                                        </p>
                                    )}
                                </div>
                            </div>
                        ),
                    )
                )}
            </div>
        </div>
    );
}
