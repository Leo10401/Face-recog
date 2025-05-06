'use client';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Face Attendance
        </Link>
        <div className="flex gap-4">
          {user ? (
            <>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/dashboard/attendance" className="font-medium">Mark Attendance</Link>
              <button onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link href="/Login">Login</Link>
              <Link href="/Register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}