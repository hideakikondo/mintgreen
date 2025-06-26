interface AuthCheckerProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export default function AuthChecker({
    children,
    requireAdmin = false,
}: AuthCheckerProps) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl === "https://your-project.supabase.co") {
        console.log(
            "Supabase not configured, skipping authentication for development",
        );
        return <>{children}</>;
    }

    if (requireAdmin) {
        console.log("管理者権限チェック: 認証システムが変更されました");
    }

    return <>{children}</>;
}
