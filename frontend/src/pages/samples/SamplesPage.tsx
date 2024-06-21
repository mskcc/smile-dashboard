import { PageHeader } from "../../shared/components/PageHeader";
import SamplesList from "../../components/SamplesList";
import {
  cohortSampleFilterWhereVariables,
  combinedSampleDetailsColumns,
  prepareCombinedSampleDataForAgGrid,
  sampleFilterWhereVariables,
} from "../../shared/helpers";
import { SampleWhere } from "../../generated/graphql";
import { useState } from "react";

export default function SamplesPage() {
  const [columnDefs, setColumnDefs] = useState(combinedSampleDetailsColumns);

  return (
    <>
      <PageHeader dataName={"samples"} />

      <SamplesList
        columnDefs={columnDefs}
        setColumnDefs={setColumnDefs}
        prepareDataForAgGrid={prepareCombinedSampleDataForAgGrid}
        refetchWhereVariables={(parsedSearchVals) => {
          return {
            OR: cohortSampleFilterWhereVariables(parsedSearchVals).concat({
              hasMetadataSampleMetadata_SOME: {
                OR: sampleFilterWhereVariables(parsedSearchVals),
              },
            }),
          } as SampleWhere;
        }}
      />
    </>
  );
}
