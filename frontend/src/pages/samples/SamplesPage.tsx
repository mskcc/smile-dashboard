import { useRef, useState } from "react";
import { DataGrid } from "../../components/DataGrid";
import { AgGridReact } from "ag-grid-react";
import type { AgGridReact as AgGridReactType } from "ag-grid-react";
import { useFetchData } from "../../hooks/useFetchData";
import {
  DashboardSample,
  useDashboardSamplesLazyQuery,
} from "../../generated/graphql";
import { Title } from "../../components/Title";
import { Toolbar } from "../../components/Toolbar";
import { SearchBar } from "../../components/SearchBar";
import {
  buildDownloadOptions,
  filterButtonOptions,
  filterButtonsTooltipContent,
  phiModeSwitchTooltipContent,
} from "./config";
import { Button, Col, Container, Modal } from "react-bootstrap";
import { FilterButtons } from "../../components/FilterButtons";
import { ErrorMessage } from "../../components/ErrorMessage";
import { DownloadButton } from "../../components/DownloadButton";
import { DownloadModal } from "../../components/DownloadModal";
import { useDownload } from "../../hooks/useDownload";
import { PhiModeSwitch } from "../../components/PhiModeSwitch";
import { useTogglePhiColumnsVisibility } from "../../hooks/useTogglePhiColumns";
import { useCellChanges } from "../../hooks/useCellChanges";
import { CellChangesContainer } from "../../components/CellChangesContainer";
import { DataGridLayout } from "../../components/DataGridLayout";
import { POLL_INTERVAL } from "../../configs/shared";
import { PopupWindow } from "../../components/PopupWindow";

const QUERY_NAME = "dashboardSamples";
const INITIAL_SORT_FIELD_NAME = "importDate";
const RECORD_NAME = "samples";
const PHI_FIELDS = new Set(["sequencingDate"]);

export function SamplesPage() {
  const [userSearchVal, setUserSearchVal] = useState("");
  const [colDefs, setColDefs] = useState(filterButtonOptions[0].colDefs);
  const [recordContexts, setRecordContexts] = useState(
    filterButtonOptions[0].recordContexts
  );
  const gridRef = useRef<AgGridReactType<DashboardSample>>(null);

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
    recordContexts,
    pollInterval: POLL_INTERVAL,
  });
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [showSelectedPopup, setShowSelectedPopup] = useState(false);
  const [isSelectedPopupClosed, setIsSelectedPopupClosed] = useState(false);

  // Callback for selection change
  const handleSelectionChanged = (ids: string[]) => {
    console.log("Selection Changed Event:", ids);
    // const selectedNodes = event.api.getSelectedNodes();
    // const ids = selectedNodes.map((node: any) => node.data?.primaryId);
    setSelectedRowIds(ids);
    // setShowSelectedPopup(ids.length > 0); // Show popup if any rows are selected
    if (isSelectedPopupClosed && ids.length > 0) {
      setIsSelectedPopupClosed(false);
    }

    // You can also call another function or pass these IDs up as needed
    console.log("Selected Row IDs:", ids);
  };

  const { changes, cellChangesHandlers, handleCellEditRequest, handlePaste } =
    useCellChanges({
      gridRef,
      startPolling,
      stopPolling,
      samples: data?.[QUERY_NAME],
      refreshData,
    });

  const { isDownloading, handleDownload, getCurrentData } =
    useDownload<DashboardSample>({
      gridRef,
      downloadFileName: RECORD_NAME,
      fetchMore,
      userSearchVal,
      recordCount,
      queryName: QUERY_NAME,
    });

  const downloadOptions = buildDownloadOptions({
    getCurrentData,
    currentColDefs: colDefs,
  });

  function handleFilterButtonClick(filterButtonLabel: string) {
    const selectedFilterButtonOption = filterButtonOptions.find(
      (option) => option.label === filterButtonLabel
    );
    setColDefs(selectedFilterButtonOption!.colDefs);
    setRecordContexts(selectedFilterButtonOption!.recordContexts);
    refreshData();
  }

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
    <DataGridLayout>
      <Title>{RECORD_NAME}</Title>

      <Toolbar>
        <Col>
          <FilterButtons
            options={filterButtonOptions}
            onClick={handleFilterButtonClick}
          >
            {filterButtonsTooltipContent}
          </FilterButtons>
        </Col>

        <Col md="auto" className="d-flex gap-3 align-items-center">
          <SearchBar
            userSearchVal={userSearchVal}
            setUserSearchVal={setUserSearchVal}
            onBeforeSearch={handlePhiColumnsVisibilityBeforeSearch}
            onSearch={refreshData}
            recordCount={recordCount}
            isLoading={isLoading}
          />

          {/* Only show PHI mode switch on "All" view */}
          {recordContexts === undefined && (
            <>
              <div className="vr" />
              <PhiModeSwitch>{phiModeSwitchTooltipContent}</PhiModeSwitch>
            </>
          )}

          {changes.length > 0 && (
            <CellChangesContainer
              changes={changes}
              cellChangesHandlers={cellChangesHandlers}
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
        selectedRowIds={selectedRowIds}
        onSelectionChanged={handleSelectionChanged}
      />

      {isDownloading && <DownloadModal />}

      {/* Popup for selected IDs */}
      {/* <Modal 
        show={!isSelectedPopupClosed}
        onHide={() => setIsSelectedPopupClosed(true)}
        backdrop={false}
        keyboard={true}

      >
        <Modal.Header closeButton>
          <Modal.Title>Selected Row IDs</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRowIds.length === 0 ? (
            <div>No rows selected.</div>
          ) : (
            <ul>
              {selectedRowIds.map((id) => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setIsSelectedPopupClosed(true)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal> */}
      <br />
      {/* Popup for selected IDs in a separate window */}
      {!isSelectedPopupClosed && selectedRowIds.length > 0 && (
        <Container
          className="ag-theme-alpine flex-grow-1"
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            borderRadius: "5px",
            backgroundColor: "#f9f9f9",
          }}
        >
          {/* <div className="d-flex align-items-center gap-1" style={{ padding: 20 }}> */}
          {/* <h4>Selected Row IDs</h4> */}
          {console.log("\n\n\nROW DATA FOR POPUP:", selectedRowIds)}
          <AgGridReact
            columnDefs={[
              {
                headerName: "primaryId",
                field: "primaryId",
                sortable: true,
                filter: true,
              },
            ]}
            rowData={selectedRowIds.map((id) => ({ primaryId: id }))}
          />
          <br />
          <Button
            variant="secondary"
            onClick={() => setIsSelectedPopupClosed(true)}
          >
            Close
          </Button>
        </Container>
      )}
    </DataGridLayout>
  );
}

export interface CohortBuilderSample {
  primaryId: string;
}
