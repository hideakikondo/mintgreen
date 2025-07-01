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
            screen.getByText("いどばた政策 みんなの共感アプリ(α版)"),
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
        expect(screen.getByText("共感を表明する")).toBeInTheDocument();
        expect(screen.getByText("共感数の集計を見る")).toBeInTheDocument();
    });
});
