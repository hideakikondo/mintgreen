import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function View() {
    const navigate = useNavigate();
    const { isAuthenticated, voter, login, logout, loading } = useAuth();
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [displayName, setDisplayName] = useState("");
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState<string | null>(null);
    const [loggingIn, setLoggingIn] = useState(false);

    const buttonStyle = {
        width: "300px",
        padding: "1.2em 2em",
        margin: "1rem 1rem",
        backgroundColor: "white",
        border: "2px solid #e0e0e0",
        borderRadius: "12px",
        fontSize: "1.1em",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.2s ease",
        color: "#333",
    };

    const buttonHoverStyle = {
        ...buttonStyle,
        borderColor: "#646cff",
        backgroundColor: "#f8f9ff",
    };

    const inputStyle = {
        width: "100%",
        padding: "0.6em",
        borderRadius: "8px",
        border: "1px solid #ccc",
        fontSize: "1em",
        marginBottom: "1rem",
    };

    const cardStyle = {
        backgroundColor: "white",
        border: "2px solid #e0e0e0",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "2rem",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        color: "#333",
        maxWidth: "400px",
    };

    const handleEvaluateClick = () => {
        if (isAuthenticated) {
            navigate("/issue-vote");
        } else {
            setShowLoginForm(true);
        }
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayName.trim() || !password.trim()) return;

        setLoggingIn(true);
        setLoginError(null);

        const result = await login(displayName.trim(), password.trim());

        if (result.success) {
            setShowLoginForm(false);
            setDisplayName("");
            setPassword("");
            navigate("/issue-vote");
        } else {
            setLoginError(result.error || "ログインに失敗しました");
        }

        setLoggingIn(false);
    };

    const handleLogout = () => {
        logout();
    };

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    backgroundColor: "#f5f7fa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <h2>読み込み中...</h2>
            </div>
        );
    }

    // const sectionHeadingStyle = {
    //     fontSize: "1.4em",
    //     fontWeight: "600",
    //     color: "#333",
    //     marginTop: "2rem",
    //     marginBottom: "1rem",
    //     textAlign: "center" as const,
    // };

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
            <h1
                style={{
                    fontSize: "2rem",
                    fontWeight: "600",
                    color: "#333",
                    marginBottom: "3rem",
                    textAlign: "center",
                }}
            >
                いどばたご意見板
            </h1>

            {isAuthenticated && voter && (
                <div
                    style={{
                        ...cardStyle,
                        textAlign: "center",
                        marginBottom: "2rem",
                    }}
                >
                    <p style={{ marginBottom: "1rem" }}>
                        {voter.display_name} さん、こんにちは
                    </p>
                    <button
                        onClick={handleLogout}
                        style={{
                            backgroundColor: "#666",
                            color: "white",
                            border: "none",
                            padding: "0.5em 1em",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.9em",
                        }}
                    >
                        ログアウト
                    </button>
                </div>
            )}

            {showLoginForm && !isAuthenticated && (
                <div style={cardStyle}>
                    <h2 style={{ marginBottom: "1rem", textAlign: "center" }}>
                        ログイン
                    </h2>
                    {loginError && (
                        <div
                            style={{
                                backgroundColor: "#ffebee",
                                color: "#c62828",
                                padding: "1rem",
                                borderRadius: "8px",
                                marginBottom: "1rem",
                            }}
                        >
                            {loginError}
                        </div>
                    )}
                    <form onSubmit={handleLoginSubmit}>
                        <input
                            type="text"
                            placeholder="表示名"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            style={inputStyle}
                            required
                        />
                        <input
                            type="password"
                            placeholder="パスワード"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={inputStyle}
                            required
                        />
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                                type="submit"
                                disabled={loggingIn}
                                style={{
                                    backgroundColor: loggingIn
                                        ? "#ccc"
                                        : "#646cff",
                                    color: "white",
                                    border: "none",
                                    padding: "0.8em 1em",
                                    borderRadius: "8px",
                                    cursor: loggingIn
                                        ? "not-allowed"
                                        : "pointer",
                                    fontSize: "1em",
                                    flex: 1,
                                }}
                            >
                                {loggingIn ? "ログイン中..." : "ログイン"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowLoginForm(false)}
                                style={{
                                    backgroundColor: "#666",
                                    color: "white",
                                    border: "none",
                                    padding: "0.8em 1em",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontSize: "1em",
                                }}
                            >
                                キャンセル
                            </button>
                        </div>
                    </form>
                    <div style={{ textAlign: "center", marginTop: "1rem" }}>
                        <button
                            onClick={() => {
                                setShowLoginForm(false);
                                navigate("/register");
                            }}
                            style={{
                                background: "none",
                                border: "none",
                                color: "#646cff",
                                cursor: "pointer",
                                textDecoration: "underline",
                                fontSize: "0.9em",
                            }}
                        >
                            アカウントをお持ちでない方はこちら
                        </button>
                    </div>
                </div>
            )}

            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "2rem",
                    width: "100%",
                    maxWidth: "800px",
                    flexWrap: "wrap",
                }}
            >
                <button
                    style={buttonStyle}
                    onClick={handleEvaluateClick}
                    onMouseEnter={(e) => {
                        Object.assign(
                            (e.target as HTMLElement).style,
                            buttonHoverStyle,
                        );
                    }}
                    onMouseLeave={(e) => {
                        Object.assign(
                            (e.target as HTMLElement).style,
                            buttonStyle,
                        );
                    }}
                >
                    変更案を評価
                </button>

                <button
                    style={buttonStyle}
                    onClick={() => navigate("/issues")}
                    onMouseEnter={(e) => {
                        Object.assign(
                            (e.target as HTMLElement).style,
                            buttonHoverStyle,
                        );
                    }}
                    onMouseLeave={(e) => {
                        Object.assign(
                            (e.target as HTMLElement).style,
                            buttonStyle,
                        );
                    }}
                >
                    変更案一覧
                </button>
            </div>

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    marginTop: "2rem",
                }}
            >
                <a
                    href="https://x.com/mirai_manifesto"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="マニフェスト反映の実績はこちら"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.8rem 1.2rem",
                        backgroundColor: "#000000",
                        color: "white",
                        textDecoration: "none",
                        borderRadius: "8px",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                        transition: "all 0.2s ease",
                        border: "none",
                        cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                        (e.target as HTMLElement).style.backgroundColor =
                            "#333333";
                    }}
                    onMouseLeave={(e) => {
                        (e.target as HTMLElement).style.backgroundColor =
                            "#000000";
                    }}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    マニフェスト反映の実績はこちら
                </a>
            </div>

            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "2rem",
                    width: "100%",
                    maxWidth: "800px",
                    flexWrap: "wrap",
                }}
            >
                {/* <h2 style={sectionHeadingStyle}></h2>
                <button
                    style={buttonStyle}
                    onClick={() => navigate("/register")}
                    onMouseEnter={(e) => {
                        Object.assign(
                            (e.target as HTMLElement).style,
                            buttonHoverStyle,
                        );
                    }}
                    onMouseLeave={(e) => {
                        Object.assign(
                            (e.target as HTMLElement).style,
                            buttonStyle,
                        );
                    }}
                >
                    ログイン
                </button> */}

                {/* <button
                    style={buttonStyle}
                    onClick={() => navigate("/results")}
                    onMouseEnter={(e) => {
                        Object.assign(
                            (e.target as HTMLElement).style,
                            buttonHoverStyle,
                        );
                    }}
                    onMouseLeave={(e) => {
                        Object.assign(
                            (e.target as HTMLElement).style,
                            buttonStyle,
                        );
                    }}
                >
                    結果を確認する
                </button> */}
            </div>
        </div>
    );
}

export default View;
