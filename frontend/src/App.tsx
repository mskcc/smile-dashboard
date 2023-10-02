import { Routes, Route } from "react-router-dom";
import RequestsPage from "./pages/requests/RequestsPage";
import SmileNavBar from "./shared/components/SmileNavBar";
import PatientsPage from "./pages/patients/PatientsPage";
import SamplesPage from "./pages/samples/SamplesPage";
import { useState, useEffect } from "react";
import Keycloak from "keycloak-js";
import { useApolloClient } from "@apollo/client";

const keycloakClient = new Keycloak({
  url: "https://smile-dev.mskcc.org:8443/",
  realm: "smile",
  clientId: "smile-dashboard-test",
});

function App() {
  const [token, setToken] = useState<string | undefined>(undefined);
  const apolloClient = useApolloClient();

  useEffect(() => {
    keycloakClient
      .init({
        onLoad: "login-required",
      })
      .then((res) => {
        setToken(keycloakClient.token);
      });
  }, []);

  return (
    <>
      <main id="main" className="main">
        <SmileNavBar keycloakClient={keycloakClient} />
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
          </>
        </Routes>
      </main>
    </>
  );
}

export default App;
