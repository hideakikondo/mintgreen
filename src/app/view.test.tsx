import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "./setup";
import View from "./view";

/**
 * メインビューコンポーネントのテスト
 */
describe("View", () => {
    it("renders headline", () => {
        render(<View />);
        expect(screen.getByText("Vite + React")).toBeInTheDocument();
    });

    it("renders count button", () => {
        render(<View />);
        expect(
            screen.getByRole("button", { name: /count is 0/i }),
        ).toBeInTheDocument();
    });
});
