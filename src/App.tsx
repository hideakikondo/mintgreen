import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import IssueVotePageComponent from "./app/issue-vote/page";
import IssuesPageComponent from "./app/issues/page";
import ProfileRegistrationPage from "./app/register/page";
import View from "./app/view";
import { AuthProvider } from "./contexts/AuthContext";

function IssuesPage() {
    return <IssuesPageComponent />;
}

function IssueVotePage() {
    return <IssueVotePageComponent />;
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<View />} />
                    <Route
                        path="/register"
                        element={<ProfileRegistrationPage />}
                    />
                    <Route path="/issues" element={<IssuesPage />} />
                    <Route path="/issue-vote" element={<IssueVotePage />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
