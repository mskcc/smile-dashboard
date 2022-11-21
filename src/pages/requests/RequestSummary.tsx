import { useRequestWithSamplesQuery } from "../../generated/graphql";
import { Index } from "react-virtualized";
import { Button, Col, Form, Row } from "react-bootstrap";
import _, { sample } from "lodash";
import classNames from "classnames";
import { FunctionComponent } from "react";
import { DownloadModal } from "../../components/DownloadModal";
import { CSVFormulate } from "../../lib/CSVExport";
import { SampleDetailsColumns } from "./helpers";
import { Params } from "react-router-dom";
import Spinner from "react-spinkit";
import { AgGridReact } from "ag-grid-react";
import { useState } from "react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "ag-grid-enterprise";

interface IRequestSummaryProps {
  params: Readonly<Params<string>>;
}

const RequestSummary: FunctionComponent<IRequestSummaryProps> = ({
  params
}) => {
  const {
    loading,
    error,
    data,
    refetch,
    fetchMore
  } = useRequestWithSamplesQuery({
    variables: {
      where: {
        igoRequestId: params.requestId
      },
      options: {
        offset: 0,
        limit: undefined
      }
    },
    fetchPolicy: "no-cache"
  });

  const [val, setVal] = useState("");
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<any>(null);
  const [prom, setProm] = useState<any>(Promise.resolve());

  if (loading)
    return (
      <div className={"centralSpinner"}>
        <Spinner fadeIn={"none"} color={"lightblue"} name="ball-grid-pulse" />
      </div>
    );

  if (error) return <Row>Error loading request details / request samples</Row>;

  const request = data!.requests[0];
  const samples = request.hasSampleSamples;
  const metadataList = samples.map(item => item.hasMetadataSampleMetadata[0]);

  function rowGetter({ index }: Index) {
    const s = request.hasSampleSamples[index];
    const sm = request.hasSampleSamples[index].hasMetadataSampleMetadata[0];
    console.log(s.smileSampleId, sm);
    return sm || {};
  }

  const stringFields: any[] = [];

  _.forEach(request, (val: any, key: string) => {
    if (typeof val === "string") {
      stringFields.push(
        <tr>
          <td>{key}</td>
          <td>{val}</td>
        </tr>
      );
    }
  });

  const remoteCount = request.hasSampleSamples.length;

  return (
    <>
      {showDownloadModal && (
        <DownloadModal
          loader={() => {
            return Promise.resolve(
              CSVFormulate(metadataList, SampleDetailsColumns)
            );
          }}
          onComplete={() => {
            setShowDownloadModal(false);
          }}
          exportFilename={"request_" + data?.requests[0].igoRequestId + ".tsv"}
        />
      )}
      <Row
        className={classNames(
          "d-flex justify-content-between align-items-center"
        )}
      >
        <Col></Col>
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
                    hasSampleSamplesWhere2: {
                      sampleClass_CONTAINS: value
                    },
                    hasSamplesConnectionWhere2: {
                      node: { sampleClass_CONTAINS: value }
                    }
                  });
                  setProm(rf);
                }, 500);
                setTypingTimeout(to);
              });
            }}
          />
        </Col>

        <Col className={"text-start"}>{remoteCount} matching requests</Col>

        <Col className={"text-end"}>
          <Button
            onClick={() => {
              setShowDownloadModal(true);
            }}
          >
            Generate Sample Report
          </Button>
        </Col>
      </Row>
      <div className="ag-theme-alpine" style={{ height: 540, width: 1000 }}>
        <AgGridReact columnDefs={SampleDetailsColumns} rowData={metadataList} />
      </div>
    </>
  );
};

export { RequestSummary };
