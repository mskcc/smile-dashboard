import { SortDirection, Sample, SampleWhere } from "../generated/graphql";
import AutoSizer from "react-virtualized-auto-sizer";
import { Button, Col } from "react-bootstrap";
import { FunctionComponent, useEffect, useRef } from "react";
import { DownloadModal } from "./DownloadModal";
import { UpdateModal } from "./UpdateModal";
import { AlertModal } from "./AlertModal";
import { CSVFormulate } from "../utils/CSVExport";
import { SampleChange, SampleMetadataExtended } from "../shared/helpers";
import { AgGridReact } from "ag-grid-react";
import { useState } from "react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "ag-grid-enterprise";
import { CellValueChangedEvent, ColDef } from "ag-grid-community";
import { ErrorMessage, LoadingSpinner, Toolbar } from "../shared/tableElements";

const POLLING_INTERVAL = 2000;
const max_rows = 500;

interface ISampleListProps {
  columnDefs: ColDef[];
  defaultColDef: ColDef;
  useSampleRecordsQuery: any;
  getSamplesFromQueryData: (data: any) => Sample[];
  getRowData: (samples: Sample[]) => any[];
  height: number;
  setUnsavedChanges?: (val: boolean) => void;
  searchVariables?: SampleWhere;
  filter: (searchVal: string) => SampleWhere;
  exportFileName?: string;
}

export const SamplesList: FunctionComponent<ISampleListProps> = ({
  columnDefs,
  defaultColDef,
  useSampleRecordsQuery,
  getSamplesFromQueryData,
  getRowData,
  searchVariables,
  filter,
  height,
  setUnsavedChanges,
  exportFileName,
}) => {
  const { loading, error, data, startPolling, stopPolling, refetch } =
    useSampleRecordsQuery({
      variables: {
        ...(searchVariables
          ? {
              where: {
                ...searchVariables,
              },
            }
          : {
              first: max_rows,
            }),
        sampleMetadataOptions: {
          sort: [{ importDate: SortDirection.Desc }],
          limit: 1,
        },
        bamCompletesOptions: {
          sort: [{ date: SortDirection.Desc }],
          limit: 1,
        },
        mafCompletesOptions: {
          sort: [{ date: SortDirection.Desc }],
          limit: 1,
        },
        qcCompletesOptions: {
          sort: [{ date: SortDirection.Desc }],
          limit: 1,
        },
      },
      pollInterval: POLLING_INTERVAL,
    });

  const [val, setVal] = useState("");
  const [searchVal, setSearchVal] = useState("");
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [changes, setChanges] = useState<SampleChange[]>([]);
  const [editMode, setEditMode] = useState(true);
  const gridRef = useRef<any>(null);

  useEffect(() => {
    gridRef.current?.api?.showLoadingOverlay();
    async function refetchSearchVal() {
      await refetch({
        where: filter(searchVal),
      });
    }
    refetchSearchVal().then(() => {
      gridRef.current?.api?.hideOverlay();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchVal]);

  if (loading) return <LoadingSpinner />;

  if (error) return <ErrorMessage error={error} />;

  const samples = getSamplesFromQueryData(data);

  const remoteCount = samples.length;

  const onCellValueChanged = (
    params: CellValueChangedEvent<SampleMetadataExtended>
  ) => {
    if (editMode) {
      const { oldValue, newValue } = params;
      const rowNode = params.node;
      const fieldName = params.colDef.field!;
      const primaryId = params.data.primaryId;

      setChanges((changes) => {
        const change = changes.find(
          (c) => c.primaryId === primaryId && c.fieldName === fieldName
        );
        if (change) {
          change.newValue = newValue;
        } else {
          changes.push({ primaryId, fieldName, oldValue, newValue, rowNode });
        }
        // we always have produce a new array to trigger re-render
        return [...changes];
      });

      setUnsavedChanges?.(true);
    }
  };

  const handleDiscardChanges = () => {
    setEditMode(false);

    setTimeout(() => {
      startPolling(POLLING_INTERVAL);
    }, 10000);

    setUnsavedChanges?.(false);
    setChanges([]);
    setTimeout(() => {
      setEditMode(true);
    }, 0);
  };

  return (
    <>
      {showDownloadModal && (
        <DownloadModal
          loader={() => {
            return Promise.resolve(
              CSVFormulate(getRowData(samples), columnDefs)
            );
          }}
          onComplete={() => {
            setShowDownloadModal(false);
          }}
          exportFileName={exportFileName || "samples.tsv"}
        />
      )}

      {showUpdateModal && (
        <UpdateModal
          changes={changes}
          samples={samples}
          onSuccess={handleDiscardChanges}
          onHide={() => setShowUpdateModal(false)}
          onOpen={() => stopPolling()}
        />
      )}

      <AlertModal
        show={showAlertModal}
        onHide={() => {
          setShowAlertModal(false);
        }}
        title={"Limit reached"}
        content={
          "You've reached the maximum number of samples that can be displayed. Please refine your search to see more samples."
        }
      />

      <Toolbar
        searchTerm={"samples"}
        input={val}
        setInput={setVal}
        handleSearch={() => {
          setSearchVal(val);
        }}
        clearInput={() => {
          setSearchVal("");
        }}
        matchingResultsCount={
          remoteCount === max_rows
            ? `${max_rows}+ matching samples`
            : `${remoteCount} matching samples`
        }
        handleDownload={() => setShowDownloadModal(true)}
        customUI={
          changes.length > 0 ? (
            <>
              <Col className={"text-end"}>
                <Button
                  className={"btn btn-secondary"}
                  onClick={handleDiscardChanges}
                  size={"sm"}
                >
                  Discard Changes
                </Button>
              </Col>

              <Col className={"text-start"}>
                <Button
                  className={"btn btn-success"}
                  onClick={() => {
                    setShowUpdateModal(true);
                  }}
                  size={"sm"}
                >
                  Submit Updates
                </Button>
              </Col>
            </>
          ) : undefined
        }
      />

      <AutoSizer>
        {({ width }) => (
          <div
            className="ag-theme-alpine"
            style={{ height: height, width: width }}
          >
            <AgGridReact<SampleMetadataExtended>
              getRowId={(d) => {
                return d.data.primaryId;
              }}
              rowClassRules={{
                unlocked: function (params) {
                  return params.data?.revisable === true;
                },
                locked: function (params) {
                  return params.data?.revisable === false;
                },
                "validation-error": function (params) {
                  const validationStatus =
                    params.data?.hasStatusStatuses[0]?.validationStatus;
                  return (
                    params.data?.revisable === true &&
                    (validationStatus === false ||
                      validationStatus === undefined)
                  );
                },
              }}
              columnDefs={columnDefs}
              rowData={getRowData(samples)}
              onCellEditRequest={onCellValueChanged}
              readOnlyEdit={true}
              defaultColDef={defaultColDef}
              ref={gridRef}
              context={{
                getChanges: () => changes,
              }}
              enableRangeSelection={true}
              onGridReady={(params) => {
                params.api.sizeColumnsToFit();
              }}
              onFirstDataRendered={(params) => {
                params.columnApi.autoSizeAllColumns();
              }}
              tooltipShowDelay={0}
              tooltipHideDelay={60000}
              onBodyScrollEnd={(params) => {
                if (params.api.getLastDisplayedRow() + 1 === max_rows) {
                  setShowAlertModal(true);
                }
              }}
            />
          </div>
        )}
      </AutoSizer>
    </>
  );
};
