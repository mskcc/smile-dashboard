import {
  CellClassParams,
  ColDef,
  EditableCallbackParams,
} from "ag-grid-community";
import { RecordChange } from "../types/shared";
import { createCustomHeader } from "../configs/gridIcons";

interface SetupEditableFieldsParams {
  colDefs: Array<ColDef>;
  editableFieldsList: Set<string>;
  getRecordId: (data: any) => string | undefined;
  isCursorNotAllowed?: (params: CellClassParams) => boolean;
  isEditable?: (params: EditableCallbackParams) => boolean;
}

export function setupEditableFields({
  colDefs,
  editableFieldsList,
  getRecordId,
  isCursorNotAllowed,
  isEditable,
}: SetupEditableFieldsParams) {
  colDefs.forEach((colDef) => {
    const newClassRule = {
      unsubmittedChange: (params: CellClassParams) => {
        const changes: Array<RecordChange> = params.context?.getChanges();
        const changedValue = changes?.find((change) => {
          return (
            change.fieldName === params.colDef.field &&
            change.recordId === getRecordId(params.data)
          );
        });
        return changedValue !== undefined;
      },
      cursorNotAllowed: (params: CellClassParams) => {
        return isCursorNotAllowed
          ? isCursorNotAllowed(params)
          : !params.context?.userEmail ||
              !editableFieldsList.has(params.colDef.field!);
      },
    };

    if (colDef.cellClassRules) {
      colDef.cellClassRules = {
        ...colDef.cellClassRules,
        ...newClassRule,
      };
    } else {
      colDef.cellClassRules = newClassRule;
    }

    if (colDef.valueGetter === undefined) {
      colDef.valueGetter = (params) => {
        if (params.data && params.colDef.field) {
          const changes: Array<RecordChange> = params.context?.getChanges();
          const changedValue = changes?.find((change) => {
            return (
              change.fieldName === params.colDef.field &&
              change.recordId === getRecordId(params.data)
            );
          });
          if (changedValue) {
            return changedValue.newValue;
          } else {
            if (params.colDef.field in params.data) {
              return params.data[params.colDef.field];
            } else {
              return "";
            }
          }
        }
      };
    }

    colDef.editable = (params) => {
      return isEditable
        ? isEditable(params)
        : params.context?.userEmail &&
            editableFieldsList.has(params.colDef.field!);
    };

    if (
      !("headerComponentParams" in colDef) &&
      editableFieldsList.has(colDef.field!)
    ) {
      colDef.headerComponentParams = createCustomHeader("");
    }
  });
}
