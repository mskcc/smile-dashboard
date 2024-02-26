// import { SamplesList } from "../../components/SamplesList";
// import { useFindCohortSamplesQuery } from "../../generated/graphql";
// import PageHeader from "../../shared/components/PageHeader";
// import { CohortDetailsColumns } from "../../shared/helpers";
// import {
//   getCohortDataFromSamples,
//   getCohortSamplesFromQueryData,
// } from "../../shared/utils";

// export default function CohortsPage() {
//   return (
//     <>
//       <PageHeader pageTitle={"cohorts"} pageRoute="/cohorts" />

//       <SamplesList
//         columnDefs={CohortDetailsColumns}
//         useSampleRecordsQuery={useFindCohortSamplesQuery}
//         getSamplesFromQueryData={getCohortSamplesFromQueryData}
//         getRowData={getCohortDataFromSamples}
//         height={540}
//       />
//     </>
//   );
// }

import {
  CohortWhere,
  SampleWhere,
  useCohortsListLazyQuery,
} from "../../generated/graphql";
import { useState } from "react";
import { CohortsListColumns } from "../../shared/helpers";
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
        searchVariables={
          {
            hasMetadataSampleMetadata_SOME: {
              [sampleQueryParamFieldName]: params[sampleQueryParamFieldName],
            },
          } as SampleWhere
        }
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
