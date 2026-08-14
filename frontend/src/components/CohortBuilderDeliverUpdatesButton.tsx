import { Button, Toast, ToastContainer } from "react-bootstrap";
import {
  TempoCohortRequest,
  TempoCohortSampleInput,
  DashboardCohortInput,
  useUpdateTempoCohortMutation,
} from "../generated/graphql";
import { CohortBuilderSample } from "./CohortBuilderContainer";
import { useState } from "react";
import { CustomTooltip } from "./CustomToolTip";
import { InfoOutlined } from "@material-ui/icons";
import { validateCohortBuilderInput } from "../utils/validateCohortBuilderInput";
import { formatCohortUsersString } from "../utils/formatCohortUsersString";

interface CohortBuilderDeliverUpdatesButtonProps {
  tempoCohortRequest: TempoCohortRequest;
  cohortSamples: CohortBuilderSample[];
}

export function CohortBuilderDeliverUpdatesButton({
  tempoCohortRequest,
  cohortSamples,
}: CohortBuilderDeliverUpdatesButtonProps) {
  const [showToast, setShowToast] = useState(false);
  const toggleShow = () => setShowToast(!showToast);
  const [updateTempoCohortMutation] = useUpdateTempoCohortMutation();

  function handleToastShow() {
    setTimeout(() => setShowToast(true), 3000);
  }

  async function handleDeliverUpdates() {
    if (!validateCohortBuilderInput(tempoCohortRequest, cohortSamples)) {
      return;
    }
    const dashboardCohortInput = {
      ...tempoCohortRequest,
      changedFieldNames: [],
      endUsers: formatCohortUsersString(tempoCohortRequest.endUsers),
      pmUsers: formatCohortUsersString(tempoCohortRequest.pmUsers),
      samples: cohortSamples.map((sample) => {
        var sdata = {
          primaryId: sample.primaryId,
          cmoId: sample.cmoSampleName ?? "",
        } as TempoCohortSampleInput;
        if (sample.embargoDate) {
          sdata = { ...sdata, embargoDate: sample.embargoDate };
        }
        return sdata;
      }),
    } as DashboardCohortInput;
    await updateTempoCohortMutation({
      variables: { dashboardCohort: dashboardCohortInput },
    });
    handleToastShow();
  }

  return (
    <>
      <CustomTooltip
        icon={
          <InfoOutlined
            style={{
              fontSize: 15,
              color: "grey",
              marginRight: 10,
              marginLeft: 5,
            }}
          />
        }
      >
        Publishes the cohort updates to TEMPO for processing.
      </CustomTooltip>
      <Button size={"sm"} onClick={handleDeliverUpdates}>
        Deliver Cohort Updates
      </Button>
      <ToastContainer position="bottom-end" className="p-3">
        <Toast
          show={showToast}
          onClose={toggleShow}
          delay={6000}
          autohide
          animation={true}
        >
          <Toast.Header>
            <strong className="me-auto">Cohort Delivery Notification</strong>
            <small>Just now</small>
          </Toast.Header>
          <Toast.Body>
            Published cohort updates for {tempoCohortRequest.cohortId} to TEMPO.
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
}
