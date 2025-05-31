import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient.ts";

interface AuthCheckerProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export default function AuthChecker({
    children,
    requireAdmin = false,
}: AuthCheckerProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return <div>読み込み中...</div>;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl === "https://your-project.supabase.co") {
        console.log(
            "Supabase not configured, skipping authentication for development",
        );
        return <>{children}</>;
    }

    if (!user) {
        return (
            <div style={{ padding: "2rem", textAlign: "center" }}>
                <h2>ログインが必要です</h2>
                <p>この機能を使用するにはログインしてください。</p>
                <button
                    onClick={async () => {
                        await supabase.auth.signInWithOAuth({
                            provider: "google",
                        });
                    }}
                    style={{
                        backgroundColor: "#646cff",
                        color: "white",
                        border: "none",
                        padding: "0.6em 1.2em",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "1em",
                    }}
                >
                    Googleでログイン
                </button>
            </div>
        );
    }

    if (requireAdmin) {
        console.log("管理者権限チェック:", user.email);
    }

    return <>{children}</>;
}
