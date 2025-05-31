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
        expect(
            screen.getByText("オンライン投票アプリ (Prototype)"),
        ).toBeInTheDocument();
    });

    it("renders all three main buttons", () => {
        render(
            <BrowserRouter>
                <View />
            </BrowserRouter>,
        );
        expect(screen.getByText("選挙を開催する")).toBeInTheDocument();
        expect(screen.getByText("選挙に投票する")).toBeInTheDocument();
        expect(screen.getByText("結果を確認する")).toBeInTheDocument();
    });
});
