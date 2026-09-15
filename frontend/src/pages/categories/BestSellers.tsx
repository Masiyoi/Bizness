// src/pages/categories/BestSellers.tsx
import CategoryPage from './CategoryPage';
export default function BestSellers() {
  return (
    <CategoryPage
      categoryName="Best Sellers"
      headline="Best Sellers"
      description="The pieces our customers love most — ranked by orders."
      bannerUrl="https://res.cloudinary.com/dfiy43f01/image/upload/v1789506683/ny_bsfa2u.jpg"
      badge="★ Top Picks"
      badgeStyle="white"
      apiEndpoint="/api/products/best-sellers?limit=12"
    />
  );
}