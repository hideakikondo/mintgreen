import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createHashedPassword } from "../../lib/passwordUtils";
import { supabase } from "../../lib/supabaseClient";

export default function ProfileRegistrationPage() {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        display_name: "",
        password: "",
        password_confirmation: "",
        is_eligible: true,
    });

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const validatePassword = (password: string): boolean => {
        const passwordRegex =
            /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        return passwordRegex.test(password);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (
            !formData.display_name.trim() ||
            !formData.password.trim() ||
            !formData.password_confirmation.trim()
        ) {
            setError("必須項目を入力してください");
            return;
        }

        if (formData.password !== formData.password_confirmation) {
            setError("パスワードが一致しません");
            return;
        }

        if (!validatePassword(formData.password)) {
            setError("パスワードは英数記号を含む8文字以上で入力してください");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const { data: existingVoter } = await supabase
                .from("voters")
                .select("voter_id")
                .eq("display_name", formData.display_name.trim())
                .single();

            if (existingVoter) {
                setError("この表示名は既に登録されています");
                setSubmitting(false);
                return;
            }

            const hashedPassword = await createHashedPassword(
                formData.password.trim(),
            );

            const { error: insertError } = await supabase
                .from("voters")
                .insert({
                    display_name: formData.display_name.trim(),
                    password: hashedPassword,
                    is_eligible: true,
                });

            if (insertError) throw insertError;

            setSuccess(true);
        } catch (err) {
            console.error("プロフィール登録エラー:", err);
            setError("登録に失敗しました。もう一度お試しください。");
        } finally {
            setSubmitting(false);
        }
    };

    const inputStyle = {
        width: "100%",
        padding: "0.8em",
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
        width: "100%",
    };

    const cardStyle = {
        backgroundColor: "white",
        border: "2px solid #e0e0e0",
        borderRadius: "12px",
        padding: "2rem",
        marginBottom: "2rem",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        maxWidth: "600px",
        width: "100%",
        color: "#333",
    };

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl === "https://your-project.supabase.co") {
        console.log(
            "Supabase not configured, skipping authentication for development",
        );
        return (
            <div style={{ padding: "2rem", textAlign: "center" }}>
                <h2>開発環境</h2>
                <p>Supabaseが設定されていません</p>
            </div>
        );
    }

    if (success) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    backgroundColor: "#f5f7fa",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2rem",
                }}
            >
                <div style={cardStyle}>
                    <h1
                        style={{
                            textAlign: "center",
                            marginBottom: "2rem",
                            color: "#2e7d32",
                        }}
                    >
                        登録完了
                    </h1>
                    <p
                        style={{
                            textAlign: "center",
                            marginBottom: "2rem",
                            fontSize: "1.1em",
                        }}
                    >
                        プロフィール登録が正常に完了しました。
                    </p>
                    <p
                        style={{
                            textAlign: "center",
                            marginBottom: "2rem",
                            color: "#666",
                        }}
                    >
                        これでGitHub Issues投票に参加することができます。
                    </p>
                    <button onClick={() => navigate("/")} style={buttonStyle}>
                        ホームに戻る
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundColor: "#f5f7fa",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
            }}
        >
            <div style={cardStyle}>
                <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>
                    プロフィール登録
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

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "1rem" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "0.5rem",
                                fontWeight: "500",
                            }}
                        >
                            表示名 <span style={{ color: "#c62828" }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.display_name}
                            onChange={(e) =>
                                handleInputChange(
                                    "display_name",
                                    e.target.value,
                                )
                            }
                            style={inputStyle}
                            placeholder="山田太郎"
                            required
                        />
                    </div>

                    <div style={{ marginBottom: "1rem" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "0.5rem",
                                fontWeight: "500",
                            }}
                        >
                            パスワード{" "}
                            <span style={{ color: "#c62828" }}>*</span>
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) =>
                                handleInputChange("password", e.target.value)
                            }
                            style={inputStyle}
                            placeholder="英数記号を含む8文字以上"
                            required
                        />
                        <p
                            style={{
                                fontSize: "0.9em",
                                color: "#666",
                                margin: "0 0 1rem 0",
                            }}
                        >
                            投票時の本人確認に使用します
                        </p>
                    </div>

                    <div style={{ marginBottom: "2rem" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "0.5rem",
                                fontWeight: "500",
                            }}
                        >
                            パスワード確認{" "}
                            <span style={{ color: "#c62828" }}>*</span>
                        </label>
                        <input
                            type="password"
                            value={formData.password_confirmation}
                            onChange={(e) =>
                                handleInputChange(
                                    "password_confirmation",
                                    e.target.value,
                                )
                            }
                            style={inputStyle}
                            placeholder="パスワードを再入力してください"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            ...buttonStyle,
                            backgroundColor: submitting ? "#ccc" : "#646cff",
                            cursor: submitting ? "not-allowed" : "pointer",
                        }}
                    >
                        {submitting ? "登録中..." : "プロフィール登録"}
                    </button>
                </form>

                <button
                    onClick={() => navigate("/")}
                    style={{
                        ...buttonStyle,
                        backgroundColor: "#666",
                        marginTop: "1rem",
                    }}
                >
                    キャンセル
                </button>
            </div>
        </div>
    );
}
