import { Routes, Route } from "react-router-dom";
import RequestsPage from "./pages/requests/RequestsPage";
import SmileNavBar from "./shared/components/SmileNavBar";
import PatientsPage from "./pages/patients/PatientsPage";
import SamplesPage from "./pages/samples/SamplesPage";
import { useEffect, useState } from "react";

function App() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function checkLogin() {
      try {
        const response = await fetch("https://localhost:4000/check-login", {
          credentials: "include",
        });
        if (response.status === 200) {
          const userEmail = await response.text();
          setUserEmail(userEmail);
        }
      } catch (error) {
        console.error(error);
      }
    }
    checkLogin();
  }, []);

  return (
    <main id="main" className="main">
      <SmileNavBar userEmail={userEmail} setUserEmail={setUserEmail} />
      <Routes>
        <>
          <Route path="/" element={<RequestsPage />}>
            <Route path=":igoRequestId" />
          </Route>
          <Route path="/requests/" element={<RequestsPage />}>
            <Route path=":igoRequestId" />
          </Route>
          <Route
            path="/patients/"
            element={<PatientsPage setUserEmail={setUserEmail} />}
          >
            <Route path=":cmoPatientId" />
          </Route>
          <Route path="/samples" element={<SamplesPage />} />
        </>
      </Routes>
    </main>
  );
}

export default App;
