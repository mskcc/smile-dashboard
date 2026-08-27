import { RefObject, useState } from "react";
import jsdownload from "js-file-download";
import JSZip from "jszip";
import { AgGridReact as AgGridReactType } from "ag-grid-react/lib/agGridReact";
import { QueryResult } from "@apollo/client";
import { parseUserSearchVal } from "../utils/parseSearchQueries";
import { ColDef, Column } from "ag-grid-community";

/**
 * Describes a single file produced by a `DownloadOption`.
 */
export interface DownloadFile {
  /**
   * File name (without extension) for this file. If omitted, falls back to
   * the page-level `downloadFileName` passed to `useDownload`.
   */
  fileName?: string;
  columnDefsForDownload: Array<ColDef>;
  dataGetter: () => Promise<Array<any>>;
  /**
   * File extension for this file. Defaults to "tsv".
   * Content is always tab-delimited regardless of extension; this only
   * controls the file name suffix.
   */
  fileExtension?: string;
}

export interface DownloadOption {
  buttonLabel: string;
  /**
   * Flat, ordered list of files that make up this download option. A single
   * entry downloads directly, multiple entries are zipped together.
   */
  files: Array<DownloadFile>;
  tooltipContent?: string;
  disabled?: boolean;
}

interface UseDownloadParams {
  gridRef: RefObject<AgGridReactType>;
  downloadFileName: string;
  fetchMore: QueryResult["fetchMore"];
  userSearchVal: string;
  recordCount: number;
  queryName: string;
  includeDemographics?: boolean;
  prioritizeIdMatches?: boolean;
}

export function useDownload<T>({
  gridRef,
  downloadFileName,
  fetchMore,
  userSearchVal,
  recordCount,
  queryName,
  includeDemographics,
  prioritizeIdMatches,
}: UseDownloadParams) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload(downloadOption: DownloadOption) {
    setIsDownloading(true);
    const columns = gridRef.current?.columnApi.getAllGridColumns() || [];
    await downloadFiles(downloadOption, downloadFileName, columns);
    setIsDownloading(false);
  }

  /**
   * Used by DownloadOption.dataGetter to fetch all data for the
   * current search value.
   */
  async function getCurrentData(): Promise<Array<T>> {
    const { data } = await fetchMore<Record<string, Array<T>>>({
      variables: {
        searchVals: parseUserSearchVal(userSearchVal),
        offset: 0,
        limit: recordCount,
        includeDemographics,
        prioritizeIdMatches,
      },
    });
    return data[queryName];
  }

  return {
    isDownloading,
    handleDownload,
    getCurrentData,
  };
}

interface BuildTsvStringParams {
  rows: Array<any>;
  columns: Array<Column>;
  colDefs: Array<ColDef>;
}

export function buildTsvString({
  rows,
  columns,
  colDefs,
}: BuildTsvStringParams): string {
  const fieldsHiddenByUser =
    columns?.filter((col) => !col.isVisible()).map((col) => col.getColId()) ??
    [];

  const colDefsToExport = colDefs.filter(
    ({ field, hide }) =>
      field && hide !== true && !fieldsHiddenByUser.includes(field)
  );

  const colHeadersAsTsvRow = colDefsToExport
    .map((item) => item.headerName)
    .join("\t");

  const rowsAsTsvRows = rows
    .map((row) =>
      colDefsToExport.map((colDef) => {
        if (typeof colDef.valueGetter === "function") {
          // @ts-ignore
          return colDef.valueGetter({
            colDef,
            data: row,
          });
        }
        if (typeof colDef.valueGetter === "string") {
          return colDef.valueGetter;
        }
        if (colDef.field) {
          if (colDef.valueFormatter) {
            // @ts-ignore
            return colDef.valueFormatter({
              colDef,
              data: row,
              value: row[colDef.field],
            });
          }
          return row[colDef.field];
        }
        return " ";
      })
    )
    .map((value) => value.join("\t").replace(/(\r\n|\n|\r)/gm, ""));

  return [colHeadersAsTsvRow, ...rowsAsTsvRows].join("\n");
}

/**
 * Builds every file in `downloadOption.files` and triggers a browser
 * download: a single file downloads directly, multiple files are zipped
 * together. Shared by all download entry points so behavior (including the
 * single-vs-zip decision) stays consistent regardless of how many files a
 * given `DownloadOption` happens to have.
 */
export async function downloadFiles(
  downloadOption: DownloadOption,
  downloadFileName: string,
  columns: Array<Column> = []
) {
  // Files commonly share the exact same `dataGetter` (e.g. the dbGaP export
  // files all reuse `getCurrentData`). Cache in-flight/completed fetches by
  // function reference so identical data isn't fetched over the network
  // once per file.
  const dataCache = new Map<DownloadFile["dataGetter"], Promise<Array<any>>>();
  function getData(dataGetter: DownloadFile["dataGetter"]) {
    if (!dataCache.has(dataGetter)) {
      dataCache.set(dataGetter, dataGetter());
    }
    return dataCache.get(dataGetter)!;
  }

  const builtFiles = await Promise.all(
    downloadOption.files.map(async (file) => ({
      fileName: file.fileName ?? downloadFileName,
      extension: file.fileExtension ?? "tsv",
      content: buildTsvString({
        rows: await getData(file.dataGetter),
        colDefs: file.columnDefsForDownload,
        columns,
      }),
    }))
  );

  if (builtFiles.length === 1) {
    const [file] = builtFiles;
    jsdownload(file.content, `${file.fileName}.${file.extension}`);
  } else {
    const zip = new JSZip();
    builtFiles.forEach((file) => {
      zip.file(`${file.fileName}.${file.extension}`, file.content);
    });
    const zipContent = await zip.generateAsync({ type: "blob" });
    jsdownload(zipContent, `${downloadFileName}.zip`);
  }
}
