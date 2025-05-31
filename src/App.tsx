import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import EditElectionPage from "./app/admin/elections/[electionId]/edit/page";
import NewElectionPage from "./app/admin/elections/new/page";
import View from "./app/view";
import AdminLayout from "./components/admin/AdminLayout";

function VotePage() {
    return (
        <div style={{ padding: "2rem", textAlign: "center" }}>
            <h2>投票ページ</h2>
            <p>投票機能は今後実装予定です</p>
        </div>
    );
}

function ResultsPage() {
    return (
        <div style={{ padding: "2rem", textAlign: "center" }}>
            <h2>結果ページ</h2>
            <p>結果表示機能は今後実装予定です</p>
        </div>
    );
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<View />} />
                <Route path="/vote" element={<VotePage />} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/admin/*" element={<AdminLayout />}>
                    <Route path="elections/new" element={<NewElectionPage />} />
                    <Route
                        path="elections/:electionId/edit"
                        element={<EditElectionPage />}
                    />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
