// components/Navbar.tsx
import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="bg-blue-900 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">PG Mechanical LLC</h1>
        <ul className="flex gap-6">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/services">Services</Link></li>
          <li><Link href="/contact">Contact</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
