"use client";

import Hero from '@/components/Hero';
import Services from '@/components/Services';
import Products from '@/components/Products';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const Home = () => {

  const router = useRouter();

  useEffect(() => {
    router.push('/contact');
  }, [router]);

  return null;
  // return (
  //   <div>
  //     <Hero />
  //     <Services />
  //     <Products />
  //   </div>
  // );
};

export default Home;