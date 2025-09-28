"use client";

import { useState, useEffect } from "react";
import VoiceAgentUI from "@/components/voice-agent/VoiceAgentUI";
import { LiveKitConfig } from "@/hooks/useLiveKit";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const [config, setConfig] = useState<LiveKitConfig | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasAttemptedConnection, setHasAttemptedConnection] = useState(false);

  // Auto-connect on page load
  useEffect(() => {
    if (!hasAttemptedConnection && !config && !isConnecting) {
      handleAutoConnect();
    }
  }, [hasAttemptedConnection, config, isConnecting]);

  const handleAutoConnect = async () => {
    setIsConnecting(true);
    setHasAttemptedConnection(true);

    try {
      // Generate a unique room name and participant name
      const roomName = `voice-agent-${Date.now()}`;
      const participantName = `User-${Math.random().toString(36).substr(2, 9)}`;

      console.log(`🚀 Auto-connecting to room: ${roomName}`);

      // Generate token from backend
      const response = await fetch("/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomName,
          participantName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate token");
      }

      const { token, url } = await response.json();

      setConfig({
        roomName,
        token,
        url,
      });

      console.log("✅ Auto-connection successful");
    } catch (error) {
      console.error("❌ Auto-connection failed:", error);
      // Show error state instead of form
      setConfig(null);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setConfig(null);
    setHasAttemptedConnection(false);
  };

  if (config) {
    return <VoiceAgentUI config={config} />;
  }

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Connecting to Voice Agent</h2>
            <p className="text-muted-foreground">Setting up your AI assistant...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state - connection failed
  if (hasAttemptedConnection && !config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Connection Failed</h2>
            <p className="text-muted-foreground mb-4">
              Unable to connect to the voice agent. Please check your configuration.
            </p>
            <Button onClick={handleAutoConnect} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // This should never be reached due to auto-connect, but just in case
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="text-blue-500 text-6xl mb-4">🤖</div>
          <h2 className="text-xl font-semibold mb-2">Voice AI Agent</h2>
          <p className="text-muted-foreground mb-4">
            Preparing your AI assistant...
          </p>
          <Button onClick={handleAutoConnect} className="w-full">
            Start Voice Chat
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
