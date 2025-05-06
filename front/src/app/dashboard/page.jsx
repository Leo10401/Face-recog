'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import FaceRecognition from '../../components/FaceRecognition';
import Navbar from '../../components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoutes';
import Link from 'next/link';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [message, setMessage] = useState('');
  const [faceMatched, setFaceMatched] = useState(false);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/attendance/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setAttendance(data);
      } catch (error) {
        console.error('Error fetching attendance:', error);
      }
    };
    
    if (user) {
      fetchAttendance();
    }
  }, [user]);

  const handleFaceMatched = async (matched) => {
    if (matched) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/mark-attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: user.id }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Error marking attendance');
        }
        
        setMessage('Attendance marked successfully!');
        setFaceMatched(true);
        
        // Refresh attendance records
        const attendanceResponse = await fetch(`http://localhost:5000/api/attendance/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const attendanceData = await attendanceResponse.json();
        setAttendance(attendanceData);
      } catch (error) {
        setMessage(error.message);
      }
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <ProtectedRoute>
    <main>
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Welcome, {user.name}</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/dashboard/attendance" className="bg-blue-600 text-white p-4 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors">
              <span className="text-lg font-medium">Mark Attendance</span>
            </Link>
            {/* Add more quick actions here as needed */}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Your Attendance Records</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Date</th>
                  <th className="py-2 px-4 border-b">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length > 0 ? (
                  attendance.map((record) => (
                    <tr key={record._id}>
                      <td className="py-2 px-4 border-b">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-4 border-b">{record.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="py-4 text-center text-gray-500">
                      No attendance records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
    </ProtectedRoute>
  );
}