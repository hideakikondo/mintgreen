import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// supabaseClient.ts を更新
import { createClient } from "@supabase/supabase-js";
import { type Database } from "../types/supabase"; // 生成された型定義をインポート
import View from "./view";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// createClientに関数を渡し、型情報を適用します
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <View />
    </StrictMode>,
);
