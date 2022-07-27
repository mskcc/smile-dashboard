import { useParams, Route, Routes } from "react-router-dom";
import { Container } from "react-bootstrap";
import {
  RequestSummaryQueryDocument,
  Sample,
  SampleMetadata
} from "../../generated/graphql";
import RequestViewTable from "./RequestViewTable";
import { useQuery } from "@apollo/client";

export class RequestSampleWithDate {
  smileSample: Sample;
  firstDelivered: string;
  lastDateUpdated: string;
  latestMetadata: SampleMetadata;
  constructor(sample: Sample) {
    this.smileSample = sample;
    let smDeliveries = this.resolveFirstAndLatestMetadata(sample);
    this.firstDelivered = smDeliveries[0].importDate;
    this.lastDateUpdated = smDeliveries[1].importDate;
    this.latestMetadata = smDeliveries[1];
  }

  private resolveFirstAndLatestMetadata(sample: Sample) {
    if (sample.hasMetadataSampleMetadata.length === 1) {
      return [
        sample.hasMetadataSampleMetadata[0],
        sample.hasMetadataSampleMetadata[0]
      ];
    }

    var firstDeliv = sample.hasMetadataSampleMetadata[0];
    var latestDeliv = sample.hasMetadataSampleMetadata[0];
    for (var i = 1; i < sample.hasMetadataSampleMetadata.length; i++) {
      var currentSm = sample.hasMetadataSampleMetadata[i];
      if (currentSm.importDate >= latestDeliv.importDate) {
        latestDeliv = currentSm;
      }
    }
    return [firstDeliv, latestDeliv];
  }
}

export function RequestSummary() {
  let params = useParams();
  const { loading, error, data } = useQuery(RequestSummaryQueryDocument, {
    variables: {
      where: {
        igoRequestId: params.igoRequestId
      }
    }
  });
  if (loading) return <p>Loading request samples...</p>;
  if (error) return <p>Error : (</p>;

  var requestSamples: RequestSampleWithDate[] = [];
  data.requests[0].hasSampleSamples.forEach((s: Sample) => {
    requestSamples.push(new RequestSampleWithDate(s));
  });

  return (
    <Container>
      Request samples loaded:
      <RequestViewTable data={requestSamples} />
    </Container>
  );
}

export function RequestViewPage() {
  let params = useParams();
  return (
    <Container>
      <Routes>
        <Route path=":igoRequestId" element={<RequestSummary />} />
      </Routes>
    </Container>
  );
}
