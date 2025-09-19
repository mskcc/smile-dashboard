import { useEffect, useRef } from "react";
import ReactDOM from "react-dom";

export function PopupWindow({
  children,
  title = "Popup",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const containerRef = useRef(document.createElement("div"));
  const windowRef = useRef<Window | null>(null);

  useEffect(() => {
    windowRef.current = window.open(
      "",
      title,
      "width=400,height=600,left=200,top=200m"
    );
    if (windowRef.current) {
      windowRef.current.document.title = title || "Popup";
      windowRef.current.document.body.appendChild(containerRef.current);
    }
    console.log("Opened popup window:", windowRef.current);
    console.log("chidlren:", children);

    return () => {
      if (windowRef.current) windowRef.current.close();
    };
  }, [title]);

  return ReactDOM.createPortal(children, containerRef.current);
}
