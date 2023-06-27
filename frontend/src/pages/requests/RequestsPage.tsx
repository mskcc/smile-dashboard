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
  const uniqueQueries = parseSearchQueries(value);

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
      { igoProjectId_CONTAINS: value },
      { igoRequestId_CONTAINS: value },
      { projectManagerName_CONTAINS: value },
      { investigatorName_CONTAINS: value },
      { investigatorEmail_CONTAINS: value },
      { piEmail_CONTAINS: value },
      { dataAnalystName_CONTAINS: value },
      { dataAnalystEmail_CONTAINS: value },
      { genePanel_CONTAINS: value },
      { labHeadName_CONTAINS: value },
      { labHeadEmail_CONTAINS: value },
      { qcAccessEmails_CONTAINS: value },
      { dataAccessEmails_CONTAINS: value },
      { otherContactEmails_CONTAINS: value },
    ];
  }
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
