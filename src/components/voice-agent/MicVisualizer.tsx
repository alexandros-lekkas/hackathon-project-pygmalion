'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface MicVisualizerProps {
  isMuted: boolean;
  isConnected: boolean;
}

export default function MicVisualizer({ isMuted, isConnected }: MicVisualizerProps) {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);
  const [waveform, setWaveform] = useState<number[]>([]);
  const animationRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize audio context and microphone
  useEffect(() => {
    if (!isConnected || isMuted) {
      setIsListening(false);
      return;
    }

    const initAudio = async () => {
      try {
        console.log('🎤 Initializing microphone visualization...');
        
        // Get microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        
        streamRef.current = stream;
        
        // Create audio context
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyserNode = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        
        // Configure analyser
        analyserNode.fftSize = 256;
        analyserNode.smoothingTimeConstant = 0.8;
        
        source.connect(analyserNode);
        
        const bufferLength = analyserNode.frequencyBinCount;
        const data = new Uint8Array(bufferLength);
        
        setAudioContext(audioCtx);
        setAnalyser(analyserNode);
        setDataArray(data);
        setIsListening(true);
        
        console.log('✅ Microphone visualization initialized');
        
        // Start animation loop
        animate();
        
      } catch (error) {
        console.error('❌ Failed to initialize microphone:', error);
        setIsListening(false);
      }
    };

    initAudio();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [isConnected, isMuted]);

  // Animation loop for real-time visualization
  const animate = () => {
    if (!analyser || !dataArray) return;

    analyser.getByteFrequencyData(dataArray);
    
    // Calculate average audio level
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    setAudioLevel(average);
    
    // Create waveform data (simplified)
    const waveformData = Array.from(dataArray).slice(0, 32);
    setWaveform(waveformData);
    
    animationRef.current = requestAnimationFrame(animate);
  };

  // Get audio level percentage
  const getAudioLevelPercentage = () => {
    return Math.min((audioLevel / 255) * 100, 100);
  };

  // Get audio level color based on intensity
  const getAudioLevelColor = () => {
    const level = getAudioLevelPercentage();
    if (level < 10) return 'bg-gray-400';
    if (level < 30) return 'bg-green-400';
    if (level < 60) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isMuted ? (
              <MicOff className="h-5 w-5 text-red-500" />
            ) : (
              <Mic className="h-5 w-5 text-green-500" />
            )}
            <CardTitle className="text-lg">Microphone</CardTitle>
          </div>
          <Badge variant={isListening ? "default" : "secondary"}>
            {isListening ? "Listening" : "Off"}
          </Badge>
        </div>
        <CardDescription>
          Real-time audio input visualization
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Audio Level Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Audio Level</span>
            <span className="font-mono">{Math.round(getAudioLevelPercentage())}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-100 ${getAudioLevelColor()}`}
              style={{ width: `${getAudioLevelPercentage()}%` }}
            />
          </div>
        </div>

        {/* Waveform Visualization */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Waveform</span>
            <div className="flex items-center space-x-1">
              {isListening ? (
                <Volume2 className="h-4 w-4 text-green-500" />
              ) : (
                <VolumeX className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
          <div className="h-16 bg-gray-50 rounded-lg p-2 flex items-end justify-center space-x-1">
            {waveform.map((value, index) => (
              <div
                key={index}
                className="bg-blue-500 rounded-sm transition-all duration-75"
                style={{
                  height: `${(value / 255) * 100}%`,
                  width: '3px',
                  minHeight: '2px'
                }}
              />
            ))}
          </div>
        </div>

        {/* Status Information */}
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={isListening ? "text-green-600" : "text-gray-500"}>
              {isListening ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Level:</span>
            <span className="font-mono">
              {audioLevel > 0 ? `${Math.round(audioLevel)}` : "0"}
            </span>
          </div>
          {!isConnected && (
            <div className="text-center text-orange-600 bg-orange-50 p-2 rounded">
              Connect to start microphone monitoring
            </div>
          )}
          {isConnected && isMuted && (
            <div className="text-center text-red-600 bg-red-50 p-2 rounded">
              Microphone is muted
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
