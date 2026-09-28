// src/pages/categories/NewArrivals.tsx
import CategoryPage from './CategoryPage';

export default function NewArrivals() {
  return (
    <CategoryPage
      categoryName="New Arrivals"
      headline="New Arrivals"
      description="Check out our newest arrivals.Discover fresh drops , trending essentials and exclusive styles before they sell out.Find your favorite look from the Plug."
      bannerUrl="/newArrival.jpg"
      badge="New In"
      badgeStyle="red"
      apiEndpoint="/api/products/new-arrivals?limit=40"
    />
  );
}