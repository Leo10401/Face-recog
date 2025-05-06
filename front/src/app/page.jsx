import Link from 'next/link';
import Navbar from '../components/Navbar';

export default function Home() {
  return (
    <main>
      <Navbar />
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Face Recognition Attendance System</h1>
        <p className="text-lg mb-6">
          Mark your attendance using facial recognition technology
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/Login" className="bg-blue-600 text-white px-4 py-2 rounded">
            Login
          </Link>
          <Link href="/Register" className="bg-green-600 text-white px-4 py-2 rounded">
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}