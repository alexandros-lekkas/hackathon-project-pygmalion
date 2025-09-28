"use client";

import { Column } from "@/components/layout/column";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatContext } from "@/lib/providers/chat-provider";

export default function Chat() {
  const {
    messages,
    input,
    setInput,
    isLoading,
    isClient,
    scrollAreaRef,
    sendMessage,
    handleKeyPress,
  } = useChatContext();

  return (
    <Column isLoading={isLoading}>
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 mb-4">
          <h2 className="text-lg font-semibold">AI Assistant</h2>
          <p className="text-sm text-muted-foreground">
            Chat with your AI assistant
          </p>
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
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
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
