import {
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import jsdownload from "js-file-download";
import { AgGridReact as AgGridReactType } from "ag-grid-react/lib/agGridReact";
import { useNavigate, useParams } from "react-router-dom";
import {
  AgGridSortDirection,
  DashboardRecordContext,
  DashboardSample,
  useDashboardSampleHistoryLazyQuery,
  useDashboardSamplesLazyQuery,
} from "../generated/graphql";
import { useFetchData } from "../hooks/useFetchData";
import { useCellChanges } from "../hooks/useCellChanges";
import {
  useDownload,
  DownloadOption,
  buildTsvString,
} from "../hooks/useDownload";
import {
  buildDownloadOptions,
  fieldToHeaderName,
  phiModeSwitchTooltipContent,
} from "../pages/samples/config";
import { useTogglePhiColumnsVisibility } from "../hooks/useTogglePhiColumns";
import { ErrorMessage } from "./ErrorMessage";
import { Title } from "../components/Title";
import { Toolbar } from "../components/Toolbar";
import { Button, Col, Modal } from "react-bootstrap";
import { SearchBar } from "../components/SearchBar";
import { PhiModeSwitch } from "./PhiModeSwitch";
import { CellChangesContainer } from "./CellChangesContainer";
import { DownloadButton } from "../components/DownloadButton";
import { DataGrid } from "./DataGrid";
import { DownloadModal } from "./DownloadModal";
import { ColDef } from "ag-grid-community";
import {
  CACHE_BLOCK_SIZE,
  POLL_INTERVAL,
  ROUTE_PARAMS,
} from "../configs/shared";
import { RecordChange } from "../types/shared";
import { useCellDoubleClicked } from "../hooks/useCellDoubleClicked";

const QUERY_NAME = "dashboardSamples";
const INITIAL_SORT_FIELD_NAME = "importDate";
const PHI_FIELDS = new Set(["sequencingDate"]);

interface SamplesModalProps {
  sampleColDefs: Array<ColDef>;
  contextFieldName: string;
  parentRecordName: keyof typeof ROUTE_PARAMS;
  showPhiModeSwitch?: boolean;
}

export function SamplesModal({
  sampleColDefs,
  contextFieldName,
  parentRecordName,
  showPhiModeSwitch = false,
}: SamplesModalProps) {
  const [userSearchVal, setUserSearchVal] = useState("");
  const [colDefs, setColDefs] = useState(sampleColDefs);
  const parentRecordId = useParams()[ROUTE_PARAMS[parentRecordName]];
  const gridRef = useRef<AgGridReactType<DashboardSample>>(null);
  const { handleCellDoubleClicked } = useCellDoubleClicked();

  const {
    refreshData,
    recordCount,
    isLoading,
    error,
    data,
    fetchMore,
    startPolling,
    stopPolling,
  } = useFetchData({
    useRecordsLazyQuery: useDashboardSamplesLazyQuery,
    queryName: QUERY_NAME,
    initialSortFieldName: INITIAL_SORT_FIELD_NAME,
    gridRef,
    userSearchVal,
    recordContexts: [
      {
        fieldName: contextFieldName,
        values: [parentRecordId!],
      },
    ],
    pollInterval: POLL_INTERVAL,
  });

  const {
    changes,
    setChanges,
    cellChangesHandlers,
    handleCellEditRequest,
    handlePaste,
  } = useCellChanges({
    gridRef,
    startPolling,
    stopPolling,
    records: data?.[QUERY_NAME],
    refreshData,
    isSampleLevelChanges: true,
  });

  const { isDownloading, handleDownload, getCurrentData } =
    useDownload<DashboardSample>({
      gridRef,
      downloadFileName: `${parentRecordName.slice(
        0,
        -1
      )}_${parentRecordId}_samples`,
      fetchMore,
      userSearchVal,
      recordCount,
      queryName: QUERY_NAME,
    });

  const downloadOptions = buildDownloadOptions({
    getCurrentData,
    currentColDefs: colDefs,
  });

  const { handlePhiColumnsVisibilityBeforeSearch } =
    useTogglePhiColumnsVisibility({
      setColDefs,
      phiFields: PHI_FIELDS,
      userSearchVal,
    });

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <ModalContainerWithClosingWarning
      changes={changes}
      setChanges={setChanges}
      parentRecordName={parentRecordName}
    >
      <Toolbar>
        <Col />

        <Col md="auto" className="d-flex gap-3 align-items-center">
          <SearchBar
            userSearchVal={userSearchVal}
            setUserSearchVal={setUserSearchVal}
            onBeforeSearch={handlePhiColumnsVisibilityBeforeSearch}
            onSearch={refreshData}
            recordCount={recordCount}
            isLoading={isLoading}
          />

          {showPhiModeSwitch && (
            <>
              <div className="vr" />
              <PhiModeSwitch>{phiModeSwitchTooltipContent}</PhiModeSwitch>
            </>
          )}

          {changes.length > 0 && (
            <CellChangesContainer
              changes={changes}
              cellChangesHandlers={cellChangesHandlers}
              isSampleLevelChanges={true}
              fieldToHeaderName={fieldToHeaderName}
            />
          )}
        </Col>

        <Col className="text-end">
          <DownloadButton
            downloadOptions={downloadOptions}
            onDownload={handleDownload}
          />
        </Col>
      </Toolbar>

      <DataGrid
        gridRef={gridRef}
        colDefs={colDefs}
        refreshData={refreshData}
        changes={changes}
        handleCellEditRequest={handleCellEditRequest}
        handlePaste={handlePaste}
        selectedRowIds={[]}
        onSelectionChanged={() => {}}
        onCellDoubleClicked={handleCellDoubleClicked}
      />

      {isDownloading && <DownloadModal />}
    </ModalContainerWithClosingWarning>
  );
}

