import { Button, Container, Form, Modal, Row } from "react-bootstrap";
import { AgGridReact } from "ag-grid-react";
import React, { useState } from "react";

interface CohortBuilderContainerProps {
  selectedRowIds: CohortBuilderSample[];
  setSelectedRowIds?: React.Dispatch<
    React.SetStateAction<CohortBuilderSample[]>
  >;
  showSelectedPopup: boolean;
  setShowSelectedPopup: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface CohortBuilderFormMetadata {
  endusers: string[];
  pmUsers: string[];
  projectTitle: string;
  projectSubtitle: string;
  cohortBuilderSamples: CohortBuilderSample[];
}

export interface CohortBuilderSample {
  primaryId: string;
  cmoSampleName: string;
  sampleCohortIds: string;
}

const cohortBuilderColDefs = [
  {
    headerName: "primaryId",
    field: "primaryId",
    sortable: true,
    filter: true,
  },
  {
    headerName: "cmoSampleName",
    field: "cmoSampleName",
  },
  {
    headerName: "sampleCohortIds",
    field: "sampleCohortIds",
  },
];

export function CohortBuilderContainer({
  selectedRowIds,
  setSelectedRowIds,
  showSelectedPopup,
  setShowSelectedPopup,
}: CohortBuilderContainerProps) {
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
  }));
  const [cohortBuilderData, setCohortBuilderData] =
    useState<CohortBuilderFormMetadata>({
      endusers: [],
      pmUsers: [],
      projectTitle: "",
      projectSubtitle: "",
      cohortBuilderSamples: [],
    });

  return (
    <Container
      className="ag-theme-alpine flex-grow-1"
      style={{
        border: "1px solid #ccc",
        borderRadius: "5px",
        padding: "10px",
        backgroundColor: "#f9f9f9",
        height: "400px",
      }}
    >
      <Row
        className="d-flex align-items-center justify-content-left"
        style={{ padding: "5px" }}
      >
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
      </Row>
      <Row
        className="d-flex align-items-center justify-content-left"
        style={{ padding: "5px" }}
      >
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
      </Row>
      <Row
        className="d-flex align-items-center justify-content-left"
        style={{ padding: "5px" }}
      >
        <label className="col-form-label">
          {"End users:  "}
          <Form.Control
            type="text"
            className="d-inline-block"
            style={{ width: "300px" }}
            size="sm"
            placeholder={`End users`}
            aria-label="End users"
            value={cohortBuilderData.endusers}
            onChange={(e: { currentTarget: { value: any } }) => {
              setCohortBuilderData({
                ...cohortBuilderData,
                endusers: e.currentTarget.value,
              });
            }}
          />
        </label>
      </Row>
      <Row
        className="d-flex align-items-center justify-content-left"
        style={{ padding: "5px" }}
      >
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
      </Row>

      {console.log("\n\n\nROW DATA FOR POPUP:", selectedRowIds)}
      <br />
      <AgGridReact
        columnDefs={cohortBuilderColDefs}
        rowData={formattedRowData}
      />
      <br />
      <Button variant="secondary" onClick={handleCohortBuilderClose}>
        Close
      </Button>
    </Container>
  );
}
