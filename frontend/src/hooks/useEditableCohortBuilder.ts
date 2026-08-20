import { RefObject, useCallback, useMemo, useState } from "react";
import { AgGridReact as AgGridReactType } from "ag-grid-react/lib/agGridReact";
import {
  DashboardCohortValidationStatus,
  DashboardSample,
  TempoCohortRequest,
} from "../generated/graphql";
import { useCohortBuilder } from "./useCohortBuilder";
import { QueryResult } from "@apollo/client";
import {
  enrichCohortBuilderSample,
  getInvalidTempoSamplesMap,
  toCohortBuilderSamples,
} from "../utils/cohortValidation";
import { CohortBuilderSample } from "../components/CohortBuilderContainer";

interface HandleCohortBuilderOpenParams {
  tempoCohortRequest: TempoCohortRequest | undefined;
  recordCount: number;
  queryName: string;
  fetchMore: QueryResult["fetchMore"];
}

export function useEditableCohortBuilder(
  gridRef: RefObject<AgGridReactType<DashboardSample>>,
  cohortValidationStatus?: DashboardCohortValidationStatus | null
) {
  const {
    cohortBuilderMode,
    setCohortBuilderMode,
    showCohortBuilder,
    selectedRowIds,
    setSelectedRowIds,
    tempoCohortRequest: editableTempoCohortRequest,
    setTempoCohortRequest: setEditableTempoCohortRequest,
    handleCohortBuilderClose,
    handleCohortBuilderPopOut,
  } = useCohortBuilder(gridRef);
  const [isOpeningCohortBuilder, setIsOpeningCohortBuilder] = useState(false);

  // lookup of cohort validation issues by primaryId, used to enrich samples re-selected
  // from the main grid (whose raw row data doesn't carry these validation fields)
  const invalidTempoSamplesMap = useMemo(
    () => getInvalidTempoSamplesMap(cohortValidationStatus),
    [cohortValidationStatus]
  );

  const enrichSelectedRow = useCallback(
    (sample: CohortBuilderSample): CohortBuilderSample =>
      enrichCohortBuilderSample(sample, invalidTempoSamplesMap),
    [invalidTempoSamplesMap]
  );

  async function handleCohortBuilderOpen({
    tempoCohortRequest,
    recordCount,
    queryName,
    fetchMore,
  }: HandleCohortBuilderOpenParams) {
    if (!tempoCohortRequest) return;
    setIsOpeningCohortBuilder(true);
    try {
      const { data: allCohortSamplesData } = await fetchMore({
        variables: {
          searchVals: [],
          offset: 0,
          limit: recordCount,
        },
      });
      const allCohortSamples: DashboardSample[] =
        allCohortSamplesData?.[queryName] ?? [];
      setSelectedRowIds(
        toCohortBuilderSamples(allCohortSamples, cohortValidationStatus)
      );
    } catch (error) {
      console.error("Failed to fetch all cohort samples for editing:", error);
    } finally {
      setIsOpeningCohortBuilder(false);
    }
    setEditableTempoCohortRequest(tempoCohortRequest);
    setCohortBuilderMode("inline");
  }

  return {
    cohortBuilderMode,
    setCohortBuilderMode,
    showCohortBuilder,
    selectedRowIds,
    setSelectedRowIds,
    editableTempoCohortRequest,
    setEditableTempoCohortRequest,
    isOpeningCohortBuilder,
    enrichSelectedRow,
    handleCohortBuilderOpen,
    handleCohortBuilderClose,
    handleCohortBuilderPopOut,
  };
}
