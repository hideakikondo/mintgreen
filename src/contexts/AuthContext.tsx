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
    authInitialized: boolean;
    diagnoseAndRepairAuth: () => Promise<{
        success: boolean;
        level: "session_refresh" | "reauth_required" | "network_error";
        error?: string;
    }>;
    refreshSession: () => Promise<{ success: boolean; error?: string }>;
    isOnline: boolean;
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
    const [authInitialized, setAuthInitialized] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        let isMounted = true;
        let authTimeout: NodeJS.Timeout;
        let isTimedOut = false;
        let authStateSubscription: any;

        const initializeAuth = async () => {
            try {
                if (
                    import.meta.env.MODE === "test" ||
                    process.env.NODE_ENV === "test"
                ) {
                    if (isMounted) setLoading(false);
                    return;
                }

                // 現在の認証セッションを最初に取得
                const {
                    data: { session: currentSession },
                } = await supabase.auth.getSession();

                // 必要な場合のみキャッシュクリア（認証状態を保持）
                try {
                    // バージョンチェック用のキー
                    const currentVersion = "1.1.0"; // バージョンアップして一度だけクリア
                    const storedVersion = localStorage.getItem("app-version");

                    // バージョンが変わった場合、または初回起動時のみキャッシュクリア
                    if (storedVersion !== currentVersion) {
                        // 古いSupabaseキーのみクリア（現在のセッションは保持）
                        const oldKeys = Object.keys(localStorage).filter(
                            (key) =>
                                key.startsWith("sb-") &&
                                !key.includes("auth-token") &&
                                !key.includes("session"),
                        );

                        // 認証関連以外の古いキーのみ削除
                        oldKeys.forEach((key) => {
                            if (
                                !key.includes("auth") &&
                                !key.includes("session")
                            ) {
                                localStorage.removeItem(key);
                            }
                        });

                        localStorage.setItem("app-version", currentVersion);
                        console.log("選択的キャッシュクリアを実行しました");

                        // セッションが存在する場合は保持
                        if (currentSession) {
                            console.log("既存の認証セッションを保持します");
                        }
                    }
                } catch (error) {
                    console.warn("キャッシュクリアに失敗:", error);
                }

                // 既存セッションがない場合のみ3秒タイムアウトを設定
                if (!currentSession) {
                    authTimeout = setTimeout(() => {
                        if (isMounted && !isTimedOut) {
                            console.warn("認証初期化がタイムアウトしました");
                            isTimedOut = true;
                            // タイムアウト時は認証なし状態でアプリケーション続行
                            setSession(null);
                            setVoter(null);
                            setNeedsDisplayName(false);
                            setLoading(false);
                            setAuthInitialized(true);
                        }
                    }, 3000);
                } else {
                    console.log(
                        "既存セッションが存在するためタイムアウトをスキップ",
                    );
                }

                // タイムアウト前に完了した場合の処理
                if (isTimedOut || !isMounted) return;

                // 認証セッションを取得（既存セッションがない場合のみ再取得）
                let finalSession = currentSession;
                if (!currentSession) {
                    const {
                        data: { session: newSession },
                    } = await supabase.auth.getSession();
                    finalSession = newSession;
                }

                console.log(
                    "セッション状態:",
                    finalSession ? "認証済み" : "未認証",
                );

                if (!isMounted || isTimedOut) return;

                setSession(finalSession);

                if (finalSession?.user?.email) {
                    console.log(
                        "認証済みユーザー発見. 投票者情報を取得中:",
                        finalSession.user.email,
                    );

                    try {
                        const { data: voterData, error: voterError } =
                            await supabase
                                .from("voters")
                                .select("*")
                                .eq("user_email", finalSession.user.email)
                                .single();

                        if (!isMounted || isTimedOut) return;

                        if (voterError) {
                            console.error("投票者クエリエラー:", voterError);
                            if (voterError.code !== "PGRST116") {
                                // PGRST116は"No rows found"
                                throw voterError;
                            }
                        }

                        if (voterData) {
                            console.log(
                                "投票者データ取得成功:",
                                voterData.display_name,
                            );
                            setVoter(voterData);
                            setNeedsDisplayName(false);
                        } else {
                            console.log("投票者データ未登録。表示名入力が必要");
                            setNeedsDisplayName(true);
                        }
                    } catch (error) {
                        console.error("投票者データ取得中にエラー:", error);
                        // エラーがあっても認証状態は保持
                        if (currentSession) {
                            setNeedsDisplayName(true);
                        }
                    }
                } else {
                    console.log("認証されていないユーザー");
                    setVoter(null);
                    setNeedsDisplayName(false);
                }

                if (!isTimedOut) {
                    clearTimeout(authTimeout);
                }
            } catch (error) {
                console.error("認証初期化エラー:", error);
                if (!isTimedOut) {
                    clearTimeout(authTimeout);
                }
            } finally {
                if (isMounted && !isTimedOut) {
                    setLoading(false);
                    setAuthInitialized(true);
                }
            }
        };

        initializeAuth();

        if (
            import.meta.env.MODE === "test" ||
            process.env.NODE_ENV === "test"
        ) {
            return () => {
                clearTimeout(authTimeout);
            };
        }

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            // ナビゲーション中は状態変更を無視（既存のセッションを保持）
            if (isNavigating && event === "SIGNED_OUT") {
                console.log(
                    "ナビゲーション中のため、ログアウトイベントを無視します",
                );
                return;
            }
            if (!isMounted) return;

            setSession(session);

            if (session?.user?.email) {
                console.log(
                    "Auth state change - querying voter for email:",
                    session.user.email,
                );
                try {
                    const { data: voterData, error: voterError } =
                        await supabase
                            .from("voters")
                            .select("*")
                            .eq("user_email", session.user.email)
                            .single();

                    if (!isMounted) return;

                    if (voterError) {
                        console.error(
                            "Auth state voter query error:",
                            voterError,
                        );
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
                } catch (error) {
                    console.error("Auth state change error:", error);
                }
            } else {
                setVoter(null);
                setNeedsDisplayName(false);
            }
        });

        authStateSubscription = subscription;

        return () => {
            isMounted = false;
            clearTimeout(authTimeout);
            if (authStateSubscription) {
                authStateSubscription.unsubscribe();
            }
        };
    }, []);

    // オンライン/オフライン状態の監視
    useEffect(() => {
        const handleOnline = () => {
            console.log("ネットワーク接続が復旧しました");
            setIsOnline(true);
        };

        const handleOffline = () => {
            console.log("ネットワーク接続が切断されました");
            setIsOnline(false);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
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
        try {
            setIsNavigating(true);
            console.log("ログアウト処理を開始");

            // Supabaseからサインアウト（状態クリアより先に実行）
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("ログアウトエラー:", error);
                // エラーがあっても状態はクリアする
            }

            // 状態をクリア
            setVoter(null);
            setSession(null);
            setNeedsDisplayName(false);

            console.log("ログアウト完了");
        } catch (error) {
            console.error("ログアウト処理中にエラー:", error);
            // エラー時も状態をクリア
            setVoter(null);
            setSession(null);
            setNeedsDisplayName(false);
        } finally {
            // ナビゲーション完了後に状態をリセット
            setTimeout(() => {
                setIsNavigating(false);
            }, 100); // 時間を短縮してより早く正常状態に戻す
        }
    };

    const refreshSession = async (): Promise<{
        success: boolean;
        error?: string;
    }> => {
        try {
            console.log("セッション更新を試行中...");

            // 現在のセッションを再取得して状態を更新
            const { data: sessionData, error: sessionError } =
                await supabase.auth.getSession();

            if (sessionError) {
                console.error("セッション取得エラー:", sessionError);
                return {
                    success: false,
                    error: "セッション情報の取得に失敗しました",
                };
            }

            if (sessionData.session) {
                console.log("セッション更新成功");
                setSession(sessionData.session);
                return { success: true };
            }

            return { success: false, error: "セッションが存在しません" };
        } catch (err) {
            console.error("セッション更新で予期しないエラー:", err);
            return {
                success: false,
                error: "セッション更新中にエラーが発生しました",
            };
        }
    };

    const diagnoseAndRepairAuth = async (): Promise<{
        success: boolean;
        level: "session_refresh" | "reauth_required" | "network_error";
        error?: string;
    }> => {
        try {
            console.log("認証診断を開始...");

            // Step 1: ネットワーク接続の確認
            try {
                await fetch("https://www.google.com", {
                    method: "HEAD",
                    mode: "no-cors",
                });
                console.log("ネットワーク接続: OK");
            } catch (networkError) {
                console.error("ネットワーク接続エラー:", networkError);
                return {
                    success: false,
                    level: "network_error",
                    error: "インターネット接続を確認してください",
                };
            }

            // Step 2: 現在のセッション状態確認
            const {
                data: { session: currentSession },
                error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError) {
                console.error("セッション取得エラー:", sessionError);
                return {
                    success: false,
                    level: "reauth_required",
                    error: "認証セッションの取得に失敗しました",
                };
            }

            if (!currentSession) {
                console.log("セッションが存在しません。再認証が必要");
                return {
                    success: false,
                    level: "reauth_required",
                    error: "認証セッションが見つかりません",
                };
            }

            // Step 3: セッション有効期限確認
            const now = Math.floor(Date.now() / 1000);
            const expiresAt = currentSession.expires_at || 0;

            if (expiresAt <= now + 300) {
                // 5分以内に期限切れ
                console.log(
                    "セッションが期限切れ間近。更新を試行...",
                    new Date(expiresAt * 1000),
                );
                const refreshResult = await refreshSession();

                if (refreshResult.success) {
                    // セッション更新後、データベース接続をテスト
                    const testResult = await testDatabaseConnection();
                    if (testResult.success) {
                        return {
                            success: true,
                            level: "session_refresh",
                        };
                    }
                    return {
                        success: false,
                        level: "reauth_required",
                        error: testResult.error,
                    };
                }

                return {
                    success: false,
                    level: "reauth_required",
                    error: refreshResult.error,
                };
            }

            // Step 4: データベース接続テスト
            const testResult = await testDatabaseConnection();
            if (testResult.success) {
                console.log("認証状態は正常です");
                return { success: true, level: "session_refresh" };
            }

            // Step 5: セッション更新を試行
            console.log("DB接続失敗。セッション更新を試行...");
            const refreshResult = await refreshSession();

            if (refreshResult.success) {
                const retestResult = await testDatabaseConnection();
                if (retestResult.success) {
                    return { success: true, level: "session_refresh" };
                }
            }

            return {
                success: false,
                level: "reauth_required",
                error: "認証の修復に失敗しました。再ログインが必要です",
            };
        } catch (error) {
            console.error("認証診断中にエラー:", error);
            return {
                success: false,
                level: "network_error",
                error: "認証診断中にエラーが発生しました",
            };
        }
    };

    const testDatabaseConnection = async (): Promise<{
        success: boolean;
        error?: string;
    }> => {
        try {
            // 軽量なクエリでDB接続をテスト
            const { error } = await supabase
                .from("github_issues")
                .select("issue_id")
                .limit(1);

            if (error) {
                console.error("DB接続テストエラー:", error);
                return { success: false, error: error.message };
            }

            console.log("DB接続テスト成功");
            return { success: true };
        } catch (err) {
            console.error("DB接続テスト中にエラー:", err);
            return { success: false, error: "データベース接続テストに失敗" };
        }
    };

    const value: AuthContextType = {
        voter,
        session,
        signInWithGoogle,
        logout,
        isAuthenticated: !!voter && !!session && !isNavigating,
        loading: loading || isNavigating,
        needsDisplayName,
        setDisplayName,
        authInitialized: authInitialized && !isNavigating,
        diagnoseAndRepairAuth,
        refreshSession,
        isOnline,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
