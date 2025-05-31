import { useNavigate } from "react-router-dom";

function View() {
    const navigate = useNavigate();

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
                    有権者登録
                </button>

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
            </div>
        </div>
    );
}

export default View;
