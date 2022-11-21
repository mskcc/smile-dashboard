import { Edit } from "@material-ui/icons";
import { ColDef } from "ag-grid-community";
import { Button } from "react-bootstrap";

export type ColumnDefinition = {
  dataKey?: string;
  label?: string;
  sortable?: Boolean;
  filterable?: Boolean;
  width?: number;
  headerRender?: (arg: any) => any;
  cellRenderer?: (arg: any) => any;
  cellDataGetter?: (arg: any) => any;
};

export const RequestsListColumns: ColumnDefinition[] = [
  {
    dataKey: "igoRequestId",
    label: "IGO Request ID",
    sortable: true,
    filterable: true,
    width: 200
  },
  {
    dataKey: "igoProjectId",
    label: "IGO Project ID",
    sortable: true,
    filterable: true,
    width: 175
  },
  {
    dataKey: "hasSampleSamplesConnection",
    label: "# Samples",
    sortable: true,
    cellDataGetter: function({ dataKey, rowData }) {
      return rowData[dataKey]?.totalCount;
    }
  },
  {
    dataKey: "projectManagerName",
    label: "Project Manager Name",
    sortable: true,
    filterable: true,
    width: 175
  },
  {
    dataKey: "investigatorName",
    label: "Investigator Name",
    sortable: true,
    filterable: true,
    width: 200
  },
  {
    dataKey: "investigatorEmail",
    label: "Investigator Email",
    sortable: true,
    filterable: true,
    width: 200
  },
  {
    dataKey: "piEmail",
    label: "PI Email",
    sortable: true,
    filterable: true,
    width: 200
  },
  {
    dataKey: "dataAnalystName",
    label: "Data Analyst Name",
    sortable: true,
    filterable: true,
    width: 200
  },
  {
    dataKey: "dataAnalystEmail",
    label: "Data Analyst Email",
    sortable: true,
    filterable: true,
    width: 200
  },
  {
    dataKey: "genePanel",
    label: "Gene Panel",
    sortable: true,
    filterable: true,
    width: 200
  },
  {
    dataKey: "labHeadName",
    label: "Lab Head Name",
    sortable: true,
    filterable: true,
    width: 200
  },
  {
    dataKey: "labHeadEmail",
    label: "Lab Head Email",
    sortable: true,
    filterable: true,
    width: 200
  },
  {
    dataKey: "qcAccessEmails",
    label: "QC Access Emails",
    sortable: true,
    filterable: true,
    width: 200
  },
  {
    dataKey: "dataAccessEmails",
    label: "Data Access Emails",
    sortable: true,
    filterable: true,
    width: 200
  },
  {
    dataKey: "bicAnalysis",
    label: "BIC Analysis",
    sortable: true,
    filterable: true,
    width: 200
  },
  {
    dataKey: "isCmoRequest",
    label: "CMO Request?",
    sortable: true,
    filterable: true,
    width: 200
  },
  {
    dataKey: "otherContactEmails",
    label: "Other Contact Emails",
    sortable: true,
    filterable: true,
    width: 200
  }
];

export function oldBuildRequestTableColumns(navigate: any): ColumnDefinition[] {
  return [
    {
      headerRender: () => {
        return <Edit />;
      },
      cellRenderer: arg => {
        return (
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => {
              navigate("./" + arg.rowData.igoRequestId);
            }}
          >
            View
          </Button>
        );
      }
    },

    ...RequestsListColumns
  ];
}

export function buildRequestTableColumns(navigate: any): ColDef[] {
  return [
    {
      headerName: "Button",
      cellRenderer: (data: any) => {
        return (
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={(function(...args) {
              return function() {
                // console.log(data.hasSampleSamplesConnection);
              };
            })()}
          >
            View
          </Button>
        );
      }
    },
    ...newColumns
  ];
}

