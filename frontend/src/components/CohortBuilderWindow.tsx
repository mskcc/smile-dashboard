import { ReactNode, RefObject, useLayoutEffect, useRef, useState } from "react";

import { Close, FirstPage } from "@material-ui/icons";
import { Rnd } from "react-rnd";

interface CohortBuilderWindowProps {
  containerRef: RefObject<HTMLDivElement>;
  onClose: () => void;
  onSnapToSide: () => void;
  children: ReactNode;
}

export function CohortBuilderWindow({
  containerRef,
  onClose,
  onSnapToSide,
  children,
}: CohortBuilderWindowProps) {
  const rndRef = useRef<Rnd>(null);
  const [visible, setVisible] = useState(false);

  // Measure the flex-row container to match the inline side-panel by default
  // width = half the container, height = full container height,
  // positioned at the right half of the container.
  useLayoutEffect(() => {
    if (rndRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const w = rect.width / 2;
      const h = rect.height;
      rndRef.current.updateSize({ width: w, height: h });
      rndRef.current.updatePosition({ x: rect.left + w, y: rect.top });
      setVisible(true);
    }
  }, [containerRef]);

  return (
    <Rnd
      ref={rndRef}
      default={{
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      }}
      minWidth={600}
      minHeight={400}
      bounds="window"
      dragHandleClassName="cohort-builder-drag-handle"
      style={{ zIndex: 1050, visibility: visible ? "visible" : "hidden" }}
    >
      <div className="cohort-builder-window">
        <div className="cohort-builder-drag-handle">
          <span>Cohort Builder</span>
          <div className="d-flex gap-2 align-items-center">
            <button
              onClick={onSnapToSide}
              title="Snap to side panel"
              className="cohort-builder-close-btn"
            >
              <FirstPage fontSize="small" />
            </button>
            <button
              onClick={onClose}
              title="Close cohort builder"
              className="cohort-builder-close-btn"
            >
              <Close fontSize="small" />
            </button>
          </div>
        </div>

        <div className="cohort-builder-body">{children}</div>
      </div>
    </Rnd>
  );
}
