import React, { FunctionComponent, useState } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";

export const PatientsPage: FunctionComponent = () => {
  return <Patients />;
};

const Patients: FunctionComponent = () => {
  const [val, setVal] = useState("");
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

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
      <Form.Control
        className={"d-inline-block"}
        style={{ width: "300px" }}
        type="search"
        placeholder="Search by CMO Patient ID"
        aria-label="Search"
        defaultValue={val}
        onInput={(event) => {
          const value = event.currentTarget.value;

          if (typingTimeout) {
            clearTimeout(typingTimeout);
          }

          const to = setTimeout(() => {
            setVal(value);
          }, 500);
          setTypingTimeout(to);
        }}
      />
    </Container>
  );
};
