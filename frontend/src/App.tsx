import { Routes, Route } from "react-router-dom";
import RequestsPage from "./pages/requests/RequestsPage";
import SmileNavBar from "./shared/components/SmileNavBar";
import PatientsPage from "./pages/patients/PatientsPage";
import SamplesPage from "./pages/samples/SamplesPage";
import { useEffect } from "react";
import Keycloak from "keycloak-js";
import { useApolloClient, ApolloLink, HttpLink } from "@apollo/client";

const keycloakClient = new Keycloak({
  url: "https://smile-dev.mskcc.org:8443/",
  realm: "smile",
  clientId: "smile-dashboard-test",
});

function App() {
  const apolloClient = useApolloClient();

  useEffect(() => {
    keycloakClient
      .init({
        onLoad: "login-required",
      })
      .then(() => {
        const newApolloLink = new ApolloLink((operation, forward) => {
          operation.setContext({
            headers: {
              authorization: `Bearer ${keycloakClient.token}`,
              roles: keycloakClient.realmAccess?.roles,
            },
          });
          return forward(operation);
        }).concat(new HttpLink({ uri: "http://localhost:4001/graphql" }));
        apolloClient.setLink(newApolloLink);
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
