import { RefObject, useState } from "react";
import { AgGridReact as AgGridReactType } from "ag-grid-react/lib/agGridReact";
import { DashboardSample, TempoCohortRequest } from "../generated/graphql";
import { useCohortBuilder } from "./useCohortBuilder";
import { QueryResult } from "@apollo/client";

interface HandleCohortBuilderOpenParams {
  tempoCohortRequest: TempoCohortRequest | undefined;
  recordCount: number;
  queryName: string;
  fetchMore: QueryResult["fetchMore"];
}

export function useEditableCohortBuilder(
  gridRef: RefObject<AgGridReactType<DashboardSample>>
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
        allCohortSamples.map((s: DashboardSample) => ({
          primaryId: s.primaryId ?? "",
          cmoSampleName: s.cmoSampleName ?? "",
          mafCompleteStatus: s.mafCompleteStatus ?? "",
          sampleCohortIds: s.sampleCohortIds ?? "",
          initialPipelineRunDate: s.initialPipelineRunDate ?? null,
          embargoDate: s.embargoDate ?? null,
        }))
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
    handleCohortBuilderOpen,
    handleCohortBuilderClose,
    handleCohortBuilderPopOut,
  };
}
