import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
    it("renders headline", () => {
        render(<App />);
        expect(screen.getByText("Vite + React")).toBeInTheDocument();
    });

    it("renders count button", () => {
        render(<App />);
        expect(
            screen.getByRole("button", { name: /count is 0/i }),
        ).toBeInTheDocument();
    });
});
