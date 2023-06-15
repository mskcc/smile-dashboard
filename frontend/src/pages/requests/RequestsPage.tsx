import {
  RequestWhere,
  SampleWhere,
  useRequestsListLazyQuery,
} from "../../generated/graphql";
import React from "react";
import { RequestsListColumns } from "../../shared/helpers";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "ag-grid-enterprise";
import RecordsList from "../../components/RecordsList";
import { useParams } from "react-router-dom";
import PageHeader from "../../shared/components/PageHeader";
import { parseSearchQueries } from "../../lib/parseSearchQueries";

function requestFilterWhereVariables(value: string): RequestWhere[] {
  return parseSearchQueries(value).map((query) => ({
    OR: [
      { igoProjectId_CONTAINS: query },
      { igoRequestId_CONTAINS: query },
      { projectManagerName_CONTAINS: query },
      { investigatorName_CONTAINS: query },
      { investigatorEmail_CONTAINS: query },
      { piEmail_CONTAINS: query },
      { dataAnalystName_CONTAINS: query },
      { dataAnalystEmail_CONTAINS: query },
      { genePanel_CONTAINS: query },
      { labHeadName_CONTAINS: query },
      { labHeadEmail_CONTAINS: query },
      { qcAccessEmails_CONTAINS: query },
      { dataAccessEmails_CONTAINS: query },
      { otherContactEmails_CONTAINS: query },
    ],
  }));
}

export const RequestsPage: React.FunctionComponent = () => {
  const params = useParams();

  const pageRoute = "/requests";
  const sampleQueryParamFieldName = "igoRequestId";

  return (
    <>
      <PageHeader pageTitle={"requests"} pageRoute={pageRoute} />

      <RecordsList
        lazyRecordsQuery={useRequestsListLazyQuery}
        nodeName="requests"
        totalCountNodeName="requestsConnection"
        pageRoute={pageRoute}
        searchTerm="requests"
        colDefs={RequestsListColumns}
        conditionBuilder={requestFilterWhereVariables}
        sampleQueryParamFieldName={sampleQueryParamFieldName}
        sampleQueryParamValue={params[sampleQueryParamFieldName]}
        searchVariables={
          {
            hasMetadataSampleMetadata_SOME: {
              [sampleQueryParamFieldName]: params[sampleQueryParamFieldName],
            },
          } as SampleWhere
        }
      />
    </>
  );
};

export default RequestsPage;
