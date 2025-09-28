'use client';

import { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { uploadScanImage } from '@/lib/supabase-scans';
import { analyzeFacialImage } from '@/lib/vision-ai';

// Example of OpenAI client usage for reference:
/*
import { OpenAI } from 'openai';

const client = new OpenAI({
  baseUrl: "https://pygmalion.herdora.com/v1",
  apiKey: process.env.NEXT_PUBLIC_HERDORA_API_KEY,
});

const resp = client.chat.completions.create({
  model: "Qwen/Qwen3-VL-235B-A22B-Instruct",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Describe this image." },
        {
          type: "image_url",
          image_url: {
            url: "https://example.com/image.jpg"
          },
        },
      ],
    }
  ],
});
*/

interface AnalysisResult {
  attractiveness: number;
  boneMass: number;
  nose: number;
  positiveCantalTilt: number;
  jawline: number;
  eyeArea: number;
  symmetry: number;
  analysis: string;
}

interface AudioFeedback {
  audioUrl: string;
  message: string;
}

export default function UmaxPage() {
  const [step, setStep] = useState<'intro' | 'camera' | 'preview' | 'loading' | 'results'>('intro');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [audioFeedback, setAudioFeedback] = useState<AudioFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const startCamera = async () => {
    setStep('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Unable to access camera. Please ensure you have granted camera permissions.');
      setStep('intro');
    }
  };
  
  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], 'facial-scan.jpg', { type: 'image/jpeg' });
            setImageFile(file);
            setImageUrl(URL.createObjectURL(blob));
            setStep('preview');
            
            // Stop the camera stream
            const stream = video.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };
  
  const retakePhoto = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }
    setImageFile(null);
    startCamera();
  };
  
  const analyzePhoto = async () => {
    if (!imageFile) return;
    
    try {
      setStep('loading');
      setError(null);
      setAudioFeedback(null);
      
      // Upload image and get analysis from server API
      const formData = new FormData();
      formData.append('file', imageFile);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process image');
      }
      
      const result = await response.json();
      
      if (result.success && result.analysis) {
        setImageUrl(result.url);
        setAnalysisResults(result.analysis);
        if (result.audio) {
          setAudioFeedback(result.audio);
        }
        setStep('results');
        
        // Play the audio feedback after a short delay
        setTimeout(() => {
          if (audioRef.current && result.audio?.audioUrl) {
            audioRef.current.src = result.audio.audioUrl;
            audioRef.current.play().catch(e => console.error("Audio playback error:", e));
          }
        }, 1000);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (err: any) {
      setError(`Error analyzing photo: ${err.message || 'Unknown error'}`);
      setStep('preview');
    }
  };
  
  const startOver = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }
    setImageFile(null);
    setAnalysisResults(null);
    setError(null);
    setStep('intro');
  };
  
  const renderRatingBar = (value: number, label: string) => (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-medium">{value}/100</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div 
          className="bg-blue-600 h-2.5 rounded-full" 
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      {/* Hidden audio element for playing audio feedback */}
      <audio ref={audioRef} className="hidden" />
      
      <Card className="w-full max-w-2xl">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-3xl font-bold text-center">Umax Facial Analysis</CardTitle>
          <CardDescription className="text-center mt-2">
            {step === 'intro' && "Take a front-facing photo to get AI analysis of your facial features"}
            {step === 'camera' && "Center your face in the frame and ensure good lighting"}
            {step === 'preview' && "How does this photo look?"}
            {step === 'loading' && "Analyzing your facial features..."}
            {step === 'results' && "Your facial analysis results"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center">
          {error && (
            <div className="w-full p-3 mb-4 text-sm text-red-800 bg-red-100 rounded-lg">
              {error}
            </div>
          )}
          
          {step === 'intro' && (
            <div className="text-center">
              <p className="mb-4">This tool uses AI to analyze facial features and provide ratings on various attributes.</p>
              <p className="mb-6 text-sm text-gray-500">Make sure you're in a well-lit area and looking directly at the camera.</p>
            </div>
          )}
          
          {step === 'camera' && (
            <div className="relative w-full">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline
                className="w-full rounded-lg border"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
          
          {step === 'preview' && imageUrl && (
            <img 
              src={imageUrl} 
              alt="Your photo" 
              className="w-full rounded-lg border"
            />
          )}
          
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p>This may take a moment...</p>
            </div>
          )}
          
          {step === 'results' && analysisResults && imageUrl && (
            <div className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Column 1: Image */}
                <div className="flex flex-col items-center">
                  <h3 className="font-medium mb-2">Your Photo</h3>
                  <img 
                    src={imageUrl} 
                    alt="Your photo" 
                    className="rounded-lg border w-full max-w-[200px] object-cover"
                  />
                </div>
                
                {/* Column 2: Ratings */}
                <div className="md:col-span-2">
                  <h3 className="font-medium mb-3">Analysis Ratings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      {renderRatingBar(analysisResults.attractiveness, "Attractiveness")}
                      {renderRatingBar(analysisResults.boneMass, "Bone Mass")}
                      {renderRatingBar(analysisResults.nose, "Nose")}
                      {renderRatingBar(analysisResults.positiveCantalTilt, "Positive Canthal Tilt")}
                    </div>
                    <div>
                      {renderRatingBar(analysisResults.jawline, "Jawline")}
                      {renderRatingBar(analysisResults.eyeArea, "Eye Area")}
                      {renderRatingBar(analysisResults.symmetry, "Symmetry")}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Audio Feedback */}
              {audioFeedback && (
                <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
                  <div className="mr-3 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-blue-700 font-medium">{audioFeedback.message}</p>
                  <button 
                    className="ml-auto text-blue-500 hover:text-blue-700"
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.play().catch(e => console.error("Audio playback error:", e));
                      }
                    }}
                  >
                    Play Again
                  </button>
                </div>
              )}
              
              {/* Analysis Text */}
              <div className="p-4 bg-gray-100 rounded-lg">
                <h3 className="font-medium mb-2">Analysis:</h3>
                <p className="text-sm">{analysisResults.analysis}</p>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center gap-4">
          {step === 'intro' && (
            <Button onClick={startCamera}>Start Camera</Button>
          )}
          
          {step === 'camera' && (
            <Button onClick={takePhoto}>Take Photo</Button>
          )}
          
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={retakePhoto}>Retake</Button>
              <Button onClick={analyzePhoto}>Analyze</Button>
            </>
          )}
          
          {step === 'results' && (
            <Button onClick={startOver}>Start Over</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
