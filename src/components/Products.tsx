// components/Products.tsx
import ProductCard from './ProductCard';

const products = [
  { name: 'XR16 Air Conditioner', image: '/images/xr16.jpg' },
  { name: 'Trane Furnace', image: '/images/furnace.jpg' },
];

const Products = () => {
  return (
    <section className="bg-gray-100 py-20">
      <h2 className="text-3xl font-bold text-center">Our Products</h2>
      <div className="mt-10 flex flex-wrap justify-center gap-8">
        {products.map((product, index) => (
          <ProductCard key={index} {...product} />
        ))}
      </div>
    </section>
  );
};

export default Products;
