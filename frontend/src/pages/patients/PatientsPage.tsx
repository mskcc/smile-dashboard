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
import { useParams } from "react-router-dom";
import PageHeader from "../../shared/components/PageHeader";

function patientAliasFilterWhereVariables(value: string): PatientAliasWhere[] {
  return [{ namespace_CONTAINS: value }, { value_CONTAINS: value }];
}

export const PatientsPage: React.FunctionComponent = (props) => {
  const params = useParams();

  const nodeName = "patientAliases";
  const pageRoute = "/patients";
  const sampleQueryParamFieldName = "cmoPatientId";
  const sampleQueryParamValue = params[sampleQueryParamFieldName];

  return (
    <>
      <PageHeader pageTitle={"patients"} pageRoute={pageRoute} />

      <RecordsList
        lazyRecordsQuery={usePatientsListLazyQuery}
        nodeName={nodeName}
        totalCountNodeName="patientAliasesConnection"
        pageRoute={pageRoute}
        colDefs={PatientsListColumns}
        conditionBuilder={patientAliasFilterWhereVariables}
        sampleQueryParamFieldName={sampleQueryParamFieldName}
        sampleQueryParamValue={sampleQueryParamValue}
      />
    </>
  );
};

export default PatientsPage;
