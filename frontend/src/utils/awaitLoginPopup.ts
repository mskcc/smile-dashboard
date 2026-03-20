import { openLoginPopup } from "./openLoginPopup";
import { getUserEmail } from "./getUserEmail";

/**
 * Opens the Keycloak login popup and resolves with the logged-in user's email
 * once the popup reports a successful login. Resolves with undefined if the
 * popup is closed without a successful login.
 */
export async function awaitLoginPopup(): Promise<string | undefined> {
  return new Promise<string | undefined>((resolve) => {
    window.addEventListener("message", handleLoginMessage);

    function handleLoginMessage(event: MessageEvent) {
      if (event.data === "success") {
        getUserEmail().then((email) => {
          window.removeEventListener("message", handleLoginMessage);
          resolve(email);
        });
      }
    }

    openLoginPopup();
  });
}
