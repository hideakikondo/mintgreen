import { createClient } from "@supabase/supabase-js";
import { type Database } from "../types/supabase";
import { type DatabaseClient, SQLiteClient } from "./database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const useLocalDb = import.meta.env.VITE_USE_LOCAL_DB === "true";

let client: DatabaseClient;

if (useLocalDb || !supabaseUrl || supabaseUrl === "https://test.supabase.co") {
    console.log("Using SQLite local database");
    const sqliteClient = new SQLiteClient();

    if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
        client = {
            from: () => ({
                select: () => Promise.resolve({ data: [], error: null }),
                insert: () => Promise.resolve({ data: null, error: null }),
                update: () => Promise.resolve({ data: [], error: null }),
                delete: () => Promise.resolve({ data: null, error: null }),
            }),
            auth: {
                getSession: async () => ({
                    data: { session: null },
                    error: null,
                }),
                onAuthStateChange: () => ({
                    data: { subscription: { unsubscribe: () => {} } },
                }),
                signInWithOAuth: async () => {},
                signOut: async () => {},
            },
        } as any;
    } else {
        sqliteClient.initialize().catch((error) => {
            console.error("SQLite initialization failed:", error);
        });
        client = sqliteClient as any;
    }
} else {
    console.log("Using Supabase database");
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
    client = createClient<Database>(finalUrl, finalKey) as any;
}

export const supabase = client;
