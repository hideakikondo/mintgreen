import { useNavigate } from "react-router-dom";

function View() {
    const navigate = useNavigate();

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
        borderColor: "#646cff",
        backgroundColor: "#f8f9ff",
    };

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
                いどばたご意見板
            </h1>

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
            >
                <button
                    style={buttonStyle}
                    onClick={() => navigate("/issue-vote")}
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
                    変更案を評価
                </button>

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
                    変更案一覧
                </button>
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
            >
                {/* <h2 style={sectionHeadingStyle}></h2>
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
                    ログイン
                </button> */}

                {/* <button
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
                </button> */}


            </div>
        </div>
    );
}

export default View;
