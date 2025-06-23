import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
    it("renders main title", () => {
        render(<App />);
        expect(
            screen.getByText("オンライン投票アプリ (Prototype)"),
        ).toBeInTheDocument();
    });

    it("renders all three main buttons", () => {
        render(<App />);
        expect(screen.getByText("選挙を開催する")).toBeInTheDocument();
        expect(screen.getByText("変更案を評価")).toBeInTheDocument();
        expect(screen.getByText("結果を確認する")).toBeInTheDocument();
    });
});
