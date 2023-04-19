import {
  RequestWhere,
  useRequestsListLazyQuery,
} from "../../generated/graphql";
import React from "react";
import { RequestsListColumns } from "./helpers";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "ag-grid-enterprise";
import RecordsList from "../../components/RecordsList";
import { NavLink, useParams } from "react-router-dom";
import { Col, Container, Row } from "react-bootstrap";

function requestFilterWhereVariables(value: string): RequestWhere[] {
  return [
    { igoProjectId_CONTAINS: value },
    { igoRequestId_CONTAINS: value },
    { genePanel_CONTAINS: value },
    { dataAnalystEmail_CONTAINS: value },
    { dataAnalystName_CONTAINS: value },
    { investigatorEmail_CONTAINS: value },
    { investigatorName_CONTAINS: value },
    { labHeadEmail_CONTAINS: value },
    { libraryType_CONTAINS: value },
    { labHeadName_CONTAINS: value },
    { namespace_CONTAINS: value },
    { piEmail_CONTAINS: value },
    { otherContactEmails_CONTAINS: value },
    { projectManagerName_CONTAINS: value },
    { qcAccessEmails_CONTAINS: value },
  ];
}

export const RequestsPage: React.FunctionComponent = (props) => {
  const nodeName = "requests";

  const params = useParams();

  const idFieldName = "igoRequestId";
  const pageTitle = nodeName.charAt(0).toUpperCase() + nodeName.slice(1);
  const pageLink = `/${nodeName}`;

  return (
    <>
      <Container fluid>
        <Row className="pagetitle">
          <Col>
            <nav>
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="/">Home</a>
                </li>
                <li className="breadcrumb-item active">
                  <NavLink to={pageLink}>{pageTitle}</NavLink>
                </li>
                {params[idFieldName] && (
                  <li className="breadcrumb-item active">
                    {params[idFieldName]}
                  </li>
                )}
              </ol>
            </nav>
            <h1>{pageTitle}</h1>
          </Col>
        </Row>
      </Container>

      <RecordsList
        lazyRecordsQuery={useRequestsListLazyQuery}
        nodeName={nodeName}
        totalCountNodeName="requestsConnection"
        pageRoute="requests"
        idFieldName="igoRequestId"
        colDefs={RequestsListColumns}
        conditionBuilder={requestFilterWhereVariables}
        samplesEditorTitle={`Viewing ${params[idFieldName]}`}
        sampleQueryParamValue={params[idFieldName]}
        sampleQueryParamFieldName={idFieldName}
      />
    </>
  );
};

export default RequestsPage;
