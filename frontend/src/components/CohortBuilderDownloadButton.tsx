import { Button, Toast, ToastContainer } from "react-bootstrap";
import jsdownload from "js-file-download";
import {
  CohortBuilderFormMetadata,
  CohortBuilderSample,
} from "./CohortBuilderContainer";
import { useState } from "react";
import { CustomTooltip } from "./CustomToolTip";
import { InfoOutlined, RemoveCircleOutline } from "@material-ui/icons";

interface CohortBuilderDownloadButtonProps {
  cohortBuilderData: CohortBuilderFormMetadata;
  cohortSamples: CohortBuilderSample[];
}

export function CohortBuilderDownloadButton({
  cohortBuilderData,
  cohortSamples,
}: CohortBuilderDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const toggleShow = () => setShowToast(!showToast);

  function buildCohortFileContents(
    data: CohortBuilderFormMetadata,
    samples: CohortBuilderSample[]
  ): string {
    let contents = `#endUsers:${data.endUsers}\n`;
    contents += `#pmUsers:${data.pmUsers}\n`;
    contents += `#projectTitle:${data.projectTitle}\n`;
    contents += `#projectSubtitle:${data.projectSubtitle}\n`;
    contents += `#TUMOR_ID\n`;
    samples.forEach((sample) => {
      contents += `${sample.primaryId}\n`;
    });
    return contents;
  }

  function handleToastShow() {
    setTimeout(() => setShowToast(true), 3000);
  }

  function handleInputValidation() {
    // Simple validation: check required fields are filled and at least one sample
    if (
      cohortBuilderData.cohortId.trim() === "" ||
      cohortBuilderData.projectTitle.trim() === "" ||
      cohortBuilderData.projectSubtitle.trim() === "" ||
      cohortBuilderData.endUsers.length === 0 ||
      cohortBuilderData.pmUsers.length === 0
    ) {
      alert("Missing one or more required fields.");
      return false;
    }
    if (cohortSamples.length === 0) {
      alert("Cohort must contain at least one sample.");
      return false;
    }
    return true;
  }

  function handleDownload() {
    if (!handleInputValidation()) {
      return;
    }
    setIsDownloading(true);
    const fileContents = buildCohortFileContents(
      cohortBuilderData,
      cohortSamples
    );
    jsdownload(fileContents, `${cohortBuilderData.cohortId}.cohort.txt`);
    setIsDownloading(false);
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
        Downloads a .cohort.txt file formatted for TEMPO cohort delivery and
        auto-submits to TEMPO pipeline.
      </CustomTooltip>
      <Button
        size={"sm"}
        onClick={handleDownload}
        // disabled={!cohortBuilderData}
      >
        Deliver & Download New TEMPO Cohort
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
            Published cohort {cohortBuilderData.cohortId} to TEMPO.
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
}
