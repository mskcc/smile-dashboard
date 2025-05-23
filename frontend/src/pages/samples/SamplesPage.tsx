import SamplesList from "../../components/SamplesList";
import {
  DbGapPhenotypeColumns,
  readOnlyAccessSampleColDefs,
  readOnlyWesSampleColDefs,
  accessSampleColDefs,
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
import { ColDef } from "ag-grid-community";
import {
  DashboardRecordContext,
  DashboardSample,
} from "../../generated/graphql";

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

function useFilteredView(): {
  columnDefs: ColDef<DashboardSample>[];
  setColumnDefs: (columnDefs: ColDef<DashboardSample>[]) => void;
  sampleContexts: Array<DashboardRecordContext> | undefined;
  filterButtonTitle: string;
  filterButtonColorVariant: ButtonVariant;
} {
  const [columnDefs, setColumnDefs] = useState(combinedSampleDetailsColumns);
  if (_.isEqual(columnDefs, readOnlyWesSampleColDefs)) {
    return {
      columnDefs: readOnlyWesSampleColDefs,
      setColumnDefs,
      sampleContexts: WES_SAMPLE_CONTEXT,
      filterButtonTitle: "View WES samples",
      filterButtonColorVariant: "success",
    };
  }
  if (_.isEqual(columnDefs, readOnlyAccessSampleColDefs)) {
    return {
      columnDefs: readOnlyAccessSampleColDefs,
      setColumnDefs,
      sampleContexts: ACCESS_SAMPLE_CONTEXT,
      filterButtonTitle: "View ACCESS samples",
      filterButtonColorVariant: "success",
    };
  }
  // View all samples
  return {
    columnDefs: combinedSampleDetailsColumns,
    setColumnDefs,
    sampleContexts: undefined,
    filterButtonTitle: "Filter samples",
    filterButtonColorVariant: "outline-secondary",
  };
}

export default function SamplesPage() {
  const {
    columnDefs,
    setColumnDefs,
    sampleContexts,
    filterButtonTitle,
    filterButtonColorVariant,
  } = useFilteredView();

  return (
    <SamplesList
      columnDefs={columnDefs}
      sampleContexts={sampleContexts}
      customToolbarUI={
        <DropdownButton
          size="sm"
          title={filterButtonTitle}
          variant={filterButtonColorVariant}
        >
          <Dropdown.Item
            onClick={() => setColumnDefs(combinedSampleDetailsColumns)}
          >
            View all samples
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => setColumnDefs(readOnlyWesSampleColDefs)}
          >
            View WES samples
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => setColumnDefs(readOnlyAccessSampleColDefs)}
          >
            View ACCESS samples
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
