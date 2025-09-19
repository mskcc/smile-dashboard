import { AgGridReact } from "ag-grid-react";
import { AgGridReact as AgGridReactType } from "ag-grid-react/lib/agGridReact";
import { RefObject, ClipboardEvent, useState, useEffect } from "react";
import {
  CellEditRequestEvent,
  ColDef,
  ITooltipParams,
} from "ag-grid-community";
import { useNavigate } from "react-router-dom";
import { createCustomHeader, lockIcon } from "../configs/gridIcons";
import { SampleChange } from "../types/shared";
import { CACHE_BLOCK_SIZE } from "../configs/shared";
import { allEditableFields } from "../pages/samples/config";

function getTooltipValue(params: ITooltipParams) {
  if (!params.colDef || !("field" in params.colDef)) return undefined;
  const field = params.colDef.field;
  if (
    (field === "cancerType" || field === "cancerTypeDetailed") &&
    params.value === "N/A"
  ) {
    return (
      "This code might have changed between different versions of the Oncotree API. " +
      "For more details, visit oncotree.mskcc.org/mapping"
    );
  }
  if (
    allEditableFields.has(field!) &&
    params.data?.sampleCategory === "clinical"
  ) {
    return "Clinical samples are not editable";
  }
  if (!allEditableFields.has(field!)) {
    return "This column is read-only";
  }
}

export function AgGridCustomTooltip(props: ITooltipParams) {
  return (
    <div className="ag-custom-tooltip">
      <span>{props.value}</span>
    </div>
  );
}

const defaultColDef: ColDef = {
  sortable: true,
  resizable: true,
  editable: false,
  headerComponentParams: createCustomHeader(lockIcon),
  tooltipValueGetter: (params: ITooltipParams) => getTooltipValue(params),
  tooltipComponent: AgGridCustomTooltip,
};

interface EditableGridProps {
  changes: Array<SampleChange>;
  handleCellEditRequest: (params: CellEditRequestEvent) => Promise<void>;
  handlePaste: (e: ClipboardEvent<HTMLDivElement>) => void;
}

interface NonEditableGridProps {
  changes?: undefined;
  handleCellEditRequest?: undefined;
  handlePaste?: undefined;
}

interface DataGridPropsBase {
  gridRef: RefObject<AgGridReactType<any>>;
  colDefs: Array<ColDef<any>>;
  refreshData: () => void;
  selectedRowIds: string[];
  onSelectionChanged: (ids: string[]) => void;
}

type DataGridProps = DataGridPropsBase &
  // Ensure that either all editing props are used or none are
  (EditableGridProps | NonEditableGridProps);

export function DataGrid({
  gridRef,
  colDefs,
  refreshData,
  changes,
  handleCellEditRequest,
  handlePaste,
  selectedRowIds,
  onSelectionChanged,
}: DataGridProps) {
  const navigate = useNavigate();

  // Restore selection after data changes
  useEffect(() => {
    if (gridRef.current && gridRef.current.api) {
      console.log("Restoring selection for IDs:", selectedRowIds);
      gridRef.current.api.forEachNode((node: any) => {
        node.setSelected(selectedRowIds.includes(node.data?.primaryId));
      });
    }
    console.log("Calling inside of useEffect");
  }, [selectedRowIds, gridRef, colDefs]);

  // Callback for selection change
  const handleGridSelectionChanged = (event: any) => {
    const selectedNodes = event.api.getSelectedNodes();
    const ids = selectedNodes.map((node: any) => node.data?.primaryId);
    onSelectionChanged(ids);
  };

  return (
    <div className="ag-theme-alpine flex-grow-1" onPaste={handlePaste}>
      <AgGridReact
        ref={gridRef}
        rowModelType="serverSide"
        serverSideInfiniteScroll={true}
        cacheBlockSize={CACHE_BLOCK_SIZE}
        columnDefs={colDefs}
        defaultColDef={defaultColDef}
        enableRangeSelection={true}
        onFirstDataRendered={(params) => params.columnApi.autoSizeAllColumns()}
        onGridColumnsChanged={() => refreshData()}
        context={{
          getChanges: () => changes,
          navigateFunction: navigate,
        }}
        rowClassRules={{
          unlocked: (params) => params.data?.revisable === true,
          locked: (params) => params.data?.revisable === false,
        }}
        onCellEditRequest={handleCellEditRequest}
        readOnlyEdit={true}
        tooltipShowDelay={0}
        tooltipHideDelay={60000}
        tooltipMouseTrack={true}
        suppressClipboardPaste={true}
        // these props are for checkbox selection
        rowSelection="multiple"
        suppressRowClickSelection={true}
        onSelectionChanged={handleGridSelectionChanged}
      />
    </div>
  );
}
