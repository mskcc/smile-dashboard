import { useQuery } from "@apollo/client";
// import { Container, Nav, Form, Button, InputGroup } from "react-bootstrap";
import "./RecentDeliveries.css";
// import RecentDeliveriesTable from "./RecentDeliveriesTable";
import {
  Request,
  RecentDeliveriesQueryDocument,
  RequestMetadataWhere
} from "../../generated/graphql";
import { observer } from "mobx-react";
import { useEffect, useMemo } from "react";
import { makeAutoObservable, observable } from "mobx";
import {
  InfiniteLoader,
  Table,
  Column,
  AutoSizer,
  List
} from "react-virtualized";
import { Container, Form, InputGroup } from "react-bootstrap";
import RecentDeliveriesTable from "./RecentDeliveriesTable";
import { TableCell, TableRow } from "@material-ui/core";
import {
  defaultCellRenderer,
  defaultHeaderRenderer,
  defaultHeaderRowRenderer
} from "react-virtualized/dist/es/Table";

function resolveAndSortDeliveryDates(request: Request) {
  var smDataList: string[] = [];
  for (var i = 0; i < request.hasSampleSamples.length; i++) {
    var s = request.hasSampleSamples[i];
    for (var j = 0; j < s.hasMetadataSampleMetadata.length; j++) {
      var sm = s.hasMetadataSampleMetadata[j];
      smDataList.push(sm.importDate);
    }
  }
  smDataList.sort();
  return [smDataList[0], smDataList[smDataList.length - 1]];
}

export class RequestWithDate {
  smileRequest: Request;
  totalSamples: number;
  firstDelivered: string;
  lastDateUpdated: string;
  constructor(smileRequest: Request) {
    this.smileRequest = smileRequest;
    this.totalSamples = smileRequest.hasSampleSamples.length;
    let deliveryDates = resolveAndSortDeliveryDates(smileRequest);
    this.firstDelivered = deliveryDates[0];
    this.lastDateUpdated = deliveryDates[1];
  }
}

export const RecentDeliveriesPage: React.FunctionComponent = props => {
  return (
    <Container>
      <RecentDeliveriesObserverable />
    </Container>
  );
};

export default RecentDeliveriesPage;

function createStore() {
  return makeAutoObservable({
    filter: "",
    rowHeight: 0,
    loadedData: []
  });
}

const store = createStore();

