import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import type { Tables } from "../../types/supabase";

interface ElectionWithCandidates {
    election: Tables<"elections">;
    candidates: Tables<"candidates">[];
}

export default function VotePageComponent() {
    const [ongoingElections, setOngoingElections] = useState<
        ElectionWithCandidates[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [voterIdNumber, setVoterIdNumber] = useState("");
    const [voter, setVoter] = useState<Tables<"voters"> | null>(null);
    const [selectedVotes, setSelectedVotes] = useState<Record<string, string>>(
        {},
    );
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchOngoingElections();
    }, []);

    const fetchOngoingElections = async () => {
        try {
            const now = new Date().toISOString();

            const { data: elections, error: electionsError } = await supabase
                .from("elections")
                .select("*")
                .lte("start_date", now)
                .gte("end_date", now);

            if (electionsError) throw electionsError;

            const electionsWithCandidates: ElectionWithCandidates[] = [];

            for (const election of elections || []) {
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

            setOngoingElections(electionsWithCandidates);
        } catch (err) {
            console.error("選挙データ取得エラー:", err);
            setError("選挙データの取得に失敗しました");
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

    const handleCandidateSelect = (electionId: string, candidateId: string) => {
        setSelectedVotes((prev) => ({
            ...prev,
            [electionId]: candidateId,
        }));
    };

    const handleVoteSubmit = async () => {
        if (!voter || Object.keys(selectedVotes).length === 0) return;

        setSubmitting(true);
        setError(null);
        setSubmitSuccess(null);

        try {
            for (const [electionId, candidateId] of Object.entries(
                selectedVotes,
            )) {
                const { data: existingVote } = await supabase
                    .from("votes")
                    .select("vote_id")
                    .eq("voter_id", voter.voter_id)
                    .eq("election_id", electionId)
                    .single();

                if (existingVote) {
                    setError(
                        `選挙「${ongoingElections.find((e) => e.election.election_id === electionId)?.election.title}」には既に投票済みです`,
                    );
                    setSubmitting(false);
                    return;
                }

                const { error: voteError } = await supabase
                    .from("votes")
                    .insert({
                        voter_id: voter.voter_id,
                        election_id: electionId,
                        candidate_id: candidateId,
                        timestamp: new Date().toISOString(),
                        is_valid: true,
                    });

                if (voteError) throw voteError;
            }

            setSubmitSuccess("投票が正常に完了しました");
            setSelectedVotes({});
        } catch (err) {
            console.error("投票エラー:", err);
            setError("投票の送信に失敗しました");
        } finally {
            setSubmitting(false);
        }
    };

    const inputStyle = {
        width: "100%",
        padding: "0.6em",
        borderRadius: "8px",
        border: "1px solid #ccc",
        fontSize: "1em",
        marginBottom: "1rem",
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

    const candidateCardStyle = {
        backgroundColor: "#f9f9f9",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "1rem",
        marginBottom: "0.5rem",
        cursor: "pointer",
        transition: "all 0.2s ease",
    };

    const selectedCandidateCardStyle = {
        ...candidateCardStyle,
        backgroundColor: "#f0f8ff",
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
                    投票画面
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

                {!voter ? (
                    <div style={cardStyle}>
                        <h2 style={{ marginBottom: "1rem" }}>投票者確認</h2>
                        <p style={{ marginBottom: "1rem", color: "#666" }}>
                            投票するには、投票者IDを入力してください
                        </p>
                        <form onSubmit={handleVoterIdSubmit}>
                            <input
                                type="text"
                                placeholder="投票者ID（身分証明書番号）"
                                value={voterIdNumber}
                                onChange={(e) =>
                                    setVoterIdNumber(e.target.value)
                                }
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
                        <div style={cardStyle}>
                            <h2 style={{ marginBottom: "0.5rem" }}>
                                投票者情報
                            </h2>
                            <p style={{ color: "#666", marginBottom: "0" }}>
                                {voter.name} さん、こんにちは
                            </p>
                        </div>

                        {ongoingElections.length === 0 ? (
                            <div style={cardStyle}>
                                <h2>現在開催中の選挙はありません</h2>
                                <p style={{ color: "#666" }}>
                                    投票可能な選挙が開始されるまでお待ちください
                                </p>
                            </div>
                        ) : (
                            <>
                                {ongoingElections.map(
                                    ({ election, candidates }) => (
                                        <div
                                            key={election.election_id}
                                            style={cardStyle}
                                        >
                                            <h2
                                                style={{
                                                    marginBottom: "0.5rem",
                                                }}
                                            >
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

                                            <h3
                                                style={{
                                                    marginBottom: "1rem",
                                                }}
                                            >
                                                候補者を選択してください
                                            </h3>

                                            {candidates.map((candidate) => (
                                                <div
                                                    key={candidate.candidate_id}
                                                    style={
                                                        selectedVotes[
                                                            election.election_id
                                                        ] ===
                                                        candidate.candidate_id
                                                            ? selectedCandidateCardStyle
                                                            : candidateCardStyle
                                                    }
                                                    onClick={() =>
                                                        handleCandidateSelect(
                                                            election.election_id,
                                                            candidate.candidate_id,
                                                        )
                                                    }
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                        }}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`election-${election.election_id}`}
                                                            checked={
                                                                selectedVotes[
                                                                    election
                                                                        .election_id
                                                                ] ===
                                                                candidate.candidate_id
                                                            }
                                                            onChange={() =>
                                                                handleCandidateSelect(
                                                                    election.election_id,
                                                                    candidate.candidate_id,
                                                                )
                                                            }
                                                            style={{
                                                                marginRight:
                                                                    "0.5rem",
                                                            }}
                                                        />
                                                        <div>
                                                            <div
                                                                style={{
                                                                    fontWeight:
                                                                        "500",
                                                                    fontSize:
                                                                        "1.1em",
                                                                }}
                                                            >
                                                                {candidate.name}
                                                            </div>
                                                            {candidate.political_party && (
                                                                <div
                                                                    style={{
                                                                        color: "#666",
                                                                        fontSize:
                                                                            "0.9em",
                                                                    }}
                                                                >
                                                                    {
                                                                        candidate.political_party
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ),
                                )}

                                {Object.keys(selectedVotes).length > 0 && (
                                    <div
                                        style={{
                                            textAlign: "center",
                                            marginTop: "2rem",
                                        }}
                                    >
                                        <button
                                            onClick={handleVoteSubmit}
                                            disabled={submitting}
                                            style={{
                                                ...buttonStyle,
                                                backgroundColor: submitting
                                                    ? "#ccc"
                                                    : "#646cff",
                                                cursor: submitting
                                                    ? "not-allowed"
                                                    : "pointer",
                                                fontSize: "1.1em",
                                                padding: "1em 3em",
                                            }}
                                        >
                                            {submitting
                                                ? "投票中..."
                                                : "投票する"}
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
