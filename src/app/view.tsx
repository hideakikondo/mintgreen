import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DisplayNameInput from "../components/DisplayNameInput";
import IssueRanking from "../components/common/IssueRanking";
import { useAuth } from "../contexts/AuthContext";

// スマートフォン/タブレット判定のカスタムフック
const useIsTablet = () => {
    const [isTablet, setIsTablet] = useState(false);

    useEffect(() => {
        const checkIfTablet = () => {
            setIsTablet(window.innerWidth <= 760);
        };

        checkIfTablet();
        window.addEventListener("resize", checkIfTablet);

        return () => window.removeEventListener("resize", checkIfTablet);
    }, []);

    return isTablet;
};

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
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const isTablet = useIsTablet();

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

    // メニュー外クリックで閉じる
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isMenuOpen &&
                !(event.target as Element).closest("[data-menu]")
            ) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isMenuOpen]);

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
                <div
                    style={{
                        textAlign: "center",
                        marginBottom: "3rem",
                    }}
                >
                    <h1
                        style={{
                            fontSize: "2rem",
                            fontWeight: "600",
                            color: "#333",
                            marginBottom: "0.5rem",
                            margin: "0 0 0.5rem 0",
                        }}
                    >
                        いどばた政策
                    </h1>
                    <p
                        style={{
                            fontSize: "1.2rem",
                            fontWeight: "400",
                            color: "#666",
                            margin: "0",
                        }}
                    >
                        みんなの共感表明(α版)
                    </p>
                </div>

                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: "2rem",
                    }}
                >
                    <IssueRanking />
                </div>

                {!isAuthenticated && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: "1.5rem",
                        }}
                    >
                        <button
                            style={{
                                width: "280px",
                                height: "48px",
                                padding: "0",
                                backgroundColor: "#ffffff",
                                color: "#1f1f1f",
                                border: "1px solid #dadce0",
                                borderRadius: "24px",
                                fontSize: "14px",
                                fontWeight: "500",
                                cursor: loggingIn ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "12px",
                                transition: "all 0.2s ease",
                                boxShadow:
                                    "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
                                position: "relative",
                                overflow: "hidden",
                            }}
                            onClick={() => signInWithGoogle()}
                            disabled={loggingIn}
                            onMouseEnter={(e) => {
                                if (!loggingIn) {
                                    (
                                        e.target as HTMLElement
                                    ).style.backgroundColor = "#f8f9fa";
                                    (e.target as HTMLElement).style.boxShadow =
                                        "0 2px 8px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.3)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!loggingIn) {
                                    (
                                        e.target as HTMLElement
                                    ).style.backgroundColor = "#ffffff";
                                    (e.target as HTMLElement).style.boxShadow =
                                        "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)";
                                }
                            }}
                        >
                            <div
                                style={{
                                    width: "20px",
                                    height: "20px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <svg
                                    version="1.1"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 48 48"
                                    style={{
                                        display: "block",
                                        width: "20px",
                                        height: "20px",
                                    }}
                                >
                                    <path
                                        fill="#EA4335"
                                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                                    ></path>
                                    <path
                                        fill="#4285F4"
                                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                                    ></path>
                                    <path
                                        fill="#FBBC05"
                                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                                    ></path>
                                    <path
                                        fill="#34A853"
                                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                                    ></path>
                                    <path fill="none" d="M0 0h48v48H0z"></path>
                                </svg>
                            </div>
                            <span
                                style={{
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    color: "#1f1f1f",
                                    textShadow: "none",
                                }}
                            >
                                Googleでログイン
                            </span>
                        </button>
                    </div>
                )}

                {isAuthenticated && voter && !isTablet && (
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
                                (
                                    e.target as HTMLElement
                                ).style.backgroundColor =
                                    "rgba(255, 255, 255, 0.3)";
                            }}
                            onMouseLeave={(e) => {
                                (
                                    e.target as HTMLElement
                                ).style.backgroundColor =
                                    "rgba(255, 255, 255, 0.2)";
                            }}
                        >
                            ログアウト
                        </button>
                    </div>
                )}

                {isAuthenticated && voter && isTablet && (
                    <>
                        <button
                            data-menu
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            style={{
                                position: "fixed" as const,
                                top: "20px",
                                right: "20px",
                                width: "50px",
                                height: "50px",
                                backgroundColor: "#5FBEAA",
                                border: "none",
                                borderRadius: "50%",
                                cursor: "pointer",
                                zIndex: 1001,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 4px 12px rgba(95, 190, 170, 0.4)",
                                transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                                (
                                    e.target as HTMLElement
                                ).style.backgroundColor = "#4DA894";
                            }}
                            onMouseLeave={(e) => {
                                (
                                    e.target as HTMLElement
                                ).style.backgroundColor = "#5FBEAA";
                            }}
                        >
                            <div
                                style={{
                                    position: "relative",
                                    width: "20px",
                                    height: "20px",
                                }}
                            >
                                {/* サインイン状態インジケーター */}
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "-2px",
                                        right: "-2px",
                                        width: "8px",
                                        height: "8px",
                                        backgroundColor: "#4ade80",
                                        borderRadius: "50%",
                                        border: "1px solid white",
                                        zIndex: 1,
                                    }}
                                />
                                {/* ハンバーガーアイコン */}
                                <div
                                    style={{
                                        position: "relative",
                                        width: "20px",
                                        height: "20px",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "16px",
                                            height: "2px",
                                            backgroundColor: "white",
                                            borderRadius: "1px",
                                            transition: "all 0.3s ease",
                                            transformOrigin: "center",
                                            position: "absolute" as const,
                                            top: isMenuOpen ? "9px" : "6px",
                                            left: "2px",
                                            transform: isMenuOpen
                                                ? "rotate(45deg)"
                                                : "rotate(0deg)",
                                        }}
                                    />
                                    <div
                                        style={{
                                            width: "16px",
                                            height: "2px",
                                            backgroundColor: "white",
                                            borderRadius: "1px",
                                            transition: "all 0.3s ease",
                                            opacity: isMenuOpen ? 0 : 1,
                                            position: "absolute" as const,
                                            top: "9px",
                                            left: "2px",
                                        }}
                                    />
                                    <div
                                        style={{
                                            width: "16px",
                                            height: "2px",
                                            backgroundColor: "white",
                                            borderRadius: "1px",
                                            transition: "all 0.3s ease",
                                            transformOrigin: "center",
                                            position: "absolute" as const,
                                            top: isMenuOpen ? "9px" : "12px",
                                            left: "2px",
                                            transform: isMenuOpen
                                                ? "rotate(-45deg)"
                                                : "rotate(0deg)",
                                        }}
                                    />
                                </div>
                            </div>
                        </button>

                        {/* メニューパネル */}
                        {isMenuOpen && (
                            <div
                                data-menu
                                style={{
                                    position: "fixed" as const,
                                    top: "80px",
                                    right: "20px",
                                    backgroundColor: "#5FBEAA",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "12px",
                                    padding: "1.2rem",
                                    boxShadow:
                                        "0 6px 20px rgba(95, 190, 170, 0.3)",
                                    zIndex: 1000,
                                    minWidth: "200px",
                                    animation: "fadeIn 0.3s ease",
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
                                    <span
                                        style={{
                                            fontSize: "0.8em",
                                            opacity: 0.9,
                                        }}
                                    >
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
                                    onClick={() => {
                                        handleLogout();
                                        setIsMenuOpen(false);
                                    }}
                                    style={{
                                        backgroundColor:
                                            "rgba(255, 255, 255, 0.2)",
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
                                        (
                                            e.target as HTMLElement
                                        ).style.backgroundColor =
                                            "rgba(255, 255, 255, 0.3)";
                                    }}
                                    onMouseLeave={(e) => {
                                        (
                                            e.target as HTMLElement
                                        ).style.backgroundColor =
                                            "rgba(255, 255, 255, 0.2)";
                                    }}
                                >
                                    ログアウト
                                </button>
                            </div>
                        )}
                    </>
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
                        alignItems: "flex-start",
                        justifyContent: "center",
                        gap: "2rem",
                        width: "100%",
                        maxWidth: "800px",
                        margin: "0 auto",
                        flexWrap: "wrap",
                        marginTop: "1rem",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                        }}
                    >
                        <button
                            style={{
                                ...buttonStyle,
                                backgroundColor: !isAuthenticated
                                    ? "#e0e0e0"
                                    : loggingIn
                                      ? "#ccc"
                                      : buttonStyle.backgroundColor,
                                color: !isAuthenticated ? "#999" : "#333",
                                cursor:
                                    !isAuthenticated || loggingIn
                                        ? "not-allowed"
                                        : "pointer",
                                opacity: !isAuthenticated ? 0.6 : 1,
                            }}
                            onClick={handleEvaluateClick}
                            disabled={!isAuthenticated || loggingIn}
                            onMouseEnter={(e) => {
                                if (isAuthenticated && !loggingIn) {
                                    Object.assign(
                                        (e.target as HTMLElement).style,
                                        buttonHoverStyle,
                                    );
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (isAuthenticated && !loggingIn) {
                                    Object.assign(
                                        (e.target as HTMLElement).style,
                                        buttonStyle,
                                    );
                                }
                            }}
                        >
                            {loggingIn ? "認証中..." : "共感の声を届ける"}
                        </button>
                        {!isAuthenticated && (
                            <p
                                style={{
                                    fontSize: "0.9em",
                                    color: "#d32f2f",
                                    marginTop: "0.5rem",
                                    textAlign: "center",
                                    fontWeight: "500",
                                }}
                            >
                                ※ Google認証が必要です
                            </p>
                        )}
                    </div>

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
                        共感数の集計を見る
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
                ></div>
            </div>
        </div>
    );
}

export default View;
