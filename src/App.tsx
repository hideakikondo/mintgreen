import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import EditElectionPage from "./app/admin/elections/[electionId]/edit/page";
import NewElectionPage from "./app/admin/elections/new/page";
import View from "./app/view";
import AdminLayout from "./components/admin/AdminLayout";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<View />} />
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
