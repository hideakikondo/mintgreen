import { useState } from "react";
import viteLogo from "/vite.svg";
import reactLogo from "./assets/react.svg";
import "./App.css";

function View() {
    const [count, setCount] = useState(0);

    return (
        <>
            <div>
                <a href="https://vite.dev" target="_blank">
                    <img src={viteLogo} className="logo" alt="Vite logo" />
                </a>
                <a href="https://react.dev" target="_blank">
                    <img
                        src={reactLogo}
                        className="logo react"
                        alt="React logo"
                    />
                </a>
            </div>
            <h1>Mintgreen 選挙システム</h1>
            <div className="card">
                <button onClick={() => setCount((count) => count + 1)}>
                    count is {count}
                </button>
                <p>
                    Edit <code>src/app/view.tsx</code> and save to test HMR
                </p>
                <div style={{ marginTop: "2rem" }}>
                    <a
                        href="/admin/elections/new"
                        style={{
                            display: "inline-block",
                            backgroundColor: "#646cff",
                            color: "white",
                            padding: "0.8em 1.5em",
                            textDecoration: "none",
                            borderRadius: "8px",
                            fontWeight: "500",
                        }}
                    >
                        管理者ページ
                    </a>
                </div>
            </div>
            <p className="read-the-docs">
                Click on the Vite and React logos to learn more
            </p>
        </>
    );
}

export default View;
