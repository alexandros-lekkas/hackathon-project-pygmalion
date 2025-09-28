'use client';

import { useState } from 'react';
import VoiceAgentUI from '@/src/components/voice-agent/VoiceAgentUI';
import ConnectionForm from '@/src/components/voice-agent/ConnectionForm';
import { LiveKitConfig } from '@/src/hooks/useLiveKit';

export default function HomePage() {
  const [config, setConfig] = useState<LiveKitConfig | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async (connectionConfig: LiveKitConfig) => {
    setIsConnecting(true);
    
    try {
      // Generate token from backend
      const response = await fetch('/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: connectionConfig.roomName,
          participantName: 'User',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate token');
      }

      const { token, url } = await response.json();
      
      setConfig({
        ...connectionConfig,
        token,
        url,
      });
    } catch (error) {
      console.error('Failed to connect:', error);
      alert('Failed to connect. Please check your configuration.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setConfig(null);
  };

  if (config) {
    return <VoiceAgentUI config={config} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <ConnectionForm onConnect={handleConnect} isConnecting={isConnecting} />
    </div>
  );
}