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
        {searchWithMRNs && (
          <button
            type="button"
            className="btn btn-outline-primary btn-sm ms-auto"
            onClick={() => {
              keycloakClient.logout();
            }}
          >
            Logout
          </button>
        )}
      </header>
    </>
  );
}
