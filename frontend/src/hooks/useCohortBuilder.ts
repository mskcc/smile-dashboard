import { RefObject, useState } from "react";
import { AgGridReact as AgGridReactType } from "ag-grid-react/lib/agGridReact";
import { TempoCohortRequest } from "../generated/graphql";
import {
  CohortBuilderSample,
  DEFAULT_TEMPO_COHORT_REQUEST,
} from "../components/CohortBuilderContainer";

export type CohortBuilderMode = "hidden" | "inline" | "window";

export function useCohortBuilder<DashboardSample>(
  gridRef: RefObject<AgGridReactType<DashboardSample>>
) {
  const [cohortBuilderMode, setCohortBuilderMode] =
    useState<CohortBuilderMode>("hidden");
  const [selectedRowIds, setSelectedRowIds] = useState<CohortBuilderSample[]>(
    []
  );
  const [tempoCohortRequest, setTempoCohortRequest] =
    useState<TempoCohortRequest>(DEFAULT_TEMPO_COHORT_REQUEST);

  const showCohortBuilder = cohortBuilderMode !== "hidden";

  function handleCohortBuilderOpen() {
    setCohortBuilderMode("inline");
  }

  function handleCohortBuilderClose() {
    setCohortBuilderMode("hidden");
    setSelectedRowIds([]);
    gridRef.current?.api?.deselectAll();
    setTempoCohortRequest(DEFAULT_TEMPO_COHORT_REQUEST);
  }

  function handleCohortBuilderPopOut() {
    setCohortBuilderMode("window");
  }

  return {
    cohortBuilderMode,
    setCohortBuilderMode,
    showCohortBuilder,
    selectedRowIds,
    setSelectedRowIds,
    tempoCohortRequest,
    setTempoCohortRequest,
    handleCohortBuilderOpen,
    handleCohortBuilderClose,
    handleCohortBuilderPopOut,
  };
}
