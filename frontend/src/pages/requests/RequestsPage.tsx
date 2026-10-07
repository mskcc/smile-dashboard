import { useRef, useState } from "react";
import { DataGrid } from "../../components/DataGrid";
import { AgGridReact as AgGridReactType } from "ag-grid-react/lib/agGridReact";
import { useFetchData } from "../../hooks/useFetchData";
import {
  DashboardRequest,
  useDashboardRequestsLazyQuery,
} from "../../generated/graphql";
import { Title } from "../../components/Title";
import { Toolbar } from "../../components/Toolbar";
import { SearchBar } from "../../components/SearchBar";
import {
  buildDownloadOptions,
  fieldToHeaderName,
  requestColDefs,
} from "./config";
import { Col } from "react-bootstrap";
import { ErrorMessage } from "../../components/ErrorMessage";
import { DownloadButton } from "../../components/DownloadButton";
import { DownloadModal } from "../../components/DownloadModal";
import { useDownload } from "../../hooks/useDownload";
import { useParams } from "react-router-dom";
import { SamplesModal } from "../../components/SamplesModal";
import { DataGridLayout } from "../../components/DataGridLayout";
import { ROUTE_PARAMS } from "../../configs/shared";
import { sampleColDefs } from "../samples/config";
import { useCellChanges } from "../../hooks/useCellChanges";
import { useCellDoubleClicked } from "../../hooks/useCellDoubleClicked";
import { CellChangesContainer } from "../../components/CellChangesContainer";

const QUERY_NAME = "dashboardRequests";
const INITIAL_SORT_FIELD_NAME = "importDate";
const RECORD_NAME = "requests";

export function RequestsPage() {
  const [userSearchVal, setUserSearchVal] = useState("");
  const gridRef = useRef<AgGridReactType<DashboardRequest>>(null);
  const hasParams = Object.keys(useParams()).length > 0;
  const { handleCellDoubleClicked } = useCellDoubleClicked("request");

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
    useRecordsLazyQuery: useDashboardRequestsLazyQuery,
    queryName: QUERY_NAME,
    initialSortFieldName: INITIAL_SORT_FIELD_NAME,
    gridRef,
    userSearchVal,
  });

  const { changes, cellChangesHandlers, handleCellEditRequest, handlePaste } =
    useCellChanges({
      gridRef,
      startPolling,
      stopPolling,
      records: data?.[QUERY_NAME],
      refreshData,
      recordType: "request",
    });

  const { isDownloading, handleDownload, getCurrentData } =
    useDownload<DashboardRequest>({
      gridRef,
      downloadFileName: RECORD_NAME,
      fetchMore,
      userSearchVal,
      recordCount,
      queryName: QUERY_NAME,
    });

  const downloadOptions = buildDownloadOptions({
    getCurrentData,
    currentColDefs: requestColDefs,
  });

  if (error) {
    return <ErrorMessage error={error} />;
  }

  return (
    <DataGridLayout>
      <Title>{RECORD_NAME}</Title>

      <Toolbar>
        <Col />

        <Col md="auto" className="d-flex gap-3 align-items-center">
          <SearchBar
            userSearchVal={userSearchVal}
            setUserSearchVal={setUserSearchVal}
            onSearch={refreshData}
            recordCount={recordCount}
            isLoading={isLoading}
          />
          {changes.length > 0 && (
            <CellChangesContainer
              changes={changes}
              cellChangesHandlers={cellChangesHandlers}
              recordType="request"
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
        colDefs={requestColDefs}
        refreshData={refreshData}
        changes={changes}
        handleCellEditRequest={handleCellEditRequest}
        handlePaste={handlePaste}
        onCellDoubleClicked={handleCellDoubleClicked}
        selectedRowIds={[]}
        onSelectionChanged={() => {}}
      />

      {hasParams && (
        <SamplesModal
          sampleColDefs={sampleColDefs}
          contextFieldName={ROUTE_PARAMS.requests}
          parentRecordName={RECORD_NAME}
          showForceLabelButton={true}
        />
      )}

      {isDownloading && <DownloadModal />}
    </DataGridLayout>
  );
}
