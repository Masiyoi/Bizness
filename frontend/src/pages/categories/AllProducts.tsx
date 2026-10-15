// src/pages/categories/AllProducts.tsx
import CategoryPage from './CategoryPage';

export default function AllProducts() {
  return (
    <CategoryPage
      categoryName="All Products"
      headline="Shop All"
      description="The full Plug Walk catalogue in one place. Browse every drop across footwear, clothing, and accessories for him and her."
      bannerUrl="https://res.cloudinary.com/dfiy43f01/image/upload/v1789506683/ny_bsfa2u.jpg"
      apiEndpoint="/api/products"
      pageSize={12}
    />
  );
}
