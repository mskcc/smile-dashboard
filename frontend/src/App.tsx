import { Routes, Route } from "react-router-dom";
import RequestsPage from "./pages/requests/RequestsPage";
import SmileNavBar from "./shared/components/SmileNavBar";
import PatientsPage from "./pages/patients/PatientsPage";
import SamplesPage from "./pages/samples/SamplesPage";
import { useState, useEffect } from "react";
import Keycloak from "keycloak-js";

const client = new Keycloak({
  url: "https://smile-dev.mskcc.org:8443/",
  realm: "smile",
  clientId: "smile-dashboard-test",
});

function App() {
  const [isLogin, setIsLogin] = useState<boolean>(false);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [logout, setLogout] = useState<Function | undefined>(undefined);

  useEffect(() => {
    client
      .init({
        onLoad: "login-required",
      })
      .then((res) => {
        setIsLogin(res);
        setToken(client.token);
        setLogout(() => client.logout);
      });
  }, []);

  return (
    <>
      <main id="main" className="main">
        <SmileNavBar logout={logout} />
        <Routes>
          {isLogin && (
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
            </>
          )}
        </Routes>
      </main>
    </>
  );
}

export default App;
