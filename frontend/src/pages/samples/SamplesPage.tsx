import { PageHeader } from "../../shared/components/PageHeader";
import SamplesList from "../../components/SamplesList";
import {
  ReadOnlyCohortSampleDetailsColumns,
  SampleMetadataDetailsColumns,
  cohortSampleFilterWhereVariables,
  combinedSampleDetailsColumns,
  prepareCombinedSampleDataForAgGrid,
  sampleFilterWhereVariables,
} from "../../shared/helpers";
import { SampleWhere } from "../../generated/graphql";
import { useState } from "react";
import { Button } from "react-bootstrap";

export default function SamplesPage() {
  const [columnDefs, setColumnDefs] = useState(combinedSampleDetailsColumns);

  return (
    <>
      <PageHeader dataName={"samples"} />

      <SamplesList
        columnDefs={columnDefs}
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
        customToolbarUI={
          <>
            <Button
              onClick={() => {
                setColumnDefs(SampleMetadataDetailsColumns);
              }}
              size="sm"
              variant="outline-secondary"
            >
              View SampleMetadata
            </Button>{" "}
            <Button
              onClick={() => {
                setColumnDefs(ReadOnlyCohortSampleDetailsColumns);
              }}
              size="sm"
              variant="outline-secondary"
            >
              View Tempo
            </Button>{" "}
            <Button
              onClick={() => {
                setColumnDefs(combinedSampleDetailsColumns);
              }}
              size="sm"
              variant="outline-secondary"
            >
              View all
            </Button>
          </>
        }
      />
    </>
  );
}
