'use client';
import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

export default function FaceRecognition({ onFaceDetected, onFaceMatched, userFaceDescriptor }) {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [initializing, setInitializing] = useState(false);
  const [message, setMessage] = useState('Loading models...');
  const [faceDetected, setFaceDetected] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const loadModels = async () => {
      setInitializing(true);
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        setInitializing(false);
        startVideo();
      } catch (error) {
        console.error('Error loading models:', error);
        setMessage('Error loading models. Please refresh the page.');
      }
    };
    
    loadModels();
    
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        videoRef.current.srcObject = stream;
      })
      .catch(err => {
        console.error('Camera error:', err);
        setMessage('Camera access error. Please check permissions and try again.');
      });
  };

  const handleVideoPlay = () => {
    const interval = setInterval(async () => {
      if (initializing || !videoRef.current || !canvasRef.current) return;
      
      try {
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();
        
        // Clear the canvas first
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        if (detections.length > 0) {
          setFaceDetected(true);
          
          faceapi.matchDimensions(canvas, {
            width: videoRef.current.width,
            height: videoRef.current.height
          });
          
          const resizedDetections = faceapi.resizeResults(detections, {
            width: videoRef.current.width,
            height: videoRef.current.height
          });
          
          // Draw face detections
          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
          
          if (onFaceDetected) {
            onFaceDetected(detections[0].descriptor);
            setMessage('Face detected! Processing...');
          }
          
          // Check if we have a face descriptor to compare against
          if (userFaceDescriptor && userFaceDescriptor.length > 0 && onFaceMatched) {
            try {
              const descriptor = new Float32Array(userFaceDescriptor);
              const distance = faceapi.euclideanDistance(
                detections[0].descriptor,
                descriptor
              );
              
              // Set debug info
              setDebugInfo({
                distance: distance.toFixed(4),
                threshold: 0.6,
                descriptorLength: userFaceDescriptor.length
              });
              
              // Match if distance is below threshold
              if (distance < 0.6) {
                onFaceMatched(true);
                setMessage('Face matched!');
                clearInterval(interval);
              } else {
                setMessage(`Face not recognized. Please try again. (Distance: ${distance.toFixed(2)})`);
              }
            } catch (error) {
              console.error('Error matching face:', error);
              setMessage('Error comparing faces. Please try again.');
            }
          } else {
            // No user face descriptor available
            setMessage('No reference face data available. Please contact support.');
            setDebugInfo({ error: 'No userFaceDescriptor', hasDescriptor: !!userFaceDescriptor });
          }
        } else {
          setFaceDetected(false);
          setMessage('No face detected. Please position your face in the frame.');
        }
      } catch (error) {
        console.error('Face detection error:', error);
        setMessage('Error processing face. Please try again.');
      }
    }, 500);
    
    return () => clearInterval(interval);
  };

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <video
        ref={videoRef}
        autoPlay
        muted
        width={640}
        height={480}
        onPlay={handleVideoPlay}
        className="rounded-lg w-full"
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute top-0 left-0 w-full h-auto"
      />
      <p className={`mt-2 text-center ${faceDetected ? 'text-green-500' : 'text-red-500'}`}>
        {message}
      </p>
      {Object.keys(debugInfo).length > 0 && (
        <div className="mt-2 text-xs text-gray-500 bg-gray-100 p-2 rounded-md">
          <p>Debug Info:</p>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}