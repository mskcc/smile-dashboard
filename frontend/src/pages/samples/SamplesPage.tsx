import PageHeader from "../../shared/components/PageHeader";
import { SamplesList } from "../../components/SamplesList";
import { useFindSamplesByInputValueQuery } from "../../generated/graphql";
import {
  getAllSamplesFromQueryData,
  getMetadataFromSamples,
} from "../../shared/utils";
import { SampleDetailsColumns } from "../../shared/helpers";

export default function SamplesPage() {
  return (
    <>
      <PageHeader pageTitle={"samples"} pageRoute={"/samples"} />

      <SamplesList
        columnDefs={SampleDetailsColumns}
        useSampleRecordsQuery={useFindSamplesByInputValueQuery}
        getSamplesFromQueryData={getAllSamplesFromQueryData}
        getRowData={getMetadataFromSamples}
        height={540}
      />
    </>
  );
}
