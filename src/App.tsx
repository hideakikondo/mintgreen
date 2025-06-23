import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import EditElectionPage from "./app/admin/elections/[electionId]/edit/page";
import AllElectionsPage from "./app/admin/elections/all/page";
import NewElectionPage from "./app/admin/elections/new/page";
import IssueVotePageComponent from "./app/issue-vote/page";
import IssuesPageComponent from "./app/issues/page";
import VoterRegistrationPage from "./app/register/page";
import View from "./app/view";
import VotePageComponent from "./app/vote/page";
import ElectionResults from "./components/ElectionResults";
import AdminLayout from "./components/admin/AdminLayout";

function VotePage() {
    return <VotePageComponent />;
}

function IssuesPage() {
    return <IssuesPageComponent />;
}

function IssueVotePage() {
    return <IssueVotePageComponent />;
}

function ResultsPage() {
    return <ElectionResults />;
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<View />} />
                <Route path="/register" element={<VoterRegistrationPage />} />
                <Route path="/vote" element={<VotePage />} />
                <Route path="/issues" element={<IssuesPage />} />
                <Route path="/issue-vote" element={<IssueVotePage />} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/admin/*" element={<AdminLayout />}>
                    <Route path="elections/new" element={<NewElectionPage />} />
                    <Route
                        path="elections/:electionId/edit"
                        element={<EditElectionPage />}
                    />
                    <Route
                        path="elections/all"
                        element={<AllElectionsPage />}
                    />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
