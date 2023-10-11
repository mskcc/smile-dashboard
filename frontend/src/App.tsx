import { Routes, Route } from "react-router-dom";
import RequestsPage from "./pages/requests/RequestsPage";
import SmileNavBar from "./shared/components/SmileNavBar";
import PatientsPage from "./pages/patients/PatientsPage";
import SamplesPage from "./pages/samples/SamplesPage";
import { useEffect, useState } from "react";
import Keycloak from "keycloak-js";

const keycloakClient = new Keycloak({
  url: "https://smile-dev.mskcc.org:8443/",
  realm: "smile",
  clientId: "smile-dashboard-test",
});

function App() {
  const [searchWithMRNs, setSearchWithMRNs] = useState(false);

  useEffect(() => {
    keycloakClient
      .init({
        onLoad: "check-sso",
        silentCheckSsoRedirectUri:
          window.location.origin + "/silent-check-sso.html",
      })
      .then(() => {
        keycloakClient.authenticated && setSearchWithMRNs(true);
      })
      .catch((error) => {
        console.log(error);
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
            <Route
              path="/patients/"
              element={
                <PatientsPage
                  keycloakClient={keycloakClient}
                  searchWithMRNs={searchWithMRNs}
                  setSearchWithMRNs={setSearchWithMRNs}
                />
              }
            >
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
