// components/Hero.tsx
import Link from 'next/link';

const Hero = () => {
    return (
      <section className="bg-slate-800 text-white text-center py-20">
        <h1 className="text-4xl font-bold">Keeping North Texas Cool, Comfortable & Fresh</h1>
        <p className="mt-4 text-lg">Experience top-notch HVAC services tailored to your needs.</p>
        <Link href="/contact">
          <span className="inline-block mt-6 px-6 py-3 bg-orange-500 text-white font-semibold rounded">
            Schedule Now
          </span>
        </Link>
      </section>
    );
};

export default Hero;