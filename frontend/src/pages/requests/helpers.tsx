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

export type CellChange = {
  primaryId: string;
  field: string;
  oldValue: string;
  newValue: string;
};

export function buildRequestTableColumns(navigate: any): ColDef[] {
  return [
    {
      headerName: "View",
      cellRenderer: (data: any) => {
        return (
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => {
              if (data.data.igoRequestId !== undefined) {
                navigate(`/${data.data.igoRequestId}`);
              }
            }}
          >
            View
          </Button>
        );
      },
    },
    ...RequestsListColumns,
  ];
}

export const RequestsListColumns: ColDef[] = [
  {
    field: "igoRequestId",
    headerName: "IGO Request ID",
    sortable: true,
  },
  {
    field: "igoProjectId",
    headerName: "IGO Project ID",
    sortable: true,
  },
  {
    field: "hasSampleSamplesConnection",
    headerName: "# Samples",
    valueGetter: function ({ data }) {
      return data["hasSampleSamplesConnection"]?.totalCount;
    },
  },
  {
    field: "projectManagerName",
    headerName: "Project Manager Name",
    sortable: true,
  },
  {
    field: "investigatorName",
    headerName: "Investigator Name",
    sortable: true,
  },
  {
    field: "investigatorEmail",
    headerName: "Investigator Email",
    sortable: true,
  },
  {
    field: "piEmail",
    headerName: "PI Email",
    sortable: true,
  },
  {
    field: "dataAnalystName",
    headerName: "Data Analyst Name",
    sortable: true,
  },
  {
    field: "dataAnalystEmail",
    headerName: "Data Analyst Email",
    sortable: true,
  },
  {
    field: "genePanel",
    headerName: "Gene Panel",
    sortable: true,
  },
  {
    field: "labHeadName",
    headerName: "Lab Head Name",
    sortable: true,
  },
  {
    field: "labHeadEmail",
    headerName: "Lab Head Email",
    sortable: true,
  },
  {
    field: "qcAccessEmails",
    headerName: "QC Access Emails",
    sortable: true,
  },
  {
    field: "dataAccessEmails",
    headerName: "Data Access Emails",
    sortable: true,
  },
  {
    field: "bicAnalysis",
    headerName: "BIC Analysis",
    sortable: true,
  },
  {
    field: "isCmoRequest",
    headerName: "CMO Request?",
    sortable: true,
  },
  {
    field: "otherContactEmails",
    headerName: "Other Contact Emails",
    sortable: true,
  },
];

export const SampleDetailsColumns: ColDef[] = [
  {
    field: "primaryId",
    headerName: "Primary ID",
    sortable: true,
    editable: (params) => editableFields.includes(params.colDef.field!),
  },
  {
    field: "cmoSampleName",
    headerName: "CMO Sample Name",
    sortable: true,
    editable: (params) => editableFields.includes(params.colDef.field!),
  },
  {
    field: "importDate",
    headerName: "Last Updated",
    sortable: true,
    editable: (params) => editableFields.includes(params.colDef.field!),
  },
  {
    field: "cmoPatientId",
    headerName: "CMO Patient ID",
    sortable: true,
    editable: (params) => editableFields.includes(params.colDef.field!),
  },
  {
    field: "investigatorSampleId",
    headerName: "Investigator Sample ID",
    sortable: true,
    editable: (params) => editableFields.includes(params.colDef.field!),
  },
  {
    field: "sampleType",
    headerName: "Sample Type",
    sortable: true,
    editable: (params) => editableFields.includes(params.colDef.field!),
  },
  {
    field: "species",
    headerName: "Species",
    sortable: true,
    editable: (params) => editableFields.includes(params.colDef.field!),
  },
  {
    field: "genePanel",
    headerName: "Gene Panel",
    sortable: true,
    editable: (params) => editableFields.includes(params.colDef.field!),
  },
  {
    field: "preservation",
    headerName: "Preservation",
    sortable: true,
    editable: (params) => editableFields.includes(params.colDef.field!),
  },
  {
    field: "tumorOrNormal",
    headerName: "Tumor Or Normal",
    sortable: true,
    editable: (params) => editableFields.includes(params.colDef.field!),
  },
  {
    field: "sampleClass",
    headerName: "Sample Class",
    sortable: true,
    editable: (params) => editableFields.includes(params.colDef.field!),
  },
  {
    field: "oncotreeCode",
    headerName: "Oncotree Code",
    sortable: true,
    editable: (params) => editableFields.includes(params.colDef.field!),
  },
  {
    field: "collectionYear",
    headerName: "Collection Year",
    sortable: true,
    editable: (params) => editableFields.includes(params.colDef.field!),
  },
  {
    field: "sampleOrigin",
    headerName: "Sample Origin",
    sortable: true,
    editable: (params) => editableFields.includes(params.colDef.field!),
  },
  {
    field: "tissueLocation",
    headerName: "Tissue Location",
    sortable: true,
    editable: (params) => editableFields.includes(params.colDef.field!),
  },
  {
    field: "sex",
    headerName: "Sex",
    sortable: true,
    editable: (params) => editableFields.includes(params.colDef.field!),
  },
];

const editableFields: string[] = [
  "investigatorSampleId",
  "sampleClass",
  "cmoPatientId",
  "sampleName",
  "preservation",
  "tumorOrNormal",
  "oncotreeCode",
  "collectionYear",
  "sampleOrigin",
  "tissueLocation",
  "sex",
  "sampleType",
];
