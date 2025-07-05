import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthProvider } from "../contexts/AuthContext";
import "./setup";
import View from "./view";

/**
 * メインビューコンポーネントのテスト
 */
describe("View", () => {
    it("renders main title", () => {
        render(
            <AuthProvider>
                <BrowserRouter>
                    <View />
                </BrowserRouter>
            </AuthProvider>,
        );
        expect(
            screen.getByText("いどばた政策 みんなの共感表明(α版)"),
        ).toBeInTheDocument();
    });

    it("renders all main buttons", () => {
        render(
            <AuthProvider>
                <BrowserRouter>
                    <View />
                </BrowserRouter>
            </AuthProvider>,
        );
        expect(screen.getByText("共感の声を届ける")).toBeInTheDocument();
        expect(screen.getByText("共感数の集計を見る")).toBeInTheDocument();
    });
});
