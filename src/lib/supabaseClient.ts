import { createClient } from "@supabase/supabase-js";
import { type Database } from "../types/supabase";

// SuperBaseのプロジェクトURLとanon公開キーは、
// SuperBaseダッシュボードの「Project Settings」-> 「API」で確認できます。
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// 環境変数が設定されているか確認
if (!supabaseUrl) {
    throw new Error("VITE_SUPABASE_URL is not defined");
}
if (!supabaseAnonKey) {
    throw new Error("VITE_SUPABASE_ANON_KEY is not defined");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
