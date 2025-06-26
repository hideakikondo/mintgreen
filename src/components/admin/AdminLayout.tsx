import { Link, Outlet } from "react-router-dom";
import AuthChecker from "../common/AuthChecker";

export default function AdminLayout() {
    return (
        <AuthChecker requireAdmin={true}>
            <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
                <header
                    style={{
                        backgroundColor: "#1a1a1a",
                        color: "white",
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
