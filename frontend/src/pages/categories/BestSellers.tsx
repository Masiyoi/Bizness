// src/pages/categories/BestSellers.tsx
import CategoryPage from './CategoryPage';
export default function BestSellers() {
  return (
    <CategoryPage
      categoryName="Best Sellers"
      headline="Best Sellers"
      description="The pieces our customers love most — ranked by orders."
      bannerUrl="https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&q=80&fit=crop"
      badge="★ Top Picks"
      badgeStyle="gold"
      apiEndpoint="/api/products/best-sellers?limit=12"
    />
  );
}