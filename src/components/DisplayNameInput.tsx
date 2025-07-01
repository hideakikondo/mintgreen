import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

interface DisplayNameInputProps {
    onComplete: () => void;
}

export default function DisplayNameInput({
    onComplete,
}: DisplayNameInputProps) {
    const { setDisplayName, logout } = useAuth();
    const [displayName, setDisplayNameValue] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayName.trim()) {
            setError("表示名を入力してください");
            return;
        }

        if (submitting) return; // 重複送信防止

        setSubmitting(true);
        setError(null);

        try {
            console.log("表示名設定開始:", displayName.trim());

            // タイムアウト機能付きで実行
            const timeoutPromise = new Promise<{
                success: boolean;
                error?: string;
            }>((_, reject) => {
                setTimeout(
                    () =>
                        reject(new Error("処理がタイムアウトしました（30秒）")),
                    30000,
                );
            });

            const result = await Promise.race([
                setDisplayName(displayName.trim()),
                timeoutPromise,
            ]);

            console.log("表示名設定結果:", result);

            if (result.success) {
                console.log("表示名設定成功、onComplete呼び出し");
                onComplete();
            } else {
                setError(result.error || "表示名の設定に失敗しました");
            }
        } catch (err) {
            console.error("表示名設定でキャッチされたエラー:", err);
            setError("予期しないエラーが発生しました");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async () => {
        if (submitting) return; // 送信中はキャンセル不可

        try {
            console.log("表示名設定をキャンセル、ログアウト処理開始");
            await logout();
            console.log("ログアウト完了");
        } catch (err) {
            console.error("ログアウトエラー:", err);
        }
    };

    const inputStyle = {
        width: "100%",
        maxWidth: "400px",
        padding: "0.8em",
        borderRadius: "8px",
        border: "1px solid #ccc",
        fontSize: "1em",
        marginBottom: "1rem",
        boxSizing: "border-box" as const,
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
        flex: 1,
    };

    const cancelButtonStyle = {
        backgroundColor: "#666",
        color: "white",
        border: "none",
        padding: "0.8em 2em",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "1em",
        fontWeight: "500",
        flex: 1,
    };

    const modalStyle = {
        backgroundColor: "white",
        border: "2px solid #e0e0e0",
        borderRadius: "12px",
        padding: "2rem",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        color: "#333",
        maxWidth: "500px",
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
                        disabled={submitting}
                    />
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                ...buttonStyle,
                                backgroundColor: submitting
                                    ? "#ccc"
                                    : "#5FBEAA",
                                cursor: submitting ? "not-allowed" : "pointer",
                            }}
                        >
                            {submitting ? "設定中..." : "設定する"}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={submitting}
                            style={{
                                ...cancelButtonStyle,
                                backgroundColor: submitting ? "#ccc" : "#666",
                                cursor: submitting ? "not-allowed" : "pointer",
                            }}
                        >
                            キャンセル
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
