import { DashboardCohort } from "../../generated/graphql";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { Button } from "react-bootstrap";
import {
  getAgGridBooleanColFilterConfigs,
  getAgGridDateColFilterConfigs,
} from "../../utils/agGrid";
import { formatCellDate } from "../../utils/agGrid";
import { DownloadOption } from "../../hooks/useDownload";
import { BuildDownloadOptionsParamsBase } from "../../types/shared";
import {
  createCustomHeader,
  lockIcon,
  toolTipIcon,
  LoadingIcon,
} from "../../configs/gridIcons";
import { buildFieldToHeaderName } from "../../utils/fieldToHeaderName";
import { setupEditableFields } from "../../utils/setupEditableFields";
import { Check } from "@material-ui/icons";
import { WarningIconButton } from "../../components/WarningIconButton";

type BuildDownloadOptionsParams = BuildDownloadOptionsParamsBase & {
  // Put additional parameters here if needed
};

export function buildDownloadOptions({
  getCurrentData,
  currentColDefs: currentColumnDefs,
}: BuildDownloadOptionsParams): Array<DownloadOption> {
  return [
    {
      buttonLabel: "Download as TSV",
      files: [
        {
          columnDefsForDownload: currentColumnDefs,
          dataGetter: getCurrentData,
        },
      ],
    },
  ];
}

export const cohortColDefs: ColDef<DashboardCohort>[] = [
  {
    headerName: "View Samples",
    cellRenderer: (params: ICellRendererParams) => {
      return (
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => {
            if (params.data.cohortId !== undefined) {
              params.context.navigateFunction(
                `/cohorts/${params.data.cohortId}`
              );
            }
          }}
        >
          View
        </Button>
      );
    },
    sortable: false,
  },
  {
    field: "cohortId",
    headerName: "Cohort ID",
  },
  {
    field: "status",
    headerName: "Status",
    headerTooltip:
      "The status of the cohort in TEMPO (e.g. PROVISONAL, PASS, FAIL)",
    headerComponentParams: createCustomHeader(lockIcon + toolTipIcon),
    cellRenderer: (params: ICellRendererParams<DashboardCohort>) => {
      if (!params.data) return null;
      if ((params.data as any).revisable === false) {
        return <LoadingIcon />;
      }
      return params.value ?? null;
    },
  },
  {
    headerName: "Validation Status",
    headerTooltip:
      "Indicates whether the cohort passes all validation checks. Click the warning icon to edit the cohort and resolve validation errors.",
    headerComponentParams: createCustomHeader(lockIcon + toolTipIcon),
    cellRenderer: (params: ICellRendererParams<DashboardCohort>) => {
      if (!params.data) return null;
      const passesAllChecks = params.data.cohortValidationStatus
        ? params.data.cohortValidationStatus.passesAllChecks
        : true;

      if (!passesAllChecks) {
        return (
          <WarningIconButton
            onClick={() => {
              if (params.data?.cohortId !== undefined) {
                params.context.navigateFunction(
                  `/cohorts/${params.data.cohortId}`,
                  { state: { openCohortBuilder: true } }
                );
              }
            }}
            tooltipText="Click to edit cohort and resolve validation errors"
          />
        );
      }
      return <Check />;
    },
    sortable: false,
  },
  {
    field: "totalSampleCount",
    headerName: "# Samples",
  },
  {
    field: "billed",
    headerName: "Billed",
    ...getAgGridBooleanColFilterConfigs(),
  },
  {
    field: "initialCohortDeliveryDate",
    headerName: "Initial Cohort Delivery Date",
    valueFormatter: (params) => formatCellDate(params.value) ?? "",
    ...getAgGridDateColFilterConfigs(),
  },
  {
    field: "importDate",
    headerName: "Last Date Updated",
    valueFormatter: (params) => formatCellDate(params.value) ?? "",
    ...getAgGridDateColFilterConfigs(),
  },
  {
    field: "pipelineVersion",
    headerName: "TEMPO Pipeline Version",
  },
  {
    field: "endUsers",
    headerName: "End Users",
    editable: true,
    maxWidth: 240,
  },
  {
    field: "pmUsers",
    headerName: "PM Users",
    editable: true,
  },
  {
    field: "piName",
    headerName: "PI Name",
    editable: true,
  },
  {
    field: "projectTitle",
    headerName: "Project Title",
  },
  {
    field: "projectSubtitle",
    headerName: "Project Subtitle",
  },
  {
    field: "projectsIncluded",
    headerName: "Projects Included",
    headerTooltip:
      "The list of request IDs for the samples included in this cohort",
    headerComponentParams: createCustomHeader(lockIcon + toolTipIcon),
    valueFormatter: (params) =>
      Array.isArray(params.value) ? params.value.join(", ") : "",
  },
  {
    field: "type",
    headerName: "Type",
  },
];

const editableCohortFields = new Set(["endUsers", "pmUsers", "piName"]);

export function setupEditableCohortFields(
  cohortColDefs: Array<ColDef>,
  editableFieldsList: Set<string>
) {
  setupEditableFields({
    colDefs: cohortColDefs,
    editableFieldsList,
    getRecordId: (data) => data?.cohortId,
  });
}

setupEditableCohortFields(cohortColDefs, editableCohortFields);

export const fieldToHeaderName = buildFieldToHeaderName(cohortColDefs);
