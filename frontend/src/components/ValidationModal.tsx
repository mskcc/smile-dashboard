import { DashboardRequest } from "../generated/graphql";
import { CustomTooltip } from "../shared/components/CustomToolTip";
import WarningIcon from "@material-ui/icons/Warning";

export function ValidationModal({
  data,
}: {
  data: DashboardRequest | undefined;
}) {
  return (
    <div
      role="button"
      style={{ display: "contents" }}
      onClick={() => {
        console.log("Warning icon clicked");
      }}
      aria-label="Warning"
    >
      <CustomTooltip icon={<WarningIcon className="warning-icon" />}>
        Click to view request validation errors
      </CustomTooltip>
    </div>
  );
}
