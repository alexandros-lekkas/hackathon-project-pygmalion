import ChatAgent from "@/components/chat-agent";

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">AI Conversational Agent</h1>
          <p className="text-lg text-muted-foreground">
            A simple conversational agent built with OpenAI Agents SDK
          </p>
        </div>
        
        <div className="flex justify-center">
          <ChatAgent />
        </div>
      </div>
    </main>
  );
}
