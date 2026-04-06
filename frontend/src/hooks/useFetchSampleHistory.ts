import { useEffect, useMemo, useState } from "react";
import jsdownload from "js-file-download";
import { ColDef } from "ag-grid-community";
import {
  AgGridSortDirection,
  DashboardSample,
  useDashboardSampleHistoryLazyQuery,
} from "../generated/graphql";
import { buildTsvString, DownloadOption } from "./useDownload";
import { fieldToHeaderName } from "../pages/samples/config";
import { CACHE_BLOCK_SIZE } from "../configs/shared";

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

export const historyColDefs: ColDef<SampleHistoryRow>[] = [
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
export const historyExportColDefs: ColDef<SampleHistoryRow>[] = [
  { field: "lastUpdated", headerName: "Last Updated" },
  { field: "reasonForChange", headerName: "Reason for Change" },
  ...historyColDefs.filter((c) => !c.rowGroup),
];

export const historyAutoGroupColumnDef: ColDef = {
  headerName: "Last Updated",
  field: "groupLabel",
  sort: "desc",
  valueFormatter: (params) =>
    (params.node?.parent?.childrenAfterGroup?.length ?? 0) > 1
      ? ""
      : params.value ?? "",
};

export function useFetchSampleHistory(smileSampleId: string) {
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

  return {
    diffs,
    isLoading,
    error,
    displayText,
    isDownloading,
    historyDownloadOptions,
    handleDownload,
  };
}
