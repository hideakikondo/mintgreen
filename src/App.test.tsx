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
        expect(screen.getByText("変更案確認・評価をする")).toBeInTheDocument();
        expect(screen.getByText("みんなの評価を見る")).toBeInTheDocument();
    });
});
