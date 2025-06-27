import { AgGridReact as AgGridReactType } from "ag-grid-react/lib/agGridReact";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "ag-grid-enterprise";
import {
  CellEditRequestEvent,
  CellValueChangedEvent,
  ColDef,
} from "ag-grid-community";

/**
 * Custom handler for paste events in AG Grid.
 *
 * Native paste behavior is incompatible with our use of AG Grid's Server-Side Row Model combined with
 * Read-Only Edits. It attempts to update the grid data directly, which differs from our approach of tracking
 * changes in a separate state, allowing users to review and confirm edits before sending them to the server.
 */
export async function handleAgGridPaste({
  e,
  gridRef,
  columnDefs,
  onCellEditRequest,
}: {
  e: React.ClipboardEvent<HTMLDivElement>;
  gridRef: React.RefObject<AgGridReactType>;
  columnDefs: ColDef[];
  onCellEditRequest: (params: CellValueChangedEvent) => Promise<void>;
}) {
  e.preventDefault();
  if (!gridRef.current || !gridRef.current.api) return;
  const gridApi = gridRef.current.api;

  // Get the clipboard value that will be used for pasting
  const clipboardData = e.clipboardData.getData("text/plain");
  const clipboardValue = clipboardData
    ? clipboardData.split(/\r?\n|\t/)[0]
    : "";

  // Determine the locations of the cell(s) to paste over
  let cellCoordidatesToPasteOver: Array<{ rowIndex: number; colId: string }> =
    [];
  const cellRanges = gridApi.getCellRanges();
  if (cellRanges && cellRanges.length > 0) {
    cellRanges.forEach((range) => {
      const startRow = range.startRow?.rowIndex ?? 0;
      const endRow = range.endRow?.rowIndex ?? 0;
      const minRow = Math.min(startRow, endRow);
      const maxRow = Math.max(startRow, endRow);
      range.columns.forEach((col) => {
        for (let rowIndex = minRow; rowIndex <= maxRow; rowIndex++) {
          cellCoordidatesToPasteOver.push({
            rowIndex,
            colId: col.getColId(),
          });
        }
      });
    });
  } else {
    const focusedCell = gridApi.getFocusedCell();
    if (focusedCell) {
      cellCoordidatesToPasteOver.push({
        rowIndex: focusedCell.rowIndex,
        colId: focusedCell.column.getColId(),
      });
    }
  }

  // For each cell to paste over, call the onCellEditRequest handler
  for (const { rowIndex, colId } of cellCoordidatesToPasteOver) {
    const node = gridApi.getDisplayedRowAtIndex(rowIndex);
    const rowData = node?.data;
    if (!rowData) continue;
    const oldValue = rowData[colId];
    const newValue = clipboardValue;
    const params = {
      data: rowData,
      colDef: columnDefs.find((c) => c.field === colId),
      oldValue,
      newValue,
      node,
    } as CellEditRequestEvent;
    await onCellEditRequest(params);
  }
}
