import PageHeader from "../../shared/components/PageHeader";
import { SamplesList } from "../../components/SamplesList";
import { useFindSamplesByInputValueQuery } from "../../generated/graphql";

export default function SamplesPage() {
  const pageRoute = "/samples";

  return (
    <>
      <PageHeader pageTitle={"samples"} pageRoute={pageRoute} />

      <SamplesList
        useSampleRecordsQuery={useFindSamplesByInputValueQuery}
        height={540}
      />
    </>
  );
}
