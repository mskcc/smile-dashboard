import { useRequestWithSamplesQuery } from "../../generated/graphql";
import { AutoSizer, Column, InfiniteLoader, Table } from "react-virtualized";
import { Button, Col, Form, Row } from "react-bootstrap";
import { observer } from "mobx-react";
import "react-virtualized/styles.css";
import _ from "lodash";
import { useState } from "react";
import { DownloadModal } from "../../components/DownloadModal";
import { CSVFormulate } from "../../lib/CSVExport";
import { SampleDetailsColumns } from "./helpers";

const RequestSummary = observer(({ props }) => {
  const {
    loading,
    error,
    data,
    refetch,
    fetchMore
  } = useRequestWithSamplesQuery({
    variables: {
      where: {
        igoRequestId: props.requestId
      },
      options: {
        offset: 0,
        limit: undefined
      }
    }
  });

  const [val, setVal] = useState("");
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<any>(null);
  const [prom, setProm] = useState<any>(Promise.resolve());

  if (loading) return <Row />;
  if (error) return <Row>Error loading request details / request samples</Row>;

  function requestSamplesQueryVariables(value: string) {
    return {
      // where: {
      //   igoRequestId: props.requestId
      // },
      hasSampleSamplesWhere2: _.isEmpty(value) ? null : { sampleClass: value }
      // options: {
      //   offset: 0,
      //   limit: undefined
      // }
    };
  }

  const request = data!.requests[0];
  const samples = request.hasSampleSamples;
  const metadataList = samples.map(item => item.hasMetadataSampleMetadata[0]);

  function rowGetter({ index }) {
    return request.hasSampleSamples[index].hasMetadataSampleMetadata[0];
  }

  console.log(samples);

  const sampleTable = (
    <AutoSizer>
      {({ width }) => (
        <Table
          className="table"
          width={width}
          height={450}
          headerHeight={50}
          rowHeight={40}
          rowCount={request.hasSampleSamples.length}
          rowGetter={rowGetter}
        >
          {SampleDetailsColumns.map(col => {
            return (
              <Column
                label={col.label}
                dataKey={`${col.dataKey}`}
                width={width / SampleDetailsColumns.length}
              />
            );
          })}
        </Table>
      )}
    </AutoSizer>
  );

  const stringFields: any[] = [];

  function loadAllRows(fetchMore: any, filter: string) {
    return () => {
      return fetchMore({
        variables: {
          where: {},
          options: {
            offset: 0,
            limit: undefined
          }
        }
      });
    };
  }

  _.forEach(request, (val, key) => {
    if (typeof val === "string") {
      stringFields.push(
        <tr>
          <td>{key}</td>
          <td>{val}</td>
        </tr>
      );
    }
  });

  return (
    <>
      {showDownloadModal && (
        <DownloadModal
          loader={() => {
            return loadAllRows(fetchMore, "")().then(({ data }) => {
              return CSVFormulate(metadataList, SampleDetailsColumns);
            });
          }}
          onComplete={() => {
            setShowDownloadModal(false);
          }}
          exportFilename={"request_" + data?.requests[0].igoRequestId + ".tsv"}
        />
      )}

      <Col className={"text-end"}>
        <Form.Control
          className={"d-inline-block"}
          style={{ width: "300px" }}
          type="search"
          placeholder="Search Samples"
          aria-label="Search"
          value={val}
          onInput={event => {
            const value = event.currentTarget.value;

            if (value !== null) {
              setVal(value);
            }

            if (typingTimeout) {
              clearTimeout(typingTimeout);
            }

            prom.then(() => {
              const to = setTimeout(() => {
                const rf = refetch({
                  // where: {
                  //   igoRequestId: props.requestId
                  // },
                  hasSampleSamplesWhere2: {
                    sampleClass: _.isEmpty(value) ? undefined : value
                  }
                  // options: {
                  //   offset: 0,
                  //   limit: undefined
                  // }
                });
                setProm(rf);
              }, 500);
              setTypingTimeout(to);
            });
          }}
        />
      </Col>

      <Col className={"text-end"}>
        <Button
          onClick={() => {
            setShowDownloadModal(true);
          }}
        >
          Generate Sample Report
        </Button>
      </Col>

      <div style={{ height: 540 }}>{sampleTable}</div>
    </>
  );
});

export { RequestSummary };
