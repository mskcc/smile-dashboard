import { FunctionComponent } from "react";
import { Button, Container, Table } from "react-bootstrap";
import { useParams } from "react-router-dom";
import {
  useSamplesQuery,
  useUpdateSamplesMutation,
} from "../../generated/graphql";

export const UpdateSamples: FunctionComponent = ({}) => {
  const params = useParams();
  const { loading, error, data } = useSamplesQuery({
    variables: {
      where: {
        smileSampleId: params.smileSampleId,
      },
    },
  });
  console.log(data);

  const [updateSamplesMutation, { ...args }] = useUpdateSamplesMutation({
    variables: {
      where: {
        smileSampleId: params.smileSampleId,
      },
      update: {
        revisable: false,
        hasMetadataSampleMetadata: [
          {
            update: {
              node: {
                cmoPatientId: "C-NEWPATIENTID",
                investigatorSampleId: "new investigator id",
                // "sampleClass": null,
                // "sampleName": null,
                // "sampleOrigin": null,
                // "sampleType": null,
                // "tumorOrNormal": null
              },
            },
          },
        ],
      },
    },
  });

  function showTable() {
    return (
      <Table>
        <thead>
          <tr>
            <th>smile sample id</th>
            <th>is revisable</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{data?.samples[0]?.smileSampleId}</td>
            <td>{data?.samples[0]?.revisable ? "true" : "false"}</td>
          </tr>
        </tbody>
      </Table>
    );
  }

  return (
    <Container fluid>
      {params.smileSampleId}
      <Button
        onClick={() => {
          let curValue = data?.samples[0].revisable;
          updateSamplesMutation({
            variables: {
              update: {
                revisable: !curValue,
                hasMetadataSampleMetadata: [
                  {
                    update: {
                      node: {
                        cmoPatientId: "C-NEWPATIENTID",
                        investigatorSampleId: "new investigator id",
                        // "sampleClass": null,
                        // "sampleName": null,
                        // "sampleOrigin": null,
                        // "sampleType": null,
                        // "tumorOrNormal": null
                      },
                    },
                  },
                ],
              },
            },
          });
        }}
      >
        update
      </Button>
      <br />
      {showTable()}
    </Container>
  );
};
