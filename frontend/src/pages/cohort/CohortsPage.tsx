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
import PageHeader from "../../shared/components/PageHeader";
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

  const pageRoute = "/cohorts";
  const sampleQueryParamFieldName = "cohortId";

  const handleSearch = async () => {
    const uniqueQueries = parseSearchQueries(inputVal);
    setSearchVal(uniqueQueries);
  };

  return (
    <>
      <PageHeader pageTitle={"cohorts"} pageRoute={pageRoute} />

      <RecordsList
        lazyRecordsQuery={useCohortsListLazyQuery}
        nodeName="cohorts"
        totalCountNodeName="cohortsConnection"
        pageRoute={pageRoute}
        searchTerm="cohorts"
        colDefs={CohortsListColumns}
        conditionBuilder={cohortFilterWhereVariables}
        sampleQueryParamFieldName={sampleQueryParamFieldName}
        sampleQueryParamValue={params[sampleQueryParamFieldName]}
        sampleDefaultColDef={defaultReadOnlyColDef}
        getRowData={getCohortDataFromSamples}
        sampleColDefs={CohortSamplesDetailsColumns}
        sampleSearchVariables={
          {
            cohortsHasCohortSampleConnection_SOME: {
              node: {
                [sampleQueryParamFieldName]: params[sampleQueryParamFieldName],
              },
            },
          } as SampleWhere
        }
        sampleFilter={(searchVal: string) => {
          return {
            cohortsHasCohortSampleConnection_SOME: {
              node: {
                [sampleQueryParamFieldName]: params[sampleQueryParamFieldName],
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
