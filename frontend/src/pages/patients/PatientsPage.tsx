import {
  SortDirection,
  usePatientsListLazyQuery,
  useRequestWithSamplesQuery,
} from "../../generated/graphql";
import { makeAutoObservable } from "mobx";
import _ from "lodash";
import AutoSizer from "react-virtualized-auto-sizer";
import { Button, Col, Container, Form, Row, Modal } from "react-bootstrap";
import React, {
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useEffect,
  useMemo,
} from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import classNames from "classnames";
import { buildPatientTableColumns, PatientsListColumns } from "./helpers";
//import { RequestSamples } from "./RequestSamples";
import { DownloadModal } from "../../components/DownloadModal";
import Spinner from "react-spinkit";
import { CSVFormulate } from "../../lib/CSVExport";
import { AgGridReact } from "ag-grid-react";
import { useState } from "react";
import styles from "../requests/requests.module.scss";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "ag-grid-enterprise";
import { IServerSideGetRowsParams } from "ag-grid-community";
//import { RequestSamplesEditor } from "./RequestSamplesEditor";

function patientFilterWhereVariables(value: string) {
  return [{ namespace_CONTAINS: value }, { value_CONTAINS: value }];
}

function createStore() {
  return makeAutoObservable({
    filter: "",
    selectedRequest: "",
    showRequestDetails: false,
  });
}

//const store = createStore();

export const PatientsPage: React.FunctionComponent = (props) => {
  return <Patients />;
};

export default PatientsPage;

const Patients: FunctionComponent = () => {
  const [val, setVal] = useState("");
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [showClosingWarning, setShowClosingWarning] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const navigate = useNavigate();
  const params = useParams();

  // not we aren't using initial fetch
  const [initialFetch, { loading, error, data, fetchMore, refetch }] =
    usePatientsListLazyQuery({
      variables: {
        options: { limit: 20, offset: 0 },
      },
    });

  const datasource = useMemo(() => {
    return {
      // called by the grid when more rows are required
      getRows: (params: IServerSideGetRowsParams) => {
        const fetchInput = {
          where: {
            OR: patientFilterWhereVariables(val),
          },
          patientsConnectionWhere2: {
            OR: patientFilterWhereVariables(val),
          },
          options: {
            offset: params.request.startRow,
            limit: params.request.endRow,
            sort: params.request.sortModel.map((sortModel) => {
              return { [sortModel.colId]: sortModel.sort?.toUpperCase() };
            }),
          },
        };

        // if this is NOT first call, use refetch
        // (which is analogous in this case to the original fetch
        const thisFetch =
          params.request.startRow! === 0
            ? refetch(fetchInput)
            : fetchMore({
                variables: fetchInput,
              });

        return thisFetch.then((d) => {
          params.success({
            rowData: d.data.patientAliases,
            rowCount: 10,
          });
        });
      },
    };
  }, [val]);

  if (loading)
    return (
      <div className={"centralSpinner"}>
        <Spinner fadeIn={"none"} color={"lightblue"} name="ball-grid-pulse" />
      </div>
    );

  if (error) return <p>Error :(</p>;

  const remoteCount = 10;

  const handleClose = () => {
    if (unsavedChanges) {
      setShowClosingWarning(true);
    } else {
      navigate("/requests");
    }
  };

  return (
    <Container fluid>
      {showDownloadModal && (
        <DownloadModal
          loader={() => {
            return fetchMore({
              variables: {
                where: {
                  OR: patientFilterWhereVariables(val),
                },
                options: {
                  offset: 0,
                  limit: undefined,
                },
              },
            }).then(({ data }) => {
              return CSVFormulate(data.patientAliases, PatientsListColumns);
            });
          }}
          onComplete={() => setShowDownloadModal(false)}
          exportFileName={"patientAliases.tsv"}
        />
      )}

      <Row className="pagetitle">
        <Col>
          <nav>
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/">Home</a>
              </li>
              <li className="breadcrumb-item active">
                <NavLink to={"/patientAliases"}>Patients</NavLink>
              </li>
              {params.requestId && (
                <li className="breadcrumb-item active">{params.value}</li>
              )}
            </ol>
          </nav>
          <h1>Patients</h1>
        </Col>
      </Row>

      {showClosingWarning && (
        <Modal
          show={true}
          centered
          onHide={() => setShowClosingWarning(false)}
          className={styles.overlay}
        >
          <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
              Are you sure?
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              You have unsaved changes. Are you sure you want to exit this view?
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button
              className={"btn btn-secondary"}
              onClick={() => setShowClosingWarning(false)}
            >
              Cancel
            </Button>
            <Button
              className={"btn btn-danger"}
              onClick={() => {
                setShowClosingWarning(false);
                setUnsavedChanges(false);
                navigate("/patients");
              }}
            >
              Continue Exiting
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* {params.value && (
          <AutoSizer>
            {({ height, width }) => (
              <Modal show={true} dialogClassName="modal-90w" onHide={handleClose}>
                <Modal.Header closeButton>
                  <Modal.Title>Viewing {params.value}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <div style={{ height: height * 4 }}>
                    <RequestSamplesEditor
                      igoRequestId={params.requestId!}
                      setUnsavedChanges={setUnsavedChanges}
                      height={height}
                    />
                  </div>
                </Modal.Body>
              </Modal>
            )}
          </AutoSizer>
        )} */}

      <Row
        className={classNames(
          "d-flex justify-content-between align-items-center",
          "tableControlsRow"
        )}
      >
        <Col></Col>
        <Col className={"text-end"}>
          <Form.Control
            className={"d-inline-block"}
            style={{ width: "300px" }}
            type="search"
            placeholder="Search Requests"
            aria-label="Search"
            defaultValue={val}
            onInput={(event) => {
              const value = event.currentTarget.value;

              if (typingTimeout) {
                clearTimeout(typingTimeout);
              }

              const to = setTimeout(() => {
                setVal(value);
              }, 500);
              setTypingTimeout(to);
            }}
          />
        </Col>

        <Col className={"text-start"}>{remoteCount} matching patients</Col>

        <Col className={"text-end"}>
          <Button
            onClick={() => {
              setShowDownloadModal(true);
            }}
            size={"sm"}
          >
            Generate Report
          </Button>
        </Col>
      </Row>
      <AutoSizer>
        {({ width }) => (
          <div
            className="ag-theme-alpine"
            style={{ height: 540, width: width }}
          >
            <AgGridReact
              rowModelType={"serverSide"}
              columnDefs={buildPatientTableColumns(navigate)}
              serverSideDatasource={datasource}
              serverSideInfiniteScroll={true}
              cacheBlockSize={20}
              debug={false}
            />
          </div>
        )}
      </AutoSizer>
    </Container>
  );
};
