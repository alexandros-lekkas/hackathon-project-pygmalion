'use client';

import { useState, useEffect } from 'react';
import { useLiveKit, LiveKitConfig } from '@/src/hooks/useLiveKit';

interface VoiceAgentUIProps {
  config: LiveKitConfig;
}

export default function VoiceAgentUI({ config }: VoiceAgentUIProps) {
  const { room, state, connect, disconnect, toggleMute, startAudio, stopAudio } = useLiveKit(config);
  const [isAgentPresent, setIsAgentPresent] = useState(false);

  // Check if agent is present in the room
  useEffect(() => {
    const agentParticipant = state.participants.find(p => 
      p.identity.includes('agent') || p.identity.includes('assistant')
    );
    setIsAgentPresent(!!agentParticipant);
  }, [state.participants]);

  const handleConnect = async () => {
    await connect();
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const handleToggleMute = async () => {
    await toggleMute();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Voice AI Agent
          </h1>
          <p className="text-gray-600">
            Talk to your AI assistant in real-time
          </p>
        </div>

        {/* Connection Status */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">Connection Status</span>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                state.isConnected ? 'bg-green-500' : 
                state.isConnecting ? 'bg-yellow-500 animate-pulse' : 
                'bg-red-500'
              }`} />
              <span className="text-sm text-gray-600">
                {state.isConnected ? 'Connected' : 
                 state.isConnecting ? 'Connecting...' : 
                 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Agent Status */}
          {state.isConnected && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">Agent Status</span>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  isAgentPresent ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <span className="text-sm text-gray-600">
                  {isAgentPresent ? 'Agent Ready' : 'Waiting for Agent...'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{state.error}</p>
          </div>
        )}

        {/* Voice Controls */}
        <div className="space-y-4">
          {/* Connect/Disconnect Button */}
          {!state.isConnected ? (
            <button
              onClick={handleConnect}
              disabled={state.isConnecting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {state.isConnecting ? 'Connecting...' : 'Connect to Agent'}
            </button>
          ) : (
            <div className="space-y-4">
              {/* Microphone Control */}
              <div className="flex items-center justify-center">
                <button
                  onClick={handleToggleMute}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
                    state.isMuted 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {state.isMuted ? (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Status Text */}
              <p className="text-center text-sm text-gray-600">
                {state.isMuted ? 'Click to unmute and start talking' : 'Click to mute'}
              </p>

              {/* Disconnect Button */}
              <button
                onClick={handleDisconnect}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">How to use:</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>1. Click "Connect to Agent" to join the room</li>
            <li>2. Wait for the agent to appear</li>
            <li>3. Click the microphone to start talking</li>
            <li>4. The agent will respond with voice</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
