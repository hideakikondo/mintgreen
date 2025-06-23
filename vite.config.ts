import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    optimizeDeps: {
        exclude: ["sql.js"],
    },
    server: {
        fs: {
            allow: [".."],
        },
    },
    build: {
        rollupOptions: {
            input: {
                main: "index.html",
            },
        },
    },
});
