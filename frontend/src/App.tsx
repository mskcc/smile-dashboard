import { Routes, Route } from "react-router-dom";
import RequestsPage from "./pages/requests/RequestsPage";
import SmileNavBar from "./shared/components/SmileNavBar";
import PatientsPage from "./pages/patients/PatientsPage";
import SamplesPage from "./pages/samples/SamplesPage";
import useAuth from "./hooks/useAuth";

function App() {
  const [isLogin, token] = useAuth();
  return isLogin ? (
    <>
      <SmileNavBar />

      <main id="main" className="main">
        <section className="section dashboard">
          <Routes>
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
          </Routes>
        </section>
      </main>
    </>
  ) : (
    <div>
      <h1>Not login</h1>
    </div>
  );
}

export default App;
