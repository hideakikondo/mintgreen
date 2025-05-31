import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CandidateInput from "../../../../components/admin/CandidateInput";
import ElectionForm from "../../../../components/admin/ElectionForm";
import { supabase } from "../../../../lib/supabaseClient.ts";
import type { TablesInsert } from "../../../../types/supabase";

export default function NewElectionPage() {
    const navigate = useNavigate();
    const [electionData, setElectionData] =
        useState<TablesInsert<"elections"> | null>(null);
    const [candidates, setCandidates] = useState<TablesInsert<"candidates">[]>(
        [],
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleElectionSubmit = (data: TablesInsert<"elections">) => {
        setElectionData(data);
    };

    const handleCandidatesChange = (
        candidateData: TablesInsert<"candidates">[],
    ) => {
        setCandidates(candidateData);
    };

    const handleFinalSubmit = async () => {
        if (!electionData) {
            setError("選挙情報を入力してください");
            return;
        }

        if (candidates.length === 0) {
            setError("少なくとも1人の候補者を追加してください");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const { data: election, error: electionError } = await supabase
                .from("elections")
                .insert(electionData)
                .select()
                .single();

            if (electionError) throw electionError;

            const candidatesWithElectionId = candidates.map((candidate) => ({
                ...candidate,
                election_id: election.election_id,
            }));

            const { error: candidatesError } = await supabase
                .from("candidates")
                .insert(candidatesWithElectionId);

            if (candidatesError) throw candidatesError;

            navigate("/");
        } catch (err) {
            console.error("選挙作成エラー:", err);
            setError("選挙の作成に失敗しました。もう一度お試しください。");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <h2>新しい選挙を作成</h2>

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

            <div style={{ marginBottom: "3rem" }}>
                <ElectionForm onSubmit={handleElectionSubmit} />
            </div>

            <div style={{ marginBottom: "3rem" }}>
                <CandidateInput onCandidatesChange={handleCandidatesChange} />
            </div>

            <button
                onClick={handleFinalSubmit}
                disabled={
                    isSubmitting || !electionData || candidates.length === 0
                }
                style={{
                    backgroundColor: isSubmitting ? "#ccc" : "#646cff",
                    color: "white",
                    border: "none",
                    padding: "1em 2em",
                    borderRadius: "8px",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    fontSize: "1.1em",
                    fontWeight: "500",
                }}
            >
                {isSubmitting ? "作成中..." : "選挙を作成"}
            </button>
        </div>
    );
}
