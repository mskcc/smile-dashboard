import * as React from "react";
import { Accordion, Container } from "react-bootstrap";
import RequestsPage from "../requests/RequestsPage";

export const HomePage: React.FunctionComponent = props => {
  return (
    <Container fluid>
      <RequestsPage />
    </Container>
  );
};

export default HomePage;
