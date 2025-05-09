import { Dispatch, SetStateAction, useState } from "react";
import { DashboardRequest } from "../generated/graphql";
import { CustomTooltip } from "../shared/components/CustomToolTip";
import WarningIcon from "@material-ui/icons/Warning";
import { Button, Modal } from "react-bootstrap";

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
      <ErrorReportModal
        show={modalShow}
        onHide={() => setModalShow(false)}
        validationStatus={validationStatus}
        validationReport={validationReport}
        errorReportName={errorReportName}
      />
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
  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          Error report for {errorReportName}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Cras mattis consectetur purus sit amet fermentum. Cras justo odio,
          dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac
          consectetur ac, vestibulum at eros.
        </p>
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
