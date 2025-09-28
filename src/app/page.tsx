"use client";

import { useState } from "react";
import VoiceAgentUI from "@/components/voice-agent/VoiceAgentUI";
import ConnectionForm from "@/components/voice-agent/ConnectionForm";
import { LiveKitConfig } from "@/hooks/useLiveKit";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Users, Zap, Brain, MessageSquare } from "lucide-react";

export default function HomePage() {
  const [config, setConfig] = useState<LiveKitConfig | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async (connectionConfig: LiveKitConfig) => {
    setIsConnecting(true);

    try {
      // Generate token from backend
      const response = await fetch("/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomName: connectionConfig.roomName,
          participantName: "User",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate token");
      }

      const { token, url } = await response.json();

      setConfig({
        ...connectionConfig,
        token,
        url,
      });
    } catch (error) {
      console.error("Failed to connect:", error);
      alert("Failed to connect. Please check your configuration.");
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Voice AI Agent
                </h1>
                <p className="text-sm text-gray-600">
                  Real-time voice conversations with AI
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              <Zap className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Talk to Your AI Assistant
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Experience natural voice conversations with our advanced AI agent.
              Ask questions, get help, or just have a friendly chat.
            </p>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="p-6 text-center">
                <Mic className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Voice Input</h3>
                <p className="text-sm text-gray-600">
                  Speak naturally and be understood
                </p>
              </Card>
              <Card className="p-6 text-center">
                <MessageSquare className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Smart Responses</h3>
                <p className="text-sm text-gray-600">
                  Get intelligent, contextual answers
                </p>
              </Card>
              <Card className="p-6 text-center">
                <Users className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Real-time</h3>
                <p className="text-sm text-gray-600">
                  Instant voice-to-voice communication
                </p>
              </Card>
            </div>
          </div>

          {/* Connection Form */}
          <div className="flex justify-center">
            <ConnectionForm
              onConnect={handleConnect}
              isConnecting={isConnecting}
            />
          </div>

          {/* How it Works */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
              How It Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-semibold mb-2">Connect</h4>
                <p className="text-sm text-gray-600">
                  Join a room to start your session
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <h4 className="font-semibold mb-2">Speak</h4>
                <p className="text-sm text-gray-600">
                  Click the mic and start talking
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <h4 className="font-semibold mb-2">Listen</h4>
                <p className="text-sm text-gray-600">
                  Hear the AI's voice response
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <h4 className="font-semibold mb-2">Chat</h4>
                <p className="text-sm text-gray-600">
                  Continue the conversation naturally
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>
              &copy; 2024 Voice AI Agent. Built with LiveKit, OpenAI, and
              ElevenLabs.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
