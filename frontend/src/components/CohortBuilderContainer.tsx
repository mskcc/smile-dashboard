import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { AgGridReact } from "ag-grid-react";
import { AgGridReact as AgGridReactType } from "ag-grid-react/lib/agGridReact";
import React, { RefObject, useEffect } from "react";
import { CohortBuilderDownloadButton } from "./CohortBuilderDownloadButton";
import {
  createCustomHeader,
  toolTipIcon,
  lockIcon,
} from "../configs/gridIcons";
import { formatCellDate, getAgGridDateColFilterConfigs } from "../utils/agGrid";
import { MomentInput } from "moment";
import { DeselectCohortSampleButton } from "./DeselectCohortSampleButton";
import {
  DashboardCohortValidationStatus,
  TempoCohortRequest,
  useAllBlockedCohortIdsQuery,
} from "../generated/graphql";
import { CohortBuilderPublishButton } from "./CohortBuilderPublishButton";
import { CohortBuilderDeliverUpdatesButton } from "./CohortBuilderDeliverUpdatesButton";
import {
  TUMOR_ONLY_CONTEXT,
  WES_SAMPLE_CONTEXT,
} from "../pages/samples/config";

interface CohortBuilderContainerProps {
  selectedRowIds: CohortBuilderSample[];
  setSelectedRowIds?: React.Dispatch<
    React.SetStateAction<CohortBuilderSample[]>
  >;
  onClose: () => void;
  gridRef: RefObject<AgGridReactType<any>>;
  tempoCohortRequest: TempoCohortRequest;
  setTempoCohortRequest: React.Dispatch<
    React.SetStateAction<TempoCohortRequest>
  >;
  isExistingCohort?: boolean;
  cohortValidationStatus?: DashboardCohortValidationStatus | null;
}

export interface CohortBuilderSample {
  primaryId: string;
  cmoSampleName: string;
  conflictReason?: string | null;
  unpairedReason?: string | null;
  tumorNotFound?: string | null;
  mafCompleteStatus: string;
  sampleCohortIds: string;
  initialPipelineRunDate: string | null;
  embargoDate: string | null;
}

// Blank/default form values for a not-yet-published cohort request
export const DEFAULT_TEMPO_COHORT_REQUEST: TempoCohortRequest = {
  cohortId: "",
  endUsers: "",
  pmUsers: "",
  projectTitle: "",
  projectSubtitle: "",
  samples: [],
  type: "investigator",
  status: "PROVISIONAL",
};

// Cohorts that can always be edited via the cohort builder regardless of status
const ALWAYS_EDITABLE_COHORT_IDS = ["MSKWESRP"];

export function isCohortEditable(tempoCohortRequest: TempoCohortRequest) {
  return (
    tempoCohortRequest.status === "PROVISIONAL" ||
    ALWAYS_EDITABLE_COHORT_IDS.includes(tempoCohortRequest.cohortId)
  );
}

// Record contexts needed for browsing/selecting samples for a cohort (WES + tumor-only)
export const COHORT_BUILDER_RECORD_CONTEXTS = [
  ...WES_SAMPLE_CONTEXT,
  ...TUMOR_ONLY_CONTEXT,
];

