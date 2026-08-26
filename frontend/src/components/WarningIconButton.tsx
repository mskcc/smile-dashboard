import { CustomTooltip } from "./CustomToolTip";
import WarningIcon from "@material-ui/icons/Warning";

export function WarningIconButton({
  onClick,
  tooltipText,
}: {
  onClick: () => void;
  tooltipText: string;
}) {
  return (
    <div
      role="button"
      style={{ display: "contents" }}
      onClick={onClick}
      aria-label="Warning"
    >
      <CustomTooltip icon={<WarningIcon className="warning-icon" />}>
        {tooltipText}
      </CustomTooltip>
    </div>
  );
}
