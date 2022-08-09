import * as React from "react";
import DataTable from "react-data-table-component";
import { RequestSampleWithDate } from "./RequestViewPage";
import { ArrowDownward } from "@material-ui/icons";

const sortIcon = <ArrowDownward />;

const RequestViewColumns = [
  {
    priority: 1,
    selector: (d: RequestSampleWithDate) =>
      d.latestMetadata.cmoSampleName ? d.latestMetadata.cmoSampleName : "",
    dataField: "cmoSampleName",
    name: "CMO Sample Name",
    sortable: true,
    filterable: true
  },
  {
    priority: 2,
    selector: (d: RequestSampleWithDate) =>
      d.latestMetadata.investigatorSampleId
        ? d.latestMetadata.investigatorSampleId
        : "",
    dataField: "investigatorSampleId",
    name: "Investigator Sample ID",
    sortable: true,
    filterable: true
  },
  {
    priority: 3,
    selector: (d: RequestSampleWithDate) => d.latestMetadata.cmoPatientId,
    dataField: "cmoPatientId",
    name: "CMO Patient ID",
    sortable: true,
    filterable: true
  },
  {
    priority: 4,
    selector: (d: RequestSampleWithDate) => d.latestMetadata.primaryId,
    dataField: "primaryId",
    name: "Primary ID",
    sortable: true,
    filterable: true
  },
  {
    priority: 5,
    selector: (d: RequestSampleWithDate) =>
      d.latestMetadata.preservation ? d.latestMetadata.preservation : "",
    dataField: "preservation",
    name: "Preservation",
    sortable: true,
    filterable: true
  },
  {
    priority: 6,
    selector: (d: RequestSampleWithDate) => d.latestMetadata.tumorOrNormal,
    dataField: "tumorOrNormal",
    name: "Tumor Or Normal",
    sortable: true,
    filterable: true
  },
  {
    priority: 7,
    selector: (d: RequestSampleWithDate) => d.latestMetadata.sampleClass,
    dataField: "sampleClass",
    name: "Sample Class",
    sortable: true,
    filterable: true
  },
  {
    priority: 8,
    selector: (d: RequestSampleWithDate) =>
      d.latestMetadata.oncotreeCode ? d.latestMetadata.oncotreeCode : "",
    dataField: "oncotreeCode",
    name: "Oncotree Code",
    sortable: true,
    filterable: true
  },
  {
    priority: 9,
    selector: (d: RequestSampleWithDate) => d.latestMetadata.collectionYear,
    dataField: "collectionYear",
    name: "Collection Year",
    sortable: true,
    filterable: true
  },
  {
    priority: 10,
    selector: (d: RequestSampleWithDate) =>
      d.latestMetadata.sampleOrigin ? d.latestMetadata.sampleOrigin : "",
    dataField: "sampleOrigin",
    name: "Sample Origin",
    sortable: true,
    filterable: true
  },
  {
    priority: 11,
    selector: (d: RequestSampleWithDate) =>
      d.latestMetadata.tissueLocation ? d.latestMetadata.tissueLocation : "",
    dataField: "tissueLocation",
    name: "Tissue Location",
    sortable: true,
    filterable: true
  },
  {
    priority: 11,
    selector: (d: RequestSampleWithDate) => d.latestMetadata.sex,
    dataField: "sex",
    name: "Sex",
    sortable: true,
    filterable: true
  }
];

export interface RequestViewTableProps {
  data: RequestSampleWithDate[];
}

const RequestViewTable: React.FunctionComponent<RequestViewTableProps> = props => {
  return (
    <DataTable
      striped
      responsive
      sortIcon={sortIcon}
      columns={RequestViewColumns}
      data={props.data}
    />
  );
};

export default RequestViewTable;
