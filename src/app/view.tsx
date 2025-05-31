import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function View() {
    const navigate = useNavigate();
    const [, setUser] = useState<User | null>(null);
    const [isRegistered, setIsRegistered] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);

    const buttonStyle = {
        width: "100%",
        maxWidth: "600px",
        padding: "1.5em 2em",
        margin: "1rem 0",
        backgroundColor: "white",
        border: "2px solid #e0e0e0",
        borderRadius: "12px",
        fontSize: "1.2em",
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

    const sectionHeadingStyle = {
        fontSize: "1.4em",
        fontWeight: "600",
        color: "#333",
        marginTop: "2rem",
        marginBottom: "1rem",
        textAlign: "center" as const,
    };

    useEffect(() => {
        const getSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();
            setUser(session?.user ?? null);

            if (session?.user?.email) {
                await checkRegistrationStatus(session.user.email);
            } else {
                setIsRegistered(false);
            }
            setLoading(false);
        };

        getSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null);

            if (session?.user?.email) {
                await checkRegistrationStatus(session.user.email);
            } else {
                setIsRegistered(false);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkRegistrationStatus = async (email: string) => {
        try {
            const { data: existingVoter } = await supabase
                .from("voters")
                .select("voter_id")
                .eq("user_email", email)
                .single();

            setIsRegistered(!!existingVoter);
        } catch (error) {
            console.error("Registration status check error:", error);
            setIsRegistered(false);
        }
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
                <h2>読み込み中...</h2>
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
            <h1
                style={{
                    fontSize: "2rem",
                    fontWeight: "600",
                    color: "#333",
                    marginBottom: "3rem",
                    textAlign: "center",
                }}
            >
                オンライン投票アプリ (Prototype)
            </h1>

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "1rem",
                    width: "100%",
                    maxWidth: "600px",
                }}
            >
                <h2 style={sectionHeadingStyle}>有権者メニュー</h2>
                <button
                    style={{
                        ...buttonStyle,
                        backgroundColor: isRegistered
                            ? "#ccc"
                            : buttonStyle.backgroundColor,
                        cursor: isRegistered ? "not-allowed" : "pointer",
                    }}
                    onClick={() => !isRegistered && navigate("/register")}
                    disabled={isRegistered}
                    onMouseEnter={(e) => {
                        if (!isRegistered) {
                            Object.assign(
                                (e.target as HTMLElement).style,
                                buttonHoverStyle,
                            );
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isRegistered) {
                            Object.assign((e.target as HTMLElement).style, {
                                ...buttonStyle,
                                backgroundColor: isRegistered
                                    ? "#ccc"
                                    : buttonStyle.backgroundColor,
                                cursor: isRegistered
                                    ? "not-allowed"
                                    : "pointer",
                            });
                        }
                    }}
                >
                    {isRegistered ? "登録済み" : "有権者登録"}
                </button>

                <button
                    style={buttonStyle}
                    onClick={() => navigate("/vote")}
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
                    選挙に投票する
                </button>

                <button
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
                </button>

                <h2 style={sectionHeadingStyle}>管理者メニュー</h2>

                <button
                    style={buttonStyle}
                    onClick={() => navigate("/admin/elections/new")}
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
                    選挙を開催する
                </button>

                <button
                    style={buttonStyle}
                    onClick={() => navigate("/admin/elections/all")}
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
                    開催中の選挙一覧
                </button>
            </div>
        </div>
    );
}

export default View;
