import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface AuthRepairOverlayProps {
    isVisible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AuthRepairOverlay({
    isVisible,
    onClose,
    onSuccess,
}: AuthRepairOverlayProps) {
    const { diagnoseAndRepairAuth, signInWithGoogle } = useAuth();
    const [isRepairing, setIsRepairing] = useState(false);
    const [repairStep, setRepairStep] = useState<
        "idle" | "diagnosing" | "repairing" | "success" | "need_reauth"
    >("idle");
    const [message, setMessage] = useState("");

    const handleRepair = async () => {
        setIsRepairing(true);
        setRepairStep("diagnosing");
        setMessage("認証状態を診断中...");

        try {
            const result = await diagnoseAndRepairAuth();

            if (result.success) {
                setRepairStep("success");
                setMessage("認証修復が完了しました");
                setTimeout(() => {
                    onSuccess?.();
                    onClose();
                }, 2000);
            } else {
                switch (result.level) {
                    case "network_error":
                        setRepairStep("idle");
                        setMessage(
                            "ネットワーク接続を確認してください。Wi-Fi・モバイル通信の状態をご確認ください。",
                        );
                        break;
                    case "session_refresh":
                        setRepairStep("repairing");
                        setMessage("セッションの更新中...");
                        break;
                    case "reauth_required":
                        setRepairStep("need_reauth");
                        setMessage("再ログインが必要です");
                        break;
                }
            }
        } catch (error) {
            console.error("認証修復エラー:", error);
            setRepairStep("idle");
            setMessage("認証修復中にエラーが発生しました");
        } finally {
            setIsRepairing(false);
        }
    };

    const handleReauth = async () => {
        setIsRepairing(true);
        setMessage("再認証中...");

        try {
            const result = await signInWithGoogle();
            if (result.success) {
                setRepairStep("success");
                setMessage("再認証が完了しました");
                setTimeout(() => {
                    onSuccess?.();
                    onClose();
                }, 2000);
            } else {
                setMessage(result.error || "再認証に失敗しました");
            }
        } catch (error) {
            console.error("再認証エラー:", error);
            setMessage("再認証中にエラーが発生しました");
        } finally {
            setIsRepairing(false);
        }
    };

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
                    {repairStep === "success" ? "✅" : "🔧"}
                </div>

                <h3
                    style={{
                        margin: "0 0 1rem 0",
                        color: "#333",
                        fontSize: "1.3rem",
                        fontWeight: "600",
                    }}
                >
                    {repairStep === "success"
                        ? "認証修復完了"
                        : repairStep === "need_reauth"
                          ? "再認証が必要"
                          : "認証修復"}
                </h3>

                <p
                    style={{
                        margin: "0 0 1.5rem 0",
                        color: "#666",
                        lineHeight: "1.6",
                        fontSize: "1rem",
                    }}
                >
                    {message ||
                        "認証状態を診断して必要に応じて修復を行います。"}
                </p>

                {(repairStep === "diagnosing" ||
                    repairStep === "repairing") && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginBottom: "1.5rem",
                        }}
                    >
                        <div
                            style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: "#ff9800",
                                animation: "bounce 1.4s infinite ease-in-out",
                            }}
                        />
                        <div
                            style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: "#ff9800",
                                animation: "bounce 1.4s infinite ease-in-out",
                                animationDelay: "0.32s",
                            }}
                        />
                        <div
                            style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: "#ff9800",
                                animation: "bounce 1.4s infinite ease-in-out",
                                animationDelay: "0.64s",
                            }}
                        />
                    </div>
                )}

                <div
                    style={{
                        display: "flex",
                        gap: "0.75rem",
                        justifyContent: "center",
                        flexWrap: "wrap",
                    }}
                >
                    {repairStep === "idle" && (
                        <button
                            onClick={handleRepair}
                            disabled={isRepairing}
                            style={{
                                backgroundColor: "#ff9800",
                                color: "white",
                                border: "none",
                                padding: "0.75rem 1.5rem",
                                borderRadius: "8px",
                                cursor: isRepairing ? "not-allowed" : "pointer",
                                fontSize: "1rem",
                                fontWeight: "500",
                                transition: "all 0.2s ease",
                                minWidth: "100px",
                                opacity: isRepairing ? 0.6 : 1,
                            }}
                            onMouseEnter={(e) => {
                                if (!isRepairing) {
                                    e.currentTarget.style.backgroundColor =
                                        "#f57c00";
                                    e.currentTarget.style.transform =
                                        "translateY(-1px)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isRepairing) {
                                    e.currentTarget.style.backgroundColor =
                                        "#ff9800";
                                    e.currentTarget.style.transform =
                                        "translateY(0)";
                                }
                            }}
                        >
                            🔧 修復開始
                        </button>
                    )}

                    {repairStep === "need_reauth" && (
                        <button
                            onClick={handleReauth}
                            disabled={isRepairing}
                            style={{
                                backgroundColor: "#5FBEAA",
                                color: "white",
                                border: "none",
                                padding: "0.75rem 1.5rem",
                                borderRadius: "8px",
                                cursor: isRepairing ? "not-allowed" : "pointer",
                                fontSize: "1rem",
                                fontWeight: "500",
                                transition: "all 0.2s ease",
                                minWidth: "100px",
                                opacity: isRepairing ? 0.6 : 1,
                            }}
                            onMouseEnter={(e) => {
                                if (!isRepairing) {
                                    e.currentTarget.style.backgroundColor =
                                        "#4DA894";
                                    e.currentTarget.style.transform =
                                        "translateY(-1px)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isRepairing) {
                                    e.currentTarget.style.backgroundColor =
                                        "#5FBEAA";
                                    e.currentTarget.style.transform =
                                        "translateY(0)";
                                }
                            }}
                        >
                            🔑 再ログイン
                        </button>
                    )}

                    {repairStep !== "diagnosing" &&
                        repairStep !== "repairing" &&
                        repairStep !== "success" && (
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
                                    e.currentTarget.style.backgroundColor =
                                        "#e9ecef";
                                    e.currentTarget.style.borderColor =
                                        "#adb5bd";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        "#f8f9fa";
                                    e.currentTarget.style.borderColor =
                                        "#dee2e6";
                                }}
                            >
                                ✕ 閉じる
                            </button>
                        )}
                </div>
            </div>
        </div>
    );
}
