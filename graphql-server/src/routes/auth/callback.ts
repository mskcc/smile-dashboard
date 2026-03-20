import { REACT_APP_REACT_SERVER_ORIGIN } from "../../utils/constants";
const passport = require("passport");

/**
 * This second passport.authenticate() serves a distinct function from the one called by logInRoute.
 * It lets Keycloak respond to the above authentication request, following the OpenID protocol.
 * If successful, Passport adds `user` and `isAuthenticated()` to the `req` object.
 *
 * After login, the user is redirected to `session.returnTo` (set by logInRoute when a protected
 * page initiates the login flow) or falls back to `/auth/login-success` for the popup login flow.
 */
export function callbackRoute(req: any, res: any, next: any) {
  passport.authenticate("oidc", (err: any, user: any) => {
    if (err || !user) {
      return res.redirect("/");
    }

    // Read returnTo before req.logIn() — Passport 0.6+ regenerates the session
    // on login (session fixation prevention), which would destroy session data.
    const returnTo = req.session.returnTo as string | undefined;

    req.logIn(user, (loginErr: any) => {
      if (loginErr) {
        return next(loginErr);
      }

      const redirectUrl =
        returnTo && returnTo.startsWith("/")
          ? `${REACT_APP_REACT_SERVER_ORIGIN}${returnTo}`
          : `${REACT_APP_REACT_SERVER_ORIGIN}/auth/login-success`;

      req.session.save((saveErr: any) => {
        if (saveErr) return next(saveErr);
        return res.redirect(redirectUrl);
      });
    });
  })(req, res, next);
}
