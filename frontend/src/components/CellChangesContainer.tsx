import { Button, Form, Modal } from "react-bootstrap";
import { AgGridReact } from "ag-grid-react";
import { RecordChange } from "../types/shared";
import { Dispatch, SetStateAction, useState } from "react";
import { NO_CHANGELOG_WARNING } from "../configs/shared";

function buildUpdateModalColumnDefs(fieldToHeaderName?: (f: string) => string) {
  return [
    { field: "recordId", rowGroup: true, hide: true },
    {
      field: "fieldName",
      headerName: "Column",
      valueFormatter: fieldToHeaderName
        ? (p: { value: string }) => fieldToHeaderName(p.value)
        : undefined,
    },
    { field: "oldValue" },
    { field: "newValue" },
  ];
}

const autoGroupColumnDef = {
  headerName: "Primary Id",
  field: "recordId",
};

interface CellChangesContainerProps {
  isSampleLevelChanges: boolean;
  changes: Array<RecordChange>;
  fieldToHeaderName?: (field: string) => string;
  cellChangesHandlers: {
    handleDiscardChanges: () => void;
    handleConfirmUpdates: () => void;
    handleSubmitUpdates: (author: string, reasonForChange: string) => void;
    showUpdateModal: boolean;
    setShowUpdateModal: Dispatch<SetStateAction<boolean>>;
  };
}

export function CellChangesContainer({
  changes,
  cellChangesHandlers: {
    handleDiscardChanges,
    handleConfirmUpdates,
    handleSubmitUpdates,
    showUpdateModal,
    setShowUpdateModal,
  },
  isSampleLevelChanges,
  fieldToHeaderName,
}: CellChangesContainerProps) {
  const [changelog, setChangelog] = useState("");
  const [authorChangelog, setAuthorChangelog] = useState("");

  if (isSampleLevelChanges) {
    autoGroupColumnDef.headerName = "Primary ID";
  } else {
    autoGroupColumnDef.headerName = "Cohort ID";
  }

  const disableSubmitUpdates =
    isSampleLevelChanges &&
    (changelog.trim() === "" || authorChangelog.trim() === "");

  function handleUpdateModalHide() {
    setShowUpdateModal(false);
  }
  return (
    <>
      <div className="d-flex align-items-center gap-1">
        <Button
          className="btn btn-secondary"
          onClick={handleDiscardChanges}
          size="sm"
        >
          Discard Changes
        </Button>{" "}
        <Button
          className="btn btn-success"
          onClick={handleConfirmUpdates}
          size="sm"
        >
          Confirm Updates
        </Button>
      </div>

      {showUpdateModal && (
        <Modal
          show={true}
          size="lg"
          centered
          onHide={handleUpdateModalHide}
          className="overlay"
        >
          <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
              Confirm your changes
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className="ag-theme-alpine" style={{ height: 350 }}>
              <AgGridReact
                rowData={changes}
                columnDefs={buildUpdateModalColumnDefs(fieldToHeaderName)}
                groupRemoveSingleChildren={true}
                autoGroupColumnDef={autoGroupColumnDef}
                groupDefaultExpanded={1}
                onFirstDataRendered={(e) => e.columnApi.autoSizeAllColumns()}
              />
            </div>
            {isSampleLevelChanges && (
              <Form.Group className="d-flex align-items-center mt-3">
                <Form.Label className="mb-0 me-2 text-nowrap">
                  Reason for Change:
                </Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  className="me-3"
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                />
                <Form.Label className="mb-0 me-2 text-nowrap">
                  Author:
                </Form.Label>
                <Form.Control
                  style={{ width: "30%" }}
                  type="text"
                  size="sm"
                  value={authorChangelog}
                  onChange={(e) => setAuthorChangelog(e.target.value)}
                />
              </Form.Group>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button
              className="btn btn-secondary"
              onClick={handleUpdateModalHide}
            >
              Cancel
            </Button>
            <Button
              className="btn btn-success"
              onClick={() => handleSubmitUpdates(authorChangelog, changelog)}
              disabled={disableSubmitUpdates}
            >
              Submit Updates
            </Button>
            {disableSubmitUpdates && (
              <span className="changelog-alert">{NO_CHANGELOG_WARNING}</span>
            )}
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
}
