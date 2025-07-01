import type { Session } from "@supabase/supabase-js";
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from "react";
import { supabase } from "../lib/supabaseClient";
import type { Tables } from "../types/supabase";

interface AuthContextType {
    voter: Tables<"voters"> | null;
    session: Session | null;
    signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    loading: boolean;
    needsDisplayName: boolean;
    setDisplayName: (
        displayName: string,
    ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [voter, setVoter] = useState<Tables<"voters"> | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [needsDisplayName, setNeedsDisplayName] = useState(false);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                if (
                    import.meta.env.MODE === "test" ||
                    process.env.NODE_ENV === "test"
                ) {
                    setLoading(false);
                    return;
                }

                const {
                    data: { session: currentSession },
                } = await supabase.auth.getSession();
                setSession(currentSession);

                if (currentSession?.user?.email) {
                    console.log(
                        "Querying voter for email:",
                        currentSession.user.email,
                    );
                    const { data: voterData, error: voterError } =
                        await supabase
                            .from("voters")
                            .select("*")
                            .eq("user_email", currentSession.user.email)
                            .single();

                    if (voterError) {
                        console.error("Voter query error:", voterError);
                        if (voterError.code !== "PGRST116") {
                            // PGRST116は"No rows found"
                            throw voterError;
                        }
                    }

                    if (voterData) {
                        setVoter(voterData);
                        setNeedsDisplayName(false);
                    } else {
                        setNeedsDisplayName(true);
                    }
                }
            } catch (error) {
                console.error("認証初期化エラー:", error);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        if (
            import.meta.env.MODE === "test" ||
            process.env.NODE_ENV === "test"
        ) {
            return () => {};
        }

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);

            if (session?.user?.email) {
                console.log(
                    "Auth state change - querying voter for email:",
                    session.user.email,
                );
                const { data: voterData, error: voterError } = await supabase
                    .from("voters")
                    .select("*")
                    .eq("user_email", session.user.email)
                    .single();

                if (voterError) {
                    console.error("Auth state voter query error:", voterError);
                    if (voterError.code !== "PGRST116") {
                        // PGRST116は"No rows found"
                        console.error(
                            "Unexpected voter query error:",
                            voterError,
                        );
                    }
                }

                if (voterData) {
                    setVoter(voterData);
                    setNeedsDisplayName(false);
                } else {
                    setNeedsDisplayName(true);
                }
            } else {
                setVoter(null);
                setNeedsDisplayName(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithGoogle = async (): Promise<{
        success: boolean;
        error?: string;
    }> => {
        try {
            // 開発環境では強制的にlocalhostを使用
            const isDevelopment =
                import.meta.env.DEV || window.location.hostname === "localhost";
            const redirectUrl = isDevelopment
                ? window.location.origin
                : import.meta.env.VITE_DEPLOYMENT_URL || window.location.origin;

            console.log("OAuth redirect URL:", redirectUrl);
            console.log("Current origin:", window.location.origin);
            console.log("Environment:", {
                isDev: import.meta.env.DEV,
                hostname: window.location.hostname,
                deploymentUrl: import.meta.env.VITE_DEPLOYMENT_URL,
            });

            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${redirectUrl}/`,
                },
            });

            if (error) {
                console.error("Google OAuth エラー:", error);
                return {
                    success: false,
                    error: `Google認証に失敗しました: ${error.message}`,
                };
            }

            return { success: true };
        } catch (err) {
            console.error("Google認証エラー:", err);
            return { success: false, error: "Google認証に失敗しました" };
        }
    };

    const setDisplayName = async (
        displayName: string,
    ): Promise<{ success: boolean; error?: string }> => {
        console.log("setDisplayName関数開始:", {
            displayName,
            sessionExists: !!session?.user?.email,
        });

        if (!session?.user?.email) {
            return { success: false, error: "認証されていません" };
        }

        try {
            console.log("重複チェック開始:", displayName.trim());
            const { data: existingVoter, error: checkError } = await supabase
                .from("voters")
                .select("voter_id")
                .eq("display_name", displayName.trim())
                .single();

            if (checkError && checkError.code !== "PGRST116") {
                console.error("重複チェックエラー:", checkError);
                throw checkError;
            }

            if (existingVoter) {
                console.log("表示名重複:", displayName.trim());
                return {
                    success: false,
                    error: "この表示名は既に使用されています",
                };
            }

            console.log("投票者作成開始:", {
                displayName: displayName.trim(),
                email: session.user.email,
            });
            const { data: voterData, error: insertError } = await supabase
                .from("voters")
                .insert({
                    display_name: displayName.trim(),
                    user_email: session.user.email,
                    is_eligible: true,
                })
                .select()
                .single();

            if (insertError) {
                console.error("投票者作成エラー:", insertError);
                throw insertError;
            }

            console.log("投票者作成成功:", voterData);

            if (!voterData?.is_eligible) {
                return {
                    success: false,
                    error: "この投票者は投票資格がありません",
                };
            }

            console.log("状態更新開始");
            setVoter(voterData);
            setNeedsDisplayName(false);
            console.log("表示名設定完了");
            return { success: true };
        } catch (err) {
            console.error("表示名設定エラー:", err);
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : "表示名の設定に失敗しました";
            return { success: false, error: errorMessage };
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setVoter(null);
        setSession(null);
        setNeedsDisplayName(false);
    };

    const value: AuthContextType = {
        voter,
        session,
        signInWithGoogle,
        logout,
        isAuthenticated: !!voter && !!session,
        loading,
        needsDisplayName,
        setDisplayName,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
