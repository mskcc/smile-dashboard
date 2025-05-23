import SamplesList from "../../components/SamplesList";
import {
  DbGapPhenotypeColumns,
  ReadOnlyCohortSampleDetailsColumns,
  combinedSampleDetailsColumns,
} from "../../shared/helpers";
import { useState } from "react";
import {
  Button,
  Dropdown,
  DropdownButton,
  DropdownButtonProps,
} from "react-bootstrap";
import _ from "lodash";
import { CustomTooltip } from "../../shared/components/CustomToolTip";
import InfoIcon from "@material-ui/icons/InfoOutlined";
import { ButtonVariant } from "react-bootstrap/esm/types";

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

  const filterButtonTitle = _.isEqual(columnDefs, combinedSampleDetailsColumns)
    ? "Filter sample views"
    : "View WES samples";

  const filterButtonColorVariant: ButtonVariant = _.isEqual(
    columnDefs,
    combinedSampleDetailsColumns
  )
    ? "outline-secondary"
    : "success";

  return (
    <SamplesList
      columnDefs={columnDefs}
      sampleContexts={sampleContexts}
      customToolbarUI={
        <DropdownButton
          title={filterButtonTitle}
          size="sm"
          variant={filterButtonColorVariant}
        >
          <Dropdown.Item
            onClick={() => setColumnDefs(combinedSampleDetailsColumns)}
          >
            View all samples
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => setColumnDefs(ReadOnlyCohortSampleDetailsColumns)}
          >
            View WES samples
          </Dropdown.Item>
        </DropdownButton>
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
