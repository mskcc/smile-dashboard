import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserEmail } from "../../contexts/UserEmailContext";
import { usePhiEnabled } from "../../contexts/PhiEnabledContext";

const REDIRECT_DELAY_MS = 3000;

export function LoggingOutPage() {
  const { setUserEmail } = useUserEmail();
  const { setPhiEnabled } = usePhiEnabled();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${process.env.REACT_APP_EXPRESS_SERVER_ORIGIN}/auth/logout`, {
      method: "POST",
      credentials: "include",
      mode: "no-cors",
    });
    setUserEmail(undefined);
    setPhiEnabled(false);

    const timer = setTimeout(() => {
      navigate("/");
    }, REDIRECT_DELAY_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "80vh",
        gap: "1rem",
      }}
    >
      <h3>Logging out...</h3>
      <p className="text-muted">
        You will be redirected to the Requests page shortly.
      </p>
    </div>
  );
}
