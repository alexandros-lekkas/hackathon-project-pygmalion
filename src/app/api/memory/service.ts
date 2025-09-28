import { ChatRequest } from "./type";
import { z } from "zod";
import { run } from "@openai/agents";
import { memoryAgent } from "@/lib/memory/agent";

// Request validation schema
const ChatRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional()
    .default([]),
});

export const updateMemories = async (request: ChatRequest): Promise<any> => {
  try {
    const { message, history } = ChatRequestSchema.parse(request);

    console.log("🧠 Processing memory for message:", message);

    const conversationHistory = [
      ...history,
      { role: "user" as const, content: message },
    ];

    const result = await run(memoryAgent, `process_user_message with userMessage: "${message}" and conversationContext: "${conversationHistory.slice(-3).map(h => `${h.role}: ${h.content}`).join('\n')}"`);

    console.log("Memory processing result:", result);

    // Log current memories for visibility
    const { logMemories } = await import("@/lib/memory/supabase-storage");
    await logMemories();

    return result;
  } catch (error) {
    console.error("❌ Memory processing failed:", error);
    return { error: "Memory processing failed", details: error };
  }
}