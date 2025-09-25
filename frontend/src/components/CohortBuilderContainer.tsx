import { Button, Col, Container, Form, Modal, Row } from "react-bootstrap";
import { AgGridReact } from "ag-grid-react";
import React, { useState } from "react";
import { CohortBuilderDownloadButton } from "./CohortBuilderDownloadButton";
import { RemoveCircleOutline } from "@material-ui/icons";
import {
  createCustomHeader,
  toolTipIcon,
  lockIcon,
} from "../configs/gridIcons";
import { formatCellDate, getAgGridDateColFilterConfigs } from "../utils/agGrid";
import { MomentInput } from "moment";

interface CohortBuilderContainerProps {
  selectedRowIds: CohortBuilderSample[];
  setSelectedRowIds?: React.Dispatch<
    React.SetStateAction<CohortBuilderSample[]>
  >;
  showSelectedPopup: boolean;
  setShowSelectedPopup: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface CohortBuilderFormMetadata {
  cohortId: string;
  endUsers: string[];
  pmUsers: string[];
  projectTitle: string;
  projectSubtitle: string;
}

export interface CohortBuilderSample {
  primaryId: string;
  cmoSampleName: string;
  sampleCohortIds: string;
  initialPipelineRunDate: string | null;
  embargoDate: string | null;
}
export function CohortBuilderContainer({
  selectedRowIds,
  setSelectedRowIds,
  showSelectedPopup,
  setShowSelectedPopup,
}: CohortBuilderContainerProps) {
  // Custom button for the Action column
  const CustomButtonComponent = (props: {
    data: any;
    selectedRowIds: CohortBuilderSample[];
    setSelectedRowIds?: React.Dispatch<
      React.SetStateAction<CohortBuilderSample[]>
    >;
  }) => {
    const handleClick = () => {
      console.log("X button clicked for row:", props.data);
      const filteredRowIds = props.selectedRowIds.filter(
        (sample) => sample.primaryId !== props.data.primaryId
      );
      if (props.setSelectedRowIds) {
        props.setSelectedRowIds(filteredRowIds);
      }
    };

    return (
      <Button
        style={{ background: "transparent", border: "none", padding: 0 }}
        onClick={handleClick}
        title="Remove from cohort"
      >
        <RemoveCircleOutline
          style={{ fontSize: 18, color: "grey", padding: 0 }}
        />
      </Button>
    );
  };

  function handleCohortBuilderClose() {
    setShowSelectedPopup(true);
    if (setSelectedRowIds) {
      setSelectedRowIds([]);
    }
  }

  const formattedRowData = selectedRowIds.map((v) => ({
    primaryId: v.primaryId,
    cmoSampleName: v.cmoSampleName,
    sampleCohortIds: v.sampleCohortIds,
    initialPipelineRunDate: v.initialPipelineRunDate,
    embargoDate: v.embargoDate,
  }));

  const [cohortBuilderData, setCohortBuilderData] =
    useState<CohortBuilderFormMetadata>({
      cohortId: "",
      endUsers: [],
      pmUsers: [],
      projectTitle: "",
      projectSubtitle: "",
    });

  // addning new fields here also requires changes to DataGrid -> handleGridSelectionChanged to pass these fields
  const cohortBuilderColDefs = [
    {
      headerName: "Action",
      cellRenderer: (params: any) => (
        <CustomButtonComponent
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
        // console.log("Formatting date:", params);
        return formatCellDate(params.value) ?? "";
      },
      ...getAgGridDateColFilterConfigs({
        // embargoDate is 18 months ahead of initialPipelineRunDate
        maxValidYear: new Date().getFullYear() + 2,
      }),
    },
  ];

  return (
    <div className="d-flex flex-column" style={{ height: "calc(15vh - 10px)" }}>
      <Container
        className="ag-theme-alpine flex-grow-1"
        style={{
          border: "1px solid #ccc",
          borderRadius: "5px",
          backgroundColor: "#f9f9f9",
        }}
      >
        {/* Eventually the cohort ID will be auto-assigned. This first form component will need to be changed to a read-only field */}
        <Row
          className="d-flex align-items-center justify-content-left"
          style={{ padding: "5px" }}
        >
          <Col>
            <label className="col-form-label">
              {"Cohort ID:  "}
              <Form.Control
                required
                type="text"
                className="d-inline-block"
                style={{ width: "300px" }}
                size="sm"
                placeholder={`Cohort ID`}
                aria-label="Cohort ID"
                value={cohortBuilderData.cohortId}
                onChange={(e: { currentTarget: { value: any } }) => {
                  setCohortBuilderData({
                    ...cohortBuilderData,
                    cohortId: e.currentTarget.value,
                  });
                }}
              />
            </label>
          </Col>
          <Col className="text-end">
            <CohortBuilderDownloadButton
              cohortBuilderData={cohortBuilderData}
              cohortSamples={formattedRowData}
            />
          </Col>
        </Row>
        <Row
          className="d-flex align-items-center justify-content-left"
          style={{ padding: "5px" }}
        >
          <Col>
            <label className="col-form-label">
              {"Project title:  "}
              <Form.Control
                type="text"
                className="d-inline-block"
                style={{ width: "300px" }}
                size="sm"
                placeholder={`Project title`}
                aria-label="Project title"
                value={cohortBuilderData.projectTitle}
                onChange={(e: { currentTarget: { value: any } }) => {
                  setCohortBuilderData({
                    ...cohortBuilderData,
                    projectTitle: e.currentTarget.value,
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
              {"Project subtitle:  "}
              <Form.Control
                type="text"
                className="d-inline-block"
                style={{ width: "300px" }}
                size="sm"
                placeholder={`Project subtitle`}
                aria-label="Project subtitle"
                value={cohortBuilderData.projectSubtitle}
                onChange={(e: { currentTarget: { value: any } }) => {
                  setCohortBuilderData({
                    ...cohortBuilderData,
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
              {"End users:  "}
              <Form.Control
                type="text"
                className="d-inline-block"
                style={{ width: "300px" }}
                size="sm"
                placeholder={`End users`}
                aria-label="End users"
                value={cohortBuilderData.endUsers}
                onChange={(e: { currentTarget: { value: any } }) => {
                  setCohortBuilderData({
                    ...cohortBuilderData,
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
              {"PM users:  "}
              <Form.Control
                type="text"
                className="d-inline-block"
                style={{ width: "300px" }}
                size="sm"
                placeholder={`PM users`}
                aria-label="PM users"
                value={cohortBuilderData.pmUsers}
                onChange={(e: { currentTarget: { value: any } }) => {
                  setCohortBuilderData({
                    ...cohortBuilderData,
                    pmUsers: e.currentTarget.value,
                  });
                }}
              />
            </label>
          </Col>
        </Row>

        {console.log("\n\n\nROW DATA FOR POPUP:", formattedRowData)}
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
              rowData={formattedRowData}
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
      <br />
    </div>
  );
}
