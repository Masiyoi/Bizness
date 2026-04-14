// src/pages/categories/NewArrivals.tsx
import CategoryPage from './CategoryPage';
export default function NewArrivals() {
  return (
    <CategoryPage
      categoryName="New Arrivals"
      headline="New Arrivals"
      description="Fresh drops added in the last 3 weeks — be the first to shop."
      bannerUrl="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200&q=80&fit=crop"
      badge="New In"
      badgeStyle="red"
      apiEndpoint="/api/products/new-arrivals?limit=40"
    />
  );
}