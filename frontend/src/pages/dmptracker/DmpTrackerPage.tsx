import { useRef, useState } from "react";
import { buildDownloadOptions, dmpTrackerColDefs } from "./config";
import {
  DmpTrackerRecord,
  useDmpTrackerRecordsLazyQuery,
} from "../../generated/graphql";
import { DataGridLayout } from "../../components/DataGridLayout";
import { Title } from "../../components/Title";
import { Toolbar } from "../../components/Toolbar";
import { Col } from "react-bootstrap";
import { ErrorMessage } from "../../components/ErrorMessage";
import { useFetchData } from "../../hooks/useFetchData";
import { AgGridReact as AgGridReactType } from "ag-grid-react/lib/agGridReact";
import { DataGrid } from "../../components/DataGrid";
import { SearchBar } from "../../components/SearchBar";
import { DownloadButton } from "../../components/DownloadButton";
import { useDownload } from "../../hooks/useDownload";

const RECORD_NAME = "dmpTrackerRecords";
const QUERY_NAME = "dmpTrackerRecords";
const INITIAL_SORT_FIELD_NAME = "last_modified_date";

export function DmpTrackerPage() {
  const [userSearchVal, setUserSearchVal] = useState("");
  const gridRef = useRef<AgGridReactType<DmpTrackerRecord>>(null);
  const [colDefs, setColDefs] = useState(dmpTrackerColDefs);

  const { refreshData, recordCount, isLoading, error, fetchMore } =
    useFetchData({
      useRecordsLazyQuery: useDmpTrackerRecordsLazyQuery,
      queryName: QUERY_NAME,
      initialSortFieldName: INITIAL_SORT_FIELD_NAME,
      gridRef,
      userSearchVal,
    });

  const { isDownloading, handleDownload, getCurrentData } =
    useDownload<DmpTrackerRecord>({
      gridRef,
      downloadFileName: RECORD_NAME,
      fetchMore,
      userSearchVal,
      recordCount,
      queryName: QUERY_NAME,
    });

  const downloadOptions = buildDownloadOptions({
    getCurrentData,
    currentColDefs: dmpTrackerColDefs,
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

          {/* <div className="vr" /> */}
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
        selectedRowIds={[]}
        onSelectionChanged={() => {}}
      />
    </DataGridLayout>
  );
}
