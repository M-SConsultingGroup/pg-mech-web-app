// components/ServiceCard.tsx
type ServiceCardProps = {
    title: string;
    description: string;
    image: string;
  };
  
  const ServiceCard = ({ title, description, image }: ServiceCardProps) => {
    return (
      <div className="max-w-sm bg-white shadow-md rounded-lg overflow-hidden">
        <img src={image} alt={title} className="w-full h-48 object-cover" />
        <div className="p-6">
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="mt-4 text-gray-600">{description}</p>
          <button className="mt-6 px-4 py-2 bg-blue-900 text-white font-semibold rounded">Learn More</button>
        </div>
      </div>
    );
  };
  
  export default ServiceCard;
  