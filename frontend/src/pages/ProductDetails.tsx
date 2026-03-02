import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Button, Badge } from 'react-bootstrap';

interface Product {
  id: number;
  name: string;
  price: string;
  image_url: string;
  description: string;
  category: string;
  seller_name: string;
}

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    // We'll create this backend endpoint next, but for now, we fetch all and filter
    fetch(`https://your-codespace-url-5000.app.github.dev/api/products`)
      .then(res => res.json())
      .then(data => {
        const found = data.find((p: Product) => p.id === Number(id));
        setProduct(found);
      });
  }, [id]);

  if (!product) return <Container className="mt-5">Loading product...</Container>;

  return (
    <Container className="py-5">
      <Link to="/" className="btn btn-outline-secondary mb-4">← Back to Shopping</Link>
      <Row>
        <Col md={6}>
          <img src={product.image_url} alt={product.name} className="img-fluid rounded shadow-sm" />
        </Col>
        <Col md={6}>
          <Badge bg="secondary" className="mb-2">{product.category}</Badge>
          <h1 className="fw-bold">{product.name}</h1>
          <p className="text-muted">Seller: {product.seller_name}</p>
          <hr />
          <h3 className="text-orange">KSh {Number(product.price).toLocaleString()}</h3>
          <p className="mt-4">{product.description}</p>
          <Button variant="warning" size="lg" className="w-100 mt-4 fw-bold">
            ADD TO CART
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductDetails;