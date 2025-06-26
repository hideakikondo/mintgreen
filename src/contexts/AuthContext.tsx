import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { supabase } from "../lib/supabaseClient";
import type { Tables } from "../types/supabase";

interface AuthContextType {
    voter: Tables<"voters"> | null;
    login: (
        displayName: string,
        password: string,
    ) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [voter, setVoter] = useState<Tables<"voters"> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedVoter = localStorage.getItem("mintgreen_voter");
        if (savedVoter) {
            try {
                setVoter(JSON.parse(savedVoter));
            } catch (error) {
                console.error("Failed to parse saved voter data:", error);
                localStorage.removeItem("mintgreen_voter");
            }
        }
        setLoading(false);
    }, []);

    const login = async (
        displayName: string,
        password: string,
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            const { data: voterData, error: voterError } = await supabase
                .from("voters")
                .select("*")
                .eq("display_name", displayName.trim())
                .eq("password", password.trim())
                .single();

            if (voterError) {
                return {
                    success: false,
                    error: "表示名またはパスワードが正しくありません",
                };
            }

            if (!voterData.is_eligible) {
                return {
                    success: false,
                    error: "この投票者は投票資格がありません",
                };
            }

            setVoter(voterData);
            localStorage.setItem("mintgreen_voter", JSON.stringify(voterData));
            return { success: true };
        } catch (err) {
            console.error("投票者認証エラー:", err);
            return { success: false, error: "投票者の認証に失敗しました" };
        }
    };

    const logout = () => {
        setVoter(null);
        localStorage.removeItem("mintgreen_voter");
    };

    const value: AuthContextType = {
        voter,
        login,
        logout,
        isAuthenticated: !!voter,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};
