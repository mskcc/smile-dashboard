import SamplesList from "../../components/SamplesList";
import {
  DbGapPhenotypeColumns,
  ReadOnlyCohortSampleDetailsColumns,
  combinedSampleDetailsColumns,
} from "../../shared/helpers";
import { useState } from "react";
import { Button } from "react-bootstrap";
import _ from "lodash";
import { CustomTooltip } from "../../shared/components/CustomToolTip";
import InfoIcon from "@material-ui/icons/InfoOutlined";

const WES_SAMPLE_CONTEXT = [
  {
    fieldName: "genePanel",
    values: [
      "Agilent_51MB",
      "Agilent_v4_51MB_Human",
      "CustomCapture",
      "IDT_Exome_v1_FP",
      "IDT_Exome_V1_IMPACT468",
      "WES_Human",
      "WholeExomeSequencing",
    ],
  },
];

const ACCESS_SAMPLE_CONTEXT = [
  {
    fieldName: "genePanel",
    values: [
      "ACCESS129",
      "ACCESS146",
      "ACCESS148",
      "ACCESS-Heme",
      "ACCESS-HEME-115",
      "HC_ACCESS",
      "HC_Custom",
      "MSK-ACCESS_v1",
      "MSK-ACCESS_v2",
      "HC_CMOCH",
      "CMO-CH",
    ],
  },
  {
    fieldName: "baitSet",
    values: [
      "MSK-ACCESS-v1_0-probesAllwFP",
      "MSK-ACCESS-v1_0-probesAllwFP_GRCh38",
      "MSK-ACCESS-v1_0-probesAllwFP_hg19_sort_BAITS",
      "MSK-ACCESS-v1_0-probesAllwFP_hg37_sort-BAITS",
      "MSK-ACCESS-v2_0-probesAllwFP",
      "ACCESS_HEME_MN1",
      "ACCESS129",
      "ACCESS146",
      "ACCESS148",
      "ACCESS-HEME-115",
      "CMO-CH",
      "MSK-CH",
    ],
  },
];

export default function SamplesPage() {
  const [columnDefs, setColumnDefs] = useState(combinedSampleDetailsColumns);

  const sampleContexts = _.isEqual(columnDefs, combinedSampleDetailsColumns)
    ? undefined
    : WES_SAMPLE_CONTEXT;

  return (
    <SamplesList
      columnDefs={columnDefs}
      sampleContexts={sampleContexts}
      customToolbarUI={
        <>
          <CustomTooltip
            icon={<InfoIcon style={{ fontSize: 18, color: "grey" }} />}
          >
            These tabs change the data displayed in the table. "View all
            samples" shows all data and columns, including those of
            SampleMetadata and WES samples.
          </CustomTooltip>{" "}
          <Button
            onClick={() => {
              setColumnDefs(combinedSampleDetailsColumns);
            }}
            size="sm"
            variant="outline-secondary"
            active={_.isEqual(columnDefs, combinedSampleDetailsColumns)}
          >
            View all samples
          </Button>{" "}
          <Button
            onClick={() => {
              setColumnDefs(ReadOnlyCohortSampleDetailsColumns);
            }}
            size="sm"
            variant="outline-secondary"
            active={_.isEqual(columnDefs, ReadOnlyCohortSampleDetailsColumns)}
          >
            View WES samples
          </Button>
        </>
      }
      exportDropdownItems={[
        {
          label: "Generate Phenotype files for dbGaP",
          columnDefs: DbGapPhenotypeColumns,
        },
      ]}
    />
  );
}
