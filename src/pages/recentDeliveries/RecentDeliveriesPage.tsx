import {
  ApolloClient,
  useQuery,
  InMemoryCache,
  ApolloProvider,
  NormalizedCacheObject,
  Observable
} from "@apollo/client";
// import { Container, Nav, Form, Button, InputGroup } from "react-bootstrap";
import "./RecentDeliveries.css";
// import RecentDeliveriesTable from "./RecentDeliveriesTable";
import {
  Request,
  ExampleQueryDocument,
  Query,
  RecentDeliveriesQueryDocument,
  RequestMetadataWhere
} from "../../generated/graphql";
import { observer } from "mobx-react";
import { useEffect, useMemo } from "react";
import { observable } from "mobx";
import {InfiniteLoader, List} from "react-virtualized";
import { Container, Form, InputGroup } from "react-bootstrap";
import RecentDeliveriesTable from "./RecentDeliveriesTable";
// import InfiniteScroll from "react-infinite-scroll-component";

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
  const filter = useMemo(() => {
    const text = "";
    return { text: text };
  }, []);

  const { client, loading, error, data } = useQuery(
    RecentDeliveriesQueryDocument,
    {
      variables: {
        where: {
          igoRequestId_CONTAINS: filter.text
        },
        options: { limit: 20 }
      }
    }
  );

  function transformAndFilterRequestsByDate(requestsList: Array<Request>) {
    var filteredRequests: RequestWithDate[] = [];
    requestsList.forEach((r: Request) => {
      filteredRequests.push(new RequestWithDate(r));
    });
    return filteredRequests;
  }

  if (loading) return <p>Loading requests...</p>;
  if (error) return <p>Error : (</p>;

  var filteredRequests: RequestWithDate[] = transformAndFilterRequestsByDate(
    data.requests
  );

  return (
    <Container>
      <RecentDeliveriesObserverable />
    </Container>
  );
};

export default RecentDeliveriesPage;

const store = observable({ filter: "" });

const RecentDeliveriesObserverable = observer(() => {
  var filter = useMemo(() => {
    return { text: "" };
  }, []);
  const { client, loading, error, data, refetch, fetchMore } = useQuery(
    RecentDeliveriesQueryDocument,
    {
      variables: {
        where: {
          igoRequestId_CONTAINS: filter.text
        },
        options: { limit: 20, offset: 0 }
      }
    }
  );

  {
    /* fetchMore({
  variables: {
    where: {
      igoRequestId_CONTAINS: filter.text
    },
    options: { limit: 20, offset: 0 }
  }
}) */
  }

  function transformAndFilterRequestsByDate(requestsList: Array<Request>) {
    var filteredRequests: RequestWithDate[] = [];
    requestsList.forEach((r: Request) => {
      filteredRequests.push(new RequestWithDate(r));
    });
    return filteredRequests;
  }

  if (loading) return <p>Loading requests...</p>;
  if (error) return <p>Error : (</p>;

  var filteredRequests: RequestWithDate[] = transformAndFilterRequestsByDate(
    data.requests
  );
//   function getCacheRequests(){
//     const ret = client.readQuery({
//       query:RecentDeliveriesQueryDocument
//     })
//     console.log(ret);
//     return ret || []
// }
  return (
    <Container>
      <Container>Displaying {filter.text}</Container>
      <InputGroup>
        <Form className="d-flex">
          <Form.Group>
            <Form.Control
              type="search"
              placeholder="Search"
              aria-label="Search"
              // value={store.filter}
              // value={filter.text}
              onInput={event => {
                const value = String(
                  ((event.currentTarget as unknown) as HTMLInputElement).value
                );
                console.log(value);
                if (value !== null) {
                  console.log("filter value = ", value);
                  filter.text = value;
                  // store.filter = value;
                  refetch({
                    where: {
                      igoRequestId_CONTAINS: filter.text
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
            isRowLoaded={(params)=>{
                return isRowLoaded(params, data.requests);
            }}
            loadMoreRows={(params)=>{
                return loadMoreRows(params, fetchMore)
            }}
            rowCount={filteredRequests.length}
        >
            {({ onRowsRendered, registerChild }) => (
                <List
                    height={200}
                    onRowsRendered={onRowsRendered}
                    ref={registerChild}
                    rowCount={filteredRequests.length}
                    rowHeight={20}
                    rowRenderer={(props)=>{
                      console.log(props)
                        return rowRenderer(props,data.requests);
                    }}
                    width={300}
                />
            )}
        </InfiniteLoader>
      {/* <RecentDeliveriesTable data={filteredRequests} /> */}
    </Container>
  );
});

function isRowLoaded ({ index }, requests:any[]) {
  return index < requests.length;
}

function loadMoreRows ({ startIndex, stopIndex }, fetchMore:any) {
  console.log("loading more rows call - start index=",startIndex)
  return fetchMore({
      variables: {
          // where: {
          //     igoRequestId_CONTAINS: "00"
          // },
          options: {
              offset:startIndex,
              limit:20
          }
      }
  });
}

function rowRenderer ({ key, index, style}, data) {

  if (!data[index]) return <div key={key} style={style}>{index} loading</div>;
  console.log("in row renderer func")
  return (
      <div
          key={key}
          style={style}
      >
          {index} - {data[index].igoRequestId}
      </div>
  )
}