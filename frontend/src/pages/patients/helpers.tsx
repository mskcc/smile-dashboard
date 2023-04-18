import { ColDef, RowNode } from "ag-grid-community";
import { Button } from "react-bootstrap";
import "ag-grid-enterprise";
import { SampleMetadata } from "../../generated/graphql";

export interface SampleMetadataExtended extends SampleMetadata {
  revisable: boolean;
}

export type SampleChange = {
  primaryId: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  rowNode: RowNode<any>;
};

export type ChangeForSubmit = {
  [primaryId: string]: {
    [fieldName: string]: string;
  };
};

export function buildPatientTableColumns(navigate: any): ColDef[] {
  return [
    {
      headerName: "View",
      cellRenderer: (data: any) => {
        return (
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => {
              if (data.data.value !== undefined) {
                navigate(`/${data.data.value}`);
              }
            }}
          >
            View
          </Button>
        );
      },
    },
    ...PatientsListColumns,
  ];
}

export const PatientsListColumns: ColDef[] = [
  {
    field: "value",
    headerName: "Patient ID value",
    sortable: true,
  },
  {
    field: "namespace",
    headerName: "Patient ID namespace",
    sortable: true,
  },
  {
    field: "hasSampleSamplesConnection",
    headerName: "# Samples",
    valueGetter: function ({ data }) {
      return data["isAliasPatients"]["hasSampleSamplesConnection"]?.totalCount;
    },
    cellClass: (params) => {
      if (params.data.revisable === false) {
        return "pendingCell";
      }
      return undefined;
    },
  },
];
