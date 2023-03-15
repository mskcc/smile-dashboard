import React, { FunctionComponent } from "react";
import { Col, Container, Row } from "react-bootstrap";

export const PatientsPage: FunctionComponent = () => {
  return <Patients />;
};

const Patients: FunctionComponent = () => {
  return (
    <Container fluid>
      <Row className="pagetitle">
        <Col>
          <nav>
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/">Home</a>
              </li>
              <li className="breadcrumb-item active">Patients</li>
            </ol>
          </nav>
          <h1>Patients</h1>
        </Col>
      </Row>
    </Container>
  );
};
