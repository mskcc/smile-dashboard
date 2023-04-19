import {
  PatientAliasWhere,
  usePatientsListLazyQuery,
} from "../../generated/graphql";
import React from "react";
import { PatientsListColumns } from "../requests/helpers";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "ag-grid-enterprise";
import RecordsList from "../../components/RecordsList";
import { NavLink, useParams } from "react-router-dom";
import { Col, Container, Row } from "react-bootstrap";

function patientAliasFilterWhereVariables(value: string): PatientAliasWhere[] {
  return [{ namespace_CONTAINS: value }, { value_CONTAINS: value }];
}

export const PatientsPage: React.FunctionComponent = (props) => {
  const nodeName = "patients";

  const params = useParams();
  console.log(params);

  const idFieldName = "cmoPatientId";
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
        lazyRecordsQuery={usePatientsListLazyQuery}
        nodeName="patientAliases"
        totalCountNodeName="patientAliasesConnection"
        pageRoute="patients"
        idFieldName="cmoPatientId" // as set by the route path in index.tsx
        colDefs={PatientsListColumns}
        conditionBuilder={patientAliasFilterWhereVariables}
        samplesEditorTitle={`Viewing ${params[idFieldName]}`}
        sampleQueryParamValue={params[idFieldName]}
        sampleQueryParamFieldName={idFieldName}
      />
    </>
  );
};

export default PatientsPage;
