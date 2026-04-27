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
  TempoCohortRequest,
  useAllBlockedCohortIdsQuery,
} from "../generated/graphql";
import { CohortBuilderPublishButton } from "./CohortBuilderPublishButton";

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
}

export interface CohortBuilderSample {
  primaryId: string;
  cmoSampleName: string;
  mafCompleteStatus: string;
  sampleCohortIds: string;
  initialPipelineRunDate: string | null;
  embargoDate: string | null;
}

export function CohortBuilderContainer({
  gridRef,
  selectedRowIds,
  setSelectedRowIds,
  onClose,
  tempoCohortRequest,
  setTempoCohortRequest,
}: CohortBuilderContainerProps) {
  const { data } = useAllBlockedCohortIdsQuery();

  function handleCohortBuilderClose() {
    onClose();
  }

  const tempoCohortSamplesData = selectedRowIds.map((v) => ({
    primaryId: v.primaryId,
    cmoSampleName: v.cmoSampleName,
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
            <CohortBuilderPublishButton
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
            <label className="col-form-label">
              {"End Users:  "}
              <Form.Control
                name="inputEndUsers"
                type="text"
                className="d-inline-block"
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
            </label>
          </Col>
        </Row>
        <Row
          className="d-flex align-items-center justify-content-left"
          style={{ padding: "5px" }}
        >
          <Col>
            <label className="col-form-label">
              {"PM Users:  "}
              <Form.Control
                name="inputPMUsers"
                type="text"
                className="d-inline-block"
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
            </label>
          </Col>
          <Col className="text-end">
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
