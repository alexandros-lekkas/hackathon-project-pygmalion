import { useState, useRef, useEffect, useCallback } from "react";
import { searchMemoriesByRelevance } from "@/lib/memory/search";

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
  type?: "thinking" | "memory" | "extract";
}

export interface UseChatReturn {
  messages: Message[];
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  isClient: boolean;
  scrollAreaRef: React.RefObject<HTMLDivElement | null>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  sendMessage: () => Promise<void>;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  clearContext: () => void;
  deleteMemory: (title: string) => Promise<void>;
  // Memory processing state
  isProcessingMemory: boolean;
  memoryStreamingText: string;
  memorySteps: MemoryStep[]; // History of all memory processing steps
  memories: Array<{ title: string; content: string; importance: number }>;
  // Memory search state
  isSearchingMemories: boolean;
  searchQuery: string;
  searchResults: Array<{ title: string; content: string; importance: number; score?: number }>;
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
  
  // Memory search state
  const [isSearchingMemories, setIsSearchingMemories] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ title: string; content: string; importance: number; score?: number }>>([]);
  
  // Keep track of processed sentences to avoid duplicates
  const processedSentences = useRef(new Set<string>());

  // Set client state to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
    
    // Fetch memories from Supabase when the component mounts
    const fetchMemories = async () => {
      try {
        const response = await fetch('/api/memory/fetch', {
          method: 'GET',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.memories && Array.isArray(data.memories)) {
            setMemories(data.memories);
          }
        }
      } catch (error) {
        console.error('Failed to fetch memories:', error);
      }
    };
    
    fetchMemories();
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
    processedSentences.current.clear(); // Clear processed sentences for new memory processing
    // Don't reset memory steps between messages

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
          
          // We need to capture the thinking process BEFORE the final output
          // First, let's check if this is a thinking/analysis chunk
          const isThinkingChunk = 
            chunk.toLowerCase().includes("analyzing") || 
            chunk.toLowerCase().includes("thinking") || 
            chunk.toLowerCase().includes("looking") || 
            chunk.toLowerCase().includes("examining") ||
            chunk.toLowerCase().includes("checking") ||
            chunk.toLowerCase().includes("considering") ||
            chunk.toLowerCase().includes("processing");
          
          // If this is a thinking chunk, add it immediately as a thinking step
          if (isThinkingChunk && chunk.trim().length > 5) {
            setMemorySteps(prev => [
              ...prev, 
              { 
                text: chunk.trim(), 
                timestamp: new Date(),
                type: "thinking"
              }
            ]);
          }
          
          // Now handle complete thoughts and final outputs
          // We'll look for complete sentences or paragraphs
          const sentences = fullText.match(/[^.!?\n\r]+[.!?\n\r]+/g) || [];
          
          // Process only complete sentences that we haven't seen before
          sentences.forEach(sentence => {
            const trimmed = sentence.trim();
            
            // Skip very short sentences and ones we've already processed
            if (trimmed.length < 15 || processedSentences.current.has(trimmed)) {
              return;
            }
            
            // Check if this is a final output (memory creation/update)
            const isMemoryOutput = 
              trimmed.includes("I've") || 
              trimmed.includes("memory titled") ||
              trimmed.includes("updated the memory") ||
              trimmed.includes("saved a new memory");
              
            // Only add final outputs, not partial sentences
            if (isMemoryOutput) {
              processedSentences.current.add(trimmed);
              
              // Add as a complete memory step
              setMemorySteps(prev => [
                ...prev, 
                { 
                  text: trimmed, 
                  timestamp: new Date(),
                  type: "memory"
                }
              ]);
            }
          });
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

  // Memory context injection

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
      // Start memory search process with visual feedback
      setIsSearchingMemories(true);
      setSearchQuery(userMessage.content);
      setSearchResults([]);
      
      // Simulate a short delay to show the search process
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Find relevant memories to inject as context - now async
      const relevantMemories = await searchMemoriesByRelevance(memories, userMessage.content);
      
      // Store whether memories were found for this query
      const memoriesFound = relevantMemories.length > 0;
      
      // Update search results for display with real or placeholder scores
      setSearchResults(relevantMemories.map(memory => ({
        ...memory,
        // Use the memory's actual score if available, or generate a placeholder
        score: memory.score !== undefined ? memory.score : Math.round(Math.random() * 100)
      })));
      
      // Create context string from relevant memories
      let contextMessage = userMessage.content;
      
      if (memoriesFound) {
        // Map memories to a string with title, content, importance AND score
        const contextString = relevantMemories
          .map(memory => {
            const score = memory.score !== undefined ? memory.score : Math.round(Math.random() * 100);
            return `Memory: ${memory.title}\nContent: ${memory.content}\nImportance: ${memory.importance}/10\nRelevance Score: ${score}/100`;
          })
          .join('\n\n');
          
        // Inject the context before the user's message
        contextMessage = `ADDITIONAL CONTEXT:\n${contextString}\n\nUSER MESSAGE:\n${userMessage.content}`;
        
        // Log the injected context for debugging
        console.log('Injecting memory context:', relevantMemories);
      } else {
        // Explicitly state that no memories were found
        contextMessage = `NO MEMORIES FOUND FOR THIS QUERY.\n\nUSER MESSAGE:\n${userMessage.content}`;
        console.log('No relevant memories found for query:', userMessage.content);
      }
      
      // Keep the search results visible for a moment
      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: contextMessage, // Use the context-enriched message
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
      // Reset memory search state after a delay to keep results visible briefly
      setTimeout(() => {
        setIsSearchingMemories(false);
      }, 2000);
    }
  }, [input, isLoading, messages, generateTTS, playAudio, processMemory]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);
  
  // Clear all context - messages, memory steps, and memories
  const clearContext = useCallback(() => {
    // Reset to just the initial greeting
    setMessages([{
      id: "1",
      role: "assistant",
      content: "Hi",
      timestamp: new Date(),
    }]);
    setMemorySteps([]);
    setMemories([]);
    setMemoryStreamingText("");
    processedSentences.current.clear();
    
    // Clear search state
    setIsSearchingMemories(false);
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  // Delete memory function
  const deleteMemory = useCallback(async (title: string) => {
    try {
      const response = await fetch('/api/memory/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete memory: ${response.statusText}`);
      }
      
      // Update the memories state by removing the deleted memory
      setMemories(prev => prev.filter(memory => memory.title !== title));
    } catch (error) {
      console.error('Failed to delete memory:', error);
    }
  }, []);

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
    clearContext,
    deleteMemory,
    isProcessingMemory,
    memoryStreamingText,
    memorySteps,
    memories,
    isSearchingMemories,
    searchQuery,
    searchResults,
  };
};
