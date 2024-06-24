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
import _ from "lodash";

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
              active={_.isEqual(columnDefs, SampleMetadataDetailsColumns)}
            >
              View SampleMetadata
            </Button>{" "}
            <Button
              onClick={() => {
                setColumnDefs(ReadOnlyCohortSampleDetailsColumns);
              }}
              size="sm"
              variant="outline-secondary"
              active={_.isEqual(columnDefs, ReadOnlyCohortSampleDetailsColumns)}
            >
              View Tempo
            </Button>{" "}
            <Button
              onClick={() => {
                setColumnDefs(combinedSampleDetailsColumns);
              }}
              size="sm"
              variant="outline-secondary"
              active={_.isEqual(columnDefs, combinedSampleDetailsColumns)}
            >
              View all
            </Button>
          </>
        }
      />
    </>
  );
}
