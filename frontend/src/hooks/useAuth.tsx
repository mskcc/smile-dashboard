import React, { useState, useEffect, useRef } from "react";
import Keycloak from "keycloak-js";

const client = new Keycloak({
  url: "https://smile-dev.mskcc.org:8443/",
  realm: "smile",
  clientId: "smile-dashboard-test",
});

const useAuth = () => {
  const [isLogin, setLogin] = useState(false);
  const [token, setToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    client
      .init({
        onLoad: "login-required",
      })
      .then((res) => {
        setLogin(res);
        setToken(client.token);
      });
  }, []);

  return [isLogin, token];
};

export default useAuth;
