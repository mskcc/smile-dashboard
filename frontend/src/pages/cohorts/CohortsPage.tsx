import {
  CohortWhere,
  SampleWhere,
  useCohortsListLazyQuery,
} from "../../generated/graphql";
import { useState } from "react";
import {
  CohortSamplesDetailsColumns,
  CohortsListColumns,
  cohortSampleFilterWhereVariables,
  defaultReadOnlyColDef,
  getCohortDataFromSamples,
  handleSearch,
} from "../../shared/helpers";
import RecordsList from "../../components/RecordsList";
import { useParams } from "react-router-dom";
import { PageHeader } from "../../shared/components/PageHeader";
import { parseUserSearchVal } from "../../utils/parseSearchQueries";

function cohortFilterWhereVariables(parsedSearchVals: string[]): CohortWhere[] {
  if (parsedSearchVals.length > 1) {
    return [{ cohortId_IN: parsedSearchVals }];
  } else {
    return [{ cohortId_CONTAINS: parsedSearchVals[0] }];
  }
}

export default function CohortsPage() {
  const params = useParams();
  const [userSearchVal, setUserSearchVal] = useState<string>("");
  const [parsedSearchVals, setParsedSearchVals] = useState<string[]>([]);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const dataName = "cohorts";
  const sampleQueryParamFieldName = "cohortId";
  const sampleQueryParamHeaderName = "Cohort ID";
  const sampleQueryParamValue = params[sampleQueryParamFieldName];

  return (
    <>
      <PageHeader dataName={dataName} />

      <RecordsList
        lazyRecordsQuery={useCohortsListLazyQuery}
        dataName={dataName}
        colDefs={CohortsListColumns}
        queryFilterWhereVariables={cohortFilterWhereVariables}
        sampleQueryParam={
          sampleQueryParamValue &&
          `${sampleQueryParamHeaderName} "${sampleQueryParamValue}"`
        }
        sampleDefaultColDef={defaultReadOnlyColDef}
        getSampleRowData={getCohortDataFromSamples}
        sampleColDefs={CohortSamplesDetailsColumns}
        sampleParentWhereVariables={
          {
            cohortsHasCohortSampleConnection_SOME: {
              node: {
                [sampleQueryParamFieldName]: sampleQueryParamValue,
              },
            },
          } as SampleWhere
        }
        sampleRefetchWhereVariables={(searchVals: string[]) => {
          return {
            cohortsHasCohortSampleConnection_SOME: {
              node: {
                [sampleQueryParamFieldName]: sampleQueryParamValue,
              },
            },
            OR: cohortSampleFilterWhereVariables(searchVals),
          } as SampleWhere;
        }}
        handleSearch={() => handleSearch(userSearchVal, setParsedSearchVals)}
        parsedSearchVals={parsedSearchVals}
        setParsedSearchVals={setParsedSearchVals}
        userSearchVal={userSearchVal}
        setUserSearchVal={setUserSearchVal}
        showDownloadModal={showDownloadModal}
        setShowDownloadModal={setShowDownloadModal}
        handleDownload={() => setShowDownloadModal(true)}
      />
    </>
  );
}
