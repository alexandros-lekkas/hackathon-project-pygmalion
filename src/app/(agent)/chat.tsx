"use client";

import { useState, useRef, useEffect } from "react";
import { Column } from "@/components/layout/column";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Pause } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isAutorun, setIsAutorun] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autorunIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set client state to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Cleanup autorun interval on unmount
  useEffect(() => {
    return () => {
      if (autorunIntervalRef.current) {
        clearInterval(autorunIntervalRef.current);
      }
    };
  }, []);

  // Auto-scroll to bottom when new messages are added with smooth scrolling
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current.querySelector(
          "[data-radix-scroll-area-viewport]"
        );
        if (scrollElement) {
          scrollElement.scrollTo({
            top: scrollElement.scrollHeight,
            behavior: "smooth",
          });
        }
      }
    };

    // Small delay to ensure DOM has updated
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Generate TTS audio for text
  const generateTTS = async (text: string, voiceId?: string): Promise<string | null> => {
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, voiceId }),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.audioUrl;
      } else {
        console.error("TTS generation failed:", data.error);
        return null;
      }
    } catch (error) {
      console.error("Error generating TTS:", error);
      return null;
    }
  };

  // Play audio when assistant messages arrive
  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    audio.onerror = () => {
      console.error("Audio playback failed");
    };
    
    audio.play().catch((error) => {
      console.error("Audio play failed:", error);
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Generate TTS audio for user message (using male voice)
    const userAudioUrl = await generateTTS(userMessage.content, "GBv7mTt0atIp3Br8iCZE");
    if (userAudioUrl) {
      // Update the user message with the audio URL
      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === userMessage.id 
            ? { ...msg, audioUrl: userAudioUrl } 
            : msg
        )
      );
      
      // Play the user's message audio
      playAudio(userAudioUrl);
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Generate TTS audio for the response first (using female voice - default)
      const audioUrl = await generateTTS(data.response);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        audioUrl: audioUrl || undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Play the audio if available
      if (audioUrl) {
        playAudio(audioUrl);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Autorun function that simulates typing and sending a user message
  const generateAutoUserMessage = async () => {
    if (isLoading || isGeneratingPrompt) return;

    // Only generate user messages, let the normal flow handle AI responses
    const lastMessage = messages[messages.length - 1];
    const shouldSendUserMessage = lastMessage?.role === "assistant";

    if (!shouldSendUserMessage) {
      return; // Don't send if last message was already from user
    }

    setIsGeneratingPrompt(true);

    const userPrompts = [
      "Tell me more about that",
      "That's interesting, what else?",
      "I see, can you elaborate?",
      "What do you think about that?",
      "That's cool!",
      "Really? Tell me more",
      "I'm curious about that",
      "What else can you tell me?",
      "That sounds fascinating",
      "I'd love to hear more",
      "Can you give me an example?",
      "How does that work?",
      "Why is that important?",
      "What are the implications?",
      "That's amazing!",
      "I never thought of it that way",
      "What's your take on this?",
      "That makes sense",
      "I'm learning a lot here",
      "This is really helpful"
    ];
    
    const randomPrompt = userPrompts[Math.floor(Math.random() * userPrompts.length)];
    
    // Simulate typing in the input field
    setInput(randomPrompt);
    
    // Wait a moment to simulate typing, then send
    setTimeout(async () => {
      setIsGeneratingPrompt(false);
      await sendMessage();
    }, 1000);
  };

  // Toggle autorun functionality
  const toggleAutorun = () => {
    if (isAutorun) {
      // Stop autorun
      if (autorunIntervalRef.current) {
        clearInterval(autorunIntervalRef.current);
        autorunIntervalRef.current = null;
      }
      setIsAutorun(false);
    } else {
      // Start autorun
      setIsAutorun(true);
      // Generate first message immediately
      generateAutoUserMessage();
      // Then continue every 8-15 seconds
      autorunIntervalRef.current = setInterval(() => {
        generateAutoUserMessage();
      }, Math.random() * 7000 + 8000); // Random interval between 8-15 seconds
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Column isLoading={isLoading}>
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">AI Assistant</h2>
              <p className="text-sm text-muted-foreground">
                {isAutorun ? "Auto-conversation mode" : "Chat with your AI assistant"}
              </p>
            </div>
            <Button
              onClick={toggleAutorun}
              variant={isAutorun ? "destructive" : "default"}
              size="sm"
              className="flex items-center gap-2"
            >
              {isAutorun ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isAutorun ? "Stop" : "Auto"}
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <ScrollArea ref={scrollAreaRef} className="h-full pr-3">
            <div className="space-y-4 p-1">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs opacity-70">
                        {isClient ? message.timestamp.toLocaleTimeString() : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-shrink-0 mt-4">
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isGeneratingPrompt 
                  ? "Generating message..." 
                  : isAutorun 
                    ? "Auto-conversation active..." 
                    : "Type your message..."
              }
              disabled={isLoading || isAutorun}
              className={`flex-1 transition-all duration-300 ${
                isGeneratingPrompt 
                  ? "ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20" 
                  : ""
              }`}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || isAutorun}
              size="sm"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </Column>
  );
}
