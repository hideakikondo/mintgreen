import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export default function VoterRegistrationPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        identification_number: "",
        address: "",
        date_of_birth: "",
        is_eligible: true,
    });

    useEffect(() => {
        const getSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoading(false);
        };

        getSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleInputChange = (field: string, value: string | boolean) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (
            !user ||
            !formData.name.trim() ||
            !formData.identification_number.trim()
        ) {
            setError("必須項目を入力してください");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const { data: existingVoter } = await supabase
                .from("voters")
                .select("voter_id")
                .eq(
                    "identification_number",
                    formData.identification_number.trim(),
                )
                .single();

            if (existingVoter) {
                setError("この身分証明書番号は既に登録されています");
                setSubmitting(false);
                return;
            }

            const { error: insertError } = await supabase
                .from("voters")
                .insert({
                    name: formData.name.trim(),
                    identification_number:
                        formData.identification_number.trim(),
                    address: formData.address?.trim() || null,
                    date_of_birth: formData.date_of_birth || null,
                    is_eligible: true,
                });

            if (insertError) throw insertError;

            setSuccess(true);
        } catch (err) {
            console.error("有権者登録エラー:", err);
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

    if (loading) {
        return (
            <div style={{ padding: "2rem", textAlign: "center" }}>
                <h2>読み込み中...</h2>
            </div>
        );
    }

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

    if (!user) {
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
                        有権者登録
                    </h1>
                    <h2 style={{ marginBottom: "1rem" }}>ログインが必要です</h2>
                    <p style={{ marginBottom: "2rem", color: "#666" }}>
                        有権者登録を行うには、まずGoogleアカウントでログインしてください。
                    </p>
                    <button
                        onClick={async () => {
                            await supabase.auth.signInWithOAuth({
                                provider: "google",
                                options: {
                                    redirectTo:
                                        window.location.origin + "/register",
                                },
                            });
                        }}
                        style={buttonStyle}
                    >
                        Googleでログイン
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        style={{
                            ...buttonStyle,
                            backgroundColor: "#666",
                            marginTop: "1rem",
                        }}
                    >
                        ホームに戻る
                    </button>
                </div>
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
                        有権者登録が正常に完了しました。
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
                    有権者登録
                </h1>

                <div
                    style={{
                        marginBottom: "2rem",
                        padding: "1rem",
                        backgroundColor: "#f0f8ff",
                        borderRadius: "8px",
                    }}
                >
                    <p style={{ margin: 0, color: "#666" }}>
                        ログイン中: {user.email}
                    </p>
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

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "1rem" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "0.5rem",
                                fontWeight: "500",
                            }}
                        >
                            氏名 <span style={{ color: "#c62828" }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                                handleInputChange("name", e.target.value)
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
                            身分証明書番号{" "}
                            <span style={{ color: "#c62828" }}>*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.identification_number}
                            onChange={(e) =>
                                handleInputChange(
                                    "identification_number",
                                    e.target.value,
                                )
                            }
                            style={inputStyle}
                            placeholder="運転免許証番号、マイナンバーカード番号など"
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

                    <div style={{ marginBottom: "1rem" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "0.5rem",
                                fontWeight: "500",
                            }}
                        >
                            住所（任意）
                        </label>
                        <input
                            type="text"
                            value={formData.address || ""}
                            onChange={(e) =>
                                handleInputChange("address", e.target.value)
                            }
                            style={inputStyle}
                            placeholder="東京都渋谷区..."
                        />
                    </div>

                    <div style={{ marginBottom: "2rem" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "0.5rem",
                                fontWeight: "500",
                            }}
                        >
                            生年月日（任意）
                        </label>
                        <input
                            type="date"
                            value={formData.date_of_birth || ""}
                            onChange={(e) =>
                                handleInputChange(
                                    "date_of_birth",
                                    e.target.value,
                                )
                            }
                            style={inputStyle}
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
                        {submitting ? "登録中..." : "有権者登録"}
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
