// components/ProductCard.tsx
type ProductCardProps = {
    name: string;
    image: string;
  };
  
  const ProductCard = ({ name, image }: ProductCardProps) => {
    return (
      <div className="max-w-sm bg-white shadow-md rounded-lg overflow-hidden">
        <img src={image} alt={name} className="w-full h-48 object-cover" />
        <div className="p-6">
          <h3 className="text-xl font-semibold">{name}</h3>
          <button className="mt-6 px-4 py-2 bg-blue-900 text-white font-semibold rounded">Learn More</button>
        </div>
      </div>
    );
  };
  
  export default ProductCard;
  