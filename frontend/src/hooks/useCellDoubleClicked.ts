import { CellDoubleClickedEvent } from "ag-grid-community";
import { useUserEmail } from "../contexts/UserEmailContext";
import { allEditableFields } from "../pages/samples/config";
import { awaitLoginPopup } from "../utils/awaitLoginPopup";

/**
 * Returns a `handleCellDoubleClicked` handler for AG Grid tables that contain
 * auth-gated editable sample cells.
 *
 * When an unauthenticated user double-clicks a cell that would be editable once
 * logged in, a login popup is shown. After a successful login the cell is
 * started in edit mode programmatically so the user can proceed without having
 * to double-click again.
 *
 * Cells that are skipped (no popup shown):
 * - User is already logged in
 * - "billed" field — it has its own login prompt inside handleCellEditRequest
 * - Clinical samples (never editable)
 * - Non-revisable samples
 * - Columns not in allEditableFields
 */
export function useCellDoubleClicked() {
  const { userEmail, setUserEmail } = useUserEmail();

  async function handleCellDoubleClicked(params: CellDoubleClickedEvent) {
    if (userEmail) return;

    const field = params.colDef.field;
    if (!field) return;

    // "billed" has its own login prompt inside handleCellEditRequest
    const wouldBeEditable =
      field !== "billed" &&
      params.data?.sampleCategory !== "clinical" &&
      allEditableFields.has(field) &&
      params.data?.revisable === true;

    if (!wouldBeEditable) return;

    const loggedInEmail = await awaitLoginPopup();
    if (!loggedInEmail) return;

    setUserEmail(loggedInEmail);

    // Wait for React to re-render with the updated userEmail in the grid context
    // so that colDef.editable returns true before we start editing programmatically.
    setTimeout(() => {
      params.api.startEditingCell({
        rowIndex: params.rowIndex!,
        colKey: field,
      });
    }, 0);
  }

  return { handleCellDoubleClicked };
}
