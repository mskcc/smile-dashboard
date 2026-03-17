import { Nav } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useUserEmail } from "../contexts/UserEmailContext";
import { usePhiEnabled } from "../contexts/PhiEnabledContext";
import { openLoginPopup } from "../utils/openLoginPopup";
import { getUserEmail } from "../utils/getUserEmail";

export function NavBar() {
  const { userEmail, setUserEmail } = useUserEmail();
  const { setPhiEnabled } = usePhiEnabled();

  function handleLogout() {
    fetch(`${process.env.REACT_APP_EXPRESS_SERVER_ORIGIN}/auth/logout`, {
      method: "POST",
      credentials: "include",
      mode: "no-cors",
    });
    setUserEmail(undefined);
    setPhiEnabled(false);
  }

  async function handleLogin() {
    let currUserEmail = userEmail;
    if (!currUserEmail) {
      currUserEmail = await new Promise<string | undefined>((resolve) => {
        window.addEventListener("message", handleLogin);

        function handleLogin(event: MessageEvent) {
          if (event.data === "success") {
            getUserEmail().then((email) => {
              window.removeEventListener("message", handleLogin);
              resolve(email);
            });
          }
        }

        openLoginPopup();
      });

      if (!currUserEmail) return;
      setUserEmail(currUserEmail);
    }
  }

  return (
    <>
      <header
        id="header"
        className="header fixed-top d-flex align-items-center"
      >
        <div>
          <Link to="/" className="logo">
            <img src="/img/logo_with_text.png" alt="Navbar logo" />
          </Link>
        </div>
        <Nav>
          <Link className="nav-link" to="/requests">
            Requests
          </Link>
          <Link className="nav-link" to="/patients">
            Patients
          </Link>
          <Link className="nav-link" to="/samples">
            Samples
          </Link>
          <Link className="nav-link" to="/cohorts">
            Cohorts
          </Link>
        </Nav>
        {userEmail ? (
          <div className="ms-auto d-none d-md-flex">
            <p className="m-auto">Logged in as {userEmail}</p>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm m-3"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="ms-auto d-none d-md-flex">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm m-3"
              onClick={handleLogin}
            >
              Login
            </button>
          </div>
        )}
      </header>
    </>
  );
}
