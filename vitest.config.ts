import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        globals: true,
        include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
        setupFiles: ["./src/setup.ts"],
        env: {
            VITE_SUPABASE_URL: "https://test.supabase.co",
            VITE_SUPABASE_ANON_KEY: "test-anon-key",
            VITE_USE_LOCAL_DB: "true",
        },
    },
});
