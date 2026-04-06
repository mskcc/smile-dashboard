import { ColDef } from "ag-grid-community";

export function buildFieldToHeaderName(
  colDefs: ColDef[]
): (field: string) => string {
  const fieldToHeaderNameMap = new Map(
    colDefs
      .filter((col) => col.field && col.headerName)
      .map((col) => [col.field!, col.headerName!])
  );
  return (field: string) => fieldToHeaderNameMap.get(field) ?? field;
}