const HISTORY_QUERY_NAME = "dashboardSampleHistory";
const HISTORY_INITIAL_SORT_FIELD_NAME = "importDate";
const HISTORY_EXCLUDED_FIELDS = new Set<keyof DashboardSample>([
  "__typename",
  "_total",
  "recordId",
  "importDate",
  "changelog",
  "validationReport",
  "validationStatus",
]);

interface SampleHistoryRow {
  fieldName: string;
  lastUpdated: string;
  groupLabel: string;
  oldValue: string;
  newValue: string;
  reasonForChange: string;
}

function computeHistoryDiffs(records: DashboardSample[]): SampleHistoryRow[] {
  if (records.length < 2) return [];

  // Sort ascending (oldest first) so we diff each version against the one before it
  const sorted = [...records].sort(
    (a, b) =>
      new Date(a.importDate ?? "").getTime() -
      new Date(b.importDate ?? "").getTime()
  );

  const diffs: SampleHistoryRow[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const older = sorted[i - 1];
    const newer = sorted[i];
    const reasonForChange = newer.changelog ?? "";
    const lastUpdated = newer.importDate ?? "";
    const groupLabel = reasonForChange
      ? `${lastUpdated} — ${reasonForChange}`
      : lastUpdated;
    for (const key of Object.keys(newer) as (keyof DashboardSample)[]) {
      if (HISTORY_EXCLUDED_FIELDS.has(key)) continue;
      const oldVal = older[key] == null ? "" : String(older[key]);
      const newVal = newer[key] == null ? "" : String(newer[key]);
      if (oldVal !== newVal) {
        diffs.push({
          fieldName: key,
          lastUpdated,
          groupLabel,
          oldValue: oldVal,
          newValue: newVal,
          reasonForChange,
        });
      }
    }
  }

  // Most recent changes first
  return diffs.sort(
    (a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  );
}

const historyColDefs: ColDef<SampleHistoryRow>[] = [
  { field: "groupLabel", rowGroup: true, hide: true },
  {
    field: "fieldName",
    headerName: "Column",
    valueFormatter: (p) => fieldToHeaderName(p.value),
  },
  { field: "oldValue", headerName: "Old Value" },
  { field: "newValue", headerName: "New Value" },
];

// Flat col defs used only for TSV export (no grouping, all fields visible)
const historyExportColDefs: ColDef<SampleHistoryRow>[] = [
  { field: "lastUpdated", headerName: "Last Updated" },
  { field: "reasonForChange", headerName: "Reason for Change" },
  ...historyColDefs.filter((c) => !c.rowGroup),
];

const historyAutoGroupColumnDef: ColDef = {
  headerName: "Last Updated",
  field: "groupLabel",
  sort: "desc",
  valueFormatter: (params) =>
    (params.node?.parent?.childrenAfterGroup?.length ?? 0) > 1
      ? ""
      : params.value ?? "",
};

interface SampleHistoryModalProps {
  recordContext: DashboardRecordContext;
  parentRecordName: keyof typeof ROUTE_PARAMS;
}

export function SampleHistoryModal({
  recordContext,
  parentRecordName,
}: SampleHistoryModalProps) {
  const smileSampleId = recordContext.values?.[0] ?? "";
  const [isDownloading, setIsDownloading] = useState(false);

  const [fetchHistory, { data, loading: isLoading, error }] =
    useDashboardSampleHistoryLazyQuery({
      variables: {
        searchVals: [smileSampleId],
        sort: {
          colId: HISTORY_INITIAL_SORT_FIELD_NAME,
          sort: AgGridSortDirection.Desc,
        },
        limit: CACHE_BLOCK_SIZE,
        offset: 0,
      },
    });

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const historyRecords = useMemo(
    () => (data?.[HISTORY_QUERY_NAME] ?? []) as DashboardSample[],
    [data]
  );
  const diffs = useMemo(
    () => computeHistoryDiffs(historyRecords),
    [historyRecords]
  );

  const firstRecord = data?.[HISTORY_QUERY_NAME]?.[0] as
    | DashboardSample
    | undefined;
  const displayText = `${firstRecord?.primaryId ?? "sample"} metadata history`;
  const downloadFileName = `${
    firstRecord?.primaryId ?? "sample"
  }_metadata_history`;

  const historyDownloadOptions: DownloadOption[] = [
    {
      buttonLabel: "Download as TSV",
      columnDefsForDownload: historyExportColDefs,
      dataGetter: async () => diffs,
    },
  ];

  async function handleDownload(downloadOption: DownloadOption) {
    setIsDownloading(true);
    const data = await downloadOption.dataGetter();
    const tsvString = buildTsvString({
      rows: data,
      colDefs: downloadOption.columnDefsForDownload,
      columns: [],
    });
    jsdownload(tsvString, `${downloadFileName}.tsv`);
    setIsDownloading(false);
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <ModalContainerWithClosingWarning
      parentRecordName={parentRecordName}
      displayText={displayText}
    >
      <Toolbar>
        <Col />

        <Col md="auto" className="d-flex gap-3 align-items-center">
          {isLoading && <span>Loading...</span>}
        </Col>

        <Col className="text-end">
          <DownloadButton
            downloadOptions={historyDownloadOptions}
            onDownload={handleDownload}
          />
        </Col>
      </Toolbar>
      <div className="ag-theme-alpine flex-grow-1">
        <AgGridReactType
          rowData={diffs}
          columnDefs={historyColDefs}
          groupRemoveSingleChildren={true}
          autoGroupColumnDef={historyAutoGroupColumnDef}
          groupDefaultExpanded={1}
          onFirstDataRendered={(e) => e.columnApi.autoSizeAllColumns()}
        />
      </div>

      {isDownloading && <DownloadModal />}
    </ModalContainerWithClosingWarning>
  );
}

interface ModalContainerProps {
  changes?: Array<RecordChange>;
  setChanges?: Dispatch<SetStateAction<Array<RecordChange>>>;
  parentRecordName: keyof typeof ROUTE_PARAMS;
  children: ReactNode;
  displayText?: string;
}

function ModalContainerWithClosingWarning({
  changes = [],
  setChanges,
  parentRecordName,
  children,
  displayText,
}: ModalContainerProps) {
  const navigate = useNavigate();
  const parentRecordId = useParams()[ROUTE_PARAMS[parentRecordName]];
  const [showClosingWarning, setShowClosingWarning] = useState(false);

  function handleModalClose() {
    if (changes.length > 0) {
      setShowClosingWarning(true);
    } else {
      navigate(`/${parentRecordName}`);
    }
  }

  function handleClosingWarningCancel() {
    setShowClosingWarning(false);
  }

  function handleClosingWarningContinue() {
    setShowClosingWarning(false);
    setChanges?.([]);
    navigate(`/${parentRecordName}`);
  }

  const parentRecordType = parentRecordName.slice(0, -1);
  const defaultDisplayText = `${parentRecordType} ${parentRecordId}'s samples`;
  const modalDisplayText = displayText ?? defaultDisplayText;
  return (
    <>
      {/* Modal for displaying the data grid */}
      <Modal show={true} dialogClassName="modal-90w" onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Title>{`Viewing ${modalDisplayText}`}</Title>
        </Modal.Header>
        <Modal.Body>
          <div className="popupHeight d-flex flex-column">{children}</div>
        </Modal.Body>
      </Modal>

      {/* Show closing warning when there are unsaved changes */}
      {showClosingWarning && (
        <Modal
          show={true}
          centered
          onHide={handleClosingWarningCancel}
          className="overlay"
        >
          <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
              Are you sure you want to exit?
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              Exiting this view will discard all your unsubmitted changes. Click
              "Cancel" to remain in this samples view.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button
              className={"btn btn-secondary"}
              onClick={handleClosingWarningCancel}
            >
              Cancel
            </Button>
            <Button
              className={"btn btn-danger"}
              onClick={handleClosingWarningContinue}
            >
              Continue Exiting
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
}
