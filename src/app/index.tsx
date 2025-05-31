import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "../App";

export { supabase } from "../lib/supabaseClient";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
