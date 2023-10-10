import logo_with_text from "../../imgs/logo_with_text.png";
import { Nav, NavLink } from "react-bootstrap";
import Keycloak from "keycloak-js";

export default function SmileNavBar({
  keycloakClient,
  searchWithMRNs,
}: {
  keycloakClient: Keycloak;
  searchWithMRNs: boolean;
}) {
  return (
    <>
      <header
        id="header"
        className="header fixed-top d-flex align-items-center"
      >
        <div>
          <a href="/" className="logo">
            <img src={logo_with_text} alt="" />
          </a>
        </div>
        <Nav>
          <NavLink href="/requests">Requests</NavLink>
          <NavLink href="/patients">Patients</NavLink>
          <NavLink href="/samples">Samples</NavLink>
        </Nav>
        {keycloakClient.authenticated && (
          <div className="ms-auto d-flex">
            <p className="m-auto">Logged in as nguyenq2@mskcc.org</p>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm m-3"
              onClick={() => {
                keycloakClient.logout();
              }}
            >
              Logout
            </button>
          </div>
        )}
      </header>
    </>
  );
}
