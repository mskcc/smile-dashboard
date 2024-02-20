import PageHeader from "../../shared/components/PageHeader";
import { SamplesList } from "../../components/SamplesList";
import { useFindSamplesByInputValueQuery } from "../../generated/graphql";
import { getAllSamples } from "../../shared/utils";

export default function SamplesPage() {
  return (
    <>
      <PageHeader pageTitle={"samples"} pageRoute={"/samples"} />

      <SamplesList
        useSampleRecordsQuery={useFindSamplesByInputValueQuery}
        getSamples={getAllSamples}
        height={540}
      />
    </>
  );
}
