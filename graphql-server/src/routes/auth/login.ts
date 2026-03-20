const passport = require("passport");

/**
 * Initiate the authentication request.
 * If a `returnTo` query parameter is provided (a relative path), it is stored
 * in the session so the callback can redirect the user back there after login.
 * The session is explicitly saved before initiating the OIDC redirect to ensure
 * the value is persisted in the store before the browser leaves the page.
 */
export function logInRoute(req: any, res: any, next: any) {
  const returnTo = req.query.returnTo;
  if (returnTo && typeof returnTo === "string" && returnTo.startsWith("/")) {
    req.session.returnTo = returnTo;
    req.session.save(() => {
      passport.authenticate("oidc")(req, res, next);
    });
    return;
  }
  passport.authenticate("oidc")(req, res, next);
}
