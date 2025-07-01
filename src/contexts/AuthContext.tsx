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
                    const { data: voterData } = await supabase
                        .from("voters")
                        .select("*")
                        .eq("user_email", currentSession.user.email)
                        .single();

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
                const { data: voterData } = await supabase
                    .from("voters")
                    .select("*")
                    .eq("user_email", session.user.email)
                    .single();

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
            const redirectUrl =
                import.meta.env.VITE_DEPLOYMENT_URL || window.location.origin;

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
        if (!session?.user?.email) {
            return { success: false, error: "認証されていません" };
        }

        try {
            const { data: existingVoter } = await supabase
                .from("voters")
                .select("voter_id")
                .eq("display_name", displayName.trim())
                .single();

            if (existingVoter) {
                return {
                    success: false,
                    error: "この表示名は既に使用されています",
                };
            }

            const { data: voterData, error: insertError } = await supabase
                .from("voters")
                .insert({
                    display_name: displayName.trim(),
                    user_email: session.user.email,
                    is_eligible: true,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            if (!voterData.is_eligible) {
                return {
                    success: false,
                    error: "この投票者は投票資格がありません",
                };
            }

            setVoter(voterData);
            setNeedsDisplayName(false);
            return { success: true };
        } catch (err) {
            console.error("表示名設定エラー:", err);
            return { success: false, error: "表示名の設定に失敗しました" };
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
