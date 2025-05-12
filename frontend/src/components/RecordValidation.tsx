import { Dispatch, SetStateAction, useState } from "react";
import styles from "./records.module.scss";
import { DashboardRequest } from "../generated/graphql";
import { CustomTooltip } from "../shared/components/CustomToolTip";
import WarningIcon from "@material-ui/icons/Warning";
import { Button, Modal } from "react-bootstrap";
import { ColDef } from "ag-grid-community";
import {
  defaultColDef,
  MISSING_STATUS,
  parseValidationReport,
  StatusItem,
} from "../shared/components/StatusToolTip";
import { AgGridReact } from "ag-grid-react";

const validationColDefs: ColDef[] = [
  {
    field: "item",
    headerName: "Item",
  },
  {
    field: "description",
    headerName: "Description",
  },
  {
    field: "actionItem",
    headerName: "Action Item",
  },
  {
    field: "responsibleParty",
    headerName: "Responsible Party",
  },
];

export function RecordValidation({
  validationStatus,
  validationReport,
  errorReportName,
}: {
  validationStatus: DashboardRequest["validationStatus"];
  validationReport: DashboardRequest["validationReport"];
  errorReportName: string;
}) {
  const [modalShow, setModalShow] = useState(false);
  return (
    <>
      <WarningIconButton setModalShow={setModalShow} />
      {modalShow && (
        <ErrorReportModal
          show={modalShow}
          onHide={() => setModalShow(false)}
          validationStatus={validationStatus}
          validationReport={validationReport}
          errorReportName={errorReportName}
        />
      )}
    </>
  );
}

function ErrorReportModal({
  show,
  onHide,
  validationStatus,
  validationReport,
  errorReportName,
}: {
  show: boolean;
  onHide: () => void;
  validationStatus: DashboardRequest["validationStatus"];
  validationReport: DashboardRequest["validationReport"];
  errorReportName: string;
}) {
  const validationDataForAgGrid: StatusItem[] = [];

  if (validationStatus === false && validationReport) {
    const validationReportMap = parseValidationReport(validationReport);
    console.log("validationReportMap", validationReportMap);
    validationDataForAgGrid.push(
      ...Array.from(validationReportMap, ([key, value]) => ({
        item: key,
        description: value.toString(),
        actionItem: "TBD",
        responsibleParty: "TBD",
      }))
    );
    console.log("validationDataForAgGrid", validationDataForAgGrid);
  } else if (validationStatus === null) {
    validationDataForAgGrid.push(...MISSING_STATUS);
  }

  if (validationDataForAgGrid.length === 0) {
    return null;
  }
  return (
    <Modal dialogClassName="modal-90w" show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Error report for {errorReportName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className={`${styles.tableHeight} ag-theme-alpine`}>
          <AgGridReact
            rowData={validationDataForAgGrid}
            columnDefs={validationColDefs}
            defaultColDef={defaultColDef}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}

function WarningIconButton({
  setModalShow,
}: {
  setModalShow: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <div
      role="button"
      style={{ display: "contents" }}
      onClick={() => setModalShow(true)}
      aria-label="Warning"
    >
      <CustomTooltip icon={<WarningIcon className="warning-icon" />}>
        Click to view request validation errors
      </CustomTooltip>
    </div>
  );
}
