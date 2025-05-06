'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import FaceRecognition from '../../../components/FaceRecognition';
import Navbar from '../../../components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoutes';

export default function Attendance() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [faceMatched, setFaceMatched] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userDescriptor, setUserDescriptor] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        // First check if today's attendance is already marked
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/attendance/${user.id}/today`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          setTodayAttendance(data);
          if (data) {
            setFaceMatched(true);
          }
        }

        // Get user's face descriptor if needed
        if (user.faceDescriptor) {
          setUserDescriptor(user.faceDescriptor);
        } else {
          // If not in user object, fetch from API
          const userResponse = await fetch(`http://localhost:5000/api/user/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.faceDescriptor) {
              setUserDescriptor(userData.faceDescriptor);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setMessage('Error loading user data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
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
        setTodayAttendance({ date: new Date(), status: 'present' });
      } catch (error) {
        setMessage(error.message);
      }
    }
  };

  // Render loading state
  if (loading) {
    return (
      <ProtectedRoute>
        <main>
          <Navbar />
          <div className="container mx-auto p-4 max-w-3xl flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p>Loading attendance data...</p>
            </div>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  if (!user) {
    return <div>Please log in to view this page</div>;
  }

  return (
    <ProtectedRoute>
      <main>
        <Navbar />
        <div className="container mx-auto p-4 max-w-3xl">
          <h1 className="text-3xl font-bold mb-6">Mark Attendance</h1>
          
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Today's Attendance</h2>
            
            {todayAttendance ? (
              <div className="bg-green-100 p-4 rounded-lg">
                <p className="text-green-700 font-medium">
                  ✅ You've already marked your attendance for today!
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Marked at: {new Date(todayAttendance.date).toLocaleTimeString()}
                </p>
              </div>
            ) : faceMatched ? (
              <div className="bg-green-100 p-4 rounded-lg">
                <p className="text-green-700 font-medium">
                  ✅ Attendance marked successfully for today!
                </p>
              </div>
            ) : (
              <>
                <p className="mb-4">
                  Position your face in the frame below to mark your attendance for today.
                </p>
                {userDescriptor ? (
                  <FaceRecognition 
                    onFaceMatched={handleFaceMatched}
                    userFaceDescriptor={userDescriptor}
                  />
                ) : (
                  <div className="bg-yellow-100 p-4 rounded-lg mb-4">
                    <p className="text-yellow-700">
                      No face data found for your account. Using token-based verification instead.
                    </p>
                    <button 
                      onClick={() => handleFaceMatched(true)}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Mark Attendance
                    </button>
                  </div>
                )}
              </>
            )}
            
            {message && (
              <p className={`mt-2 ${message.includes('success') ? 'text-green-500' : 'text-red-500'}`}>
                {message}
              </p>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Instructions</h2>
            </div>
            <ul className="list-disc pl-5 space-y-2">
              <li>Make sure you're in a well-lit environment</li>
              <li>Position your face clearly in the frame</li>
              <li>Remove glasses or anything that might obstruct facial recognition</li>
              <li>Stay still until the system confirms your identity</li>
              <li>You only need to mark attendance once per day</li>
            </ul>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
} 