import { ColumnDefinition } from "../pages/requests/helpers";

export function CSVFormulate(
  requests: any[],
  columnDefinitions: ColumnDefinition[]
) {
  const csvString = [
    columnDefinitions.map(item => item.label).join("\t"),
    ...requests
      .map(req =>
        columnDefinitions.map(col => {
          if (col.cellDataGetter) {
            return col.cellDataGetter({
              dataKey: col.dataKey,
              rowData: req
            });
          } else {
            return req[col.dataKey!];
          }
        })
      )
      .map(e => e.join("\t"))
  ].join("\n");
  return csvString;
}
