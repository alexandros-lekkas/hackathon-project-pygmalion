"use client";

import { createContext, useContext, ReactNode } from "react";
import { useChat, UseChatReturn } from "@/lib/hooks/useChat";

// Create a context with a default value
const ChatContext = createContext<UseChatReturn | null>(null);

// Provider component
export function ChatProvider({ children }: { children: ReactNode }) {
  const chatState = useChat();
  
  return (
    <ChatContext.Provider value={chatState}>
      {children}
    </ChatContext.Provider>
  );
}

// Hook to use the chat context
export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
