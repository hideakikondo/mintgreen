import { useState } from "react";
import type { TablesInsert } from "../../types/supabase";

interface CandidateData {
    name: string;
    political_party: string;
}

interface CandidateInputProps {
    electionId?: string;
    initialCandidates?: CandidateData[];
    onCandidatesChange: (candidates: TablesInsert<"candidates">[]) => void;
}

export default function CandidateInput({
    electionId = "",
    initialCandidates = [],
    onCandidatesChange,
}: CandidateInputProps) {
    const [candidates, setCandidates] = useState<CandidateData[]>(
        initialCandidates.length > 0
            ? initialCandidates
            : [{ name: "", political_party: "" }],
    );

    const updateCandidates = (newCandidates: CandidateData[]) => {
        setCandidates(newCandidates);
        const candidatesForSubmit = newCandidates
            .filter((c) => c.name.trim() !== "")
            .map((c) => ({
                election_id: electionId,
                name: c.name,
                political_party: c.political_party || null,
            }));
        onCandidatesChange(candidatesForSubmit);
    };

    const addCandidate = () => {
        updateCandidates([...candidates, { name: "", political_party: "" }]);
    };

    const removeCandidate = (index: number) => {
        if (candidates.length > 1) {
            updateCandidates(candidates.filter((_, i) => i !== index));
        }
    };

    const updateCandidate = (
        index: number,
        field: keyof CandidateData,
        value: string,
    ) => {
        const updated = candidates.map((candidate, i) =>
            i === index ? { ...candidate, [field]: value } : candidate,
        );
        updateCandidates(updated);
    };

    const inputStyle = {
        padding: "0.6em",
        borderRadius: "8px",
        border: "1px solid #ccc",
        fontSize: "1em",
        marginRight: "0.5rem",
        flex: "1",
    };

    const buttonStyle = {
        padding: "0.6em 1em",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        fontSize: "1em",
    };

    return (
        <div style={{ maxWidth: "600px" }}>
            <h3>候補者情報</h3>

            {candidates.map((candidate, index) => (
                <div
                    key={index}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "1rem",
                        padding: "1rem",
                        backgroundColor: "#f9f9f9",
                        borderRadius: "8px",
                    }}
                >
                    <div style={{ flex: "1", marginRight: "1rem" }}>
                        <input
                            type="text"
                            placeholder="候補者名 *"
                            value={candidate.name}
                            onChange={(e) =>
                                updateCandidate(index, "name", e.target.value)
                            }
                            style={{
                                ...inputStyle,
                                marginBottom: "0.5rem",
                                marginRight: "0",
                            }}
                        />
                        <input
                            type="text"
                            placeholder="政党・所属（任意）"
                            value={candidate.political_party}
                            onChange={(e) =>
                                updateCandidate(
                                    index,
                                    "political_party",
                                    e.target.value,
                                )
                            }
                            style={{ ...inputStyle, marginRight: "0" }}
                        />
                    </div>

                    {candidates.length > 1 && (
                        <button
                            type="button"
                            onClick={() => removeCandidate(index)}
                            style={{
                                ...buttonStyle,
                                backgroundColor: "#ff4444",
                                color: "white",
                            }}
                        >
                            削除
                        </button>
                    )}
                </div>
            ))}

            <button
                type="button"
                onClick={addCandidate}
                style={{
                    ...buttonStyle,
                    backgroundColor: "#4CAF50",
                    color: "white",
                    marginTop: "1rem",
                }}
            >
                候補者を追加
            </button>
        </div>
    );
}
