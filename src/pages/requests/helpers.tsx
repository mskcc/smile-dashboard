import { ColDef } from "ag-grid-community";
import { FunctionComponent } from "react";
import { Button } from "react-bootstrap";
import { useSampleRevisableMutationMutation } from "../../generated/graphql";
import { Params } from "react-router-dom";

export type ColumnDefinition = {
  dataKey?: string;
  label?: string;
  sortable?: Boolean;
  filterable?: Boolean;
  width?: number;
  headerRender?: (arg: any) => any;
  cellRenderer?: (arg: any) => any;
  cellDataGetter?: (arg: any) => any;
};

export function buildRequestTableColumns(navigate: any): ColDef[] {
  return [
    {
      headerName: "View",
      cellRenderer: (data: any) => {
        return (
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => {
              if (data.data.igoRequestId !== undefined) {
                navigate(`/${data.data.igoRequestId}`);
              }
            }}
          >
            View
          </Button>
        );
      }
    },
    ...RequestsListColumns
  ];
}

interface IEditSamplesProps {
  smileSampleId: string;
}

export const EditSamplesButton: FunctionComponent<IEditSamplesProps> = ({
  smileSampleId
}) => {
  const [
    sampleRevisableMutationMutation,
    { data, loading, error }
  ] = useSampleRevisableMutationMutation({
    variables: {
      where: { smileSampleId: smileSampleId }
    }
  });

  return (
    <Button
      variant="outline-secondary"
      size="sm"
      onClick={() => {
        // refresh data
        let r = sampleRevisableMutationMutation()
          .then(r => {
            const sample = r.data?.updateSamples.samples[0];
            console.log(sample);
            if (sample?.revisable) {
              console.log(
                "updating revisable to false for sample: ",
                sample.smileSampleId
              );
              sampleRevisableMutationMutation({
                variables: {
                  where: {
                    smileSampleId: smileSampleId
                  },
                  update: {
                    revisable: false
                  }
                }
              });
            } else {
              console.log(
                "sample is locked, cannot make revisions at this time"
              );
            }
          })
          .catch(e => {
            console.error(e);
          });
      }}
    >
      Edit
    </Button>
  );
};

export function buildSampleTableColumns(): ColDef[] {
  return [
    {
      headerName: "Edit",
      cellRenderer: (d: any) => {
        return <EditSamplesButton smileSampleId={d.data.smileSampleId} />;
      }
    },
    ...SampleDetailsColumns
  ];
}

export const RequestsListColumns: ColDef[] = [
  {
    field: "igoRequestId",
    headerName: "IGO Request ID",
    sortable: true
  },
  {
    field: "igoProjectId",
    headerName: "IGO Project ID",
    sortable: true
  },
  {
    field: "hasSampleSamplesConnection",
    headerName: "# Samples",
    valueGetter: function({ data }) {
      return data["hasSampleSamplesConnection"]?.totalCount;
    }
  },
  {
    field: "projectManagerName",
    headerName: "Project Manager Name",
    sortable: true
  },
  {
    field: "investigatorName",
    headerName: "Investigator Name",
    sortable: true
  },
  {
    field: "investigatorEmail",
    headerName: "Investigator Email",
    sortable: true
  },
  {
    field: "piEmail",
    headerName: "PI Email",
    sortable: true
  },
  {
    field: "dataAnalystName",
    headerName: "Data Analyst Name",
    sortable: true
  },
  {
    field: "dataAnalystEmail",
    headerName: "Data Analyst Email",
    sortable: true
  },
  {
    field: "genePanel",
    headerName: "Gene Panel",
    sortable: true
  },
  {
    field: "labHeadName",
    headerName: "Lab Head Name",
    sortable: true
  },
  {
    field: "labHeadEmail",
    headerName: "Lab Head Email",
    sortable: true
  },
  {
    field: "qcAccessEmails",
    headerName: "QC Access Emails",
    sortable: true
  },
  {
    field: "dataAccessEmails",
    headerName: "Data Access Emails",
    sortable: true
  },
  {
    field: "bicAnalysis",
    headerName: "BIC Analysis",
    sortable: true
  },
  {
    field: "isCmoRequest",
    headerName: "CMO Request?",
    sortable: true
  },
  {
    field: "otherContactEmails",
    headerName: "Other Contact Emails",
    sortable: true
  }
];

export const SampleDetailsColumns: ColDef[] = [
  {
    field: "primaryId",
    headerName: "Primary ID",
    sortable: true
  },
  {
    field: "cmoSampleName",
    headerName: "CMO Sample Name",
    sortable: true
  },
  {
    field: "importDate",
    headerName: "Last Updated",
    sortable: true
  },
  {
    field: "cmoPatientId",
    headerName: "CMO Patient ID",
    sortable: true
  },
  {
    field: "investigatorSampleId",
    headerName: "Investigator Sample ID",
    sortable: true
  },
  {
    field: "sampleType",
    headerName: "Sample Type",
    sortable: true
  },
  {
    field: "species",
    headerName: "Species",
    sortable: true
  },
  {
    field: "genePanel",
    headerName: "Gene Panel",
    sortable: true
  },
  {
    field: "preservation",
    headerName: "Preservation",
    sortable: true
  },
  {
    field: "tumorOrNormal",
    headerName: "Tumor Or Normal",
    sortable: true
  },
  {
    field: "sampleClass",
    headerName: "Sample Class",
    sortable: true
  },
  {
    field: "oncotreeCode",
    headerName: "Oncotree Code",
    sortable: true
  },
  {
    field: "collectionYear",
    headerName: "Collection Year",
    sortable: true
  },
  {
    field: "sampleOrigin",
    headerName: "Sample Origin",
    sortable: true
  },
  {
    field: "tissueLocation",
    headerName: "Tissue Location",
    sortable: true
  },
  {
    field: "sex",
    headerName: "Sex",
    sortable: true
  }
];