export function CohortBuilderContainer({
  gridRef,
  selectedRowIds,
  setSelectedRowIds,
  onClose,
  tempoCohortRequest,
  setTempoCohortRequest,
  isExistingCohort = false,
  cohortValidationStatus,
}: CohortBuilderContainerProps) {
  const { data } = useAllBlockedCohortIdsQuery();

  function handleCohortBuilderClose() {
    onClose();
  }

  const tempoCohortSamplesData = selectedRowIds.map((v) => ({
    primaryId: v.primaryId,
    cmoSampleName: v.cmoSampleName,
    conflictReason: v.conflictReason,
    unpairedReason: v.unpairedReason,
    tumorNotFound: v.tumorNotFound,
    mafCompleteStatus: v.mafCompleteStatus,
    sampleCohortIds: v.sampleCohortIds,
    initialPipelineRunDate: v.initialPipelineRunDate,
    embargoDate: v.embargoDate,
  }));

  useEffect(() => {
    if (!tempoCohortRequest.cohortId && data) {
      const blockedIds = data.allBlockedCohortIds;

      const makeNewCohortId = () => {
        let cohortId = "";
        while (cohortId.length < 6) {
          cohortId += Math.random().toString(36).slice(2);
        }
        return "CCS_" + cohortId.slice(0, 6).toUpperCase();
      };

      const generateNewCohortId = () => {
        let cohortId = makeNewCohortId();
        while (blockedIds.includes(cohortId)) {
          cohortId = makeNewCohortId();
        }
        return cohortId;
      };

      setTempoCohortRequest((prev) => ({
        ...prev,
        cohortId: generateNewCohortId(),
      }));
    }
  }, [data, tempoCohortRequest.cohortId, setTempoCohortRequest]);

  // adding new fields here also requires changes to DataGrid -> handleGridSelectionChanged to pass these fields
  const cohortBuilderColDefs = getCohortBuilderColDefs(
    gridRef,
    selectedRowIds,
    setSelectedRowIds
  );

  return (
    <div className="d-flex flex-column" style={{ height: "100%" }}>
      <Container
        fluid
        className="ag-theme-alpine flex-grow-1"
        style={{
          border: "1px solid #ccc",
          backgroundColor: "#f9f9f9",
        }}
      >
        <Row
          className="d-flex align-items-center justify-content-left"
          style={{ padding: "5px" }}
        >
          <Col>
            <label className="col-form-label">
              {"Cohort ID:  "}
              <Form.Control
                name="inputCohortId"
                type="text"
                className="d-inline-block"
                style={{ width: "300px" }}
                size="sm"
                readOnly={true}
                disabled={true}
                aria-label="Cohort ID"
                value={tempoCohortRequest.cohortId}
              />
            </label>
          </Col>
          <Col className="text-end">
            <CohortBuilderDownloadButton
              tempoCohortRequest={tempoCohortRequest}
              cohortSamples={tempoCohortSamplesData}
            />
          </Col>
        </Row>
        <Row
          className="d-flex align-items-center justify-content-left"
          style={{ padding: "5px" }}
        >
          <Col>
            <label className="col-form-label">
              {"Project Title:  "}
              <Form.Control
                name="inputProjectTitle"
                type="text"
                className="d-inline-block"
                style={{ width: "300px" }}
                size="sm"
                placeholder={`Project title (required)`}
                aria-label="Project title"
                disabled={isExistingCohort}
                value={tempoCohortRequest.projectTitle}
                onChange={(e: { currentTarget: { value: any } }) => {
                  setTempoCohortRequest({
                    ...tempoCohortRequest,
                    projectTitle: e.currentTarget.value,
                  });
                }}
              />
            </label>
          </Col>
          <Col className="text-end">
            {isExistingCohort ? (
              <CohortBuilderDeliverUpdatesButton
                tempoCohortRequest={tempoCohortRequest}
                cohortSamples={tempoCohortSamplesData}
              />
            ) : (
              <CohortBuilderPublishButton
                tempoCohortRequest={tempoCohortRequest}
                cohortSamples={tempoCohortSamplesData}
              />
            )}
          </Col>
        </Row>
        <Row
          className="d-flex align-items-center justify-content-left"
          style={{ padding: "5px" }}
        >
          <Col>
            <label className="col-form-label">
              {"Project Subtitle:  "}
              <Form.Control
                name="inputProjectSubtitle"
                type="text"
                className="d-inline-block"
                style={{ width: "300px" }}
                size="sm"
                placeholder={`Project subtitle (required)`}
                aria-label="Project subtitle"
                value={tempoCohortRequest.projectSubtitle}
                onChange={(e: { currentTarget: { value: any } }) => {
                  setTempoCohortRequest({
                    ...tempoCohortRequest,
                    projectSubtitle: e.currentTarget.value,
                  });
                }}
              />
            </label>
          </Col>
        </Row>
        <Row
          className="d-flex align-items-center justify-content-left"
          style={{ padding: "5px" }}
        >
          <Col>
            <label className="col-form-label">
              {"Project Type:  "}
              <Form.Select
                name="inputProjectType"
                className="d-inline-block"
                style={{ width: "300px" }}
                size="sm"
                placeholder={`Project Type (required)`}
                aria-label="Project Type"
                disabled={isExistingCohort}
                defaultValue={"investigator"}
                value={tempoCohortRequest.type}
                onChange={(e: { currentTarget: { value: any } }) => {
                  setTempoCohortRequest({
                    ...tempoCohortRequest,
                    type: e.currentTarget.value,
                  });
                }}
              >
                <option value="investigator">investigator</option>
                <option value="operational">operational</option>
              </Form.Select>
            </label>
          </Col>
        </Row>
        <Row
          className="d-flex align-items-center justify-content-left"
          style={{ padding: "5px" }}
        >
          <Col>
            <label className="col-form-label d-flex align-items-center flex-nowrap">
              <span className="flex-shrink-0">{"End Users:  "}</span>
              <Form.Control
                name="inputEndUsers"
                type="text"
                className="d-inline-block flex-shrink-0"
                style={{ width: "300px" }}
                size="sm"
                placeholder={`mskuser1,mskuser2,... (required)`}
                aria-label="End users"
                value={tempoCohortRequest.endUsers}
                onChange={(e: { currentTarget: { value: any } }) => {
                  setTempoCohortRequest({
                    ...tempoCohortRequest,
                    endUsers: e.currentTarget.value,
                  });
                }}
              />
              {!!cohortValidationStatus?.invalidEndUsers?.length && (
                <span style={{ color: "red" }} className="ms-2">
                  {`Invalid end user(s): ${cohortValidationStatus.invalidEndUsers.join(
                    ", "
                  )}`}
                </span>
              )}
            </label>
          </Col>
        </Row>
        <Row
          className="d-flex align-items-center justify-content-left"
          style={{ padding: "5px" }}
        >
          <Col>
            <label className="col-form-label d-flex align-items-center flex-nowrap">
              <span className="flex-shrink-0">{"PM Users:  "}</span>
              <Form.Control
                name="inputPMUsers"
                type="text"
                className="d-inline-block flex-shrink-0"
                style={{ width: "300px" }}
                size="sm"
                placeholder={`mskuser1,mskuser2,... (required)`}
                aria-label="PM users"
                value={tempoCohortRequest.pmUsers}
                onChange={(e: { currentTarget: { value: any } }) => {
                  setTempoCohortRequest({
                    ...tempoCohortRequest,
                    pmUsers: e.currentTarget.value,
                  });
                }}
              />
              {!!cohortValidationStatus?.invalidPmUsers?.length && (
                <span style={{ color: "red" }} className="ms-2">
                  {`Invalid PM user(s): ${cohortValidationStatus.invalidPmUsers.join(
                    ", "
                  )}`}
                </span>
              )}
            </label>
          </Col>
          <Col className="text-end col-auto">
            <span>{tempoCohortSamplesData.length} samples selected</span>
          </Col>
        </Row>

        <Row
          className="d-flex align-items-center justify-content-left"
          style={{ padding: "5px" }}
        >
          <div
            className="d-flex flex-column"
            style={{ height: "calc(50vh - 100px)" }}
          >
            <AgGridReact
              columnDefs={cohortBuilderColDefs}
              rowData={tempoCohortSamplesData}
              rowSelection={"multiple"}
              suppressRowClickSelection={true}
              serverSideInfiniteScroll={true}
            />
          </div>
        </Row>
        <Row
          className="d-flex align-items-center justify-content-left"
          style={{ padding: "5px" }}
        >
          <Col>
            <Button variant="secondary" onClick={handleCohortBuilderClose}>
              Close
            </Button>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

function getCohortBuilderColDefs(
  gridRef: React.RefObject<AgGridReact<any>>,
  selectedRowIds: CohortBuilderSample[],
  setSelectedRowIds:
    | React.Dispatch<React.SetStateAction<CohortBuilderSample[]>>
    | undefined
) {
  return [
    {
      headerName: "Action",
      cellRenderer: (params: any) => (
        <DeselectCohortSampleButton
          gridRef={gridRef}
          data={params.data}
          selectedRowIds={selectedRowIds}
          setSelectedRowIds={setSelectedRowIds}
        />
      ),
      width: 135,
      resizable: true,
      headerTooltip: "Remove sample from cohort",
      headerComponentParams: createCustomHeader(toolTipIcon),
    },
    {
      headerName: "Primary ID",
      field: "primaryId",
      sortable: true,
      filter: true,
      resizable: true,
    },
    {
      headerName: "CMO Sample Name",
      field: "cmoSampleName",
      resizable: true,
    },
    {
      headerName: "Conflicts",
      field: "conflictReason",
      resizable: true,
      cellStyle: { color: "red" },
    },
    {
      headerName: "Unpaired",
      field: "unpairedReason",
      resizable: true,
      cellStyle: { color: "red" },
    },
    {
      headerName: "Tumor Not Found",
      field: "tumorNotFound",
      resizable: true,
      cellStyle: { color: "red" },
      valueFormatter: (params: { value: string | null | undefined }) =>
        params.value ? "Tumor not found" : "",
    },
    {
      field: "mafCompleteStatus",
      headerName: "MAF Complete Status (Data Eligible for Sharing)",
      headerTooltip:
        "Indicates whether MAF generation was successful. Valid for tumor samples only. For the MSK WES Repository cohort we only included samples with a MAF Complete Status of 'Pass' as well as QC Complete Result of 'Pass' or 'Warn'",
      headerComponentParams: createCustomHeader(lockIcon + toolTipIcon),
      width: 280,
      wrapHeaderText: true,
    },
    {
      headerName: "Sample Cohort IDs",
      field: "sampleCohortIds",
      resizable: true,
    },
    {
      field: "initialPipelineRunDate",
      headerName: "Initial Pipeline Run Date",
      headerTooltip:
        "Date the sample is delivered in a cohort for the first time",
      headerComponentParams: createCustomHeader(lockIcon + toolTipIcon),
      valueFormatter: (params: { value: MomentInput }) =>
        formatCellDate(params.value) ?? "",
      ...getAgGridDateColFilterConfigs(),
      width: 250,
    },
    {
      field: "embargoDate",
      headerName: "Embargo Date",
      headerTooltip:
        "Calculated date; 18 months after Initial Pipeline Run Date",
      headerComponentParams: createCustomHeader(lockIcon + toolTipIcon),
      valueFormatter: (params: { value: MomentInput }) => {
        return formatCellDate(params.value) ?? "";
      },
      ...getAgGridDateColFilterConfigs({
        // embargoDate is 18 months ahead of initialPipelineRunDate
        maxValidYear: new Date().getFullYear() + 2,
      }),
    },
  ];
}
