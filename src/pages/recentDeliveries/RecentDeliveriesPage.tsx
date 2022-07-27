import "./RecentDeliveries.css";
import Container from "react-bootstrap/Container";
import RecentDeliveriesTable from "./RecentDeliveriesTable";
import { Request, ExampleQueryDocument } from "../../generated/graphql";
import { useQuery } from "@apollo/client";

export class RequestWithDate {
  smileRequest: Request;
  totalSamples: number;
  firstDelivered: string;
  lastDateUpdated: string;
  constructor(smileRequest: Request) {
    this.smileRequest = smileRequest;
    this.totalSamples = smileRequest.hasSampleSamples.length;
    let deliveryDates = this.resolveAndSortDeliveryDates(smileRequest);
    this.firstDelivered = deliveryDates[0];
    this.lastDateUpdated = deliveryDates[1];
  }
  private resolveAndSortDeliveryDates(request: Request) {
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
}

function RecentDeliveriesPage() {
  const { loading, error, data } = useQuery(ExampleQueryDocument);

  function transformAndFilterRequestsByDate(requestsList: Array<Request>) {
    const referenceDate = new Date();
    referenceDate.setDate(referenceDate.getDate() - 60);
    const refDateAsDate = new Date(referenceDate);
    let month = refDateAsDate.getMonth() + 1;
    let day = refDateAsDate.getDate();

    const refDateFilter = `${refDateAsDate.getFullYear()}-${
      month < 10 ? `0${month}` : `${month}`
    }-${day < 10 ? `0${day}` : `${day}`}`;
    var filteredRequests: RequestWithDate[] = [];
    requestsList.forEach((r: Request) => {
      let nr = new RequestWithDate(r);
      if (nr.lastDateUpdated >= refDateFilter) {
        filteredRequests.push(nr);
      }
    });
    return filteredRequests;
  }

  if (loading) return <p>Loading requests delivered in last 60 days...</p>;

  if (error) return <p>Error : (</p>;
  var filteredRequests: RequestWithDate[] = transformAndFilterRequestsByDate(
    data.requests
  );

  return (
    <Container>
      Requests updated or delivered in the last 60 days
      <RecentDeliveriesTable data={filteredRequests} />
    </Container>
  );
}

export default RecentDeliveriesPage;
