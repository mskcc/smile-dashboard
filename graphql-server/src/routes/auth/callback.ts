import { REACT_APP_REACT_SERVER_ORIGIN } from "../../utils/constants";
const passport = require("passport");

/**
 * This second passport.authenticate() serves a distinct function from the one called by logInRoute.
 * It lets Keycloak respond to the above authentication request, following the OpenID protocol.
 * If successful, Passport adds `user` and `isAuthenticated()` to the `req` object.
 */
export function callbackRoute(req: any, res: any, next: any) {
  passport.authenticate("oidc", {
    successRedirect: `${REACT_APP_REACT_SERVER_ORIGIN}/auth/login-success`,
    failureRedirect: "/",
  })(req, res, next);
}
