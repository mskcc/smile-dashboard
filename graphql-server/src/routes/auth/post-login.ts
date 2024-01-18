import { REACT_SERVER_ORIGIN } from "../../utils/constants";

/**
 * Upon successful login, the user is redirected to this route, which
 * closes the popup window and sends user's email to the parent window
 * to display on in the navbar.
 */
export function postLoginRouter(req: any, res: any) {
  const userEmail = req.user.email;

  res.send(`
    <script>
      window.opener.postMessage(${JSON.stringify(
        userEmail
      )}, "${REACT_SERVER_ORIGIN}/patients");
      window.onload = function() {
        setTimeout(function() {
          window.close();
        }, 1000);
      };
    </script>
    <p>You are logged in.</p>
  `);
}
