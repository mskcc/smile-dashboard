import { Button } from "react-bootstrap";
import jsdownload from "js-file-download";
import {
  CohortBuilderFormMetadata,
  CohortBuilderSample,
} from "./CohortBuilderContainer";
import { useState } from "react";
import { CustomTooltip } from "./CustomToolTip";
import InfoIcon from "@material-ui/icons/InfoOutlined";

interface CohortBuilderDownloadButtonProps {
  cohortBuilderData: CohortBuilderFormMetadata;
  cohortSamples: CohortBuilderSample[];
}

export function CohortBuilderDownloadButton({
  cohortBuilderData,
  cohortSamples,
}: CohortBuilderDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

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

  function handleDownload() {
    setIsDownloading(true);
    const fileContents = buildCohortFileContents(
      cohortBuilderData,
      cohortSamples
    );
    jsdownload(fileContents, `${cohortBuilderData.cohortId}.cohort.txt`);
    setIsDownloading(false);
  }

  return (
    <>
      <CustomTooltip
        icon={
          <InfoIcon
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
    </>
  );
}
