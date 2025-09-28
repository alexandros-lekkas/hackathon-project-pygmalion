"use client";

import { useState, useEffect } from "react";
import { useLiveKit, LiveKitConfig } from "@/hooks/useLiveKit";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LogViewer from "./LogViewer";
import MicVisualizer from "./MicVisualizer";

interface VoiceAgentUIProps {
  config: LiveKitConfig;
}

export default function VoiceAgentUI({ config }: VoiceAgentUIProps) {
  const {
    room,
    state,
    connect,
    disconnect,
    toggleMute,
    startAudio,
    stopAudio,
  } = useLiveKit(config);
  const [isAgentPresent, setIsAgentPresent] = useState(false);

  // Check if agent is present in the room
  useEffect(() => {
    const agentParticipant = state.participants.find(
      (p) => p.identity.includes("agent") || p.identity.includes("assistant")
    );
    setIsAgentPresent(!!agentParticipant);
  }, [state.participants]);

  const handleConnect = async () => {
    await connect();
  };

  const handleDisconnect = async () => {
    console.log('🔄 Reconnecting to voice agent...');
    await disconnect();
    // Auto-reconnect after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleToggleMute = async () => {
    await toggleMute();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Microphone Visualizer */}
          <div className="lg:col-span-1">
            <MicVisualizer 
              isMuted={state.isMuted} 
              isConnected={state.isConnected} 
            />
          </div>
          
          {/* Right Side - Voice Controls */}
          <div className="lg:col-span-2">
            <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Voice AI Agent</CardTitle>
          <CardDescription>
            Talk to your AI assistant in real-time
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Connection Status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Connection Status</span>
              <Badge
                variant={
                  state.isConnected
                    ? "default"
                    : state.isConnecting
                    ? "secondary"
                    : "destructive"
                }
              >
                {state.isConnected
                  ? "Connected"
                  : state.isConnecting
                  ? "Connecting..."
                  : "Disconnected"}
              </Badge>
            </div>

            {/* Agent Status */}
            {state.isConnected && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Agent Status</span>
                <Badge variant={isAgentPresent ? "default" : "secondary"}>
                  {isAgentPresent ? "Agent Ready" : "Waiting for Agent..."}
                </Badge>
              </div>
            )}
          </div>

          {/* Error Display */}
          {state.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{state.error}</p>
            </div>
          )}

          {/* Voice Controls */}
          <div className="space-y-4">
            {/* Connect/Disconnect Button */}
            {!state.isConnected ? (
              <Button
                onClick={handleConnect}
                disabled={state.isConnecting}
                className="w-full"
                size="lg"
              >
                {state.isConnecting ? "Connecting..." : "Connect to Agent"}
              </Button>
            ) : (
              <div className="space-y-4">
                {/* Microphone Control */}
                <div className="flex items-center justify-center">
                  <Button
                    onClick={handleToggleMute}
                    size="lg"
                    className={`w-20 h-20 rounded-full ${
                      state.isMuted
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-green-500 hover:bg-green-600"
                    }`}
                  >
                    {state.isMuted ? (
                      <svg
                        className="w-8 h-8"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-8 h-8"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </Button>
                </div>

                {/* Status Text */}
                <p className="text-center text-sm text-muted-foreground">
                  {state.isMuted
                    ? "Click to unmute and start talking"
                    : "Click to mute"}
                </p>

                {/* Reconnect Button */}
                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  className="w-full"
                >
                  Reconnect
                </Button>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="text-center space-y-2">
            <h3 className="text-sm font-semibold">How to use:</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>1. Click "Connect to Agent" to join the room</li>
              <li>2. Wait for the agent to appear</li>
              <li>3. Click the microphone to start talking</li>
              <li>4. The agent will respond with voice</li>
            </ul>
          </div>
        </CardContent>
      </Card>
          </div>
        </div>
        
        {/* Log Viewer - Full Width */}
        <LogViewer />
      </div>
    </div>
  );
}
