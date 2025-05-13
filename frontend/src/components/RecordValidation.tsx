import { Dispatch, SetStateAction, useState } from "react";
import styles from "./records.module.scss";
import { DashboardRequest } from "../generated/graphql";
import { CustomTooltip } from "../shared/components/CustomToolTip";
import WarningIcon from "@material-ui/icons/Warning";
import { Button, Modal } from "react-bootstrap";
import { ColDef } from "ag-grid-community";
import {
  defaultColDef,
  getActionItemForMissingIgoField,
  MISSING_STATUS,
  parseValidationReport,
  SAMPLE_STATUS_MAP,
  StatusItem,
  StatusMap,
} from "../shared/components/StatusToolTip";
import { AgGridReact } from "ag-grid-react";

// TODO: reduce duplication of code between this file and StatusToolTip.tsx
const REQUEST_STATUS_MAP: StatusMap = {
  "isCmo SMILE CMO request filter is enabled and request JSON received has 'cmoRequest': false. This value must be set to true for import into SMILE.":
    {
      item: "isCmo false",
      description:
        "SMILE CMO request filter is enabled and request JSON received has 'cmoRequest': false. " +
        "This value must be set to true for import into SMILE.",
      actionItem: getActionItemForMissingIgoField("cmoRequest"),
      responsibleParty: "IGO",
    },
  "samples (missing) Request JSON is missing 'samples' or 'samples' is an empty list.":
    {
      item: "samples (missing)",
      description:
        "Request JSON from IGO LIMS' REST API is missing 'samples' or 'samples' is an empty list.",
      actionItem: getActionItemForMissingIgoField("samples"),
      responsibleParty: "IGO",
    },
  "samples (failed) some request samples failed validation": {
    item: "samples (failed)",
    description: "Some request samples failed validation",
    actionItem:
      "Review each sample's validation error below. If sample-level errors are missing or incorrect, please contact the SMILE team.",
    responsibleParty: "",
  },
  "samples (failed) all request samples failed validation": {
    item: "samples (failed)",
    description: "All request samples failed validation",
    actionItem:
      "Review each sample's validation error below. If sample-level errors are missing or incorrect, please contact the SMILE team.",
    responsibleParty: "",
  },
};

const validationColDefs: ColDef[] = [
  {
    field: "item",
    headerName: "Item",
    maxWidth: 250,
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
    maxWidth: 170,
  },
  // Group sample validation errors under one header
  {
    field: "sampleLevelHeader",
    hide: true,
    rowGroup: true,
  },
  // Group same-sample validation errors by igoId
  {
    field: "igoId",
    hide: true,
    rowGroup: true,
  },
];

type modalTitle = `Error report for ${string}`;

export function RecordValidation({
  validationStatus,
  validationReport,
  modalTitle,
}: {
  validationStatus: DashboardRequest["validationStatus"];
  validationReport: DashboardRequest["validationReport"];
  modalTitle: modalTitle;
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
          title={modalTitle}
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
  title,
}: {
  show: boolean;
  onHide: () => void;
  validationStatus: DashboardRequest["validationStatus"];
  validationReport: DashboardRequest["validationReport"];
  title: modalTitle;
}) {
  const validationDataForAgGrid: (StatusItem & { igoId?: string })[] = [];

  if (validationStatus === false && validationReport) {
    const validationReportMap = parseValidationReport(validationReport);
    validationReportMap.delete("samples");
    validationDataForAgGrid.push(
      ...Array.from(validationReportMap, ([fieldName, report]) => {
        const statusItem = REQUEST_STATUS_MAP[`${fieldName} ${report}`];
        return statusItem || null;
      }).filter((item) => item !== null)
    );
    const samplesValidationReports =
      parseSamplesValidationReports(validationReport);
    if (samplesValidationReports.length > 0) {
      samplesValidationReports.forEach((report) => {
        const igoId = Object.keys(report)[0];
        const reportKey = report[igoId];
        const statusItem = SAMPLE_STATUS_MAP[`${reportKey}`];
        if (statusItem) {
          validationDataForAgGrid.push({
            ...statusItem,
            igoId,
            sampleLevelHeader: "Sample-level validation errors",
          });
        }
      });
    }
  } else if (validationStatus === null) {
    validationDataForAgGrid.push(...MISSING_STATUS);
  }

  if (validationDataForAgGrid.length === 0) {
    return null;
  }
  return (
    <Modal dialogClassName="modal-90w" show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className={`${styles.tableHeight} ag-theme-alpine`}>
          <AgGridReact
            rowData={validationDataForAgGrid}
            columnDefs={validationColDefs}
            defaultColDef={defaultColDef}
            groupDisplayType="groupRows"
            onGridReady={(params) => params.api.sizeColumnsToFit()}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}

function parseSamplesValidationReports(input: string) {
  const result: Array<{ [igoId: string]: string }> = [];
  try {
    const obj = JSON.parse(input);
    if (obj && Array.isArray(obj.samples)) {
      for (const sample of obj.samples) {
        const igoId = sample.igoId;
        const validationReport = sample?.status?.validationReport;
        if (igoId && validationReport !== undefined) {
          const reportMap =
            validationReport instanceof Map
              ? validationReport
              : parseValidationReport(validationReport);
          reportMap.forEach((value, key) => {
            result.push({ [igoId]: `${key} ${value}` });
          });
        }
      }
      return result;
    }
  } catch {
    // Not valid JSON, fallback to regex approach
    const pattern = /igoId=([^,}\s]+)[\s\S]*?validationReport=\{([^}]*)\}/g;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(input)) !== null) {
      const igoId = match[1];
      const reportContent = match[2];
      const reportMap = parseValidationReport(`{${reportContent}}`);
      reportMap.forEach((value, key) => {
        result.push({ [igoId]: `${key} ${value}` });
      });
    }
  }
  return result;
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
