import {
  PatientAliasWhere,
  SampleWhere,
  usePatientsListLazyQuery,
} from "../../generated/graphql";
import React, { useEffect, useState } from "react";
import { PatientsListColumns } from "../../shared/helpers";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "ag-grid-enterprise";
import RecordsList from "../../components/RecordsList";
import { useParams } from "react-router-dom";
import PageHeader from "../../shared/components/PageHeader";
import { Col, Form } from "react-bootstrap";

type PatientIdsTriplet = {
  dmpId: string;
  cmoId: string;
  ptMrn: string;
};

function patientAliasFilterWhereVariables(
  uniqueQueries: string[]
): PatientAliasWhere[] {
  if (uniqueQueries.length > 1) {
    return [
      { value_IN: uniqueQueries },
      { namespace_IN: uniqueQueries },
      {
        isAliasPatients_SOME: {
          hasSampleSamples_SOME: {
            hasMetadataSampleMetadata_SOME: {
              cmoSampleName_IN: uniqueQueries,
            },
          },
        },
      },
      {
        isAliasPatients_SOME: {
          hasSampleSamples_SOME: {
            hasMetadataSampleMetadata_SOME: {
              primaryId_IN: uniqueQueries,
            },
          },
        },
      },
    ];
  } else {
    return [
      { value_CONTAINS: uniqueQueries[0] },
      { namespace_CONTAINS: uniqueQueries[0] },
      {
        isAliasPatients_SOME: {
          hasSampleSamples_SOME: {
            hasMetadataSampleMetadata_SOME: {
              cmoSampleName_CONTAINS: uniqueQueries[0],
            },
          },
        },
      },
      {
        isAliasPatients_SOME: {
          hasSampleSamples_SOME: {
            hasMetadataSampleMetadata_SOME: {
              primaryId_CONTAINS: uniqueQueries[0],
            },
          },
        },
      },
    ];
  }
}

export const PatientsPage: React.FunctionComponent = (props) => {
  const params = useParams();
  const [searchWithMRNs, setSearchWithMRNs] = useState(false);
  const [patientIdsTriplets, setPatientIdsTriplets] = useState<
    PatientIdsTriplet[]
  >([]);
  const [patientsListColumns, setPatientsListColumns] =
    useState(PatientsListColumns);

  useEffect(() => {
    if (searchWithMRNs && patientIdsTriplets.length > 0) {
      const colsWithMRNs = PatientsListColumns.map((column) => {
        if (column.headerName === "Patient MRN") {
          return {
            ...column,
            hide: false,
            valueGetter: (params: any) => {
              params.columnApi.autoSizeAllColumns();
              const cmoId = params.data.value;
              const patientIdsTriplet = patientIdsTriplets.find(
                (triplet) => triplet.cmoId === cmoId
              );
              if (patientIdsTriplet) {
                return patientIdsTriplet.ptMrn;
              } else {
                return "";
              }
            },
          };
        } else {
          return column;
        }
      });
      setPatientsListColumns(colsWithMRNs);
    } else {
      setPatientsListColumns(PatientsListColumns);
    }
  }, [searchWithMRNs, patientIdsTriplets]);

  async function fetchPatientIdsTriplets(
    patientMrns: string[]
  ): Promise<string[]> {
    // TODO: replace with dynamic url
    const response = await fetch("http://localhost:3000/crosswalk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(patientMrns),
    });
    const data: PatientIdsTriplet[] = await response.json();
    setPatientIdsTriplets(data);
    return data.map((d) => d.cmoId);
  }

  const pageRoute = "/patients";
  const sampleQueryParamFieldName = "cmoPatientId";

  return (
    <>
      <PageHeader pageTitle={"patients"} pageRoute={pageRoute} />

      <RecordsList
        lazyRecordsQuery={usePatientsListLazyQuery}
        nodeName="patientAliases"
        totalCountNodeName="patientAliasesConnection"
        pageRoute={pageRoute}
        searchTerm="patients"
        colDefs={patientsListColumns}
        conditionBuilder={patientAliasFilterWhereVariables}
        sampleQueryParamFieldName={sampleQueryParamFieldName}
        sampleQueryParamValue={params[sampleQueryParamFieldName]}
        searchVariables={
          {
            OR: [
              {
                patientsHasSampleConnection_SOME: {
                  node: {
                    patientAliasesIsAlias_SOME: {
                      value: params[sampleQueryParamFieldName],
                    },
                  },
                },
              },
            ],
          } as SampleWhere
        }
        customFilterUI={
          <>
            <Col md="auto" className="mt-1">
              <div className="vr"></div>
            </Col>

            <Col md="auto" className="mt-1">
              <Form>
                <Form.Check
                  type="switch"
                  id="custom-switch"
                  label="Search with MRNs"
                  checked={searchWithMRNs}
                  onChange={(e) => setSearchWithMRNs(e.target.checked)}
                />
              </Form>
            </Col>
          </>
        }
        customFilterState={searchWithMRNs}
        setCustomFilterVals={setPatientIdsTriplets}
        customFilterFunc={fetchPatientIdsTriplets}
      />
    </>
  );
};

export default PatientsPage;
