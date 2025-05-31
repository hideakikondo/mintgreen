import { createClient } from "@supabase/supabase-js";

// SuperBaseのプロジェクトURLとanon公開キーは、
// SuperBaseダッシュボードの「Project Settings」-> 「API」で確認できます。
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // Next.jsの場合の環境変数
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Next.jsの場合の環境変数

// 環境変数が設定されているか確認
if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined");
}
if (!supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
