import "@testing-library/jest-dom";

Object.defineProperty(import.meta, "env", {
    value: {
        VITE_SUPABASE_URL: "https://test.supabase.co",
        VITE_SUPABASE_ANON_KEY: "test-anon-key",
    },
    writable: true,
});
