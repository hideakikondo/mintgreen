import { Link, Outlet } from "react-router-dom";
import AuthChecker from "../common/AuthChecker";

export default function AdminLayout() {
    return (
        <AuthChecker requireAdmin={true}>
            <div
                style={{
                    minHeight: "100vh",
                    backgroundColor: "var(--bg-primary)",
                }}
            >
                <header
                    style={{
                        backgroundColor: "var(--header-bg, #1a1a1a)",
                        color: "var(--header-text, white)",
                        padding: "1rem 2rem",
                        marginBottom: "2rem",
                    }}
                >
                    <h1>管理システム</h1>
                    <nav style={{ marginTop: "1rem" }}>
                        <Link
                            to="/"
                            style={{
                                color: "#646cff",
                                textDecoration: "none",
                            }}
                        >
                            ホームに戻る
                        </Link>
                    </nav>
                </header>

                <main style={{ padding: "0 2rem" }}>
                    <Outlet />
                </main>
            </div>
        </AuthChecker>
    );
}
