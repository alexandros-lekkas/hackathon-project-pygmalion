"use client";

import { ChatProvider } from "@/lib/providers/chat-provider";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatProvider>
      <div className="h-screen w-screen bg-sidebar grid grid-cols-1 md:grid-cols-3 gap-5 p-5">
        {children}
      </div>
    </ChatProvider>
  );
}
