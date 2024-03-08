import AutoSizer from "react-virtualized-auto-sizer";
import { Button, Container, Modal } from "react-bootstrap";
import { Dispatch, SetStateAction, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DownloadModal } from "./DownloadModal";
import { CSVFormulate } from "../utils/CSVExport";
import { AgGridReact } from "ag-grid-react";
import { useState } from "react";
import styles from "./records.module.scss";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "ag-grid-enterprise";
import { ColDef, IServerSideGetRowsParams } from "ag-grid-community";
import { DataName, useHookLazyGeneric } from "../shared/types";
import SamplesList from "./SamplesList";
import { Sample, SampleWhere } from "../generated/graphql";
import { defaultReadOnlyColDef } from "../shared/helpers";
import { PatientIdsTriplet } from "../pages/patients/PatientsPage";
import { ErrorMessage, LoadingSpinner, Toolbar } from "../shared/tableElements";

interface IRecordsListProps {
  lazyRecordsQuery: typeof useHookLazyGeneric;
  dataName: DataName;
  nodeName?: string;
  colDefs: ColDef[];
  queryFilterWhereVariables: (uniqueQueries: string[]) => Record<string, any>[];
  sampleQueryParam: string | undefined;
  sampleDefaultColDef: ColDef;
  getSampleRowData: (samples: Sample[]) => any[];
  sampleColDefs: ColDef[];
  sampleSearchVariables: SampleWhere;
  sampleFilter: (searchVal: string) => SampleWhere;
  customToolbarUI?: JSX.Element;
  setCustomSearchVals?: Dispatch<SetStateAction<PatientIdsTriplet[]>>;
  userSearchVal: string;
  setUserSearchVal: Dispatch<SetStateAction<string>>;
  parsedSearchVals: string[];
  setParsedSearchVals: Dispatch<SetStateAction<string[]>>;
  handleSearch: () => void;
  showDownloadModal: boolean;
  setShowDownloadModal: Dispatch<SetStateAction<boolean>>;
  handleDownload: () => void;
}

export default function RecordsList({
  lazyRecordsQuery,
  dataName,
  nodeName = dataName,
  colDefs,
  queryFilterWhereVariables,
  sampleQueryParam,
  sampleDefaultColDef,
  getSampleRowData,
  sampleColDefs,
  sampleSearchVariables,
  sampleFilter,
  customToolbarUI,
  setCustomSearchVals,
  parsedSearchVals,
  setParsedSearchVals,
  handleSearch,
  userSearchVal,
  setUserSearchVal,
  showDownloadModal,
  setShowDownloadModal,
  handleDownload,
}: IRecordsListProps) {
  const [showClosingWarning, setShowClosingWarning] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const navigate = useNavigate();

  // note that we aren't using initial fetch
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [initialFetch, { loading, error, data, fetchMore, refetch }] =
    lazyRecordsQuery({
      variables: {
        options: { limit: 20, offset: 0 },
      },
    });

  const totalCountNodeName = `${nodeName}Connection`;

  const datasource = useMemo(() => {
    return {
      // called by the grid when more rows are required
      getRows: (params: IServerSideGetRowsParams) => {
        const fetchInput = {
          where: {
            OR: queryFilterWhereVariables(parsedSearchVals),
          },
          [`${nodeName}ConnectionWhere2`]: {
            OR: queryFilterWhereVariables(parsedSearchVals),
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
        // (which is analogous in this case to the original fetch)
        const thisFetch =
          params.request.startRow! === 0
            ? refetch(fetchInput)
            : fetchMore({
                variables: fetchInput,
              });

        return thisFetch.then((d: any) => {
          params.success({
            rowData: d.data[nodeName],
            rowCount: d.data?.[totalCountNodeName]?.totalCount,
          });
        });
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedSearchVals]);

  if (loading) return <LoadingSpinner />;

  if (error) return <ErrorMessage error={error} />;

  const remoteCount = data?.[totalCountNodeName]?.totalCount;

  const handleClose = () => {
    if (unsavedChanges) {
      setShowClosingWarning(true);
    } else {
      navigate(`/${dataName}`);
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
                  OR: queryFilterWhereVariables(parsedSearchVals),
                },
                options: {
                  offset: 0,
                  limit: undefined,
                },
              },
            }).then(({ data }: any) => {
              return CSVFormulate(data[nodeName], colDefs);
            });
          }}
          onComplete={() => setShowDownloadModal(false)}
          exportFileName={`${nodeName}.tsv`}
        />
      )}

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
                navigate(`/${dataName}`);
              }}
            >
              Continue Exiting
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {sampleQueryParam && (
        <AutoSizer>
          {({ height, width }) => (
            <Modal show={true} dialogClassName="modal-90w" onHide={handleClose}>
              <Modal.Header closeButton>
                <Modal.Title>{`Viewing ${sampleQueryParam}`}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div className={styles.popupHeight}>
                  <SamplesList
                    columnDefs={sampleColDefs}
                    defaultColDef={sampleDefaultColDef}
                    getRowData={getSampleRowData}
                    searchVariables={sampleSearchVariables}
                    filter={sampleFilter}
                    setUnsavedChanges={setUnsavedChanges}
                    exportFileName={`${sampleQueryParam}.tsv`}
                  />
                </div>
              </Modal.Body>
            </Modal>
          )}
        </AutoSizer>
      )}

      <Toolbar
        dataName={dataName}
        userSearchVal={userSearchVal}
        setUserSearchVal={setUserSearchVal}
        handleSearch={handleSearch}
        clearUserSearchVal={() => {
          setCustomSearchVals && setCustomSearchVals([]);
          setParsedSearchVals([]);
        }}
        matchingResultsCount={`${remoteCount?.toLocaleString()} matching ${
          remoteCount > 1 ? dataName : dataName.slice(0, -1)
        }`}
        handleDownload={handleDownload}
        customUI={customToolbarUI}
      />

      <AutoSizer>
        {({ width }) => (
          <div
            className={`ag-theme-alpine ${styles.tableHeight}`}
            style={{ width: width }}
          >
            <AgGridReact
              rowModelType={"serverSide"}
              columnDefs={colDefs}
              serverSideDatasource={datasource}
              serverSideInfiniteScroll={true}
              cacheBlockSize={20}
              debug={false}
              context={{
                navigateFunction: navigate,
              }}
              defaultColDef={defaultReadOnlyColDef}
              onGridReady={(params) => {
                params.api.sizeColumnsToFit();
              }}
              onFirstDataRendered={(params) => {
                params.columnApi.autoSizeAllColumns();
              }}
              enableRangeSelection={true}
            />
          </div>
        )}
      </AutoSizer>
    </Container>
  );
}
