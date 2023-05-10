import { ITooltipParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useState } from "react";

export const StatusTooltip = (props: ITooltipParams) => {
  const data = props.api!.getDisplayedRowAtIndex(props.rowIndex!)!.data;

  const [columnDefs] = useState([
    { field: "fieldName", headerName: "Field Name" },
    {
      field: "report",
      headerName: "Report",
      wrapText: true,
      autoHeight: true,
      flex: 2,
    },
  ]);

  let validationReportMap = new Map();
  try {
    validationReportMap = new Map(
      Object.entries(JSON.parse(data?.hasStatusStatuses[0].validationReport))
    );
  } catch (e) {
    let cleanedReport = (data?.hasStatusStatuses[0].validationReport)
      .replace("{", "")
      .replace("}", "");
    let reportArray = cleanedReport.split(",");
    for (var r of reportArray) {
      let splitReport = r.split("=");
      validationReportMap.set(splitReport[0], splitReport[1]);
    }
  }
  const validationReportList: any[] | null | undefined = [];

  validationReportMap.forEach(function (value, key) {
    validationReportList.push({ fieldName: key, report: value });
  });

  console.log(validationReportList);

  if (!data?.hasStatusStatuses[0].validationStatus) {
    return (
      <div className="tooltip-styles">
        <p>
          <span>Validation report for {`${data?.primaryId}`}</span>
        </p>
        <div className="ag-theme-alpine" style={{ height: 300, width: 550 }}>
          <AgGridReact
            rowData={validationReportList}
            columnDefs={columnDefs}
          ></AgGridReact>
        </div>
      </div>
    );
  } else {
    return "";
  }
};
