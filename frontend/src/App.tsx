import { Routes, Route } from "react-router-dom";
import RequestsPage from "./pages/requests/RequestsPage";
import SmileNavBar from "./shared/components/SmileNavBar";
import PatientsPage from "./pages/patients/PatientsPage";
import SilentCheckSSO from "./pages/patients/SilentCheckSSO";
import SamplesPage from "./pages/samples/SamplesPage";

function App() {
  return (
    <>
      <main id="main" className="main">
        <SmileNavBar />
        <Routes>
          <>
            <Route path="/" element={<RequestsPage />}>
              <Route path=":igoRequestId" />
            </Route>
            <Route path="/requests/" element={<RequestsPage />}>
              <Route path=":igoRequestId" />
            </Route>
            <Route path="/patients/" element={<PatientsPage />}>
              <Route path=":cmoPatientId" />
            </Route>
            <Route path="/samples" element={<SamplesPage />} />
            <Route path="/silent-check-sso" element={<SilentCheckSSO />} />
          </>
        </Routes>
      </main>
    </>
  );
}

export default App;
