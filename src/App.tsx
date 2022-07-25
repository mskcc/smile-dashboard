import * as React from "react";
import { NavLink, Routes, Route } from "react-router-dom";
import { Request, ExampleQueryDocument } from "./generated/graphql";
import "./App.css";
import { useQuery, gql } from "@apollo/client";
import RequestSummary from "./pages/requestView/RequestSummary";

function resolveLastUpdateDate(request: Request) {
  var smDataList: string[] = [];
  for (var i = 0; i < request.hasSampleSamples.length; i++) {
    var s = request.hasSampleSamples[i];
    for (var j = 0; j < s.hasMetadataSampleMetadata.length; j++) {
      var sm = s.hasMetadataSampleMetadata[j];
      smDataList.push(sm.importDate);
    }
  }
  smDataList.sort();
  return smDataList[smDataList.length - 1];
}

export class RequestWithDate {
  smileRequest: Request;
  lastDateUpdated: string;
  constructor(smileRequest: Request) {
    this.smileRequest = smileRequest;
    this.lastDateUpdated = resolveLastUpdateDate(smileRequest);
  }
}

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

export interface IRequestWithDateProps {
  key?: string;
  request: Request;
  lastDateUpdated: string;
}

export class RequestTableRecord extends React.Component<
  IRequestWithDateProps,
  {}
> {
  request: Request;
  constructor(props: IRequestWithDateProps) {
    super(props);
    this.request = props.request;
  }
  private getRequestLink() {
    return (
      <NavLink to={`requests/${this.request.igoRequestId}`} target="_blank">
        {this.request.igoRequestId}
      </NavLink>
    );
  }

  public render() {
    return (
      <tr key={this.request.smileRequestId}>
        <td>{this.getRequestLink()}</td>
        <td>{this.request.igoProjectId}</td>
        <td>{this.request.hasSampleSamples.length}</td>
        <td>{this.props.lastDateUpdated}</td>
        <td>{this.request.investigatorName}</td>
        <td>{this.request.investigatorEmail}</td>
        <td>{this.request.dataAnalystName}</td>
        <td>{this.request.dataAnalystName}</td>
        <td>{this.request.genePanel}</td>
        <td>{this.request.projectManagerName}</td>
      </tr>
    );
  }
}

function DisplayRequests() {
  const { loading, error, data } = useQuery(ExampleQueryDocument);

  if (loading)
    return (
      <h1 className="h2">Loading requests delivered in last 60 days...</h1>
    );
  if (error) return <p>Error : (</p>;
  var filteredRequests: RequestWithDate[] = transformAndFilterRequestsByDate(
    data.requests
  );

  return (
    <div className="container-fluid w-75">
      <h1 className="h2">Requests updated or delivered in the last 60 days</h1>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th scope="col">IGO Request ID</th>
            <th scope="col">IGO Project ID</th>
            <th scope="col"># Samples</th>
            <th scope="col">Last Updated Date</th>
            <th scope="col">Investigator Name</th>
            <th scope="col">Investigator Email</th>
            <th scope="col">Data Analyst Name</th>
            <th scope="col">Data Analyst Email</th>
            <th scope="col">Gene Panel</th>
            <th scope="col">Project Manager Name</th>
          </tr>
        </thead>
        <tbody>
          {filteredRequests.map((r: RequestWithDate) => (
            <RequestTableRecord
              key={r.smileRequest.smileRequestId}
              request={r.smileRequest}
              lastDateUpdated={r.lastDateUpdated}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <br />
      <Routes>
        <Route path="/" element={<DisplayRequests />} />
        <Route path="/requests/:igoRequestId" element={<RequestSummary />} />
      </Routes>
    </div>
  );
}

export default App;
