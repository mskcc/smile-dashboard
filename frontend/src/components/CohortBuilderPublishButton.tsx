import { Button, Toast, ToastContainer } from "react-bootstrap";
import {
  TempoCohortRequest,
  TempoCohortRequestInput,
  TempoCohortSampleInput,
  usePublishNewTempoCohortRequestMutation,
} from "../generated/graphql";
import { CohortBuilderSample } from "./CohortBuilderContainer";
import { useState } from "react";
import { CustomTooltip } from "./CustomToolTip";
import { InfoOutlined } from "@material-ui/icons";
import { validateCohortBuilderInput } from "../utils/validateCohortBuilderInput";
import { formatCohortUsersString } from "../utils/formatCohortUsersString";

interface CohortBuilderPublisherButtonProps {
  tempoCohortRequest: TempoCohortRequest;
  cohortSamples: CohortBuilderSample[];
}

export function CohortBuilderPublishButton({
  tempoCohortRequest,
  cohortSamples,
}: CohortBuilderPublisherButtonProps) {
  const [showToast, setShowToast] = useState(false);
  const toggleShow = () => setShowToast(!showToast);
  const [publishNewTempoCohortRequestMutation] =
    usePublishNewTempoCohortRequestMutation();

  function handleToastShow() {
    setTimeout(() => setShowToast(true), 3000);
  }

  async function handlePublishing() {
    if (!validateCohortBuilderInput(tempoCohortRequest, cohortSamples)) {
      return;
    }
    const tempoCohortRequestInput = {
      ...tempoCohortRequest,
      endUsers: formatCohortUsersString(tempoCohortRequest.endUsers).split(","),
      pmUsers: formatCohortUsersString(tempoCohortRequest.pmUsers).split(","),
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
    } as TempoCohortRequestInput;
    await publishNewTempoCohortRequestMutation({
      variables: { tempoCohortRequest: tempoCohortRequestInput },
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
        Publishes the new cohort to TEMPO for processing.
      </CustomTooltip>
      <Button size={"sm"} onClick={handlePublishing}>
        Deliver New Cohort to TEMPO
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
            Published cohort {tempoCohortRequest.cohortId} to TEMPO.
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
}
