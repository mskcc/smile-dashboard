import "./RecentDeliveries.css";
import Container from "react-bootstrap/Container";
import RecentDeliveriesTable from "./RecentDeliveriesTable";
import { Request, ExampleQueryDocument } from "../../generated/graphql";
import { useQuery } from "@apollo/client";

function resolveAndSortDeliveryDates(request: Request) {
  var smDataList: string[] = [];
  for (var i = 0; i < request.hasSampleSamples.length; i++) {
    var s = request.hasSampleSamples[i];
    for (var j = 0; j < s.hasMetadataSampleMetadata.length; j++) {
      var sm = s.hasMetadataSampleMetadata[j];
      smDataList.push(sm.importDate);
    }
  }
  smDataList.sort();
  return [smDataList[0], smDataList[smDataList.length - 1]];
}

export class RequestWithDate {
  smileRequest: Request;
  totalSamples: number;
  firstDelivered: string;
  lastDateUpdated: string;
  constructor(smileRequest: Request) {
    this.smileRequest = smileRequest;
    this.totalSamples = smileRequest.hasSampleSamples.length;
    let deliveryDates = resolveAndSortDeliveryDates(smileRequest);
    this.firstDelivered = deliveryDates[0];
    this.lastDateUpdated = deliveryDates[1];
  }
}

export const RecentDeliveriesPage: React.FunctionComponent = props => {
  const { loading, error, data } = useQuery(ExampleQueryDocument);

  function transformAndFilterRequestsByDate(requestsList: Array<Request>) {
    var filteredRequests: RequestWithDate[] = [];
    requestsList.forEach((r: Request) => {
      filteredRequests.push(new RequestWithDate(r));
    });
    return filteredRequests;
  }

  if (loading) return <p>Loading requests...</p>;

  if (error) return <p>Error : (</p>;
  var filteredRequests: RequestWithDate[] = transformAndFilterRequestsByDate(
    data.requests
  );

  return (
    <Container>
      <RecentDeliveriesTable data={filteredRequests} />
    </Container>
  );
};

export default RecentDeliveriesPage;
