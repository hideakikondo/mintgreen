import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("./lib/supabaseClient", () => ({
    supabase: {
        auth: {
            getSession: vi.fn().mockResolvedValue({
                data: { session: null },
                error: null,
            }),
            onAuthStateChange: vi.fn().mockReturnValue({
                data: {
                    subscription: {
                        unsubscribe: vi.fn(),
                    },
                },
            }),
        },
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                        data: null,
                        error: null,
                    }),
                }),
            }),
        }),
    },
}));

Object.defineProperty(import.meta, "env", {
    value: {
        VITE_SUPABASE_URL: "https://test.supabase.co",
        VITE_SUPABASE_ANON_KEY: "test-anon-key",
    },
    writable: true,
});
