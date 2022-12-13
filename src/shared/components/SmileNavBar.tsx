import * as React from "react";
import { Container, Navbar, Nav } from "react-bootstrap";
import logo_with_text from "../../imgs/logo_with_text.png";

const SmileNavBar: React.FunctionComponent = props => {
  var requestIdSearch = "";

  return (
    <Navbar bg="white" expand="lg" variant="light" className="gap-3 px-3">
      <Container fluid>
        <Navbar.Brand href="/">
          <img
            alt=""
            src={logo_with_text}
            height="40"
            className="d-inline-block align-top"
          />{" "}
        </Navbar.Brand>
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="flex-grow-1">
            <Nav.Item>
              <Nav.Link href="/requests">Requests</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link href="/advanced">Advanced Search</Nav.Link>
            </Nav.Item>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default SmileNavBar;
