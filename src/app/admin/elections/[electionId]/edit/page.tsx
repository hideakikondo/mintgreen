import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CandidateInput from "../../../../../components/admin/CandidateInput";
import ElectionForm from "../../../../../components/admin/ElectionForm";
import { supabase } from "../../../../../lib/supabaseClient.ts";
import type {
    Tables,
    TablesInsert,
    TablesUpdate,
} from "../../../../../types/supabase";

export default function EditElectionPage() {
    const { electionId } = useParams<{ electionId: string }>();
    const navigate = useNavigate();
    const [election, setElection] = useState<Tables<"elections"> | null>(null);
    const [candidates, setCandidates] = useState<Tables<"candidates">[]>([]);
    const [updatedCandidates, setUpdatedCandidates] = useState<
        TablesInsert<"candidates">[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!electionId) return;

        const fetchElectionData = async () => {
            try {
                const { data: electionData, error: electionError } =
                    await supabase
                        .from("elections")
                        .select("*")
                        .eq("election_id", electionId)
                        .single();

                if (electionError) throw electionError;

                const { data: candidatesData, error: candidatesError } =
                    await supabase
                        .from("candidates")
                        .select("*")
                        .eq("election_id", electionId);

                if (candidatesError) throw candidatesError;

                setElection(electionData);
                setCandidates(candidatesData || []);
            } catch (err) {
                console.error("データ取得エラー:", err);
                setError("選挙データの取得に失敗しました");
            } finally {
                setLoading(false);
            }
        };

        fetchElectionData();
    }, [electionId]);

    const handleElectionSubmit = async (data: TablesInsert<"elections">) => {
        if (!electionId) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const updateData: TablesUpdate<"elections"> = {
                title: data.title,
                description: data.description,
                start_date: data.start_date,
                end_date: data.end_date,
            };

            const { error: electionError } = await supabase
                .from("elections")
                .update(updateData)
                .eq("election_id", electionId);

            if (electionError) throw electionError;

            await supabase
                .from("candidates")
                .delete()
                .eq("election_id", electionId);

            if (updatedCandidates.length > 0) {
                const { error: candidatesError } = await supabase
                    .from("candidates")
                    .insert(updatedCandidates);

                if (candidatesError) throw candidatesError;
            }

            navigate("/");
        } catch (err) {
            console.error("更新エラー:", err);
            setError("選挙の更新に失敗しました。もう一度お試しください。");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCandidatesChange = (
        candidateData: TablesInsert<"candidates">[],
    ) => {
        setUpdatedCandidates(candidateData);
    };

    if (loading) {
        return <div>読み込み中...</div>;
    }

    if (!election) {
        return <div>選挙が見つかりません</div>;
    }

    const initialCandidates = candidates.map((c) => ({
        name: c.name,
        political_party: c.political_party || "",
    }));

    return (
        <div>
            <h2>選挙を編集: {election.title}</h2>

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
                <ElectionForm
                    initialData={election}
                    onSubmit={handleElectionSubmit}
                    submitLabel={isSubmitting ? "更新中..." : "選挙を更新"}
                />
            </div>

            <div style={{ marginBottom: "3rem" }}>
                <CandidateInput
                    electionId={electionId}
                    initialCandidates={initialCandidates}
                    onCandidatesChange={handleCandidatesChange}
                />
            </div>
        </div>
    );
}
