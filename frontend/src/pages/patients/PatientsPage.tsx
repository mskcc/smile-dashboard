import {
  PatientWhere,
  usePatientsListLazyQuery,
} from "../../generated/graphql";
import React from "react";
// import { RequestsListColumns } from "./helpers";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "ag-grid-enterprise";
import RecordsList from "../../components/RecordsList";
import { CellClassParams } from "ag-grid-enterprise";
import { Button } from "react-bootstrap";

function patientFilterWhereVariables(value: string): PatientWhere[] {
  return [{ smilePatientId_CONTAINS: value }];
}

export const PatientsPage: React.FunctionComponent = (props) => {
  return (
    <>
      <RecordsList
        lazyRecordsQuery={usePatientsListLazyQuery}
        nodeName="patients"
        idFieldName="smilePatientId" // as set by the route path in index.tsx
        colDefs={[
          // TODO: Move this to a helper file
          {
            headerName: "View",
            cellRenderer: (params: CellClassParams<any>) => {
              return (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    if (params.data.smilePatientId !== undefined) {
                      params.context.navigateFunction(
                        `/${params.data.smilePatientId}`
                      );
                    }
                  }}
                >
                  View
                </Button>
              );
            },
          },
          {
            field: "smilePatientId",
            headerName: "Smile Patient ID",
          },
          {
            field: "hasSampleSamplesConnection",
            headerName: "# Samples",
            valueGetter: function ({ data }) {
              return data["hasSampleSamplesConnection"]?.totalCount;
            },
            cellClass: (params) => {
              if (params.data.revisable === false) {
                return "pendingCell";
              }
              return undefined;
            },
          },
          {
            field: "patientAliasesIsAlias",
            headerName: "Namespace",
            valueGetter: function ({ data }) {
              return data["patientAliasesIsAlias"];
            },
            cellClass: (params) => {
              if (params.data.revisable === false) {
                return "pendingCell";
              }
              return undefined;
            },
          },
        ]}
        conditionBuilder={patientFilterWhereVariables}
      />
    </>
  );
};

export default PatientsPage;
