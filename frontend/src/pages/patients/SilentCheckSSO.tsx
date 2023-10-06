import { useEffect } from "react";

const MyComponent = () => {
  useEffect(() => {
    if (window && window.parent) {
      window.parent.postMessage({ message: "silent-check-sso" }, "*");
    }
  }, []);

  return <div></div>;
};

export default MyComponent;
