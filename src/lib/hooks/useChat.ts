import { useState, useRef, useEffect, useCallback } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export interface MemoryStep {
  text: string;
  timestamp: Date;
}

export interface UseChatReturn {
  messages: Message[];
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  isClient: boolean;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  sendMessage: () => Promise<void>;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  // Memory processing state
  isProcessingMemory: boolean;
  memoryStreamingText: string;
  memorySteps: MemoryStep[]; // History of all memory processing steps
  memories: Array<{ title: string; content: string; importance: number }>;
}

export const useChat = (): UseChatReturn => {
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Memory processing state
  const [isProcessingMemory, setIsProcessingMemory] = useState(false);
  const [memoryStreamingText, setMemoryStreamingText] = useState("");
  const [memorySteps, setMemorySteps] = useState<MemoryStep[]>([]);
  const [memories, setMemories] = useState<Array<{ title: string; content: string; importance: number }>>([]);
  
  // Keep track of processed sentences to avoid duplicates
  const processedSentences = useRef(new Set<string>());

  // Set client state to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
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
  const generateTTS = useCallback(async (text: string, voiceId?: string): Promise<string | null> => {
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
  }, []);

  // Play audio when assistant messages arrive
  const playAudio = useCallback((audioUrl: string) => {
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
  }, []);

  // Process memory with streaming
  const processMemory = useCallback(async (message: string, history: Message[]) => {
    setIsProcessingMemory(true);
    setMemoryStreamingText("");
    setMemorySteps([]);
    processedSentences.current.clear(); // Clear processed sentences for new memory processing

    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Memory API error: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let fullText = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          
          // Update the current streaming text
          setMemoryStreamingText(fullText);
          
          // Instead of processing individual sentences, let's look for complete thoughts
          // We'll detect major topic shifts or complete messages
          
          // Check if we have new paragraphs or complete messages
          if (fullText.includes("I've added a new memory") || 
              fullText.includes("Memory saved") || 
              fullText.includes("Analyzing") ||
              fullText.includes("Extracting")) {
            
            // Split by major sections rather than sentences
            const sections = fullText.split(/(?=I've added|Memory saved|Analyzing|Extracting)/g);
            
            // Process each major section
            sections.forEach(section => {
              const trimmed = section.trim();
              // Only process sections we haven't seen before and that are meaningful
              if (trimmed.length > 15 && !processedSentences.current.has(trimmed)) {
                processedSentences.current.add(trimmed);
                
                // Check if this is a complete thought
                const isComplete = trimmed.endsWith('.') || 
                                  trimmed.endsWith('!') || 
                                  trimmed.endsWith('?') ||
                                  trimmed.length > 50;
                
                if (isComplete) {
                  setMemorySteps(prev => [
                    ...prev, 
                    { 
                      text: trimmed, 
                      timestamp: new Date() 
                    }
                  ]);
                }
              }
            });
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Try to extract memory data from the streaming text
      try {
        const memoryMatch = fullText.match(/\{[\s\S]*"memories"[\s\S]*\}/);
        if (memoryMatch) {
          const memoryData = JSON.parse(memoryMatch[0]);
          if (memoryData.memories && Array.isArray(memoryData.memories)) {
            setMemories(prev => {
              const newMemories = memoryData.memories.filter((newMem: any) => 
                !prev.some(existing => existing.title === newMem.title)
              );
              return [...prev, ...newMemories];
            });
          }
        }
      } catch (parseError) {
        console.log('Could not parse memory data from stream:', parseError);
      }

    } catch (error) {
      console.error('Memory processing failed:', error);
      setMemoryStreamingText(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessingMemory(false);
    }
  }, []);

  const sendMessage = useCallback(async () => {
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

    // Start memory processing immediately (non-blocking)
    processMemory(userMessage.content, messages).catch((error) => {
      console.error("Memory processing failed:", error);
    });
    
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
  }, [input, isLoading, messages, generateTTS, playAudio, processMemory]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  return {
    messages,
    input,
    setInput,
    isLoading,
    isClient,
    scrollAreaRef,
    audioRef,
    sendMessage,
    handleKeyPress,
    isProcessingMemory,
    memoryStreamingText,
    memorySteps,
    memories,
  };
};
