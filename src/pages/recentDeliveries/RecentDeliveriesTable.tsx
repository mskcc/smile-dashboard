import * as React from "react";
import DataTable from "react-data-table-component";
import { RequestWithDate } from "./RecentDeliveriesPage";
import { ArrowDownward } from "@material-ui/icons";

const sortIcon = <ArrowDownward />;

const RecentDeliveriesColumns = [
  {
    priority: 1,
    selector: (d: RequestWithDate) => d.smileRequest.igoRequestId,
    dataField: "igoRequestId",
    name: "IGO Request ID",
    sortable: true,
    filterable: true
  },
  {
    priority: 2,
    selector: (d: RequestWithDate) => d.smileRequest.igoProjectId,
    dataField: "igoProjectId",
    name: "IGO Project ID",
    sortable: true,
    filterable: true
  },
  {
    priority: 3,
    selector: (d: RequestWithDate) => d.totalSamples,
    dataField: "totalSamples",
    name: "# Samples",
    sortable: true,
    filterable: true
  },
  {
    priority: 4,
    selector: (d: RequestWithDate) => d.firstDelivered,
    dataField: "firstDelivered",
    name: "First Delivery to SMILE",
    sortable: true,
    filterable: true
  },
  {
    priority: 5,
    selector: (d: RequestWithDate) => d.lastDateUpdated,
    dataField: "lastDateUpdated",
    name: "Last Update",
    sortable: true,
    filterable: true
  },
  {
    priority: 6,
    selector: (d: RequestWithDate) => d.smileRequest.investigatorName,
    dataField: "investigatorName",
    name: "Investigator Name",
    sortable: true,
    filterable: true
  },
  {
    priority: 7,
    selector: (d: RequestWithDate) => d.smileRequest.investigatorEmail,
    dataField: "investigatorEmail",
    name: "Investigator Email",
    sortable: true,
    filterable: true
  },
  {
    priority: 8,
    selector: (d: RequestWithDate) => d.smileRequest.dataAnalystName,
    dataField: "dataAnalystName",
    name: "Data Analyst Name",
    sortable: true,
    filterable: true
  },
  {
    priority: 9,
    selector: (d: RequestWithDate) => d.smileRequest.dataAnalystEmail,
    dataField: "dataAnalystEmail",
    name: "Data Analyst Email",
    sortable: true,
    filterable: true
  },
  {
    priority: 10,
    selector: (d: RequestWithDate) => d.smileRequest.genePanel,
    dataField: "genePanel",
    name: "Gene Panel",
    sortable: true,
    filterable: true
  },
  {
    priority: 11,
    selector: (d: RequestWithDate) => d.smileRequest.projectManagerName,
    dataField: "projectManagerName",
    name: "Project Manager Name",
    sortable: true,
    filterable: true
  }
];

export interface RecentDeliveriesTableProps {
  data: RequestWithDate[];
}

export default class RecentDeliveriesTable extends React.Component<
  RecentDeliveriesTableProps,
  {}
> {
  constructor(props: RecentDeliveriesTableProps) {
    super(props);
  }

  public render() {
    return (
      <DataTable
        striped
        responsive
        pagination
        sortIcon={sortIcon}
        columns={RecentDeliveriesColumns}
        data={this.props.data}
      />
    );
  }
}
