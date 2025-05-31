import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../../../lib/supabaseClient";
import type { Tables } from "../../../../types/supabase";

interface ElectionWithCandidates {
    election: Tables<"elections">;
    candidates: Tables<"candidates">[];
}

export default function AllElectionsPage() {
    const [elections, setElections] = useState<ElectionWithCandidates[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAllElections();
    }, []);

    const fetchAllElections = async () => {
        try {
            const { data: electionsData, error: electionsError } =
                await supabase
                    .from("elections")
                    .select("*")
                    .order("start_date", { ascending: false });

            if (electionsError) throw electionsError;

            const electionsWithCandidates: ElectionWithCandidates[] = [];

            for (const election of electionsData || []) {
                const { data: candidates, error: candidatesError } =
                    await supabase
                        .from("candidates")
                        .select("*")
                        .eq("election_id", election.election_id);

                if (candidatesError) throw candidatesError;

                electionsWithCandidates.push({
                    election,
                    candidates: candidates || [],
                });
            }

            setElections(electionsWithCandidates);
        } catch (err) {
            console.error("選挙データ取得エラー:", err);
            setError("選挙データの取得に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    const getElectionStatus = (election: Tables<"elections">) => {
        const now = new Date();
        const startDate = new Date(election.start_date);
        const endDate = new Date(election.end_date);

        if (now < startDate) {
            return { status: "予定", color: "#666" };
        } else if (now >= startDate && now <= endDate) {
            return { status: "開催中", color: "#2e7d32" };
        } else {
            return { status: "終了", color: "#c62828" };
        }
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

    const buttonStyle = {
        backgroundColor: "#646cff",
        color: "white",
        border: "none",
        padding: "0.5em 1em",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "0.9em",
        fontWeight: "500",
        textDecoration: "none",
        display: "inline-block",
        marginRight: "0.5rem",
    };

    if (loading) {
        return (
            <div style={{ padding: "2rem", textAlign: "center" }}>
                <h2>読み込み中...</h2>
            </div>
        );
    }

    return (
        <div>
            <h2 style={{ marginBottom: "2rem" }}>作成済みの選挙一覧</h2>

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

            {elections.length === 0 ? (
                <div style={cardStyle}>
                    <h3>選挙がまだ作成されていません</h3>
                    <p style={{ color: "#666", marginBottom: "1rem" }}>
                        新しい選挙を作成してください
                    </p>
                    <Link to="/admin/elections/new" style={buttonStyle}>
                        新しい選挙を作成
                    </Link>
                </div>
            ) : (
                elections.map(({ election, candidates }) => {
                    const { status, color } = getElectionStatus(election);
                    return (
                        <div key={election.election_id} style={cardStyle}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    marginBottom: "1rem",
                                }}
                            >
                                <div>
                                    <h3 style={{ marginBottom: "0.5rem" }}>
                                        {election.title}
                                    </h3>
                                    <span
                                        style={{
                                            backgroundColor: color,
                                            color:
                                                color === "#666"
                                                    ? "#333"
                                                    : "white",
                                            padding: "0.2em 0.6em",
                                            borderRadius: "12px",
                                            fontSize: "0.8em",
                                            fontWeight: "500",
                                        }}
                                    >
                                        {status}
                                    </span>
                                </div>
                                <Link
                                    to={`/admin/elections/${election.election_id}/edit`}
                                    style={buttonStyle}
                                >
                                    編集
                                </Link>
                            </div>

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

                            <div
                                style={{
                                    fontSize: "0.9em",
                                    color: "#888",
                                    marginBottom: "1rem",
                                }}
                            >
                                <div>
                                    開始日時:{" "}
                                    {new Date(
                                        election.start_date,
                                    ).toLocaleString()}
                                </div>
                                <div>
                                    終了日時:{" "}
                                    {new Date(
                                        election.end_date,
                                    ).toLocaleString()}
                                </div>
                            </div>

                            <div>
                                <h4 style={{ marginBottom: "0.5rem" }}>
                                    候補者 ({candidates.length}人)
                                </h4>
                                {candidates.length === 0 ? (
                                    <p
                                        style={{
                                            color: "#666",
                                            fontSize: "0.9em",
                                        }}
                                    >
                                        候補者が登録されていません
                                    </p>
                                ) : (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: "0.5rem",
                                        }}
                                    >
                                        {candidates.map((candidate) => (
                                            <span
                                                key={candidate.candidate_id}
                                                style={{
                                                    backgroundColor: "#f5f5f5",
                                                    color: "#333",
                                                    padding: "0.3em 0.6em",
                                                    borderRadius: "6px",
                                                    fontSize: "0.9em",
                                                    border: "1px solid #ddd",
                                                }}
                                            >
                                                {candidate.name}
                                                {candidate.political_party && (
                                                    <span
                                                        style={{
                                                            color: "#666",
                                                            fontSize: "0.8em",
                                                        }}
                                                    >
                                                        {" "}
                                                        (
                                                        {
                                                            candidate.political_party
                                                        }
                                                        )
                                                    </span>
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}
