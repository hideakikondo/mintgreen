import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

interface DisplayNameInputProps {
    onComplete: () => void;
}

export default function DisplayNameInput({
    onComplete,
}: DisplayNameInputProps) {
    const { setDisplayName } = useAuth();
    const [displayName, setDisplayNameValue] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayName.trim()) {
            setError("表示名を入力してください");
            return;
        }

        setSubmitting(true);
        setError(null);

        const result = await setDisplayName(displayName.trim());

        if (result.success) {
            onComplete();
        } else {
            setError(result.error || "表示名の設定に失敗しました");
        }

        setSubmitting(false);
    };

    const inputStyle = {
        width: "280px",
        padding: "0.8em",
        borderRadius: "8px",
        border: "1px solid #ccc",
        fontSize: "1em",
        marginBottom: "1rem",
    };

    const buttonStyle = {
        backgroundColor: "#5FBEAA",
        color: "white",
        border: "none",
        padding: "0.8em 2em",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "1em",
        fontWeight: "500",
        width: "100%",
    };

    const modalStyle = {
        backgroundColor: "white",
        border: "2px solid #e0e0e0",
        borderRadius: "12px",
        padding: "2rem",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        color: "#333",
        maxWidth: "400px",
        width: "90%",
        maxHeight: "90vh",
        overflow: "auto",
    };

    const overlayStyle = {
        position: "fixed" as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <h2
                    style={{
                        marginBottom: "1rem",
                        textAlign: "center",
                    }}
                >
                    表示名を設定してください
                </h2>
                <p
                    style={{
                        marginBottom: "1.5rem",
                        textAlign: "center",
                        color: "#666",
                        fontSize: "0.9em",
                    }}
                >
                    投票時に表示される名前を入力してください
                </p>
                {error && (
                    <div
                        style={{
                            backgroundColor: "#ffebee",
                            color: "#c62828",
                            padding: "1rem",
                            borderRadius: "8px",
                            marginBottom: "1rem",
                        }}
                    >
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="表示名"
                        value={displayName}
                        onChange={(e) => setDisplayNameValue(e.target.value)}
                        style={inputStyle}
                        required
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            ...buttonStyle,
                            backgroundColor: submitting ? "#ccc" : "#5FBEAA",
                            cursor: submitting ? "not-allowed" : "pointer",
                        }}
                    >
                        {submitting ? "設定中..." : "設定する"}
                    </button>
                </form>
            </div>
        </div>
    );
}
