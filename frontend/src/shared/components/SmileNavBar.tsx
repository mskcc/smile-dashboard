import logo_with_text from "../../imgs/logo_with_text.png";
import { Nav, NavLink } from "react-bootstrap";

export default function SmileNavBar({
  userEmail,
}: {
  userEmail: string | null;
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
        {userEmail && (
          <div className="ms-auto d-flex">
            <p className="m-auto">Logged in as {userEmail}</p>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm m-3"
              onClick={() => {}}
            >
              Logout
            </button>
          </div>
        )}
      </header>
    </>
  );
}