export const newColumns: ColDef[] = [
  {
    field: "igoRequestId",
    headerName: "IGO Request ID",
    sortable: true,
    width: 200
  },
  {
    field: "igoProjectId",
    headerName: "IGO Project ID",
    sortable: true,
    width: 175
  },
  {
    field: "hasSampleSamplesConnection",
    headerName: "# Samples",
    sortable: true,
    valueGetter: function({ data }) {
      console.log(data);
      return data["hasSampleSamplesConnection"]?.totalCount;
    }
  },
  {
    field: "projectManagerName",
    headerName: "Project Manager Name",
    sortable: true,
    width: 175
  },
  {
    field: "investigatorName",
    headerName: "Investigator Name",
    sortable: true,
    width: 200
  },
  {
    field: "investigatorEmail",
    headerName: "Investigator Email",
    sortable: true,
    width: 200
  },
  {
    field: "piEmail",
    headerName: "PI Email",
    sortable: true,
    width: 200
  },
  {
    field: "dataAnalystName",
    headerName: "Data Analyst Name",
    sortable: true,
    width: 200
  },
  {
    field: "dataAnalystEmail",
    headerName: "Data Analyst Email",
    sortable: true,
    width: 200
  },
  {
    field: "genePanel",
    headerName: "Gene Panel",
    sortable: true,
    width: 200
  },
  {
    field: "labHeadName",
    headerName: "Lab Head Name",
    sortable: true,
    width: 200
  },
  {
    field: "labHeadEmail",
    headerName: "Lab Head Email",
    sortable: true,
    width: 200
  },
  {
    field: "qcAccessEmails",
    headerName: "QC Access Emails",
    sortable: true,
    width: 200
  },
  {
    field: "dataAccessEmails",
    headerName: "Data Access Emails",
    sortable: true,
    width: 200
  },
  {
    field: "bicAnalysis",
    headerName: "BIC Analysis",
    sortable: true,
    width: 200
  },
  {
    field: "isCmoRequest",
    headerName: "CMO Request?",
    sortable: true,
    width: 200
  },
  {
    field: "otherContactEmails",
    headerName: "Other Contact Emails",
    sortable: true,
    width: 200
  }
];

export const oldSampleDetailsColumns: ColumnDefinition[] = [
  {
    dataKey: "cmoSampleName",
    label: "CMO Sample Name",
    sortable: true,
    filterable: true,
    width: 200
  },
  {
    dataKey: "cmoPatientId",
    label: "CMO Patient ID",
    sortable: true,
    filterable: true,
    width: 200
  },
  {
    dataKey: "investigatorSampleId",
    label: "Investigator Sample ID",
    sortable: true,
    filterable: true,
    width: 200
  },
  {
    dataKey: "primaryId",
    label: "Primary ID",
    sortable: true,
    filterable: true,
    width: 200
  },
  {
    dataKey: "preservation",
    label: "Preservation",
    sortable: true,
    filterable: true,
    width: 200
  },
  {
    dataKey: "tumorOrNormal",
    label: "Tumor Or Normal",
    sortable: true,
    filterable: true,
    width: 200
  },
  {
    dataKey: "sampleClass",
    label: "Sample Class",
    sortable: true,
    filterable: true,
    width: 200
  },
  {
    dataKey: "oncotreeCode",
    label: "Oncotree Code",
    sortable: true,
    filterable: true,
    width: 200
  },
  {
    dataKey: "collectionYear",
    label: "Collection Year",
    sortable: true,
    filterable: true,
    width: 200
  },
  {
    dataKey: "sampleOrigin",
    label: "Sample Origin",
    sortable: true,
    filterable: true,
    width: 200
  },
  {
    dataKey: "tissueLocation",
    label: "Tissue Location",
    sortable: true,
    filterable: true,
    width: 200
  },
  {
    dataKey: "sex",
    label: "Sex",
    sortable: true,
    filterable: true,
    width: 200
  }
];

export const SampleDetailsColumns: ColDef[] = [
  {
    field: "cmoSampleName",
    headerName: "CMO Sample Name",
    sortable: true,
    width: 200
  },
  {
    field: "cmoPatientId",
    headerName: "CMO Patient ID",
    sortable: true,
    width: 200
  },
  {
    field: "investigatorSampleId",
    headerName: "Investigator Sample ID",
    sortable: true,
    width: 200
  },
  {
    field: "primaryId",
    headerName: "Primary ID",
    sortable: true,
    width: 200
  },
  {
    field: "preservation",
    headerName: "Preservation",
    sortable: true,
    width: 200
  },
  {
    field: "tumorOrNormal",
    headerName: "Tumor Or Normal",
    sortable: true,
    width: 200
  },
  {
    field: "sampleClass",
    headerName: "Sample Class",
    sortable: true,
    width: 200
  },
  {
    field: "oncotreeCode",
    headerName: "Oncotree Code",
    sortable: true,
    width: 200
  },
  {
    field: "collectionYear",
    headerName: "Collection Year",
    sortable: true,
    width: 200
  },
  {
    field: "sampleOrigin",
    headerName: "Sample Origin",
    sortable: true,
    width: 200
  },
  {
    field: "tissueLocation",
    headerName: "Tissue Location",
    sortable: true,
    width: 200
  },
  {
    field: "sex",
    headerName: "Sex",
    sortable: true,
    width: 200
  }
];
