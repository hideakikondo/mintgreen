import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import "./setup";
import View from "./view";

/**
 * メインビューコンポーネントのテスト
 */
describe("View", () => {
    it("renders main title", () => {
        render(
            <BrowserRouter>
                <View />
            </BrowserRouter>,
        );
        expect(screen.getByText("いどばたご意見板")).toBeInTheDocument();
    });

    it("renders all main buttons", () => {
        render(
            <BrowserRouter>
                <View />
            </BrowserRouter>,
        );
        expect(screen.getByText("変更案を評価")).toBeInTheDocument();
        expect(screen.getByText("変更案一覧")).toBeInTheDocument();
    });
});
