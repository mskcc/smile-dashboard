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
} from "../../shared/helpers";
import RecordsList from "../../components/RecordsList";
import { useParams } from "react-router-dom";
import { PageHeader } from "../../shared/components/PageHeader";
import { parseSearchQueries } from "../../utils/parseSearchQueries";

function cohortFilterWhereVariables(uniqueQueries: string[]): CohortWhere[] {
  if (uniqueQueries.length > 1) {
    return [{ cohortId_IN: uniqueQueries }];
  } else {
    return [{ cohortId_CONTAINS: uniqueQueries[0] }];
  }
}

export default function CohortsPage() {
  const params = useParams();
  const [searchVal, setSearchVal] = useState<string[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const dataName = "cohorts";
  const sampleQueryParamFieldName = "cohortId";
  const sampleQueryParamHeaderName = "Cohort ID";
  const sampleQueryParamValue = params[sampleQueryParamFieldName];

  const handleSearch = async () => {
    const uniqueQueries = parseSearchQueries(inputVal);
    setSearchVal(uniqueQueries);
  };

  return (
    <>
      <PageHeader dataName={dataName} />

      <RecordsList
        lazyRecordsQuery={useCohortsListLazyQuery}
        dataName={dataName}
        colDefs={CohortsListColumns}
        conditionBuilder={cohortFilterWhereVariables}
        sampleQueryParam={
          sampleQueryParamValue &&
          `${sampleQueryParamHeaderName} "${sampleQueryParamValue}"`
        }
        sampleDefaultColDef={defaultReadOnlyColDef}
        getRowData={getCohortDataFromSamples}
        sampleColDefs={CohortSamplesDetailsColumns}
        sampleSearchVariables={
          {
            cohortsHasCohortSampleConnection_SOME: {
              node: {
                [sampleQueryParamFieldName]: sampleQueryParamValue,
              },
            },
          } as SampleWhere
        }
        sampleFilter={(searchVal: string) => {
          return {
            cohortsHasCohortSampleConnection_SOME: {
              node: {
                [sampleQueryParamFieldName]: sampleQueryParamValue,
              },
            },
            OR: cohortSampleFilterWhereVariables(parseSearchQueries(searchVal)),
          } as SampleWhere;
        }}
        handleSearch={handleSearch}
        searchVal={searchVal}
        setSearchVal={setSearchVal}
        inputVal={inputVal}
        setInputVal={setInputVal}
        showDownloadModal={showDownloadModal}
        setShowDownloadModal={setShowDownloadModal}
        handleDownload={() => setShowDownloadModal(true)}
      />
    </>
  );
}
