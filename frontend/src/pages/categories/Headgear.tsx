// src/pages/categories/Headgear.tsx
import CategoryPage, { type CategoryFilter } from './CategoryPage';

// Defined at module level so the reference stays stable between renders
// (an inline array would re-trigger the fetch effect on every render).
const MEN = {
  url: '/api/products',
  params: { gender: 'men', department: 'clothing', category: 'men-headgear' },
};
const WOMEN = {
  url: '/api/products',
  params: { gender: 'women', department: 'clothing', category: 'women-headgear' },
};

const HEADGEAR_FILTERS: CategoryFilter[] = [
  { label: 'All',   requests: [MEN, WOMEN] },
  { label: 'Men',   requests: [MEN] },
  { label: 'Women', requests: [WOMEN] },
];

export default function Headgear() {
  return (
    <CategoryPage
      categoryName="Headgear"
      headline="Headgear"
      description="Caps, beanies, bucket hats and more — finish every fit, for him and her."
      bannerUrl="https://res.cloudinary.com/dfiy43f01/image/upload/v1789305720/mensheadwear_sqrtjk.jpg"
      filters={HEADGEAR_FILTERS}
    />
  );
}