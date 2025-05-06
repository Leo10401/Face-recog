'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FaceRecognition from '../../../components/FaceRecognition';
import Navbar from '../../../components/Navbar';
import Link from 'next/link';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFaceDetected = (descriptor) => {
    setFaceDescriptor(Array.from(descriptor));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!faceDescriptor) {
        setMessage('Please register your face first');
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          faceDescriptor: JSON.stringify(faceDescriptor),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      setMessage('Registration successful!');
      setTimeout(() => router.push('/Login'), 2000);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <main>
      <Navbar />
      <div className="container mx-auto p-4 max-w-md">
        <h1 className="text-2xl font-bold mb-4">Register</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Face Registration</h2>
            <p className="text-sm text-gray-600 mb-2">
              Please position your face in the frame below
            </p>
            <FaceRecognition onFaceDetected={handleFaceDetected} />
          </div>
          
          <button
            type="submit"
            className="w-full bg-green-600 text-white p-2 rounded mt-4"
          >
            Register
          </button>
          {message && (
            <p className={`mt-2 ${message.includes('success') ? 'text-green-500' : 'text-red-500'}`}>
              {message}
            </p>
          )}
        </form>
        <p className="mt-4 text-center">
          Already have an account? <Link href="/Login" className="text-blue-600 hover:underline">Login here</Link>
        </p>
      </div>
    </main>
  );
}