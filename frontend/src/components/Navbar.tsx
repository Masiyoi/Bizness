import { Navbar, Container, Form, FormControl, Button, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const AppNavbar = () => {
  return (
    <Navbar bg="white" expand="lg" className="shadow-sm sticky-top py-3">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold text-orange fs-3">
          BIZNA <span className="text-dark">AI</span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="navbarScroll" />
        
        <Navbar.Collapse id="navbarScroll">
          <Form className="d-flex mx-auto w-50">
            <FormControl
              type="search"
              placeholder="Search products, brands and categories"
              className="me-2 rounded-pill"
              aria-label="Search"
            />
            <Button variant="warning" className="rounded-pill px-4 fw-bold">SEARCH</Button>
          </Form>
          
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/login" className="fw-bold text-dark">Login</Nav.Link>
            <Nav.Link as={Link} to="/cart" className="fw-bold text-dark position-relative">
              Cart
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                0
              </span>
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;