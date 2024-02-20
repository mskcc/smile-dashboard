import { SamplesList } from "../../components/SamplesList";
import { useFindCohortSamplesQuery } from "../../generated/graphql";
import PageHeader from "../../shared/components/PageHeader";
import { getCohortSamples } from "../../shared/utils";

export default function CohortsPage() {
  return (
    <>
      <PageHeader pageTitle={"cohorts"} pageRoute="/cohorts" />

      <SamplesList
        useSampleRecordsQuery={useFindCohortSamplesQuery}
        getSamples={getCohortSamples}
        height={540}
      />
    </>
  );
}
