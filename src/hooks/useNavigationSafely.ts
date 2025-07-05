import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * 認証状態を保持しながら安全にページ遷移を行うカスタムフック
 * React Routerのnavigateを使用してページリロードを避け、
 * 認証状態の不整合を防ぐ
 */
export const useNavigationSafely = () => {
    const navigate = useNavigate();

    const navigateSafely = useCallback(
        (
            to: string,
            options?: { replace?: boolean; preserveAuth?: boolean },
        ) => {
            try {
                const { replace = false, preserveAuth = true } = options || {};

                // 認証状態を保持する場合は、React Routerのnavigateを使用
                if (preserveAuth) {
                    navigate(to, { replace });
                } else {
                    // 認証状態をクリアする場合は、window.location.hrefを使用
                    if (replace) {
                        window.location.replace(to);
                    } else {
                        window.location.href = to;
                    }
                }
            } catch (error) {
                console.error("ナビゲーションエラー:", error);
                // フォールバック: 通常のページ遷移
                window.location.href = to;
            }
        },
        [navigate],
    );

    const navigateToHome = useCallback(
        (preserveAuth: boolean = true) => {
            navigateSafely("/", { preserveAuth });
        },
        [navigateSafely],
    );

    const navigateWithState = useCallback(
        (to: string, state?: any, preserveAuth: boolean = true) => {
            try {
                if (preserveAuth && navigate) {
                    navigate(to, { state });
                } else {
                    navigateSafely(to, { preserveAuth });
                }
            } catch (error) {
                console.error("状態付きナビゲーションエラー:", error);
                navigateSafely(to, { preserveAuth });
            }
        },
        [navigate, navigateSafely],
    );

    return {
        navigateSafely,
        navigateToHome,
        navigateWithState,
    };
};
