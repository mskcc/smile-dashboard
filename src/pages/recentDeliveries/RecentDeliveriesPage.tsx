import {
  useQuery,
} from "@apollo/client";
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
import {InfiniteLoader, List} from "react-virtualized";
import { Container, Form, InputGroup } from "react-bootstrap";
import RecentDeliveriesTable from "./RecentDeliveriesTable";

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
    filter:""
  })
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

  function loadMoreRows({startIndex, stopIndex}, fetchMore: any) {
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

  function isRowLoaded ({ index }) {
    return index < data.requests.length;
  }
  function rowRenderer({key, index, style}) {
    if (!data.requests[index]) {
        if (index < remoteRowCount) {
            return <div key={key} style={style}>{index} loading</div>;
        } else {
            return null;
        }
    }
    return (
        <div
            key={key}
            style={style}
        >
            {index} - {data.requests[index].igoRequestId}
        </div>
    )
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

      <InfiniteLoader
                isRowLoaded={isRowLoaded}
                loadMoreRows={(params) => {
                    return loadMoreRows(params, fetchMore)
                }}
                rowCount={remoteRowCount}
            >
                {({onRowsRendered, registerChild}) => (
                    <List
                        height={200}
                        onRowsRendered={onRowsRendered}
                        ref={registerChild}
                        rowCount={remoteRowCount}
                        rowHeight={20}
                        rowRenderer={rowRenderer}
                        width={300}
                    />
                )}
            </InfiniteLoader>
      {/* <RecentDeliveriesTable data={filteredRequests} /> */}
    </Container>
    
  );
});
