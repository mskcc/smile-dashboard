import {
  DashboardCohortValidationSample,
  DashboardCohortValidationStatus,
  DashboardSample,
} from "../generated/graphql";
import { CohortBuilderSample } from "../components/CohortBuilderContainer";

export function getInvalidTempoSamplesMap(
  cohortValidationStatus?: DashboardCohortValidationStatus | null
): Map<string, DashboardCohortValidationSample> {
  return new Map(
    cohortValidationStatus?.invalidTempoSamples
      ?.filter((s) => !!s.primaryId)
      .map((s) => [s.primaryId as string, s]) ?? []
  );
}

export function enrichCohortBuilderSample(
  sample: CohortBuilderSample,
  issuesByPrimaryId: Map<string, DashboardCohortValidationSample>
): CohortBuilderSample {
  const issue = sample.primaryId
    ? issuesByPrimaryId.get(sample.primaryId)
    : undefined;
  return {
    ...sample,
    conflictReason: issue?.conflictReason ?? null,
    unpairedReason: issue?.unpairedReason ?? null,
    tumorNotFound: issue?.tumorNotFound ?? null,
  };
}

export function toCohortBuilderSamples(
  samples: DashboardSample[],
  cohortValidationStatus?: DashboardCohortValidationStatus | null
): CohortBuilderSample[] {
  const issuesByPrimaryId = getInvalidTempoSamplesMap(cohortValidationStatus);

  return samples.map((sample) => {
    const baseSample: CohortBuilderSample = {
      primaryId: sample.primaryId ?? "",
      cmoSampleName: sample.cmoSampleName ?? "",
      mafCompleteStatus: sample.mafCompleteStatus ?? "",
      sampleCohortIds: sample.sampleCohortIds ?? "",
      initialPipelineRunDate: sample.initialPipelineRunDate ?? null,
      embargoDate: sample.embargoDate ?? null,
    };
    return enrichCohortBuilderSample(baseSample, issuesByPrimaryId);
  });
}
