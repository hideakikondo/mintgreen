interface NetworkTimeoutOverlayProps {
    isVisible: boolean;
    onRetry: () => void;
    onClose: () => void;
    message?: string;
}

export default function NetworkTimeoutOverlay({
    isVisible,
    onRetry,
    onClose,
    message = "サーバーとの通信に時間がかかっています",
}: NetworkTimeoutOverlayProps) {
    if (!isVisible) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                animation: "fadeIn 0.3s ease-in",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    padding: "2rem",
                    maxWidth: "400px",
                    margin: "1rem",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
                    textAlign: "center",
                    animation: "scaleIn 0.3s ease-out",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        fontSize: "3rem",
                        marginBottom: "1rem",
                        color: "#ff9800",
                    }}
                >
                    ⚠️
                </div>

                <h3
                    style={{
                        margin: "0 0 1rem 0",
                        color: "#333",
                        fontSize: "1.3rem",
                        fontWeight: "600",
                    }}
                >
                    通信状況をご確認ください
                </h3>

                <p
                    style={{
                        margin: "0 0 1.5rem 0",
                        color: "#666",
                        lineHeight: "1.6",
                        fontSize: "1rem",
                    }}
                >
                    {message}
                </p>

                <div
                    style={{
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        padding: "1rem",
                        marginBottom: "1.5rem",
                        textAlign: "left",
                    }}
                >
                    <p
                        style={{
                            margin: "0 0 0.5rem 0",
                            fontSize: "0.9rem",
                            color: "#555",
                            fontWeight: "500",
                        }}
                    >
                        以下をご確認ください：
                    </p>
                    <ul
                        style={{
                            margin: 0,
                            paddingLeft: "1.2rem",
                            fontSize: "0.85rem",
                            color: "#666",
                            lineHeight: "1.5",
                        }}
                    >
                        <li>インターネット接続状況</li>
                        <li>Wi-Fi・モバイル通信の状態</li>
                        <li>ブラウザの設定やセキュリティソフト</li>
                    </ul>
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: "0.75rem",
                        justifyContent: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <button
                        onClick={onRetry}
                        style={{
                            backgroundColor: "#5FBEAA",
                            color: "white",
                            border: "none",
                            padding: "0.75rem 1.5rem",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "1rem",
                            fontWeight: "500",
                            transition: "all 0.2s ease",
                            minWidth: "100px",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#4DA894";
                            e.currentTarget.style.transform =
                                "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#5FBEAA";
                            e.currentTarget.style.transform = "translateY(0)";
                        }}
                    >
                        🔄 再試行
                    </button>

                    <button
                        onClick={onClose}
                        style={{
                            backgroundColor: "#f8f9fa",
                            color: "#666",
                            border: "2px solid #dee2e6",
                            padding: "0.75rem 1.5rem",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "1rem",
                            fontWeight: "500",
                            transition: "all 0.2s ease",
                            minWidth: "100px",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#e9ecef";
                            e.currentTarget.style.borderColor = "#adb5bd";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#f8f9fa";
                            e.currentTarget.style.borderColor = "#dee2e6";
                        }}
                    >
                        ✕ 閉じる
                    </button>
                </div>

                <p
                    style={{
                        margin: "1rem 0 0 0",
                        fontSize: "0.8rem",
                        color: "#999",
                    }}
                >
                    問題が続く場合はお時間をおいて再度お試しください
                </p>
            </div>
        </div>
    );
}
