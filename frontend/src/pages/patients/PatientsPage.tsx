import {
  RequestWhere,
  usePatientsListLazyQuery,
} from "../../generated/graphql";
import React from "react";
// import { RequestsListColumns } from "./helpers";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "ag-grid-enterprise";
import RecordsList from "../../shared/components/RecordsList";

// TODO
function requestFilterWhereVariables(value: string): RequestWhere[] {
  return [
    { igoProjectId_CONTAINS: value },
    { igoRequestId_CONTAINS: value },
    { genePanel_CONTAINS: value },
    { dataAnalystEmail_CONTAINS: value },
    { dataAnalystName_CONTAINS: value },
    { investigatorEmail_CONTAINS: value },
    { investigatorName_CONTAINS: value },
    { labHeadEmail_CONTAINS: value },
    { libraryType_CONTAINS: value },
    { labHeadName_CONTAINS: value },
    { namespace_CONTAINS: value },
    { piEmail_CONTAINS: value },
    { otherContactEmails_CONTAINS: value },
    { projectManagerName_CONTAINS: value },
    { qcAccessEmails_CONTAINS: value },
  ];
}

export const PatientsPage: React.FunctionComponent = (props) => {
  return (
    <>
      {/* <RecordsList
        lazyRecordsQuery={usePatientsListLazyQuery}
        nodeName="patients"
        colDefs={[
          {
            field: "smilePatientId",
            headerName: "ID",
          },
        ]}
        conditionBuilder={requestFilterWhereVariables} // TODO
      /> */}
    </>
  );
};

export default PatientsPage;
