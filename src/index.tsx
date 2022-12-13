import React from "react";
import ReactDOM from "react-dom";
import "./index.scss";
import reportWebVitals from "./reportWebVitals";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RequestsPage from "./pages/requests/RequestsPage";
import SmileNavBar from "./shared/components/SmileNavBar";
import { offsetLimitPagination } from "@apollo/client/utilities";
import HomePage from "./pages/home/HomePage";
import { Container } from "react-bootstrap";
import AdvancedSearchPage from "./pages/advancedSearch/AdvancedSearchPage";

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        requests: offsetLimitPagination()
      }
    }
  }
});

const client = new ApolloClient({
  uri:
    process.env.REACT_APP_GRAPHQL_CLIENT_URI === undefined
      ? "http://localhost:4000/graphql"
      : process.env.REACT_APP_GRAPHQL_CLIENT_URI,
  cache
});

const root = ReactDOM.render(
  <BrowserRouter>
    <ApolloProvider client={client}>
      <Container fluid>
        <SmileNavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/requests/" element={<RequestsPage />}>
            <Route path=":requestId" />
          </Route>
          <Route path="/advanced" element={<AdvancedSearchPage />} />
        </Routes>
      </Container>
    </ApolloProvider>
  </BrowserRouter>,
  document.getElementById("root") as HTMLElement
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
