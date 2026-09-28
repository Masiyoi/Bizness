// src/pages/categories/NewArrivals.tsx
import CategoryPage from './CategoryPage';

export default function NewArrivals() {
  return (
    <CategoryPage
      categoryName="New Arrivals"
      headline="New Arrivals"
      description="Fresh drops added in the last 3 weeks — be the first to shop."
      bannerVideoUrl="/newvideo.mp4"
      badge="New In"
      badgeStyle="red"
      apiEndpoint="/api/products/new-arrivals?limit=40"
    />
  );
}