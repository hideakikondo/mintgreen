import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DisplayNameInput from "../components/DisplayNameInput";
import IssueRanking from "../components/common/IssueRanking";
import { useAuth } from "../contexts/AuthContext";

function View() {
    const navigate = useNavigate();
    const {
        isAuthenticated,
        voter,
        signInWithGoogle,
        logout,
        loading,
        needsDisplayName,
    } = useAuth();
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
        borderColor: "#5FBEAA",
        backgroundColor: "#f0fdf7",
    };


    const handleEvaluateClick = async () => {
        if (isAuthenticated) {
            navigate("/issue-vote");
        } else {
            setLoggingIn(true);
            setLoginError(null);

            const result = await signInWithGoogle();

            if (!result.success) {
                setLoginError(result.error || "Google認証に失敗しました");
            }

            setLoggingIn(false);
        }
    };

    const handleDisplayNameComplete = () => {
        navigate("/issue-vote");
    };

    const handleLogout = () => {
        logout();
    };

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background:
                        "linear-gradient(135deg, #C8F0E5 0%, #E8F8F3 50%, #F0FDF7 100%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2rem",
                }}
            >
                <div
                    style={{
                        maxWidth: "1200px",
                        width: "100%",
                        margin: "0 auto",
                    }}
                >
                    <div style={{ textAlign: "center" }}>
                        <div className="spinner"></div>
                        <h2 style={{ margin: 0 }}>読み込み中...</h2>
                    </div>
                </div>
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
                background:
                    "linear-gradient(135deg, #C8F0E5 0%, #E8F8F3 50%, #F0FDF7 100%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
            }}
        >
            <div
                style={{ maxWidth: "1200px", width: "100%", margin: "0 auto" }}
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
                    いどばた みんなの共感アプリ(α版)
                </h1>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: "2rem",
                    }}
                >
                    <IssueRanking />
                </div>

                {isAuthenticated && voter && (
                    <div
                        style={{
                            position: "fixed" as const,
                            top: "20px",
                            right: "20px",
                            backgroundColor: "#5FBEAA",
                            color: "white",
                            border: "none",
                            borderRadius: "12px",
                            padding: "1.2rem",
                            boxShadow: "0 6px 20px rgba(95, 190, 170, 0.3)",
                            zIndex: 999,
                            minWidth: "200px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                marginBottom: "1rem",
                                gap: "0.5rem",
                            }}
                        >
                            <div
                                style={{
                                    width: "8px",
                                    height: "8px",
                                    backgroundColor: "#4ade80",
                                    borderRadius: "50%",
                                }}
                            />
                            <span style={{ fontSize: "0.8em", opacity: 0.9 }}>
                                サインイン中
                            </span>
                        </div>
                        <p
                            style={{
                                marginBottom: "1rem",
                                fontSize: "1em",
                                fontWeight: "600",
                                margin: "0 0 1rem 0",
                            }}
                        >
                            {voter.display_name} さん
                        </p>
                        <button
                            onClick={handleLogout}
                            style={{
                                backgroundColor: "rgba(255, 255, 255, 0.2)",
                                color: "white",
                                border: "1px solid rgba(255, 255, 255, 0.3)",
                                padding: "0.6em 1.2em",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: "0.9em",
                                width: "100%",
                                fontWeight: "500",
                                transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                (e.target as HTMLElement).style.backgroundColor =
                                    "rgba(255, 255, 255, 0.3)";
                            }}
                            onMouseLeave={(e) => {
                                (e.target as HTMLElement).style.backgroundColor =
                                    "rgba(255, 255, 255, 0.2)";
                            }}
                        >
                            ログアウト
                        </button>
                    </div>
                )}

                {needsDisplayName && (
                    <DisplayNameInput onComplete={handleDisplayNameComplete} />
                )}

                {loginError && !needsDisplayName && (
                    <div
                        style={{
                            position: "fixed",
                            top: "20px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            backgroundColor: "#ffebee",
                            color: "#c62828",
                            padding: "1rem",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            zIndex: 999,
                        }}
                    >
                        {loginError}
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
                        margin: "0 auto",
                        flexWrap: "wrap",
                    }}
                >
                    <button
                        style={{
                            ...buttonStyle,
                            backgroundColor: loggingIn
                                ? "#ccc"
                                : buttonStyle.backgroundColor,
                            cursor: loggingIn ? "not-allowed" : "pointer",
                        }}
                        onClick={handleEvaluateClick}
                        disabled={loggingIn}
                        onMouseEnter={(e) => {
                            if (!loggingIn) {
                                Object.assign(
                                    (e.target as HTMLElement).style,
                                    buttonHoverStyle,
                                );
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loggingIn) {
                                Object.assign(
                                    (e.target as HTMLElement).style,
                                    buttonStyle,
                                );
                            }
                        }}
                    >
                        {loggingIn ? "認証中..." : "共感を表明する"}
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
                        みんなの共感を見る
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
        </div>
    );
}

export default View;
