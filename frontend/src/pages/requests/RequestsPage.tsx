import {
  RequestWhere,
  SampleWhere,
  useRequestsListLazyQuery,
} from "../../generated/graphql";
import { useState } from "react";
import {
  RequestsListColumns,
  SampleDetailsColumns,
  defaultEditableColDef,
  getMetadataFromSamples,
  sampleFilter,
} from "../../shared/helpers";
import RecordsList from "../../components/RecordsList";
import { useParams } from "react-router-dom";
import { PageHeader } from "../../shared/components/PageHeader";
import { parseUserSearchVal } from "../../utils/parseSearchQueries";

function requestFilterWhereVariables(uniqueQueries: string[]): RequestWhere[] {
  if (uniqueQueries.length > 1) {
    return [
      { igoProjectId_IN: uniqueQueries },
      { igoRequestId_IN: uniqueQueries },
      { projectManagerName_IN: uniqueQueries },
      { investigatorName_IN: uniqueQueries },
      { investigatorEmail_IN: uniqueQueries },
      { piEmail_IN: uniqueQueries },
      { dataAnalystName_IN: uniqueQueries },
      { dataAnalystEmail_IN: uniqueQueries },
      { genePanel_IN: uniqueQueries },
      { labHeadName_IN: uniqueQueries },
      { labHeadEmail_IN: uniqueQueries },
      { qcAccessEmails_IN: uniqueQueries },
      { dataAccessEmails_IN: uniqueQueries },
      { otherContactEmails_IN: uniqueQueries },
    ];
  } else {
    return [
      { igoProjectId_CONTAINS: uniqueQueries[0] },
      { igoRequestId_CONTAINS: uniqueQueries[0] },
      { projectManagerName_CONTAINS: uniqueQueries[0] },
      { investigatorName_CONTAINS: uniqueQueries[0] },
      { investigatorEmail_CONTAINS: uniqueQueries[0] },
      { piEmail_CONTAINS: uniqueQueries[0] },
      { dataAnalystName_CONTAINS: uniqueQueries[0] },
      { dataAnalystEmail_CONTAINS: uniqueQueries[0] },
      { genePanel_CONTAINS: uniqueQueries[0] },
      { labHeadName_CONTAINS: uniqueQueries[0] },
      { labHeadEmail_CONTAINS: uniqueQueries[0] },
      { qcAccessEmails_CONTAINS: uniqueQueries[0] },
      { dataAccessEmails_CONTAINS: uniqueQueries[0] },
      { otherContactEmails_CONTAINS: uniqueQueries[0] },
    ];
  }
}

export default function RequestsPage() {
  const params = useParams();
  const [userSearchVal, setUserSearchVal] = useState<string>("");
  const [parsedSearchVals, setParsedSearchVals] = useState<string[]>([]);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const dataName = "requests";
  const sampleQueryParamFieldName = "igoRequestId";
  const sampleQueryParamHeaderName = "IGO Request ID";
  const sampleQueryParamValue = params[sampleQueryParamFieldName];

  async function handleSearch() {
    const parsedSearchVals = parseUserSearchVal(userSearchVal);
    setParsedSearchVals(parsedSearchVals);
  }

  return (
    <>
      <PageHeader dataName={dataName} />

      <RecordsList
        lazyRecordsQuery={useRequestsListLazyQuery}
        dataName={dataName}
        colDefs={RequestsListColumns}
        queryFilterWhereVariables={requestFilterWhereVariables}
        sampleQueryParam={
          sampleQueryParamValue &&
          `${sampleQueryParamHeaderName} ${sampleQueryParamValue}`
        }
        sampleDefaultColDef={defaultEditableColDef}
        getSampleRowData={getMetadataFromSamples}
        sampleColDefs={SampleDetailsColumns}
        sampleSearchVariables={
          {
            hasMetadataSampleMetadata_SOME: {
              [sampleQueryParamFieldName]: sampleQueryParamValue,
            },
          } as SampleWhere
        }
        sampleFilter={(searchVal: string) =>
          sampleFilter(
            "hasMetadataSampleMetadata_SOME",
            searchVal,
            params,
            sampleQueryParamFieldName
          )
        }
        handleSearch={handleSearch}
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
