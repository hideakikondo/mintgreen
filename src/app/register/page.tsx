import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DisplayNameInput from "../../components/DisplayNameInput";
import { useAuth } from "../../contexts/AuthContext";

export default function ProfileRegistrationPage() {
    const navigate = useNavigate();
    const { signInWithGoogle, isAuthenticated, needsDisplayName, loading } =
        useAuth();
    const [error, setError] = useState<string | null>(null);
    const [loggingIn, setLoggingIn] = useState(false);

    const handleGoogleSignIn = async () => {
        setLoggingIn(true);
        setError(null);

        const result = await signInWithGoogle();

        if (!result.success) {
            setError(result.error || "Google認証に失敗しました");
        }

        setLoggingIn(false);
    };

    const handleDisplayNameComplete = () => {
        navigate("/");
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
                    <div style={{ textAlign: "center" }}>
                        <div className="spinner"></div>
                        <h2 style={{ margin: 0 }}>読み込み中...</h2>
                    </div>
                </div>
            </div>
        );
    }

    if (isAuthenticated && !needsDisplayName) {
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
                        既に登録済みです。
                    </p>
                    <p
                        style={{
                            textAlign: "center",
                            marginBottom: "2rem",
                            color: "#666",
                        }}
                    >
                        GitHub Issues投票に参加することができます。
                    </p>
                    <button onClick={() => navigate("/")} style={buttonStyle}>
                        ホームに戻る
                    </button>
                </div>
            </div>
        );
    }

    if (needsDisplayName) {
        return <DisplayNameInput onComplete={handleDisplayNameComplete} />;
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
                    アカウント登録
                </h1>

                <p
                    style={{
                        textAlign: "center",
                        marginBottom: "2rem",
                        color: "#666",
                        fontSize: "1em",
                    }}
                >
                    Googleアカウントでログインして投票に参加しましょう
                </p>

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

                <button
                    onClick={handleGoogleSignIn}
                    disabled={loggingIn}
                    style={{
                        ...buttonStyle,
                        backgroundColor: loggingIn ? "#ccc" : "#4285f4",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        cursor: loggingIn ? "not-allowed" : "pointer",
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path
                            fill="white"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="white"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="white"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="white"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    {loggingIn ? "認証中..." : "Googleでログイン"}
                </button>

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
