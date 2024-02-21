import { SamplesList } from "../../components/SamplesList";
import { useFindCohortSamplesQuery } from "../../generated/graphql";
import PageHeader from "../../shared/components/PageHeader";
import { CohortDetailsColumns } from "../../shared/helpers";
import {
  getCohortDataFromSamples,
  getCohortSamplesFromQueryData,
} from "../../shared/utils";

export default function CohortsPage() {
  return (
    <>
      <PageHeader pageTitle={"cohorts"} pageRoute="/cohorts" />

      <SamplesList
        columnDefs={CohortDetailsColumns}
        useSampleRecordsQuery={useFindCohortSamplesQuery}
        getSamplesFromQueryData={getCohortSamplesFromQueryData}
        getRowData={getCohortDataFromSamples}
        height={540}
      />
    </>
  );
}
