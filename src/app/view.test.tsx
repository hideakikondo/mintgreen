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
            screen.getByText("いどばた みんなの共感アプリ(α版)"),
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
        expect(screen.getByText("変更案確認・評価をする")).toBeInTheDocument();
        expect(screen.getByText("みんなの評価を見る")).toBeInTheDocument();
    });
});
