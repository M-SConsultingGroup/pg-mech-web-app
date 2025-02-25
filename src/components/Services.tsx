// components/Services.tsx
import ServiceCard from './ServiceCard';

const services = [
  {
    title: 'Residential HVAC',
    description: 'Expert Technicians available for all major brands.',
    image: '/images/residential.jpg',
  },
  {
    title: 'Commercial HVAC',
    description: 'Customized cooling and heating solutions for businesses.',
    image: '/images/commercial.jpg',
  },
];

const Services = () => {
  return (
    <section className="py-20">
      <h2 className="text-3xl font-bold text-center">Our Services</h2>
      <div className="mt-10 flex flex-wrap justify-center gap-8">
        {services.map((service, index) => (
          <ServiceCard key={index} {...service} />
        ))}
      </div>
    </section>
  );
};

export default Services;
