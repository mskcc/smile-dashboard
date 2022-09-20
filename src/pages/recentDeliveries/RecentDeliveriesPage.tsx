import { useQuery } from "@apollo/client";
import { Edit } from "@material-ui/icons";
import "./RecentDeliveries.css";
import { RecentDeliveriesQueryDocument } from "../../generated/graphql";
import { observer } from "mobx-react-lite";
import { makeAutoObservable } from "mobx";
import jsdownload from "js-file-download";
import { InfiniteLoader, Table, Column, AutoSizer } from "react-virtualized";
import {
  Badge,
  Button,
  Col,
  Container,
  Form,
  InputGroup,
  Row
} from "react-bootstrap";

import Modal from "react-bootstrap/Modal";

import { RequestSummary } from "../requestView/RequestSummary";
import "react-virtualized/styles.css";
import React, { FunctionComponent, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import _ from "lodash";
import classNames from "classnames";
import { buildRequestTableColumns, StaticTableColumns } from "./helpers";
import { CSVGenerate } from "./csvExport";

function createStore() {
  return makeAutoObservable({
    filter: "",
    selectedRequest: "",
    showRequestDetails: false,
    showDownload: false
  });
}

const store = createStore();

const filterField = "requestJson_CONTAINS";

export const RecentDeliveriesPage: React.FunctionComponent = props => {
  return <RecentDeliveriesObserverable />;
};

export default RecentDeliveriesPage;

const RecentDeliveriesObserverable = () => {
  const [val, setVal] = useState("");
  const [typingTimeout, setTypingTimeout] = useState<any>(null);
  const [prom, setProm] = useState<any>(Promise.resolve());
  const navigate = useNavigate();
  const params = useParams();

  const [showDownload, setShowDownload] = useState(false);

  const RequestTableColumns = buildRequestTableColumns(navigate);

  const { loading, error, data, refetch, fetchMore } = useQuery(
    RecentDeliveriesQueryDocument,
    {
      variables: {
        where: {
          [filterField]: ""
        },
        requestsConnectionWhere2: {
          [filterField]: ""
        },
        options: { limit: 0, offset: 0 }
      }
    }
  );

  if (loading) return <p>Loading requests...</p>;

  if (error) return <p>Error :(</p>;

  function loadMoreRows({ startIndex, stopIndex }, fetchMore: any) {
    return fetchMore({
      variables: {
        options: {
          offset: startIndex,
          limit: stopIndex
        }
      }
    });
  }

  function loadAllRows(fetchMore: any, filter: string) {
    return () => {
      return fetchMore({
        variables: {
          where: {
            [filterField]: filter
          },
          options: {
            offset: 0,
            limit: undefined
          }
        }
      });
    };
  }

  function isRowLoaded({ index }) {
    return index < data.requests.length;
  }

  function rowGetter({ index }) {
    if (!data.requests[index]) {
      return "";
    }
    return data.requests[index];
  }

  function onRowClick(info) {
    store.selectedRequest = info.rowData.igoRequestId;
    store.showRequestDetails = true;
  }

  // notes: cellrenderer gets rowData (sample properties)
  // todo: add prop that we can call setState for to put us in "editing mode"

  // notes:
  // form can go in another component
  // def put the table in another component (from infinite loader --> through table)
  // todo: sample-level detail editing mode (<path>/sampleId/edit <-- edit would indicate mode we're in)

  const title = params.requestId
    ? `Viewing Request ${params.requestId}`
    : "Requests";

  return (
    <Container fluid>
      {showDownload && (
        <DownloadModal
          filter={val}
          loader={loadAllRows(fetchMore, val)}
          onComplete={() => setShowDownload(false)}
        />
      )}
      <Row className="pagetitle">
        <Col>
          <nav>
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="index.html">Home</a>
              </li>
              <li className="breadcrumb-item active">
                <NavLink to={"/recentDeliveries"}>Requests</NavLink>
              </li>
              {params.requestId && (
                <li className="breadcrumb-item active">{params.requestId}</li>
              )}
            </ol>
          </nav>
          <h1>{title}</h1>
        </Col>
      </Row>

      {params.requestId && (
        <Row>
          <RequestSummary props={params} />
        </Row>
      )}

      <Row
        className={classNames(
          "d-flex justify-content-center align-items-center",
          { "d-none": params.requestId }
        )}
      >
        <Col className={"text-end"}>
          <Form.Control
            className={"d-inline-block"}
            style={{ width: "300px" }}
            type="search"
            placeholder="Search Requests"
            aria-label="Search"
            value={val}
            onInput={event => {
              const value = event.currentTarget.value;

              if (value !== null) {
                setVal(value);
              }

              if (typingTimeout) {
                clearTimeout(typingTimeout);
              }

              // there will always be a promise so
              // wait until it's resolved
              prom.then(() => {
                const to = setTimeout(() => {
                  const rf = refetch({
                    where: {
                      [filterField]: value
                    },
                    requestsConnectionWhere2: {
                      [filterField]: value
                    },
                    options: { limit: 20, offset: 0 }
                  });
                  setProm(rf);
                }, 500);
                setTypingTimeout(to);
              });
            }}
          />
        </Col>
        <Col className={"text-start"}>
          {data.requestsConnection.totalCount} matching requests
        </Col>

        {/* <Col>
          <Button onClick={()=>{
            {CSVGenerate}
            // jsdownload({CSVGenerate},"report.csv");
          //  # jsdownload(data.requests,"blah.txt");
          }}>Generate Report</Button>
        </Col>
      </Row> */}

        <Col>
          {/* <Button onClick={CSVGenerate}>Generate Report</Button> */}
          <Button
            onClick={() => {
              setShowDownload(true);
            }}
          >
            Generate Report
          </Button>
        </Col>
      </Row>

      <Row className={classNames({ "d-none": params.requestId })}>
        <InfiniteLoader
          isRowLoaded={isRowLoaded}
          loadMoreRows={params => {
            return loadMoreRows(params, fetchMore);
          }}
          rowCount={data.requestsConnection.totalCount}
        >
          {({ onRowsRendered, registerChild }) => (
            <AutoSizer>
              {({ width }) => (
                <Table
                  className="table"
                  ref={registerChild}
                  width={width}
                  height={540}
                  headerHeight={60}
                  rowHeight={40}
                  rowCount={data.requestsConnection.totalCount}
                  onRowsRendered={onRowsRendered}
                  rowGetter={rowGetter}
                  onRowClick={onRowClick}
                  onRowDoubleClick={info => {
                    store.showRequestDetails = false;
                  }}
                >
                  {RequestTableColumns.map(col => {
                    return (
                      <Column
                        headerRenderer={col.headerRender}
                        label={col.label}
                        dataKey={`${col.dataKey}`}
                        cellRenderer={col.cellRenderer}
                        width={col.width || 100}
                      />
                    );
                  })}
                </Table>
              )}
            </AutoSizer>
          )}
        </InfiniteLoader>
      </Row>
    </Container>
  );
};

const DownloadModal: FunctionComponent<{
  loader: () => Promise<any>;
  onComplete: () => void;
  filter: string;
}> = ({ loader, onComplete, filter }) => {
  console.log("filter", filter);

  // const { loading, error, data } = useQuery(
  //   RecentDeliveriesQueryDocument,
  //     {
  //       variables: {
  //         where: {
  //           [filterField]: filter
  //         },
  //         requestsConnectionWhere2: {
  //           [filterField]: filter
  //         },
  //         fetchPolicy: 'network-only',
  //         options: { limit: 5000, offset: 0 }
  //       }
  //     }
  // )

  //if (data) {
  loader().then(({ data }) => {
    console.log("downloaded", data.requests.length);
    onComplete();
  });

  //console.log(`exporting for filter ${filter} `, data.requests.length);
  //CSVGenerate(data.requests);
  //onComplete();
  //}

  return (
    <Modal show={true}>
      <Modal.Body>
        <div>Downloading data</div>
      </Modal.Body>
    </Modal>
  );
};