const RecentDeliveriesObserverable = observer(() => {
  const { client, loading, error, data, refetch, fetchMore } = useQuery(
    RecentDeliveriesQueryDocument,
    {
      variables: {
        where: {
          igoRequestId_CONTAINS: store.filter
        },
        requestsConnectionWhere2: {
          igoRequestId_CONTAINS: store.filter
        },
        options: { limit: 20, offset: 0 }
      }
    }
  );

  // function transformAndFilterRequestsByDate(requestsList: Array<Request>) {
  //   var filteredRequests: RequestWithDate[] = [];
  //   requestsList.forEach((r: Request) => {
  //     filteredRequests.push(new RequestWithDate(r));
  //   });
  //   return filteredRequests;
  // }

  if (loading) return <p>Loading requests...</p>;
  if (error) return <p>Error :(</p>;

  // var filteredRequests: RequestWithDate[] = transformAndFilterRequestsByDate(
  //   data.requests
  // );

  function loadMoreRows({ startIndex, stopIndex }, fetchMore: any) {
    return fetchMore({
      variables: {
        // where: {
        //     igoRequestId_CONTAINS: "00"
        // },
        options: {
          offset: startIndex,
          limit: stopIndex
        }
      }
    });
  }

  function isRowLoaded({ index }) {
    return index < data.requests.length;
  }

  function rowGetter({ index }) {
    if (!data.requests[index]) {
      if (index < remoteRowCount) {
        return "loading";
      } else {
        return null;
      }
    } else {
      // const d =  {
      //   "index": index,
      //   "igoRequestId": data.requests[index].igoRequestId
      // };
      // console.log(d)
      return data.requests[index];
    }
  }

  function rowRenderer({ key, index, style }) {
    if (!data.requests[index]) {
      if (index < remoteRowCount) {
        return (
          <div key={key} style={style}>
            {index} loading
          </div>
        );
      } else {
        return null;
      }
    }
    return (
      <tr key={key}>
        <td>{data.requests[index].igoRequestId}</td>
      </tr>
    );
  }

  function cellRenderer({ columnIndex, rowIndex }) {
    console.log("in cell renderer");
    console.log(data.requests[rowIndex].igoRequestId);
    return <div>{data.requests[rowIndex].igoRequestId}</div>;
  }

  const remoteRowCount = data.requestsConnection.totalCount;
  return (
    <Container>
      <Container>Displaying {store.filter}</Container>
      <InputGroup>
        <Form className="d-flex">
          <Form.Group>
            <Form.Control
              type="search"
              placeholder="Search"
              aria-label="Search"
              onInput={event => {
                const value = String(
                  ((event.currentTarget as unknown) as HTMLInputElement).value
                );
                if (value !== null) {
                  store.filter = value;
                  refetch({
                    where: {
                      igoRequestId_CONTAINS: store.filter
                    },
                    requestsConnectionWhere2: {
                      igoRequestId_CONTAINS: store.filter
                    },
                    options: { limit: 20, offset: 0 }
                  });
                }
              }}
            />
          </Form.Group>
        </Form>
      </InputGroup>
      {/* <table className="table table-striped table-fit">
        <thead>
          <tr>
          <th scope="col">Request ID</th>
          </tr>
        </thead>
        <tbody> */}
      <InfiniteLoader
        isRowLoaded={isRowLoaded}
        loadMoreRows={params => {
          return loadMoreRows(params, fetchMore);
        }}
        rowCount={remoteRowCount}
      >
        {({ onRowsRendered, registerChild }) => (
          <Table
            style={{ minWidth: 650 }}
            ref={registerChild}
            onRowsRendered={onRowsRendered}
            width={800}
            height={10000}
            headerHeight={100}
            rowHeight={100}
            rowCount={remoteRowCount}
            rowGetter={rowGetter}
          >
            {columns.map(col => {
              return (
                <Column
                  headerRenderer={({ dataKey }) => {
                    return (
                      <TableCell
                        component="th"
                        variant="head"
                        className="d-flex"
                      >
                        {dataKey}
                      </TableCell>
                    );
                  }}
                  key={col.dataKey}
                  cellDataGetter={({ rowData }) => rowData[col.dataKey]}
                  label={col.headerName}
                  dataKey={col.dataKey}
                  width={col.width}
                  cellRenderer={({ cellData }) => (
                    <TableRow>
                      <TableCell component="div" variant="body">
                        {cellData}
                      </TableCell>
                    </TableRow>
                  )}
                />
              );
            })}
          </Table>
        )}
      </InfiniteLoader>
      {/* </tbody>
      </table> */}
      {/* <RecentDeliveriesTable data={filteredRequests} /> */}
    </Container>
  );
});

function headerRenderer({ col }) {
  return (
    <TableCell component="th" scope="row">
      {col.dataKey}
    </TableCell>
  );
}

const columns = [
  {
    selector: (d: Request) => d.igoRequestId,
    dataKey: "igoRequestId",
    headerName: "IGO RequestID",
    sortable: true,
    filterable: true,
    width: 400
  },
  {
    selector: (d: Request) => d.projectManagerName,
    dataKey: "projectManagerName",
    headerName: "Project Manager Name",
    sortable: true,
    filterable: true,
    width: 400
  }
];

{
  /* <List
                        height={200}
                        onRowsRendered={onRowsRendered}
                        ref={registerChild}
                        rowCount={remoteRowCount}
                        rowHeight={20}
                        rowRenderer={rowRenderer}
                        width={300}
                    /> */
}
