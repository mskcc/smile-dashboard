import { ReactNode, useEffect } from "react";
import { useUserEmail } from "../contexts/UserEmailContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { userEmail, isLoadingUserEmail } = useUserEmail();

  useEffect(() => {
    if (!isLoadingUserEmail && !userEmail) {
      const returnTo = encodeURIComponent(
        window.location.pathname + window.location.search
      );
      window.location.href = `${process.env.REACT_APP_EXPRESS_SERVER_ORIGIN}/auth/login?returnTo=${returnTo}`;
    }
  }, [isLoadingUserEmail, userEmail]);

  if (isLoadingUserEmail || !userEmail) {
    return null;
  }

  return <>{children}</>;
}
