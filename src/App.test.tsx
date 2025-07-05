import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
    it("renders main title", () => {
        render(<App />);
        expect(
            screen.getByText("いどばた政策 みんなの共感表明(α版)"),
        ).toBeInTheDocument();
    });

    it("renders all main buttons", () => {
        render(<App />);
        expect(screen.getByText("共感の声を届ける")).toBeInTheDocument();
        expect(screen.getByText("共感数の集計を見る")).toBeInTheDocument();
    });
});
