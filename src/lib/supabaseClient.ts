import { createClient } from "@supabase/supabase-js";
import { type Database } from "../types/supabase";

// SuperBaseのプロジェクトURLとanon公開キーは、
// SuperBaseダッシュボードの「Project Settings」-> 「API」で確認できます。
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// 環境変数が設定されているか確認（テスト環境では警告のみ）
if (!supabaseUrl) {
    if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
        console.warn("VITE_SUPABASE_URL is not defined in test environment");
    } else {
        throw new Error("VITE_SUPABASE_URL is not defined");
    }
}
if (!supabaseAnonKey) {
    if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
        console.warn(
            "VITE_SUPABASE_ANON_KEY is not defined in test environment",
        );
    } else {
        throw new Error("VITE_SUPABASE_ANON_KEY is not defined");
    }
}

const finalUrl = supabaseUrl || "https://test.supabase.co";
const finalKey = supabaseAnonKey || "test-anon-key";

export const supabase = createClient<Database>(finalUrl, finalKey);
