import ReactDOM from "react-dom/client";
import "./index.css";
import RecentDeliveriesPage from "./pages/recentDeliveries/RecentDeliveriesPage";
import HomePage from "./pages/home/HomePage";
import {
  RequestSummary,
  RequestViewPage
} from "./pages/requestView/RequestViewPage";
import reportWebVitals from "./reportWebVitals";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SmileNavBar from "./shared/components/SmileNavBar";
import Container from "react-bootstrap/Container";

const client = new ApolloClient({
  uri: "http://localhost:4000/graphql",
  cache: new InMemoryCache()
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <BrowserRouter>
    <ApolloProvider client={client}>
      <Container>
        <SmileNavBar />
        <Routes>
          <Route path="/home" element={<HomePage />}></Route>
          <Route path="/recentDeliveries" element={<RecentDeliveriesPage />} />
          <Route path="/requests/*" element={<RequestViewPage />}>
            <Route path=":igoRequestId" element={<RequestSummary />} />
          </Route>
        </Routes>
      </Container>
    </ApolloProvider>
  </BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
