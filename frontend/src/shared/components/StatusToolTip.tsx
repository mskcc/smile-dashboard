import { ColDef, ITooltipParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { DashboardSample } from "../../generated/graphql";

/**
 * @Key Concatenated string of key-value pairs from validationReport field of Sample's Status in the database.
 * Example: given "fastQs=missing,igoComplete=false", we'd get "fastQs missing" and "igoComplete false".
 * Note: when querying this data from the database, handle both formats: JSON string and {key=value} string.
 *
 * @Value Actionable details for the PM team.
 */
import sampleStatusMapJson from "../../env/sample_status_map.json";

type SampleStatusItem = {
  status: string;
  meaning: string;
  actionItem: string;
  responsibleParty: string;
};

type SampleStatusMap = {
  [key: string]: SampleStatusItem;
};

const SAMPLE_STATUS_MAP = sampleStatusMapJson as SampleStatusMap;

/**
 * AG Grid data to use when a Sample is missing a corresponding Status in the database.
 */
const MISSING_SAMPLE_STATUS: SampleStatusItem[] = [
  {
    status: "Data error",
    meaning: "Validation status is missing from this sample",
    actionItem: "PMs contact the SMILE team",
    responsibleParty: "SMILE",
  },
];

const sampleStatusColDefs: ColDef[] = [
  {
    field: "status",
    headerName: "Status",
    width: 200,
  },
  {
    field: "meaning",
    headerName: "Meaning",
    width: 250,
  },
  {
    field: "actionItem",
    headerName: "Action Item",
    width: 250,
  },
  {
    field: "responsibleParty",
    headerName: "Responsible Party",
    width: 170,
  },
];

const defaultColDef: ColDef = {
  wrapText: true,
  autoHeight: true,
  cellStyle: {
    wordBreak: "break-word",
    lineHeight: "1.25",
    padding: "6px 18px",
  },
};

function parseValidationReport(validationReport: string): Map<string, string> {
  const validationReportMap = new Map<string, string>();
  try {
    // Parse the validation report JSON string
    // e.g. "{"fastQs":"missing","igoComplete":"false"}"
    return new Map(Object.entries(JSON.parse(validationReport)));
  } catch (e) {
    // Parse the alternative format of the validation report data
    // e.g. "{fastQs=missing,igoComplete=false}"
    const keyValuePairs = validationReport.replace(/[{}]/g, "").split(",");
    for (const keyValuePair of keyValuePairs) {
      const [key, value] = keyValuePair.split("=").map((str) => str.trim());
      if (key && value) {
        validationReportMap.set(key, value);
      }
    }
    return validationReportMap;
  }
}

export function StatusTooltip({ data }: ITooltipParams<DashboardSample>) {
  if (!data) {
    return null;
  }

  const { primaryId, validationReport, validationStatus } = data;
  const validationDataForAgGrid: SampleStatusItem[] = [];

  // Populate the validationDataForAgGrid with the validation report data
  if (validationStatus === false) {
    const validationReportMap = parseValidationReport(validationReport!);
    validationDataForAgGrid.push(
      ...Array.from(validationReportMap, ([fieldName, report]) => ({
        ...SAMPLE_STATUS_MAP[`${fieldName} ${report}`],
      }))
    );
    // Handle the case where a Sample is missing a corresponding Status in the database
  } else if (validationStatus === null) {
    validationDataForAgGrid.push(...MISSING_SAMPLE_STATUS);
  }

  if (validationDataForAgGrid.length === 0) {
    return null;
  }
  return (
    <div className="tooltip-styles">
      <p>Status report for {`${primaryId}`}</p>
      <div className="ag-theme-alpine" style={{ width: 880 }}>
        <AgGridReact
          rowData={validationDataForAgGrid}
          columnDefs={sampleStatusColDefs}
          defaultColDef={defaultColDef}
          domLayout="autoHeight"
        ></AgGridReact>
      </div>
    </div>
  );
}
