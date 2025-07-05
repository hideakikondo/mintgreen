import { useEffect, useState } from "react";

interface ScrollToTopButtonProps {
    threshold?: number;
    isMobile?: boolean;
}

export default function ScrollToTopButton({
    threshold = 300,
    isMobile = false,
}: ScrollToTopButtonProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > threshold) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);

        return () => {
            window.removeEventListener("scroll", toggleVisibility);
        };
    }, [threshold]);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    if (!isVisible) {
        return null;
    }

    return (
        <button
            onClick={scrollToTop}
            style={{
                position: "fixed",
                bottom: isMobile ? "20px" : "30px",
                right: isMobile ? "20px" : "30px",
                width: isMobile ? "50px" : "60px",
                height: isMobile ? "50px" : "60px",
                borderRadius: "50%",
                backgroundColor: "#5FBEAA",
                color: "white",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isMobile ? "18px" : "20px",
                fontWeight: "bold",
                transition: "all 0.3s ease",
                animation: "fadeInUp 0.3s ease-out",
            }}
            onMouseEnter={(e) => {
                if (!isMobile) {
                    e.currentTarget.style.backgroundColor = "#4DA894";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                        "0 6px 16px rgba(0, 0, 0, 0.2)";
                }
            }}
            onMouseLeave={(e) => {
                if (!isMobile) {
                    e.currentTarget.style.backgroundColor = "#5FBEAA";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(0, 0, 0, 0.15)";
                }
            }}
            onTouchStart={(e) => {
                if (isMobile) {
                    e.currentTarget.style.backgroundColor = "#4DA894";
                    e.currentTarget.style.transform = "scale(0.95)";
                }
            }}
            onTouchEnd={(e) => {
                if (isMobile) {
                    e.currentTarget.style.backgroundColor = "#5FBEAA";
                    e.currentTarget.style.transform = "scale(1)";
                }
            }}
            aria-label="ページトップへ戻る"
            title="ページトップへ戻る"
        >
            ↑
        </button>
    );
}
