import { Button } from "react-bootstrap";
import jsdownload from "js-file-download";
import { CohortBuilderSample } from "./CohortBuilderContainer";
import { useState } from "react";
import { CustomTooltip } from "./CustomToolTip";
import { InfoOutlined } from "@material-ui/icons";
import { formatCohortUsersString } from "../utils/formatCohortUsersString";
import { TempoCohortRequest } from "../generated/graphql";
import { validateCohortBuilderInput } from "../utils/validateCohortBuilderInput";

interface CohortBuilderDownloadButtonProps {
  tempoCohortRequest: TempoCohortRequest;
  cohortSamples: CohortBuilderSample[];
}

export function CohortBuilderDownloadButton({
  tempoCohortRequest,
  cohortSamples,
}: CohortBuilderDownloadButtonProps) {
  // eslint-disable-next-line no-unused-vars
  const [isDownloading, setIsDownloading] = useState(false);

  function buildCohortFileContents(
    data: TempoCohortRequest,
    samples: CohortBuilderSample[]
  ): string {
    let contents = `#endUsers:${formatCohortUsersString(data.endUsers)}\n`;
    contents += `#pmUsers:${formatCohortUsersString(data.pmUsers)}\n`;
    contents += `#projectTitle:${data.projectTitle}\n`;
    contents += `#projectSubtitle:${data.projectSubtitle}\n`;
    contents += `#TUMOR_ID\n`;
    samples.forEach((sample) => {
      contents += `${sample.cmoSampleName}\n`;
    });
    return contents;
  }

  function handleDownload() {
    if (!validateCohortBuilderInput(tempoCohortRequest, cohortSamples)) {
      return;
    }
    setIsDownloading(true);
    const fileContents = buildCohortFileContents(
      tempoCohortRequest,
      cohortSamples
    );
    jsdownload(fileContents, `${tempoCohortRequest.cohortId}.cohort.txt`);
    setIsDownloading(false);
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
        Downloads a .cohort.txt file formatted for uploading to TEMPO for
        processing.
      </CustomTooltip>
      <Button size={"sm"} onClick={handleDownload}>
        Download New TEMPO Cohort File
      </Button>
    </>
  );
}
