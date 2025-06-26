import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
    it("renders main title", () => {
        render(<App />);
        expect(screen.getByText("いどばたご意見板")).toBeInTheDocument();
    });

    it("renders all main buttons", () => {
        render(<App />);
        expect(screen.getByText("変更案を評価")).toBeInTheDocument();
        expect(screen.getByText("変更案一覧")).toBeInTheDocument();
    });
});
