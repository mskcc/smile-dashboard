import { PageHeader } from "../../shared/components/PageHeader";
import { SamplesList } from "../../components/SamplesList";
import {
  SampleDetailsColumns,
  defaultEditableColDef,
  getMetadataFromSamples,
  sampleFilter,
} from "../../shared/helpers";

export default function SamplesPage() {
  return (
    <>
      <PageHeader dataName={"samples"} />

      <SamplesList
        columnDefs={SampleDetailsColumns}
        defaultColDef={defaultEditableColDef}
        getRowData={getMetadataFromSamples}
        height={540}
        filter={(searchVal: string) =>
          sampleFilter("hasMetadataSampleMetadata_SOME", searchVal)
        }
      />
    </>
  );
}
